// 🦂 Escorpião — agente SOLO (fora do automático; pedido do usuário: "o finalizador especial dele vai ser criar sites").
// Pega um site já montado pelos agentes (dados, fotos e conteúdo do Leão/Gato/Abelha), a ESPECIALIDADE (nicho) e até 3 sites
// de referência de interatividade, e gera UMA página HTML profissional e interativa para aquele nicho.
// As referências são lidas pelo leitor da 📚 Biblioteca do Gato (lerLink: sem Firecrawl, bloqueia endereço interno).
// A interação vem das peças do app (clienteEfeitos.js / clienteAnimacoes.css por marcações data-*): a IA não escreve <script>.
// IA: Gemini (GEMINI_API_KEY) → Groq (GROQ_API_KEY).

import { groq } from './tigre.js'
import { MANUAL_DO_GATO } from './gatoManual.js'
import { lerLink } from './biblioteca.js'
import { limparHtml } from './siteDaImagem.js'

export const MAX_REFERENCIAS = 3
const MODELOS_GEMINI = () => [process.env.GEMINI_TEXT_MODEL, 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean)

export const temEscorpiao = () => Boolean(process.env.GEMINI_API_KEY || process.env.GROQ_API_KEY)

// Lê cada site de referência: título, fontes, técnicas interativas e a ordem das seções (títulos H1–H3).
export async function lerReferencias(links) {
  const lista = [...new Set((Array.isArray(links) ? links : []).map((l) => String(l || '').trim()).filter((l) => /^https?:\/\//i.test(l)))].slice(0, MAX_REFERENCIAS)
  if (!lista.length) throw new Error('Cole pelo menos 1 link de site de referência (http…).')
  return Promise.all(
    lista.map(async (url) => {
      try {
        const r = await lerLink(url)
        const estrutura = (r.texto.match(/^H[1-3]: .+$/gm) || []).map((t) => t.slice(0, 90)).slice(0, 16)
        return { url: r.url, titulo: r.titulo, tecnicas: r.tecnicas, fontes: r.fontes, estrutura }
      } catch (e) {
        return { url, erro: e.name === 'TimeoutError' ? 'O site demorou demais para responder.' : e.message }
      }
    }),
  )
}

// Marcações que o app já sabe animar (o mesmo script vai na prévia e no ZIP).
const PECAS = `PEÇAS INTERATIVAS DO ESCORPIÃO (use as marcações exatamente assim; o app liga o comportamento, você NÃO escreve <script>):
- <div data-progresso></div> logo no começo do <body>: barra de progresso da rolagem (estilize: position:fixed; top:0; height:3px; cor de destaque; width:0).
- Capa com foto que desce devagar ao rolar: <img data-parallax-hero src="{{FOTO_1}}" …>.
- Título que sobe palavra por palavra: cada palavra em <span class="anim-palavra" style="animation-delay:0.1s">…</span> (atrasos crescentes).
- Seções que entram ao rolar: <section data-revelar>, filhos em cascata com data-cascata.
- Cards com luz que segue o cursor: data-brilho. Botões que "puxam" para o cursor: data-magnetico (+ class="micro").
- Fotos com profundidade: data-parallax nas fotos da galeria/destaques.
- Números que contam: <span data-contar="4.8" data-casas="1">4,8</span> (só com número real: nota e nº de avaliações do Google).
- Faixa que corre com os serviços: <div class="faixa-correr">…itens repetidos 2×…</div> dentro de um contêiner com overflow:hidden.
- Carrossel (só de avaliações reais): <section> com <div data-carrossel>…cards…</div> e botões data-carrossel-ant / data-carrossel-prox.
- Foto com carregamento: <div data-esqueleto><img src="{{FOTO_n}}" alt="…"></div>.
- Vidro fosco (backdrop-filter), scroll-snap, sticky, clip-path, mix-blend-mode e @keyframes podem ser feitos em CSS puro.`

function pedido({ especialidade, negocio = {}, conteudo = {}, fotos = 0, referencias = [] }) {
  const lista = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : [x.nome || x.titulo, x.descricao || x.texto].filter(Boolean).join(': '))).join('; ') : '')
  const horario = conteudo.horarios || conteudo.horario
  const dados = [
    `Nome: ${negocio.nome || '—'}`,
    `Ramo no Google: ${negocio.categoria || '—'}`,
    negocio.endereco && `Endereço: ${negocio.endereco}`,
    negocio.telefone && `Telefone: ${negocio.telefone}`,
    negocio.whatsapp && `Link do WhatsApp (use em TODOS os botões de contato/agendar): ${negocio.whatsapp}`,
    negocio.maps && `Link do Google Maps (botão "Como chegar"): ${negocio.maps}`,
    negocio.rating != null && `Nota no Google: ${negocio.rating} (${negocio.avaliacoes || 0} avaliações)`,
    conteudo.slogan && `Frase da capa: ${conteudo.slogan}`,
    conteudo.sobre && `Sobre: ${conteudo.sobre}`,
    lista(conteudo.servicos) && `Serviços: ${lista(conteudo.servicos)}`,
    lista(conteudo.diferenciais) && `Diferenciais: ${lista(conteudo.diferenciais)}`,
    lista(conteudo.passos) && `Como funciona: ${lista(conteudo.passos)}`,
    Array.isArray(conteudo.faq) && conteudo.faq.length && `Perguntas frequentes: ${conteudo.faq.map((f) => `${f.pergunta || f.p} → ${f.resposta || f.r}`).join(' | ')}`,
    horario && `Horário: ${typeof horario === 'string' ? horario : JSON.stringify(horario)}`,
    Array.isArray(conteudo.depoimentos) && conteudo.depoimentos.length &&
      `Avaliações reais do Google (pode usar no carrossel): ${conteudo.depoimentos.map((d) => `"${d.texto}" — ${d.autor || 'cliente'}`).join(' | ')}`,
  ].filter(Boolean)
  const refs = referencias
    .filter((r) => !r.erro)
    .map(
      (r, i) =>
        `Referência ${i + 1}: ${r.titulo} (${r.url})\n  Técnicas: ${r.tecnicas?.join('; ') || '—'}\n  Fontes: ${r.fontes?.join(', ') || '—'}\n  Ordem das seções: ${r.estrutura?.join(' · ') || '—'}`,
    )
  return `Crie o site de UMA página de um(a) ${especialidade} — você é especialista SÓ nessa especialidade, então o site tem que parecer
feito por uma agência que só atende ${especialidade}: vocabulário, ritmo, seções e clima típicos desse ramo.

INTERATIVIDADE — inspire-se nestes sites de referência que o dono escolheu (pegue o NÍVEL de interação, o ritmo e o tipo de
efeito; NÃO copie textos, marcas nem dados deles):
${refs.join('\n') || '(sem referências lidas: use o padrão de agência premium do ramo)'}
Recrie as técnicas deles com as PEÇAS INTERATIVAS abaixo e CSS puro (sem bibliotecas, sem <script>).

DADOS REAIS do comércio (use só isto; nunca invente preço, depoimento, prêmio, ano, equipe, telefone ou endereço):
${dados.join('\n')}

FOTOS REAIS: ${fotos} foto(s). Use exatamente src="{{FOTO_1}}" … src="{{FOTO_${Math.max(1, fotos)}}}" (a 1ª é a capa). ${fotos ? '' : 'Não há fotos: use fundos de cor/gradiente.'}

${PECAS}

Siga o MANUAL DO GATO (design de agência, texto que vende, verdade dos dados) em tudo.
Seção sem dado real (preços, depoimentos, equipe…) não entra. Botão flutuante do WhatsApp se houver link.
Mobile-first, responsiva, respeite prefers-reduced-motion. Todo o CSS dentro de <style> no <head>; pode usar <link> do
fonts.googleapis.com; SEM <script>, sem iframes, sem imagens de outros sites. Textos em português do Brasil.
Responda SÓ com o HTML, começando por <!doctype html>.`
}

