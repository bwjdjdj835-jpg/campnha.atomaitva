// 🎬 Vídeo da prévia gravado na nuvem (ScreenshotOne, pelo servidor): funciona pelo link do Vercel, sem notebook.
import { htmlDaPrevia, fotosMenores, CSS_GRAVACAO } from '../lib/previa.jsx'
import { guardarVideo } from './agents.js'

export async function gravarNaNuvem(pacote, siteId, segundos = 20) {
  const html = htmlDaPrevia(pacote.dados, await fotosMenores([...pacote.fotos]), CSS_GRAVACAO, { agua: false })
  if (html.length > 4_200_000) throw new Error('Prévia grande demais para gravar na nuvem (fotos demais).')
  let res
  try {
    res = await fetch('/api/gato/video-nuvem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html, segundos }) })
  } catch {
    throw new Error('Servidor fora do ar.')
  }
  const json = await res.json().catch(() => null)
  if (!res.ok || !json?.url) throw new Error(json?.error || 'A nuvem não gravou o vídeo.')
  let blob
  try {
    const r = await fetch(json.url)
    if (!r.ok) throw new Error()
    blob = await r.blob()
  } catch {
    // Sem permissão para baixar direto (CORS): o servidor repassa.
    const r = await fetch(`/api/gato/video-nuvem/baixar?u=${encodeURIComponent(json.url)}`)
    if (!r.ok) throw new Error('Não consegui baixar o vídeo gravado na nuvem.')
    blob = await r.blob()
  }
  if (!blob.type.startsWith('video/')) blob = new Blob([blob], { type: 'video/mp4' })
  if (siteId) await guardarVideo(siteId, blob)
  return blob
}
