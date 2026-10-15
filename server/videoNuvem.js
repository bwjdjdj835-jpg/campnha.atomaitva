// 🎬 Vídeo da prévia gravado na nuvem pela ScreenshotOne (pedido do usuário: gravar pelo link do Vercel, sem notebook).
// https://screenshotone.com/docs/animated-screenshots/ — POST /animate com o HTML da prévia, cenário "scroll", MP4.
// Precisa de SCREENSHOTONE_ACCESS_KEY no Vercel (plano grátis: 100 por mês).
// A resposta vem em JSON com o link do vídeo no cache da ScreenshotOne (a função do Vercel não devolve arquivos
// grandes, ~4,5 MB) — o navegador baixa o vídeo direto desse link.

const API = 'https://api.screenshotone.com/animate'

export const temVideoNuvem = () => Boolean(process.env.SCREENSHOTONE_ACCESS_KEY)

export async function gravarNaNuvem(html, { segundos = 20 } = {}) {
  const corpo = {
    access_key: process.env.SCREENSHOTONE_ACCESS_KEY,
    html,
    format: 'mp4',
    scenario: 'scroll',
    duration: Math.min(30, Math.max(5, Math.round(segundos))),
    // Formato de celular (390×844) em 2× → 780×1688, nítido no WhatsApp.
    viewport_width: 390,
    viewport_height: 844,
    device_scale_factor: 2,
    viewport_mobile: true,
    // Capa parada uns 3 s e depois desce devagar até o fim, sem voltar.
    scroll_start_immediately: false,
    scroll_start_delay: 3000,
    scroll_by: 420,
    scroll_duration: 1600,
    scroll_delay: 700,
    scroll_easing: 'ease_in_out_quad',
    scroll_back: false,
    scroll_complete: false,
    block_cookie_banners: true,
    cache: true,
    cache_ttl: 14400,
    cache_key: `previa-${Date.now().toString(36)}`,
    response_type: 'json',
  }
  const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo), signal: AbortSignal.timeout(110_000) })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = json?.error_message || json?.message || res.statusText
    if (res.status === 401 || res.status === 403) throw new Error(`ScreenshotOne: chave inválida (${msg})`)
    if (res.status === 402 || /quota|limit/i.test(msg)) throw new Error(`ScreenshotOne: acabou a cota do plano (${msg})`)
    throw new Error(`ScreenshotOne: ${msg}`)
  }
  const url = json?.cache_url || json?.screenshot_url || json?.store?.location
  if (!url) throw new Error('ScreenshotOne não devolveu o link do vídeo.')
  return { url }
}
