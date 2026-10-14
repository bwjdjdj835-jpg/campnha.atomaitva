// 🐈‍⬛ Gato Negro — pesquisa no Firecrawl:
//   1. sites de desenvolvedores profissionais do mesmo segmento (Awwwards, Behance, Dribbble, Webflow, Framer…),
//      as bibliotecas favoritas do usuário (21st.dev, Code Eagle, GSAP) e sites de modelos grátis (HTML5 UP…);
//   2. cursos e tutoriais grátis de como montar um site completo — lê as páginas e conta quais seções
//      eles recomendam (Sobre, Serviços, Diferenciais, Como funciona, Galeria, Depoimentos, FAQ, Contato…);
//   3. sites modelo colados pelo usuário — lê seções, cores e fontes (formato `branding` do Firecrawl).
// As referências servem de inspiração de padrões (não copiamos layouts nem textos).
// O plano grátis do Firecrawl aceita ~10 pedidos por minuto: aqui são 5 buscas + até MAX_MODELOS leituras.

// Referências fixas de sites interativos/animados (indicadas pelo usuário) — inspiração de padrões, não cópia.
export const REFERENCIAS_INTERATIVAS = [
  { titulo: '21st.dev — componentes React animados (seções, cards, hero)', url: 'https://21st.dev', fonte: '21st.dev' },
  { titulo: 'GSAP — animações de entrada, rolagem e cursor', url: 'https://gsap.com', fonte: 'gsap.com' },
  { titulo: 'Code Eagle — 600+ componentes e páginas completas (Next.js)', url: 'https://www.nextcodeeagle.com', fonte: 'nextcodeeagle.com' },
]

export const MAX_MODELOS = 4

const MAX_REFERENCIAS = 10

// Cada busca mira um tipo de fonte; rodam em paralelo e uma falha não derruba as outras.
const buscas = (categoria) => [
  // Vitrines onde designers e desenvolvedores profissionais publicam os sites que fizeram.
  {
    query: `${categoria} website`,
    includeDomains: ['awwwards.com', 'behance.net', 'dribbble.com', 'webflow.com', 'framer.com', 'themeforest.net'],
    limit: 6,
  },
  // Bibliotecas de componentes e animações que o usuário usa.
  { query: `${categoria} hero section landing page`, includeDomains: ['21st.dev', 'nextcodeeagle.com', 'gsap.com'], limit: 4 },
  // Modelos de site grátis.
  {
    query: `${categoria} free website template`,
    includeDomains: ['html5up.net', 'templatemo.com', 'free-css.com', 'onepagelove.com', 'colorlib.com'],
    limit: 4,
  },
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
  { id: 'depoimentos', nome: 'Depoimentos / Avaliações', re: /depoimentos?|avalia[cç][oõ]es|prova social|o que (nossos clientes|os clientes|os usu[aá]rios) dizem|o que dizem|testimonials?/i, temos: false },
  { id: 'faq', nome: 'Perguntas frequentes', re: /perguntas frequentes|d[uú]vidas frequentes|\bfaq\b/i, temos: true },
  { id: 'cta', nome: 'Chamada para ação (WhatsApp)', re: /chamada para a[cç][aã]o|call to action|\bcta\b|bot[aã]o de whatsapp/i, temos: true },
  { id: 'contato', nome: 'Contato e mapa', re: /fale conosco|formul[aá]rio de contato|mapa|localiza[cç][aã]o|contato/i, temos: true },
  { id: 'precos', nome: 'Preços / Planos', re: /tabela de pre[cç]os|pre[cç]os|\bplanos?\b|R\$ ?\d|pricing/i, temos: false },
  { id: 'equipe', nome: 'Equipe', re: /nossa equipe|equipe|profissionais|our team/i, temos: false },
]

// Cursos e tutoriais grátis em português; o Firecrawl já devolve o texto das páginas (scrapeOptions).
const buscasDeCursos = (categoria) => [
  { query: `curso grátis como criar site profissional para ${categoria} quais seções colocar`, country: 'BR', limit: 4 },
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
  return {
    cursos: paginas.map((p) => {
      let fonte = ''
      try {
        fonte = new URL(p.url).hostname.replace(/^www\./, '')
      } catch {}
      return { titulo: p.title || p.url, url: p.url, descricao: resumo(p.description), fonte }
    }),
    paginas,
  }
}

const secoesDoTexto = (texto) => SECOES.filter((s) => s.re.test(texto)).map((s) => s.id)

// Conta em quantas fontes (cursos + modelos) cada seção aparece.
function contarSecoes(fontes) {
  return SECOES.map((s) => ({ ...s, fontes: fontes.filter((f) => f.secoes.includes(s.id)).map((f) => f.url) }))
    .filter((s) => s.fontes.length)
    .sort((a, b) => b.fontes.length - a.fontes.length)
    .map(({ id, nome, temos, fontes }) => ({ id, nome, temos, vezes: fontes.length, fontes }))
}

export function linksDeModelos(lista) {
  const urls = []
  for (const bruto of Array.isArray(lista) ? lista : []) {
    try {
      const u = new URL(String(bruto).trim())
      if (/^https?:$/.test(u.protocol) && !urls.includes(u.href)) urls.push(u.href)
    } catch {}
  }
  return urls.slice(0, MAX_MODELOS)
}

