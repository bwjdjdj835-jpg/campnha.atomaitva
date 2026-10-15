// 🐯 Tigre — mensagens para o cliente, leitura das respostas, envio pelo WhatsApp e publicação.
// Regras (prompts/04-tigre.md): nada sai sem aprovação do usuário (a interface só chama /enviar
// depois do clique), sem disparo em massa, e "não contatar" é respeitado.
//
// Cada integração é opcional:
//   GROQ_API_KEY       → IA da Groq escreve as mensagens e lê as respostas (tem prioridade; GROQ_MODEL troca o modelo)
//   ANTHROPIC_API_KEY  → Claude faz o mesmo, só se não houver Groq (sem nenhuma: modelos fixos + palavras-chave)
//   ZAPI_INSTANCE_ID + ZAPI_TOKEN (+ ZAPI_CLIENT_TOKEN) → envio pela Z-API (tem prioridade)
//   WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID → envio pela API oficial da Meta
//   (sem nenhum dos dois: o usuário envia pelo próprio WhatsApp)
//   VERCEL_TOKEN       → publica o site (sem: o usuário publica o ZIP final por conta própria)

import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'
import { MODELOS, classificarPorPalavras, opcaoDeAtendente, respostaPorPalavras } from '../src/lib/tigreTextos.js'

const MODELO = 'claude-opus-5-5'
const MODELO_GROQ = () => process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

// Qual IA usar: Groq primeiro (a chave do usuário), Claude só sem Groq, senão nenhuma.
export const provedorIA = () => (process.env.GROQ_API_KEY ? 'groq' : process.env.ANTHROPIC_API_KEY ? 'claude' : null)

