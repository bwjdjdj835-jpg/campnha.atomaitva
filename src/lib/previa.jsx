// Monta o HTML da prévia do site do cliente (mesmo componente que vai no ZIP), com o CSS compilado
// e o efeito de água embutidos. Usado pelo Leão (conferir dados e fotos) e pelo Gato Negro (aprovação).
import { trocarFotos } from './siteProprio.js'
import { renderToStaticMarkup } from 'react-dom/server'
import Site, { fonteDoSite } from './ClienteSite.jsx'
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

// Fotos menores (até 1000 px, JPEG) — para mandar a prévia para gravar na nuvem sem passar do limite do Vercel.
export async function fotosMenores(fotos, max = 1000) {
  const pares = await Promise.all(
    fotos.map(async (f) => {
      try {
        const img = await createImageBitmap(f.blob)
        const k = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * k)
        c.height = Math.round(img.height * k)
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        return [f.caminho, c.toDataURL('image/jpeg', 0.75)]
      } catch {
        return [f.caminho, await paraDataUrl(f.blob)]
      }
    }),
  )
  return Object.fromEntries(pares)
}

// Fonte do site modelo (Google Fonts), quando o tema "Do modelo" está ativo.
export function linkDaFonte(dados) {
  const fonte = fonteDoSite(dados)
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(fonte).replace(/%20/g, '+')}:wght@400;600;700;800&display=swap">`
}

// cssExtra: miniaturas dos temas (capa mais baixa) ou gravação do vídeo (sem granulado).
// agua: false na gravação — as ondas na foto parecem defeito no vídeo comprimido.
function htmlDoSiteProprio(dados, fotosUrl, cssExtra) {
  const html = trocarFotos(dados.htmlProprio, dados.imagens, (a) => fotosUrl[a] || '')
  const cabeca = `<base target="_blank">${cssExtra ? `<style>${cssExtra}</style>` : ''}`
  const comCabeca = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (h) => h + cabeca) : cabeca + html
  const passeio = `<script>${passeioScript}</script>`
  return /<\/body>/i.test(comCabeca) ? comCabeca.replace(/<\/body>/i, passeio + '</body>') : comCabeca + passeio
}

