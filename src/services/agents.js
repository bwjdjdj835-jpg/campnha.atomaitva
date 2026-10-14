// Camada de serviço dos agentes.
//
// REAL (via backend em /server — as chaves de API ficam lá):
//   pinguim -> POST /api/pinguim/buscar   (Google Places + Firecrawl)
//   leao    -> POST /api/leao/fotos       (fotos da ficha) + ZIP montado aqui com JSZip;
//              POST /api/leao/hospedar sobe fotos e dados.json para a pasta online (Vercel Blob)
//   gato    -> lê o ZIP do Leão (ou a pasta online), POST /api/gato/estudar (referências no Firecrawl),
//              prévia ao vivo e ZIP final só depois da aprovação (gerarZipFinal)
//   tigre   -> POST /api/tigre/* (mensagem, classificar, enviar, publicar); cada envio só depois
//              do clique de aprovação. Sem servidor: modelos de texto e palavras-chave locais.
//   abelha  -> abre o pacote do site, audita (src/lib/auditoria.js), POST /api/abelha/enriquecer
//              (dados públicos com fonte); o usuário escolhe o que entra e gerarColmeia injeta.
//
// Se o backend não tiver as chaves, o Pinguim cai no modo demonstração e avisa nos logs.
// Resultados de demo vêm sempre marcados com `demo: true`.

import JSZip from 'jszip'
import { waLink, zipName } from '../lib/whatsapp.js'
import { siteFiles } from '../lib/siteTemplate.js'
import { temaSugerido } from '../lib/ClienteSite.jsx'
import { conteudoSugerido } from '../lib/conteudoSugerido.js'
import { salvarZip, lerZip } from '../lib/zipStore.js'
import { MODELOS, classificarPorPalavras } from '../lib/tigreTextos.js'
import { auditar } from '../lib/auditoria.js'
import { tipoDoLink, acharLeadPorLink, nomeDoTitulo, recortarCapaDoMaps, linkBuscaMaps } from '../lib/links.js'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

class ApiError extends Error {
  constructor(message, code) {
    super(message)
    this.code = code
  }
}

async function api(path, body) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Backend fora do ar (rode "npm run dev")', 'OFFLINE')
  }
  const data = await res.json().catch(() => null)
  if (!data) throw new ApiError('Backend indisponível neste ambiente', 'OFFLINE')
  if (!res.ok) throw new ApiError(data.error || `Erro ${res.status}`, data.code)
  return data
}

// ---------- demonstração ----------

const scripts = {
  pinguim: (i) => [
    ['info', `Google Places: textSearch "${i.categoria || 'categoria'} em ${i.cidade || 'cidade'}"`],
    ['info', 'FieldMask: displayName, websiteUri, nationalPhoneNumber, googleMapsUri, formattedAddress…'],
    ['ok', 'Resultados recebidos'],
    ['info', 'Descartando quem já tem websiteUri'],
    ['info', 'Firecrawl: verificando domínio próprio de cada candidato'],
    ['ok', 'Leads confirmados (demonstração)'],
  ],
}

async function playDemo(agentId, inputs, log) {
  for (const [level, msg] of scripts[agentId](inputs)) {
    await wait(550 + Math.random() * 450)
    log(level, msg)
  }
}

function demoLeads(i) {
  const cidade = i.cidade || 'Sua cidade'
  return [
    { nome: 'Exemplo Negócio A', telefone: '(69) 90000-0001', confianca: 'Alto' },
    { nome: 'Exemplo Negócio B', telefone: '(69) 90000-0002', confianca: 'Médio' },
    { nome: 'Exemplo Negócio C', telefone: '(69) 90000-0003', confianca: 'Alto' },
  ].map((l, k) => ({
    id: `demo-${Date.now()}-${k}`,
    demo: true,
    ...l,
    categoria: i.categoria || '—',
    endereco: `Endereço fictício, ${cidade}`,
    maps: linkBuscaMaps(l.nome, cidade),
    whatsapp: waLink(l.telefone),
    instagram: null,
    fotos: [],
    observacao: 'Dado de demonstração — conecte as APIs para leads reais',
  }))
}

// ---------- agentes reais ----------

async function pinguim(inputs, log) {
  if (!inputs.categoria?.trim() || !inputs.cidade?.trim()) {
    throw new Error('Preencha a categoria e a cidade.')
  }
  try {
    const res = await api('/pinguim/buscar', { categoria: inputs.categoria, cidade: inputs.cidade })
    for (const l of res.logs) {
      await wait(120)
      log(l.level, l.msg)
    }
    return { leads: res.leads }
  } catch (e) {
    if (e.code !== 'NO_KEY' && e.code !== 'OFFLINE') throw e
    log('warn', `${e.message.replace(/\.$/, '')} — rodando em MODO DEMONSTRAÇÃO`)
    await playDemo('pinguim', inputs, log)
    return { leads: demoLeads(inputs) }
  }
}

