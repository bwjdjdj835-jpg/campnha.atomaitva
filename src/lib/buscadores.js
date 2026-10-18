// 🔎 Status da fila de buscadores do Pinguim (Firecrawl → Tavily → Exa → Serper → Brave), para as telas.
const NOMES = { firecrawl: 'Firecrawl', tavily: 'Tavily', exa: 'Exa', serper: 'Serper', brave: 'Brave' }

export function textoBuscadores(keys) {
  const lista = keys?.buscadores || (keys?.firecrawl ? ['firecrawl'] : [])
  if (!lista.length) return 'conferência de site ✗ (sem buscador)'
  const c = keys.creditos
  const nomes = lista.map((id) =>
    id === 'firecrawl' && c ? `Firecrawl ${c.restantes > 0 ? `(${c.restantes} créditos)` : '❌ sem crédito'}` : NOMES[id] || id,
  )
  return `conferência de site: ${nomes.join(' → ')}`
}
