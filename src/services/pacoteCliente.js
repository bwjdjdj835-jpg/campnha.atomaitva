// 📁 Pacote do cliente (vídeo + mensagem + atalho do WhatsApp) na pasta do notebook — src/lib/pastaClientes.js grava.
import { lerPipeline, setPipeline } from '../store/pipeline.js'
import { videoDoSite, negocioDoSite } from './agents.js'
import { salvarPacote } from '../lib/pastaClientes.js'

// `texto`: a mensagem que está na tela (editada); sem ela, o rascunho do Tigre. `pedir`: veio de um clique.
export async function salvarPacoteDoSite(siteId, { texto, pedir = false } = {}) {
  const { sites, leads, conversas = {} } = lerPipeline()
  const site = sites.find((s) => s.id === siteId)
  if (!site) throw new Error('Cliente não encontrado.')
  const negocio = negocioDoSite(site, leads)
  const mensagem = texto ?? conversas[siteId]?.rascunho ?? ''
  const video = await videoDoSite(siteId)
  const r = await salvarPacote({ nicho: negocio.categoria, nome: site.nome, telefone: negocio.telefone, mensagem, video }, { pedir })
  if (r) {
    const pastaLocal = { ...r, video: Boolean(video), at: new Date().toISOString() }
    setPipeline((s) => ({ sites: s.sites.map((x) => (x.id === siteId ? { ...x, pastaLocal } : x)) }))
  }
  return r && { ...r, video: Boolean(video) }
}
