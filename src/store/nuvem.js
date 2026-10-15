// ☁️ Sincroniza o estado do app (leads, sites, conversas, selos, memórias…) com a nuvem, pelo código da conta.
// Assim nada some ao entrar de novo, e notebook e celular veem a mesma coisa. Vídeos e ZIPs ficam no aparelho.
import { lerPipeline, setPipeline, assinar } from './pipeline.js'

const CHAVE_CODIGO = 'central-agentes:codigo'
const ouvintes = new Set()
export const estadoNuvem = { ligada: null, ultimaVez: null, erro: null, enviando: false }
const avisar = () => ouvintes.forEach((f) => f({ ...estadoNuvem }))
export const ouvirNuvem = (f) => (ouvintes.add(f), () => ouvintes.delete(f))

function ler(k) {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}
function gravar(k, v) {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* sem storage */
  }
}

export function codigoDaConta() {
  let c = ler(CHAVE_CODIGO)
  if (!c) {
    c = (crypto.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9-]/g, '')
    gravar(CHAVE_CODIGO, c)
  }
  return c
}

// Junta dois estados sem perder nada: listas por id, conversa com mais mensagens, memórias e nichos somados.
const porId = (a = [], b = [], escolher = (x, y) => ({ ...x, ...y })) => {
  const m = new Map(a.map((x) => [x.id, x]))
  for (const y of b) m.set(y.id, m.has(y.id) ? escolher(m.get(y.id), y) : y)
  return [...m.values()]
}
const ORDEM_SITE = ['preview', 'preparando', 'sem_video', 'revisar', 'aprovado', 'descartado']
export function juntar(local = {}, nuvem = {}) {
  const conversas = { ...(local.conversas || {}) }
  for (const [id, c] of Object.entries(nuvem.conversas || {})) {
    const l = conversas[id]
    conversas[id] = !l || (c.mensagens?.length || 0) >= (l.mensagens?.length || 0) ? c : l
  }
  const mentes = { ...(local.mentes || {}) }
  for (const [ag, lista] of Object.entries(nuvem.mentes || {})) {
    const vistas = new Set()
    mentes[ag] = [...(mentes[ag] || []), ...lista]
      .filter((m) => !vistas.has(m.at + m.texto) && vistas.add(m.at + m.texto))
      .sort((x, y) => String(y.at).localeCompare(String(x.at)))
      .slice(0, 60)
  }
  const la = local.auto || {}
  const na = nuvem.auto || {}
  return {
    ...local,
    ...nuvem,
    leads: porId(local.leads, nuvem.leads),
    comSite: porId(local.comSite, nuvem.comSite),
    // Site: fica o status mais adiantado (ex.: "aprovado" num aparelho vence "revisar" no outro).
    sites: porId(local.sites, nuvem.sites, (x, y) => (ORDEM_SITE.indexOf(x.status) > ORDEM_SITE.indexOf(y.status) ? { ...y, ...x } : { ...x, ...y })),
    conversas,
    contatos: { ...(local.contatos || {}), ...(nuvem.contatos || {}) },
    // 📚 Biblioteca do Gato: fica a versão mudada por último (apagar = removido, para não voltar da nuvem).
    biblioteca: porId(local.biblioteca, nuvem.biblioteca, (x, y) => (String(x.atualizado || '') > String(y.atualizado || '') ? x : y)),
    mentes,
    auto: { ...la, ...na, feitos: [...new Set([...(la.feitos || []), ...(na.feitos || [])])], listas: { ...(la.listas || {}), ...(na.listas || {}) } },
  }
}

let timer = null
async function enviar() {
  estadoNuvem.enviando = true
  avisar()
  try {
    const res = await fetch('/api/dados', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ codigo: codigoDaConta(), dados: lerPipeline() }) })
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'falhou')
    estadoNuvem.ultimaVez = new Date().toISOString()
    estadoNuvem.erro = null
  } catch (e) {
    estadoNuvem.erro = e.message
  } finally {
    estadoNuvem.enviando = false
    avisar()
  }
}
const agendarEnvio = () => {
  clearTimeout(timer)
  timer = setTimeout(enviar, 2000)
}

let puxando = false
export async function puxarDaNuvem() {
  if (!estadoNuvem.ligada || puxando) return
  puxando = true
  try {
    const res = await fetch(`/api/dados?codigo=${encodeURIComponent(codigoDaConta())}`)
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'falhou')
    const { dados } = await res.json()
    if (dados) setPipeline((s) => juntar(s, dados))
    estadoNuvem.erro = null
    agendarEnvio() // devolve a junção (o que só existia aqui sobe também)
  } catch (e) {
    estadoNuvem.erro = e.message
  } finally {
    puxando = false
    avisar()
  }
}

// Chamado uma vez ao abrir o app.
export async function iniciarNuvem() {
  try {
    const d = await fetch('/api/status').then((r) => r.json())
    estadoNuvem.ligada = Boolean(d.keys?.nuvem)
  } catch {
    estadoNuvem.ligada = false
  }
  avisar()
  if (!estadoNuvem.ligada) return
  await puxarDaNuvem()
  assinar(() => {
    if (!puxando) agendarEnvio()
  })
  // Voltou para a aba (ou trocou de aparelho): busca o que mudou.
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && puxarDaNuvem())
  setInterval(puxarDaNuvem, 60_000)
}

// Usar o código de outro aparelho (junta os dados deste aparelho com os da conta).
export async function usarCodigo(novo) {
  const c = String(novo || '').trim()
  if (!/^[A-Za-z0-9-]{12,64}$/.test(c)) throw new Error('Código inválido.')
  gravar(CHAVE_CODIGO, c)
  await puxarDaNuvem()
}
