import { lerHorarios } from '../src/lib/horarios.js'
// Google Maps via Apify — ator "Google Maps Scraper" (compass/crawler-google-places, id nwua9Gu5YrADL7ZDj).
// https://apify.com/compass/crawler-google-places — a partir de US$ 1,50 por 1.000 lugares; precisa de APIFY_TOKEN.
// Usa a API HTTP "run-sync-get-dataset-items": roda o ator e já devolve os lugares (até ~5 min).

import { partesDaCidade } from './osm.js'

const ATOR = 'nwua9Gu5YrADL7ZDj'
const MAX_LUGARES = 30

export async function buscarApify({ categoria, cidade }) {
  // "Cacoal - RO" → "Cacoal, Rondônia, Brasil" (o Maps acha a cidade certa, não uma homônima).
  const lugar = partesDaCidade(cidade)
  const entrada = {
    searchStringsArray: [categoria],
    locationQuery: [lugar.cidade || cidade, lugar.estado, 'Brasil'].filter(Boolean).join(', '),
    countryCode: 'br',
    maxCrawledPlacesPerSearch: MAX_LUGARES,
    language: 'pt-BR',
    // Todos os lugares: quem tem só Instagram no campo "site" também interessa — o Pinguim separa depois.
    website: 'allPlaces',
    skipClosedPlaces: true,
    scrapePlaceDetailPage: false,
    maxImages: 0,
    maxReviews: 0,
    maxQuestions: 0,
    scrapeContacts: false,
    includeWebResults: false,
    scrapeDirectories: false,
  }
  const res = await fetch(`https://api.apify.com/v2/acts/${ATOR}/run-sync-get-dataset-items?timeout=240`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.APIFY_TOKEN}` },
    body: JSON.stringify(entrada),
  })
  const dados = await res.json().catch(() => null)
  if (!res.ok || !Array.isArray(dados)) {
    const msg = dados?.error?.message || res.statusText
    if (res.status === 401) throw new Error('Apify: token inválido (confira APIFY_TOKEN)')
    if (res.status === 402) throw new Error('Apify: sem crédito na conta')
    if (res.status === 408) throw new Error('Apify: a busca demorou demais — tente de novo')
    throw new Error(`Apify: ${msg}`)
  }
  return dados.filter((p) => p.title && !p.permanentlyClosed).map(candidatoDoApify)
}

const fotoGrande = (url) => url.replace(/=w\d+-h\d+[^/?]*$/, '=w1200-h900-k-no')

export function candidatoDoApify(p) {
  return {
    id: p.placeId || p.fid || p.cid || p.url,
    nome: p.title,
    endereco: p.address || [p.street, p.neighborhood, p.city, p.state].filter(Boolean).join(', '),
    telefone: p.phoneUnformatted || p.phone || null,
    telefoneExibicao: p.phone || p.phoneUnformatted || null,
    siteMaps: p.website || null, // separado depois em site próprio × Instagram/agregador
    maps: p.url || null,
    rating: p.totalScore ?? null,
    avaliacoes: p.reviewsCount ?? 0,
    categorias: p.categories || (p.categoryName ? [p.categoryName] : []),
    fotos: p.imageUrl ? [fotoGrande(p.imageUrl)] : [],
    horarios: lerHorarios(p.openingHours), // 🕘 "Aberto agora" no site do cliente
    geo: p.location?.lat != null ? { lat: p.location.lat, lng: p.location.lng } : null,
  }
}

// Um lugar só, pelo link do Google Maps (inclusive maps.app.goo.gl): dados + até 12 fotos do lugar.
// Usado pelo Leão quando a ficha veio com 1 foto só (a busca do Pinguim pede maxImages: 0 para sair barata)
// e quando o Firecrawl está sem crédito para ler a página do Maps.
const MAX_FOTOS_LUGAR = 12

async function linkCompleto(url) {
  const u = new URL(url)
  if (!/(^|\.)goo\.gl$|^g\.page$/.test(u.hostname)) return url
  // Link curto: segue o redirecionamento até o endereço completo do Maps.
  const r = await fetch(url, { redirect: 'manual' }).catch(() => null)
  const destino = r?.headers.get('location')
  return destino ? new URL(destino, url).href : url
}

export function linkDoMaps(url) {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && (/(^|\.)google\.[a-z.]+$/.test(u.hostname) ? u.hostname.startsWith('maps.') || u.pathname.startsWith('/maps') : /^(maps\.app\.goo\.gl|goo\.gl|g\.page)$/.test(u.hostname))
  } catch {
    return false
  }
}

export async function lugarDoApify(url) {
  const entrada = {
    startUrls: [{ url: await linkCompleto(url) }],
    language: 'pt-BR',
    maxCrawledPlacesPerSearch: 1,
    maxImages: MAX_FOTOS_LUGAR,
    scrapeImageAuthors: false,
    maxReviews: 0,
    maxQuestions: 0,
    scrapeContacts: false,
    includeWebResults: false,
    scrapeDirectories: false,
  }
  const res = await fetch(`https://api.apify.com/v2/acts/${ATOR}/run-sync-get-dataset-items?timeout=240`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.APIFY_TOKEN}` },
    body: JSON.stringify(entrada),
  })
  const dados = await res.json().catch(() => null)
  if (!res.ok || !Array.isArray(dados)) {
    if (res.status === 401) throw new Error('Apify: token inválido (confira APIFY_TOKEN)')
    if (res.status === 402) throw new Error('Apify: sem crédito na conta')
    throw new Error(`Apify: ${dados?.error?.message || res.statusText}`)
  }
  const p = dados.find((x) => x.title)
  if (!p) return null
  const vistas = new Set()
  const fotos = [p.imageUrl, ...(p.imageUrls || []), ...(p.images || []).map((i) => i?.imageUrl)]
    .filter((f) => typeof f === 'string' && /^https:\/\/[^/]*googleusercontent\.com\//.test(f))
    .map(fotoGrande)
    .filter((f) => {
      const base = f.replace(/=[^/=]*$/, '')
      return !vistas.has(base) && vistas.add(base)
    })
    .slice(0, MAX_FOTOS_LUGAR)
  return { ...candidatoDoApify(p), fotos }
}
