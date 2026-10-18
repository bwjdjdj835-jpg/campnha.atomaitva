// 📁 Pasta dos clientes no notebook (pedido do usuário: "salva o vídeo e a mensagem numa pasta no meu notebook e eu pego e
// mando"). Chrome/Edge no computador: você escolhe a pasta UMA vez (File System Access API) e o app lembra dela; cada cliente
// vira <pasta>/<nicho>/<comércio>/ com:
//   1 - Mensagem.txt                       (a mensagem do Tigre, para copiar)
//   2 - Video da previa.mp4                (o vídeo para arrastar na conversa)
//   3 - Abrir conversa no WhatsApp.url     (dois cliques: abre o WhatsApp do cliente com a mensagem escrita)
// Sem esse recurso (celular, Firefox): os três arquivos vão para Downloads.

const BANCO = 'central-agentes-pasta'
const CHAVE = 'pasta-clientes'

function abrirBanco() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(BANCO, 1)
    r.onupgradeneeded = () => r.result.createObjectStore('handles')
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}
async function guardar(valor) {
  const db = await abrirBanco()
  await new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite')
    valor ? tx.objectStore('handles').put(valor, CHAVE) : tx.objectStore('handles').delete(CHAVE)
    tx.oncomplete = resolve
    tx.onerror = () => reject(tx.error)
  })
}
async function lerGuardada() {
  try {
    const db = await abrirBanco()
    return await new Promise((resolve) => {
      const r = db.transaction('handles').objectStore('handles').get(CHAVE)
      r.onsuccess = () => resolve(r.result || null)
      r.onerror = () => resolve(null)
    })
  } catch {
    return null
  }
}

export const temPastaNoNavegador = () => typeof window !== 'undefined' && 'showDirectoryPicker' in window

// Escolher (ou trocar) a pasta — precisa ser num clique.
export async function escolherPasta() {
  const pasta = await window.showDirectoryPicker({ id: 'central-agentes-clientes', mode: 'readwrite', startIn: 'documents' })
  await guardar(pasta)
  return pasta
}

// A pasta já escolhida, se o navegador ainda deixa gravar. `pedir: true` (só num clique) pede a permissão de novo.
export async function pastaEscolhida({ pedir = false } = {}) {
  const pasta = await lerGuardada()
  if (!pasta) return null
  if (!pasta.queryPermission) return pasta // pasta sem pedido de permissão (ex.: a pasta interna do navegador)
  let estado = await pasta.queryPermission?.({ mode: 'readwrite' })
  if (estado !== 'granted' && pedir) estado = await pasta.requestPermission?.({ mode: 'readwrite' })
  return estado === 'granted' ? pasta : null
}
export const nomeDaPasta = async () => {
  const p = await lerGuardada()
  return p ? p.name || 'pasta escolhida' : null
}

// Nome de pasta/arquivo aceito no Windows.
export const nomeSeguro = (t) =>
  String(t || 'sem nome')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '')
    .slice(0, 80) || 'sem nome'

export function linkDaConversa(telefone, mensagem) {
  let d = String(telefone || '').replace(/\D/g, '')
  if (d.length === 10 || d.length === 11) d = '55' + d
  return d ? `https://wa.me/${d}?text=${encodeURIComponent(mensagem || '')}` : null
}

// Os arquivos do pacote: [{ nome, conteudo (Blob) }]. Nome de ARQUIVO sem acento (gravar "Vídeo.mp4" travava o Chrome no
// teste); as pastas do nicho e do comércio podem ter acento.
export function arquivosDoPacote({ mensagem, telefone, video }) {
  const lista = [{ nome: '1 - Mensagem.txt', conteudo: new Blob(['﻿' + String(mensagem || '').replace(/\r?\n/g, '\r\n')], { type: 'text/plain' }) }]
  if (video) {
    const ext = /webm/.test(video.type || '') ? 'webm' : 'mp4'
    lista.push({ nome: `2 - Video da previa.${ext}`, conteudo: video })
  }
  const link = linkDaConversa(telefone, mensagem)
  if (link) lista.push({ nome: '3 - Abrir conversa no WhatsApp.url', conteudo: new Blob([`[InternetShortcut]\r\nURL=${link}\r\n`], { type: 'text/plain' }) })
  return lista
}

// Grava o pacote do cliente. Devolve { onde: 'pasta' | 'downloads', caminho }.
// `pedir`: só quando veio de um clique (pode abrir a escolha da pasta / pedir permissão).
// Um salvamento por vez: o mesmo arquivo aberto duas vezes ao mesmo tempo falha no meio (ex.: o vídeo chegou e você
// clicou em "Salvar todos").
let fila = Promise.resolve()
export function salvarPacote(pacote, opcoes) {
  const vez = fila.then(() => gravarPacote(pacote, opcoes))
  fila = vez.catch(() => {})
  return vez
}

async function gravarPacote({ nicho, nome, mensagem, telefone, video }, { pedir = false } = {}) {
  const arquivos = arquivosDoPacote({ mensagem, telefone, video })
  let pasta = temPastaNoNavegador() ? await pastaEscolhida({ pedir }) : null
  if (!pasta && pedir && temPastaNoNavegador() && !(await lerGuardada())) pasta = await escolherPasta()
  if (pasta) {
    const dirNicho = await pasta.getDirectoryHandle(nomeSeguro(nicho || 'outros'), { create: true })
    const dir = await dirNicho.getDirectoryHandle(nomeSeguro(nome), { create: true })
    for (const a of arquivos) {
      const h = await dir.getFileHandle(a.nome, { create: true })
      const w = await h.createWritable()
      await w.write(a.conteudo)
      await w.close()
    }
    return { onde: 'pasta', caminho: `${pasta.name}/${nomeSeguro(nicho || 'outros')}/${nomeSeguro(nome)}` }
  }
  if (!pedir) return null // automático sem pasta liberada: não enche a pasta Downloads sozinho
  for (const a of arquivos) baixar(a.conteudo, `${nomeSeguro(nome)} - ${a.nome}`)
  return { onde: 'downloads', caminho: 'Downloads' }
}

function baixar(blob, nome) {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: nome })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
