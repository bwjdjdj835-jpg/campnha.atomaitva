// 📚 Biblioteca do 🐈‍⬛ Gato: materiais que você dá para ele estudar (links de sites modelo/interativos, PDFs de curso, texto
// colado). Cada material vira lições; as que você deixa marcadas vão junto em todo site que o Gato monta.
// Fica em pipeline.biblioteca = [{ id, titulo, tipo: 'link'|'pdf'|'texto', fonte, resumo, tecnicas, fontes, licoes: [{ id, texto,
// categoria, ativa }], atualizado, removido }] — sincroniza pela ☁️ Nuvem (vence o mais recente; apagar = removido).

import { lerPipeline, setPipeline } from '../store/pipeline.js'
import { lembrar } from './mentes.js'

const MAX_ATIVAS = 40
const agora = () => new Date().toISOString()
const novoId = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

// Já vêm no manual do Gato (servidor) — aparecem na tela só para você saber.
export const NO_MANUAL = [
  { titulo: '📘 Manual de agência do Gato', resumo: 'Design de agência para comércio local, peças da biblioteca (Antes e Depois, agenda, carregamento) e a regra de nunca inventar dados.' },
  { titulo: '📕 E-book "Criando um site para ganhar dinheiro" (Carlos A. Leutz)', resumo: 'Texto que vende: chamada no imperativo, um foco por bloco, benefício em vez de serviço, fotos com gente/resultado, contraste no botão.' },
]

export const itensDaBiblioteca = (estado = lerPipeline()) => (estado.biblioteca || []).filter((i) => !i.removido)

export function licoesAtivas(estado = lerPipeline()) {
  return itensDaBiblioteca(estado)
    .flatMap((i) => (i.licoes || []).filter((l) => l.ativa).map((l) => l.texto))
    .slice(0, MAX_ATIVAS)
}

function salvar(item) {
  setPipeline((s) => {
    const lista = s.biblioteca || []
    const outro = lista.filter((x) => x.id !== item.id)
    return { biblioteca: [{ ...item, atualizado: agora() }, ...outro] }
  })
}

async function postar(caminho, corpo) {
  const res = await fetch(caminho, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(json.error || 'Falhou.'), { code: json.code })
  return json
}

// PDFs feitos no Canva e afins às vezes guardam o texto "embaralhado" (a tela mostra certo, mas as letras por trás vêm
// trocadas). Confere se o texto parece português de verdade antes de mandar para a IA.
const PALAVRAS = new Set('de que o a e do da em um uma para com não nao você voce site é se os as no na mais por como seu sua ao ou'.split(' '))
export function textoLegivel(texto) {
  const palavras = String(texto).toLowerCase().match(/[a-zà-ú]+/g) || []
  if (palavras.length < 30) return false
  const comuns = palavras.filter((p) => PALAVRAS.has(p)).length / palavras.length
  const letrasSoltas = palavras.filter((p) => p.length === 1 && !'aeo'.includes(p)).length / palavras.length
  return comuns > 0.08 && letrasSoltas < 0.25
}

// Lê o PDF no próprio navegador (pdf.js), até 40 páginas.
export async function textoDoPdf(arquivo) {
  const pdfjs = await import('pdfjs-dist')
  const worker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = worker
  const doc = await pdfjs.getDocument({ data: await arquivo.arrayBuffer() }).promise
  const partes = []
  for (let p = 1; p <= Math.min(doc.numPages, 40); p++) {
    const pagina = await doc.getPage(p)
    const conteudo = await pagina.getTextContent()
    partes.push(conteudo.items.map((i) => i.str).join(' '))
  }
  return { texto: partes.join('\n').replace(/[ \t]+/g, ' ').trim(), paginas: doc.numPages }
}

// Estuda um material: tira as lições (Groq) e guarda na biblioteca com todas marcadas para você revisar.
export async function estudar({ tipo, titulo, fonte, texto, tecnicas = [], fontes = [] }) {
  let resumo = ''
  let licoes = []
  let aviso = null
  try {
    const r = await postar('/api/gato/biblioteca/licoes', { tipo, titulo, texto, tecnicas, fontes })
    resumo = r.resumo
    licoes = r.licoes
  } catch (e) {
    aviso = e.code === 'NO_KEY' ? 'Sem a IA da Groq: escreva as lições à mão neste material.' : `Não consegui tirar as lições: ${e.message}`
  }
  // Técnicas achadas no código do site viram lições também (você decide se ficam).
  const deTecnica = tecnicas.map((t) => ({ texto: `Técnica vista em "${titulo}": ${t} — usar quando combinar com o comércio, em CSS/JS leve.`, categoria: 'tecnica' }))
  const item = {
    id: novoId('bib'),
    tipo,
    titulo: titulo || 'Material',
    fonte: fonte || null,
    resumo,
    tecnicas,
    fontes,
    licoes: [...licoes, ...deTecnica].map((l) => ({ id: novoId('l'), texto: l.texto, categoria: l.categoria, ativa: true })),
  }
  salvar(item)
  lembrar('gato', `Estudei "${item.titulo}" (${tipo}) e anotei ${item.licoes.length} lição(ões)`)
  return { item, aviso }
}

export async function estudarLink(url) {
  const pagina = await postar('/api/gato/biblioteca/ler-link', { url })
  return estudar({ tipo: 'link', titulo: pagina.titulo, fonte: pagina.url, texto: pagina.texto, tecnicas: pagina.tecnicas, fontes: pagina.fontes })
}

export function mudarLicao(itemId, licaoId, campos) {
  const item = itensDaBiblioteca().find((i) => i.id === itemId)
  if (!item) return
  salvar({ ...item, licoes: item.licoes.map((l) => (l.id === licaoId ? { ...l, ...campos } : l)) })
}

export function adicionarLicao(itemId, texto) {
  const item = itensDaBiblioteca().find((i) => i.id === itemId)
  const t = String(texto || '').trim().slice(0, 240)
  if (!item || !t) return
  salvar({ ...item, licoes: [...item.licoes, { id: novoId('l'), texto: t, categoria: 'design', ativa: true }] })
}

export function tirarLicao(itemId, licaoId) {
  const item = itensDaBiblioteca().find((i) => i.id === itemId)
  if (item) salvar({ ...item, licoes: item.licoes.filter((l) => l.id !== licaoId) })
}

export function removerItem(itemId) {
  const item = (lerPipeline().biblioteca || []).find((i) => i.id === itemId)
  if (item) salvar({ ...item, removido: true, licoes: [] })
}
