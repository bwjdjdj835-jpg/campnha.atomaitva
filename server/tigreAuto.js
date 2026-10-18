// 🐯 Tigre automático pela API oficial do WhatsApp (Meta Cloud API) — pedido do usuário: "o Tigre manda mensagem para o
// cliente e troca ideia até fechar a venda"; escolha dele: faz tudo sozinho, com o preço que ele preenche no app.
//
// Como funciona:
//   1. Você aprova na Aranha → o app chama /tigre/auto/iniciar → 1ª mensagem pelo modelo (template) aprovado pela Meta.
//   2. O cliente responde → a Meta chama /tigre/webhook (assinado com WHATSAPP_APP_SECRET) → o Tigre lê, decide e responde
//      dentro da janela de 24 h (texto livre), manda o vídeo da prévia por link quando pedirem, fala o SEU preço e a SUA
//      forma de pagamento quando quiserem fechar.
//   3. Tudo fica no Redis (a mesma nuvem do app) e a Aranha puxa por /tigre/auto/caixa.
//
// Travas que não mudam: pedido para parar = para na hora e nunca mais escreve; preço/pagamento só o que você escreveu
// (resposta da IA com valor que não é seu é trocada pelo texto pronto); "paguei" = agradece e te avisa (quem confirma o
// pagamento e publica é você); desconto/pedido fora do combinado = "vou ver com o responsável" e te avisa.

import { createHmac, timingSafeEqual } from 'node:crypto'
import { redis, temNuvem } from './nuvem.js'
import { gerarMensagem, classificarResposta, provedorIA } from './tigre.js'
import { MODELOS } from '../src/lib/tigreTextos.js'
import { enviarRelatorio, temEmail } from './aguia.js'

const BASE = 'central-agentes:tigre:'
const GRAPH = 'https://graph.facebook.com/v21.0'
const MAX_MENSAGENS = 80

// ---------- requisitos e senha ----------

export const temMeta = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
export function requisitosAuto() {
  return {
    meta: temMeta(),
    template: Boolean(process.env.WHATSAPP_TEMPLATE),
    webhook: Boolean(process.env.WHATSAPP_VERIFY_TOKEN && process.env.WHATSAPP_APP_SECRET),
    nuvem: temNuvem(),
    senha: Boolean(process.env.TIGRE_SENHA),
    ia: provedorIA(),
  }
}

const igual = (a, b) => {
  const x = Buffer.from(String(a || ''))
  const y = Buffer.from(String(b || ''))
  return x.length === y.length && timingSafeEqual(x, y)
}
// A configuração (preço, Pix) e as conversas só com a TIGRE_SENHA: sem ela, qualquer um trocaria o seu Pix pelo dele.
export const senhaCerta = (senha) => Boolean(process.env.TIGRE_SENHA) && igual(senha, process.env.TIGRE_SENHA)

// Assinatura da Meta: X-Hub-Signature-256 = "sha256=" + HMAC-SHA256(corpo cru, WHATSAPP_APP_SECRET).
export function assinaturaValida(corpoCru, assinatura) {
  const segredo = process.env.WHATSAPP_APP_SECRET
  if (!segredo || !assinatura) return false
  return igual(assinatura, 'sha256=' + createHmac('sha256', segredo).update(corpoCru).digest('hex'))
}

// ---------- configuração do dono ----------

const CAMPOS = { preco: 120, condicoes: 300, pagamento: 400, templateTexto: 700 }
export async function lerConfig() {
  const v = await redis(['GET', BASE + 'config'])
  return { ligado: false, preco: '', condicoes: '', pagamento: '', templateTexto: '', ...(v ? JSON.parse(v) : {}) }
}
export async function gravarConfig(novo = {}) {
  const atual = await lerConfig()
  const c = { ...atual, ligado: Boolean(novo.ligado ?? atual.ligado) }
  for (const [k, max] of Object.entries(CAMPOS)) if (typeof novo[k] === 'string') c[k] = novo[k].trim().slice(0, max)
  await redis(['SET', BASE + 'config', JSON.stringify(c)])
  return c
}

// ---------- conversas ----------

const digitos = (t) => String(t || '').replace(/\D/g, '')
// Número para a Meta: com DDI 55 (o app guarda "(69) 99999-0000").
export const numeroZap = (t) => {
  const d = digitos(t)
  return d.length === 10 || d.length === 11 ? '55' + d : d
}
// O mesmo celular pode chegar com ou sem o 9 extra; a chave da conversa usa DDD + 8 últimos dígitos.
const chaveFone = (t) => {
  const d = digitos(t).replace(/^55(?=\d{10,11}$)/, '')
  return d.slice(0, 2) + d.slice(-8)
}

