// Backend da Central de Agentes (Hono).
// Todas as chaves de API ficam aqui, lidas de process.env. Nunca no frontend.
//   local:  server/index.js  (npm run dev)
//   Vercel: api/index.js     (mesma app, via hono/vercel)

import { Hono } from 'hono'
import { buscarNegocios, conferirSite } from './pinguim.js'
import { buscarFotos, tirarPrint, linkPermitidoParaPrint } from './leao.js'
import { estudar, aprofundar } from './gato.js'
import { hospedar, listarPastas, temPasta } from './pasta.js'
import { enriquecer } from './abelha.js'
import { gravarVideo, servidorGrava, salvarNaPasta, abrirPasta } from './video.js'
import { creditosFirecrawl, erroDeCredito } from './firecrawlCreditos.js'
import { lugarDoApify, linkDoMaps } from './apify.js'
import { gravarNaNuvem, temVideoNuvem } from './videoNuvem.js'
import { enviarRelatorio, temEmail } from './aguia.js'
import { designsDoCastor, designDaImagem } from './castor.js'
import { imagemDoCastor, temImagem } from './castorImagem.js'
import { siteDaImagem, temSiteDaImagem } from './siteDaImagem.js'
import { lerLink, licoesDe, licoesSeguras } from './biblioteca.js'
import { temNuvem, codigoValido, lerDados, gravarDados } from './nuvem.js'
import { conectarZap, statusZap, enviarZap, lerConversaZap } from './zapWeb.js'
import { gerarMensagem, classificarResposta, enviarWhatsApp, enviarVideoZapi, publicarVercel, provedorWhatsApp } from './tigre.js'

// Aceita as chaves com outros nomes de variável (ex.: "google" ou "firecrawl" no Vercel):
// procura uma variável com aquele pedaço no nome e um valor no formato da chave.
function apelido(nome, pedacoDoNome, formato) {
  process.env[nome] ||=
    Object.entries(process.env).find(([k, v]) => pedacoDoNome.test(k) && formato.test(String(v).trim()))?.[1]?.trim() || ''
}
apelido('GOOGLE_PLACES_API_KEY', /google/i, /^AIza/)
apelido('FIRECRAWL_API_KEY', /fire/i, /^fc-/)
apelido('GROQ_API_KEY', /./, /^gsk_[A-Za-z0-9]{20,}$/) // qualquer nome ("groq", "grok", "ia"…): a chave da Groq começa com gsk_
apelido('GEMINI_API_KEY', /gemini|nano|banana/i, /^AIza/) // 🍌 Nano Banana (imagens do Castor)
apelido('SCREENSHOTONE_ACCESS_KEY', /screenshot/i, /^[\w-]{8,}$/)
apelido('RESEND_API_KEY', /./, /^re_[A-Za-z0-9_]{10,}$/)
apelido('AGUIA_EMAIL', /^(?!.*(git|vercel|npm|author|committer|claude)).*(mail|aguia|águia|resend)/i, /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i) // e-mail da Águia com qualquer nome parecido
apelido('APIFY_TOKEN', /ap[iy]f[iy]/i, /^apify_api_/) // "apify", "apyfi"…
apelido('SERPAPI_KEY', /serp/i, /^[0-9a-f]{64}$/)
apelido('BLOB_READ_WRITE_TOKEN', /blob/i, /^vercel_blob_rw_/)

// Corpo do pedido sempre como objeto: JSON quebrado, `null`, lista ou texto viram {} (antes `null` derrubava a rota com 500).
async function corpoDe(c) {
  const b = await c.req.json().catch(() => null)
  return b && typeof b === 'object' && !Array.isArray(b) ? b : {}
}

export const app = new Hono().basePath('/api')

const keys = () => ({
  googlePlaces: Boolean(process.env.GOOGLE_PLACES_API_KEY),
  serpapi: Boolean(process.env.SERPAPI_KEY),
  apify: Boolean(process.env.APIFY_TOKEN),
  firecrawl: Boolean(process.env.FIRECRAWL_API_KEY),
  claude: Boolean(process.env.ANTHROPIC_API_KEY),
  groq: Boolean(process.env.GROQ_API_KEY),
  whatsapp: Boolean(provedorWhatsApp()),
  whatsappProvedor: provedorWhatsApp(), // 'zapi' | 'meta' | null
  whatsappTemplate: Boolean(process.env.WHATSAPP_TEMPLATE),
  vercel: Boolean(process.env.VERCEL_TOKEN),
  pasta: temPasta(),
  nuvem: temNuvem(), // ☁️ dados salvos na nuvem (Upstash Redis)
  email: temEmail(), // 🦅 Águia manda relatório (Resend)
  emailDestino: Boolean(process.env.AGUIA_EMAIL),
  imagem: temImagem(),
  siteDaImagem: temSiteDaImagem(), // 🐈‍⬛ Gato monta o site igual à imagem do Castor // 🍌 Castor desenha os 3 modelos com o Nano Banana (Gemini)
  videoNuvem: temVideoNuvem(), // ScreenshotOne grava o vídeo da prévia (funciona no Vercel)
})

