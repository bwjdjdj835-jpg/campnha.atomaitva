// Monta o HTML da prévia do site do cliente (mesmo componente que vai no ZIP), com o CSS compilado
// e o efeito de água embutidos. Usado pelo Leão (conferir dados e fotos) e pelo Gato Negro (aprovação).
import { renderToStaticMarkup } from 'react-dom/server'
import Site from './ClienteSite.jsx'
import clienteCss from './cliente.css?inline'
import aguaSource from './clienteAgua.js?raw'

// O arquivo é um módulo (export); na prévia ele roda como script comum.
const aguaScript = aguaSource.replace(/^export /gm, '').replace(/<\/script/gi, '<\\/script')

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

export function htmlDaPrevia(dados, fotosUrl) {
  const comFotos = {
    ...dados,
    imagens: (dados.imagens || [])
      .filter((img) => fotosUrl[img.arquivo])
      .map((img) => ({ ...img, arquivo: fotosUrl[img.arquivo] })),
  }
  const html = renderToStaticMarkup(<Site dados={comFotos} />)
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><base target="_blank">
${linkDaFonte(dados)}<style>${clienteCss}</style></head><body>${html}<script>${aguaScript}
iniciarAgua(document)</script></body></html>`
}

// Scripts liberados só para o efeito de água; sem allow-same-origin, a prévia não acessa o app.
export const SANDBOX_PREVIA = 'allow-scripts allow-popups allow-popups-to-escape-sandbox'