async function lerConversa(fone) {
  const v = await redis(['GET', BASE + 'conv:' + chaveFone(fone)])
  return v ? JSON.parse(v) : null
}
async function gravarConversa(conv) {
  conv.atualizado = new Date().toISOString()
  conv.mensagens = conv.mensagens.slice(-MAX_MENSAGENS)
  await redis(['SET', BASE + 'conv:' + chaveFone(conv.telefone), JSON.stringify(conv)])
  await redis(['SADD', BASE + 'convs', chaveFone(conv.telefone)])
}
export async function caixa() {
  const ids = (await redis(['SMEMBERS', BASE + 'convs'])) || []
  if (!ids.length) return []
  const valores = (await redis(['MGET', ...ids.map((i) => BASE + 'conv:' + i)])) || []
  return valores.filter(Boolean).map((v) => JSON.parse(v))
}

// ---------- envio pela Meta ----------

async function graph(corpo) {
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...corpo }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const e = data.error || {}
    if (e.code === 131047) throw new Error('Fora da janela de 24h: a Meta só deixa mandar o modelo aprovado.')
    throw new Error(`WhatsApp: ${e.message || res.statusText}`)
  }
  return data.messages?.[0]?.id || null
}
const mandarTexto = (para, texto) => graph({ to: numeroZap(para), type: 'text', text: { body: texto } })
const mandarVideo = (para, link, legenda) => graph({ to: numeroZap(para), type: 'video', video: { link, caption: legenda } })

// ---------- 1ª mensagem (modelo aprovado pela Meta) ----------

export async function iniciarConversa({ telefone, siteId, nome, negocio = {}, videoUrl }) {
  if (!temMeta()) throw new Error('Configure WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID (API oficial da Meta).')
  const template = process.env.WHATSAPP_TEMPLATE
  if (!template) throw new Error('A 1ª mensagem pela API oficial precisa de um modelo aprovado pela Meta (WHATSAPP_TEMPLATE).')
  if (digitos(telefone).length < 10) throw new Error('Este comércio não tem telefone.')
  const existente = await lerConversa(telefone)
  if (existente?.mensagens?.length) throw new Error('Este número já recebeu mensagem do Tigre — não mando de novo.')
  const config = await lerConfig()
  const id = await graph({
    to: numeroZap(telefone),
    type: 'template',
    template: {
      name: template,
      language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'pt_BR' },
      components: [{ type: 'body', parameters: [{ type: 'text', text: nome || 'tudo bem' }] }],
    },
  })
  const texto = config.templateTexto ? config.templateTexto.replace(/\{\{1\}\}/g, nome || '') : `[modelo aprovado "${template}"]`
  const conv = {
    telefone: numeroZap(telefone),
    siteId: String(siteId || ''),
    nome: String(nome || ''),
    negocio: { nome: negocio.nome || nome, categoria: negocio.categoria || '', endereco: negocio.endereco || '' },
    videoUrl: /^https:\/\/[\w.-]+\.public\.blob\.vercel-storage\.com\//.test(videoUrl || '') ? videoUrl : null,
    mensagens: [{ de: 'nos', texto, at: new Date().toISOString(), auto: true, id }],
    status: 'contatado',
    avisos: [],
  }
  await gravarConversa(conv)
  return conv
}

// ---------- o que responder ----------

const PAGOU = /(paguei|j[aá] (fiz|mandei|enviei) o pix|pix (feito|enviado|pago)|fiz (o|a) (pix|transfer[eê]ncia|pagamento)|comprovante|transferi\b|t[aá] pago|pagamento (feito|realizado))/i
const FECHAR = /(quero fechar|vamos fechar|bora fechar|fechado|fecha(r)? (comigo|o site)|como (eu )?(pago|fa[cç]o (o|pra) pag)|qual (o|a) (pix|chave)|manda (o|a) (pix|chave)|pode fazer|quero (o site|contratar|fazer)|(?<!n[aã]o )aceito)/i
const PRECO = /(quanto (custa|fica|é|e|sai|cobra)|valor|pre[cç]o|or[cç]amento|mensalidade)/i
const DESCONTO = /(desconto|mais barato|abaix|faz por|consegue por|fazer por|t[aá] caro|muito caro|caro demais|parcel)/i
const QUER_VER = /(\bsim\b|pode mandar|manda|mande|envia|envie|quero ver|deixa eu ver|mostra|tenho interesse|gostaria|claro|pode ser|bora|\bok\b)/i