function slugify(s) {
  return zipName(s).replace(/-\d{6}\.zip$/, '')
}

const ext = (tipo) => ({ 'image/png': 'png', 'image/webp': 'webp' })[tipo] || 'jpg'

const blobDeBase64 = (b64, tipo) => new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: tipo })
const ORIGEM = { maps: 'Google Maps', instagram: 'Instagram', facebook: 'Facebook' }

async function baixarFotos(lista, log) {
  const fotos = []
  for (const item of lista.slice(0, 8)) {
    try {
      const [f] = (await api('/leao/fotos', { fotos: [item] })).fotos
      if (f) fotos.push(f)
    } catch (e) {
      log('warn', `Foto não baixada: ${e.message.replace(/\.$/, '')}`)
      if (e.code === 'OFFLINE') break
    }
  }
  log(fotos.length ? 'ok' : 'warn', `${fotos.length} de ${Math.min(lista.length, 8)} foto(s) recebida(s)`)
  return fotos
}

// Acha o lead: pelo link colado (Maps, Instagram ou WhatsApp do Pinguim) ou pela lista.
async function leadDoLeao(inputs, log, leads) {
  if (!inputs.link?.trim()) {
    const lead = leads.find((l) => l.id === inputs.lead)
    if (!lead) throw new Error('Cole um link do Pinguim ou escolha um lead da lista.')
    return { lead, novo: false, prints: [] }
  }
  const link = inputs.link.trim()
  const tipo = tipoDoLink(link)
  if (!tipo) throw new Error('Link não reconhecido — cole o link do Google Maps, Instagram ou WhatsApp que o Pinguim deu.')
  const achado = acharLeadPorLink(link, leads)
  if (achado) {
    log('ok', `Link reconhecido: ${achado.nome} (lead do Pinguim)`)
    return { lead: achado, novo: false, prints: [] }
  }
  if (tipo === 'whatsapp') {
    throw new Error('Esse WhatsApp não está nos leads do Pinguim. Cole o link do Google Maps ou do Instagram do negócio.')
  }
  log('info', `Link de ${ORIGEM[tipo]} fora da lista do Pinguim — tirando print para descobrir o negócio`)
  const p = await api('/leao/print', { url: link })
  const nome = nomeDoTitulo(p.titulo)
  if (!nome) throw new Error('Não consegui ler o nome do negócio nessa página. Tente o link do Google Maps.')
  log('ok', `Negócio identificado pelo print: ${nome}`)
  const pg = p.pagina || {}
  if (pg.telefone || pg.endereco) log('ok', `Lido da página: ${[pg.telefone, pg.endereco].filter(Boolean).join(' · ')}`)
  const lead = {
    id: `link-${Date.now()}`,
    demo: false,
    fonte: 'link colado no Leão',
    nome,
    categoria: null,
    endereco: pg.endereco || '',
    telefone: pg.telefone || '—',
    rating: pg.rating ?? null,
    avaliacoes: pg.avaliacoes || 0,
    maps: tipo === 'maps' ? p.urlFinal || link : null,
    instagram: tipo === 'instagram' ? link : null,
    whatsapp: pg.telefone ? waLink(pg.telefone) : null,
    fotos: [],
    confianca: 'Médio',
    observacao: 'Criado a partir de um link colado no Leão — confira telefone e endereço',
  }
  return { lead, novo: true, prints: [{ origem: tipo, ...p }] }
}