// videoServidor: o servidor tem navegador para gravar (computador); senão o vídeo é gravado no navegador do usuário.
app.get('/status', async (c) => {
  const [videoServidor, firecrawlCreditos] = await Promise.all([servidorGrava(), creditosFirecrawl()])
  return c.json({ ok: true, keys: { ...keys(), videoServidor }, firecrawlCreditos })
})

app.post('/pinguim/buscar', async (c) => {
  const { categoria, cidade } = await corpoDe(c)
  if (!categoria?.trim() || !cidade?.trim()) {
    return c.json({ error: 'Informe a categoria e a cidade.' }, 400)
  }
  return c.json(await buscarNegocios({ categoria: categoria.trim(), cidade: cidade.trim() }))
})

// Confere um negócio por vez (o app controla o ritmo para caber no limite por minuto do Firecrawl).
app.post('/pinguim/conferir', async (c) => {
  const { nome: nomeBruto, cidade, telefone } = await corpoDe(c)
  const nome = typeof nomeBruto === 'string' ? nomeBruto : ''
  if (!nome.trim()) return c.json({ error: 'Faltou o nome do negócio.' }, 400)
  if (!keys().firecrawl) return c.json({ error: 'FIRECRAWL_API_KEY não configurada no servidor.', code: 'NO_KEY' }, 503)
  try {
    return c.json(await conferirSite({ nome: nome.trim(), cidade, telefone }))
  } catch (e) {
    if (/limite de pedidos/.test(e.message)) return c.json({ error: e.message, code: 'LIMITE' }, 429)
    if (erroDeCredito(e.message)) return c.json({ error: 'Acabaram os créditos do Firecrawl.', code: 'SEM_CREDITO' }, 402)
    throw e
  }
})

app.post('/leao/fotos', async (c) => {
  const { fotos } = await corpoDe(c)
  if (!Array.isArray(fotos) || !fotos.length) return c.json({ fotos: [] })
  return c.json({ fotos: await buscarFotos(fotos) })
})

// Dados + todas as fotos de um lugar do Google Maps pelo Apify (não gasta Firecrawl).
app.post('/leao/lugar', async (c) => {
  const { url } = await corpoDe(c)
  if (!linkDoMaps(url)) return c.json({ error: 'Mande o link do Google Maps do negócio.' }, 400)
  if (!keys().apify) return c.json({ error: 'APIFY_TOKEN não configurado no servidor.', code: 'NO_KEY' }, 503)
  try {
    const lugar = await lugarDoApify(url)
    return lugar ? c.json(lugar) : c.json({ error: 'O Apify não achou esse lugar no Maps.' }, 404)
  } catch (e) {
    return c.json({ error: e.message }, 502)
  }
})

app.post('/leao/print', async (c) => {
  const { url } = await corpoDe(c)
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
  const corpo = await corpoDe(c)
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
  const { html, segundos, salvarComo } = await corpoDe(c)
  if (typeof html !== 'string' || !html.includes('<html')) return c.json({ error: 'Prévia inválida.' }, 400)
  if (html.length > 20_000_000) return c.json({ error: 'Prévia grande demais para gravar.' }, 413)
  // Sem navegador neste servidor (Vercel): quem chama aqui é uma versão antiga do app guardada no cache.
  if (!(await servidorGrava())) {
    return c.json(
      {
        error:
          'Este servidor não grava vídeo. Atualize a página com Ctrl + F5: a versão nova grava pelo seu navegador (Chrome ou Edge).',
        code: 'SEM_NAVEGADOR',
      },
      501,
    )
  }
  const { tipo, buffer } = await gravarVideo(html, { segundos: Math.min(40, Math.max(8, Number(segundos) || 20)) })
  // No notebook: guarda também em Vídeos\Central de Agentes\<nicho>\<comércio>.mp4 (pedido do usuário).
  const salvoEm = salvarComo ? await salvarNaPasta(buffer, tipo, salvarComo).catch(() => null) : null
  const extras = salvoEm ? { 'X-Salvo-Em': encodeURIComponent(salvoEm) } : {}
  return new Response(buffer, { headers: { 'Content-Type': tipo, 'Content-Length': String(buffer.length), ...extras } })
})

