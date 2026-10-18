import { lerHorarios } from '../src/lib/horarios.js'
// Google Maps via SerpApi (https://serpapi.com/google-maps-api) — API de terceiros dedicada ao Maps.
// Plano grátis: 250 buscas/mês. Cada busca devolve até 20 lugares com telefone, site, nota e foto.

export async function buscarSerpApi(query) {
  const params = new URLSearchParams({
    engine: 'google_maps',
    type: 'search',
    q: query,
    hl: 'pt-br',
    google_domain: 'google.com.br',
    api_key: process.env.SERPAPI_KEY,
  })
  const res = await fetch(`https://serpapi.com/search.json?${params}`)
  const json = await res.json().catch(() => ({}))
  if (json.error) {
    // Busca sem resultado não é erro: só não achou nada.
    if (/hasn't returned any results/i.test(json.error)) return []
    throw new Error(`Google Maps (SerpApi): ${json.error}`)
  }
  if (!res.ok) throw new Error(`Google Maps (SerpApi): ${res.statusText}`)
  const lugares = json.local_results || (json.place_results ? [json.place_results] : [])
  return lugares.map(candidatoDaSerpApi)
}

// Links do googleusercontent terminam com o tamanho (ex.: "=w80-h106-k-no"); pede uma versão maior.
const fotoGrande = (url) => url.replace(/=w\d+-h\d+[^/?]*$/, '=w1200-h900-k-no')

export function candidatoDaSerpApi(r) {
  return {
    id: r.place_id || r.data_id,
    nome: r.title,
    endereco: r.address || '',
    telefone: r.phone || null,
    telefoneExibicao: r.phone || null,
    siteMaps: r.website || null, // separado depois em site próprio × Instagram/agregador
    maps: r.place_id
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.title)}&query_place_id=${r.place_id}`
      : null,
    rating: r.rating ?? null,
    avaliacoes: r.reviews ?? 0,
    categorias: r.types || (r.type ? [r.type] : []),
    // A foto de capa do Maps (googleusercontent.com); o Leão baixa pelo servidor.
    fotos: r.thumbnail ? [fotoGrande(r.thumbnail)] : [],
    horarios: lerHorarios(r.operating_hours),
    geo: r.gps_coordinates?.latitude != null ? { lat: r.gps_coordinates.latitude, lng: r.gps_coordinates.longitude } : null,
  }
}
