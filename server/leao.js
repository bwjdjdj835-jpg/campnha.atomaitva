// 🦁 Leão — baixa as fotos da ficha do Google (sem expor a chave ao navegador).
// Devolve o link público (photoUri, googleusercontent.com) e os bytes em base64 para irem no ZIP.

const MAX_FOTOS = 6

// Fotos que já vêm como link do Google (SerpApi): só aceita googleusercontent.com, para o servidor
// não virar um "baixador" de qualquer endereço.
const ehFotoDoGoogle = (url) => {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && /(^|\.)googleusercontent\.com$/.test(u.hostname)
  } catch {
    return false
  }
}

async function baixarLink(url) {
  const img = await fetch(url)
  if (!img.ok) return null
  const tipo = img.headers.get('content-type') || 'image/jpeg'
  if (!tipo.startsWith('image/')) return null
  return { original: url, url, tipo, base64: Buffer.from(await img.arrayBuffer()).toString('base64') }
}

export async function buscarFotos(names) {
  const key = process.env.GOOGLE_PLACES_API_KEY
  const links = names.filter(ehFotoDoGoogle).slice(0, MAX_FOTOS)
  const validos = key ? names.filter((n) => /^places\/[^/]+\/photos\/[^/]+$/.test(n)).slice(0, MAX_FOTOS) : []

  const deLinks = await Promise.all(links.map((u) => baixarLink(u).catch(() => null)))
  const fotos = await Promise.all(
    validos.map(async (name) => {
      const meta = await fetch(
        `https://places.googleapis.com/v1/${name}/media?maxWidthPx=1200&skipHttpRedirect=true&key=${key}`,
      )
      if (!meta.ok) return null
      const { photoUri } = await meta.json()
      if (!photoUri) return null
      const img = await fetch(photoUri)
      if (!img.ok) return null
      const tipo = img.headers.get('content-type') || 'image/jpeg'
      const base64 = Buffer.from(await img.arrayBuffer()).toString('base64')
      return { original: name, url: photoUri, tipo, base64 }
    }),
  )
  return [...deLinks, ...fotos].filter(Boolean).slice(0, MAX_FOTOS)
}

// Print da página do negócio (Google Maps, Instagram ou Facebook) via Firecrawl.
// O Firecrawl hospeda a imagem (link assinado, vale ~7 dias); devolvemos o link e os bytes para irem no ZIP.
const PRINT_PERMITIDO = /(^|\.)(google\.com|google\.com\.br|instagram\.com|facebook\.com)$|^maps\.app\.goo\.gl$/

export function linkPermitidoParaPrint(url) {
  try {
    const u = new URL(url)
    if (!/^https?:$/.test(u.protocol) || !PRINT_PERMITIDO.test(u.hostname)) return false
    return !/google\./.test(u.hostname) || u.hostname.startsWith('maps.') || u.pathname.startsWith('/maps')
  } catch {
    return false
  }
}

// Dados que aparecem na própria página do Google Maps (o mesmo que se vê no print).
export function dadosDaPaginaMaps(md = '') {
  // "+55 69 99282-0330" (página em inglês) ou "(69) 99282-0330" (página em português)
  const fone = md.match(/\+55[\d\s().-]{8,16}\d/) || md.match(/\(\d{2}\)\s?\d{4,5}-\d{4}/)
  const endereco = md.match(/^[^\n]*? - [A-Z]{2}, \d{5}-\d{3}[^\n]*$/m)
  const nota = md.match(/^(\d[.,]\d)\s*\n*\s*\(([\d.,]+)\)\s*$/m)
  return {
    telefone: fone ? fone[0].trim() : null,
    endereco: endereco ? endereco[0].trim().replace(/,\s*(Brazil|Brasil)$/i, '') : null,
    rating: nota ? Number(nota[1].replace(',', '.')) : null,
    avaliacoes: nota ? Number(nota[2].replace(/[.,]/g, '')) : 0,
  }
}

export async function tirarPrint(url) {
  const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
    body: JSON.stringify({
      url,
      formats: ['screenshot', 'markdown'],
      waitFor: 3000,
      location: { country: 'BR', languages: ['pt-BR'] },
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) throw new Error(`Print (Firecrawl): ${json.error || res.statusText}`)
  const dados = json.data || json
  if (!dados.screenshot) throw new Error('Print (Firecrawl): a página não devolveu imagem')
  const img = await fetch(dados.screenshot)
  if (!img.ok) throw new Error('Print: não consegui baixar a imagem')
  const ehMaps = /google\.[^/]+\/maps|maps\.google\.|maps\.app\.goo\.gl/.test(dados.metadata?.url || url)
  return {
    pagina: ehMaps ? dadosDaPaginaMaps(dados.markdown) : null,
    titulo: dados.metadata?.title || null,
    urlFinal: dados.metadata?.url || url,
    link: dados.screenshot,
    tipo: img.headers.get('content-type') || 'image/png',
    base64: Buffer.from(await img.arrayBuffer()).toString('base64'),
  }
}
