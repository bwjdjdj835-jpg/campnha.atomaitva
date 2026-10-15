// 🦂 Escorpião — agente SOLO que finaliza sites (pedido do usuário: "um site pra uma especialidade só melhora muito").
// Guarda um MODELO POR ESPECIALIDADE (os 3 sites de referência de interatividade já lidos), para o próximo site do mesmo
// nicho sair no mesmo padrão sem colar os links de novo.
// pipeline.escorpiao = { [chave do nicho]: { especialidade, links, referencias, atualizado } } — sincroniza pela ☁️ Nuvem
// (vence o mudado por último).

import { lerPipeline, setPipeline } from '../store/pipeline.js'
import JSZip from 'jszip'
import { lerZip, salvarZip } from './zipStore.js'
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

// Páginas que não são um site para estudar: busca, página inicial e editores de código (CodePen, CodeSandbox, JSFiddle…),
// que bloqueiam a leitura (403) ou não têm o site de verdade dentro.
const VITRINES = /(^|\.)(codepen\.io|codesandbox\.io|jsfiddle\.net|stackblitz\.com|replit\.com|github\.com|google\.[a-z.]+)$/i
export function ehVitrine(link) {
  try {
    const u = new URL(link)
    return VITRINES.test(u.hostname) || /\/search\b|[?&]q=/i.test(u.pathname + u.search)
  } catch {
    return true
  }
}
// Os 3 que eu marco sozinho: os primeiros que são site de verdade (vitrine só se você marcar).
export const escolhaInicial = (links) => links.filter((l) => !ehVitrine(l)).slice(0, MAX_REFERENCIAS)

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

// 🐈‍⬛ → 🦂 (pedido do usuário: "o Gato tem que mandar os dados pro Escorpião finalizar"): o Gato entrega o que tem na tela
// (dados com os textos editados, fotos, Antes e Depois). Fica na memória para a troca de página e, com site, no IndexedDB
// (`${siteId}:escorpiao`) para valer depois de recarregar.
let entregaDoGato = null
export async function mandarParaEscorpiao(pacote) {
  entregaDoGato = { ...pacote, origem: 'Gato Negro' }
  if (!pacote.siteId) return
  const zip = new JSZip()
  zip.file('dados.json', JSON.stringify(pacote.dados))
  for (const f of [...(pacote.fotos || []), ...(pacote.prints || [])]) zip.file(`public${f.caminho}`, f.blob)
  await salvarZip(`${pacote.siteId}:escorpiao`, await zip.generateAsync({ type: 'blob' }))
}
// Pega a entrega do Gato (uma vez): a da memória, ou a guardada do site.
export async function entregaPendente(siteId) {
  const e = entregaDoGato
  entregaDoGato = null
  if (e && (!siteId || e.siteId === siteId)) return e
  const blob = siteId ? await lerZip(`${siteId}:escorpiao`).catch(() => null) : null
  return blob ? { ...(await lerPacoteLeao(blob)), siteId, origem: 'Gato Negro' } : null
}

// Abre o pacote de um site já montado pelos agentes: o que o Gato mandou → ZIP final do Gato/Abelha (conteúdo mais completo)
// → ZIP do Leão → pasta online.
export async function abrirPacoteDoSite(site) {
  const ORIGEM = { escorpiao: 'Gato Negro (enviado para o Escorpião)', final: 'ZIP final do Gato' }
  for (const sufixo of ['escorpiao', 'final', '']) {
    const blob = await lerZip(sufixo ? `${site.id}:${sufixo}` : site.id).catch(() => null)
    if (blob) return { ...(await lerPacoteLeao(blob)), origem: ORIGEM[sufixo] || 'ZIP do Leão' }
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
    // Peças da biblioteca que o Gato escolheu: pares de Antes e Depois (números das fotos) e se há agenda online.
    antesDepois: (dados.antesDepois || []).map((p) => ({ antes: idx(dados, p.antes), depois: idx(dados, p.depois), legenda: p.legenda })).filter((p) => p.antes && p.depois),
    agendamento: Boolean(dados.agendamento),
    referencias,
    licoes: licoesAtivas(), // 📚 as lições da Biblioteca do Gato que você aprovou valem para o Escorpião também
  }) // { html, ia }
}

const idx = (dados, arquivo) => (dados.imagens || []).findIndex((i) => i.arquivo === arquivo) + 1
