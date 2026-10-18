// Quantos créditos ainda restam na conta do Firecrawl (GET /v2/team/credit-usage, não gasta crédito).
// Quando acabam, todas as leituras do Maps e conferências falham — o Pinguim avisa em vez de "não achar nada".

let cache = { em: 0, valor: undefined }

// → { restantes, plano, renovaEm } ou null (sem chave ou o Firecrawl não respondeu).
export async function creditosFirecrawl() {
  if (!process.env.FIRECRAWL_API_KEY) return null
  if (Date.now() - cache.em < 60_000) return cache.valor
  let valor = null
  try {
    const res = await fetch('https://api.firecrawl.dev/v2/team/credit-usage', {
      headers: { Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
      signal: AbortSignal.timeout(6000),
    })
    const json = await res.json().catch(() => ({}))
    const d = json.data || json
    const restantes = d.remainingCredits ?? d.remaining_credits
    if (res.ok && typeof restantes === 'number') {
      valor = { restantes, plano: d.planCredits ?? d.plan_credits ?? null, renovaEm: d.billingPeriodEnd ?? d.billing_period_end ?? null }
    }
  } catch {
    valor = null
  }
  cache = { em: Date.now(), valor }
  return valor
}

export const semCredito = (c) => Boolean(c) && c.restantes <= 0

// Erro do Firecrawl por falta de crédito (402 Payment Required / "Insufficient credits").
export const erroDeCredito = (msg) => /402|payment required|insufficient credits|credits? (to|remaining)|sem cr[eé]dito/i.test(String(msg))

export function avisoSemCredito(c) {
  const data = c?.renovaEm ? new Date(c.renovaEm).toLocaleDateString('pt-BR', { timeZone: 'America/Porto_Velho' }) : null
  return `Acabaram os créditos do Firecrawl${data ? ` (renova em ${data})` : ''} — o Pinguim confere os sites pelos outros buscadores (Tavily, Exa, Serper, Brave) se tiver a chave de algum. Grátis: TAVILY_API_KEY (1.000 buscas/mês) e SERPAPI_KEY (Maps, 250/mês) no Vercel.`
}
