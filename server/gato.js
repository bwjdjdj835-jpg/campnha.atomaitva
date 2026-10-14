// 🐈‍⬛ Gato Negro — pesquisa no Firecrawl sites de desenvolvedores profissionais do mesmo segmento
// (vitrines como Awwwards, Behance, Dribbble, Webflow e Framer, além de sites brasileiros do ramo).
// As referências servem de inspiração de padrões (não copiamos layouts nem textos).

// Referências fixas de sites interativos/animados (indicadas pelo usuário) — inspiração de padrões, não cópia.
export const REFERENCIAS_INTERATIVAS = [
  { titulo: '21st.dev — componentes React animados (seções, cards, hero)', url: 'https://21st.dev', fonte: '21st.dev' },
  { titulo: 'GSAP — animações de entrada, rolagem e cursor', url: 'https://gsap.com', fonte: 'gsap.com' },
]

const MAX_REFERENCIAS = 10

// Cada busca mira um tipo de fonte; rodam em paralelo e uma falha não derruba as outras.
const buscas = (categoria) => [
  // Vitrines onde designers e desenvolvedores profissionais publicam os sites que fizeram.
  { query: `${categoria} website`, includeDomains: ['awwwards.com', 'behance.net', 'dribbble.com'], limit: 6 },
  { query: `${categoria} website template`, includeDomains: ['webflow.com', 'framer.com', 'themeforest.net'], limit: 4 },
  { query: `site profissional ${categoria} design moderno`, country: 'BR', limit: 4 },
]

async function buscar(params) {
  const res = await fetch('https://api.firecrawl.dev/v2/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(25000),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Firecrawl: ${data.error || res.statusText}`)
  return data.data?.web || []
}

// As descrições às vezes vêm em markdown longo (imagens, links, cores): vira uma frase curta.
function resumo(texto) {
  const limpo = String(texto || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return limpo.length > 200 ? limpo.slice(0, 200).replace(/\s\S*$/, '') + '…' : limpo || null
}

export async function estudarReferencias(categoria) {
  const resultados = await Promise.allSettled(buscas(categoria).map(buscar))
  const falhas = resultados.filter((r) => r.status === 'rejected')
  if (falhas.length === resultados.length) throw falhas[0].reason

  const vistos = new Set()
  const doSegmento = []
  for (const r of resultados) {
    if (r.status !== 'fulfilled') continue
    for (const item of r.value) {
      let u
      try {
        u = new URL(item.url)
      } catch {
        continue
      }
      const chave = u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '')
      if (vistos.has(chave)) continue
      vistos.add(chave)
      doSegmento.push({
        titulo: item.title || item.url,
        url: item.url,
        descricao: resumo(item.description),
        fonte: u.hostname.replace(/^www\./, ''),
      })
    }
  }
  return [...REFERENCIAS_INTERATIVAS, ...doSegmento.slice(0, MAX_REFERENCIAS)]
}
