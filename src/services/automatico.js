// 🤖 Modo automático: roda os 5 agentes em sequência, nicho por nicho (barbearia, salão, pizzaria…).
// Para cada comércio sem site: 🦁 Leão monta → 🐈‍⬛ Gato faz a prévia → 🐝 Abelha completa com dados que têm fonte
// → 🎬 vídeo da prévia → 🐯 Tigre escreve a 1ª mensagem. NADA é enviado: cada cliente fica "aguardando sua aprovação"
// no Tigre (você confere o vídeo e a mensagem e manda pelo seu WhatsApp).
// Pula quem já tem site, quem é "possível site", quem não tem telefone e quem você já procurou (selo de contato).

import { runAgent, conferirSite, gerarZipFinal, gerarColmeia, lerPacoteLeao, guardarVideo, videoDoSite, rascunho, negocioDoSite, encerrarEstudo } from './agents.js'
import { lerZip } from '../lib/zipStore.js'
import { lerPipeline, setPipeline } from '../store/pipeline.js'
import { contatoDoLead } from '../lib/contato.js'
import { fotosEmDataUrl, htmlDaPrevia, CSS_GRAVACAO, pedirGravacaoDaAba } from '../lib/previa.jsx'

export const NICHOS_PADRAO = [
  'barbearia',
  'salão de beleza',
  'manicure',
  'estética',
  'pet shop',
  'pizzaria',
  'hamburgueria',
  'lanchonete',
  'restaurante',
  'açaí',
  'padaria',
  'confeitaria',
  'academia',
  'oficina mecânica',
  'lava jato',
  'borracharia',
  'ótica',
  'loja de roupas',
  'floricultura',
]

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
const chave = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// Limite do plano grátis do Firecrawl (~10 pedidos/min): cada etapa "reserva" quantos pedidos vai usar.
const PEDIDOS_POR_MINUTO = 8
const janela = []
async function gastar(n, log, parar) {
  let avisou = false
  for (;;) {
    const agora = Date.now()
    while (janela.length && agora - janela[0] > 60_000) janela.shift()
    if (!janela.length || janela.length + n <= PEDIDOS_POR_MINUTO || parar()) break
    if (!avisou) log('info', `Esperando o limite do Firecrawl (plano grátis) — uns ${Math.ceil((60_000 - (agora - janela[0])) / 1000)} s`)
    avisou = true
    await esperar(1000)
  }
  for (let i = 0; i < n; i++) janela.push(Date.now())
}

// Mesmo que a página do agente faz com o resultado (leads, "já têm site", site novo).
function aplicar(res) {
  if (res.leads) {
    setPipeline((s) => {
      const velhos = new Map(s.leads.map((l) => [l.id, l]))
      // Comércio achado de novo: mantém a conferência que já foi feita (não gasta Firecrawl outra vez).
      const novos = res.leads.map((l) => {
        const v = velhos.get(l.id)
        return v?.conferencia && v.conferencia.status !== 'pendente' && l.conferencia?.status === 'pendente' ? { ...l, conferencia: v.conferencia } : l
      })
      const ids = new Set(novos.map((l) => l.id))
      return { leads: [...novos, ...s.leads.filter((l) => !ids.has(l.id))] }
    })
  }
  if (res.comSite) {
    setPipeline((s) => {
      const ids = new Set(res.comSite.map((c) => c.id))
      return { comSite: [...res.comSite, ...(s.comSite || []).filter((c) => !ids.has(c.id))] }
    })
  }
  if (res.site) setPipeline((s) => ({ sites: [res.site, ...s.sites.filter((x) => x.id !== res.site.id)] }))
}

const atualizarLead = (id, campos) => setPipeline((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...campos } : l)) }))
const marcarSite = (id, campos) => setPipeline((s) => ({ sites: s.sites.map((x) => (x.id === id ? { ...x, ...campos } : x)) }))

// Autorização de gravação pedida no clique da tela inicial (o navegador só pergunta logo depois de um clique);
// a página do automático pega e usa. null = sem vídeo.
let fluxoPronto
export const guardarFluxo = (f) => (fluxoPronto = f)
export function pegarFluxo() {
  const f = fluxoPronto
  fluxoPronto = undefined
  return f
}

