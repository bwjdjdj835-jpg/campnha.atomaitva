// 📲 WhatsApp Web pelo notebook (servidor local). A Aranha só manda depois do seu clique em "Aprovar e enviar".
import { lerPipeline } from '../store/pipeline.js'
import { lerResposta, atualizarConversa } from './tigreConversa.js'
import { negocioDoSite } from './agents.js'

async function chamar(rota, corpo) {
  const res = await fetch(`/api/zap/${rota}`, corpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) } : undefined)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'WhatsApp Web não respondeu.')
  return json
}

const emBase64 = (blob) =>
  new Promise((ok, erro) => {
    const r = new FileReader()
    r.onload = () => ok(String(r.result).split(',')[1])
    r.onerror = erro
    r.readAsDataURL(blob)
  })

export const conectarZap = () => chamar('conectar', {})
export const statusZap = () => chamar('status')

export async function enviarPeloZap({ telefone, texto, video }) {
  return chamar('enviar', {
    telefone,
    texto,
    aprovado: true, // só chamado pelo botão "Aprovar e enviar"
    ...(video ? { video: await emBase64(video), tipoVideo: video.type } : {}),
  })
}

// Lê no WhatsApp Web as respostas novas de cada cliente que já recebeu mensagem e já deixa a próxima sugerida.
export async function buscarRespostas(aoAvancar = () => {}) {
  const { sites, leads, conversas } = lerPipeline()
  const lista = sites.filter((s) => conversas[s.id]?.mensagens?.some((m) => m.de === 'nos') && conversas[s.id].status !== 'nao_contatar')
  let novas = 0
  for (const [i, site] of lista.entries()) {
    const negocio = negocioDoSite(site, leads)
    aoAvancar(`${i + 1}/${lista.length} · ${site.nome}`)
    const tel = negocio.whatsapp || negocio.telefone
    if (!tel) continue
    let r
    try {
      r = await chamar('ler', { telefone: tel })
    } catch {
      continue
    }
    const conhecidas = new Set((lerPipeline().conversas[site.id]?.mensagens || []).filter((m) => m.de === 'cliente').map((m) => m.texto.trim()))
    for (const m of r.mensagens.filter((x) => !conhecidas.has(x.texto.trim()))) {
      const sugestao = await lerResposta(site.id, negocio, m.texto)
      atualizarConversa(site.id, () => ({ sugestao }))
      novas++
    }
  }
  return { novas, conversas: lista.length }
}
