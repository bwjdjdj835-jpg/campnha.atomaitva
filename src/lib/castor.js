// 🦫 Castor: antes do Gato finalizar, propõe 3 modelos de site bem diferentes entre si (tema + capa + galeria),
// com base no estudo do Gato (estilo do ramo / seu site modelo), no ramo do comércio e no que você já escolheu antes.
// Você escolhe um e o Gato refina em cima dele.

import { temaSugerido } from './ClienteSite.jsx'
import { estiloPreferido } from './mentes.js'

const TODOS = ['noite', 'claro', 'studio', 'vibrante']

const norm = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Matriz de identidade visual por nicho (prompts/06-castor.md). Escuro e imponente para nichos masculinos/rústicos;
// claro e acolhedor para saúde, estética, salões e pet shops (decisão do usuário: pet shop = claro).
const MATRIZ = [
  { teste: /barbe/, grupo: 'rustico', destaque: '#C9A227', nomeDestaque: 'dourado envelhecido' },
  { teste: /hamburg|burger|lanch|churras|espeto/, grupo: 'rustico', destaque: '#D9631E', nomeDestaque: 'laranja queimado' },
  { teste: /oficina|mecanic|auto ?pec|borrach|academia|tatu|pub|bar\b|choper/, grupo: 'rustico', destaque: '#7A8B3C', nomeDestaque: 'verde musgo' },
  { teste: /salao|cabele|manicure|unha|estetic|beleza|sobrancel|cilio|depila|spa/, grupo: 'acolhedor', destaque: '#B9767E', nomeDestaque: 'rosé' },
  { teste: /pet|veterin|banho e tosa/, grupo: 'acolhedor', destaque: '#5F7F6B', nomeDestaque: 'verde sutil' },
  { teste: /clinic|odont|dent|fisio|saude|psico|nutri|medic|farma/, grupo: 'acolhedor', destaque: '#5F7F6B', nomeDestaque: 'verde sutil' },
  { teste: /padaria|confeit|doce|cafe|acai|sorvet|pizza|restaur/, grupo: 'acolhedor', destaque: '#8B6B4E', nomeDestaque: 'marrom elegante' },
]

// 🦫 Design system direcionador do Castor (Diretor de Arte): o Gato só traduz em Tailwind.
export function designDoCastor(dados) {
  const categoria = norm(dados?.negocio?.categoria || dados?.categoria)
  const regra = MATRIZ.find((m) => m.teste.test(categoria)) || { grupo: 'rustico', destaque: '#C9A227', nomeDestaque: 'dourado' }
  const escuro = regra.grupo === 'rustico'
  const paleta_cores = escuro
    ? { fundo: '#121212', fundo_alternado: '#1A1A1A', texto: '#F5F5F4', texto_suave: 'rgba(255,255,255,0.72)', destaque: regra.destaque, borda: 'rgba(255,255,255,0.10)', cartao: 'rgba(255,255,255,0.04)' }
    : { fundo: '#FAF9F5', fundo_alternado: '#F1EEE6', texto: '#1F2937', texto_suave: 'rgba(31,41,55,0.70)', destaque: regra.destaque, borda: 'rgba(31,41,55,0.10)', cartao: 'rgba(255,255,255,0.75)' }
  const fonte = escuro ? 'Outfit' : 'Plus Jakarta Sans'
  const fotoCapa = dados?.imagens?.[0]?.arquivo || null
  const estrutura_secoes = [
    { secao: 'hero', estilo: `Tela cheia com a foto real ${fotoCapa ? `(${fotoCapa})` : '(sem foto: fundo na cor de destaque)'} e overlay gradiente escuro por cima; headline enorme em negrito com tracking-tight; frase curta de valor; CTA grande "Agendar pelo WhatsApp".` },
    { secao: 'numeros', estilo: 'Nota e número de avaliações reais do Google, cidade e horário — contadores grandes.' },
    { secao: 'sobre', estilo: 'Texto editorial grande ao lado de uma foto vertical arredondada.' },
    { secao: 'diferenciais', estilo: 'Faixa de fundo alternado; cards flutuantes de vidro (rounded-2xl, border-white/10, backdrop-blur).' },
    { secao: 'servicos', estilo: 'Grid moderno de cards (2 colunas no celular grande, 3 no computador), cada card leva ao WhatsApp.' },
    { secao: 'galeria', estilo: 'Fotos reais em grade uniforme ou mosaico (bento), cantos arredondados.' },
    { secao: 'prova_social', estilo: 'Faixa alternada com as avaliações reais do Google (carrossel) ou a nota + botão "Ver avaliações no Google". Nunca inventar depoimento.' },
    { secao: 'contato', estilo: 'Chamada final gigante, endereço claro, mapa e botão "Como chegar (Google Maps)".' },
    { secao: 'whatsapp_flutuante', estilo: 'Botão fixo verde no canto inferior direito.' },
  ]
  const modelo = {
    fonte: 'Castor (direção de arte)',
    url: null,
    estilo: {
      esquema: escuro ? 'escuro' : 'claro',
      fonte,
      cores: { fundo: paleta_cores.fundo, texto: paleta_cores.texto, primaria: paleta_cores.destaque, fundoAlt: paleta_cores.fundo_alternado, cartao: paleta_cores.cartao, borda: paleta_cores.borda },
    },
    design: { paleta_cores, fontes_google: [fonte, 'Inter'], estrutura_secoes, identidade: `${escuro ? 'Escuro e imponente' : 'Claro e acolhedor'}, destaque ${regra.nomeDestaque}` },
  }
  return modelo
}

