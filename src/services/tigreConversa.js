// 🐯 Conversa com o cliente — usada pelo Tigre e pela Aranha Administradora.
// Você cola o que o cliente (ou o robô dele) respondeu; o Tigre lê, guarda na conversa e sugere a próxima mensagem.
// Nada é enviado daqui: você confere e manda pelo seu WhatsApp.

import { classificar, rascunho } from './agents.js'
import { lerPipeline, setPipeline } from '../store/pipeline.js'
import { lembrar } from '../lib/mentes.js'

export const STATUS_DA_INTENCAO = { interesse: 'interessado', duvida: 'duvida', recusa: 'recusou', bot: 'bot', nao_contatar: 'nao_contatar', outro: 'contatado' }

export function atualizarConversa(siteId, fn) {
  setPipeline((s) => {
    const atual = s.conversas?.[siteId] || { status: 'novo', mensagens: [] }
    return { conversas: { ...s.conversas, [siteId]: { ...atual, ...fn(atual) } } }
  })
}

// Mensagem que você mandou pelo WhatsApp (tipo: 'olhada' | 'pessoa' | 'despedida' | null).
export function registrarEnviada(siteId, texto, tipo = null, via = 'whatsapp-manual') {
  atualizarConversa(siteId, (c) => ({
    mensagens: [...c.mensagens, { de: 'nos', texto, via, at: new Date().toISOString(), ...(tipo ? { tipo } : {}) }],
    // "Só dá uma olhada" e despedida: continua "Não quer site ainda" (o selo que todos os agentes veem).
    sugestao: undefined,
    suaVez: false,
    status: ['olhada', 'despedida'].includes(tipo) ? 'recusou' : ['novo', 'recusou', 'duvida', 'bot'].includes(c.status) ? 'contatado' : c.status,
    rascunho: undefined,
  }))
}

// → { leitura, texto, tipo, aviso }. texto vazio = não mandar nada (pediu para parar).
export async function lerResposta(siteId, negocio, textoCliente, { temVideo = false } = {}) {
  const conversa = lerPipeline().conversas?.[siteId] || { status: 'novo', mensagens: [] }
  const r = await classificar(textoCliente)
  const novoStatus = STATUS_DA_INTENCAO[r.intencao] || 'contatado'
  const nomeSite = lerPipeline().sites?.find((x) => x.id === siteId)?.nome || 'cliente'
  lembrar('aranha', `${nomeSite} respondeu (${r.intencao}): "${String(textoCliente).slice(0, 80)}"`, { intencao: r.intencao })
  if (r.intencao === 'recusa') lembrar('tigre', `${nomeSite} disse "agora não" — guardei o site para oferecer depois`)
  atualizarConversa(siteId, (c) => ({
    mensagens: [...c.mensagens, { de: 'cliente', texto: textoCliente, at: new Date().toISOString(), intencao: r.intencao }],
    status: ['vendido', 'publicado'].includes(c.status) ? c.status : novoStatus,
  }))
  if (r.intencao === 'nao_contatar') {
    return { leitura: r, texto: '', tipo: null, fonte: null, aviso: `Leitura da resposta: ${r.resumo} Contato bloqueado — não mande mais nada.` }
  }
  const historico = [...conversa.mensagens, { de: 'cliente', texto: textoCliente }]
  let fonte = 'modelo'
  const sugerir = async (tipo) => {
    const r = await rascunho(tipo, negocio, historico)
    fonte = r.fonte || 'modelo'
    return r.texto
  }
  const resultado = await sugerirProxima(r, conversa, sugerir, temVideo)
  return { ...resultado, fonte }
}

async function sugerirProxima(r, conversa, sugerir, temVideo) {
  if (r.intencao === 'bot') {
    // Robô (saudação automática, menu, assistente): pede para falar com uma pessoa, usando a opção de atendente do menu.
    return {
      leitura: r,
      texto: await sugerir('pessoa'),
      tipo: 'pessoa',
      aviso: `Quem respondeu foi um robô (atendimento automático).${r.opcao ? ` O menu tem a opção ${r.opcao} para falar com atendente — já coloquei na mensagem.` : ''} Sugestão: pedir para falar com o responsável ou alguém da equipe.`,
    }
  }
  if (r.intencao === 'recusa') {
    // "Não quero agora": uma única mensagem leve de "só dá uma olhada". Se recusar de novo, só agradece e encerra.
    if (conversa.mensagens.some((m) => m.tipo === 'olhada')) {
      return { leitura: r, texto: await sugerir('despedida'), tipo: 'despedida', aviso: 'Recusou de novo depois do "só dá uma olhada" — sugestão: só agradecer e encerrar, sem insistir.' }
    }
    return {
      leitura: r,
      texto: await sugerir('olhada'),
      tipo: 'olhada',
      aviso: `Leitura da resposta: ${r.resumo} Sugestão: uma mensagem leve, só pra dar uma olhada no projeto${temVideo ? ' (mande o vídeo da prévia junto)' : ''}. Só uma vez — sem insistir.`,
    }
  }
  // Interesse, pergunta ou qualquer outra coisa (preço, "quem é?", engano, desconfiança…): responde o que ele disse.
  return { leitura: r, texto: await sugerir('resposta'), tipo: null, aviso: `Leitura da resposta: ${r.resumo} Confira a resposta sugerida e envie pelo seu WhatsApp.` }
}

// Outra versão da mensagem sugerida (mesmo tipo), olhando a conversa inteira.
export async function outraSugestao(siteId, negocio, tipo) {
  const conversa = lerPipeline().conversas?.[siteId] || { mensagens: [] }
  const r = await rascunho(tipo || 'resposta', negocio, conversa.mensagens)
  return { texto: r.texto, fonte: r.fonte || 'modelo' }
}

// Quem respondeu por último foi o cliente (ou o robô dele) → está esperando você.
export const esperandoVoce = (c) => c?.status !== 'nao_contatar' && (Boolean(c?.suaVez) || c?.mensagens?.at(-1)?.de === 'cliente')

export function marcarVenda(siteId) {
  lembrar('aranha', `💰 Venda fechada: ${lerPipeline().sites?.find((x) => x.id === siteId)?.nome || 'cliente'}`)
  atualizarConversa(siteId, () => ({ status: 'vendido', vendidoEm: new Date().toISOString() }))
}
