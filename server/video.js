// 🐈‍⬛ Gato Negro — grava um vídeo curto da prévia aprovada, em formato de celular, para mandar ao cliente.
// Abre o site num Chromium invisível, rola a página do topo ao fim (as animações aparecem no caminho)
// e converte para MP4 (H.264), que o WhatsApp aceita.
//
// Precisa, no computador que roda o servidor (ex.: o notebook, com iniciar-windows.bat):
//   npm install   (instala playwright-core e ffmpeg-static, opcionais)
//   um navegador: usa o Google Chrome ou o Edge já instalados (Windows/Mac/Linux); senão CHROMIUM_PATH
//   ou "npx playwright-core install chromium".
// Não roda no Vercel (lá não há navegador): a interface grava pelo navegador do usuário.

import { mkdtemp, readFile, rm, mkdir, writeFile, access } from 'node:fs/promises'
import { tmpdir, homedir } from 'node:os'
import { join, resolve, dirname, sep } from 'node:path'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const LARGURA = 390
const ALTURA = 844

// Navegador para gravar: CHROMIUM_PATH → Chromium do Playwright → Chrome/Edge instalados no computador.
export async function acharNavegador() {
  const { existsSync } = await import('node:fs')
  const candidatos = [process.env.CHROMIUM_PATH]
  try {
    const { chromium } = await import('playwright-core')
    candidatos.push(chromium.executablePath())
  } catch {
    /* sem playwright-core */
  }
  const local = process.env.LOCALAPPDATA || ''
  candidatos.push(
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    local && join(local, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
  )
  return candidatos.find((c) => c && existsSync(c)) || null
}

async function carregarChromium() {
  let chromium
  try {
    ;({ chromium } = await import('playwright-core'))
  } catch {
    throw new Error('Gravação de vídeo indisponível neste servidor: rode "npm install" no computador.')
  }
  const executavel = await acharNavegador()
  if (!executavel) throw new Error('Navegador para gravar não encontrado: instale o Google Chrome (ou defina CHROMIUM_PATH).')
  try {
    return await chromium.launch({ executablePath: executavel })
  } catch (e) {
    throw new Error(`Não consegui abrir o navegador para gravar (${executavel}): ${e.message}`)
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
    await import('playwright-core')
    podeGravarCache = Boolean(await acharNavegador())
  } catch {
    podeGravarCache = false
  }
  return podeGravarCache
}

const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

// Grava quadro a quadro: rola a página, tira um print em 2× e o ffmpeg junta tudo em MP4 H.264 a 20 quadros/s.
// Fica nítido e nunca corrompe (cada quadro é uma imagem inteira). Sem ffmpeg, cai no gravador do Playwright (WebM).
const QUADROS_POR_SEGUNDO = 20

export async function gravarVideo(html, { segundos = 20 } = {}) {
  const pasta = await mkdtemp(join(tmpdir(), 'gato-video-'))
  const navegador = await carregarChromium()
  const ffmpeg = await caminhoFfmpeg()
  try {
    const contexto = await navegador.newContext({
      viewport: { width: LARGURA, height: ALTURA },
      deviceScaleFactor: ffmpeg ? 2 : 1,
      ...(ffmpeg ? {} : { recordVideo: { dir: pasta, size: { width: LARGURA, height: ALTURA } } }),
    })
    const pagina = await contexto.newPage()
    // Fotos vêm em data:; a rede só leva o mapa e a fonte. Se demorar, grava assim mesmo.
    await pagina.setContent(html, { waitUntil: 'load', timeout: 20_000 }).catch(() => {})
    await pagina.waitForTimeout(1800) // deixa a capa animar

    const total = await pagina.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
    if (ffmpeg) {
      const quadros = segundos * QUADROS_POR_SEGUNDO
      const capa = 3 * QUADROS_POR_SEGUNDO // 3 s parado na capa
      for (let i = 0; i < quadros; i++) {
        const t = i < capa ? 0 : (i - capa) / Math.max(1, quadros - capa - 1)
        await pagina.evaluate((y) => window.scrollTo(0, y), Math.round(total * suave(t)))
        await pagina.screenshot({ type: 'jpeg', quality: 88, path: join(pasta, `q${String(i).padStart(4, '0')}.jpg`) })
      }
      await contexto.close()
      const mp4 = join(pasta, 'previa.mp4')
      await exec(ffmpeg, [
        '-y', '-framerate', String(QUADROS_POR_SEGUNDO), '-i', join(pasta, 'q%04d.jpg'),
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', '-movflags', '+faststart', '-an', mp4,
      ])
      return { tipo: 'video/mp4', buffer: await readFile(mp4) }
    }

    const passos = 150
    const pausa = Math.max(16, ((segundos - 3) * 1000) / passos)
    for (let i = 1; i <= passos; i++) {
      await pagina.evaluate((y) => window.scrollTo(0, y), Math.round(total * suave(i / passos)))
      await pagina.waitForTimeout(pausa)
    }
    await pagina.waitForTimeout(1000)
    const video = pagina.video()
    await contexto.close() // fecha e finaliza o arquivo
    return { tipo: 'video/webm', buffer: await readFile(await video.path()) }
  } finally {
    await navegador.close().catch(() => {})
    await rm(pasta, { recursive: true, force: true }).catch(() => {})
  }
}

// Pasta dos vídeos no computador: Vídeos\Central de Agentes\<nicho>\<comércio>.mp4
export const PASTA_VIDEOS = join(homedir(), 'Videos', 'Central de Agentes')
const limpar = (t) =>
  String(t || '').normalize('NFC').replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'sem-nome'

export async function salvarNaPasta(buffer, tipo, { pasta, nome }) {
  const dir = join(PASTA_VIDEOS, limpar(pasta))
  await mkdir(dir, { recursive: true })
  const arquivo = join(dir, `${limpar(nome)}.${tipo.includes('mp4') ? 'mp4' : 'webm'}`)
  await writeFile(arquivo, buffer)
  return arquivo
}

// Mostra o arquivo no Explorador (Windows), Finder (Mac) ou abre a pasta (Linux). Só aceita arquivos da pasta dos vídeos.
export async function abrirPasta(arquivo) {
  const alvo = resolve(String(arquivo || ''))
  if (!alvo.startsWith(PASTA_VIDEOS + sep)) return false
  try {
    await access(alvo)
  } catch {
    return false
  }
  const [cmd, args] =
    process.platform === 'win32' ? ['explorer.exe', [`/select,${alvo}`]] : process.platform === 'darwin' ? ['open', ['-R', alvo]] : ['xdg-open', [dirname(alvo)]]
  const p = spawn(cmd, args, { detached: true, stdio: 'ignore' })
  p.on('error', () => {})
  p.unref()
  return true
}