async function leao(inputs, log, { leads }) {
  const { lead, novo, prints } = await leadDoLeao(inputs, log, leads)

  log('info', `Lendo dados do lead: ${lead.nome}${lead.demo ? ' (DEMO)' : ''}`)
  log('info', `Nome: ${lead.nome} · Telefone: ${lead.telefone}`)

  // Fotos da ficha do Google (Places/SerpApi). Uma por requisição: várias fotos grandes juntas
  // passariam do limite de resposta da função do Vercel (~4,5 MB).
  let fotos = []
  if (lead.fotos?.length) {
    log('info', `Baixando ${lead.fotos.length} foto(s) da ficha do Google`)
    fotos = await baixarFotos(lead.fotos, log)
  }

  // Prints das páginas do negócio (hospedados pelo Firecrawl) — vão no ZIP em public/prints/.
  // O da página do Google Maps também traz as fotos do lugar que aparecem lá.
  if (!lead.demo) {
    for (const [origem, link] of [['maps', lead.maps], ['instagram', lead.instagram]]) {
      if (!link || prints.some((p) => p.origem === origem)) continue
      try {
        prints.push({ origem, ...(await api('/leao/print', { url: link })) })
        log('ok', `Print do ${ORIGEM[origem]} tirado e hospedado`)
      } catch (e) {
        log('warn', `Print do ${ORIGEM[origem]}: ${e.message.replace(/\.$/, '')}`)
        if (e.code === 'NO_KEY' || e.code === 'OFFLINE') break
      }
    }
  }

  const fotosMaps = prints.find((p) => p.origem === 'maps')?.fotosMaps || []
  if (!fotos.length && fotosMaps.length) {
    log('info', `A ficha do Google não trouxe fotos — baixando ${fotosMaps.length} foto(s) da página do Google Maps`)
    fotos = await baixarFotos(fotosMaps, log)
  }
  if (!fotos.length && !lead.demo && !prints.length) {
    log('warn', 'Sem fotos: o Google não mandou fotos e o Firecrawl não está ligado para ler a página do Maps (configure FIRECRAWL_API_KEY)')
  }

  // Sem foto nenhuma? Recorta a foto de capa do print do Google Maps.
  const printMaps = prints.find((p) => p.origem === 'maps')
  if (!fotos.length && printMaps) {
    const capa = await recortarCapaDoMaps(blobDeBase64(printMaps.base64, printMaps.tipo)).catch(() => null)
    if (capa) {
      fotos.push({ original: 'recorte do print do Google Maps', url: printMaps.link, tipo: 'image/jpeg', blob: capa })
      log('ok', 'Foto de capa recortada do print do Google Maps')
    }
  }
  if (!fotos.length) log('warn', 'Sem fotos — site sai com capa em cor sólida')

  const imagens = fotos.map((f, i) => ({
    arquivo: `/fotos/foto-${i + 1}.${ext(f.tipo)}`,
    nomeOriginal: f.original,
    link: f.url,
  }))
  const printsDados = prints.map((p) => ({
    origem: ORIGEM[p.origem],
    arquivo: `/prints/print-${p.origem}.${ext(p.tipo)}`,
    link: p.link,
    titulo: p.titulo,
  }))

  const nomeZip = zipName(lead.nome)
  const siteId = `site-${Date.now()}`
  const dados = {
    geradoEm: new Date().toISOString(),
    gerador: 'Leão — Central de Agentes',
    demo: Boolean(lead.demo),
    slug: slugify(lead.nome),
    tema: temaSugerido(lead.categoria),
    negocio: {
      nome: lead.nome,
      categoria: lead.categoria,
      endereco: lead.endereco,
      telefone: lead.telefone,
      whatsapp: lead.whatsapp,
      instagram: lead.instagram,
      maps: lead.maps,
      rating: lead.rating ?? null,
      avaliacoes: lead.avaliacoes ?? 0,
      placeId: lead.demo ? null : lead.id,
    },
    imagens,
    prints: printsDados,
  }

  const pasta = lead.demo ? null : await hospedarPasta(`${slugify(lead.nome)}-${siteId.slice(5)}`, dados, fotos, prints, log)

  log('info', 'Gerando estrutura React + Tailwind (src/, public/fotos/, public/prints/, configs)')
  const zip = new JSZip()
  const root = zip.folder(nomeZip.replace(/\.zip$/, ''))
  for (const [path, content] of Object.entries(siteFiles(dados))) root.file(path, content)
  fotos.forEach((f, i) =>
    root.file(`public${imagens[i].arquivo}`, f.blob || f.base64, f.blob ? {} : { base64: true }),
  )
  prints.forEach((p, i) => root.file(`public${printsDados[i].arquivo}`, p.base64, { base64: true }))

  const blob = await zip.generateAsync({ type: 'blob' })
  baixar(blob, nomeZip)
  const guardado = await salvarZip(siteId, blob)

  log('ok', `ZIP pronto: ${nomeZip} (${(blob.size / 1024).toFixed(0)} KB)${lead.demo ? ' — DEMO' : ''}`)
  if (SEM_DOWNLOAD) log('info', 'Nesta versão online o download é bloqueado — o ZIP ficou guardado aqui e o Gato Negro já abre')
  else if (guardado) log('info', 'Pacote guardado no navegador — o Gato Negro já consegue abrir')
  return {
    site: {
      id: siteId,
      leadId: lead.id,
      nome: lead.nome,
      zip: nomeZip,
      status: 'gerado',
      demo: Boolean(lead.demo),
      criadoEm: dados.geradoEm,
      pasta,
    },
    previa: {
      siteId,
      dados,
      pasta,
      fotos: fotos.map((f, i) => ({ caminho: imagens[i].arquivo, blob: f.blob || blobDeBase64(f.base64, f.tipo) })),
    },
    ...(novo ? { leads: [lead] } : {}),
  }
}