async function comGemini(texto, manual) {
  let ultimoErro
  for (const modelo of MODELOS_GEMINI()) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: manual }] },
        contents: [{ parts: [{ text: texto }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 20000 },
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

async function comGroq(texto, manual) {
  const saida = await groq({
    system: `Você é o Escorpião, front-end sênior de uma agência especializada em um único nicho. Escreve HTML + CSS impecável e interativo.\n\n${manual}`,
    user: texto,
    maxTokens: 12000,
    temperatura: 0.5,
  })
  return { html: saida, ia: 'Groq' }
}

export async function siteDoEscorpiao({ especialidade, negocio, conteudo, fotos, referencias = [], licoes = [] }) {
  const texto = pedido({ especialidade: especialidade || negocio?.categoria || 'comércio local', negocio, conteudo, fotos, referencias })
  const manual = licoes.length ? `${MANUAL_DO_GATO}\n10b. LIÇÕES DA BIBLIOTECA DO GATO (aprovadas pelo dono — aplique quando couber):\n${licoes.map((l) => `- ${l}`).join('\n')}` : MANUAL_DO_GATO
  let r
  let erroGemini
  if (process.env.GEMINI_API_KEY) {
    try {
      r = await comGemini(texto, manual)
    } catch (e) {
      erroGemini = e
    }
  }
  if (!r && process.env.GROQ_API_KEY) r = await comGroq(texto, manual)
  if (!r) throw erroGemini || new Error('Sem IA para o Escorpião (configure GEMINI_API_KEY ou GROQ_API_KEY).')
  const html = limparHtml(r.html)
  if (!/<body[\s>]/i.test(html) || html.length < 800) throw new Error('A IA devolveu um site incompleto — tente de novo.')
  return { html, ia: r.ia }
}

// Confere o que vem do navegador (referências já lidas) antes de ir para o pedido da IA.
export function referenciasSeguras(refs) {
  const txt = (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n)
  return (Array.isArray(refs) ? refs : [])
    .filter((r) => r && !r.erro && /^https?:\/\//i.test(String(r.url || '')))
    .slice(0, MAX_REFERENCIAS)
    .map((r) => ({
      url: txt(r.url, 300),
      titulo: txt(r.titulo, 120),
      tecnicas: (Array.isArray(r.tecnicas) ? r.tecnicas : []).map((t) => txt(t, 80)).slice(0, 25),
      fontes: (Array.isArray(r.fontes) ? r.fontes : []).map((t) => txt(t, 40)).slice(0, 6),
      estrutura: (Array.isArray(r.estrutura) ? r.estrutura : []).map((t) => txt(t, 90)).slice(0, 16),
    }))
}
