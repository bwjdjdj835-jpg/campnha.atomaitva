// 🔎 Busca na web com vários buscadores em fila (pedido do usuário: "quando acabar o crédito de um, usa outro").
// Ordem: Firecrawl → Tavily → Exa → Serper → Brave. Só entra quem tem chave; se um falhar (sem crédito, limite por
// minuto, fora do ar), o próximo tenta. Um buscador que acusou falta de crédito fica de fora por 1 hora.
// Todos devolvem o mesmo formato: [{ url, title, description }].
//
// Planos grátis (out/2026): Tavily 1.000 buscas/mês sem cartão · Exa US$ 10/mês em créditos sem cartão ·
// Serper 2.500 buscas uma vez só, sem cartão · Brave US$ 5/mês (~1.000 buscas), pede cartão · Firecrawl 1.000 créditos/mês.

const PROVEDORES = [
  {
    id: 'firecrawl',
    nome: 'Firecrawl',
    chave: () => process.env.FIRECRAWL_API_KEY,
    pedir: (q, chave, n) =>
      chamar('https://api.firecrawl.dev/v2/search', { Authorization: `Bearer ${chave}` }, { query: q, limit: n, country: 'BR' }),
    ler: (d) => (d.data?.web || []).map((r) => ({ url: r.url, title: r.title, description: r.description })),
  },
  {
    id: 'tavily',
    nome: 'Tavily',
    chave: () => process.env.TAVILY_API_KEY,
    pedir: (q, chave, n) =>
      chamar('https://api.tavily.com/search', { Authorization: `Bearer ${chave}` }, { query: q, max_results: n, search_depth: 'basic', country: 'brazil' }),
    ler: (d) => (d.results || []).map((r) => ({ url: r.url, title: r.title, description: r.content })),
  },
  {
    id: 'exa',
    nome: 'Exa',
    chave: () => process.env.EXA_API_KEY,
    pedir: (q, chave, n) =>
      chamar('https://api.exa.ai/search', { 'x-api-key': chave }, { query: q, numResults: n, type: 'auto', contents: { highlights: true } }),
    ler: (d) => (d.results || []).map((r) => ({ url: r.url, title: r.title, description: (r.highlights || []).join(' ') || r.text || '' })),
  },
  {
    id: 'serper',
    nome: 'Serper (Google)',
    chave: () => process.env.SERPER_API_KEY,
    pedir: (q, chave, n) => chamar('https://google.serper.dev/search', { 'X-API-KEY': chave }, { q, gl: 'br', hl: 'pt-br', num: n }),
    ler: (d) => (d.organic || []).map((r) => ({ url: r.link, title: r.title, description: r.snippet })),
  },
  {
    id: 'brave',
    nome: 'Brave',
    chave: () => process.env.BRAVE_API_KEY,
    pedir: (q, chave, n) =>
      chamar(
        `https://api.search.brave.com/res/v1/web/search?${new URLSearchParams({ q, count: String(n), country: 'BR', search_lang: 'pt-br' })}`,
        { 'X-Subscription-Token': chave, Accept: 'application/json' },
      ),
    ler: (d) => (d.web?.results || []).map((r) => ({ url: r.url, title: r.title, description: r.description })),
  },
]

const UMA_HORA = 60 * 60 * 1000
const foraAte = {} // id → horário em que volta a ser usado (acabou o crédito)

async function chamar(url, cabecalhos, corpo) {
  const res = await fetch(url, {
    method: corpo ? 'POST' : 'GET',
    headers: { ...(corpo ? { 'Content-Type': 'application/json' } : {}), ...cabecalhos },
    body: corpo ? JSON.stringify(corpo) : undefined,
    signal: AbortSignal.timeout(20000),
  })
  const dados = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = dados.error?.message || dados.error || dados.message || dados.detail || res.statusText
    const e = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
    e.status = res.status
    throw e
  }
  return dados
}

const semCredito = (e) => [402, 432].includes(e.status) || /cr[eé]dit|credit|quota|insufficient|payment|plan limit|usage limit/i.test(e.message)

// Quais buscadores têm chave (para o /api/status e para o Pinguim saber se dá para conferir).
export const buscadores = () => PROVEDORES.filter((p) => p.chave()).map((p) => p.id)
export const temBusca = () => buscadores().length > 0
// Outros buscadores além do Firecrawl: com eles o Pinguim confere mesmo sem crédito no Firecrawl.
export const temBuscaExtra = () => buscadores().some((id) => id !== 'firecrawl')

// Busca na fila. `pular` tira buscadores (ex.: ['firecrawl'] quando o Firecrawl já está sem crédito).
// Devolve { resultados, fonte }; se todos falharem, lança o erro do primeiro (mantém "limite"/"crédito" para quem chamou).
export async function buscarNaWeb(q, { n = 8, pular = [] } = {}) {
  const erros = []
  for (const p of PROVEDORES) {
    const chave = p.chave()
    if (!chave || pular.includes(p.id) || (foraAte[p.id] || 0) > Date.now()) continue
    try {
      const resultados = p.ler(await p.pedir(q, chave, n)).filter((r) => r.url)
      return { resultados, fonte: p.nome }
    } catch (e) {
      if (semCredito(e)) foraAte[p.id] = Date.now() + UMA_HORA
      erros.push(e.status === 429 ? new Error(`limite de pedidos por minuto do ${p.nome} atingido (libera em 1 minuto)`) : new Error(`${p.nome}: ${e.message}`))
    }
  }
  if (erros.length) throw erros[0]
  throw new Error('Nenhum buscador configurado (Firecrawl, Tavily, Exa, Serper ou Brave).')
}

// Só para testes.
export const _zerarForaDeUso = () => Object.keys(foraAte).forEach((k) => delete foraAte[k])
