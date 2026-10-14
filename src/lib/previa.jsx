// Monta o HTML da prévia do site do cliente (mesmo componente que vai no ZIP), com o CSS compilado
// e o efeito de água embutidos. Usado pelo Leão (conferir dados e fotos) e pelo Gato Negro (aprovação).
import { renderToStaticMarkup } from 'react-dom/server'
import Site from './ClienteSite.jsx'
import clienteCss from './cliente.css?inline'
import aguaSource from './clienteAgua.js?raw'
import efeitosSource from './clienteEfeitos.js?raw'

// O arquivo é um módulo (export); na prévia ele roda como script comum.
const comoScript = (fonte) => fonte.replace(/^export /gm, '').replace(/<\/script/gi, '<\\/script')
const aguaScript = comoScript(aguaSource)
const efeitosScript = comoScript(efeitosSource)

// Passeio para o vídeo: o app manda postMessage({ tipo: 'passeio-previa', ms }) e a prévia passa um
// "cursor" pela capa (a água segue) e depois rola até o fim, devagar.
const passeioScript = `
addEventListener('message', function (e) {
  if (!e.data || e.data.tipo !== 'passeio-previa') return
  var total = e.data.ms || 11000, capa = 3000, inicio = performance.now()
  scrollTo(0, 0)
  function quadro(agora) {
    var t = agora - inicio
    if (t < capa) {
      var p = t / capa
      dispatchEvent(new PointerEvent('pointermove', { clientX: innerWidth * (0.15 + 0.7 * p), clientY: innerHeight * (0.35 + 0.15 * Math.sin(p * 6.28)) }))
    } else {
      var q = Math.min(1, (t - capa) / (total - capa))
      var suave = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2
      scrollTo(0, suave * (document.documentElement.scrollHeight - innerHeight))
    }
    if (t < total) requestAnimationFrame(quadro)
  }
  requestAnimationFrame(quadro)
})`

export const paraDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })

// fotos: [{ caminho, blob }] → { caminho: dataUrl }
export async function fotosEmDataUrl(fotos) {
  const pares = await Promise.all(fotos.map(async (f) => [f.caminho, await paraDataUrl(f.blob)]))
  return Object.fromEntries(pares)
}

// Fonte do site modelo (Google Fonts), quando o tema "Do modelo" está ativo.
export function linkDaFonte(dados) {
  const fonte = dados.tema === 'modelo' && dados.modelo?.estilo?.fonte
  if (!fonte || !/^[\w -]{2,40}$/.test(fonte)) return ''
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(fonte).replace(/%20/g, '+')}:wght@400;600;700;800&display=swap">`
}

// cssExtra: só para as miniaturas dos temas (ex.: capa mais baixa para aparecer o resto do site).
export function htmlDaPrevia(dados, fotosUrl, cssExtra = '') {
  const comFotos = {
    ...dados,
    imagens: (dados.imagens || [])
      .filter((img) => fotosUrl[img.arquivo])
      .map((img) => ({ ...img, arquivo: fotosUrl[img.arquivo] })),
  }
  const html = renderToStaticMarkup(<Site dados={comFotos} />)
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><base target="_blank">
${linkDaFonte(dados)}<style>${clienteCss}${cssExtra}</style></head><body>${html}<script>${aguaScript}
iniciarAgua(document)
${efeitosScript}
iniciarEfeitos(document)
${passeioScript}</script></body></html>`
}

// Scripts liberados só para o efeito de água; sem allow-same-origin, a prévia não acessa o app.
export const SANDBOX_PREVIA = 'allow-scripts allow-popups allow-popups-to-escape-sandbox'

// Grava o quadro da prévia no próprio navegador (Chrome/Edge no computador): o usuário autoriza gravar a aba,
// o vídeo é recortado só no quadro (Region Capture) e a prévia faz o passeio. MP4 quando o navegador grava MP4.
export async function gravarPreviaNoNavegador(iframe, ms = 12000) {
  if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === 'undefined') {
    throw new Error(
      'Este navegador não grava a tela. Use o Chrome ou o Edge no computador — ou, no celular, abra a prévia e use o gravador de tela do aparelho.',
    )
  }
  // O recorte só pega a parte do quadro que está na tela: centraliza a prévia antes.
  iframe.scrollIntoView({ block: 'center' })
  let stream
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
    })
  } catch (e) {
    if (e?.name === 'NotAllowedError') {
      throw new Error('Gravação cancelada — para gravar, escolha "Esta aba" e clique em Compartilhar.')
    }
    throw new Error(`Não consegui gravar a tela (${e?.message || e}).`)
  }
  const [faixa] = stream.getVideoTracks()
  if (window.CropTarget && faixa.cropTo) {
    try {
      await faixa.cropTo(await window.CropTarget.fromElement(iframe))
    } catch {
      /* sem recorte: grava a aba inteira */
    }
  }
  const tipo = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t))
  const gravador = new MediaRecorder(stream, { mimeType: tipo, videoBitsPerSecond: 5_000_000 })
  const partes = []
  gravador.ondataavailable = (e) => e.data.size && partes.push(e.data)
  const parou = new Promise((resolve) => (gravador.onstop = resolve))
  gravador.start(500)
  iframe.contentWindow?.postMessage({ tipo: 'passeio-previa', ms: ms - 800 }, '*')
  await new Promise((resolve) => {
    const t = setTimeout(resolve, ms)
    faixa.addEventListener('ended', () => (clearTimeout(t), resolve()), { once: true })
  })
  if (gravador.state !== 'inactive') gravador.stop()
  stream.getTracks().forEach((t) => t.stop())
  await parou
  return new Blob(partes, { type: (tipo || 'video/webm').split(';')[0] })
}

// Miniatura do tema no painel: capa baixa e sem animação de entrada, para comparar cores e seções lado a lado.
export const CSS_MINIATURA =
  'header#topo{height:380px!important;min-height:0!important}header#topo h1{font-size:64px!important}nav{position:absolute!important}.anim-subir,.anim-zoom{animation:none!important}'
