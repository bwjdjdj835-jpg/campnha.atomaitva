// 🧪 Tigre automático (webhook, senha, preço, Pix, parar) com Meta/Redis/IA simulados. Rodar: npm test
import { createHmac } from 'node:crypto'
Object.assign(process.env, { KV_REST_API_URL: 'https://kv.test', KV_REST_API_TOKEN: 't', WHATSAPP_TOKEN: 'wt', WHATSAPP_PHONE_NUMBER_ID: '123', WHATSAPP_TEMPLATE: 'oferta_site', WHATSAPP_VERIFY_TOKEN: 'verif', WHATSAPP_APP_SECRET: 'segredo', TIGRE_SENHA: 'minha-senha-forte' })
delete process.env.GROQ_API_KEY; delete process.env.ANTHROPIC_API_KEY
const db = new Map(), sets = new Map(), enviados = []
let groqResposta = null
globalThis.fetch = async (url, o = {}) => {
  const u = String(url); const body = o.body ? JSON.parse(o.body) : null
  const r = (status, b) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } })
  if (u.startsWith('https://kv.test')) {
    const [cmd, k, ...a] = body
    if (cmd === 'GET') return r(200, { result: db.get(k) ?? null })
    if (cmd === 'SET') { if (a.includes('NX') && db.has(k)) return r(200, { result: null }); db.set(k, a[0]); return r(200, { result: 'OK' }) }
    if (cmd === 'SADD') { const s = sets.get(k) || new Set(); s.add(a[0]); sets.set(k, s); return r(200, { result: 1 }) }
    if (cmd === 'SMEMBERS') return r(200, { result: [...(sets.get(k) || [])] })
    if (cmd === 'MGET') return r(200, { result: [k, ...a].map((x) => db.get(x) ?? null) })
  }
  if (u.includes('graph.facebook.com')) { enviados.push(body); return r(200, { messages: [{ id: 'wamid.' + enviados.length }] }) }
  if (u.includes('api.groq.com')) return r(200, { choices: [{ message: { content: groqResposta } }] })
  throw new Error('fetch inesperado ' + u)
}
const { app } = await import('../server/app.js')
const ver = (n, c, extra = '') => { console.log(c ? 'OK  ' : 'FALHA', n, extra); if (!c) process.exitCode = 1 }
const H = { 'Content-Type': 'application/json', 'x-tigre-senha': 'minha-senha-forte' }
const req = (m, p, b, h = H) => app.request('/api' + p, { method: m, headers: h, body: b ? JSON.stringify(b) : undefined })
let n = 0
const zap = async (texto, assinar = true) => {
  const corpo = JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ id: 'm' + ++n, from: '5569999990000', type: 'text', text: { body: texto } }] } }] }] })
  const sig = 'sha256=' + createHmac('sha256', assinar ? 'segredo' : 'outro').update(corpo).digest('hex')
  const res = await app.request('/api/tigre/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-hub-signature-256': sig }, body: corpo })
  return res
}
const ultimaEnviada = () => enviados.at(-1)

