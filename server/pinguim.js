// 🐧 Pinguim Azulado — busca comércios sem site.
// Fluxo (prompts/01-pinguim-azulado.md):
//   1. Google Places Text Search com FieldMask (ou OpenStreetMap, grátis, se o Google falhar)
//   2. Descarta quem já tem site cadastrado
//   3. Confirma no Firecrawl que não existe domínio próprio (só para os candidatos)
//   4. Gera wa.me, Instagram (se achou) e nível de confiança

import { waLink } from '../src/lib/whatsapp.js'
import { buscarOsm } from './osm.js'
import { buscarMapsFirecrawl } from './maps.js'
import { buscarSerpApi } from './serpapi.js'
import { buscarApify } from './apify.js'
import { buscarMapsPagina } from './mapsPagina.js'

// Limite de candidatos verificados por busca (cada um custa 2 chamadas no Firecrawl).
const MAX_VERIFICAR = 25

const PLACES_URL = 'https://places.googleapis.com/v1/places:searchText'
const FIRECRAWL_URL = 'https://api.firecrawl.dev/v2/search'

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

async function firecrawlSearch(query) {
  const res = await fetch(FIRECRAWL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({ query, limit: 5, country: 'BR' }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Firecrawl: ${data.error || res.statusText}`)
  return data.data?.web || []
}

// Procura domínio próprio e Instagram do negócio.
async function verificar(nome, cidade) {
  const results = (
    await Promise.all([
      firecrawlSearch(`"${nome}" "${cidade}"`),
      firecrawlSearch(`site:instagram.com "${nome}"`),
    ])
  ).flat()

  const nomeSlug = slug(nome)
  let site = null
  let instagram = null
  for (const r of results) {
    const host = hostOf(r.url)
    if (!host) continue
    if (!instagram && host === 'instagram.com') {
      const handle = new URL(r.url).pathname.split('/').filter(Boolean)[0]
      if (handle && !['p', 'reel', 'explore', 'stories'].includes(handle)) instagram = `https://instagram.com/${handle}`
    }
    // Domínio cujo nome contém o nome do negócio (ou vice-versa) e não é rede/diretório.
    const base = slug(host.split('.')[0])
    if (!site && !isDirectory(host) && base.length >= 4 && (nomeSlug.includes(base) || base.includes(nomeSlug))) {
      site = r.url
    }
  }
  return { site, instagram }
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
  if (!candidatos && process.env.FIRECRAWL_API_KEY) {
    log('info', `Google Maps (via Firecrawl): "${query}"`)
    try {
      candidatos = (await buscarMapsFirecrawl(query)).map((c) => ({ ...c, ...separarSite(c.siteMaps) }))
      fonte = 'Google Maps'
    } catch (e) {
      log('warn', `${e.message} — tentando outra fonte`)
    }
  }
  if (!candidatos && process.env.FIRECRAWL_API_KEY) {
    log('info', `Google Maps (página, via Firecrawl): "${query}"`)
    try {
      candidatos = (await buscarMapsPagina(query, log)).map((c) => ({ ...c, ...separarSite(c.siteMaps) }))
      fonte = 'Google Maps'
    } catch (e) {
      log('warn', `Google Maps (página): ${e.message} — tentando outra fonte`)
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

  // 2. Descarta quem já tem site cadastrado.
  // Mesmo telefone de um lugar que já tem site = mesmo negócio (outra unidade) → também descarta.
  const digitos = (t) => String(t || '').replace(/\D/g, '')
  const fonesComSite = new Set(candidatos.filter((c) => c.site && digitos(c.telefone)).map((c) => digitos(c.telefone)))
  const semSite = candidatos.filter((c) => !c.site && !fonesComSite.has(digitos(c.telefone)))
  const outraUnidade = candidatos.filter((c) => !c.site).length - semSite.length
  log(
    'info',
    `Descartados ${candidatos.length - semSite.length} com site cadastrado${outraUnidade ? ` (${outraUnidade} por ser outra unidade de quem já tem site)` : ''} — ${semSite.length} candidato(s)`,
  )

  // 3. Confirma no Firecrawl que não existe domínio próprio.
  const comFirecrawl = Boolean(process.env.FIRECRAWL_API_KEY)
  if (!comFirecrawl) log('warn', 'FIRECRAWL_API_KEY ausente — sem confirmação de domínio, confiança fica "Médio"')
  else if (semSite.length) log('info', 'Firecrawl: verificando domínio próprio de cada candidato')

  const leads = []
  let firecrawlOk = comFirecrawl
  for (const c of semSite.slice(0, MAX_VERIFICAR)) {
    let verif = { site: null, instagram: null }
    let verificado = false
    if (firecrawlOk) {
      try {
        verif = await verificar(c.nome, cidade)
        verificado = true
      } catch (e) {
        log('warn', `Firecrawl falhou (${e.message}) — seguindo sem confirmação de domínio`)
        firecrawlOk = false
      }
    }
    if (verif.site) {
      log('info', `${c.nome}: domínio encontrado (${hostOf(verif.site)}) — descartado`)
      continue
    }
    const exibicao = c.telefoneExibicao || c.telefone
    leads.push({
      id: c.id,
      demo: false,
      fonte,
      nome: c.nome,
      categoria,
      endereco: c.endereco,
      telefone: exibicao || '—',
      maps: c.maps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.nome} ${c.endereco || cidade}`)}`,
      osm: c.osm || null,
      whatsapp: c.telefone ? waLink(c.telefone) : null,
      instagram: c.instagram || verif.instagram,
      rating: c.rating,
      avaliacoes: c.avaliacoes,
      fotos: c.fotos,
      confianca: verificado ? 'Alto' : 'Médio',
      observacao: [
        `Sem site no ${fonte}`,
        verificado ? 'sem domínio encontrado no Firecrawl' : 'domínio não verificado no Firecrawl',
        c.telefone ? null : 'sem telefone cadastrado',
      ]
        .filter(Boolean)
        .join(' + '),
    })
  }
  if (semSite.length > MAX_VERIFICAR) log('info', `Mostrando os ${MAX_VERIFICAR} primeiros candidatos`)

  log('ok', `${leads.length} lead(s) confirmado(s)`)
  if (leads.length < 3) log('warn', 'Poucos resultados — tente variar a categoria ou buscar uma cidade vizinha')
  return { logs, leads }
}
