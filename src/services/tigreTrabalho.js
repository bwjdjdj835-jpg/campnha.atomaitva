// 🐯 Tigre = o trabalhador (pedido do usuário). Depois do seu "Aprovar" na Aranha (seu lugar de administrador), ele:
//   1. confere que o comércio ainda não recebeu mensagem (nunca manda duas vezes para o mesmo comércio/telefone);
//   2. grava o vídeo da prévia, se faltar (notebook → nuvem);
//   3. manda a mensagem + vídeo pelo WhatsApp Web do notebook (ou, no Vercel, abre a conversa para você mandar);
//   4. registra tudo: quem recebeu, quando e por onde (o "trabalho do Tigre" aparece na página dele).
import { lerPipeline, setPipeline } from '../store/pipeline.js'
import { chaveContato } from '../lib/contato.js'
import { lembrar } from '../lib/mentes.js'
import { atualizarConversa } from './tigreConversa.js'
import { videoDoSite, gravarVideoPrevia, lerPacoteLeao, negocioDoSite } from './agents.js'
import { gravarNaNuvem } from './videoNuvem.js'
import { enviarPeloZap, lerConversaNoZap } from './zapWeb.js'
import { lerResposta } from './tigreConversa.js'
import { lerZip } from '../lib/zipStore.js'
import { autoPronto, subirVideo, iniciarAuto } from './tigreAuto.js'
import { htmlDaPrevia, fotosEmDataUrl, CSS_GRAVACAO } from '../lib/previa.jsx'

const MAX_DIARIO = 60

// Como o Tigre faz o 1º contato: 'pergunta' (padrão, recomendado) = só texto perguntando se quer ver a prévia; o vídeo vai
// quando o cliente pedir. 'junto' = vídeo + mensagem de uma vez.
const CHAVE_ESTRATEGIA = 'central-agentes:tigre-estrategia'
const CHAVE_VIGIA = 'central-agentes:tigre-vigiar'
const lerLocal = (k, padrao) => {
  try {
    return localStorage.getItem(k) ?? padrao
  } catch {
    return padrao
  }
}
const gravarLocal = (k, v) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* sem storage */
  }
}
export const estrategiaDoTigre = () => (lerLocal(CHAVE_ESTRATEGIA, 'pergunta') === 'junto' ? 'junto' : 'pergunta')
export const definirEstrategia = (v) => gravarLocal(CHAVE_ESTRATEGIA, v === 'junto' ? 'junto' : 'pergunta')
export const tigreVigiando = () => lerLocal(CHAVE_VIGIA, '1') === '1'
export const definirVigia = (ligado) => gravarLocal(CHAVE_VIGIA, ligado ? '1' : '0')

function anotar(siteId, nome, passo, ok = true) {
  setPipeline((s) => ({ tigreDiario: [{ siteId, nome, passo, ok, at: new Date().toISOString() }, ...(s.tigreDiario || [])].slice(0, MAX_DIARIO) }))
}

// Outro site do MESMO comércio (mesmo telefone/nome) que já recebeu mensagem → não manda de novo.
export function jaRecebeuMensagem(siteId) {
  const { sites, leads, conversas = {}, contatos = {} } = lerPipeline()
  const site = sites.find((s) => s.id === siteId)
  if (!site) return false
  const chave = chaveContato(negocioDoSite(site, leads))
  if (contatos[chave]) return true // marcado à mão ou no envio em massa
  return sites.some((s) => {
    if (!conversas[s.id]?.mensagens?.some((m) => m.de === 'nos')) return false
    return s.id === siteId || chaveContato(negocioDoSite(s, leads)) === chave
  })
}

const telefoneDe = (n) => {
  const d = String(n.whatsapp || n.telefone || '').replace(/\D/g, '')
  return d.length === 10 || d.length === 11 ? `55${d}` : d
}

export function registrarPrimeiroEnvio(siteId, texto, comVideo, via) {
  const at = new Date().toISOString()
  atualizarConversa(siteId, (c) => ({
    mensagens: [...c.mensagens, { de: 'nos', texto, via, at }, ...(comVideo ? [{ de: 'nos', texto: '🎬 Vídeo da prévia', via, at }] : [])],
    status: 'contatado',
    rascunho: undefined,
  }))
  setPipeline((s) => ({ sites: s.sites.map((x) => (x.id === siteId ? { ...x, status: 'aprovado', aprovadoEm: at } : x)) }))
}