// Sobe fotos, prints e dados.json para a pasta online (Vercel Blob) e anota o link de cada foto no dados.json.
// Devolve o link do dados.json da pasta (o Gato abre por ele) ou null se a pasta estiver desligada.
async function hospedarPasta(pasta, dados, fotos, prints, log) {
  const enviar = (arquivo, tipo, conteudo) => api('/leao/hospedar', { pasta, arquivo, tipo, ...conteudo })
  try {
    for (const [i, f] of fotos.entries()) {
      const img = dados.imagens[i]
      const base64 = f.base64 || (await paraBase64(f.blob))
      img.hospedada = (await enviar(img.arquivo.replace(/^\//, ''), f.tipo, { base64 })).url
    }
    for (const [i, p] of prints.entries()) {
      if (p.base64.length > 5_000_000) continue // print grande demais para a função do Vercel: fica só no ZIP
      dados.prints[i].hospedada = (await enviar(dados.prints[i].arquivo.replace(/^\//, ''), p.tipo, { base64: p.base64 })).url
    }
    dados.pasta = `sites/${pasta}/`
    const { url } = await enviar('dados.json', 'application/json', { texto: JSON.stringify(dados, null, 2) })
    log('ok', `Fotos e dados hospedados na pasta online sites/${pasta}/ — o Gato Negro abre de qualquer aparelho`)
    return url
  } catch (e) {
    dados.imagens.forEach((img) => delete img.hospedada)
    dados.prints.forEach((pr) => delete pr.hospedada)
    delete dados.pasta
    if (e.code === 'NO_KEY') log('warn', 'Pasta online desligada (conecte um Blob Store no Vercel) — o pacote fica só neste navegador')
    else if (e.code !== 'OFFLINE') log('warn', `Pasta online: ${e.message.replace(/\.$/, '')} — o pacote fica só neste navegador`)
    return null
  }
}

// Abre a pasta online de um site: dados.json + fotos e prints pelos links hospedados.
export async function lerPasta(urlDados) {
  let dados
  try {
    dados = await (await fetch(urlDados, { cache: 'no-store' })).json()
  } catch {
    throw new Error('Não consegui abrir a pasta online desse site.')
  }
  if (!dados?.negocio?.nome) throw new Error('Pasta online sem dados.json válido.')
  const baixarTodos = async (lista) => {
    const itens = await Promise.all(
      (lista || []).map(async (x) => {
        if (!x.hospedada) return null
        const r = await fetch(x.hospedada).catch(() => null)
        return r?.ok ? { caminho: x.arquivo, blob: await r.blob() } : null
      }),
    )
    return itens.filter(Boolean)
  }
  return { dados, fotos: await baixarTodos(dados.imagens), prints: await baixarTodos(dados.prints) }
}

export async function listarPastas() {
  try {
    const r = await fetch('/api/leao/pastas')
    return r.ok ? (await r.json()).pastas : []
  } catch {
    return []
  }
}

// Versão online de demonstração (link de artefato): o visualizador bloqueia downloads, então nem tentamos.
export const SEM_DOWNLOAD = Boolean(import.meta.env.VITE_HASH_ROUTER)

function baixar(blob, nome) {
  if (SEM_DOWNLOAD) return false
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
}

// Liga um ZIP enviado ao site da lista: pelo nome do arquivo ou, se foi renomeado, pelo conteúdo.
function siteDoPacote(sites, nomeArquivo, dados) {
  const base = String(nomeArquivo || '').replace(/( \(\d+\))?\.zip$/i, '.zip')
  return (
    sites.find((s) => [s.zip, s.zipFinal].includes(base))?.id ||
    sites.find((s) => s.criadoEm === dados.geradoEm)?.id ||
    sites.find((s) => dados.negocio.placeId && s.leadId === dados.negocio.placeId)?.id ||
    null
  )
}

// Lê um ZIP do Leão: dados.json + fotos de public/fotos/.
export async function lerPacoteLeao(blob) {
  const zip = await JSZip.loadAsync(blob)
  const arquivoDados = Object.values(zip.files).find((f) => !f.dir && /(^|\/)dados\.json$/.test(f.name) && !f.name.includes('/src/'))
  if (!arquivoDados) throw new Error('ZIP sem dados.json — envie o pacote gerado pelo Leão.')
  const dados = JSON.parse(await arquivoDados.async('string'))
  if (!dados.negocio?.nome) throw new Error('dados.json inválido: falta negocio.nome')
  const raiz = arquivoDados.name.replace(/dados\.json$/, '')
  const fotos = []
  for (const img of dados.imagens || []) {
    const f = zip.file(`${raiz}public${img.arquivo}`)
    if (f) {
      const tipo = { png: 'image/png', webp: 'image/webp' }[img.arquivo.split('.').pop()] || 'image/jpeg'
      fotos.push({ caminho: img.arquivo, blob: new Blob([await f.async('arraybuffer')], { type: tipo }) })
    }
  }
  const prints = []
  for (const pr of dados.prints || []) {
    const f = zip.file(`${raiz}public${pr.arquivo}`)
    if (f) prints.push({ caminho: pr.arquivo, blob: await f.async('blob') })
  }
  const arquivos = Object.values(zip.files).filter((f) => !f.dir).map((f) => f.name)
  return { dados, fotos, prints, arquivos }
}

async function gato(inputs, log, { sites, leads = [] }) {
  let pacote = null
  let siteId = null
  let siteNovo = null
  if (inputs.zip) {
    log('info', `Abrindo pacote do Leão: ${inputs.zip.name}`)
    pacote = await lerPacoteLeao(inputs.zip)
    siteId = siteDoPacote(sites, inputs.zip.name, pacote.dados)
  } else if (inputs.site?.startsWith('pasta:')) {
    const url = inputs.site.slice(6)
    log('info', 'Abrindo a pasta online do Leão')
    pacote = await lerPasta(url)
    siteId = sites.find((x) => x.pasta === url)?.id || null
    if (!siteId) {
      // Site criado em outro aparelho: entra na lista daqui para seguir até o Tigre.
      const d = pacote.dados
      siteId = `site-${Date.now()}`
      siteNovo = { id: siteId, leadId: d.negocio.placeId, nome: d.negocio.nome, zip: zipName(d.negocio.nome), status: 'gerado', demo: Boolean(d.demo), criadoEm: d.geradoEm, pasta: url }
    }
  } else if (inputs.site) {
    siteId = inputs.site
    const site = sites.find((x) => x.id === siteId)
    const blob = await lerZip(siteId)
    if (blob) {
      log('info', 'Abrindo pacote do Leão')
      pacote = await lerPacoteLeao(blob)
    } else if (site?.pasta) {
      log('info', 'Pacote não está neste navegador — abrindo a pasta online do Leão')
      pacote = await lerPasta(site.pasta)
    } else {
      throw new Error('Pacote não encontrado neste navegador — envie o ZIP do Leão pelo campo abaixo.')
    }
  }
  if (!pacote) throw new Error('Escolha um site do Leão ou envie o ZIP.')
  const { dados, fotos, prints } = pacote
  log('ok', `dados.json: ${dados.negocio.nome}${dados.demo ? ' (DEMO)' : ''} · ${fotos.length} foto(s) do cliente`)

  log('info', 'Firecrawl: pesquisando sites de profissionais e cursos grátis de como montar um site completo')
  let referencias = []
  let cursos = []
  let secoes = []
  try {
    ;({ referencias, cursos = [], secoes = [] } = await api('/gato/estudar', { categoria: dados.negocio.categoria }))
    if (!referencias.length) log('warn', 'Nenhuma referência encontrada — seguindo com os padrões base')
    for (const r of referencias) log('info', `Modelo estudado: ${r.titulo} — ${r.url}`)
    for (const c of cursos) log('info', `Curso/tutorial lido: ${c.titulo} — ${c.url}`)
    if (secoes.length) log('ok', `Seções que os guias recomendam: ${secoes.map((x) => x.nome).join(', ')}`)
  } catch (e) {
    log('warn', `${e.message.replace(/\.$/, '')} — seguindo com os padrões base`)
  }

  // Site amplo: completa Sobre, Serviços, Diferenciais, Como funciona e Perguntas frequentes com o típico do
  // segmento (marcado como sugestão; o que já é real fica). Você confere e edita na prévia antes de aprovar.
  const conteudo = conteudoSugerido(dados)
  if (conteudo.sugerido.length) {
    log('warn', `Conteúdo sugerido para o segmento (confira na prévia): ${conteudo.sugerido.join(', ')}`)
  }

  log('info', `Fotos do cliente: ${fotos.length ? `${fotos.length} — a 1ª vira a capa, as outras a galeria` : 'nenhuma — capa em cor sólida'}`)
  log('info', 'Site amplo: capa com água (a foto ondula seguindo o cursor), destaques, Sobre, Diferenciais, Serviços, galeria em mosaico, Como funciona, faixa de WhatsApp, Perguntas frequentes, contato e mapa')
  const tema = dados.tema || temaSugerido(dados.negocio.categoria)
  log('info', `Tema sugerido para "${dados.negocio.categoria || 'negócio'}": ${tema} (dá para trocar na prévia)`)
  log('warn', 'Prévia pronta — confira e clique em "Aprovar prévia" para liberar o ZIP final')

  const n = dados.negocio
  const leadNovo =
    siteNovo && n.placeId && !leads.some((l) => l.id === n.placeId)
      ? [{ id: n.placeId, demo: Boolean(dados.demo), nome: n.nome, categoria: n.categoria, endereco: n.endereco, telefone: n.telefone, whatsapp: n.whatsapp, instagram: n.instagram, maps: n.maps, rating: n.rating, avaliacoes: n.avaliacoes, fotos: [], confianca: 'Médio', observacao: 'Veio da pasta online do Leão' }]
      : null
  return {
    preview: { siteId, dados: { ...dados, tema, conteudo }, fotos, prints, referencias, cursos, secoes },
    ...(siteNovo ? { site: siteNovo } : {}),
    ...(leadNovo ? { leads: leadNovo } : {}),
  }
}

// Grava o vídeo da prévia no servidor (Chromium + ffmpeg) e guarda no navegador para o Tigre.
export async function gravarVideoPrevia(html, siteId) {
  let res
  try {
    res = await fetch('/api/gato/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html }),
    })
  } catch {
    throw new Error('Servidor fora do ar — a gravação precisa do app rodando no computador (npm run dev).')
  }
  const tipo = res.headers.get('content-type') || ''
  if (!res.ok || !tipo.startsWith('video/')) {
    const erro = await res.json().catch(() => null)
    throw new Error(erro?.error || 'A gravação de vídeo só funciona com o app rodando no computador (npm run dev).')
  }
  const blob = await res.blob()
  if (siteId) await salvarZip(`${siteId}:video`, blob)
  return blob
}

export const videoDoSite = (siteId) => lerZip(`${siteId}:video`)

export async function enviarVideoPelaApi({ telefone, video, legenda }) {
  const dataUri = await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(video)
  })
  return api('/tigre/video', { telefone, video: dataUri, legenda, aprovado: true })
}

// Só é chamado depois do clique em "Aprovar prévia".
export async function gerarZipFinal(preview, tema, conteudo = preview.dados.conteudo) {
  const dados = {
    ...preview.dados,
    tema,
    conteudo,
    gerador: 'Gato Negro — Central de Agentes',
    aprovadoEm: new Date().toISOString(),
    referencias: preview.referencias,
    cursos: preview.cursos,
  }
  const nomeZip = zipName(dados.negocio.nome).replace(/\.zip$/, '-final.zip')
  const zip = new JSZip()
  const root = zip.folder(nomeZip.replace(/\.zip$/, ''))
  for (const [path, content] of Object.entries(siteFiles(dados))) root.file(path, content)
  for (const f of [...preview.fotos, ...(preview.prints || [])]) root.file(`public${f.caminho}`, f.blob)
  const blob = await zip.generateAsync({ type: 'blob' })
  baixar(blob, nomeZip)
  if (preview.siteId) await salvarZip(`${preview.siteId}:final`, blob) // o Tigre publica a partir daqui
  return { nomeZip, tamanho: blob.size }
}

// ---------- 🐯 Tigre ----------

export function negocioDoSite(site, leads) {
  const lead = leads.find((l) => l.id === site.leadId) || {}
  return {
    nome: site.nome,
    categoria: lead.categoria || null,
    endereco: lead.endereco || null,
    telefone: lead.telefone && lead.telefone !== '—' ? lead.telefone : null,
    whatsapp: lead.whatsapp || null,
    demo: Boolean(site.demo || lead.demo),
  }
}

// Gera o rascunho (nunca envia). Sem servidor, usa os modelos de texto do prompt.
export async function rascunho(tipo, negocio, historico = [], url) {
  try {
    return await api('/tigre/mensagem', { tipo, negocio, historico, url })
  } catch (e) {
    if (e.code !== 'OFFLINE') throw e
    const texto = tipo === 'link' ? MODELOS.link(negocio, url) : (MODELOS[tipo] || MODELOS.primeiro)(negocio)
    return { texto, fonte: 'modelo' }
  }
}

export async function classificar(texto) {
  try {
    return await api('/tigre/classificar', { texto })
  } catch (e) {
    if (e.code !== 'OFFLINE') throw e
    return { ...classificarPorPalavras(texto), fonte: 'palavras' }
  }
}

// Envio pela API oficial. `aprovado` só é true quando vem do clique "Aprovar e enviar".
export function enviarPelaApi({ telefone, texto, primeiroContato, nome }) {
  return api('/tigre/enviar', { telefone, texto, primeiroContato, nome, aprovado: true })
}

const paraBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1] || '')
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })

export async function publicarSite(site) {
  const blob = await lerZip(`${site.id}:final`)
  if (!blob) throw new Error('ZIP final não encontrado neste navegador — aprove a prévia no Gato Negro e baixe o ZIP final.')
  const zip = await JSZip.loadAsync(blob)
  const arquivos = []
  for (const f of Object.values(zip.files)) {
    if (f.dir) continue
    const caminho = f.name.split('/').slice(1).join('/') // tira a pasta raiz do ZIP
    if (caminho) arquivos.push({ caminho, base64: await paraBase64(await f.async('blob')) })
  }
  return api('/tigre/publicar', { nome: site.zip.replace(/(-final)?\.zip$/, ''), arquivos, pagamentoConfirmado: true })
}

async function tigre(inputs, log, { sites, leads, conversas = {} }) {
  const site = sites.find((x) => x.id === inputs.cliente)
  if (!site) throw new Error('Escolha um cliente com prévia aprovada no Gato Negro.')
  const negocio = negocioDoSite(site, leads)
  const conversa = conversas[site.id]
  log('info', `Carregando cliente: ${site.nome}${negocio.demo ? ' (DEMO)' : ''}`)
  if (conversa?.status === 'nao_contatar') {
    log('error', 'Este cliente pediu para não receber mensagens. Contato bloqueado.')
    return { tigre: { siteId: site.id } }
  }
  if (!negocio.telefone) log('warn', 'Lead sem telefone cadastrado — não dá para enviar pelo WhatsApp')
  if (conversa?.mensagens?.length) {
    log('ok', `Conversa retomada (${conversa.mensagens.length} mensagem(ns))`)
    return { tigre: { siteId: site.id } }
  }
  log('info', 'Preparando a primeira mensagem')
  const r = await rascunho('primeiro', negocio)
  log('ok', `Rascunho pronto (${r.fonte === 'claude' ? 'escrito pelo Claude' : 'modelo padrão'})`)
  log('warn', 'Nada foi enviado — revise e aprove a mensagem abaixo')
  return { tigre: { siteId: site.id, rascunho: r.texto } }
}

