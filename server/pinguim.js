// 🐧 Pinguim Azulado — busca comércios sem site.
// Fluxo (prompts/01-pinguim-azulado.md):
//   1. Google Places Text Search com FieldMask (ou OpenStreetMap, grátis, se o Google falhar)
//   2. Descarta quem já tem site cadastrado
//   3. Gera wa.me e devolve os leads com o site "pendente": a conferência no Firecrawl (domínio + telefone,
//      conferirSite) roda depois, um negócio por vez, em /api/pinguim/conferir — no ritmo do plano grátis.

import { waLink } from '../src/lib/whatsapp.js'
import { buscarOsm } from './osm.js'
import { buscarMapsFirecrawl } from './maps.js'
import { buscarSerpApi } from './serpapi.js'
import { buscarApify } from './apify.js'
import { buscarMapsPagina } from './mapsPagina.js'
import { buscarNaWeb, temBuscaExtra } from './buscaWeb.js'
import { creditosFirecrawl, semCredito, erroDeCredito, avisoSemCredito } from './firecrawlCreditos.js'

const MAX_VERIFICAR = 25 // leads mostrados por busca

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText'

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.websiteUri',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.googleMapsUri',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.photos',
].join(',')

// Domínios que não contam como "site próprio".
const NOT_OWN_SITE = [
  'instagram.com', 'facebook.com', 'fb.com', 'tiktok.com', 'twitter.com', 'x.com', 'youtube.com',
  'linkedin.com', 'wa.me', 'whatsapp.com', 'google.com', 'goo.gl', 'g.page', 'maps.app.goo.gl',
  'ifood.com.br', 'tripadvisor.com', 'tripadvisor.com.br', 'yelp.com', 'guiamais.com.br',
  'apontador.com.br', 'telelistas.net', 'solutudo.com.br', 'cybo.com', 'econodata.com.br',
  'cnpj.biz', 'casadosdados.com.br', 'linktr.ee', 'booksy.com', 'trinks.com', 'waze.com',
  'foursquare.com', 'kekanto.com.br', 'restaurantguru.com', 'wikipedia.org',
  // Agregadores de link e páginas de diretório que aparecem no campo "site" do Maps
  'negocio.site', 'business.site', 'lojalocal.com', 'meuairgo.com.br', 'keepo.io', 'beacons.ai', 'bio.link',
  'heyeats.shop', 'anota.ai', 'cardapio.ai', 'goomer.app', 'menudino.com', 'agendor.com.br', 'avec.app',
  // Agendamento online (não é site próprio)
  'appbarber.com.br', 'agendaedu.com', 'simplesagenda.com.br', 'agendapro.com', 'calendly.com',
]

const slug = (s) =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

const isDirectory = (host) => NOT_OWN_SITE.some((d) => host === d || host.endsWith('.' + d))

async function placesSearch(textQuery) {
  const res = await fetch(PLACES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({ textQuery, languageCode: 'pt-BR', regionCode: 'BR', pageSize: 20 }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Google Places: ${data.error?.message || res.statusText}`)
  return data.places || []
}

const digitos = (t) => String(t || '').replace(/\D/g, '')

// Telefone no formato que aparece nos sites: "(69) 99282-0330".
function foneNacional(telefone) {
  let d = digitos(telefone)
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return null
}

// O negócio tem site? Procura no Firecrawl:
//   1. pelo nome + cidade: domínio cujo nome bate com o do negócio = TEM site;
//   2. pelo telefone: outro site (que não seja rede social nem diretório) com o mesmo número = POSSÍVEL site.
// Veredito: 'tem' | 'provavel' | 'nao'. Cada achado volta com o link (evidência) para o usuário conferir.
export async function conferirSite({ nome, cidade, telefone }) {
  const nomeSlug = slug(nome)
  const fone = foneNacional(telefone)
  const final8 = digitos(telefone).slice(-8)
  let pedidos = 0
  let site = null
  let instagram = null
  const evidencias = []

  const olhar = (resultados, tipo) => {
    for (const r of resultados) {
      const host = hostOf(r.url)
      if (!host) continue
      if (!instagram && host === 'instagram.com') {
        const handle = new URL(r.url).pathname.split('/').filter(Boolean)[0]
        if (handle && !['p', 'reel', 'explore', 'stories'].includes(handle)) instagram = `https://instagram.com/${handle}`
      }
      if (isDirectory(host)) continue
      const base = slug(host.split('.')[0])
      const nomeBate = base.length >= 4 && (nomeSlug.includes(base) || base.includes(nomeSlug))
      const texto = digitos(`${r.title || ''} ${r.description || ''}`)
      const foneBate = final8.length === 8 && texto.includes(final8)
      if (nomeBate && !site) {
        site = r.url
        evidencias.push({ tipo: 'dominio', url: r.url })
      } else if (tipo === 'telefone' || foneBate) {
        if (!evidencias.some((e) => hostOf(e.url) === host)) evidencias.push({ tipo: 'telefone', url: r.url })
      }
    }
  }

  // Fila de buscadores (Firecrawl → Tavily → Exa → Serper → Brave): sem crédito em um, o próximo confere.
  const fontes = new Set()
  const buscar = async (q) => {
    const { resultados, fonte } = await buscarNaWeb(q)
    fontes.add(fonte)
    return resultados
  }
  pedidos++
  olhar(await buscar(`"${nome}" ${cidade || ''}`.trim()), 'nome')
  if (!site && fone) {
    pedidos++
    olhar(await buscar(`"${fone}"`), 'telefone')
  }
  const veredito = site ? 'tem' : evidencias.length ? 'provavel' : 'nao'
  return { veredito, site: site || evidencias[0]?.url || null, instagram, evidencias: evidencias.slice(0, 3), pedidos, fonte: [...fontes].join(' + ') }
}

