import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Bot, Loader2, Play, Square, Video, RotateCcw, ArrowRight } from 'lucide-react'
import LogConsole from '../components/LogConsole.jsx'
import { usePipeline } from '../store/pipeline.js'
import { SELO_CONTATO } from '../lib/contato.js'
import { NICHOS_PADRAO, rodarAutomatico, nichosFeitos, recomecarNichos, pararEstudo, pegarFluxo } from '../services/automatico.js'
import { gravarVideoPrevia } from '../services/agents.js'
import { pedirGravacaoDaAba, gravarComFluxo, SANDBOX_PREVIA } from '../lib/previa.jsx'

const CHAVE = 'central-agentes:automatico'
export const lerOpcoes = () => {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) || '{}')
  } catch {
    return {}
  }
}

export default function Automatico() {
  const salvo = lerOpcoes()
  const [cidade, setCidade] = useState(salvo.cidade || 'Cacoal - RO')
  const [nichos, setNichos] = useState(salvo.nichos || NICHOS_PADRAO.join('\n'))
  const [porNicho, setPorNicho] = useState(salvo.porNicho || '5')
  // v3: rápido por padrão — Gato estuda 1 minuto só no 1º site de cada nicho (os outros reaproveitam), sem Abelha.
  const [estudo, setEstudo] = useState(salvo.v === 3 ? salvo.estudo : '1')
  const [abelha, setAbelha] = useState(salvo.v === 3 ? Boolean(salvo.abelha) : false)
  const [comVideo, setComVideo] = useState(salvo.comVideo !== false)
  const [rodando, setRodando] = useState(false)
  const [logs, setLogs] = useState([])
  const [etapa, setEtapa] = useState(null)
  const [estudio, setEstudio] = useState(null) // HTML da prévia sendo gravada
  const [resumo, setResumo] = useState(null)
  const pararRef = useRef(false)
  const fluxo = useRef(null)
  const quadro = useRef(null)
  const carregou = useRef(null)
  const keys = useStatus()
  const navigate = useNavigate()
  const [busca, setBusca] = useSearchParams()
  const { sites, conversas } = usePipeline()
  const feitos = nichosFeitos()

  const log = (level, msg) => setLogs((p) => [...p.slice(-400), { level, msg, at: new Date() }])

  // Saiu da página no meio: para depois do passo atual (a gravação precisa desta página aberta).
  useEffect(
    () => () => {
      pararRef.current = true
      pararEstudo()
      fluxo.current?.getTracks().forEach((t) => t.stop())
    },
    [],
  )
  useEffect(() => {
    if (!rodando) return
    const aviso = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    addEventListener('beforeunload', aviso)
    // Deixa a tela do notebook acesa enquanto roda.
    let trava = null
    navigator.wakeLock?.request('screen').then((t) => (trava = t)).catch(() => {})
    return () => {
      removeEventListener('beforeunload', aviso)
      trava?.release().catch(() => {})
    }
  }, [rodando])

  // Grava a prévia: no computador com o servidor local, o servidor grava sozinho; no Vercel, grava esta aba
  // com a autorização dada no começo (o quadro fica fixo no canto da tela durante a gravação).
  async function gravar(html, siteId) {
    if (keys?.videoServidor) {
      try {
        return await gravarVideoPrevia(html, siteId)
      } catch (e) {
        log('warn', `🎬 Servidor não gravou (${e.message}) — tentando aqui no navegador`)
      }
    }
    const f = fluxo.current
    if (!f || f.getVideoTracks()[0]?.readyState !== 'live') return null
    // O quadro fica montado a rodada inteira (o recorte da gravação fica preso a ele); só troca a página dentro.
    const pronto = new Promise((r) => (carregou.current = r))
    setEstudio(html)
    await Promise.race([pronto, new Promise((r) => setTimeout(r, 8000))])
    await new Promise((r) => setTimeout(r, 1200)) // fotos e capa aparecerem
    return gravarComFluxo(f, quadro.current, 9000)
  }

  // Veio do botão "Iniciar inteligência artificial automática" da tela inicial: começa sozinho.
  useEffect(() => {
    if (keys === undefined || busca.get('iniciar') !== '1') return
    setBusca({}, { replace: true })
    comecar(pegarFluxo())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys])

  function ligarFluxo(f) {
    fluxo.current = f
    f.getVideoTracks()[0].addEventListener('ended', () => {
      fluxo.current = null
      log('warn', '🎬 Você parou de compartilhar a aba — os próximos clientes ficam sem vídeo')
    })
    log('ok', '🎬 Gravação autorizada — vale para todos os vídeos desta rodada')
  }

  // fluxoPronto: autorização já dada na tela inicial (undefined = pedir agora; null = ficou sem vídeo).
  async function comecar(fluxoPronto) {
    const lista = nichos.split('\n').map((n) => n.trim()).filter(Boolean)
    if (!cidade.trim() || !lista.length) return
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ v: 3, cidade, nichos, porNicho, estudo, abelha, comVideo }))
    } catch {
      /* sem storage */
    }
    setLogs([])
    setResumo(null)
    pararRef.current = false
    // A autorização para gravar precisa vir logo depois do clique: pede uma vez, vale para a rodada inteira.
    if (fluxoPronto) ligarFluxo(fluxoPronto)
    else if (fluxoPronto === null) log('warn', '🎬 Gravação não autorizada — seguindo sem vídeo (dá para gravar depois no Gato)')
    else if (comVideo && !keys?.videoServidor) {
      try {
        ligarFluxo(await pedirGravacaoDaAba())
      } catch (e) {
        log('warn', `🎬 ${e.message} Seguindo sem vídeo.`)
      }
    }
    setRodando(true)
    try {
      const r = await rodarAutomatico(
        { cidade: cidade.trim(), nichos: lista, porNicho: porNicho === 'todos' ? Infinity : Number(porNicho), estudo, abelha },
        { log, etapa: setEtapa, parar: () => pararRef.current, gravar },
      )
      setResumo(r)
      log(pararRef.current ? 'warn' : 'ok', `${pararRef.current ? 'Parado' : 'Rodada concluída'}: ${r.prontos} cliente(s) pronto(s) para aprovar · ${r.pulados} pulado(s) · ${r.erros} com erro`)
      // Terminou o nicho: vai para a Área do Administrador. O próximo nicho só começa quando você aprovar lá.
      if (!pararRef.current && r.prontos > 0) {
        log('ok', `Nicho "${r.nicho}" pronto. Aprove os clientes na Área do Administrador${r.proximo ? ` — depois é só clicar em começar "${r.proximo}"` : ''}.`)
        setTimeout(() => navigate('/admin'), 2000)
      }
    } catch (e) {
      log('error', e.message)
    } finally {
      fluxo.current?.getTracks().forEach((t) => t.stop())
      fluxo.current = null
      setEstudio(null)
      setEtapa(null)
      setRodando(false)
    }
  }

  function parar() {
    pararRef.current = true
    pararEstudo()
    log('warn', 'Parando depois do passo atual…')
  }

  // Placar dos clientes (pela conversa do Tigre).
  const aprovar = sites.filter((s) => s.status === 'revisar')
  const porStatus = (st) => sites.filter((s) => conversas?.[s.id]?.status === st)
  const placar = [
    ['interessado', porStatus('interessado')],
    ['contatado', porStatus('contatado')],
    ['duvida', porStatus('duvida')],
    ['bot', porStatus('bot')],
    ['recusou', porStatus('recusou')],
    ['nao_contatar', porStatus('nao_contatar')],
    ['vendido', porStatus('vendido')],
    ['publicado', porStatus('publicado')],
  ].filter(([, l]) => l.length)

  return (
    <div className="space-y-6">
      <section className="glass circuit-bg p-6 sm:p-10 text-center">
        <Bot size={56} className="mx-auto text-neon" />
        <div className="mt-4 text-xs font-mono tracking-[0.3em] text-neon">MODO AUTOMÁTICO</div>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-white">Os 5 agentes trabalhando sozinhos</h1>
        <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
          Nicho por nicho: o 🐧 Pinguim acha os comércios sem site, o 🦁 Leão monta, o 🐈‍⬛ Gato faz a prévia, a 🐝 Abelha
          completa, o vídeo é gravado e o 🐯 Tigre escreve a mensagem. <strong className="text-white">Nada é enviado</strong> — no
          fim você aprova cada cliente na Área do Administrador e manda pelo seu WhatsApp.
        </p>
      </section>

      <div className="grid lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 glass p-6 space-y-4">
          <div>
            <label className="label" htmlFor="auto-cidade">Cidade</label>
            <input id="auto-cidade" className="input" value={cidade} onChange={(e) => setCidade(e.target.value)} disabled={rodando} />
          </div>
          <div>
            <label className="label" htmlFor="auto-nichos">Nichos, na ordem (um por linha)</label>
            <textarea id="auto-nichos" rows={7} className="input font-mono" value={nichos} onChange={(e) => setNichos(e.target.value)} disabled={rodando} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="auto-por">Clientes por nicho</label>
              <select id="auto-por" className="input" value={porNicho} onChange={(e) => setPorNicho(e.target.value)} disabled={rodando}>
                {['3', '5', '10', 'todos'].map((v) => (
                  <option key={v} value={v}>{v === 'todos' ? 'Todos que acharem' : `Até ${v}`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="auto-estudo">Estudo do Gato (1 vez por nicho)</label>
              <select id="auto-estudo" className="input" value={estudo} onChange={(e) => setEstudo(e.target.value)} disabled={rodando}>
                <option value="1">1 minuto (padrão)</option>
                <option value="0">Estudo rápido (~20 s)</option>
                <option value="nenhum">Sem estudo — o mais rápido</option>
                <option value="3min">3 minutos</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" className="accent-cyan-400 w-4 h-4" checked={abelha} onChange={(e) => setAbelha(e.target.checked)} disabled={rodando} />
            🐝 Abelha completa o site com dados públicos que têm fonte (horário, sobre, serviços) — deixa mais lento
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" className="accent-cyan-400 w-4 h-4" checked={comVideo} onChange={(e) => setComVideo(e.target.checked)} disabled={rodando} />
            🎬 Gravar o vídeo da prévia de cada cliente
          </label>
          {comVideo && keys && !keys.videoServidor && (
            <p className="text-xs text-slate-400">
              Ao começar, o Chrome pergunta se pode <strong className="text-slate-200">compartilhar esta aba</strong>: escolha
              "Esta aba" e clique em Compartilhar. É <strong className="text-slate-200">uma vez só</strong> para todos os vídeos.
              Deixe esta aba aberta e na frente até terminar (o notebook não pode dormir).
            </p>
          )}
          {rodando ? (
            <button onClick={parar} className="btn-ghost w-full border border-rose-400/30 text-rose-300 py-4">
              <Square size={18} /> Parar (termina o passo atual)
            </button>
          ) : (
            <button onClick={() => comecar()} disabled={keys === undefined} className="btn-primary w-full text-base py-4">
              <Play size={20} /> Começar o automático
            </button>
          )}
          {!rodando && feitos.length > 0 && (
            <button onClick={() => recomecarNichos()} className="btn-ghost w-full border border-white/10 text-sm">
              <RotateCcw size={14} /> Recomeçar do 1º nicho ({feitos.length} já feito(s) — hoje continua de onde parou)
            </button>
          )}
          <p className="text-xs text-slate-500 text-center">
            {keys === null
              ? 'Backend não encontrado — o automático precisa do servidor.'
              : keys
                ? `Fonte: ${keys.apify ? 'Apify' : keys.serpapi ? 'SerpApi' : keys.firecrawl ? 'Google Maps via Firecrawl' : keys.googlePlaces ? 'Google Places' : 'OpenStreetMap'} · Firecrawl ${keys.firecrawl ? '✓' : '✗'} · IA ${keys.groq ? 'Groq ✓' : keys.claude ? 'Claude ✓' : '✗ (textos prontos)'} · vídeo ${keys.videoServidor ? 'pelo servidor' : 'pelo navegador'}`
                : 'Verificando backend…'}
          </p>
        </section>

        <aside className="lg:col-span-2 space-y-4">
          <div className="glass p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Agora</h3>
            {etapa ? (
              <div className="space-y-1 text-sm">
                <div className="text-slate-400">Nicho: <span className="text-white">{etapa.nicho}</span></div>
                {etapa.comercio && <div className="text-slate-400">Comércio: <span className="text-white">{etapa.comercio}</span></div>}
                <div className="flex items-center gap-2 text-neon"><Loader2 size={14} className="animate-spin" /> {etapa.passo}</div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">{rodando ? 'Começando…' : 'Parado.'}</p>
            )}
            {resumo && (
              <p className="mt-3 text-sm text-slate-300">
                Última rodada: <strong className="text-emerald-300">{resumo.prontos} pronto(s)</strong> · {resumo.pulados} pulado(s) · {resumo.erros} erro(s)
              </p>
            )}
          </div>
          <div className="glass p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Clientes</h3>
            <Link to="/admin" className="flex items-center gap-2 rounded-xl border border-neon/30 px-3 py-2 text-sm text-neon hover:bg-neon/10">
              🛡️ {aprovar.length} aguardando sua aprovação <ArrowRight size={14} className="ml-auto" />
            </Link>
            {placar.map(([st, lista]) => (
              <details key={st} className="text-sm">
                <summary className="cursor-pointer">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${SELO_CONTATO[st].cor}`}>{SELO_CONTATO[st].texto}</span>
                  <span className="ml-2 text-slate-400">{lista.length}</span>
                </summary>
                <ul className="mt-1 ml-3 text-slate-300">
                  {lista.map((s) => <li key={s.id}>{s.nome}</li>)}
                </ul>
              </details>
            ))}
          </div>
        </aside>
      </div>

      <LogConsole logs={logs} running={rodando} />

      {/* Estúdio: a prévia que está sendo gravada fica fixa no canto (a gravação recorta só este quadro). */}
      {estudio && (
        <div className="fixed bottom-4 right-4 z-50 rounded-2xl border border-neon/40 bg-black shadow-glow overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-neon">
            <Video size={14} className="animate-pulse" /> Estúdio de gravação — não feche esta aba
          </div>
          <iframe
            ref={quadro}
            title="Prévia sendo gravada"
            srcDoc={estudio}
            sandbox={SANDBOX_PREVIA}
            onLoad={() => carregou.current?.()}
            style={{ width: 360, height: 'min(640px, calc(100vh - 80px))', border: 0, display: 'block', background: '#fff' }}
          />
        </div>
      )}
    </div>
  )
}

function useStatus() {
  const [keys, setKeys] = useState(undefined)
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => setKeys(d.keys))
      .catch(() => setKeys(null))
  }, [])
  return keys
}