let res = await app.request('/api/tigre/webhook?hub.mode=subscribe&hub.verify_token=verif&hub.challenge=42')
ver('Meta confere o webhook', (await res.text()) === '42')
res = await app.request('/api/tigre/webhook?hub.mode=subscribe&hub.verify_token=errado&hub.challenge=42'); ver('token errado → 403', res.status === 403)
res = await req('PUT', '/tigre/auto', { ligado: true, pagamento: 'Pix golpista' }, { 'Content-Type': 'application/json', 'x-tigre-senha': 'chute' }); ver('senha errada não troca o Pix', res.status === 401)
res = await req('PUT', '/tigre/auto', { ligado: true, preco: 'R$ 497', condicoes: 'à vista ou 3x de R$ 175', pagamento: 'Pix CNPJ 12.345.678/0001-90 (Carmesin)', templateTexto: 'Olá, {{1}}! Fiz uma prévia de site pra vocês. Posso te mostrar?' })
ver('salva o preço com a senha', (await res.json()).config.preco === 'R$ 497')
res = await req('POST', '/tigre/auto/iniciar', { telefone: '(69) 99999-0000', siteId: 's1', nome: 'Barbearia Dom Pablo', negocio: { nome: 'Barbearia Dom Pablo', categoria: 'barbearia' }, videoUrl: 'https://abc.public.blob.vercel-storage.com/tigre/videos/s1-x.mp4' })
ver('1ª mensagem vai pelo modelo aprovado', ultimaEnviada().type === 'template' && ultimaEnviada().to === '5569999990000' && ultimaEnviada().template.components[0].parameters[0].text === 'Barbearia Dom Pablo')
res = await req('POST', '/tigre/auto/iniciar', { telefone: '69999990000', siteId: 's1', nome: 'X' }); ver('não manda a 1ª de novo para o mesmo número', res.status === 400)
const antes = enviados.length
res = await zap('sim', false); ver('webhook com assinatura falsa → 401 e não responde', res.status === 401 && enviados.length === antes)
await zap('sim, pode mandar'); ver('"pode mandar" → manda o VÍDEO por link', ultimaEnviada().type === 'video' && ultimaEnviada().video.link.includes('blob.vercel-storage.com'))
await zap('quanto fica?'); ver('preço → fala o SEU preço', ultimaEnviada().text?.body.includes('R$ 497'), ultimaEnviada().text?.body)
await zap('faz por 300?'); ver('desconto → "vou ver com o responsável"', /respons[aá]vel/.test(ultimaEnviada().text.body))
await zap('fechado, como eu pago?'); ver('quer fechar → manda o SEU Pix', ultimaEnviada().text.body.includes('Pix CNPJ 12.345.678/0001-90'), ultimaEnviada().text.body)
await zap('paguei, segue o comprovante'); ver('"paguei" → agradece e não publica sozinho', /conferir o pagamento/.test(ultimaEnviada().text.body))
res = await req('GET', '/tigre/auto/caixa'); let conv = (await res.json()).conversas[0]
ver('conversa guardada com status pagou e avisos para você', conv.status === 'pagou' && conv.avisos.length >= 3, `${conv.mensagens.length} msgs, avisos: ${conv.avisos.map((a) => a.texto.split(' — ')[0]).join(' | ')}`)
const qtd = enviados.length; await zap('sim'); await app.request('/api/tigre/webhook', { method: 'POST' })
// mesma mensagem duas vezes (Meta reenvia)
const corpo = JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ id: 'dup1', from: '5569999990000', type: 'text', text: { body: 'oi' } }] } }] }] })
const sig = 'sha256=' + createHmac('sha256', 'segredo').update(corpo).digest('hex')
for (let i = 0; i < 2; i++) await app.request('/api/tigre/webhook', { method: 'POST', headers: { 'x-hub-signature-256': sig }, body: corpo })
conv = (await (await req('GET', '/tigre/auto/caixa')).json()).conversas[0]
ver('mensagem repetida pela Meta é tratada 1 vez só', conv.mensagens.filter((m) => m.id === 'dup1').length === 1)
await zap('para de me mandar mensagem'); const depoisDeParar = enviados.length
await zap('oi?')
conv = (await (await req('GET', '/tigre/auto/caixa')).json()).conversas[0]
ver('pediu para parar → para e nunca mais escreve', conv.parado && conv.status === 'nao_contatar' && enviados.length === depoisDeParar)
// número desconhecido
const e0 = enviados.length
const c2 = JSON.stringify({ entry: [{ changes: [{ value: { messages: [{ id: 'z9', from: '5511988887777', type: 'text', text: { body: 'quem é?' } }] } }] }] })
await app.request('/api/tigre/webhook', { method: 'POST', headers: { 'x-hub-signature-256': 'sha256=' + createHmac('sha256', 'segredo').update(c2).digest('hex') }, body: c2 })
ver('número que o Tigre não contatou → não responde', enviados.length === e0)
// IA inventando preço
process.env.GROQ_API_KEY = 'gsk_teste'
const { decidir } = await import('../server/tigreAuto.js')
groqResposta = 'Faço por R$ 199 só hoje!'
let d = await decidir({ negocio: { nome: 'X' }, mensagens: [], status: 'contatado', previaEnviada: true }, 'quanto custa o site?', { preco: 'R$ 497', condicoes: '', pagamento: 'Pix X' })
ver('IA inventou R$ 199 → troca pelo texto com o SEU preço', d.texto.includes('R$ 497') && !d.texto.includes('199'), d.texto)
groqResposta = 'O site sai por R$ 497, já está prontinho! Quer que eu coloque no ar?'
d = await decidir({ negocio: { nome: 'X' }, mensagens: [], status: 'contatado', previaEnviada: true }, 'quanto custa o site?', { preco: 'R$ 497', condicoes: '', pagamento: 'Pix X' })
ver('IA com o preço certo → usa o texto da IA', d.texto.startsWith('O site sai por R$ 497, já'))
process.env.GROQ_API_KEY = ''; delete process.env.GROQ_API_KEY
d = await decidir({ negocio: { nome: 'X' }, mensagens: [], status: 'contatado', previaEnviada: true }, 'não aceito', { preco: 'R$ 497', condicoes: '', pagamento: 'Pix X' })
ver('"não aceito" → NÃO manda o Pix', !d.texto.includes('Pix X') && d.status === 'recusou', d.texto)
d = await decidir({ negocio: { nome: 'X' }, mensagens: [], status: 'contatado', previaEnviada: false, videoUrl: 'https://a.public.blob.vercel-storage.com/v.mp4' }, 'claro que não', { preco: 'R$ 497', condicoes: '', pagamento: 'Pix X' })
ver('"claro que não" → não manda o vídeo', !d.video && d.status === 'recusou', d.texto)