// ---------- 🐝 Abelha ----------

async function abelha(inputs, log, { sites }) {
  let blob = inputs.zip || null
  let siteId = null
  if (!blob && inputs.site) {
    siteId = inputs.site
    blob = (await lerZip(`${siteId}:final`)) || (await lerZip(siteId))
    if (!blob) throw new Error('Pacote não encontrado neste navegador — envie o ZIP pelo campo abaixo.')
  }
  if (!blob) throw new Error('Escolha um site ou envie o ZIP do Gato Negro.')

  log('info', '🐝 Abrindo a colmeia: lendo a estrutura do site')
  const { dados, fotos, prints, arquivos } = await lerPacoteLeao(blob)
  if (!siteId) siteId = siteDoPacote(sites, inputs.zip?.name, dados)
  log('ok', `🐝 ${arquivos.length} arquivo(s) · ${dados.negocio.nome}${dados.demo ? ' (DEMO)' : ''} · gerado por ${dados.gerador || '—'}`)

  const auditoria = auditar(dados, arquivos)
  const faltas = auditoria.itens.filter((i) => i.status !== 'ok')
  log(faltas.length ? 'warn' : 'ok', `🐝 Auditoria: nota ${auditoria.nota}/100 · ${faltas.length} ponto(s) para melhorar`)

  let enriquecimento = { fontes: [], campos: { sobre: null, horarios: null, servicos: [] }, metodo: null }
  if (dados.demo) {
    log('warn', '🐝 Pacote DEMO: pulando a busca na web (não há negócio real para pesquisar)')
  } else {
    log('info', `🐝 Firecrawl: buscando dados públicos de "${dados.negocio.nome}"`)
    try {
      enriquecimento = await api('/abelha/enriquecer', { negocio: dados.negocio })
      log('ok', `🐝 ${enriquecimento.fontes.length} fonte(s) encontrada(s)`)
      const c = enriquecimento.campos
      const achados = [c.sobre && 'sobre', c.horarios && 'horário', c.servicos.length && `${c.servicos.length} serviço(s)`].filter(Boolean)
      log(achados.length ? 'ok' : 'warn', achados.length ? `🐝 Encontrado com fonte: ${achados.join(', ')}` : '🐝 Nada confiável para injetar — melhor deixar em branco do que inventar')
    } catch (e) {
      log('warn', `🐝 ${e.message.replace(/\.$/, '')} — seguindo só com a auditoria`)
    }
  }
  log('warn', '🐝 Escolha abaixo o que entra no site e clique em "Injetar e baixar pasta final"')
  return { abelha: { siteId, dados, fotos, prints, auditoria, ...enriquecimento } }
}

