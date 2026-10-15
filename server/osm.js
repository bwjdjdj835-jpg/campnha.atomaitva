// Fonte grátis do Pinguim: OpenStreetMap (Nominatim + Overpass). Não precisa de chave.
// Cobertura menor que o Google Maps, mas serve quando a Places API não está disponível.
// Regras de uso: https://operations.osmfoundation.org/policies/nominatim/ (User-Agent e ≤1 req/s).

// O Nominatim bloqueia pedidos sem User-Agent identificado (nome do app + contato).
const UA = 'CentralDeAgentes/1.0 (+https://campnha-atomaitva.vercel.app; busca de comercios locais)'
const CABECALHOS = { 'User-Agent': UA, 'Accept-Language': 'pt-BR', Referer: 'https://campnha-atomaitva.vercel.app' }
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

// "Cacoal - RO", "Cacoal, Rondônia, Brasil", "Cacoal RO" → { cidade: 'Cacoal', estado: 'Rondônia' }.
const UFS = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal',
  ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
}
export function partesDaCidade(texto) {
  const partes = String(texto || '')
    .split(/\s*,\s*|\s+[-–]\s+|\s*\/\s*/) // " - " com espaços: "Ji-Paraná" continua inteiro
    .map((p) => p.trim())
    .filter((p) => p && !/^(brasil|brazil|br)$/i.test(p))
  let cidade = partes[0] || ''
  let estado = null
  for (const p of partes.slice(1)) {
    const uf = UFS[p.toUpperCase()]
    const nome = Object.values(UFS).find((n) => norm(n) === norm(p))
    if (uf || nome) estado = uf || nome
  }
  // "Cacoal RO" / "Cacoal-RO": a UF no fim.
  const m = !estado && cidade.match(/^(.*[^\s-])[\s-]+([A-Za-z]{2})$/)
  if (m && UFS[m[2].toUpperCase()]) {
    cidade = m[1]
    estado = UFS[m[2].toUpperCase()]
  }
  return { cidade, estado }
}

// Nominatim: no máximo 1 pedido por segundo (regra de uso).
let ultimoPedido = 0
async function nominatim(params) {
  const espera = ultimoPedido + 1100 - Date.now()
  if (espera > 0) await new Promise((r) => setTimeout(r, espera))
  ultimoPedido = Date.now()
  const url = `${NOMINATIM}?${new URLSearchParams({ format: 'jsonv2', ...params })}`
  const res = await fetch(url, { headers: CABECALHOS, signal: AbortSignal.timeout(ESPERA_MS) })
  if (!res.ok) throw new Error(`OpenStreetMap (Nominatim): ${res.status}`)
  return res.json()
}

// Cidade por busca ESTRUTURADA (city/state/country) — texto livre como "Cacoal - RO, Brasil" volta vazio.
async function areaDaCidade(texto) {
  const { cidade, estado } = partesDaCidade(texto)
  if (!cidade) throw new Error('Informe a cidade (ex.: Cacoal - RO)')
  const tentativas = [
    estado && { city: cidade, state: estado, country: 'Brasil', countrycodes: 'br' },
    { city: cidade, country: 'Brasil', countrycodes: 'br' },
    { q: cidade, countrycodes: 'br' },
  ].filter(Boolean)
  for (const t of tentativas) {
    const lugares = await nominatim({ ...t, limit: '5' })
    const rel = lugares.find((l) => l.osm_type === 'relation' && l.category === 'boundary') || lugares.find((l) => l.osm_type === 'relation')
    const lugar = rel || lugares[0]
    if (!lugar) continue
    const bb = (lugar.boundingbox || []).map(Number) // [sul, norte, oeste, leste]
    return {
      areaId: rel ? 3600000000 + Number(rel.osm_id) : null,
      centro: { lat: Number(lugar.lat), lon: Number(lugar.lon) },
      caixa: bb.length === 4 ? { sul: bb[0], norte: bb[1], oeste: bb[2], leste: bb[3] } : null,
      nome: lugar.display_name,
      cidade,
      estado,
    }
  }
  throw new Error(`Cidade "${texto}" não encontrada no OpenStreetMap`)
}

// "açougue" → "[aáàâã][cç]..." para casar nomes com ou sem acento no Overpass.
const ACENTOS = { a: '[aáàâã]', e: '[eéê]', i: '[ií]', o: '[oóôõ]', u: '[uúü]', c: '[cç]' }
function regexSemAcento(texto) {
  return norm(texto)
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/[aeiouc]/g, (ch) => ACENTOS[ch])
}

