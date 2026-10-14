// 🐯 Tigre — mensagens para o cliente, leitura das respostas, envio pelo WhatsApp e publicação.
// Regras (prompts/04-tigre.md): nada sai sem aprovação do usuário (a interface só chama /enviar
// depois do clique), sem disparo em massa, e "não contatar" é respeitado.
//
// Cada integração é opcional:
//   ANTHROPIC_API_KEY  → Claude escreve as mensagens e lê as respostas (sem ela: modelos fixos + palavras-chave)
//   ZAPI_INSTANCE_ID + ZAPI_TOKEN (+ ZAPI_CLIENT_TOKEN) → envio pela Z-API (tem prioridade)
//   WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID → envio pela API oficial da Meta
//   (sem nenhum dos dois: o usuário envia pelo próprio WhatsApp)
//   VERCEL_TOKEN       → publica o site (sem: o usuário publica o ZIP final por conta própria)

import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { MODELOS, classificarPorPalavras } from '../src/lib/tigreTextos.js'

const MODELO = 'claude-opus-5-5'

let cliente = null
const claude = () => (cliente ??= new Anthropic())

const SISTEMA = `Você é o Tigre, agente de contato comercial de uma pequena agência que cria sites para comércios locais.
Escreve mensagens curtas de WhatsApp em português brasileiro, tom descontraído e respeitoso, sem emojis em excesso.
Nunca invente dados sobre o negócio, preços, prazos ou promoções: use só o que estiver nos dados fornecidos.
Não use links que não foram fornecidos. Uma mensagem por vez, no máximo 4 frases.`

function textoDa(resposta) {
  if (resposta.stop_reason === 'refusal') throw new Error('O modelo recusou gerar esta mensagem.')
  return resposta.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
}

export async function gerarMensagem({ tipo, negocio, historico = [], url }) {
  if (tipo === 'link') return { texto: MODELOS.link(negocio, url), fonte: 'modelo' }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { texto: (MODELOS[tipo] || MODELOS.primeiro)(negocio), fonte: 'modelo' }
  }
  const pedido = {
    primeiro:
      'Escreva a PRIMEIRA mensagem de contato oferecendo um site exclusivo com as fotos do negócio e perguntando se querem ver uma prévia. Use como base: "' +
      MODELOS.primeiro(negocio) +
      '"',
    fechamento: 'O cliente demonstrou interesse. Escreva a mensagem de fechamento dizendo que o link do site é enviado assim que o pagamento for confirmado.',
    resposta: 'Escreva a próxima resposta ao cliente, respondendo o que ele disse na última mensagem.',
  }[tipo]
  const conversa = historico.map((m) => `${m.de === 'cliente' ? 'Cliente' : 'Nós'}: ${m.texto}`).join('\n')
  const resposta = await claude().beta.messages.create({
    model: MODELO,
    max_tokens: 2000,
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SISTEMA,
    messages: [
      {
        role: 'user',
        content: `Dados do negócio (JSON): ${JSON.stringify(negocio)}\n\nConversa até agora:\n${conversa || '(nenhuma mensagem ainda)'}\n\n${pedido}\nResponda só com o texto da mensagem.`,
      },
    ],
  })
  return { texto: textoDa(resposta), fonte: 'claude' }
}

const Classificacao = z.object({
  intencao: z.enum(['interesse', 'nao_contatar', 'duvida', 'recusa', 'outro']),
  resumo: z.string(),
})

export async function classificarResposta(texto) {
  if (!process.env.ANTHROPIC_API_KEY) return { ...classificarPorPalavras(texto), fonte: 'palavras' }
  const resposta = await claude().beta.messages.parse({
    model: MODELO,
    max_tokens: 2000,
    output_config: { effort: 'low', format: betaZodOutputFormat(Classificacao) },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system:
      'Classifique a resposta de um comerciante a uma oferta de site. "nao_contatar" = pediu para parar de receber mensagens (na dúvida entre recusa e nao_contatar, escolha nao_contatar). "interesse" = quer ver, saber preço ou fechar. "duvida" = pergunta sem decidir. "recusa" = não quer, mas sem pedir para parar. Resumo em uma frase curta em português.',
    messages: [{ role: 'user', content: texto }],
  })
  if (resposta.stop_reason === 'refusal' || !resposta.parsed_output) {
    return { ...classificarPorPalavras(texto), fonte: 'palavras' }
  }
  return { ...resposta.parsed_output, fonte: 'claude' }
}

