// Guarda os ZIPs gerados no IndexedDB do navegador (o localStorage é pequeno demais para fotos).
// Assim o Gato Negro abre o pacote do Leão sem precisar reenviar o arquivo.

const DB = 'central-agentes'
const STORE = 'zips'

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx(mode, fn) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode)
    const req = fn(t.objectStore(STORE))
    t.oncomplete = () => resolve(req?.result)
    t.onerror = () => reject(t.error)
  })
}

export async function salvarZip(id, blob) {
  try {
    await tx('readwrite', (s) => s.put(blob, id))
    return true
  } catch {
    return false // navegador sem IndexedDB (ex.: aba anônima restrita): o usuário envia o ZIP manualmente
  }
}

export async function lerZip(id) {
  try {
    return (await tx('readonly', (s) => s.get(id))) || null
  } catch {
    return null
  }
}
