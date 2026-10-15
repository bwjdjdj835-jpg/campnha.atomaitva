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
// Plano grátis do Firecrawl: 10 buscas/min e 10 leituras de página/min — limites SEPARADOS (docs.firecrawl.dev/rate-limits).
// Cada etapa reserva quantos pedidos de cada tipo vai usar; fica 1 de folga em cada.
const LIMITE_POR_MINUTO = { busca: 9, pagina: 9 }
const janelas = { busca: [], pagina: [] }
async function gastar(n, log, parar, tipo = 'busca') {
  const janela = janelas[tipo]
  let avisou = false
  for (;;) {
    const agora = Date.now()
    while (janela.length && agora - janela[0] > 60_000) janela.shift()
    if (!janela.length || janela.length + n <= LIMITE_POR_MINUTO[tipo] || parar() || n === 0) break
    if (!avisou) log('info', `Esperando o limite do Firecrawl (plano grátis, ${tipo === 'busca' ? 'buscas' : 'páginas'}) — uns ${Math.ceil((60_000 - (agora - janela[0])) / 1000)} s`)
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

// Versões antigas marcavam o nicho como feito depois de poucos clientes (e seguiam sozinhas até pizzaria/confeitaria).
// Agora "feito" = lista inteira do nicho terminada: as marcas antigas são apagadas uma vez e tudo recomeça na barbearia.
// (Quem já foi contatado ou já tem site feito continua sendo pulado pelo selo de contato.)
if ((lerPipeline().auto?.v || 0) < 2) setPipeline((s) => ({ auto: { ...(s.auto || {}), v: 2, feitos: [], listas: {} } }))

export const nichosFeitos = () => lerPipeline().auto?.feitos || []
// Próximo nicho da lista que ainda não foi feito (null = todos feitos).
export const proximoNicho = (nichos) => nichos.find((n) => !nichosFeitos().includes(chave(n))) || null

// Botão de começar (tela inicial ou Aranha Administradora): pede a gravação da aba no próprio clique — o navegador
// só pergunta logo depois de um clique — e deixa guardada para a página do automático, que começa sozinha.
// videoServidor: já lido do /api/status pela página (o servidor local grava sozinho, sem pedir nada).
// manual: você grava o vídeo no notebook — não pede para compartilhar a aba.
export async function prepararInicio({ videoServidor = false, manual = false } = {}) {
  guardarFluxo(!manual && !videoServidor ? await pedirGravacaoDaAba().catch(() => null) : undefined)
}
// Modo de vídeo salvo nas opções do automático ('manual' = você grava, padrão; 'auto' = o app grava).
export const videoManualNasOpcoes = () => {
  try {
    return (JSON.parse(localStorage.getItem('central-agentes:automatico') || '{}').videoModo || 'manual') === 'manual'
  } catch {
    return true
  }
}
export const recomecarNichos = () => setPipeline((s) => ({ auto: { ...(s.auto || {}), feitos: [], listas: {} } }))
// O nicho já começou e ainda tem comércios na lista guardada (a próxima rodada continua nele).
export const nichoEmAndamento = (n) => Boolean(lerPipeline().auto?.listas?.[chave(n)])

// opcoes: { cidade, nichos, porNicho, estudo ('1' = 1 minuto, padrão | '0' | 'nenhum' | '3min'), abelha }
// Um nicho por vez (pedido do usuário): para depois do 1º nicho que deixar cliente pronto — o próximo só começa
// quando você aprova na Aranha Administradora. Nicho sem nenhum cliente pronto passa direto para o seguinte.
// ui: { log(level, msg), etapa({ nicho, comercio, passo }), parar() → bool, gravar(html, siteId) → Blob | null }
export async function rodarAutomatico(opcoes, ui) {
  const { log, etapa, parar } = ui
  const onLog = (l) => log(l.level, l.msg)
  const { cidade, nichos, porNicho, estudo, abelha } = opcoes
  const resumo = { prontos: 0, pulados: 0, erros: 0, itens: [] }
  // Relatório da rodada: o que aconteceu com cada comércio (vai para a Aranha Administradora).
  const anotar = (nome, resultado, detalhe = '') => resumo.itens.push({ nome, resultado, detalhe })
  // Vídeo + mensagem de um cliente rodam enquanto o próximo site já está sendo montado (um vídeo por vez).
  let filaFinal = Promise.resolve()

  for (const nicho of nichos) {
    if (parar()) break
    if (nichosFeitos().includes(chave(nicho))) {
      log('info', `⏭️ ${nicho}: já feito numa rodada anterior — pulando (use "Recomeçar do 1º nicho" para refazer)`)
      continue
    }
    log('ok', `━━━━━━━━ Nicho: ${nicho} em ${cidade} ━━━━━━━━`)
    let achados = []
    // Um nicho por vez até o fim: a lista do Pinguim fica guardada e as próximas rodadas continuam nela
    // (sem nova busca); o nicho só é dado como feito quando a lista acaba.
    const guardada = lerPipeline().auto?.listas?.[chave(nicho)]
    if (guardada?.length) {
      const leads = lerPipeline().leads
      achados = guardada.map((id) => leads.find((l) => l.id === id)).filter(Boolean)
      log('info', `🐧 ${nicho}: continuando a lista desta busca (${achados.length} comércio(s)) — sem buscar de novo`)
    } else {
      etapa({ nicho, comercio: null, passo: '🐧 Pinguim procurando comércios sem site' })
      try {
        const res = await runAgent('pinguim', { categoria: nicho, cidade }, onLog)
        aplicar(res)
        achados = (res.leads || []).filter((l) => !l.demo)
        if (res.leads?.length && !achados.length) {
          log('error', 'O Pinguim está em MODO DEMONSTRAÇÃO (sem fonte de Maps no servidor) — o automático só trabalha com comércios reais.')
          break
        }
        const ids = achados.map((l) => l.id)
        setPipeline((s) => ({ auto: { ...(s.auto || {}), listas: { ...(s.auto?.listas || {}), [chave(nicho)]: ids } } }))
      } catch (e) {
        // Não pula de nicho em silêncio: para e mostra o erro no relatório (dá para tentar de novo).
        log('error', `🐧 ${nicho}: ${e.message} — parei aqui; tente de novo pela Aranha Administradora`)
        resumo.nicho = nicho
        anotar(`Busca de ${nicho}`, 'erro_busca', e.message)
        break
      }
      log('info', `🐧 ${achados.length} comércio(s) sem site no Maps`)
    }
    log('info', `Fazendo até ${porNicho === Infinity ? 'todos' : porNicho} cliente(s) nesta rodada; o resto do nicho fica para a próxima, depois da sua aprovação`)

    // Conferência adiantada: enquanto um site é montado (leituras de página), os próximos comércios já vão sendo
    // conferidos (buscas) — limites diferentes no Firecrawl, então um não espera o outro.
    const conferencias = new Map()
    let filaConferencia = Promise.resolve()
    const precisaConferir = (l) => !l.demo && String(l.telefone || '').replace(/\D/g, '').length >= 10 && !contatoDoLead(l, lerPipeline()) &&
      (!l.conferencia?.status || ['pendente', 'erro'].includes(l.conferencia.status))
    const conferirAntes = (l) => {
      if (!conferencias.has(l.id)) {
        const p = filaConferencia.then(() => (parar() ? 'erro' : conferirUm(l, log, parar)))
        filaConferencia = p.catch(() => {})
        conferencias.set(l.id, p)
      }
      return conferencias.get(l.id)
    }

    let feitos = 0
    let esgotou = true // a lista do nicho acabou (todos feitos ou pulados)
    for (const [i, achado] of achados.entries()) {
      if (parar() || feitos >= porNicho) {
        esgotou = false
        break
      }
      // Deixa até 4 comércios à frente já na fila de conferência.
      for (const prox of achados.slice(i, i + 5)) {
        const l = lerPipeline().leads.find((x) => x.id === prox.id) || prox
        if (precisaConferir(l)) conferirAntes(l)
      }
      const p = lerPipeline()
      const lead = p.leads.find((x) => x.id === achado.id) || achado
      const nome = lead.nome
      if (String(lead.telefone || '').replace(/\D/g, '').length < 10) {
        log('info', `⏭️ ${nome}: sem telefone — não dá para mandar pelo WhatsApp`)
        anotar(nome, 'sem_telefone')
        resumo.pulados++
        continue
      }
      const contato = contatoDoLead(lead, p)
      if (contato) {
        log('info', `⏭️ ${nome}: ${contato.status === 'site_feito' ? 'site já feito antes' : 'você já procurou este comércio'} — pulando`)
        anotar(nome, contato.status === 'site_feito' ? 'ja_feito' : 'ja_contatado')
        resumo.pulados++
        continue
      }

      // Confere de novo se tem site (domínio com o nome / telefone em outro site).
      let veredito = lead.conferencia?.status
      if (!veredito || ['pendente', 'erro'].includes(veredito)) {
        etapa({ nicho, comercio: nome, passo: '🔎 Conferindo se já tem site' })
        veredito = await conferirAntes(lead)
      }
      if (veredito === 'tem' || veredito === 'provavel' || veredito === 'erro') {
        log('info', `⏭️ ${nome}: ${veredito === 'tem' ? 'já tem site' : veredito === 'provavel' ? 'possível site — confira à mão no Pinguim' : 'não deu para conferir se tem site'} — pulando`)
        anotar(nome, veredito === 'tem' ? 'tem_site' : veredito === 'provavel' ? 'possivel_site' : 'erro_conferir', lerPipeline().leads.find((l) => l.id === lead.id)?.conferencia?.site || '')
        resumo.pulados++
        continue
      }

      try {
        const pronto = await montarSite(lead, { nicho, estudo, abelha }, ui, onLog)
        feitos++
        filaFinal = filaFinal.then(() =>
          finalizar(pronto, { nicho }, ui)
            .then((ok) => {
              if (ok) resumo.prontos++
              else resumo.erros++
              anotar(pronto.nome, ok ? 'pronto' : 'sem_video')
            })
            .catch((e) => {
              resumo.erros++
              anotar(pronto.nome, 'erro', e.message)
              log('error', `${pronto.nome}: ${e.message}`)
            }),
        )
      } catch (e) {
        resumo.erros++
        anotar(nome, 'erro', e.message)
        log('error', `${nome}: ${e.message} — seguindo para o próximo`)
      }
    }
    await filaFinal
    if (!parar()) {
      resumo.nicho = nicho
      if (esgotou) {
        setPipeline((s) => {
          const listas = { ...(s.auto?.listas || {}) }
          delete listas[chave(nicho)]
          return { auto: { ...(s.auto || {}), listas, feitos: [...new Set([...(s.auto?.feitos || []), chave(nicho)])] } }
        })
        log('ok', `✔ ${nicho}: lista do nicho concluída — ${feitos} cliente(s) pronto(s) nesta rodada`)
      } else {
        log('ok', `✔ ${nicho}: ${feitos} cliente(s) pronto(s) — ainda há comércios de ${nicho} na lista; a próxima rodada continua em ${nicho}`)
      }
      // Para no fim de cada nicho, mesmo sem cliente: você vê o relatório na Aranha Administradora e decide seguir.
      if (!resumo.prontos) log('warn', `${nicho}: nenhum cliente novo nesta rodada — veja o motivo de cada comércio no relatório da Aranha Administradora`)
      break
    }
  }
  resumo.proximo = proximoNicho(nichos)
  if (resumo.nicho) {
    setPipeline((s) => ({
      auto: { ...(s.auto || {}), relatorio: { nicho: resumo.nicho, em: new Date().toISOString(), prontos: resumo.prontos, itens: resumo.itens } },
    }))
  }
  return resumo
}

// Confere um comércio (busca pelo nome e, se nada, pelo telefone). → 'tem' | 'provavel' | 'nao' | 'erro'
async function conferirUm(lead, log, parar) {
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    // Reserva 1 busca (pelo nome); quem já tem site para aí. A 2ª (pelo telefone) só é contada se aconteceu.
    await gastar(1, log, parar, 'busca')
    try {
      const r = await conferirSite(lead)
      for (let k = 1; k < (r.pedidos || 1); k++) janelas.busca.push(Date.now())
      atualizarLead(lead.id, {
        conferencia: { status: r.veredito, site: r.site, evidencias: r.evidencias, em: new Date().toISOString() },
        instagram: lead.instagram || r.instagram,
        confianca: r.veredito === 'nao' ? 'Alto' : 'Médio',
      })
      return r.veredito
    } catch (e) {
      if (e.code !== 'LIMITE') return 'erro'
      log('info', 'Firecrawl pediu uma pausa — esperando 1 minuto')
      await esperar(60_000)
    }
  }
  return 'erro'
}

const estudados = new Set() // nichos cujo estudo do Gato já foi feito nesta rodada (os próximos reaproveitam)

// Site pronto para o vídeo: Leão → Gato (→ Abelha, se ligada). Devolve { siteId, nome }.
async function montarSite(lead, { nicho, estudo, abelha }, ui, onLog) {
  const { log, etapa, parar } = ui
  const nome = lead.nome
  const passo = (p) => etapa({ nicho, comercio: nome, passo: p })

  passo('🦁 Leão montando o site com as fotos')
  await gastar(lead.instagram ? 2 : 1, log, parar, 'pagina')
  const rl = await runAgent('leao', { lead: lead.id, semDownload: true }, onLog, lerPipeline())
  aplicar(rl)
  const siteId = rl.site.id

  passo('🐈‍⬛ Gato fazendo a prévia')
  const nichoGato = chave(lead.categoria || nicho)
  const estudaAgora = estudo !== 'nenhum' && !estudados.has(nichoGato)
  if (estudaAgora) await gastar(6, log, parar, 'busca') // estudo inicial: ~5 buscas + até 4 páginas
  const rg = await runAgent('gato', { site: siteId, estudo, reaproveitar: true }, onLog, lerPipeline())
  // A rodada do estudo (1 minuto ou mais) também usou ~8 pedidos: entra na conta para o próximo site não levar 429.
  if (estudaAgora && estudo !== '0') await gastar(6, log, parar, 'pagina') // rodada: 2 buscas + 6 páginas
  estudados.add(nichoGato)
  aplicar(rg)
  const pv = rg.preview
  await gerarZipFinal(pv, pv.dados.tema, pv.dados.conteudo, pv.modeloInicial || undefined, true, { hero: 'agua', galeria: 'uniforme' }, { baixarZip: false })
  marcarSite(siteId, { status: 'preparando', tema: pv.dados.tema, auto: true })

  if (abelha && !parar()) {
    passo('🐝 Abelha completando com dados que têm fonte')
    try {
      await gastar(2, log, parar, 'busca')
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
// prontos; sem vídeo fica `sem_video` (Aranha Administradora → "Gravar os vídeos que faltam"). → true se ficou pronto.
async function finalizar({ siteId, nome }, { nicho }, ui) {
  const { log, etapa, gravar } = ui
  // Modo "eu gravo no meu notebook" (padrão, pedido do usuário): sem gravação automática — o cliente vai para
  // aprovação só com a mensagem, e lá você abre a prévia, grava com o gravador do Windows e envia o vídeo.
  if (ui.videoManual) {
    await escreverMensagem(siteId, nome, nicho, etapa)
    marcarSite(siteId, { status: 'revisar', videoManual: true })
    log('ok', `✅ ${nome}: site e mensagem prontos — grave o vídeo da prévia e aprove na Aranha Administradora`)
    return true
  }
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

  await escreverMensagem(siteId, nome, nicho, etapa)
  if (!temVideo) {
    marcarSite(siteId, { status: 'sem_video' })
    log('warn', `🎬 ${nome}: sem vídeo — fica em "Falta o vídeo" na Aranha Administradora até gravar`)
    return false
  }
  marcarSite(siteId, { status: 'revisar' })
  log('ok', `✅ ${nome}: vídeo e mensagem prontos — aguardando sua aprovação na Aranha Administradora`)
  return true
}

async function escreverMensagem(siteId, nome, nicho, etapa) {
  if (lerPipeline().conversas?.[siteId]?.rascunho) return
  etapa({ nicho, comercio: nome, passo: '🐯 Tigre escrevendo a mensagem' })
  const p = lerPipeline()
  const site = p.sites.find((x) => x.id === siteId)
  const msg = await rascunho('primeiro', negocioDoSite(site, p.leads))
  setPipeline((s) => ({ conversas: { ...s.conversas, [siteId]: { status: 'novo', mensagens: [], rascunho: msg.texto, auto: true } } }))
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
    if (!site.videoManual && !(await videoDoSite(site.id))) {
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