// Groq: API no formato da OpenAI (https://console.groq.com/docs/api-reference#chat-create).
export async function groq({ system, user, json = false, maxTokens = 600, temperatura }) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODELO_GROQ(),
      temperature: temperatura ?? (json ? 0 : 0.7),
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Groq: ${data.error?.message || res.statusText}`)
  return String(data.choices?.[0]?.message?.content || '').trim()
}

let cliente = null
const claude = () => (cliente ??= new Anthropic())

const SISTEMA = `Você é o Tigre, agente de contato comercial de uma pequena agência que cria sites para comércios locais.
Escreve mensagens curtas de WhatsApp em português brasileiro, tom descontraído e respeitoso, sem emojis em excesso.
Nunca invente dados sobre o negócio, preços, prazos ou promoções: use só o que estiver nos dados fornecidos.
Não use links que não foram fornecidos. Uma mensagem por vez, no máximo 4 frases.
Objetivo: levar a conversa, passo a passo, até fechar a venda do site — sem pressa e sem pressão. Leia a conversa inteira
antes de responder: não repita o que já foi dito, responda a última mensagem do cliente e termine com um próximo passo
simples (ver a prévia, tirar uma dúvida, combinar o fechamento). Se o cliente disser que agora não, aceite e convide só a
dar uma olhada na prévia, sem compromisso. Se pedir para parar, não escreva mais nada.`

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
  // Opção de "falar com atendente" no menu do robô (ex.: "3"), vinda da última mensagem dele.
  const ultimaDoCliente = [...historico].reverse().find((m) => m.de === 'cliente')?.texto || ''
  const opcao = tipo === 'pessoa' ? opcaoDeAtendente(ultimaDoCliente) : ''
  // Texto pronto (sem IA ou IA fora do ar): a resposta olha a última mensagem do cliente.
  const pronto = () => (tipo === 'resposta' ? respostaPorPalavras(ultimaDoCliente, negocio) : (MODELOS[tipo] || MODELOS.primeiro)(negocio, opcao))
  const ia = provedorIA()
  if (!ia) return { texto: pronto(), fonte: 'modelo' }
  const pedido = {
    primeiro:
      'Escreva a PRIMEIRA mensagem de contato oferecendo um site exclusivo com as fotos do negócio e perguntando se querem ver uma prévia. Use como base: "' +
      MODELOS.primeiro(negocio) +
      '"',
    fechamento: 'O cliente demonstrou interesse. Escreva a mensagem de fechamento dizendo que o link do site é enviado assim que o pagamento for confirmado.',
    resposta:
      'Escreva a próxima resposta ao cliente, respondendo exatamente o que ele disse na ÚLTIMA mensagem, como um vendedor humano, educado e sem pressão. Casos: perguntou preço → não invente valor, diga que depende do que precisam e ofereça mandar a prévia/combinar; pediu para ver → diga que vai mandar o vídeo da prévia agora; quer fechar → explique que o site vai ao ar e o link é enviado assim que o pagamento for confirmado; perguntou quem é ou como achou o número → apresente-se (cria sites para comércios da região, achou o negócio no Google Maps); desconfiou de golpe → tranquilize (não precisa pagar nada para ver a prévia); número errado ou engano → peça desculpa e encerre; está ocupado → diga para chamar quando puder; mensagem confusa → peça para explicar de um jeito simples. Nunca insista depois de um não.',
    despedida:
      'O cliente recusou de novo. Escreva UMA mensagem curta agradecendo a atenção e encerrando a conversa com simpatia, sem oferecer nada e sem insistir. Base: "' +
      MODELOS.despedida(negocio) +
      '"',
    olhada:
      'O cliente disse que não quer o site agora, mas NÃO pediu para parar de receber mensagens. Escreva UMA resposta curta e gentil: aceite o não, sem insistir, sem desconto e sem pressão, e só convide a dar uma olhada no projeto (a prévia do site) que já foi feito, sem compromisso. Base: "' +
      MODELOS.olhada(negocio) +
      '"',
    pessoa:
      'Quem respondeu a última mensagem foi um ROBÔ (resposta automática, menu ou assistente virtual do WhatsApp Business), não uma pessoa. Escreva uma mensagem curta e educada pedindo para falar com o responsável ou com alguém da equipe, dizendo só que é sobre um site que preparamos para eles. Não ofereça nada ainda nem repita a oferta inteira. Use "o responsável" ou "alguém da equipe" (não suponha nome nem gênero).' +
      (opcao ? ` O menu do robô tem a opção ${opcao} para falar com atendente: comece a mensagem com "${opcao}" sozinho na primeira linha.` : ' Se o menu do robô tiver uma opção para falar com atendente, comece a mensagem com o número dessa opção sozinho na primeira linha.') +
      ' Base: "' +
      MODELOS.pessoa(negocio, opcao) +
      '"',
  }[tipo]
  const conversa = historico.map((m) => `${m.de === 'cliente' ? 'Cliente' : 'Nós'}: ${m.texto}`).join('\n')
  const conteudo = `Dados do negócio (JSON): ${JSON.stringify(negocio)}\n\nConversa até agora:\n${conversa || '(nenhuma mensagem ainda)'}\n\n${pedido || MODELOS.primeiro(negocio)}\nResponda só com o texto da mensagem.`
  if (ia === 'groq') {
    try {
      return { texto: await groq({ system: SISTEMA, user: conteudo }), fonte: 'groq' }
    } catch (e) {
      // Groq fora do ar, chave errada ou limite: usa o texto pronto e avisa.
      return { texto: pronto(), fonte: 'modelo', aviso: e.message }
    }
  }
  const resposta = await claude().beta.messages.create({
    model: MODELO,
    max_tokens: 2000,
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SISTEMA,
    messages: [{ role: 'user', content: conteudo }],
  })
  return { texto: textoDa(resposta), fonte: 'claude' }
}

const Classificacao = z.object({
  intencao: z.enum(['interesse', 'nao_contatar', 'duvida', 'recusa', 'bot', 'outro']),
  resumo: z.string(),
})

const CLASSIFICAR =
  'Classifique a resposta recebida no WhatsApp depois de oferecermos um site a um comerciante. "bot" = quem respondeu foi um robô: saudação automática do WhatsApp Business (boas-vindas com horário de atendimento, links de agendamento, "podemos demorar para responder", "agradeço o contato"), menu de opções, assistente virtual, "em breve retornaremos". "nao_contatar" = uma pessoa pediu para parar de receber mensagens (na dúvida entre recusa e nao_contatar, escolha nao_contatar). "interesse" = quer ver, saber preço ou fechar. "duvida" = pergunta sem decidir. "recusa" = não quer, mas sem pedir para parar. Resumo em uma frase curta em português.'

export async function classificarResposta(texto) {
  const ia = provedorIA()
  const comOpcao = (r) => (r.intencao === 'bot' ? { ...r, opcao: opcaoDeAtendente(texto) } : r)
  if (!ia) return { ...classificarPorPalavras(texto), fonte: 'palavras' }
  if (ia === 'groq') {
    try {
      const bruto = await groq({
        system: `${CLASSIFICAR}\nResponda só com JSON: {"intencao": "interesse|nao_contatar|duvida|recusa|bot|outro", "resumo": "..."}`,
        user: texto,
        json: true,
      })
      const r = Classificacao.safeParse(JSON.parse(bruto))
      if (r.success) return { ...comOpcao(r.data), fonte: 'groq' }
    } catch {
      /* resposta fora do formato: cai para as palavras-chave */
    }
    return { ...classificarPorPalavras(texto), fonte: 'palavras' }
  }
  const resposta = await claude().beta.messages.parse({
    model: MODELO,
    max_tokens: 2000,
    output_config: { effort: 'low', format: betaZodOutputFormat(Classificacao) },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: CLASSIFICAR,
    messages: [{ role: 'user', content: texto }],
  })
  if (resposta.stop_reason === 'refusal' || !resposta.parsed_output) {
    return { ...classificarPorPalavras(texto), fonte: 'palavras' }
  }
  return { ...comOpcao(resposta.parsed_output), fonte: 'claude' }
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
