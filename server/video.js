// 🐈‍⬛ Gato Negro — grava um vídeo curto da prévia aprovada, em formato de celular, para mandar ao cliente.
// Abre o site num Chromium invisível, rola a página do topo ao fim (as animações aparecem no caminho)
// e converte para MP4 (H.264), que o WhatsApp aceita.
//
// Precisa, no computador que roda o servidor:
//   npm install                         (instala playwright-core e ffmpeg-static, opcionais)
//   npx playwright-core install chromium   (baixa o navegador; ou defina CHROMIUM_PATH)
// Não roda no Vercel (lá não há navegador): a interface avisa.

import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const LARGURA = 390
const ALTURA = 844

async function carregarChromium() {
  let chromium
  try {
    ;({ chromium } = await import('playwright-core'))
  } catch {
    throw new Error('Gravação de vídeo indisponível neste servidor: rode "npm install" no computador.')
  }
  try {
    return await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
  } catch {
    throw new Error('Navegador para gravar não encontrado: rode "npx playwright-core install chromium" (ou defina CHROMIUM_PATH).')
  }
}

async function caminhoFfmpeg() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH
  try {
    const mod = await import('ffmpeg-static')
    return mod.default || null
  } catch {
    return null
  }
}

// Este servidor consegue gravar? Só se o navegador existir de verdade (no Vercel não existe).
let podeGravarCache
export async function servidorGrava() {
  if (podeGravarCache !== undefined) return podeGravarCache
  podeGravarCache = false
  if (process.env.VERCEL || process.env.NETLIFY) return podeGravarCache
  try {
    const { existsSync } = await import('node:fs')
    const { chromium } = await import('playwright-core')
    podeGravarCache = existsSync(process.env.CHROMIUM_PATH || chromium.executablePath())
  } catch {
    podeGravarCache = false
  }
  return podeGravarCache
}

const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

export async function gravarVideo(html, { segundos = 12 } = {}) {
  const pasta = await mkdtemp(join(tmpdir(), 'gato-video-'))
  const navegador = await carregarChromium()
  try {
    const contexto = await navegador.newContext({
      viewport: { width: LARGURA, height: ALTURA },
      recordVideo: { dir: pasta, size: { width: LARGURA, height: ALTURA } },
    })
    const pagina = await contexto.newPage()
    // A prévia é autossuficiente (fotos em data:); nada de rede durante a gravação.
    await pagina.route(/^https?:/, (r) => r.abort())
    await pagina.setContent(html, { waitUntil: 'load' })
    await pagina.waitForTimeout(1800) // deixa a capa animar

    const total = await pagina.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
    const passos = 150
    const pausa = Math.max(16, ((segundos - 3) * 1000) / passos)
    for (let i = 1; i <= passos; i++) {
      await pagina.evaluate((y) => window.scrollTo(0, y), Math.round(total * suave(i / passos)))
      await pagina.waitForTimeout(pausa)
    }
    await pagina.waitForTimeout(1000)
    const video = pagina.video()
    await contexto.close() // fecha e finaliza o arquivo
    const webm = await video.path()

    const ffmpeg = await caminhoFfmpeg()
    if (!ffmpeg) return { tipo: 'video/webm', buffer: await readFile(webm) }
    const mp4 = join(pasta, 'previa.mp4')
    await exec(ffmpeg, ['-y', '-i', webm, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', mp4])
    return { tipo: 'video/mp4', buffer: await readFile(mp4) }
  } finally {
    await navegador.close().catch(() => {})
    await rm(pasta, { recursive: true, force: true }).catch(() => {})
  }
}
