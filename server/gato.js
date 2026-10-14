// 🐈‍⬛ Gato Negro — pesquisa referências de design no Firecrawl para o segmento do negócio.
// As referências servem de inspiração de padrões (não copiamos layouts nem textos).

// Referências fixas de sites interativos/animados (indicadas pelo usuário) — inspiração de padrões, não cópia.
export const REFERENCIAS_INTERATIVAS = [
  { titulo: '21st.dev — componentes React animados (seções, cards, hero)', url: 'https://21st.dev' },
  { titulo: 'GSAP — animações de entrada, rolagem e cursor', url: 'https://gsap.com' },
]

export async function estudarReferencias(categoria) {
  const res = await fetch('https://api.firecrawl.dev/v2/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({ query: `site profissional ${categoria} design moderno exemplos`, limit: 6, country: 'BR', lang: 'pt' }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Firecrawl: ${data.error || res.statusText}`)
  const doSegmento = (data.data?.web || []).map((r) => ({ titulo: r.title || r.url, url: r.url }))
  return [...REFERENCIAS_INTERATIVAS, ...doSegmento]
}
