// Backend da Central de Agentes (Hono).
// Todas as chaves de API ficam aqui, lidas de process.env. Nunca no frontend.
//   local:  server/index.js  (npm run dev)
//   Vercel: api/index.js     (mesma app, via hono/vercel)

import { Hono } from 'hono'
import { buscarNegocios } from './pinguim.js'
import { buscarFotos, tirarPrint, linkPermitidoParaPrint } from './leao.js'
import { estudar } from './gato.js'
import { hospedar, listarPastas, temPasta } from './pasta.js'
import { enriquecer } from './abelha.js'
import { gravarVideo } from './video.js'
import { gerarMensagem, classificarResposta, enviarWhatsApp, enviarVideoZapi, publicarVercel, provedorWhatsApp } from './tigre.js'

// Aceita as chaves com outros nomes de variável (ex.: "google" ou "firecrawl" no Vercel):
// procura uma variável com aquele pedaço no nome e um valor no formato da chave.
function apelido(nome, pedacoDoNome, formato) {
  process.env[nome] ||=
    Object.entries(process.env).find(([k, v]) => pedacoDoNome.test(k) && formato.test(String(v).trim()))?.[1]?.trim() || ''
}
apelido('GOOGLE_PLACES_API_KEY', /google/i, /^AIza/)
apelido('FIRECRAWL_API_KEY', /fire/i, /^fc-/)
apelido('BLOB_READ_WRITE_TOKEN', /blob/i, /^vercel_blob_rw_/)

export const app = new Hono().basePath('/api')

const keys = () => ({
  googlePlaces: Boolean(process.env.GOOGLE_PLACES_API_KEY),
  serpapi: Boolean(process.env.SERPAPI_KEY),
  apify: Boolean(process.env.APIFY_TOKEN),
  firecrawl: Boolean(process.env.FIRECRAWL_API_KEY),
  claude: Boolean(process.env.ANTHROPIC_API_KEY),
  whatsapp: Boolean(provedorWhatsApp()),
  whatsappProvedor: provedorWhatsApp(), // 'zapi' | 'meta' | null
  whatsappTemplate: Boolean(process.env.WHATSAPP_TEMPLATE),
  vercel: Boolean(process.env.VERCEL_TOKEN),
  pasta: temPasta(),
})

app.get('/status', (c) => c.json({ ok: true, keys: keys() }))

app.post('/pinguim/buscar', async (c) => {
  const { categoria, cidade } = await c.req.json().catch(() => ({}))
  if (!categoria?.trim() || !cidade?.trim()) {
    return c.json({ error: 'Informe a categoria e a cidade.' }, 400)
  }
  return c.json(await buscarNegocios({ categoria: categoria.trim(), cidade: cidade.trim() }))
})

app.post('/leao/fotos', async (c) => {
  const { fotos } = await c.req.json().catch(() => ({}))
  if (!Array.isArray(fotos) || !fotos.length) return c.json({ fotos: [] })
  return c.json({ fotos: await buscarFotos(fotos) })
})

app.post('/leao/print', async (c) => {
  const { url } = await c.req.json().catch(() => ({}))
  if (!linkPermitidoParaPrint(url)) {
    return c.json({ error: 'Só tiro print de links do Google Maps, Instagram ou Facebook.' }, 400)
  }
  if (!keys().firecrawl) {
    return c.json({ error: 'FIRECRAWL_API_KEY não configurada no servidor.', code: 'NO_KEY' }, 503)
  }
  return c.json(await tirarPrint(url))
})

// Pasta online do Leão (Vercel Blob): um arquivo por requisição.
app.post('/leao/hospedar', async (c) => {
  if (!temPasta()) {
    return c.json({ error: 'Pasta online desligada: conecte um Blob Store ao projeto no Vercel.', code: 'NO_KEY' }, 503)
  }
  const corpo = await c.req.json().catch(() => ({}))
  try {
    return c.json(await hospedar(corpo))
  } catch (e) {
    return c.json({ error: e.message }, 400)
  }
})

