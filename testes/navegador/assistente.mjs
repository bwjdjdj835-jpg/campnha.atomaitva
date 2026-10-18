// 🧪 Assistente do ramo no site do cliente (agendar / pedido / orçamento / socorro) no navegador.
// Precisa do app rodando: `npm run dev` em outro terminal; depois `node testes/navegador/assistente.mjs`.
import { chromium } from 'playwright-core'
const D = process.env.PRINTS || '.'
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, permissions: ['geolocation'], geolocation: { latitude: -11.438621, longitude: -61.447222 } })
const p = await ctx.newPage()
p.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await p.route('**/api/**', (r) => r.fulfill({ json: {} }))
await p.goto('http://localhost:5173/'); await p.waitForTimeout(800)
const ver = (n, c, x = '') => console.log(c ? 'OK  ' : 'FALHA', n, x)
const site = async (categoria, servicos) => p.evaluate(async ([categoria, servicos]) => {
  const { htmlDaPrevia } = await import('/src/lib/previa.jsx')
  return htmlDaPrevia({ tema: 'claro', negocio: { nome: 'Teste ' + categoria, categoria, whatsapp: 'https://wa.me/5569999990000', telefone: '(69) 99999-0000', endereco: 'Cacoal - RO' }, imagens: [], conteudo: { servicos } }, {}, '', { agua: false })
}, [categoria, servicos])
const msg = async (q) => decodeURIComponent((await q.locator('[data-enviar]').getAttribute('href')).split('text=')[1])

let q = await ctx.newPage(); q.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await q.setContent(await site('Barbearia', ['Corte', 'Barba', 'Corte + barba'])); await q.waitForTimeout(600)
ver('barbearia: seção "Peça seu horário"', await q.getByRole('heading', { name: 'Peça seu horário' }).count() === 1)
ver('sem escolher nada → mensagem geral', (await msg(q)) === 'Olá! Vi o site e quero agendar um horário.')
await q.getByRole('button', { name: 'Barba', exact: true }).click()
await q.getByRole('button', { name: 'Amanhã' }).click(); await q.getByRole('button', { name: 'Hoje' }).click() // só um "quando"
await q.getByRole('button', { name: 'Tarde' }).click()
await q.locator('[data-campo="nome"]').fill('João')
ver('agendar monta a mensagem', (await msg(q)) === 'Olá! Vi o site e quero agendar: Barba.\nQuando: hoje, à tarde.\nMeu nome é João.', JSON.stringify(await msg(q)))
await q.locator('#pedir').screenshot({ path: D + '/f2-barbearia.png' })
ver('sem rolagem lateral', await q.evaluate(() => document.documentElement.scrollWidth) === 390)

q = await ctx.newPage(); q.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await q.setContent(await site('Pizzaria', ['Calabresa', 'Marguerita', 'Portuguesa'])); await q.waitForTimeout(600)
const mais = (n) => q.locator(`[data-item="${n}"] [data-mais]`).click()
await mais('Calabresa'); await mais('Calabresa'); await mais('Portuguesa'); await q.locator('[data-item="Portuguesa"] [data-menos]').click(); await mais('Marguerita')
await q.getByRole('button', { name: 'Vou buscar' }).click()
await q.locator('[data-campo="texto"]').fill('sem cebola')
ver('pedido monta a lista', (await msg(q)) === 'Olá! Vi o site e quero fazer um pedido:\n• 2x Calabresa\n• 1x Marguerita\nVou buscar no local.\nObs.: sem cebola', JSON.stringify(await msg(q)))
ver('botão da capa diz "Fazer pedido"', await q.getByText('Fazer pedido pelo WhatsApp →').count() === 1)
await q.locator('#pedir').screenshot({ path: D + '/f2-pizzaria.png' })

q = await ctx.newPage(); q.on('pageerror', (e) => console.log('PAGEERROR', e.message))
const htmlBorr = await site('Borracharia', ['Conserto de pneu', 'Balanceamento'])
await q.route('https://borracharia.teste/**', (r) => r.fulfill({ contentType: 'text/html', body: htmlBorr }))
await q.goto('https://borracharia.teste/'); await q.waitForTimeout(600)
await q.getByRole('button', { name: 'Balanceamento' }).click(); await q.locator('[data-campo="texto"]').fill('Gol 2012, puxando pra direita')
ver('orçamento', (await msg(q)) === 'Olá! Vi o site e quero um orçamento de Balanceamento.\nGol 2012, puxando pra direita')
let destino = null
await q.route('https://wa.me/**', (r) => { destino = r.request().url(); r.fulfill({ body: 'ok' }) })
await q.locator('[data-socorro]').click(); await q.waitForTimeout(1500)
ver('socorro manda a localização', destino && decodeURIComponent(destino).includes('maps.google.com/?q=-11.43862,-61.44722'), decodeURIComponent(destino || '').slice(0, 120))

q = await ctx.newPage()
await q.setContent(await site('Loja de roupas', ['Vestidos'])); await q.waitForTimeout(400)
ver('loja de roupas: sem assistente (só conversa)', await q.locator('[data-assistente]').count() === 0)
await b.close()