// Vídeo gravado na nuvem (ScreenshotOne): devolve o link do MP4; o navegador baixa direto de lá.
app.post('/gato/video-nuvem', async (c) => {
  const { html, segundos } = await corpoDe(c)
  if (typeof html !== 'string' || !html.includes('<html')) return c.json({ error: 'Prévia inválida.' }, 400)
  if (!temVideoNuvem()) return c.json({ error: 'Falta a SCREENSHOTONE_ACCESS_KEY no servidor.', code: 'NO_KEY' }, 503)
  try {
    return c.json(await gravarNaNuvem(html, { segundos: Number(segundos) || 20 }))
  } catch (e) {
    return c.json({ error: e.message }, 502)
  }
})

// Reserva: se o navegador não conseguir baixar direto do link da ScreenshotOne, o servidor repassa o vídeo.
app.get('/gato/video-nuvem/baixar', async (c) => {
  const u = c.req.query('u') || ''
  if (!/^https:\/\/([\w-]+\.)*screenshotone\.(com|io)\//.test(u)) return c.json({ error: 'Link não permitido.' }, 400)
  const res = await fetch(u)
  if (!res.ok) return c.json({ error: 'Não consegui baixar o vídeo.' }, 502)
  return new Response(res.body, { headers: { 'Content-Type': res.headers.get('content-type') || 'video/mp4' } })
})

// 📲 WhatsApp Web pelo notebook (só no servidor local, que tem navegador). Enviar só depois do clique "Aprovar e enviar".
const soNoNotebook = async (c) =>
  (await servidorGrava()) ? null : c.json({ error: 'Só funciona com o app rodando no seu notebook (iniciar-windows.bat).', code: 'SO_LOCAL' }, 501)
app.post('/zap/conectar', async (c) => (await soNoNotebook(c)) || c.json(await conectarZap()))
app.get('/zap/status', async (c) => (await soNoNotebook(c)) || c.json(await statusZap()))
app.post('/zap/enviar', async (c) => {
  const nega = await soNoNotebook(c)
  if (nega) return nega
  const { telefone, texto, video, tipoVideo, aprovado } = await corpoDe(c)
  if (aprovado !== true) return c.json({ error: 'Envio só com a sua aprovação.' }, 403)
  if (!telefone || (!texto && !video)) return c.json({ error: 'Faltou o telefone ou a mensagem.' }, 400)
  try {
    return c.json(await enviarZap({ telefone, texto, video, tipoVideo }))
  } catch (e) {
    return c.json({ error: e.message }, 502)
  }
})
app.post('/zap/ler', async (c) => {
  const nega = await soNoNotebook(c)
  if (nega) return nega
  const { telefone } = await corpoDe(c)
  if (String(telefone || '').replace(/\D/g, '').length < 10) return c.json({ error: 'Faltou o telefone do cliente.' }, 400)
  try {
    return c.json(await lerConversaZap(telefone))
  } catch (e) {
    return c.json({ error: e.message }, 502)
  }
})

// ☁️ Dados do app na nuvem, pelo código da conta (o mesmo em todos os aparelhos).
app.get('/dados', async (c) => {
  const codigo = c.req.query('codigo')
  if (!temNuvem()) return c.json({ error: 'Nuvem desligada.', code: 'NO_KEY' }, 503)
  if (!codigoValido(codigo)) return c.json({ error: 'Código inválido.' }, 400)
  return c.json({ dados: await lerDados(codigo) })
})
app.put('/dados', async (c) => {
  const { codigo, dados } = await corpoDe(c)
  if (!temNuvem()) return c.json({ error: 'Nuvem desligada.', code: 'NO_KEY' }, 503)
  if (!codigoValido(codigo) || !dados || typeof dados !== 'object') return c.json({ error: 'Pedido inválido.' }, 400)
  return c.json(await gravarDados(codigo, dados))
})

// 🦫 Castor: 3 design systems criados pela Groq para o comércio (sem Groq: o app usa a matriz por nicho).
// 🍌 Imagem de um modelo do Castor (Nano Banana). Uma por pedido (limite de ~4,5 MB da função do Vercel).
app.post('/castor/imagem', async (c) => {
  if (!temImagem()) return c.json({ error: 'GEMINI_API_KEY não configurada no servidor.', code: 'NO_KEY' }, 503)
  const { categoria, design } = await corpoDe(c)
  if (!design?.paleta_cores) return c.json({ error: 'Mande o design do Castor.' }, 400)
  try {
    return c.json(await imagemDoCastor({ categoria: String(categoria || '').slice(0, 60), design }))
  } catch (e) {
    return c.json({ error: e.message }, 502)
  }
})

// 📤 Lê uma imagem de modelo de site (feita no Gemini) e devolve o design + nota (Groq com visão).
app.post('/castor/ler-imagem', async (c) => {
  if (!process.env.GROQ_API_KEY) return c.json({ error: 'Sem GROQ_API_KEY — as cores são tiradas da imagem no navegador.', code: 'NO_KEY' }, 503)
  const { imagem, categoria } = await corpoDe(c)
  if (!/^data:image\/(png|jpe?g|webp);base64,/.test(String(imagem || ''))) return c.json({ error: 'Mande a imagem (PNG, JPG ou WEBP).' }, 400)
  try {
    return c.json(await designDaImagem({ imagem, categoria: String(categoria || '').slice(0, 60) }))
  } catch (e) {
    return c.json({ error: e.message }, 502)
  }
})

// 🐈‍⬛ Gato monta o site igual à imagem escolhida no Castor (layout + estilo), com os dados e fotos reais.
app.post('/gato/site-da-imagem', async (c) => {
  if (!temSiteDaImagem()) return c.json({ error: 'Configure GEMINI_API_KEY ou GROQ_API_KEY para o Gato montar o site pela imagem.', code: 'NO_KEY' }, 503)
  const { imagem, negocio, conteudo, fotos, antesDepois, agendamento, licoes } = await corpoDe(c)
  if (!/^data:image\/(png|jpe?g|webp);base64,/.test(String(imagem || ''))) return c.json({ error: 'Mande a imagem do modelo.' }, 400)
  try {
    const n = Math.max(0, Math.min(12, Number(fotos) || 0))
    const pares = (Array.isArray(antesDepois) ? antesDepois : [])
      .map((p) => ({ antes: Number(p?.antes), depois: Number(p?.depois), legenda: String(p?.legenda || '').slice(0, 80) || undefined }))
      .filter((p) => p.antes >= 1 && p.antes <= n && p.depois >= 1 && p.depois <= n && p.antes !== p.depois)
      .slice(0, 4)
    return c.json(await siteDaImagem({ imagem, negocio: negocio || {}, conteudo: conteudo || {}, fotos: n, antesDepois: pares, agendamento: Boolean(agendamento), licoes: licoesSeguras(licoes) }))
  } catch (e) {
    return c.json({ error: e.message }, 502)
  }
})

// 📚 Biblioteca do Gato: ler um link (sem Firecrawl) e tirar lições de um material (link, PDF ou texto colado).
app.post('/gato/biblioteca/ler-link', async (c) => {
  const { url } = await corpoDe(c)
  try {
    return c.json(await lerLink(String(url || '').trim()))
  } catch (e) {
    return c.json({ error: e.name === 'TimeoutError' ? 'O site demorou demais para responder.' : e.message }, 400)
  }
})

app.post('/gato/biblioteca/licoes', async (c) => {
  const b = await corpoDe(c)
  if (!String(b.texto || '').trim()) return c.json({ error: 'Material vazio.' }, 400)
  try {
    return c.json(await licoesDe({ titulo: String(b.titulo || '').slice(0, 150), tipo: b.tipo, texto: b.texto, tecnicas: (b.tecnicas || []).slice(0, 30), fontes: (b.fontes || []).slice(0, 6) }))
  } catch (e) {
    return c.json({ error: e.message, code: e.code }, e.code === 'NO_KEY' ? 503 : 502)
  }
})

app.post('/castor/design', async (c) => {
  const b = await corpoDe(c)
  if (!process.env.GROQ_API_KEY) return c.json({ error: 'Sem GROQ_API_KEY — o Castor usa a matriz por nicho.', code: 'NO_KEY' }, 503)
  try {
    return c.json({ propostas: await designsDoCastor(b), fonte: 'groq' })
  } catch (e) {
    return c.json({ error: e.message }, 502)
  }
})

// 🦅 Águia: relatório do processo por e-mail.
app.post('/aguia/email', async (c) => {
  const { assunto, texto, para } = await corpoDe(c)
  if (!temEmail()) return c.json({ error: 'Falta a chave do Resend (RESEND_API_KEY) no servidor.', code: 'NO_KEY' }, 503)
  try {
    return c.json(await enviarRelatorio({ assunto, texto, para }))
  } catch (e) {
    return c.json({ error: e.message }, 502)
  }
})

// Abre no Explorador de Arquivos a pasta onde o vídeo foi salvo (só no notebook, só dentro da pasta dos vídeos).
app.post('/gato/abrir-pasta', async (c) => {
  const { arquivo } = await corpoDe(c)
  if (!(await servidorGrava())) return c.json({ error: 'Só funciona com o app rodando no seu computador.' }, 501)
  const ok = await abrirPasta(arquivo)
  return ok ? c.json({ ok: true }) : c.json({ error: 'Pasta não encontrada.' }, 404)
})

app.post('/gato/estudar', async (c) => {
  const { categoria, modelos } = await corpoDe(c)
  if (!keys().firecrawl) {
    return c.json({ error: 'FIRECRAWL_API_KEY não configurada no servidor.', code: 'NO_KEY' }, 503)
  }
  return c.json(await estudar(categoria || 'comércio local', modelos))
})

// Uma rodada do estudo longo do Gato (o app chama uma por minuto).
app.post('/gato/aprofundar', async (c) => {
  const { categoria, rodada, lidos } = await corpoDe(c)
  if (!keys().firecrawl) {
    return c.json({ error: 'FIRECRAWL_API_KEY não configurada no servidor.', code: 'NO_KEY' }, 503)
  }
  return c.json(await aprofundar(categoria || 'comércio local', Number(rodada) || 1, Array.isArray(lidos) ? lidos : []))
})

app.post('/tigre/mensagem', async (c) => {
  const { tipo, negocio, historico, url } = await corpoDe(c)
  if (!negocio?.nome) return c.json({ error: 'Faltam os dados do negócio.' }, 400)
  return c.json(await gerarMensagem({ tipo: tipo || 'primeiro', negocio, historico, url }))
})

app.post('/tigre/classificar', async (c) => {
  const { texto: textoBruto } = await corpoDe(c)
  const texto = typeof textoBruto === 'string' ? textoBruto : ''
  if (!texto.trim()) return c.json({ error: 'Cole a resposta do cliente.' }, 400)
  return c.json(await classificarResposta(texto.trim()))
})

// Só é chamado pela interface depois do clique em "Aprovar e enviar".
app.post('/tigre/enviar', async (c) => {
  if (!keys().whatsapp) {
    return c.json({ error: 'Envio pelo WhatsApp não configurado no servidor (Z-API ou Meta).', code: 'NO_KEY' }, 503)
  }
  const { telefone, texto, primeiroContato, nome, aprovado } = await corpoDe(c)
  if (aprovado !== true) return c.json({ error: 'Mensagem sem aprovação do usuário.' }, 400)
  return c.json(await enviarWhatsApp({ telefone, texto, primeiroContato, nome }))
})

app.post('/tigre/video', async (c) => {
  const { telefone, video, legenda, aprovado } = await corpoDe(c)
  if (aprovado !== true) return c.json({ error: 'Vídeo sem aprovação do usuário.' }, 400)
  return c.json(await enviarVideoZapi({ telefone, video, legenda }))
})

app.post('/tigre/publicar', async (c) => {
  if (!keys().vercel) return c.json({ error: 'VERCEL_TOKEN não configurado no servidor.', code: 'NO_KEY' }, 503)
  const { nome, arquivos, pagamentoConfirmado } = await corpoDe(c)
  if (pagamentoConfirmado !== true) return c.json({ error: 'Confirme o pagamento antes de publicar.' }, 400)
  if (!Array.isArray(arquivos) || !arquivos.length) return c.json({ error: 'Nenhum arquivo para publicar.' }, 400)
  const slug = String(nome || 'site').toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 90)
  return c.json(await publicarVercel({ nome: slug, arquivos }))
})

app.post('/abelha/enriquecer', async (c) => {
  const { negocio } = await corpoDe(c)
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
