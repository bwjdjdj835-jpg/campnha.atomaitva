// 🧪 Pasta dos clientes: com a pasta escolhida, o automático salva mensagem + atalho (e o vídeo) de cada cliente sozinho.
// A "pasta do notebook" é simulada com a pasta interna do navegador. Precisa do `npm run dev` rodando.
import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--auto-accept-this-tab-capture'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true })
const page = await ctx.newPage()
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
const json = (r, d, status = 200) => r.fulfill({ status, contentType: 'application/json', body: JSON.stringify(d) })
await ctx.route('**/api/**', (r) => {
  const u = new URL(r.request().url()).pathname
  const b = r.request().postDataJSON?.() || {}
  if (u.endsWith('/status')) return json(r, { ok: true, keys: { firecrawl: true, apify: true, videoServidor: false } })
  if (u.endsWith('/pinguim/buscar')) return json(r, { logs: [], comSite: [], leads: [1, 2, 3].map((k) => ({ id: `b-${k}`, nome: k === 3 ? 'Barbearia Com Site' : `Barbearia ${k}`, categoria: 'Barbearia', telefone: `(69) 99999-000${k}`, endereco: 'Cacoal - RO', maps: 'https://maps.google.com/?cid=' + k, fotos: [], conferencia: { status: 'pendente' } })) })
  if (u.endsWith('/pinguim/conferir')) return json(r, { veredito: b.nome?.includes('Com Site') ? 'tem' : 'nao', pedidos: 1, evidencias: [] })
  if (u.endsWith('/leao/print') || u.endsWith('/leao/hospedar')) return json(r, { error: 'sem chave', code: 'NO_KEY' }, 400)
  if (u.endsWith('/gato/estudar')) { console.log('!! estudo chamado'); return json(r, { referencias: [], cursos: [], secoes: [], modelos: [] }) }
  if (u.endsWith('/abelha/enriquecer')) { console.log('!! abelha chamada'); return json(r, { fontes: [], campos: { sobre: null, horarios: null, servicos: [] } }) }
  if (u.endsWith('/tigre/mensagem')) return json(r, { texto: `Olá, pessoal da ${b.negocio?.nome}! Fiz uma prévia de site pra vocês.`, fonte: 'modelo' })
  return json(r, { error: 'x' }, 404)
})
await page.goto('http://localhost:5173/')
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('central-agentes:automatico', JSON.stringify({ cidade: 'Cacoal - RO', nichos: 'barbearia', porNicho: '5', estudo: 'nenhum', abelha: false, videoModo: 'manual', v: 3 })) })
await page.reload()
await page.evaluate(() => { window.showDirectoryPicker = async () => navigator.storage.getDirectory() })
await page.evaluate(async () => (await import('/src/lib/pastaClientes.js')).escolherPasta())
const t0 = Date.now()
await page.getByRole('button', { name: /Iniciar inteligência artificial automática/ }).click()
while (!page.url().endsWith('/admin') && Date.now() - t0 < 300000) await page.waitForTimeout(1000)
await page.waitForTimeout(1500)
const arvore = await page.evaluate(async () => {
  const lista = []
  const andar = async (dir, caminho) => { for await (const [nome, h] of dir.entries()) { if (h.kind === 'directory') await andar(h, caminho + nome + '/'); else lista.push(caminho + nome) } }
  await andar(await navigator.storage.getDirectory(), '')
  return lista
})
console.log(arvore.join('\n'))
console.log(arvore.filter((c) => c.endsWith('1 - Mensagem.txt')).length === 2 ? 'OK   o automático salvou os 2 clientes sozinho' : 'FALHA automático não salvou')
const log = await page.evaluate(() => JSON.parse(localStorage.getItem('central-agentes:v1')).sites.map((s) => s.nome + ' → ' + (s.pastaLocal?.caminho || 'sem pasta')))
console.log(log.join('\n'))
await browser.close()
