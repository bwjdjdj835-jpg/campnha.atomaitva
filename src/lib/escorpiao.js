// 🦂 Escorpião — agente SOLO que finaliza sites (pedido do usuário: "um site pra uma especialidade só melhora muito").
// Guarda um MODELO POR ESPECIALIDADE (os 3 sites de referência de interatividade já lidos), para o próximo site do mesmo
// nicho sair no mesmo padrão sem colar os links de novo.
// pipeline.escorpiao = { [chave do nicho]: { especialidade, links, referencias, atualizado } } — sincroniza pela ☁️ Nuvem
// (vence o mudado por último).

import { lerPipeline, setPipeline } from '../store/pipeline.js'
import { lerZip } from './zipStore.js'
import { lerPacoteLeao, lerPasta } from '../services/agents.js'
import { conteudoSugerido } from './conteudoSugerido.js'
import { licoesAtivas } from './biblioteca.js'

export const MAX_REFERENCIAS = 3

export const chaveEspecialidade = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

export const modelosDoEscorpiao = (estado = lerPipeline()) => estado.escorpiao || {}
export const modeloDaEspecialidade = (especialidade, estado = lerPipeline()) => modelosDoEscorpiao(estado)[chaveEspecialidade(especialidade)] || null

export function salvarModelo(especialidade, links, referencias) {
  const chave = chaveEspecialidade(especialidade)
  if (!chave) return
  setPipeline((s) => ({
    escorpiao: { ...(s.escorpiao || {}), [chave]: { especialidade: especialidade.trim(), links, referencias, atualizado: new Date().toISOString() } },
  }))
}

export const linksColados = (texto) => [...new Set(String(texto || '').split(/[\s,]+/).filter((x) => /^https?:\/\//i.test(x)))]

async function postar(caminho, corpo) {
  const res = await fetch(caminho, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(json.error || 'Falhou.'), { code: json.code })
  return json
}

// Lê os sites de referência no servidor (leitor da Biblioteca do Gato: técnicas, fontes e ordem das seções).
export async function lerReferencias(links) {
  const { referencias } = await postar('/api/escorpiao/referencias', { links: links.slice(0, MAX_REFERENCIAS) })
  return referencias
}

// Abre o pacote de um site já montado pelos agentes: o ZIP final do Gato/Abelha (conteúdo mais completo) → ZIP do Leão →
// pasta online.
export async function abrirPacoteDoSite(site) {
  for (const id of [`${site.id}:final`, site.id]) {
    const blob = await lerZip(id).catch(() => null)
    if (blob) return { ...(await lerPacoteLeao(blob)), origem: id.endsWith(':final') ? 'ZIP final do Gato' : 'ZIP do Leão' }
  }
  if (site.pasta) return { ...(await lerPasta(site.pasta)), origem: 'pasta online do Leão' }
  throw new Error('O pacote deste site não está neste navegador nem na pasta online — abra-o no Leão ou no Gato primeiro.')
}

// Conteúdo para o site: o que os agentes trouxeram + o típico do ramo (marcado como sugestão, como no Gato).
export const conteudoParaEscorpiao = (dados) => conteudoSugerido(dados)

// Gera o site interativo da especialidade (Groq → Gemini de reserva) com os dados e as fotos reais.
export async function gerarSiteEscorpiao(dados, conteudo, especialidade, referencias) {
  const n = dados.negocio || {}
  return postar('/api/escorpiao/site', {
    especialidade,
    negocio: { nome: n.nome, categoria: n.categoria, endereco: n.endereco, telefone: n.telefone, whatsapp: n.whatsapp, maps: n.maps, rating: n.rating, avaliacoes: n.avaliacoes },
    conteudo: { ...conteudo, sugerido: undefined },
    fotos: (dados.imagens || []).length,
    referencias,
    licoes: licoesAtivas(), // 📚 as lições da Biblioteca do Gato que você aprovou valem para o Escorpião também
  }) // { html, ia }
}