// → [{ id, titulo, porque, tema, hero, galeria }] (3 propostas, a 1ª é a recomendada)
export function propostasDoCastor(dados, modelo, estado) {
  const doRamo = temaSugerido(dados?.negocio?.categoria || dados?.categoria)
  const pref = estiloPreferido(estado)
  const lista = []
  const usado = new Set()
  const add = (p) => {
    if (usado.has(p.tema) || lista.length >= 3) return
    usado.add(p.tema)
    lista.push({ id: `${p.titulo}-${p.tema}-${p.hero}-${p.galeria}`, ...p })
  }
  const castor = designDoCastor(dados)
  add({ titulo: 'Direção de arte do Castor', porque: `${castor.design.identidade}, fonte ${castor.estilo.fonte} — padrão de agência para este ramo.`, tema: 'modelo', hero: 'agua', galeria: 'bento', modelo: castor })
  usado.delete('modelo') // o modelo do estudo também pode entrar (é outro conjunto de cores)
  if (modelo && !modelo.design) add({ titulo: 'Do estudo', porque: `Cores e fonte de ${modelo.fonte || 'um site real do ramo'} que o Gato estudou.`, tema: 'modelo', hero: 'agua', galeria: 'uniforme', modelo })
  if (pref && pref.tema !== 'castor') add({ titulo: 'Seu preferido', porque: `Você escolheu este estilo ${pref.vezes} de ${pref.total} vezes.`, tema: pref.tema, hero: pref.hero, galeria: pref.galeria })
  add({ titulo: 'Clássico do ramo', porque: 'O visual mais comum para este tipo de comércio.', tema: doRamo, hero: 'agua', galeria: 'uniforme' })
  // Completa com estilos bem diferentes (contraste claro × escuro, capa e galeria trocadas).
  const extras = [
    { titulo: 'Editorial', porque: 'Claro e limpo, com fotos em mosaico — passa organização.', tema: 'claro', hero: 'parallax', galeria: 'bento' },
    { titulo: 'Premium escuro', porque: 'Escuro com dourado — passa sofisticação.', tema: 'noite', hero: 'parallax', galeria: 'bento' },
    { titulo: 'Moderno', porque: 'Visual de estúdio com animações — passa modernidade.', tema: 'studio', hero: 'agua', galeria: 'bento' },
    { titulo: 'Alegre', porque: 'Cores vivas — chama atenção no celular.', tema: 'vibrante', hero: 'parallax', galeria: 'uniforme' },
  ]
  for (const e of extras) add(e)
  for (const t of TODOS) add({ titulo: t, porque: '', tema: t, hero: 'agua', galeria: 'uniforme' })
  return lista
}