export function htmlDaPrevia(dados, fotosUrl, cssExtra = '', { agua = true } = {}) {
  if (dados.htmlProprio) return htmlDoSiteProprio(dados, fotosUrl, cssExtra)
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
${agua ? 'iniciarAgua(document)' : ''}
${efeitosScript}
iniciarEfeitos(document)
${passeioScript}</script></body></html>`
}

// Scripts liberados só para o efeito de água; sem allow-same-origin, a prévia não acessa o app.
export const SANDBOX_PREVIA = 'allow-scripts allow-popups allow-popups-to-escape-sandbox'

// Pede para gravar esta aba (o navegador mostra "Compartilhar esta aba?"). Uma autorização serve para vários vídeos:
// o modo automático pede uma vez no começo e grava a prévia de cada cliente com o mesmo fluxo.
export async function pedirGravacaoDaAba() {
  if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === 'undefined') {
    throw new Error(
      'Este navegador não grava a tela. Use o Chrome ou o Edge no computador — ou, no celular, abra a prévia e use o gravador de tela do aparelho.',
    )
  }
  try {
    return await navigator.mediaDevices.getDisplayMedia({
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
}

// Grava `ms` do quadro (iframe) usando um fluxo já autorizado. Não encerra o fluxo (dá para gravar o próximo).
// O vídeo é recortado só no quadro (Region Capture) e a prévia faz o passeio. MP4 quando o navegador grava MP4.
const recortes = new WeakMap() // faixa → quadro em que já está recortada (recortar de novo o mesmo quadro pode travar)
const noMaximo = (promessa, ms) => Promise.race([promessa, new Promise((r) => setTimeout(r, ms))])

// Tamanho fixo do vídeo: a imagem da aba é desenhada num canvas de tamanho fixo e é o canvas que é gravado. Se o
// tamanho da captura mudar no meio (o recorte entrando, zoom do Windows…), o Chrome gerava um MP4 H.264 corrompido —
// só o 1º quadro aparecia e o resto ficava cinza. Largura 540; a altura segue o formato do quadro (medido no começo).
const LARGURA_VIDEO = 540
// Duração padrão do vídeo (pedido do usuário: 9 s era curto demais para ver o comércio). Capa 3 s + rolagem devagar.
export const DURACAO_VIDEO = 20_000

export async function gravarComFluxo(stream, iframe, ms = DURACAO_VIDEO) {
  const [faixa] = stream.getVideoTracks()
  if (!faixa || faixa.readyState === 'ended') throw new Error('A gravação da aba foi encerrada — autorize de novo.')
  if (window.CropTarget && faixa.cropTo && recortes.get(faixa) !== iframe) {
    try {
      await noMaximo(
        (async () => faixa.cropTo(await window.CropTarget.fromElement(iframe)))().then(() => recortes.set(faixa, iframe)),
        3000,
      )
    } catch {
      /* sem recorte: o quadro é recortado à mão no canvas */
    }
  }
  const recortado = recortes.get(faixa) === iframe

  // Imagem da aba → <video> → canvas de tamanho fixo.
  // O <video> fica na página (quase invisível): fora dela, alguns Chrome no Windows quase não atualizam a imagem.
  const fonte = document.createElement('video')
  fonte.muted = true
  fonte.playsInline = true
  fonte.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0.01;pointer-events:none'
  document.body.appendChild(fonte)
  fonte.srcObject = new MediaStream([faixa])
  await fonte.play().catch(() => {})
  for (let i = 0; i < 40 && !fonte.videoWidth; i++) await new Promise((r) => setTimeout(r, 50))
  await new Promise((r) => setTimeout(r, 300)) // recorte já aplicado
  // Área do quadro da prévia na imagem: a imagem toda quando o navegador recortou; senão, recorta à mão.
  const area = () => {
    const vw = fonte.videoWidth
    const vh = fonte.videoHeight
    if (recortado) return [0, 0, vw, vh]
    const r = iframe.getBoundingClientRect()
    const k = vw / window.innerWidth
    const sx = Math.max(0, r.left * k)
    const sy = Math.max(0, r.top * k)
    return [sx, sy, Math.min(vw - sx, r.width * k), Math.min(vh - sy, r.height * k)]
  }
  const [, , w0, h0] = fonte.videoWidth ? area() : [0, 0, 9, 16]
  const ALTURA_VIDEO = Math.min(1200, Math.max(600, Math.round((LARGURA_VIDEO * h0) / w0 / 2) * 2)) // par, como o H.264 pede
  const tela = document.createElement('canvas')
  tela.width = LARGURA_VIDEO
  tela.height = ALTURA_VIDEO
  const ctx = tela.getContext('2d')
  let desenhando = true
  const desenhar = () => {
    if (!desenhando) return
    if (fonte.videoWidth && fonte.videoHeight) {
      const [sx, sy, sw, sh] = area()
      const escala = Math.min(LARGURA_VIDEO / sw, ALTURA_VIDEO / sh)
      const dw = sw * escala
      const dh = sh * escala
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, LARGURA_VIDEO, ALTURA_VIDEO)
      ctx.drawImage(fonte, sx, sy, sw, sh, (LARGURA_VIDEO - dw) / 2, (ALTURA_VIDEO - dh) / 2, dw, dh)
    }
  }
  // Desenha 30 vezes por segundo, num relógio próprio: o vídeo tem quadros do começo ao fim mesmo se a captura atrasar.
  desenhar()
  const relogio = setInterval(desenhar, 1000 / 30)

  const escolhido = TIPO_VIDEO()
  const gravador = new MediaRecorder(tela.captureStream(30), {
    mimeType: escolhido,
    videoBitsPerSecond: 4_000_000,
    videoKeyFrameIntervalDuration: 1000, // quadro-chave a cada 1 s (onde o navegador aceita)
  })
  // "video/mp4" sem codec só é escolhido quando o navegador NÃO grava H.264 (sai VP9 dentro do MP4, que o WhatsApp
  // e o player do Windows mostram quebrado) — marca isso no tipo para avisar.
  const tipo = /codecs=/.test(gravador.mimeType || '') ? gravador.mimeType : escolhido === 'video/mp4' ? 'video/mp4;codecs=vp9' : escolhido
  const partes = []
  gravador.ondataavailable = (e) => e.data.size && partes.push(e.data)
  const parou = new Promise((resolve) => (gravador.onstop = resolve))
  gravador.start() // um pedaço só no fim: MP4 inteiro, sem fragmentos
  iframe.contentWindow?.postMessage({ tipo: 'passeio-previa', ms: ms - 800 }, '*')
  await new Promise((resolve) => {
    const t = setTimeout(resolve, ms)
    faixa.addEventListener('ended', () => (clearTimeout(t), resolve()), { once: true })
  })
  if (gravador.state !== 'inactive') gravador.stop()
  await noMaximo(parou, 5000)
  desenhando = false
  clearInterval(relogio)
  fonte.srcObject = null
  fonte.remove()
  if (!partes.length) throw new Error('A gravação não captou nada — deixe esta aba aberta e na frente.')
  // Guarda o codec no tipo (ex.: "video/mp4;codecs=avc1…") para saber se o WhatsApp aceita.
  return new Blob(partes, { type: tipo || 'video/webm' })
}

// MP4 com H.264 primeiro: é o que o WhatsApp aceita. "video/mp4" sem codec pode sair em VP9 (Chromium sem H.264).
const TIPO_VIDEO = () =>
  [
    'video/mp4;codecs=avc1.42E01E',
    'video/mp4;codecs=avc1.4D401F',
    'video/mp4;codecs=avc1.640028',
    'video/mp4;codecs=avc1',
    'video/mp4;codecs=avc3',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm',
  ].find((t) => MediaRecorder.isTypeSupported(t))

// O WhatsApp aceita MP4 com H.264 (avc1/avc3). Sem o codec no tipo (vídeos antigos), confia no MP4.
export const videoAceitoNoWhatsApp = (blob) => /^video\/mp4/.test(blob?.type || '') && (!/codecs=/.test(blob.type) || /avc[13]/.test(blob.type))

// Grava o quadro da prévia no próprio navegador (Chrome/Edge no computador): um vídeo, uma autorização.
export async function gravarPreviaNoNavegador(iframe, ms = DURACAO_VIDEO) {
  // O recorte só pega a parte do quadro que está na tela: centraliza a prévia antes.
  iframe.scrollIntoView({ block: 'center' })
  const stream = await pedirGravacaoDaAba()
  try {
    return await gravarComFluxo(stream, iframe, ms)
  } finally {
    stream.getTracks().forEach((t) => t.stop())
  }
}

// Gravação do vídeo: sem o granulado de filme da capa (no vídeo comprimido ele vira imagem quebrada).
export const CSS_GRAVACAO = '.granulado{display:none!important}'

// Miniatura do tema no painel: capa baixa e sem animação de entrada, para comparar cores e seções lado a lado.
export const CSS_MINIATURA =
  'header#topo{height:380px!important;min-height:0!important}header#topo h1{font-size:64px!important}nav{position:absolute!important}.anim-subir,.anim-zoom{animation:none!important}'
