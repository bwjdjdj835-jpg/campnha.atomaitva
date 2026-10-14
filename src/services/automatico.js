// 🤖 Modo automático: roda os 5 agentes em sequência, nicho por nicho (barbearia, salão, pizzaria…).
// Para cada comércio sem site: 🦁 Leão monta → 🐈‍⬛ Gato faz a prévia → 🐝 Abelha completa com dados que têm fonte
// → 🎬 vídeo da prévia → 🐯 Tigre escreve a 1ª mensagem. NADA é enviado: cada cliente fica "aguardando sua aprovação"
// no Tigre (você confere o vídeo e a mensagem e manda pelo seu WhatsApp).
// Pula quem já tem site, quem é "possível site", quem não tem telefone e quem você já procurou (selo de contato).

import { runAgent, conferirSite, gerarZipFinal, gerarColmeia, lerPacoteLeao, guardarVideo, rascunho, negocioDoSite, encerrarEstudo } from './agents.js'
import { lerZip } from '../lib/zipStore.js'
import { lerPipeline, setPipeline } from '../store/pipeline.js'
import { contatoDoLead } from '../lib/contato.js'
import { fotosEmDataUrl, htmlDaPrevia } from '../lib/previa.jsx'

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

export const nichosFeitos = () => lerPipeline().auto?.feitos || []
export const recomecarNichos = () => setPipeline((s) => ({ auto: { ...(s.auto || {}), feitos: [] } }))

// opcoes: { cidade, nichos, porNicho, estudo, abelha }
// ui: { log(level, msg), etapa({ nicho, comercio, passo }), parar() → bool, gravar(html, siteId) → Blob | null }
export async function rodarAutomatico(opcoes, ui) {
  const { log, etapa, parar } = ui
  const onLog = (l) => log(l.level, l.msg)
  const { cidade, nichos, porNicho, estudo, abelha } = opcoes
  const resumo = { prontos: 0, pulados: 0, erros: 0 }

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
        await fazerCliente(lead, { nicho, estudo, abelha }, ui, onLog)
        feitos++
        resumo.prontos++
      } catch (e) {
        resumo.erros++
        log('error', `${nome}: ${e.message} — seguindo para o próximo`)
      }
    }
    if (!parar()) {
      setPipeline((s) => ({ auto: { ...(s.auto || {}), feitos: [...new Set([...(s.auto?.feitos || []), chave(nicho)])] } }))
      log('ok', `✔ ${nicho}: ${feitos} cliente(s) pronto(s) para aprovar`)
    }
  }
  return resumo
}

const estudados = new Set() // nichos cujo estudo do Gato já foi feito nesta rodada (os próximos reaproveitam)

async function fazerCliente(lead, { nicho, estudo, abelha }, ui, onLog) {
  const { log, etapa, parar, gravar } = ui
  const nome = lead.nome
  const passo = (p) => etapa({ nicho, comercio: nome, passo: p })

  passo('🦁 Leão montando o site com as fotos')
  await gastar(2, log, parar)
  const rl = await runAgent('leao', { lead: lead.id, semDownload: true }, onLog, lerPipeline())
  aplicar(rl)
  const siteId = rl.site.id

  passo('🐈‍⬛ Gato fazendo a prévia')
  const nichoGato = chave(lead.categoria || nicho)
  if (!estudados.has(nichoGato)) await gastar(9, log, parar)
  const rg = await runAgent('gato', { site: siteId, estudo, reaproveitar: true }, onLog, lerPipeline())
  estudados.add(nichoGato)
  aplicar(rg)
  const pv = rg.preview
  await gerarZipFinal(pv, pv.dados.tema, pv.dados.conteudo, pv.modeloInicial || undefined, true, { hero: 'agua', galeria: 'uniforme' }, { baixarZip: false })
  marcarSite(siteId, { status: 'revisar', tema: pv.dados.tema, auto: true })

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

  passo('🎬 Gravando o vídeo da prévia')
  try {
    const pacote = await lerPacoteLeao(await lerZip(`${siteId}:final`))
    const html = htmlDaPrevia(pacote.dados, await fotosEmDataUrl(pacote.fotos))
    const video = await gravar(html, siteId)
    if (video) {
      await guardarVideo(siteId, video)
      log('ok', `🎬 Vídeo gravado (${(video.size / 1024 / 1024).toFixed(1)} MB)`)
    } else log('warn', '🎬 Sem vídeo (gravação não autorizada) — dá para gravar depois no Gato')
  } catch (e) {
    log('warn', `🎬 Vídeo: ${e.message}`)
  }

  passo('🐯 Tigre escrevendo a mensagem')
  const p = lerPipeline()
  const site = p.sites.find((x) => x.id === siteId)
  const msg = await rascunho('primeiro', negocioDoSite(site, p.leads))
  setPipeline((s) => ({ conversas: { ...s.conversas, [siteId]: { status: 'novo', mensagens: [], rascunho: msg.texto, auto: true } } }))
  log('ok', `✅ ${nome}: site, vídeo e mensagem prontos — aguardando sua aprovação no 🐯 Tigre`)
}

export const pararEstudo = encerrarEstudo
