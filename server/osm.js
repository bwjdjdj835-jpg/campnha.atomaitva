// Fonte grátis do Pinguim: OpenStreetMap (Nominatim + Overpass). Não precisa de chave.
// Cobertura menor que o Google Maps, mas serve quando a Places API não está disponível.
// Regras de uso: https://operations.osmfoundation.org/policies/nominatim/ (User-Agent e ≤1 req/s).

const UA = 'central-agentes/0.1 (busca de comercios locais)'
const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]
// Cada servidor tem até 20 s; os públicos às vezes travam e respondem 504.
const ESPERA_MS = 20000

const norm = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// Categoria em português → tags do OSM.
const CATEGORIAS = [
  [/barbe|cabelei|salao de cabelo/, ['shop=hairdresser']],
  [/salao de beleza|estetica|manicure|beleza/, ['shop=beauty', 'shop=hairdresser']],
  [/pizza/, ['amenity=restaurant', 'amenity=fast_food']],
  [/restaurante|comida|marmit/, ['amenity=restaurant']],
  [/lanch|hamburg|burger|pastel|espetinho/, ['amenity=fast_food']],
  [/padaria|panific/, ['shop=bakery']],
  [/confeit|doceria|bolo/, ['shop=confectionery', 'shop=pastry', 'shop=bakery']],
  [/pet|veterin/, ['shop=pet', 'amenity=veterinary']],
  [/supermercado|mercado|mercearia/, ['shop=supermarket', 'shop=convenience']],
  [/farmacia|drogaria/, ['amenity=pharmacy']],
  [/academia|crossfit/, ['leisure=fitness_centre']],
  [/oficina|mecanic/, ['shop=car_repair']],
  [/borrachar|pneu/, ['shop=tyres']],
  [/lava ?jato|lava-jato|lavagem/, ['amenity=car_wash']],
  [/acougue/, ['shop=butcher']],
  [/sorvet|acai/, ['amenity=ice_cream']],
  [/cafe|cafeteria/, ['amenity=cafe']],
  [/\bbar\b|boteco|choperia/, ['amenity=bar', 'amenity=pub']],
  [/roupa|moda|boutique/, ['shop=clothes']],
  [/calcad|sapat/, ['shop=shoes']],
  [/dentist|odonto/, ['amenity=dentist']],
  [/clinica/, ['amenity=clinic']],
  [/hotel|pousada/, ['tourism=hotel', 'tourism=guest_house']],
  [/floric|flores/, ['shop=florist']],
  [/otica/, ['shop=optician']],
  [/papelaria/, ['shop=stationery']],
  [/material de constru|construcao/, ['shop=hardware', 'shop=doityourself']],
  [/eletronic|celular/, ['shop=electronics', 'shop=mobile_phone']],
  [/moveis|movel/, ['shop=furniture']],
]

export function tagsDaCategoria(categoria) {
  const c = norm(categoria)
  return [...new Set(CATEGORIAS.filter(([re]) => re.test(c)).flatMap(([, tags]) => tags))]
}

async function areaDaCidade(cidade) {
  const url = `${NOMINATIM}?${new URLSearchParams({ q: `${cidade}, Brasil`, format: 'json', limit: '5', addressdetails: '0' })}`
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR' },
    signal: AbortSignal.timeout(ESPERA_MS),
  })
  if (!res.ok) throw new Error(`OpenStreetMap (Nominatim): ${res.status}`)
  const lugares = await res.json()
  const rel = lugares.find((l) => l.osm_type === 'relation')
  if (!rel) throw new Error(`Cidade "${cidade}" não encontrada no OpenStreetMap`)
  return { areaId: 3600000000 + Number(rel.osm_id), nome: rel.display_name }
}

// "açougue" → "[aáàâã][cç]..." para casar nomes com ou sem acento no Overpass.
const ACENTOS = { a: '[aáàâã]', e: '[eéê]', i: '[ií]', o: '[oóôõ]', u: '[uúü]', c: '[cç]' }
function regexSemAcento(texto) {
  return norm(texto)
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/[aeiouc]/g, (ch) => ACENTOS[ch])
}

export function montarQuery(areaId, categoria) {
  const tags = tagsDaCategoria(categoria)
  const nomeRe = regexSemAcento(categoria)
  const linhas = tags.map((t) => {
    const [k, v] = t.split('=')
    return `  nwr["${k}"="${v}"](area.a);`
  })
  // Procurar pelo nome (regex) numa cidade inteira é pesado e derruba o Overpass com 504;
  // só usa quando a categoria não tem tag conhecida.
  if (!tags.length) {
    linhas.push(`  nwr["name"~"${nomeRe}",i]["shop"](area.a);`)
    linhas.push(`  nwr["name"~"${nomeRe}",i]["amenity"](area.a);`)
    linhas.push(`  nwr["name"~"${nomeRe}",i]["craft"](area.a);`)
  }
  return `[out:json][timeout:25];
area(id:${areaId})->.a;
(
${linhas.join('\n')}
);
out center tags 150;`
}

async function overpass(query) {
  const erros = []
  for (const url of OVERPASS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(ESPERA_MS),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      // Servidor ocupado às vezes responde 200 com HTML de erro.
      const data = await res.json().catch(() => null)
      if (!data) throw new Error('resposta inválida (servidor ocupado)')
      return data.elements || []
    } catch (e) {
      erros.push(`${new URL(url).hostname} ${e.name === 'TimeoutError' ? 'demorou demais' : e.message}`)
    }
  }
  throw new Error(`OpenStreetMap (Overpass) indisponível: ${erros.join(', ')}`)
}

const endereco = (t) =>
  [
    [t['addr:street'], t['addr:housenumber']].filter(Boolean).join(', '),
    t['addr:suburb'],
    [t['addr:city'], t['addr:state']].filter(Boolean).join(' - '),
  ]
    .filter(Boolean)
    .join(' - ')

const instagramDe = (t) => {
  const v = t['contact:instagram'] || t.instagram
  if (!v) return null
  if (/^https?:\/\//.test(v)) return v
  return `https://instagram.com/${v.replace(/^@/, '')}`
}

// Converte um elemento do OSM para o formato comum de candidato do Pinguim.
export function candidatoDoOsm(el, cidade) {
  const t = el.tags || {}
  const lat = el.lat ?? el.center?.lat
  const lon = el.lon ?? el.center?.lon
  const nome = t.name || t.brand
  const end = endereco(t) || cidade
  return {
    id: `osm-${el.type}-${el.id}`,
    nome,
    endereco: end,
    telefone: t['contact:whatsapp'] || t['contact:phone'] || t.phone || t['contact:mobile'] || null,
    site: t.website || t['contact:website'] || t.url || null,
    instagram: instagramDe(t),
    maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      lat != null ? `${nome} ${lat},${lon}` : `${nome} ${end}`,
    )}`,
    osm: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    rating: null,
    avaliacoes: 0,
    fotos: [],
  }
}

export async function buscarOsm({ categoria, cidade }, log) {
  log('info', `OpenStreetMap: localizando "${cidade}"`)
  const { areaId, nome } = await areaDaCidade(cidade)
  log('info', `Área: ${nome}`)
  const tags = tagsDaCategoria(categoria)
  log('info', `Overpass: ${tags.length ? tags.join(', ') : `nome contendo "${categoria}"`}`)
  const elementos = await overpass(montarQuery(areaId, categoria))
  const vistos = new Set()
  return elementos
    .filter((el) => el.tags?.name || el.tags?.brand)
    .map((el) => candidatoDoOsm(el, cidade))
    .filter((c) => (vistos.has(c.id) ? false : vistos.add(c.id)))
}