// Filtro de área do Overpass: a cidade (relação) ou, se não tiver, 8 km em volta do centro.
const filtroArea = (lugar) => (lugar.areaId ? '(area.a)' : `(around:8000,${lugar.centro.lat},${lugar.centro.lon})`)

export function montarQuery(lugarOuAreaId, categoria) {
  const lugar = typeof lugarOuAreaId === 'object' ? lugarOuAreaId : { areaId: lugarOuAreaId }
  const area = filtroArea(lugar)
  const tags = tagsDaCategoria(categoria)
  const nomeRe = regexSemAcento(categoria)
  const linhas = tags.map((t) => {
    const [k, v] = t.split('=')
    return `  nwr["${k}"="${v}"]${area};`
  })
  // Procurar pelo nome (regex) numa cidade inteira é pesado e derruba o Overpass com 504;
  // só usa quando a categoria não tem tag conhecida.
  if (!tags.length) {
    linhas.push(`  nwr["name"~"${nomeRe}",i]["shop"]${area};`)
    linhas.push(`  nwr["name"~"${nomeRe}",i]["amenity"]${area};`)
    linhas.push(`  nwr["name"~"${nomeRe}",i]["craft"]${area};`)
  }
  return `[out:json][timeout:25];
${lugar.areaId ? `area(id:${lugar.areaId})->.a;` : ''}
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
        headers: { ...CABECALHOS, 'Content-Type': 'application/x-www-form-urlencoded' },
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

// Reserva do Overpass: Nominatim por TIPO de comércio (nunca o nome do nicho na query, que volta vazio):
//   amenity=… estruturado (city/state/country) + "[tipo]" dentro da caixa da cidade (bounded).
async function poisNominatim(lugar, tags) {
  const achados = []
  for (const t of tags) {
    const [k, v] = t.split('=')
    const pedidos = []
    if (k === 'amenity') pedidos.push({ amenity: v, city: lugar.cidade, ...(lugar.estado ? { state: lugar.estado } : {}), country: 'Brasil' })
    if (lugar.caixa) {
      const { oeste, sul, leste, norte } = lugar.caixa
      pedidos.push({ q: `[${v}]`, viewbox: `${oeste},${sul},${leste},${norte}`, bounded: '1' })
    }
    for (const p of pedidos) {
      try {
        achados.push(...(await nominatim({ ...p, extratags: '1', addressdetails: '1', limit: '50' })))
      } catch {
        /* segue com o que tiver */
      }
    }
  }
  return achados
    .filter((r) => r.category === tags.find((t) => t.endsWith(`=${r.type}`))?.split('=')[0] && r.name)
    .map((r) => ({
      type: r.osm_type,
      id: r.osm_id,
      lat: Number(r.lat),
      lon: Number(r.lon),
      tags: {
        name: r.name,
        ...(r.extratags || {}),
        'addr:street': r.address?.road,
        'addr:housenumber': r.address?.house_number,
        'addr:suburb': r.address?.suburb,
        'addr:city': r.address?.city || r.address?.town || lugar.cidade,
        'addr:state': r.address?.state,
      },
    }))
}

export async function buscarOsm({ categoria, cidade }, log) {
  log('info', `OpenStreetMap: localizando "${cidade}" (busca estruturada)`)
  const lugar = await areaDaCidade(cidade)
  log('info', `Área: ${lugar.nome}`)
  const tags = tagsDaCategoria(categoria)
  log('info', `Overpass: ${tags.length ? tags.join(', ') : `nome contendo "${categoria}"`}`)
  let elementos = []
  try {
    elementos = await overpass(montarQuery(lugar, categoria))
  } catch (e) {
    if (!tags.length) throw e
    log('warn', `${e.message} — tentando o Nominatim por tipo de comércio`)
  }
  if (!elementos.length && tags.length) {
    elementos = await poisNominatim(lugar, tags)
    log('info', `Nominatim (por tipo: ${tags.join(', ')}): ${elementos.length} resultado(s)`)
  }
  const vistos = new Set()
  return elementos
    .filter((el) => el.tags?.name || el.tags?.brand)
    .map((el) => candidatoDoOsm(el, cidade))
    .filter((c) => (vistos.has(c.id) ? false : vistos.add(c.id)))
}