async function videoGarantido(site, keys, segundos) {
  const pronto = await videoDoSite(site.id)
  if (pronto) return pronto
  if (!keys?.videoServidor && !keys?.videoNuvem) return null
  anotar(site.id, site.nome, '🎬 gravando o vídeo da prévia')
  const zip = await lerZip(`${site.id}:final`)
  if (!zip) throw new Error('o site final não está neste aparelho')
  const p = await lerPacoteLeao(zip)
  return keys.videoServidor
    ? gravarVideoPrevia(htmlDaPrevia(p.dados, await fotosEmDataUrl(p.fotos), CSS_GRAVACAO, { agua: false }), site.id, segundos)
    : gravarNaNuvem(p, site.id, segundos)
}

// Primeiro contato aprovado na Aranha. → { modo: 'enviado' | 'manual', video }
// modo 'manual' = sem WhatsApp Web (Vercel): a Aranha abre a conversa do cliente para você mandar e clicar "Já enviei".
export async function tigreExecutar(siteId, { texto, keys, segundos = 20 }) {
  const { sites, leads } = lerPipeline()
  const site = sites.find((s) => s.id === siteId)
  if (!site) throw new Error('Site não encontrado.')
  if (jaRecebeuMensagem(siteId)) {
    anotar(siteId, site.nome, '⛔ já tinha recebido mensagem — não mandei de novo', false)
    throw new Error('O Tigre viu que este comércio já recebeu mensagem — não vou mandar de novo.')
  }
  const negocio = negocioDoSite(site, leads)
  const fone = telefoneDe(negocio)
  if (!fone) throw new Error('Este comércio não tem telefone.')
  anotar(siteId, site.nome, '✅ aprovado por você na Aranha')
  // 🐯 Tigre automático (API oficial): 1ª mensagem pelo modelo aprovado; o vídeo sobe para a pasta online e vai por link
  // quando o cliente pedir; daí em diante o servidor conversa sozinho.
  if (await autoPronto()) {
    let video = null
    let videoUrl = null
    try {
      video = await videoGarantido(site, keys, segundos)
      if (video) {
        anotar(siteId, site.nome, '☁️ subindo o vídeo da prévia para a pasta online')
        videoUrl = await subirVideo(siteId, video)
      }
    } catch (e) {
      anotar(siteId, site.nome, `🎬 vídeo não ficou pronto (${e.message}) — se pedirem, eu te aviso`, false)
    }
    const { conversa } = await iniciarAuto({ telefone: fone, siteId, nome: site.nome, negocio, videoUrl })
    registrarPrimeiroEnvio(siteId, conversa.mensagens[0].texto, false, 'api-oficial')
    atualizarConversa(siteId, () => ({ tigreAuto: true, previaPendente: true }))
    anotar(siteId, site.nome, '📨 1ª mensagem enviada pela API oficial — agora eu converso sozinho e te aviso')
    lembrar('tigre', `Mandei para ${site.nome} pela API oficial; sigo a conversa sozinho até fechar`)
    return { modo: 'enviado', video }
  }
  const junto = estrategiaDoTigre() === 'junto' || !keys?.videoServidor // sem WhatsApp Web não dá para mandar o vídeo depois sozinho
  let video = null
  try {
    // Mesmo no "pergunta" o vídeo já fica pronto, para sair na hora em que o cliente pedir.
    video = await videoGarantido(site, keys, segundos)
  } catch (e) {
    anotar(siteId, site.nome, `🎬 não consegui gravar o vídeo (${e.message})${junto ? ' — vai só a mensagem' : ''}`, false)
  }
  if (keys?.videoServidor) {
    const comVideo = junto ? video : null
    anotar(siteId, site.nome, `📲 mandando pelo WhatsApp Web${comVideo ? ' (vídeo + mensagem)' : ' (só a mensagem; a prévia vai quando pedirem)'}`)
    await enviarPeloZap({ telefone: fone, texto, video: comVideo })
    registrarPrimeiroEnvio(siteId, texto, Boolean(comVideo), 'whatsapp-web')
    atualizarConversa(siteId, () => ({ previaPendente: !comVideo }))
    anotar(siteId, site.nome, `📨 mensagem inicial enviada${comVideo ? ' com a prévia' : ''}`)
    lembrar('tigre', `Mandei para ${site.nome}${video ? ' o vídeo e a mensagem' : ' a mensagem'} pelo WhatsApp Web`)
    return { modo: 'enviado', video }
  }
  anotar(siteId, site.nome, '📲 sem WhatsApp Web (Vercel): abri a conversa para você mandar')
  return { modo: 'manual', video }
}

// Resposta aprovada numa conversa: o Tigre manda pelo WhatsApp Web (no notebook).
export async function tigreResponder(siteId, texto) {
  const { sites, leads } = lerPipeline()
  const site = sites.find((s) => s.id === siteId)
  const fone = telefoneDe(negocioDoSite(site, leads))
  await enviarPeloZap({ telefone: fone, texto })
  anotar(siteId, site.nome, '📨 resposta enviada pelo WhatsApp Web')
}

