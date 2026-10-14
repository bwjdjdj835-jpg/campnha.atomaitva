// 🦁 Pasta online do Leão (Vercel Blob): fotos, prints e dados.json de cada site ficam em
// sites/<pasta>/ com link público, para o Gato Negro abrir de qualquer aparelho.
// Precisa do BLOB_READ_WRITE_TOKEN (o Vercel cria sozinho ao conectar um Blob Store público ao projeto).

import { put, list } from '@vercel/blob'

const MAX_BYTES = 4 * 1024 * 1024 // a função do Vercel aceita até ~4,5 MB por requisição
const ARQUIVO = /^(fotos|prints)\/[a-z0-9._-]+\.(jpg|png|webp)$|^dados\.json$/
const TIPO = /^(image\/(jpeg|png|webp)|application\/json)$/

export const temPasta = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)

const nomeDePasta = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)

export async function hospedar({ pasta, arquivo, tipo, base64, texto }) {
  const nome = nomeDePasta(pasta)
  if (!nome) throw new Error('Pasta inválida.')
  if (!ARQUIVO.test(String(arquivo))) throw new Error('Arquivo não permitido na pasta.')
  if (!TIPO.test(String(tipo))) throw new Error('Tipo de arquivo não permitido.')
  const corpo = typeof texto === 'string' ? Buffer.from(texto) : Buffer.from(String(base64 || ''), 'base64')
  if (!corpo.length) throw new Error('Arquivo vazio.')
  if (corpo.length > MAX_BYTES) throw new Error('Arquivo grande demais para a pasta online (máx. 4 MB).')
  try {
    const r = await put(`sites/${nome}/${arquivo}`, corpo, {
      access: 'public',
      contentType: tipo,
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    return { url: r.url }
  } catch (e) {
    if (/private/i.test(e.message)) {
      throw new Error('O Blob Store do Vercel está como privado — crie um Blob Store "Public" para a pasta online.')
    }
    throw new Error(`Pasta online (Vercel Blob): ${e.message}`)
  }
}

// Pastas que têm dados.json — é a lista que o Gato Negro mostra.
export async function listarPastas() {
  const pastas = []
  let cursor
  do {
    const r = await list({ prefix: 'sites/', limit: 1000, cursor })
    for (const b of r.blobs) {
      const m = b.pathname.match(/^sites\/([^/]+)\/dados\.json$/)
      if (m) pastas.push({ pasta: m[1], url: b.url, enviadoEm: b.uploadedAt })
    }
    cursor = r.hasMore ? r.cursor : undefined
  } while (cursor)
  return pastas.sort((a, b) => String(b.enviadoEm).localeCompare(String(a.enviadoEm)))
}