export const provedorWhatsApp = () =>
  process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN
    ? 'zapi'
    : process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
      ? 'meta'
      : null

// Z-API (https://developer.z-api.io/message/send-text): texto simples, sem exigência de template.
async function enviarZapi(para, texto) {
  const url = `https://api.z-api.io/instances/${encodeURIComponent(process.env.ZAPI_INSTANCE_ID)}/token/${encodeURIComponent(process.env.ZAPI_TOKEN)}/send-text`
  const headers = { 'Content-Type': 'application/json' }
  if (process.env.ZAPI_CLIENT_TOKEN) headers['Client-Token'] = process.env.ZAPI_CLIENT_TOKEN
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ phone: para, message: texto }) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) throw new Error(`Z-API: ${data.error || data.message || res.statusText}`)
  return { id: data.messageId || data.zaapId || null, viaTemplate: false, provedor: 'zapi' }
}

// Vídeo da prévia (gravado pelo Gato Negro) pela Z-API — https://developer.z-api.io/message/send-message-video
export async function enviarVideoZapi({ telefone, video, legenda }) {
  if (provedorWhatsApp() !== 'zapi') throw new Error('Envio de vídeo pela API só com a Z-API configurada.')
  const para = String(telefone || '').replace(/\D/g, '')
  if (!para) throw new Error('Lead sem telefone.')
  if (!/^data:video\/(mp4|webm);base64,/.test(video || '')) throw new Error('Vídeo inválido.')
  const url = `https://api.z-api.io/instances/${encodeURIComponent(process.env.ZAPI_INSTANCE_ID)}/token/${encodeURIComponent(process.env.ZAPI_TOKEN)}/send-video`
  const headers = { 'Content-Type': 'application/json' }
  if (process.env.ZAPI_CLIENT_TOKEN) headers['Client-Token'] = process.env.ZAPI_CLIENT_TOKEN
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ phone: para, video, caption: legenda || '' }) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) throw new Error(`Z-API: ${data.error || data.message || res.statusText}`)
  return { id: data.messageId || data.zaapId || null, provedor: 'zapi' }
}

export async function enviarWhatsApp({ telefone, texto, primeiroContato, nome }) {
  const para = String(telefone || '').replace(/\D/g, '')
  if (!para) throw new Error('Lead sem telefone.')
  if (!texto?.trim()) throw new Error('Mensagem vazia.')
  if (provedorWhatsApp() === 'zapi') return enviarZapi(para, texto)

  // WhatsApp Business Cloud API (Meta). Primeiro contato usa template aprovado (regra das 24h).
  const template = process.env.WHATSAPP_TEMPLATE
  if (primeiroContato && !template) {
    throw new Error('Primeiro contato pela API exige um template aprovado pela Meta (WHATSAPP_TEMPLATE). Envie pelo seu WhatsApp.')
  }
  const corpo = primeiroContato
    ? {
        type: 'template',
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'pt_BR' },
          components: [{ type: 'body', parameters: [{ type: 'text', text: nome || 'tudo bem' }] }],
        },
      }
    : { type: 'text', text: { body: texto } }
  const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to: para, ...corpo }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const e = data.error || {}
    if (e.code === 131047) throw new Error('Fora da janela de 24h: só dá para mandar template. Envie pelo seu WhatsApp.')
    throw new Error(`WhatsApp: ${e.message || res.statusText}`)
  }
  return { id: data.messages?.[0]?.id || null, viaTemplate: Boolean(primeiroContato), provedor: 'meta' }
}

// Publica o projeto do ZIP final no Vercel (o Vercel instala e faz o build do Vite).
export async function publicarVercel({ nome, arquivos }) {
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : ''
  const res = await fetch(`https://api.vercel.com/v13/deployments${team}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: nome,
      target: 'production',
      files: arquivos.map((a) => ({ file: a.caminho, data: a.base64, encoding: 'base64' })),
      projectSettings: { framework: 'vite', installCommand: 'npm install', buildCommand: 'npm run build', outputDirectory: 'dist' },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Vercel: ${data.error?.message || res.statusText}`)
  const url = data.alias?.[0] || data.url
  return { url: url ? `https://${url}` : null, id: data.id }
}
