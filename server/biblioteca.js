// 📚 Biblioteca do 🐈‍⬛ Gato (pedido do usuário: "vou colar sites modelo, curso em PDF e sites interativos para ele estudar").
// lerLink: baixa a página (sem Firecrawl — funciona sem crédito) e tira título, texto, fontes e as TÉCNICAS interativas que
// o site usa (GSAP, Lenis, Swiper, clip-path, scroll-snap…). licoesDe: a Groq transforma o material em lições curtas para o
// Gato aplicar nos sites de comércio local. Você aprova as lições na tela; as aprovadas vão junto em todo site.

import { lookup } from 'node:dns/promises'
import net from 'node:net'
import { groq } from './tigre.js'

const MAX_HTML = 2_000_000
const MAX_TEXTO = 14_000

// Não deixa o servidor ser usado para abrir endereços internos (localhost, rede privada, nuvem).
function ipPrivado(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  }
  const v = ip.toLowerCase()
  if (v.startsWith('::ffff:')) return ipPrivado(v.slice(7))
  return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80')
}

async function conferirEndereco(url) {
  let u
  try {
    u = new URL(url)
  } catch {
    throw new Error('Link inválido.')
  }
  if (!/^https?:$/.test(u.protocol)) throw new Error('Use um link http(s).')
  if (/^(localhost|.*\.local|.*\.internal)$/i.test(u.hostname)) throw new Error('Esse endereço não pode ser lido.')
  const ends = await lookup(u.hostname, { all: true }).catch(() => [])
  if (!ends.length) throw new Error('Não achei esse site.')
  if (ends.some((e) => ipPrivado(e.address))) throw new Error('Esse endereço não pode ser lido.')
  return u
}

async function baixar(url) {
  let atual = url
  for (let i = 0; i < 4; i++) {
    await conferirEndereco(atual)
    const res = await fetch(atual, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'Mozilla/5.0 (CentralDeAgentes; Biblioteca do Gato)', Accept: 'text/html,application/xhtml+xml' },
    })
    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      atual = new URL(res.headers.get('location'), atual).href
      continue
    }
    if (!res.ok) throw new Error(`O site respondeu ${res.status}.`)
    const leitor = res.body.getReader()
    const partes = []
    let total = 0
    while (total < MAX_HTML) {
      const { done, value } = await leitor.read()
      if (done) break
      partes.push(value)
      total += value.length
    }
    leitor.cancel().catch(() => {})
    return { html: Buffer.concat(partes).toString('utf8'), url: atual }
  }
  throw new Error('Redirecionamentos demais.')
}

// Técnicas de sites interativos que dá para reconhecer no código da página.
const TECNICAS = [
  [/gsap|greensock/i, 'GSAP (animações na linha do tempo)'],
  [/ScrollTrigger/, 'GSAP ScrollTrigger (animação presa à rolagem)'],
  [/lenis/i, 'Lenis (rolagem suave)'],
  [/locomotive-scroll/i, 'Locomotive Scroll (rolagem suave com parallax)'],
  [/three(\.module)?(\.min)?\.js|THREE\./, 'Three.js (3D/WebGL)'],
  [/swiper/i, 'Swiper (carrossel com arraste)'],
  [/aos(\.min)?\.(js|css)|data-aos=/i, 'AOS (animação ao rolar)'],
  [/barba(\.min)?\.js|data-barba/i, 'Barba.js (transição entre páginas)'],
  [/lottie/i, 'Lottie (animações vetoriais)'],
  [/split-?type|splitting/i, 'Texto quebrado em letras/palavras para animar'],
  [/framer-motion|data-framer/i, 'Framer / Framer Motion'],
  [/webflow/i, 'Webflow Interactions'],
  [/scroll-snap-type/i, 'Scroll snap (seções que encaixam ao rolar)'],
  [/backdrop-filter/i, 'Vidro fosco (backdrop-filter)'],
  [/clip-path/i, 'Recortes animados (clip-path)'],
  [/mix-blend-mode/i, 'Mistura de cores (mix-blend-mode)'],
  [/cursor\s*:\s*none|custom-?cursor|cursor-follower/i, 'Cursor personalizado'],
  [/view-transition/i, 'View Transitions (troca de tela animada)'],
  [/IntersectionObserver/, 'Intersection Observer (revelar ao rolar)'],
  [/@keyframes/i, 'Animações CSS (@keyframes)'],
  [/marquee/i, 'Faixa que corre (marquee)'],
  [/<video[^>]+autoplay/i, 'Vídeo de fundo em loop'],
  [/position\s*:\s*sticky/i, 'Elementos fixos ao rolar (sticky)'],
]