// Lê um site modelo: título, seções que ele tem, cores e fontes (identidade visual).
async function lerModelo(url) {
  const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
    body: JSON.stringify({ url, formats: ['markdown', 'branding'], onlyMainContent: false, timeout: 45000 }),
    signal: AbortSignal.timeout(55000),
  })
  const json = await res.json().catch(() => ({}))
  if (res.status === 429) throw new Error('limite de pedidos por minuto do Firecrawl (tente de novo em 1 minuto)')
  if (!res.ok || json.success === false) throw new Error(json.error || res.statusText)
  const d = json.data || {}
  const b = d.branding || {}
  const cores = b.colors || {}
  const corOk = (c) => (/^#[0-9a-f]{6}$/i.test(String(c || '')) ? String(c).toUpperCase() : null)
  const fonte = b.typography?.fontFamilies?.heading || b.typography?.fontFamilies?.primary || b.fonts?.[0]?.family || null
  return {
    url,
    titulo: d.metadata?.title || url,
    fonte: new URL(url).hostname.replace(/^www\./, ''),
    secoes: secoesDoTexto(`${d.metadata?.title || ''}\n${d.markdown || ''}`),
    estilo: {
      esquema: b.colorScheme === 'light' ? 'claro' : 'escuro',
      cores: {
        primaria: corOk(cores.primary),
        secundaria: corOk(cores.secondary || cores.accent),
        fundo: corOk(cores.background),
        texto: corOk(cores.textPrimary),
      },
      fonte: /^[\w -]{2,40}$/.test(String(fonte || '')) ? fonte : null,
      cantos: b.spacing?.borderRadius || null,
    },
    // Quanto o Firecrawl confia na leitura das cores (0 a 1). O estudo descarta leituras fracas.
    confianca: typeof b.confidence?.colors === 'number' ? b.confidence.colors : typeof b.confidence?.overall === 'number' ? b.confidence.overall : null,
  }
}

export async function estudar(categoria, modelos = []) {
  const links = linksDeModelos(modelos)
  const [referencias, cursos, ...lidos] = await Promise.allSettled([
    estudarReferencias(categoria),
    estudarCursos(categoria),
    ...links.map(lerModelo),
  ])
  if (referencias.status === 'rejected' && cursos.status === 'rejected' && !lidos.some((r) => r.status === 'fulfilled')) {
    throw referencias.reason
  }
  const paginas = cursos.status === 'fulfilled' ? cursos.value.paginas : []
  const modelosLidos = lidos.map((r, i) =>
    r.status === 'fulfilled' ? r.value : { url: links[i], titulo: links[i], erro: r.reason?.message || 'não consegui ler' },
  )
  const fontesDeSecoes = [
    ...paginas.map((p) => ({ url: p.url, secoes: secoesDoTexto(`${p.title || ''}\n${p.description || ''}\n${p.markdown || ''}`) })),
    ...modelosLidos.filter((m) => !m.erro),
  ]
  return {
    referencias: referencias.status === 'fulfilled' ? referencias.value : REFERENCIAS_INTERATIVAS,
    cursos: cursos.status === 'fulfilled' ? cursos.value.cursos : [],
    secoes: contarSecoes(fontesDeSecoes),
    modelos: modelosLidos,
  }
}

// ---------- Estudo longo (rodadas de ~1 minuto, por causa do limite do plano grátis) ----------
// Cada rodada procura sites REAIS de negócios do segmento e lê o estilo de até MAX_POR_RODADA deles
// (2 buscas + 6 leituras = 8 pedidos). O app chama uma rodada por minuto durante o estudo.
const MAX_POR_RODADA = 6
// Vitrines, bibliotecas, redes sociais e diretórios não são "site de negócio" para estudar estilo.
const NAO_E_SITE_DO_RAMO =
  /(^|\.)(dribbble|behance|awwwards|webflow|framer|themeforest|html5up|templatemo|free-css|onepagelove|colorlib|21st|nextcodeeagle|gsap|instagram|facebook|youtube|wikipedia|pinterest|tiktok|linkedin|medium|reclameaqui|google|guiamais|apontador|ifood|tripadvisor|booksy|trinks|wix|canva|hostinger|shopify|wordpress)\./

// Uma dupla de buscas diferente por rodada (o estudo de 5 min faz 4 rodadas).
const BUSCAS_POR_RODADA = [
  (c) => [`site ${c}`, `${c} agendamento whatsapp site oficial`],
  (c) => [`melhores sites de ${c}`, `${c} premium site`],
  (c) => [`${c} site moderno design`, `${c} página oficial serviços`],
  (c) => [`${c} site elegante sofisticado`, `${c} site profissional galeria de fotos`],
]
const buscasDaRodada = (categoria, rodada) =>
  BUSCAS_POR_RODADA[Math.min(Math.max(rodada, 1), BUSCAS_POR_RODADA.length) - 1](categoria).map((query, i) => ({
    query,
    country: 'BR',
    limit: i === 0 ? 8 : 6,
  }))

export async function aprofundar(categoria, rodada = 1, jaLidos = []) {
  const lidosHosts = new Set(jaLidos.map((u) => hostDe(u)))
  const resultados = await Promise.allSettled(buscasDaRodada(categoria, rodada).map(buscar))
  if (resultados.every((r) => r.status === 'rejected')) throw resultados[0].reason
  const alvos = []
  for (const r of resultados) {
    if (r.status !== 'fulfilled') continue
    for (const item of r.value) {
      const host = hostDe(item.url)
      if (!host || lidosHosts.has(host) || NAO_E_SITE_DO_RAMO.test(host)) continue
      lidosHosts.add(host)
      alvos.push(`https://${host}/`) // a página inicial mostra a identidade visual do site
      if (alvos.length >= MAX_POR_RODADA) break
    }
    if (alvos.length >= MAX_POR_RODADA) break
  }
  const lidos = await Promise.allSettled(alvos.map(lerModelo))
  return {
    lidos: lidos.filter((r) => r.status === 'fulfilled').map((r) => r.value),
    falhas: lidos.filter((r) => r.status === 'rejected').length,
  }
}

function hostDe(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
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