// Google Places → formato comum de candidato.
async function buscarGoogle(query) {
  const places = await placesSearch(query)
  return places.map((p) => ({
    id: p.id,
    nome: p.displayName?.text || 'Sem nome',
    endereco: p.formattedAddress || '',
    telefone: p.internationalPhoneNumber || p.nationalPhoneNumber || null,
    telefoneExibicao: p.nationalPhoneNumber || p.internationalPhoneNumber || null,
    site: p.websiteUri?.trim() || null,
    instagram: null,
    maps: p.googleMapsUri || null,
    rating: p.rating ?? null,
    avaliacoes: p.userRatingCount ?? 0,
    fotos: (p.photos || []).slice(0, 6).map((f) => f.name),
  }))
}

// O "site" do Maps às vezes é só Instagram, WhatsApp ou um agregador de links: isso não conta como site próprio.
function separarSite(url) {
  if (!url) return { site: null, instagram: null }
  const host = hostOf(url)
  if (!host) return { site: null, instagram: null }
  if (host === 'instagram.com') {
    const handle = new URL(url).pathname.split('/').filter(Boolean)[0]
    return { site: null, instagram: handle ? `https://instagram.com/${handle}` : null }
  }
  return isDirectory(host) ? { site: null, instagram: null } : { site: url, instagram: null }
}