// Design criado pela Groq (POST /api/castor/design) → o mesmo formato de modelo que o ClienteSite usa (tema "modelo").
export function modeloDoDesign(d) {
  const escuro = d.esquema === 'escuro'
  const paleta_cores = {
    ...d.paleta_cores,
    texto_suave: escuro ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)',
    borda: escuro ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
    cartao: escuro ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.75)',
  }
  return {
    fonte: `Castor + Groq: ${d.titulo}`,
    url: null,
    estilo: {
      esquema: d.esquema,
      fonte: d.fonte,
      cores: { fundo: paleta_cores.fundo, texto: paleta_cores.texto, primaria: paleta_cores.destaque, fundoAlt: paleta_cores.fundo_alternado, cartao: paleta_cores.cartao, borda: paleta_cores.borda },
    },
    design: { paleta_cores, fontes_google: [d.fonte], identidade: d.porque, criadoPor: 'groq' },
  }
}

// Pede os 3 designs à Groq. null = sem Groq (ou falhou): fica a matriz do Castor.
export async function designsDaGroq(dados) {
  const n = dados?.negocio || {}
  try {
    const res = await fetch('/api/castor/design', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: n.nome,
        categoria: n.categoria,
        cidade: (n.endereco || '').split(' - ').slice(-1)[0],
        nota: n.rating,
        avaliacoes: n.avaliacoes,
        fotos: dados?.imagens?.length || 0,
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return (json.propostas || []).map((d, i) => ({
      id: `groq-${i}-${d.titulo}`,
      titulo: d.titulo,
      porque: `${d.porque} Fonte ${d.fonte}.`,
      tema: 'modelo',
      hero: d.hero,
      galeria: d.galeria,
      modelo: modeloDoDesign(d),
      ia: 'groq',
    }))
  } catch {
    return null
  }
}

// 🍌 Nano Banana: cores e fonte de cada proposta para o Gemini desenhar a imagem do modelo (só para você escolher;
// o cliente recebe a prévia real feita pelo Gato).
const PALETA_DO_TEMA = {
  noite: { esquema: 'escuro', fonte: 'Outfit', paleta_cores: { fundo: '#0A0A0A', fundo_alternado: '#141414', texto: '#F5F5F5', destaque: '#FBBF24' } },
  claro: { esquema: 'claro', fonte: 'Plus Jakarta Sans', paleta_cores: { fundo: '#FFFFFF', fundo_alternado: '#F4F2EC', texto: '#171717', destaque: '#059669' } },
  studio: { esquema: 'escuro', fonte: 'Outfit', paleta_cores: { fundo: '#09090B', fundo_alternado: '#18181B', texto: '#F4F4F5', destaque: '#E879F9' } },
  vibrante: { esquema: 'claro', fonte: 'Plus Jakarta Sans', paleta_cores: { fundo: '#FFF7ED', fundo_alternado: '#FFEDD5', texto: '#1C1917', destaque: '#EA580C' } },
}

export function designParaImagem(p) {
  const e = p.modelo?.estilo
  if (p.tema === 'modelo' && e?.cores) {
    return {
      titulo: p.titulo,
      esquema: e.esquema === 'escuro' ? 'escuro' : 'claro',
      fonte: e.fonte,
      paleta_cores: { fundo: e.cores.fundo, fundo_alternado: e.cores.fundoAlt || e.cores.fundo, texto: e.cores.texto, destaque: e.cores.primaria },
    }
  }
  return { titulo: p.titulo, ...(PALETA_DO_TEMA[p.tema] || PALETA_DO_TEMA.noite) }
}

const imagensFeitas = new Map() // a mesma proposta não é desenhada (nem paga) duas vezes na mesma visita

export async function imagemDoModelo(p, categoria, { deNovo = false } = {}) {
  const chave = `${categoria}|${p.id}`
  if (deNovo) imagensFeitas.delete(chave)
  if (!imagensFeitas.has(chave)) {
    const pedido = fetch('/api/castor/imagem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoria, design: designParaImagem(p) }),
    }).then(async (res) => {
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw Object.assign(new Error(json.error || 'Falha ao desenhar'), { code: json.code })
      return `data:${json.tipo};base64,${json.base64}`
    })
    imagensFeitas.set(chave, pedido)
    pedido.catch(() => imagensFeitas.delete(chave))
  }
  return imagensFeitas.get(chave)
}
