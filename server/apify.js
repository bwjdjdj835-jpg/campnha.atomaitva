// Google Maps via Apify — ator "Google Maps Scraper" (compass/crawler-google-places, id nwua9Gu5YrADL7ZDj).
// https://apify.com/compass/crawler-google-places — a partir de US$ 1,50 por 1.000 lugares; precisa de APIFY_TOKEN.
// Usa a API HTTP "run-sync-get-dataset-items": roda o ator e já devolve os lugares (até ~5 min).

const ATOR = 'nwua9Gu5YrADL7ZDj'
const MAX_LUGARES = 20

export async function buscarApify({ categoria, cidade }) {
  const entrada = {
    searchStringsArray: [categoria],
    locationQuery: `${cidade}, Brasil`,
    maxCrawledPlacesPerSearch: MAX_LUGARES,
    language: 'pt-BR',
    // Todos os lugares: quem tem só Instagram no campo "site" também interessa — o Pinguim separa depois.
    website: 'allPlaces',
    skipClosedPlaces: true,
    scrapePlaceDetailPage: false,
    maxImages: 0,
    maxReviews: 0,
    maxQuestions: 0,
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
  }
}
