// Google Maps lido como página, pelo scrape comum do Firecrawl (todo plano tem; 1 crédito por página).
// Não precisa de API de Maps nem de faturamento no Google.
//   1. Página de busca do Maps → lista com nome, link da ficha, nota, categoria, endereço e foto.
//   2. Página de cada ficha → telefone e site/Instagram (para saber quem NÃO tem site).

import { dadosDaPaginaMaps } from './leao.js'

const MAX_FICHAS = 12 // fichas abertas por busca (cada uma custa 1 crédito)

export async function lerPagina(url, { esperar = 3000 } = {}) {
  const res = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: esperar,
      location: { country: 'BR', languages: ['pt-BR'] },
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.success === false) throw new Error(`Firecrawl: ${json.error || res.statusText}`)
  return (json.data || json).markdown || ''
}

const limparNome = (s) => s.replace(/\\(.)/g, '$1').replace(/\s+/g, ' ').trim()

// Lê a lista de resultados da página de busca do Google Maps.
export function lerListaMaps(md) {
  const marcas = [...md.matchAll(/\[([^\]]+)\]\((https:\/\/www\.google\.com\/maps\/place\/[^)\s]+)\)/g)]
  const vistos = new Set()
  const lista = []
  marcas.forEach((m, i) => {
    const url = m[2]
    const id = (url.match(/!19s(ChIJ[\w-]+)/) || url.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/) || [])[1] || url
    if (vistos.has(id)) return
    vistos.add(id)
    const bloco = md.slice(m.index + m[0].length, marcas[i + 1]?.index ?? md.length)
    const linhas = bloco.split('\n').map((l) => l.trim()).filter(Boolean)
    const iNota = linhas.findIndex((l) => /^\([\d.]+\)$/.test(l))
    const nota = iNota > 0 ? linhas[iNota - 1].match(/^(\d[,.]\d)$/) : null
    const catEnd = iNota >= 0 ? linhas[iNota + 1] || '' : linhas.find((l) => /·/.test(l)) || ''
    const [categoria, ...resto] = catEnd.split(/·+/)
    const foto = bloco.match(/!\[\]\((https:\/\/lh\d\.googleusercontent\.com\/[^)\s]+)\)/)
    const site = [...bloco.matchAll(/\[(Site|Website)\]\((https?:\/\/[^)\s]+)\)/gi)][0]
    lista.push({
      id,
      nome: limparNome(m[1]),
      categoria: categoria?.trim() || null,
      endereco: resto.join(' ').trim(),
      telefone: null,
      telefoneExibicao: null,
      siteMaps: site ? site[2] : null,
      maps: url,
      rating: nota ? Number(nota[1].replace(',', '.')) : null,
      avaliacoes: iNota >= 0 ? Number(linhas[iNota].replace(/\D/g, '')) : 0,
      fotos: foto ? [foto[1].replace(/=w\d+-h\d+[^/?]*$/, '=w1200-h900-k-no')] : [],
    })
  })
  return lista
}

// Na ficha do negócio: o site aparece como link cujo texto é o próprio domínio (ex.: "instagram.com").
export function siteDaFicha(md) {
  for (const m of md.matchAll(/([a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\]\s]*)?)\]\((https?:\/\/[^)\s]+)\)/gi)) {
    const host = new URL(m[2]).hostname
    if (!/(^|\.)(google\.[a-z.]+|gstatic\.com|googleusercontent\.com|goo\.gl)$/.test(host)) return m[2]
  }
  return null
}

async function emLotes(itens, tamanho, fn) {
  const saida = []
  for (let i = 0; i < itens.length; i += tamanho) {
    saida.push(...(await Promise.all(itens.slice(i, i + tamanho).map(fn))))
  }
  return saida
}

export async function buscarMapsPagina(query, log) {
  const md = await lerPagina(`https://www.google.com/maps/search/${encodeURIComponent(query)}?hl=pt-BR`, { esperar: 4000 })
  const lista = lerListaMaps(md)
  if (!lista.length) throw new Error('a página do Maps não trouxe resultados')
  log('ok', `Google Maps: ${lista.length} negócio(s) na busca — abrindo as fichas para ver telefone e site`)

  const abrir = lista.slice(0, MAX_FICHAS)
  const fichas = await emLotes(abrir, 3, async (c) => {
    try {
      const ficha = await lerPagina(c.maps, { esperar: 2500 })
      const pg = dadosDaPaginaMaps(ficha)
      return {
        ...c,
        telefone: pg.telefone,
        telefoneExibicao: pg.telefone,
        endereco: pg.endereco || c.endereco,
        siteMaps: c.siteMaps || siteDaFicha(ficha),
      }
    } catch (e) {
      log('warn', `${c.nome}: não consegui abrir a ficha (${e.message})`)
      return c
    }
  })
  if (lista.length > MAX_FICHAS) log('info', `Fichas abertas: ${MAX_FICHAS} de ${lista.length} (para economizar créditos)`)
  return fichas
}
