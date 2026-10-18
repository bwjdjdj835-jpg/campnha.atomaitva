// 🐯 Tigre automático (API oficial da Meta) — lado do app: senha, configuração, 1ª mensagem, vídeo por link e a
// caixa de conversas que o servidor guarda (o webhook responde os clientes sozinho; aqui só mostramos na Aranha).
import { lerPipeline, setPipeline } from '../store/pipeline.js'

const CHAVE_SENHA = 'central-agentes:tigre-senha'
export const senhaDoTigre = () => {
  try {
    return localStorage.getItem(CHAVE_SENHA) || ''
  } catch {
    return ''
  }
}
export const guardarSenha = (s) => {
  try {
    s ? localStorage.setItem(CHAVE_SENHA, s) : localStorage.removeItem(CHAVE_SENHA)
  } catch {
    /* navegador sem armazenamento: digita de novo na próxima vez */
  }
}

async function api(caminho, { method = 'GET', corpo } = {}) {
  const res = await fetch('/api/tigre/auto' + caminho, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-tigre-senha': senhaDoTigre() },
    body: corpo ? JSON.stringify(corpo) : undefined,
  })
  const dados = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(dados.error || `Erro ${res.status}`), { code: dados.code })
  return dados
}

// { requisitos: { meta, template, webhook, nuvem, senha, ia }, config | null, motivo }
export const statusAuto = () => api('')
export const salvarConfig = (config) => api('', { method: 'PUT', corpo: config })

// Pronto para mandar a 1ª mensagem sozinho? (ligado + API oficial + modelo + webhook + nuvem + senha certa)
export async function autoPronto() {
  if (!senhaDoTigre()) return false
  try {
    const { requisitos: r, config } = await statusAuto()
    return Boolean(config?.ligado && r.meta && r.template && r.webhook && r.nuvem)
  } catch {
    return false
  }
}

// Vídeo da prévia → pasta online (Vercel Blob) direto do navegador; devolve o link público para o Tigre mandar.
export async function subirVideo(siteId, video) {
  const { upload } = await import('@vercel/blob/client')
  const ext = /webm/.test(video.type) ? 'webm' : 'mp4'
  const nome = `tigre/videos/${String(siteId).replace(/[^\w-]/g, '-').slice(0, 60)}.${ext}`
  const blob = await upload(nome, new Blob([video], { type: `video/${ext}` }), {
    access: 'public',
    handleUploadUrl: '/api/tigre/auto/video',
    headers: { 'x-tigre-senha': senhaDoTigre() },
    contentType: `video/${ext}`,
  })
  return blob.url
}

export const iniciarAuto = (dados) => api('/iniciar', { method: 'POST', corpo: dados })

// Caixa do servidor → conversas do app (pelo siteId). O servidor é quem manda nessas conversas: as mensagens dele
// substituem as daqui; avisos novos viram "🔔 Sua vez" na Aranha.
const STATUS = { pagou: 'pagou', fechando: 'fechando' }
export async function sincronizarCaixa() {
  if (!senhaDoTigre()) return { novas: 0 }
  const { conversas: lista = [] } = await api('/caixa')
  const { conversas = {}, sites = [] } = lerPipeline()
  let novas = 0
  const mudou = {}
  for (const c of lista) {
    if (!c.siteId || !sites.some((s) => s.id === c.siteId)) continue
    const atual = conversas[c.siteId] || { status: 'novo', mensagens: [] }
    const mensagens = c.mensagens.map((m) => ({ de: m.de, texto: m.texto, at: m.at, via: 'api-oficial', ...(m.auto ? { auto: true } : {}) }))
    const avisosNovos = (c.avisos || []).filter((a) => !atual.avisosVistos || a.at > atual.avisosVistos)
    if (mensagens.length === atual.mensagens.length && !avisosNovos.length && atual.status === (STATUS[c.status] || c.status)) continue
    novas += Math.max(0, mensagens.length - atual.mensagens.length)
    mudou[c.siteId] = {
      ...atual,
      mensagens,
      status: STATUS[c.status] || c.status,
      tigreAuto: true,
      parado: Boolean(c.parado),
      avisos: c.avisos || [],
      ...(avisosNovos.length ? { suaVez: true, avisosVistos: avisosNovos.at(-1).at } : {}),
    }
  }
  if (Object.keys(mudou).length) setPipeline((s) => ({ conversas: { ...s.conversas, ...mudou } }))
  return { novas }
}

// Puxa a caixa a cada minuto (só quando a senha do Tigre está neste aparelho).
export function iniciarCaixa() {
  const rodar = () => sincronizarCaixa().catch(() => {})
  rodar()
  setInterval(rodar, 60_000)
}
