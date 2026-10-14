import { useSyncExternalStore } from 'react'

// Estado global simples do pipeline, persistido no localStorage.
// TODO (Claude Code): migrar para backend (Supabase/Postgres) quando as APIs reais entrarem.
const KEY = 'central-agentes:v1'
const empty = { leads: [], sites: [], conversas: {} }

let state = load()
const listeners = new Set()

function load() {
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return empty
  }
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage indisponível: segue só em memória */
  }
}

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