export const nichosFeitos = () => lerPipeline().auto?.feitos || []
// Próximo nicho da lista que ainda não foi feito (null = todos feitos).
export const proximoNicho = (nichos) => nichos.find((n) => !nichosFeitos().includes(chave(n))) || null

// Botão de começar (tela inicial ou Área do Administrador): pede a gravação da aba no próprio clique — o navegador
// só pergunta logo depois de um clique — e deixa guardada para a página do automático, que começa sozinha.
// videoServidor: já lido do /api/status pela página (o servidor local grava sozinho, sem pedir nada).
export async function prepararInicio({ videoServidor = false } = {}) {
  guardarFluxo(!videoServidor ? await pedirGravacaoDaAba().catch(() => null) : undefined)
}
export const recomecarNichos = () => setPipeline((s) => ({ auto: { ...(s.auto || {}), feitos: [] } }))

// opcoes: { cidade, nichos, porNicho, estudo ('1' = 1 minuto, padrão | '0' | 'nenhum' | '3min'), abelha }
// Um nicho por vez (pedido do usuário): para depois do 1º nicho que deixar cliente pronto — o próximo só começa
// quando você aprova na Área do Administrador. Nicho sem nenhum cliente pronto passa direto para o seguinte.
// ui: { log(level, msg), etapa({ nicho, comercio, passo }), parar() → bool, gravar(html, siteId) → Blob | null }
export async function rodarAutomatico(opcoes, ui) {
  const { log, etapa, parar } = ui
  const onLog = (l) => log(l.level, l.msg)
  const { cidade, nichos, porNicho, estudo, abelha } = opcoes
  const resumo = { prontos: 0, pulados: 0, erros: 0 }
  // Vídeo + mensagem de um cliente rodam enquanto o próximo site já está sendo montado (um vídeo por vez).
  let filaFinal = Promise.resolve()

  for (const nicho of nichos) {
    if (parar()) break
    if (nichosFeitos().includes(chave(nicho))) {
      log('info', `⏭️ ${nicho}: já feito numa rodada anterior — pulando (use "Recomeçar do 1º nicho" para refazer)`)
      continue
    }
    log('ok', `━━━━━━━━ Nicho: ${nicho} em ${cidade} ━━━━━━━━`)
    etapa({ nicho, comercio: null, passo: '🐧 Pinguim procurando comércios sem site' })
    let achados = []
    try {
      const res = await runAgent('pinguim', { categoria: nicho, cidade }, onLog)
      aplicar(res)
      achados = (res.leads || []).filter((l) => !l.demo)
      if (res.leads?.length && !achados.length) {
        log('error', 'O Pinguim está em MODO DEMONSTRAÇÃO (sem fonte de Maps no servidor) — o automático só trabalha com comércios reais.')
        break
      }
    } catch (e) {
      log('error', `🐧 ${nicho}: ${e.message} — indo para o próximo nicho`)
      continue
    }
    log('info', `🐧 ${achados.length} comércio(s) sem site no Maps — fazendo até ${porNicho === Infinity ? 'todos' : porNicho}`)

    let feitos = 0
    for (const achado of achados) {
      if (parar() || feitos >= porNicho) break
      const p = lerPipeline()
      const lead = p.leads.find((x) => x.id === achado.id) || achado
      const nome = lead.nome
      if (String(lead.telefone || '').replace(/\D/g, '').length < 10) {
        log('info', `⏭️ ${nome}: sem telefone — não dá para mandar pelo WhatsApp`)
        resumo.pulados++
        continue
      }
      const contato = contatoDoLead(lead, p)
      if (contato) {
        log('info', `⏭️ ${nome}: ${contato.status === 'site_feito' ? 'site já feito antes' : 'você já procurou este comércio'} — pulando`)
        resumo.pulados++
        continue
      }

      // Confere de novo se tem site (domínio com o nome / telefone em outro site).
      let veredito = lead.conferencia?.status
      if (!veredito || ['pendente', 'erro'].includes(veredito)) {
        etapa({ nicho, comercio: nome, passo: '🔎 Conferindo se já tem site' })
        for (let tentativa = 0; tentativa < 2; tentativa++) {
          await gastar(2, log, parar)
          try {
            const r = await conferirSite(lead)
            veredito = r.veredito
            atualizarLead(lead.id, {
              conferencia: { status: r.veredito, site: r.site, evidencias: r.evidencias, em: new Date().toISOString() },
              instagram: lead.instagram || r.instagram,
              confianca: r.veredito === 'nao' ? 'Alto' : 'Médio',
            })
            break
          } catch (e) {
            veredito = 'erro'
            if (e.code !== 'LIMITE') break
            log('info', 'Firecrawl pediu uma pausa — esperando 1 minuto')
            await esperar(60_000)
          }
        }
      }
      if (veredito === 'tem' || veredito === 'provavel' || veredito === 'erro') {
        log('info', `⏭️ ${nome}: ${veredito === 'tem' ? 'já tem site' : veredito === 'provavel' ? 'possível site — confira à mão no Pinguim' : 'não deu para conferir se tem site'} — pulando`)
        resumo.pulados++
        continue
      }

      try {
        const pronto = await montarSite(lead, { nicho, estudo, abelha }, ui, onLog)
        feitos++
        filaFinal = filaFinal.then(() =>
          finalizar(pronto, { nicho }, ui)
            .then((ok) => (ok ? resumo.prontos++ : resumo.erros++))
            .catch((e) => {
              resumo.erros++
              log('error', `${pronto.nome}: ${e.message}`)
            }),
        )
      } catch (e) {
        resumo.erros++
        log('error', `${nome}: ${e.message} — seguindo para o próximo`)
      }
    }
    await filaFinal
    if (!parar()) {
      setPipeline((s) => ({ auto: { ...(s.auto || {}), feitos: [...new Set([...(s.auto?.feitos || []), chave(nicho)])] } }))
      log('ok', `✔ ${nicho}: ${feitos} cliente(s) pronto(s) para aprovar`)
      resumo.nicho = nicho
      if (resumo.prontos > 0) break // espera sua aprovação antes do próximo nicho
      log('info', `${nicho}: nenhum cliente novo — indo para o próximo nicho`)
    }
  }
  resumo.proximo = proximoNicho(nichos)
  return resumo
}

