// 🐯 Vigia do Tigre: com o app rodando no notebook (WhatsApp Web), lê as respostas a cada 5 minutos sozinho.
import { lerPipeline } from '../store/pipeline.js'

export const vigia = { ultima: null, rodando: false, ligada: false }

export async function iniciarVigia() {
  let keys = {}
  try {
    keys = (await fetch('/api/status').then((r) => r.json())).keys || {}
  } catch {
    return
  }
  if (!keys.videoServidor) return // só no notebook (WhatsApp Web)
  vigia.ligada = true
  const rodar = async () => {
    const { conversas = {} } = lerPipeline()
    const temQuemVigiar = Object.values(conversas).some((c) => c.mensagens?.some((m) => m.de === 'nos') && c.status !== 'nao_contatar')
    if (!temQuemVigiar || vigia.rodando) return
    // O Tigre (vídeo, WhatsApp Web…) só baixa no notebook e na hora de vigiar, não na abertura do app.
    const { tigreVigiar, tigreVigiando } = await import('./tigreTrabalho.js')
    if (!tigreVigiando()) return
    vigia.rodando = true
    try {
      await tigreVigiar(() => {}, keys)
      vigia.ultima = new Date().toISOString()
    } catch {
      /* WhatsApp Web fechado/desconectado: tenta na próxima */
    } finally {
      vigia.rodando = false
    }
  }
  setTimeout(rodar, 60_000)
  setInterval(rodar, 5 * 60_000)
}