app.get('/leao/pastas', async (c) => {
  if (!temPasta()) return c.json({ pastas: [] })
  return c.json({ pastas: await listarPastas() })
})

app.post('/gato/video', async (c) => {
  const { html } = await c.req.json().catch(() => ({}))
  if (typeof html !== 'string' || !html.includes('<html')) return c.json({ error: 'Prévia inválida.' }, 400)
  if (html.length > 20_000_000) return c.json({ error: 'Prévia grande demais para gravar.' }, 413)
  const { tipo, buffer } = await gravarVideo(html)
  return new Response(buffer, { headers: { 'Content-Type': tipo, 'Content-Length': String(buffer.length) } })
})

app.post('/gato/estudar', async (c) => {
  const { categoria } = await c.req.json().catch(() => ({}))
  if (!keys().firecrawl) {
    return c.json({ error: 'FIRECRAWL_API_KEY não configurada no servidor.', code: 'NO_KEY' }, 503)
  }
  return c.json(await estudar(categoria || 'comércio local'))
})

app.post('/tigre/mensagem', async (c) => {
  const { tipo, negocio, historico, url } = await c.req.json().catch(() => ({}))
  if (!negocio?.nome) return c.json({ error: 'Faltam os dados do negócio.' }, 400)
  return c.json(await gerarMensagem({ tipo: tipo || 'primeiro', negocio, historico, url }))
})

app.post('/tigre/classificar', async (c) => {
  const { texto } = await c.req.json().catch(() => ({}))
  if (!texto?.trim()) return c.json({ error: 'Cole a resposta do cliente.' }, 400)
  return c.json(await classificarResposta(texto.trim()))
})

// Só é chamado pela interface depois do clique em "Aprovar e enviar".
app.post('/tigre/enviar', async (c) => {
  if (!keys().whatsapp) {
    return c.json({ error: 'Envio pelo WhatsApp não configurado no servidor (Z-API ou Meta).', code: 'NO_KEY' }, 503)
  }
  const { telefone, texto, primeiroContato, nome, aprovado } = await c.req.json().catch(() => ({}))
  if (aprovado !== true) return c.json({ error: 'Mensagem sem aprovação do usuário.' }, 400)
  return c.json(await enviarWhatsApp({ telefone, texto, primeiroContato, nome }))
})

app.post('/tigre/video', async (c) => {
  const { telefone, video, legenda, aprovado } = await c.req.json().catch(() => ({}))
  if (aprovado !== true) return c.json({ error: 'Vídeo sem aprovação do usuário.' }, 400)
  return c.json(await enviarVideoZapi({ telefone, video, legenda }))
})

app.post('/tigre/publicar', async (c) => {
  if (!keys().vercel) return c.json({ error: 'VERCEL_TOKEN não configurado no servidor.', code: 'NO_KEY' }, 503)
  const { nome, arquivos, pagamentoConfirmado } = await c.req.json().catch(() => ({}))
  if (pagamentoConfirmado !== true) return c.json({ error: 'Confirme o pagamento antes de publicar.' }, 400)
  if (!Array.isArray(arquivos) || !arquivos.length) return c.json({ error: 'Nenhum arquivo para publicar.' }, 400)
  const slug = String(nome || 'site').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 90)
  return c.json(await publicarVercel({ nome: slug, arquivos }))
})

app.post('/abelha/enriquecer', async (c) => {
  const { negocio } = await c.req.json().catch(() => ({}))
  if (!negocio?.nome) return c.json({ error: 'Faltam os dados do negócio.' }, 400)
  if (!keys().firecrawl) {
    return c.json({ error: 'FIRECRAWL_API_KEY não configurada no servidor.', code: 'NO_KEY' }, 503)
  }
  return c.json(await enriquecer(negocio))
})

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: err.message || 'Erro interno' }, 500)
})
