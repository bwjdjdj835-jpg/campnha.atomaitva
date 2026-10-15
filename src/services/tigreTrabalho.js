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
import { enviarPeloZap } from './zapWeb.js'
import { lerZip } from '../lib/zipStore.js'
import { htmlDaPrevia, fotosEmDataUrl, CSS_GRAVACAO } from '../lib/previa.jsx'

const MAX_DIARIO = 60

function anotar(siteId, nome, passo, ok = true) {
  setPipeline((s) => ({ tigreDiario: [{ siteId, nome, passo, ok, at: new Date().toISOString() }, ...(s.tigreDiario || [])].slice(0, MAX_DIARIO) }))
}

// Outro site do MESMO comércio (mesmo telefone/nome) que já recebeu mensagem → não manda de novo.
export function jaRecebeuMensagem(siteId) {
  const { sites, leads, conversas = {} } = lerPipeline()
  const site = sites.find((s) => s.id === siteId)
  if (!site) return false
  const chave = chaveContato(negocioDoSite(site, leads))
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
  let video = null
  try {
    video = await videoGarantido(site, keys, segundos)
  } catch (e) {
    anotar(siteId, site.nome, `🎬 não consegui gravar o vídeo (${e.message}) — vai só a mensagem`, false)
  }
  if (keys?.videoServidor) {
    anotar(siteId, site.nome, '📲 mandando pelo WhatsApp Web')
    await enviarPeloZap({ telefone: fone, texto, video })
    registrarPrimeiroEnvio(siteId, texto, Boolean(video), 'whatsapp-web')
    anotar(siteId, site.nome, `📨 enviado${video ? ' (vídeo + mensagem)' : ''}`)
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