const semTags = (h) =>
  h
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim()

export async function lerLink(url) {
  const { html, url: final } = await baixar(url)
  return analisarHtml(html, final)
}

export function analisarHtml(html, final) {
  const titulo = semTags((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').slice(0, 120) || new URL(final).hostname
  const descricao = (html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i) || [])[1] || ''
  const titulos = [...html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => `H${m[1]}: ${semTags(m[2])}`).filter((t) => t.length > 4).slice(0, 30)
  const linksFonte = [...html.matchAll(/fonts\.googleapis\.com\/css2?\?[^"'>\s]+/gi)].map((m) => m[0].replace(/&amp;/g, '&'))
  const fontes = [
    ...new Set(linksFonte.flatMap((l) => [...l.matchAll(/family=([^&]+)/g)].flatMap((m) => decodeURIComponent(m[1]).split('|').map((f) => f.split(':')[0].replace(/\+/g, ' '))))),
  ].slice(0, 6)
  const tecnicas = TECNICAS.filter(([re]) => re.test(html)).map(([, nome]) => nome)
  const texto = [descricao && `Descrição: ${descricao}`, titulos.length && `Títulos:\n${titulos.join('\n')}`, `Texto:\n${semTags(html.replace(/<head[\s\S]*?<\/head>/i, ''))}`]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, MAX_TEXTO)
  return { titulo, url: final, texto, tecnicas, fontes }
}

const SISTEMA = `Você é o professor do Gato Negro, o agente que cria sites de uma página para comércios locais brasileiros
(barbearia, salão, oficina, pet shop, restaurante…) a partir de dados reais do comércio.
Leia o material e tire LIÇÕES PRÁTICAS que o Gato pode aplicar nesses sites: design, estrutura das seções, texto que vende
(chamadas, botões), confiança, interação/animação (como fazer em CSS/JS puro), desempenho e celular.
Regras: cada lição é uma instrução curta e acionável (até 200 caracteres), em português do Brasil; nada de dado do material
(nomes de empresas, preços, depoimentos) como se fosse do cliente; nada que mande inventar informação; ignore o que não serve
para site de comércio local (ex.: afiliados, tráfego pago, vender curso). Se o material não tiver nada útil, devolva lista vazia.
Responda SÓ com JSON: {"resumo":"1-2 frases sobre o material","licoes":[{"texto":"…","categoria":"design|estrutura|texto|interacao|tecnica"}]}
com no máximo 10 lições, as mais valiosas primeiro.`

const CATEGORIAS = ['design', 'estrutura', 'texto', 'interacao', 'tecnica']

export async function licoesDe({ titulo, tipo, texto, tecnicas = [], fontes = [] }) {
  if (!process.env.GROQ_API_KEY) throw Object.assign(new Error('Sem GROQ_API_KEY — escreva as lições à mão.'), { code: 'NO_KEY' })
  const user = `Material (${tipo || 'texto'}): ${titulo || '—'}
${tecnicas.length ? `Técnicas interativas encontradas no código: ${tecnicas.join('; ')}\n` : ''}${fontes.length ? `Fontes usadas: ${fontes.join(', ')}\n` : ''}
${String(texto || '').slice(0, MAX_TEXTO)}`
  const json = JSON.parse(await groq({ system: SISTEMA, user, json: true, maxTokens: 1500, temperatura: 0.2 }))
  const licoes = (Array.isArray(json.licoes) ? json.licoes : [])
    .map((l) => ({ texto: String(l?.texto || '').replace(/\s+/g, ' ').trim().slice(0, 240), categoria: CATEGORIAS.includes(l?.categoria) ? l.categoria : 'design' }))
    .filter((l) => l.texto.length > 10)
    .slice(0, 10)
  return { resumo: String(json.resumo || '').slice(0, 300), licoes }
}

// Lições aprovadas que chegam do app: só texto curto, no máximo 40.
export const licoesSeguras = (lista) =>
  (Array.isArray(lista) ? lista : [])
    .map((l) => String(l || '').replace(/\s+/g, ' ').trim().slice(0, 300))
    .filter(Boolean)
    .slice(0, 40)
