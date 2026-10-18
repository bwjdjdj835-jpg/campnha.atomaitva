// Teste da fila de buscadores com fetch falso (não gasta crédito): node .claude/skills/buscadores-gratis/teste-fila.mjs
import { buscarNaWeb, _zerarForaDeUso, buscadores } from '../../../server/buscaWeb.js'
import { conferirSite } from '../../../server/pinguim.js'
import { erroDeCredito } from '../../../server/firecrawlCreditos.js'
const chamadas = []
let modo = {}
globalThis.fetch = async (url, o) => {
  const host = new URL(url).host; chamadas.push(host)
  const r = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  const m = modo[host]
  if (m === 402) return r(402, { error: 'Insufficient credits to perform this request.' })
  if (m === 429) return r(429, { error: 'Rate limit exceeded' })
  if (m === 432) return r(432, { detail: { error: 'This request exceeds your plan usage limit.' } })
  if (host === 'api.firecrawl.dev') return r(200, { data: { web: [{ url: 'https://fc.com/a', title: 'FC', description: 'x' }] } })
  if (host === 'api.tavily.com') { const b = JSON.parse(o.body); console.log('  tavily body:', JSON.stringify(b), 'auth:', o.headers.Authorization); return r(200, { results: [{ url: 'https://barbeariadompablo.com.br', title: 'Barbearia Dom Pablo', content: 'Cacoal' }] }) }
  if (host === 'api.exa.ai') return r(200, { results: [{ url: 'https://exa.com/x', title: 'E', highlights: ['h1', 'h2'] }] })
  if (host === 'google.serper.dev') return r(200, { organic: [{ link: 'https://serp.com/x', title: 'S', snippet: '(69) 99999-0000' }] })
  if (host === 'api.search.brave.com') { console.log('  brave url:', url.slice(0, 90)); return r(200, { web: { results: [{ url: 'https://brave.com/x', title: 'B', description: 'd' }] } }) }
}
const env = (o) => { for (const k of ['FIRECRAWL_API_KEY','TAVILY_API_KEY','EXA_API_KEY','SERPER_API_KEY','BRAVE_API_KEY']) delete process.env[k]; Object.assign(process.env, o); _zerarForaDeUso(); modo = {}; chamadas.length = 0 }
const ver = (nome, cond) => console.log(cond ? 'OK  ' : 'FALHA', nome)

env({ TAVILY_API_KEY: 'tvly-x' }); let r = await buscarNaWeb('a'); ver('só Tavily', r.fonte === 'Tavily' && r.resultados[0].description === 'Cacoal')
env({ FIRECRAWL_API_KEY: 'fc', TAVILY_API_KEY: 'tvly-x' }); modo['api.firecrawl.dev'] = 402; r = await buscarNaWeb('a'); ver('Firecrawl sem crédito → Tavily', r.fonte === 'Tavily')
chamadas.length = 0; r = await buscarNaWeb('b'); ver('Firecrawl fica de fora 1h (não é chamado de novo)', !chamadas.includes('api.firecrawl.dev') && r.fonte === 'Tavily')
env({ FIRECRAWL_API_KEY: 'fc' }); modo['api.firecrawl.dev'] = 429; try { await buscarNaWeb('a'); ver('429 sozinho lança', false) } catch (e) { ver('Firecrawl 429 sozinho → erro "limite de pedidos"', /limite de pedidos/.test(e.message)) }
env({ FIRECRAWL_API_KEY: 'fc', SERPER_API_KEY: 's' }); modo['api.firecrawl.dev'] = 429; r = await buscarNaWeb('a'); ver('Firecrawl 429 → Serper', r.fonte === 'Serper (Google)' && r.resultados[0].url === 'https://serp.com/x')
env({ FIRECRAWL_API_KEY: 'fc', TAVILY_API_KEY: 't' }); modo['api.firecrawl.dev'] = 402; modo['api.tavily.com'] = 432; try { await buscarNaWeb('a') } catch (e) { ver('todos sem crédito → erro de crédito (402 SEM_CREDITO)', erroDeCredito(e.message)) }
env({ EXA_API_KEY: 'e' }); r = await buscarNaWeb('a'); ver('Exa', r.fonte === 'Exa' && r.resultados[0].description === 'h1 h2')
env({ BRAVE_API_KEY: 'BSAx' }); r = await buscarNaWeb('a'); ver('Brave', r.fonte === 'Brave' && r.resultados[0].url === 'https://brave.com/x')
env({}); try { await buscarNaWeb('a') } catch (e) { ver('sem nenhuma chave → erro claro', /Nenhum buscador/.test(e.message)) }
env({ FIRECRAWL_API_KEY: 'fc', TAVILY_API_KEY: 'tvly-x' }); ver('buscadores()', buscadores().join() === 'firecrawl,tavily')
modo['api.firecrawl.dev'] = 402
const c = await conferirSite({ nome: 'Barbearia Dom Pablo', cidade: 'Cacoal', telefone: '(69) 99999-0000' })
ver('Pinguim confere pelo Tavily: tem site', c.veredito === 'tem' && c.site === 'https://barbeariadompablo.com.br' && c.fonte === 'Tavily')