// O cliente pediu para ver? ("sim", "pode mandar", "quero ver"…) — e não é recusa nem pedido para parar.
const PEDIU = /(\bsim\b|\bpode\b|manda|mande|envia|envie|quero ver|quero sim|gostaria|claro|\bok\b|beleza|bora|show|com certeza|pode ser|\bisso\b|aham|uhum|👍)/i
export const pediuPrevia = (texto, intencao) => !['recusa', 'nao_contatar', 'bot'].includes(intencao) && (intencao === 'interesse' || PEDIU.test(texto))

const avisarVoce = async (assunto, texto) => {
  try {
    const para = localStorage.getItem('central-agentes:aguia-email') || ''
    await fetch('/api/aguia/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assunto, texto, para }) })
  } catch {
    /* sem e-mail configurado: o aviso fica na Aranha */
  }
}

// 🐯 O Tigre vigia o WhatsApp (notebook): lê as respostas novas; se o cliente pediu a prévia e ela ainda não foi,
// manda o vídeo sozinho; em qualquer resposta, marca "🔔 Sua vez" na Aranha (e avisa por e-mail se a Águia estiver ligada).
let vigiando = false
export async function tigreVigiar(aoAvancar = () => {}, keys = { videoServidor: true }) {
  if (vigiando) return { novas: 0, previas: 0 }
  vigiando = true
  let novas = 0
  let previas = 0
  try {
    const { sites, leads, conversas } = lerPipeline()
    const lista = sites.filter((s) => conversas[s.id]?.mensagens?.some((m) => m.de === 'nos') && conversas[s.id].status !== 'nao_contatar')
    for (const [i, site] of lista.entries()) {
      const negocio = negocioDoSite(site, leads)
      const fone = telefoneDe(negocio)
      if (!fone) continue
      aoAvancar(`${i + 1}/${lista.length} · ${site.nome}`)
      let r
      try {
        r = await lerConversaNoZap(fone)
      } catch {
        continue
      }
      const conhecidas = new Set((lerPipeline().conversas[site.id]?.mensagens || []).filter((m) => m.de === 'cliente').map((m) => m.texto.trim()))
      const novasDele = r.mensagens.filter((x) => !conhecidas.has(x.texto.trim()))
      if (!novasDele.length) continue
      let ultima = null
      for (const m of novasDele) {
        ultima = await lerResposta(site.id, negocio, m.texto)
        novas++
      }
      const conversa = lerPipeline().conversas[site.id]
      const textoTodo = novasDele.map((m) => m.texto).join(' ')
      anotar(site.id, site.nome, `💬 respondeu: "${textoTodo.slice(0, 80)}"`)
      if (conversa.previaPendente && pediuPrevia(textoTodo, ultima?.leitura?.intencao)) {
        try {
          const video = await videoGarantido(site, keys, 20)
          if (!video) throw new Error('sem vídeo da prévia')
          const texto = `Que bom! Olha a prévia do site da ${site.nome} 👇 Qualquer coisa que quiser mudar, é só me falar.`
          await enviarPeloZap({ telefone: fone, texto, video })
          const at = new Date().toISOString()
          atualizarConversa(site.id, (c) => ({
            mensagens: [...c.mensagens, { de: 'nos', texto, via: 'whatsapp-web', at }, { de: 'nos', texto: '🎬 Vídeo da prévia', via: 'whatsapp-web', at }],
            previaPendente: false,
            status: 'interessado',
            sugestao: undefined,
          }))
          previas++
          anotar(site.id, site.nome, '🎬 pediu a prévia — mandei o vídeo. Agora é com você!')
          lembrar('tigre', `${site.nome} pediu a prévia e eu mandei o vídeo`)
          avisarVoce(`🔔 ${site.nome} pediu a prévia — o Tigre já mandou`, `${site.nome} respondeu: "${textoTodo}".\nO Tigre mandou o vídeo da prévia. Agora é com você: https://campnha-atomaitva.vercel.app/admin`)
        } catch (e) {
          anotar(site.id, site.nome, `🎬 pediu a prévia, mas não consegui mandar (${e.message}) — mande você`, false)
        }
      } else {
        avisarVoce(`🔔 ${site.nome} respondeu`, `${site.nome} respondeu: "${textoTodo}".\nA próxima mensagem já está sugerida na Aranha: https://campnha-atomaitva.vercel.app/admin`)
      }
      atualizarConversa(site.id, () => ({ suaVez: true }))
    }
  } finally {
    vigiando = false
  }
  return { novas, previas }
}
