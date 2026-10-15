// 🐈‍⬛ Gato: monta o site do cliente IGUAL à imagem que você escolheu no Castor (layout, cores, fontes, estilo), com os dados
// e as fotos reais do comércio (pedido do usuário: "o Gato tem que gerar o site com base na imagem que eu anexei").
// A IA lê a imagem e devolve uma página HTML única; as fotos entram como {{FOTO_1}}, {{FOTO_2}}… e o app troca pelos arquivos.
// Ordem: Gemini (GEMINI_API_KEY, melhor para "imagem → site") → Groq com visão (GROQ_API_KEY).

import { groq } from './tigre.js'

const MODELOS_GEMINI = () => [process.env.GEMINI_TEXT_MODEL, 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean)
const MODELO_VISAO_GROQ = () => process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b'

export const temSiteDaImagem = () => Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY)

function pedido({ negocio = {}, conteudo = {}, fotos = 0 }) {
  const lista = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : [x.nome || x.titulo, x.descricao || x.texto].filter(Boolean).join(': '))).join('; ') : '')
  const dados = [
    `Nome: ${negocio.nome || '—'}`,
    `Ramo: ${negocio.categoria || '—'}`,
    negocio.endereco && `Endereço: ${negocio.endereco}`,
    negocio.telefone && `Telefone: ${negocio.telefone}`,
    negocio.whatsapp && `Link do WhatsApp (use em TODOS os botões de contato/agendar): ${negocio.whatsapp}`,
    negocio.maps && `Link do Google Maps (botão "Como chegar"): ${negocio.maps}`,
    negocio.rating != null && `Nota no Google: ${negocio.rating} (${negocio.avaliacoes || 0} avaliações)`,
    conteudo.slogan && `Frase da capa: ${conteudo.slogan}`,
    conteudo.sobre && `Sobre: ${conteudo.sobre}`,
    lista(conteudo.servicos) && `Serviços: ${lista(conteudo.servicos)}`,
    lista(conteudo.diferenciais) && `Diferenciais: ${lista(conteudo.diferenciais)}`,
    conteudo.horario && `Horário: ${typeof conteudo.horario === 'string' ? conteudo.horario : JSON.stringify(conteudo.horario)}`,
    Array.isArray(conteudo.depoimentos) && conteudo.depoimentos.length &&
      `Avaliações reais do Google (pode usar como depoimentos): ${conteudo.depoimentos.map((d) => `"${d.texto}" — ${d.autor || 'cliente'}`).join(' | ')}`,
  ].filter(Boolean)
  return `A imagem é o modelo de site escolhido. Recrie esse site como UMA página HTML completa, o mais FIEL possível à imagem:
mesmo layout e ordem das seções, mesmas cores, tipografia parecida (Google Fonts), mesmos cantos, sombras, botões e espaçamentos.
Mobile-first e responsiva (fica bonita no celular e no computador).

DADOS REAIS do comércio (use só isto; nunca invente preço, depoimento, prêmio, ano, equipe, telefone ou endereço):
${dados.join('\n')}

FOTOS REAIS: ${fotos} foto(s). Use exatamente src="{{FOTO_1}}" … src="{{FOTO_${Math.max(1, fotos)}}}" (a 1ª é a capa; as outras na galeria e onde a imagem mostra fotos). ${
    fotos ? '' : 'Não há fotos: use fundos de cor/gradiente no lugar.'
  }
Se a imagem tem uma seção sem dado real (preços, depoimentos, equipe…), troque por uma seção com os dados reais acima ou tire.
Inclua um botão flutuante do WhatsApp se houver link do WhatsApp.
Regras técnicas: todo o CSS dentro de <style> no <head>; pode usar <link> do fonts.googleapis.com; SEM <script>, sem iframes,
sem imagens de outros sites. Textos em português do Brasil.
Responda SÓ com o HTML, começando por <!doctype html>.`
}

// Tira o que não pode ir para a prévia/cliente: scripts, iframes, eventos e imagens de fora.
export function limparHtml(html) {
  let h = String(html || '')
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
  const inicio = h.search(/<!doctype html|<html/i)
  if (inicio > 0) h = h.slice(inicio)
  h = h
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe\s*>/gi, '')
    .replace(/<(object|embed)[^>]*>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    // <img> só com as fotos do comércio ({{FOTO_n}}) ou data:
    .replace(/<img\b[^>]*>/gi, (tag) => (/src\s*=\s*["']?(\{\{FOTO_\d+\}\}|data:image\/)/i.test(tag) ? tag : ''))
    // <link> só do Google Fonts
    .replace(/<link\b[^>]*>/gi, (tag) => (/href\s*=\s*["']https:\/\/fonts\.(googleapis|gstatic)\.com\//i.test(tag) || /rel\s*=\s*["']?preconnect/i.test(tag) ? tag : ''))
  if (!/<\/html>\s*$/i.test(h)) h += '\n</body></html>'
  return h
}

async function comGemini(imagem, texto) {
  const [, tipo, dados] = imagem.match(/^data:(image\/[a-z]+);base64,(.+)$/) || []
  let ultimoErro
  for (const modelo of MODELOS_GEMINI()) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ inlineData: { mimeType: tipo, data: dados } }, { text: texto }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 16000 },
      }),
    })
    const json = await res.json().catch(() => null)
    if (res.status === 404) {
      ultimoErro = new Error(`Gemini: modelo ${modelo} não encontrado`)
      continue
    }
    if (!res.ok) throw new Error(`Gemini: ${json?.error?.message || res.statusText}`)
    const saida = (json?.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('')
    if (!saida) throw new Error('Gemini: não devolveu o site')
    return { html: saida, ia: `Gemini (${modelo})` }
  }
  throw ultimoErro
}

async function comGroq(imagem, texto) {
  const saida = await groq({
    modelo: MODELO_VISAO_GROQ(),
    system: 'Você é o Gato Negro, front-end sênior de uma agência. Transforma mockups de site em HTML + CSS impecável.',
    user: [
      { type: 'text', text: texto },
      { type: 'image_url', image_url: { url: imagem } },
    ],
    maxTokens: 12000,
    temperatura: 0.3,
  })
  return { html: saida, ia: `Groq (${MODELO_VISAO_GROQ()})` }
}

export async function siteDaImagem({ imagem, negocio, conteudo, fotos }) {
  const texto = pedido({ negocio, conteudo, fotos })
  let r
  let erroGemini
  if (process.env.GEMINI_API_KEY) {
    try {
      r = await comGemini(imagem, texto)
    } catch (e) {
      erroGemini = e
    }
  }
  if (!r && process.env.GROQ_API_KEY) r = await comGroq(imagem, texto)
  if (!r) throw erroGemini || new Error('Sem IA para montar o site (configure GEMINI_API_KEY ou GROQ_API_KEY).')
  const html = limparHtml(r.html)
  if (!/<body[\s>]/i.test(html) || html.length < 800) throw new Error('A IA devolveu um site incompleto — tente de novo.')
  return { html, ia: r.ia }
}