const estudados = new Set() // nichos cujo estudo do Gato já foi feito nesta rodada (os próximos reaproveitam)

// Site pronto para o vídeo: Leão → Gato (→ Abelha, se ligada). Devolve { siteId, nome }.
async function montarSite(lead, { nicho, estudo, abelha }, ui, onLog) {
  const { log, etapa, parar } = ui
  const nome = lead.nome
  const passo = (p) => etapa({ nicho, comercio: nome, passo: p })

  passo('🦁 Leão montando o site com as fotos')
  await gastar(lead.instagram ? 2 : 1, log, parar)
  const rl = await runAgent('leao', { lead: lead.id, semDownload: true }, onLog, lerPipeline())
  aplicar(rl)
  const siteId = rl.site.id

  passo('🐈‍⬛ Gato fazendo a prévia')
  const nichoGato = chave(lead.categoria || nicho)
  const estudaAgora = estudo !== 'nenhum' && !estudados.has(nichoGato)
  if (estudaAgora) await gastar(9, log, parar)
  const rg = await runAgent('gato', { site: siteId, estudo, reaproveitar: true }, onLog, lerPipeline())
  // A rodada do estudo (1 minuto ou mais) também usou ~8 pedidos: entra na conta para o próximo site não levar 429.
  if (estudaAgora && estudo !== '0') await gastar(8, log, parar)
  estudados.add(nichoGato)
  aplicar(rg)
  const pv = rg.preview
  await gerarZipFinal(pv, pv.dados.tema, pv.dados.conteudo, pv.modeloInicial || undefined, true, { hero: 'agua', galeria: 'uniforme' }, { baixarZip: false })
  marcarSite(siteId, { status: 'preparando', tema: pv.dados.tema, auto: true })

  if (abelha && !parar()) {
    passo('🐝 Abelha completando com dados que têm fonte')
    try {
      await gastar(2, log, parar)
      const { abelha: r } = await runAgent('abelha', { site: siteId }, onLog, lerPipeline())
      const c = r.campos
      await gerarColmeia(r, { sobre: Boolean(c.sobre), horarios: Boolean(c.horarios), servicos: c.servicos.map((s) => s.nome) }, { baixarZip: false })
    } catch (e) {
      log('warn', `🐝 ${e.message} — seguindo sem a Abelha`)
    }
  }

  return { siteId, nome }
}

