// 📲 WhatsApp Web no notebook (pedido do usuário: "a Aranha clica no meu WhatsApp e manda a mensagem por cliente").
// Só funciona com o app rodando no computador (iniciar-windows.bat): abre uma janela do Chrome com o WhatsApp Web,
// que fica logado (pasta ~/.central-agentes/whatsapp). A Aranha abre a conversa do cliente, anexa o vídeo e escreve a
// mensagem — e SÓ aperta enviar quando você clica em "Aprovar e enviar" (regra do projeto: nada sai sem aprovação).
// Também lê as mensagens recebidas para a Aranha sugerir a próxima resposta.
// ⚠️ Automação não oficial: o WhatsApp pode bloquear números que mandam muitas mensagens para quem não os tem salvos.

import { mkdir, writeFile, rm } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { acharNavegador } from './video.js'

const PERFIL = process.env.ZAP_PERFIL || join(homedir(), '.central-agentes', 'whatsapp')
const BASE = process.env.ZAP_BASE || 'https://web.whatsapp.com' // ZAP_BASE/ZAP_HEADLESS: só para teste
let contexto = null
let pagina = null

const CAIXA = 'footer div[contenteditable="true"]'
const ENVIAR = 'span[data-icon="send"], span[data-icon="wds-ic-send-filled"], button[aria-label="Enviar"], button[aria-label="Send"]'
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const digitos = (t) => String(t || '').replace(/\D/g, '')
const comDDI = (t) => {
  const d = digitos(t)
  return d.length === 10 || d.length === 11 ? `55${d}` : d
}

async function abrirJanela() {
  if (pagina && !pagina.isClosed()) return pagina
  const { chromium } = await import('playwright-core').catch(() => {
    throw new Error('Rode "npm install" no computador para usar o WhatsApp Web pela Aranha.')
  })
  const executavel = await acharNavegador()
  if (!executavel) throw new Error('Instale o Google Chrome (ou o Edge) no computador.')
  await mkdir(PERFIL, { recursive: true })
  contexto = await chromium.launchPersistentContext(PERFIL, { executablePath: executavel, headless: process.env.ZAP_HEADLESS === '1', viewport: null, args: ['--start-maximized'] })
  contexto.on('close', () => {
    contexto = null
    pagina = null
  })
  pagina = contexto.pages()[0] || (await contexto.newPage())
  await pagina.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  return pagina
}

// 'qr' = falta escanear o QR code no celular · 'pronto' = logado · 'fechado' = janela não aberta
export async function statusZap() {
  if (!pagina || pagina.isClosed()) return { status: 'fechado' }
  const logado = await pagina.locator('#pane-side, [data-testid="chat-list"], div[aria-label="Lista de conversas"], div[aria-label="Chat list"]').count().catch(() => 0)
  if (logado) return { status: 'pronto' }
  const qr = await pagina.locator('canvas[aria-label], div[data-ref] canvas, [data-testid="qrcode"]').count().catch(() => 0)
  return { status: qr ? 'qr' : 'carregando' }
}

export async function conectarZap() {
  await abrirJanela()
  for (let i = 0; i < 20; i++) {
    const s = await statusZap()
    if (s.status === 'pronto' || s.status === 'qr') return s
    await esperar(1000)
  }
  return statusZap()
}

async function abrirConversa(telefone) {
  const p = await abrirJanela()
  if ((await statusZap()).status !== 'pronto') throw new Error('Conecte o WhatsApp primeiro: escaneie o QR code na janela que abriu.')
  await p.goto(`${BASE}/send?phone=${comDDI(telefone)}`, { waitUntil: 'domcontentloaded' })
  const caixa = p.locator(CAIXA).last()
  const invalido = p.getByText(/inválido|invalid|não está no WhatsApp|isn.t on WhatsApp/i)
  const r = await Promise.race([
    caixa.waitFor({ timeout: 45_000 }).then(() => 'ok'),
    invalido.first().waitFor({ timeout: 45_000 }).then(() => 'invalido'),
  ]).catch(() => 'tempo')
  if (r === 'invalido') throw new Error('Este número não tem WhatsApp (ou está errado).')
  if (r === 'tempo') throw new Error('A conversa não abriu a tempo no WhatsApp Web.')
  return p
}

// Envia vídeo (com a mensagem como legenda) ou só a mensagem. Chamado apenas depois do clique "Aprovar e enviar".
export async function enviarZap({ telefone, texto, video, tipoVideo }) {
  const p = await abrirConversa(telefone)
  if (video) {
    const pasta = join(tmpdir(), 'central-agentes-zap')
    await mkdir(pasta, { recursive: true })
    const arquivo = join(pasta, `previa-${Date.now()}.${String(tipoVideo).includes('webm') ? 'webm' : 'mp4'}`)
    await writeFile(arquivo, Buffer.from(video, 'base64'))
    try {
      await p.locator('span[data-icon="plus"], span[data-icon="attach-menu-plus"], span[data-icon="clip"], button[title="Anexar"], button[aria-label="Anexar"]').first().click()
      const entrada = p.locator('input[type="file"][accept*="video"]').first()
      await entrada.waitFor({ state: 'attached', timeout: 10_000 })
      await entrada.setInputFiles(arquivo)
      // Legenda do vídeo = a mensagem (vídeo e texto chegam juntos).
      const legenda = p.locator('div[contenteditable="true"][data-lexical-editor="true"], div[contenteditable="true"]').last()
      await legenda.waitFor({ timeout: 20_000 })
      if (texto) {
        await legenda.click()
        await p.keyboard.insertText(texto)
      }
      await p.locator(ENVIAR).last().click({ timeout: 20_000 })
    } finally {
      setTimeout(() => rm(arquivo, { force: true }).catch(() => {}), 60_000)
    }
  } else {
    const caixa = p.locator(CAIXA).last()
    await caixa.click()
    await p.keyboard.insertText(texto)
    await p.keyboard.press('Enter')
  }
  await esperar(2500)
  return { ok: true }
}

// Lê as mensagens recebidas (do cliente) na conversa — as últimas 15.
export async function lerConversaZap(telefone) {
  const p = await abrirConversa(telefone)
  await esperar(1500)
  const textos = await p
    .locator('div.message-in')
    .evaluateAll((els) =>
      els.slice(-15).map((el) => {
        const t = el.querySelector('span.selectable-text, [data-testid="msg-text"]')
        const meta = el.querySelector('[data-pre-plain-text]')?.getAttribute('data-pre-plain-text') || ''
        return { texto: (t?.innerText || '').trim(), meta }
      }),
    )
    .catch(() => [])
  return { mensagens: textos.filter((m) => m.texto) }
}
