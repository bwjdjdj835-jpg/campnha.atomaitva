// 🐈‍⬛ Gato Negro — pesquisa no Firecrawl:
//   1. sites de desenvolvedores profissionais do mesmo segmento (Awwwards, Behance, Dribbble, Webflow, Framer…);
//   2. cursos e tutoriais grátis de como montar um site completo — lê as páginas e conta quais seções
//      eles recomendam (Sobre, Serviços, Diferenciais, Como funciona, Galeria, Depoimentos, FAQ, Contato…).
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

// Seções de site que os guias e modelos citam. `temos` = o site do cliente já monta essa seção.
const SECOES = [
  { id: 'sobre', nome: 'Sobre / Quem somos', re: /sobre (n[oó]s|a empresa)|quem somos|nossa hist[oó]ria|about us/i, temos: true },
  { id: 'servicos', nome: 'Serviços / Produtos', re: /servi[cç]os|o que fazemos|card[aá]pio|produtos|services/i, temos: true },
  { id: 'diferenciais', nome: 'Diferenciais', re: /diferenciais|por que (nos )?escolher|vantagens|why choose/i, temos: true },
  { id: 'passos', nome: 'Como funciona', re: /como funciona|passo a passo|how it works/i, temos: true },
  { id: 'galeria', nome: 'Galeria de fotos', re: /galeria|portf[oó]lio|fotos do|gallery/i, temos: true },
  { id: 'depoimentos', nome: 'Depoimentos / Avaliações', re: /depoimentos?|avalia[cç][oõ]es|prova social|testimonials?/i, temos: false },
  { id: 'faq', nome: 'Perguntas frequentes', re: /perguntas frequentes|d[uú]vidas frequentes|\bfaq\b/i, temos: true },
  { id: 'cta', nome: 'Chamada para ação (WhatsApp)', re: /chamada para a[cç][aã]o|call to action|\bcta\b|bot[aã]o de whatsapp/i, temos: true },
  { id: 'contato', nome: 'Contato e mapa', re: /fale conosco|formul[aá]rio de contato|mapa|localiza[cç][aã]o|contato/i, temos: true },
  { id: 'precos', nome: 'Preços / Planos', re: /tabela de pre[cç]os|pre[cç]os|planos|pricing/i, temos: false },
  { id: 'equipe', nome: 'Equipe', re: /nossa equipe|equipe|profissionais|our team/i, temos: false },
]

// Cursos e tutoriais grátis em português; o Firecrawl já devolve o texto das páginas (scrapeOptions).
const buscasDeCursos = (categoria) => [
  { query: `como criar site profissional para ${categoria} quais seções colocar`, country: 'BR', limit: 3 },
  { query: 'curso grátis criar site profissional estrutura landing page seções', country: 'BR', limit: 3 },
]

async function estudarCursos(categoria) {
  const resultados = await Promise.allSettled(
    buscasDeCursos(categoria).map((b) => buscar({ ...b, scrapeOptions: { formats: ['markdown'], onlyMainContent: true } })),
  )
  const paginas = []
  const vistas = new Set()
  for (const r of resultados) {
    if (r.status !== 'fulfilled') continue
    for (const item of r.value) {
      if (!item.url || vistas.has(item.url)) continue
      vistas.add(item.url)
      paginas.push(item)
    }
  }
  const contagem = SECOES.map((s) => ({ ...s, fontes: [] }))
  for (const p of paginas) {
    const texto = `${p.title || ''}\n${p.description || ''}\n${p.markdown || ''}`
    for (const s of contagem) if (s.re.test(texto)) s.fontes.push(p.url)
  }
  return {
    cursos: paginas.map((p) => {
      let fonte = ''
      try {
        fonte = new URL(p.url).hostname.replace(/^www\./, '')
      } catch {}
      return { titulo: p.title || p.url, url: p.url, descricao: resumo(p.description), fonte }
    }),
    secoes: contagem
      .filter((s) => s.fontes.length)
      .sort((a, b) => b.fontes.length - a.fontes.length)
      .map(({ id, nome, temos, fontes }) => ({ id, nome, temos, vezes: fontes.length, fontes })),
  }
}

export async function estudar(categoria) {
  const [referencias, cursos] = await Promise.allSettled([estudarReferencias(categoria), estudarCursos(categoria)])
  if (referencias.status === 'rejected' && cursos.status === 'rejected') throw referencias.reason
  return {
    referencias: referencias.status === 'fulfilled' ? referencias.value : REFERENCIAS_INTERATIVAS,
    cursos: cursos.status === 'fulfilled' ? cursos.value.cursos : [],
    secoes: cursos.status === 'fulfilled' ? cursos.value.secoes : [],
  }
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