// Vídeo da prévia + 1ª mensagem do Tigre. Só entra em "Aguardando sua aprovação" (status `revisar`) com OS DOIS
// prontos; sem vídeo fica `sem_video` (Área do Administrador → "Gravar os vídeos que faltam"). → true se ficou pronto.
async function finalizar({ siteId, nome }, { nicho }, ui) {
  const { log, etapa, gravar } = ui
  etapa({ nicho, comercio: nome, passo: '🎬 Gravando o vídeo da prévia' })
  let temVideo = false
  try {
    const pacote = await lerPacoteLeao(await lerZip(`${siteId}:final`))
    const html = htmlDaPrevia(pacote.dados, await fotosEmDataUrl(pacote.fotos), CSS_GRAVACAO, { agua: false })
    const video = await gravar(html, siteId)
    if (video) {
      await guardarVideo(siteId, video)
      temVideo = true
      log('ok', `🎬 Vídeo gravado (${(video.size / 1024 / 1024).toFixed(1)} MB)`)
    }
  } catch (e) {
    log('warn', `🎬 Vídeo: ${e.message}`)
  }

  const conversa = lerPipeline().conversas?.[siteId]
  if (!conversa?.rascunho) {
    etapa({ nicho, comercio: nome, passo: '🐯 Tigre escrevendo a mensagem' })
    const p = lerPipeline()
    const site = p.sites.find((x) => x.id === siteId)
    const msg = await rascunho('primeiro', negocioDoSite(site, p.leads))
    setPipeline((s) => ({ conversas: { ...s.conversas, [siteId]: { status: 'novo', mensagens: [], rascunho: msg.texto, auto: true } } }))
  }
  if (!temVideo) {
    marcarSite(siteId, { status: 'sem_video' })
    log('warn', `🎬 ${nome}: sem vídeo — fica em "Falta o vídeo" na Área do Administrador até gravar`)
    return false
  }
  marcarSite(siteId, { status: 'revisar' })
  log('ok', `✅ ${nome}: vídeo e mensagem prontos — aguardando sua aprovação na Área do Administrador`)
  return true
}

// Grava de novo os vídeos que faltaram (status `sem_video`). Mesma página, mesma autorização de gravação.
export async function regravarVideos(ui) {
  const resumo = { prontos: 0, pulados: 0, erros: 0 }
  for (const site of lerPipeline().sites.filter((s) => s.status === 'sem_video')) {
    if (ui.parar()) break
    try {
      if (await finalizar({ siteId: site.id, nome: site.nome }, { nicho: 'vídeos que faltam' }, ui)) resumo.prontos++
      else resumo.erros++
    } catch (e) {
      resumo.erros++
      ui.log('error', `${site.nome}: ${e.message}`)
    }
  }
  return resumo
}

// Clientes antigos marcados como prontos sem vídeo ou sem mensagem: arruma (sem vídeo → `sem_video`; sem mensagem → escreve).
export async function conferirProntos() {
  for (const site of lerPipeline().sites.filter((s) => s.status === 'revisar')) {
    if (!(await videoDoSite(site.id))) {
      marcarSite(site.id, { status: 'sem_video' })
      continue
    }
    if (!lerPipeline().conversas?.[site.id]?.rascunho) {
      const p = lerPipeline()
      const msg = await rascunho('primeiro', negocioDoSite(site, p.leads)).catch(() => null)
      if (msg) setPipeline((s) => ({ conversas: { ...s.conversas, [site.id]: { status: 'novo', mensagens: [], ...(s.conversas?.[site.id] || {}), rascunho: msg.texto, auto: true } } }))
    }
  }
}

export const pararEstudo = encerrarEstudo