// Injeta só o que o usuário marcou. `aceitos` = { sobre: bool, horarios: bool, servicos: [nomes] }.
export async function gerarColmeia(resultado, aceitos) {
  const { campos, fontes } = resultado
  const conteudo = { ...(resultado.dados.conteudo || {}) }
  const usadas = []
  if (aceitos.sobre && campos.sobre) {
    conteudo.sobre = campos.sobre.texto
    usadas.push({ campo: 'sobre', fonte: campos.sobre.fonte })
  }
  if (aceitos.horarios && campos.horarios) {
    conteudo.horarios = campos.horarios.texto
    usadas.push({ campo: 'horarios', fonte: campos.horarios.fonte })
  }
  const servicos = campos.servicos.filter((s) => aceitos.servicos.includes(s.nome))
  if (servicos.length) {
    conteudo.servicos = servicos.map((s) => s.nome)
    servicos.forEach((s) => usadas.push({ campo: `servico: ${s.nome}`, fonte: s.fonte }))
  }

  // O que a Abelha trouxe com fonte deixa de ser sugestão do Gato.
  const reais = usadas.map((u) => u.campo.replace(/^servico: .*/, 'servicos'))
  conteudo.sugerido = (conteudo.sugerido || []).filter((campo) => !reais.includes(campo))
  const dados = { ...resultado.dados, conteudo, gerador: 'Abelha Central — Central de Agentes', auditadoEm: new Date().toISOString() }
  const depois = auditar(dados, ['index.html', 'package.json', 'src/Site.jsx'])
  const nomeZip = zipName(dados.negocio.nome).replace(/\.zip$/, '-colmeia.zip')
  const zip = new JSZip()
  const root = zip.folder(nomeZip.replace(/\.zip$/, ''))
  for (const [path, content] of Object.entries(siteFiles(dados))) root.file(path, content)
  for (const f of [...resultado.fotos, ...(resultado.prints || [])]) root.file(`public${f.caminho}`, f.blob)
  root.file('conteudo.json', JSON.stringify({ ...conteudo, fontes: usadas }, null, 2) + '\n')
  root.file('AUDITORIA.md', relatorio(dados, resultado.auditoria, depois, usadas, fontes))
  const blob = await zip.generateAsync({ type: 'blob' })
  baixar(blob, nomeZip)
  if (resultado.siteId) await salvarZip(`${resultado.siteId}:final`, blob) // o Tigre publica a versão enriquecida
  return { nomeZip, tamanho: blob.size, nota: depois.nota }
}

