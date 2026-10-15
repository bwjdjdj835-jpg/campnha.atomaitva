// 🦫 Castor (Diretor de Arte) com a IA da Groq: cria 3 design systems diferentes para o comércio, seguindo
// prompts/06-castor.md. O app transforma cada um numa prévia real do site (a "imagem" do modelo).
// A Groq não desenha imagens — ela escreve o design (cores, fonte, capa, galeria e o porquê).

import { groq } from './tigre.js'

const FONTES = ['Outfit', 'Plus Jakarta Sans', 'Inter', 'Manrope', 'Sora', 'DM Sans', 'Poppins', 'Montserrat', 'Playfair Display', 'Fraunces']
const HEX = /^#[0-9a-f]{6}$/i

const SISTEMA = `Você é o Castor, Diretor de Arte e UI/UX Designer Sênior de uma agência que cria sites de alto padrão para comércios locais.
Matriz por nicho: masculinos/rústicos (barbearia, oficina, hamburgueria, academia) → fundos escuros (#121212, #1a1a1a) com destaque forte
(dourado envelhecido, laranja queimado, verde musgo), fontes fortes (Outfit, Plus Jakarta Sans). Saúde/estética/salões/pet shops → fundos claros
e acolhedores (off-white #faf9f5, pastéis) com detalhes em verde sutil, marrom elegante ou rosé, fontes limpas (Inter, Plus Jakarta Sans).
Nunca fontes genéricas. Contraste de leitura sempre bom (texto escuro em fundo claro e vice-versa).
Responda SÓ com JSON: {"propostas":[{"titulo":"2 a 4 palavras","porque":"1 frase","esquema":"escuro|claro",
"fonte":"uma de: ${FONTES.join(', ')}","hero":"agua|parallax","galeria":"uniforme|bento",
"paleta_cores":{"fundo":"#hex","fundo_alternado":"#hex","texto":"#hex","destaque":"#hex"}}]} com EXATAMENTE 3 propostas bem diferentes entre si
(a 1ª é a recomendada para o ramo; as outras exploram caminhos diferentes, ex.: claro × escuro, outra cor de destaque, outra fonte).`

export function limpar(p) {
  const c = p?.paleta_cores || {}
  if (![c.fundo, c.texto, c.destaque].every((x) => HEX.test(String(x || '')))) return null
  const escuro = p.esquema === 'escuro' || (p.esquema !== 'claro' && parseInt(c.fundo.slice(1), 16) < 0x808080)
  return {
    titulo: String(p.titulo || 'Modelo').slice(0, 40),
    porque: String(p.porque || '').slice(0, 180),
    esquema: escuro ? 'escuro' : 'claro',
    fonte: FONTES.includes(p.fonte) ? p.fonte : escuro ? 'Outfit' : 'Plus Jakarta Sans',
    hero: p.hero === 'parallax' ? 'parallax' : 'agua',
    galeria: p.galeria === 'bento' ? 'bento' : 'uniforme',
    paleta_cores: {
      fundo: c.fundo,
      fundo_alternado: HEX.test(String(c.fundo_alternado || '')) ? c.fundo_alternado : c.fundo,
      texto: c.texto,
      destaque: c.destaque,
    },
  }
}

export async function designsDoCastor({ nome, categoria, cidade, nota, avaliacoes, fotos }) {
  if (!process.env.GROQ_API_KEY) return null
  const user = `Comércio: ${nome || '—'} · ramo: ${categoria || '—'} · cidade: ${cidade || '—'} · nota no Google: ${nota ?? '—'} (${avaliacoes || 0} avaliações) · fotos reais: ${fotos || 0}.
Crie os 3 design systems.`
  const texto = await groq({ system: SISTEMA, user, json: true, maxTokens: 1400, temperatura: 0.6 })
  const json = JSON.parse(texto)
  const propostas = (json.propostas || []).map(limpar).filter(Boolean).slice(0, 3)
  if (!propostas.length) throw new Error('A Groq não devolveu um design válido.')
  return propostas
}

// 📤 Imagem de site que o usuário gerou no Gemini (ou em qualquer lugar): a Groq com visão lê cores, fonte, claro/escuro e
// dá uma nota de 0 a 10 para o Castor escolher a melhor. O Gato aplica esse design no site real (mesmas cores e fonte;
// o layout continua o do nosso site). Modelo de visão: GROQ_VISION_MODEL ou o da documentação da Groq.
const MODELO_VISAO = () => process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b'

const SISTEMA_IMAGEM = `Você é o Castor, Diretor de Arte. Vai receber a imagem de um modelo de site (mockup) para um comércio local.
Leia o design e responda SÓ com JSON: {"titulo":"2 a 4 palavras sobre o estilo","porque":"1 frase dizendo o que tem de bom",
"esquema":"escuro|claro","fonte":"a mais parecida, uma de: ${FONTES.join(', ')}","hero":"agua|parallax","galeria":"uniforme|bento",
"paleta_cores":{"fundo":"#hex","fundo_alternado":"#hex","texto":"#hex","destaque":"#hex"},
"nota":0 a 10 (beleza, contraste de leitura, cara de site profissional e combinação com o ramo)}.
As cores devem ser as que aparecem na imagem. Texto e fundo precisam ter bom contraste.`

export async function designDaImagem({ imagem, categoria }) {
  if (!process.env.GROQ_API_KEY) return null
  const texto = await groq({
    modelo: MODELO_VISAO(),
    system: SISTEMA_IMAGEM,
    user: [
      { type: 'text', text: `Ramo do comércio: ${categoria || '—'}. Leia este modelo de site.` },
      { type: 'image_url', image_url: { url: imagem } },
    ],
    json: true,
    maxTokens: 900,
    temperatura: 0.2,
  })
  const json = JSON.parse(texto)
  const design = limpar(json)
  if (!design) throw new Error('Não consegui ler as cores dessa imagem.')
  const nota = Math.max(0, Math.min(10, Number(json.nota) || 0))
  return { ...design, nota }
}
