// Google Maps via Firecrawl (provedor "firecrawl-maps" do catálogo Alexandria).
// Usa a FIRECRAWL_API_KEY — não precisa da Places API nem de faturamento no Google.
// Custo: 5 créditos Firecrawl por busca, até 20 lugares (nome, endereço, telefone, nota e site).

export async function buscarMapsFirecrawl(query) {
  const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
    body: JSON.stringify({
      alexandria: { provider: 'firecrawl-maps', capability: 'businesses/search', options: { query } },
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) {
    throw new Error(`Google Maps (Firecrawl): ${json.error || res.statusText}`)
  }
  const item = (json.data?.alexandria || json.alexandria || [])[0]
  if (!item) throw new Error('Google Maps (Firecrawl): resposta sem resultados')
  if (item.error) throw new Error(`Google Maps (Firecrawl): ${item.error.message || item.error.code || 'erro'}`)
  return (item.data?.results || []).map(candidatoDoMaps)
}

const semPais = (endereco) => String(endereco || '').replace(/,\s*Brazil$/i, '').replace(/,\s*Brasil$/i, '')

export function candidatoDoMaps(r) {
  return {
    id: r.place_id || r.feature_id,
    nome: r.name,
    endereco: semPais(r.address),
    telefone: r.phone_e164 || r.phone || null,
    telefoneExibicao: r.phone || r.phone_e164 || null,
    siteMaps: r.website || null, // separado depois em site próprio × Instagram/agregador
    maps: r.place_id
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name)}&query_place_id=${r.place_id}`
      : null,
    rating: r.rating ?? null,
    avaliacoes: r.review_count ?? 0,
    categorias: r.categories || [],
    fotos: [],
  }
}