export async function buscarNegocios({ categoria, cidade }) {
  const logs = []
  const log = (level, msg) => logs.push({ level, msg })
  const query = `${categoria} em ${cidade}`

  // 1. Fonte, nessa ordem: Apify → SerpApi → Firecrawl Maps (catálogo) → página do Maps lida pelo Firecrawl
  //    (funciona em qualquer plano) → Google Places → OpenStreetMap.
  let candidatos = null
  let fonte = 'OpenStreetMap'
  const creditos = await creditosFirecrawl()
  let firecrawlOk = Boolean(process.env.FIRECRAWL_API_KEY) && !semCredito(creditos)
  if (semCredito(creditos)) log('warn', avisoSemCredito(creditos))
  else if (creditos) log('info', `Firecrawl: ${creditos.restantes} crédito(s) restantes`)
  const falhouFirecrawl = (e) => {
    if (!erroDeCredito(e.message)) return false
    if (firecrawlOk) log('warn', avisoSemCredito(creditos))
    firecrawlOk = false
    return true
  }
  if (process.env.APIFY_TOKEN) {
    log('info', `Google Maps (via Apify): "${query}" — pode levar 1 a 2 minutos`)
    try {
      candidatos = (await buscarApify({ categoria, cidade })).map((c) => ({ ...c, ...separarSite(c.siteMaps) }))
      fonte = 'Google Maps'
    } catch (e) {
      log('warn', `${e.message} — tentando outra fonte`)
    }
  }
  if (!candidatos && process.env.SERPAPI_KEY) {
    log('info', `Google Maps (via SerpApi): "${query}"`)
    try {
      candidatos = (await buscarSerpApi(query)).map((c) => ({ ...c, ...separarSite(c.siteMaps) }))
      fonte = 'Google Maps'
    } catch (e) {
      log('warn', `${e.message} — tentando outra fonte`)
    }
  }
  if (!candidatos && firecrawlOk) {
    log('info', `Google Maps (via Firecrawl): "${query}"`)
    try {
      candidatos = (await buscarMapsFirecrawl(query)).map((c) => ({ ...c, ...separarSite(c.siteMaps) }))
      fonte = 'Google Maps'
    } catch (e) {
      if (!falhouFirecrawl(e)) log('warn', `${e.message} — tentando outra fonte`)
    }
  }
  if (!candidatos && firecrawlOk) {
    log('info', `Google Maps (página, via Firecrawl): "${query}"`)
    try {
      candidatos = (await buscarMapsPagina(query, log)).map((c) => ({ ...c, ...separarSite(c.siteMaps) }))
      fonte = 'Google Maps'
    } catch (e) {
      if (!falhouFirecrawl(e)) log('warn', `Google Maps (página): ${e.message} — tentando outra fonte`)
    }
  }
  if (!candidatos && process.env.GOOGLE_PLACES_API_KEY) {
    log('info', `Google Places: textSearch "${query}"`)
    try {
      candidatos = await buscarGoogle(query)
      fonte = 'Google Places'
    } catch (e) {
      log('warn', `${e.message} — usando OpenStreetMap (grátis)`)
    }
  }
  if (!candidatos) {
    try {
      candidatos = await buscarOsm({ categoria, cidade }, log)
    } catch (e) {
      const falhas = logs.filter((l) => l.level === 'warn').map((l) => l.msg.replace(/ — tentando outra fonte$/, ''))
      throw new Error(
        `Nenhuma fonte de busca respondeu. ${falhas.length ? `Motivos: ${falhas.join(' | ')} | ` : ''}OpenStreetMap: ${e.message}`,
      )
    }
  }
  log('ok', `${fonte}: ${candidatos.length} resultado(s)`)

  // 2. Separa quem já tem site cadastrado no Maps (mostrado na lista "Já têm site").
  // Mesmo telefone de um lugar que já tem site = mesmo negócio (outra unidade) → também tem site.
  const fonesComSite = new Map(candidatos.filter((c) => c.site && digitos(c.telefone)).map((c) => [digitos(c.telefone), c.site]))
  const comSite = []
  const semSite = []
  for (const c of candidatos) {
    const siteOutraUnidade = !c.site && fonesComSite.get(digitos(c.telefone))
    if (c.site || siteOutraUnidade) {
      comSite.push({
        id: c.id,
        nome: c.nome,
        endereco: c.endereco,
        telefone: c.telefoneExibicao || c.telefone || '—',
        site: c.site || siteOutraUnidade,
        motivo: c.site ? `site cadastrado no ${fonte}` : 'outra unidade de quem já tem site (mesmo telefone)',
        maps: c.maps || null,
      })
    } else semSite.push(c)
  }
  log('info', `${comSite.length} já têm site no ${fonte} — ${semSite.length} sem site cadastrado`)

  // 3. A conferência no Firecrawl (domínio e telefone em outros sites) roda depois, na lista de leads.
  // Dá para conferir com o Firecrawl ou com outro buscador (Tavily, Exa, Serper, Brave).
  const comFirecrawl = firecrawlOk || temBuscaExtra()
  if (!process.env.FIRECRAWL_API_KEY) log('warn', 'FIRECRAWL_API_KEY ausente — não dá para conferir se têm site em outro lugar; confiança fica "Médio"')
  else if (semSite.length) log('info', 'Agora o Firecrawl confere cada um (domínio e telefone em outros sites) — acompanhe na lista abaixo')

  const leads = semSite.slice(0, MAX_VERIFICAR).map((c) => {
    const exibicao = c.telefoneExibicao || c.telefone
    return {
      id: c.id,
      demo: false,
      fonte,
      nome: c.nome,
      categoria,
      cidade,
      endereco: c.endereco,
      telefone: exibicao || '—',
      maps: c.maps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.nome} ${c.endereco || cidade}`)}`,
      osm: c.osm || null,
      whatsapp: c.telefone ? waLink(c.telefone) : null,
      instagram: c.instagram || null,
      rating: c.rating,
      avaliacoes: c.avaliacoes,
      fotos: c.fotos,
      horarios: c.horarios || null,
      geo: c.geo || null,
      confianca: 'Médio',
      conferencia: { status: comFirecrawl ? 'pendente' : 'sem_firecrawl' },
      observacao: [`Sem site no ${fonte}`, c.telefone ? null : 'sem telefone cadastrado'].filter(Boolean).join(' + '),
    }
  })
  if (semSite.length > MAX_VERIFICAR) log('info', `Mostrando os ${MAX_VERIFICAR} primeiros candidatos`)

  log('ok', `${leads.length} negócio(s) sem site no ${fonte}`)
  if (leads.length < 3) log('warn', 'Poucos resultados — tente variar a categoria ou buscar uma cidade vizinha')
  return { logs, leads, comSite, semCreditoFirecrawl: Boolean(process.env.FIRECRAWL_API_KEY) && !firecrawlOk }
}