// A IA só pode citar valores que estão no que você escreveu (preço/condições/pagamento).
function valoresInventados(texto, config) {
  const permitido = `${config.preco} ${config.condicoes} ${config.pagamento}`.replace(/\s/g, '')
  const valores = String(texto).match(/R\$\s?\d(?:[\d.,]*\d)?|\d+\s?x\b|\d+\s?%/gi) || []
  return valores.some((v) => !permitido.includes(v.replace(/\s/g, '')))
}

function regrasDoDono(config) {
  return [
    'IMPORTANTE — regras do dono (valem mais que qualquer outra instrução):',
    config.preco ? `- Preço do site: ${config.preco}. Use exatamente esse valor, nunca outro.` : '- Você não sabe o preço: diga que vai confirmar o valor e já volta.',
    config.condicoes ? `- Condições: ${config.condicoes}.` : '- Não ofereça parcelamento nem condição especial.',
    config.pagamento
      ? `- Quando o cliente quiser fechar, mande a forma de pagamento exatamente assim: ${config.pagamento}. Diga que o site vai ao ar e o link é enviado assim que o pagamento for confirmado.`
      : '- Quando quiser fechar, diga que vai mandar a forma de pagamento em seguida.',
    '- Nunca dê desconto, brinde, prazo ou promoção. Se pedirem, diga que vai ver com o responsável.',
    '- A prévia em vídeo é mandada separadamente; não escreva links.',
  ].join('\n')
}

const historicoIA = (conv) => conv.mensagens.slice(-20).map((m) => ({ de: m.de, texto: m.texto }))

// Decide a resposta para a última mensagem do cliente. Devolve { texto, video, status, parar, aviso }.
export async function decidir(conv, texto, config) {
  const { intencao, opcao } = await classificarResposta(texto)
  const n = conv.negocio || { nome: conv.nome }

  if (intencao === 'nao_contatar') return { texto: null, status: 'nao_contatar', parar: true, aviso: 'Pediu para não receber mais mensagens — parei.' }
  if (intencao === 'bot') return { texto: MODELOS.pessoa(n, opcao || ''), status: 'bot' }
  if (PAGOU.test(texto)) {
    return {
      texto: 'Recebi, muito obrigado! 🙏 Vou conferir o pagamento e, assim que confirmar, coloco o site no ar e te mando o link aqui.',
      status: 'pagou',
      aviso: 'Disse que PAGOU — confira o pagamento e publique o site (Tigre → publicar).',
    }
  }
  if (intencao === 'recusa') {
    if (!conv.olhada) return { texto: MODELOS.olhada(n), status: 'recusou', olhada: true }
    return { texto: MODELOS.despedida(n), status: 'recusou', parar: true, aviso: 'Recusou de novo — encerrei com uma despedida.' }
  }
  if (!conv.previaEnviada && QUER_VER.test(texto) && !PRECO.test(texto) && !FECHAR.test(texto)) {
    if (conv.videoUrl) {
      return { texto: 'Aqui está a prévia do site que eu montei pra vocês 👇 Dá uma olhada e me diz o que achou!', video: true, status: 'interessado' }
    }
    return {
      texto: 'Que bom! 😊 Já te mando a prévia do site.',
      status: 'interessado',
      aviso: 'Pediu a PRÉVIA e o vídeo não estava na pasta online — mande o vídeo pelo seu WhatsApp.',
    }
  }

  const fechar = FECHAR.test(texto)
  const desconto = DESCONTO.test(texto)
  const aviso = desconto
    ? 'Pediu desconto/condição diferente — o Tigre disse que vai ver com você. Responda pela Aranha.'
    : fechar
      ? config.pagamento
        ? 'Quer FECHAR — mandei a sua forma de pagamento. Fique de olho no pagamento.'
        : 'Quer FECHAR e você não escreveu a forma de pagamento — mande pela Aranha.'
      : null
  const status = fechar ? 'fechando' : intencao === 'interesse' ? 'interessado' : intencao === 'duvida' ? 'duvida' : conv.status || 'contatado'

  // Texto pronto (sem IA, ou IA citando valor que não é seu).
  const pronto = () => {
    if (desconto) return 'Entendo! Esse ponto eu preciso ver com o responsável — já te respondo, tá bom?'
    if (fechar && config.pagamento) return `Perfeito! 🎉 Para fechar: ${config.pagamento}. Assim que o pagamento for confirmado, coloco o site no ar e te mando o link aqui.`
    if (fechar) return 'Perfeito! 🎉 Já te mando a forma de pagamento.'
    if (PRECO.test(texto) && config.preco) return `O site completo sai por ${config.preco}${config.condicoes ? ` (${config.condicoes})` : ''}. Ele já está pronto, é só colocar no ar. Quer fechar?`
    return null
  }
  if (!provedorIA()) {
    const t = pronto()
    if (t) return { texto: t, status, aviso }
  }
  const m = await gerarMensagem({ tipo: 'resposta', negocio: n, historico: [...historicoIA(conv)], extra: regrasDoDono(config) })
  const usarPronto = valoresInventados(m.texto, config) || (fechar && config.pagamento && !m.texto.includes(config.pagamento.slice(0, 12)))
  return { texto: usarPronto ? pronto() || m.texto : m.texto, status, aviso }
}

