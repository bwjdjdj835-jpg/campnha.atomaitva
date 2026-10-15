import { useSyncExternalStore } from 'react'

// Estado global simples do pipeline, persistido no localStorage.
// TODO (Claude Code): migrar para backend (Supabase/Postgres) quando as APIs reais entrarem.
const KEY = 'central-agentes:v1'
const empty = { leads: [], sites: [], conversas: {}, comSite: [], contatos: {} }

let state = load()
const listeners = new Set()

function load() {
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return empty
  }
}

// erroLocal: o navegador recusou guardar (espaço cheio, modo anônimo). A nuvem continua guardando.
export let erroLocal = null
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    erroLocal = null
  } catch (e) {
    erroLocal = e?.name || 'erro'
    console.warn('[pipeline] não consegui guardar no navegador:', e)
  }
}

// Avisa fora do React quando o estado muda (sincronização com a nuvem).
export function assinar(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// Estado atual fora do React (para laços que rodam entre renders).
export const lerPipeline = () => state

export function setPipeline(updater) {
  state = { ...state, ...updater(state) }
  save()
  listeners.forEach((l) => l())
}

export function usePipeline() {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
  )
}