function relatorio(dados, antes, depois, usadas, fontes) {
  const icone = { ok: '✅', aviso: '⚠️', falta: '❌' }
  return `# 🐝 Auditoria — ${dados.negocio.nome}

Gerado pela Abelha Central em ${new Date().toLocaleString('pt-BR')}.
${dados.demo ? '\n> ⚠️ Pacote DEMO — dados de demonstração.\n' : ''}
**Nota da colmeia:** ${antes.nota}/100 → **${depois.nota}/100**

## Checklist

| | Item | Situação |
|---|---|---|
${depois.itens.map((i) => `| ${icone[i.status]} | ${i.titulo} | ${String(i.detalhe ?? '').replace(/\|/g, '/')} |`).join('\n')}

## Dados injetados (com fonte)

${usadas.length ? usadas.map((u) => `- **${u.campo}** — ${u.fonte}`).join('\n') : 'Nenhum dado novo injetado (nada confiável encontrado ou nada aprovado).'}

## Fontes consultadas

${fontes.length ? fontes.map((f) => `- [${f.titulo}](${f.url})`).join('\n') : 'Nenhuma.'}

## Projeto

Ferramentas usadas no pipeline: Google Maps (SerpApi/Firecrawl), Firecrawl, Claude API, React + Vite + Tailwind,
JSZip, WhatsApp (Z-API ou Cloud API), Vercel. Abra esta pasta no Visual Studio Code e rode \`npm install && npm run dev\`.
`
}

// ---------- entrada única ----------

export async function runAgent(agentId, inputs, onLog, state = {}) {
  const log = (level, msg) => onLog({ level, msg, at: new Date() })
  if (agentId === 'pinguim') return pinguim(inputs, log)
  if (agentId === 'leao') return leao(inputs, log, state)
  if (agentId === 'gato') return gato(inputs, log, state)
  if (agentId === 'tigre') return tigre(inputs, log, state)
  if (agentId === 'abelha') return abelha(inputs, log, state)
  await playDemo(agentId, inputs, log)
  return {}
}