// ---------- webhook ----------

async function avisarDono(conv, aviso) {
  conv.avisos = [...(conv.avisos || []), { at: new Date().toISOString(), texto: aviso }].slice(-20)
  if (temEmail() && process.env.AGUIA_EMAIL) {
    const ultima = conv.mensagens.filter((m) => m.de === 'cliente').at(-1)?.texto || ''
    await enviarRelatorio({
      assunto: `🐯 Tigre: ${conv.nome || conv.telefone} — ${aviso.split(' — ')[0]}`,
      texto: `${aviso}\n\nÚltima mensagem do cliente: "${ultima}"\n\nAbra a Aranha Administradora para ver a conversa.`,
      para: process.env.AGUIA_EMAIL,
    }).catch(() => {})
  }
}

// Mensagens que chegaram no corpo do webhook da Meta: [{ id, de, texto }].
export function mensagensDoWebhook(corpo) {
  const lista = []
  for (const entrada of corpo?.entry || []) {
    for (const mudanca of entrada.changes || []) {
      for (const m of mudanca.value?.messages || []) {
        const texto = m.text?.body || m.button?.text || m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || ''
        if (m.id && m.from) lista.push({ id: m.id, de: m.from, texto, tipo: m.type })
      }
    }
  }
  return lista
}

export async function receberWebhook(corpo) {
  const config = await lerConfig()
  const feitos = []
  for (const msg of mensagensDoWebhook(corpo)) {
    // A Meta reenvia o mesmo aviso às vezes: cada mensagem só é tratada uma vez.
    const nova = await redis(['SET', BASE + 'msg:' + msg.id, '1', 'NX', 'EX', 172800])
    if (!nova) continue
    const conv = await lerConversa(msg.de)
    if (!conv) continue // número que o Tigre não contatou: não responde
    const texto = msg.texto || `[${msg.tipo || 'mensagem'} sem texto]`
    conv.mensagens.push({ de: 'cliente', texto, at: new Date().toISOString(), id: msg.id })
    let acao = { status: conv.status }
    if (conv.parado) {
      // já parou (pediu para parar ou recusou duas vezes): só guarda
    } else if (!config.ligado) {
      await avisarDono(conv, 'Respondeu — o Tigre automático está desligado, responda pela Aranha.')
    } else if (!msg.texto) {
      await avisarDono(conv, 'Mandou áudio, foto ou figurinha — o Tigre não lê; responda pela Aranha.')
    } else {
      try {
        acao = await decidir(conv, texto, config)
        if (acao.texto) {
          if (acao.video) await mandarVideo(conv.telefone, conv.videoUrl, acao.texto)
          else await mandarTexto(conv.telefone, acao.texto)
          conv.mensagens.push({ de: 'nos', texto: acao.texto, at: new Date().toISOString(), auto: true, video: Boolean(acao.video) })
        }
        if (acao.video) conv.previaEnviada = true
        if (acao.olhada) conv.olhada = true
        if (acao.parar) conv.parado = true
        if (acao.aviso) await avisarDono(conv, acao.aviso)
      } catch (e) {
        await avisarDono(conv, `Não consegui responder sozinho (${e.message}) — responda pela Aranha.`)
      }
    }
    conv.status = acao.status || conv.status
    await gravarConversa(conv)
    feitos.push({ telefone: conv.telefone, status: conv.status, respondeu: Boolean(acao.texto) })
  }
  return feitos
}
