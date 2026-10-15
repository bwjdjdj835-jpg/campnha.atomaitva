import { Suspense, lazy, useEffect, useState } from 'react'
import { useParams, useSearchParams, Navigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Rocket, Loader2, Upload, ArrowRight, CheckCircle2, Wrench, PackageCheck } from 'lucide-react'
import { agents, getAgent } from '../data/agents.js'
import AgentBadge from '../components/AgentBadge.jsx'
import LogConsole from '../components/LogConsole.jsx'
import LeadsTable, { JaTemSite } from '../components/LeadsTable.jsx'
import { runAgent, listarPastas, encerrarEstudo } from '../services/agents.js'
import { usePipeline, setPipeline } from '../store/pipeline.js'
import { SELO_CONTATO, contatoDoLead, rotuloContato } from '../lib/contato.js'
const GatoPreview = lazy(() => import('../components/GatoPreview.jsx'))
const PreviaLeao = lazy(() => import('../components/PreviaLeao.jsx'))
const BibliotecaGato = lazy(() => import('../components/BibliotecaGato.jsx'))
import TigrePainel from '../components/TigrePainel.jsx'
import AbelhaPainel from '../components/AbelhaPainel.jsx'
import FilaAprovacao from '../components/FilaAprovacao.jsx'
import TigreArquivo from '../components/TigreArquivo.jsx'
import MenteAgente from '../components/MenteAgente.jsx'

// Cada agente começa com a página zerada (sem logs nem prévias do agente anterior).
export default function AgentPageRota() {
  const { id } = useParams()
  return <AgentPage key={id} />
}

function AgentPage() {
  const { id } = useParams()
  const agent = getAgent(id)
  const pipeline = usePipeline()
  const { leads, sites, conversas } = pipeline
  const keys = useApiStatus()
  const [busca] = useSearchParams()
  // "Mandar pro Leão" abre esta página com ?link=… já preenchido (e o Leão manda pro Gato com ?site=…).
  const [values, setValues] = useState(() => ({
    ...lembrados(agent),
    ...(busca.get('link') ? { link: busca.get('link') } : busca.get('site') ? { site: busca.get('site') } : {}),
  }))
  const pastas = usePastas(id === 'gato')
  const pastasSoOnline = pastas.filter((p) => !sites.some((x) => x.pasta === p.url))
  const [previaLeao, setPreviaLeao] = useState(null)
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)
  const [preview, setPreview] = useState(null)
  const [tigre, setTigre] = useState(() => (id === 'tigre' && busca.get('cliente') ? { siteId: busca.get('cliente') } : null))
  const [abelha, setAbelha] = useState(null)

  if (!agent) return <Navigate to="/" replace />
  const next = agents.find((a) => a.order === agent.order + 1)

  async function start() {
    setRunning(true)
    setLogs([])
    setPreview(null)
    setTigre(null)
    setAbelha(null)
    setPreviaLeao(null)
    lembrar(agent, values)
    try {
      const res = await runAgent(agent.id, values, (l) => setLogs((p) => [...p, l]), { leads, sites, conversas })
      if (res.leads) {
        setPipeline((s) => {
          const novos = new Set(res.leads.map((l) => l.id))
          return { leads: [...res.leads, ...s.leads.filter((l) => !novos.has(l.id))] }
        })
      }
      if (res.comSite) {
        setPipeline((s) => {
          const novos = new Set(res.comSite.map((c) => c.id))
          return { comSite: [...res.comSite, ...(s.comSite || []).filter((c) => !novos.has(c.id))] }
        })
      }
      if (res.site) setPipeline((s) => ({ sites: [res.site, ...s.sites] }))
      if (res.previa) setPreviaLeao(res.previa)
      if (res.tigre) setTigre(res.tigre)
      if (res.abelha) setAbelha(res.abelha)
      if (res.preview) {
        setPreview(res.preview)
        const id = res.preview.siteId
        if (id) setPipeline((s) => ({ sites: s.sites.map((x) => (x.id === id ? { ...x, status: 'preview' } : x)) }))
      }
    } catch (e) {
      setLogs((p) => [...p, { level: 'error', msg: e.message, at: new Date() }])
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative glass circuit-bg overflow-hidden p-6 sm:p-10 text-center"
      >
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: agent.accent }}
        />
        <div className="relative flex flex-col items-center">
          <AgentBadge agent={agent} size={112} pulse={running} />
          <div className="mt-6 text-xs font-mono tracking-[0.3em] text-neon">
            AGENTE 0{agent.order} · {agent.role.toUpperCase()}
          </div>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl font-bold text-white max-w-2xl">{agent.title}</h1>
          <p className="mt-3 text-slate-400 max-w-xl">{agent.tagline}</p>
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Entrada + ação */}
        <section className="lg:col-span-3 glass p-6 space-y-5">
          {agent.inputs.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              {f.select === 'aprovados' ? (
                sites.some((x) => ['aprovado', 'vendido', 'publicado'].includes(x.status)) ? (
                  <select className="input" value={values[f.key] || ''}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}>
                    <option value="">{f.placeholder}</option>
                    {sites.filter((x) => ['aprovado', 'vendido', 'publicado'].includes(x.status)).map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.demo ? '[DEMO] ' : ''}{x.nome}{SELO_CONTATO[conversas?.[x.id]?.status] ? ` — ${SELO_CONTATO[conversas[x.id].status].texto}` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Link to="/agente/gato" className="block rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400 hover:border-neon/50 hover:text-white transition">
                    Nenhuma prévia aprovada ainda — aprove um site no 🐈‍⬛ Gato Negro
                  </Link>
                )
              ) : f.select === 'sites' ? (
                sites.length || pastasSoOnline.length ? (
                  <select className="input" value={values[f.key] || ''}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value, zip: undefined })}>
                    <option value="">{f.placeholder}</option>
                    {sites.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.demo ? '[DEMO] ' : ''}{x.pasta ? '☁ ' : ''}{x.nome} — {x.zip}{x.status === 'aprovado' ? ' ✓ aprovado' : ''}
                      </option>
                    ))}
                    {pastasSoOnline.length > 0 && (
                      <optgroup label="Pasta online do Leão (outros aparelhos)">
                        {pastasSoOnline.map((p) => (
                          <option key={p.url} value={`pasta:${p.url}`}>☁ {p.pasta}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                ) : (
                  <Link to="/agente/leao" className="block rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400 hover:border-neon/50 hover:text-white transition">
                    Nenhum site ainda — gere um com o 🦁 Leão (ou envie o ZIP abaixo)
                  </Link>
                )
              ) : f.select === 'leads' ? (
                leads.length ? (
                  <select className="input" value={values[f.key] || ''}
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}>
                    <option value="">{f.placeholder}</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.demo ? '[DEMO] ' : ''}{l.nome} — {l.endereco}{rotuloContato(contatoDoLead(l, pipeline))}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Link to="/agente/pinguim" className="block rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400 hover:border-neon/50 hover:text-white transition">
                    Nenhum lead ainda — rode o 🐧 Pinguim primeiro
                  </Link>
                )
              ) : f.file ? (
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/10 hover:border-neon/50 py-10 cursor-pointer transition text-slate-400">
                  <Upload className="text-neon" />
                  <span className="text-sm">{values[f.key]?.name || f.placeholder}</span>
                  <input type="file" accept=".zip" className="hidden"
                    onChange={(e) => setValues({ ...values, [f.key]: e.target.files[0], site: undefined })} />
                </label>
              ) : f.opcoes ? (
                <select className="input" value={values[f.key] ?? f.opcoes[0].valor}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}>
                  {f.opcoes.map((o) => (
                    <option key={o.valor} value={o.valor}>{o.texto}</option>
                  ))}
                </select>
              ) : f.textarea ? (
                <textarea rows={5} className="input font-mono" placeholder={f.placeholder}
                  value={values[f.key] || ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              ) : (
                <input className="input" placeholder={f.placeholder}
                  value={values[f.key] || ''} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} />
              )}
            </div>
          ))}
          <button onClick={start} disabled={running} className="btn-primary w-full text-base py-4">
            {running ? <Loader2 className="animate-spin" size={20} /> : <Rocket size={20} />}
            {running ? 'Trabalhando…' : agent.cta}
          </button>
          {running && agent.id === 'gato' && values.estudo !== '0' && (
            <button onClick={encerrarEstudo} className="btn-ghost w-full border border-white/10 text-sm">
              Encerrar estudo e gerar agora
            </button>
          )}
          <p className="text-xs text-slate-500 text-center">
            {!agent.live
              ? 'Modo demonstração: os logs e resultados deste agente ainda são simulados.'
              : keys === undefined
                ? 'Verificando backend…'
                : keys === null
                ? import.meta.env.VITE_HASH_ROUTER
                  ? 'Versão online de demonstração: sem servidor, os resultados são DEMO.'
                  : 'Backend não encontrado — rode "npm run dev" para usar as APIs reais.'
                : agent.id === 'abelha'
                  ? `Conectado · busca na web ${keys.firecrawl ? '✓' : '✗ (só auditoria)'} · Claude ${keys.claude ? '✓' : '✗ (só horário por padrão de texto)'}`
                  : agent.id === 'tigre'
                  ? `Conectado · IA ${keys.groq ? 'Groq ✓' : keys.claude ? 'Claude ✓' : '✗ (usa modelos de texto)'} · WhatsApp ${keys.whatsappProvedor === 'zapi' ? 'Z-API ✓' : keys.whatsapp ? 'Meta ✓' : '✗ (envio pelo seu WhatsApp)'} · Vercel ${keys.vercel ? '✓' : '✗'}`
                  : agent.id === 'gato'
                  ? `Conectado · Firecrawl ${keys.firecrawl ? '✓ (pesquisa sites profissionais)' : '✗ (sem pesquisa de referências — usa os padrões base)'} · pasta online ${keys.pasta ? '✓' : '✗'}`
                  : agent.id === 'leao'
                  ? `Conectado · fotos do Google ${keys.googlePlaces ? '✓' : '✗'} · prints ${keys.firecrawl ? '✓' : '✗ (precisa do Firecrawl)'} · pasta online ${keys.pasta ? '✓' : '✗ (conecte um Blob Store no Vercel)'}`
                  : `Conectado · fonte: ${keys.apify ? 'Google Maps (via Apify)' : keys.serpapi ? 'Google Maps (via SerpApi)' : keys.firecrawl ? 'Google Maps (via Firecrawl)' : keys.googlePlaces ? 'Google Places' : 'OpenStreetMap (grátis)'} · confirmação de domínio ${keys.firecrawl ? '✓' : '✗'}${keys.creditos ? ` · Firecrawl: ${keys.creditos.restantes > 0 ? `${keys.creditos.restantes} créditos` : '❌ SEM CRÉDITOS'}` : ''}`}
          </p>
        </section>

        {/* Ficha técnica */}
        <aside className="lg:col-span-2 space-y-4">
          <div className="glass p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3"><CheckCircle2 size={16} className="text-neon" /> Etapas</h3>
            <ol className="space-y-2.5">
              {agent.steps.map((s, i) => (
                <li key={s} className="flex gap-3 text-sm text-slate-300">
                  <span className="grid place-items-center w-5 h-5 shrink-0 rounded-full bg-neon/10 text-neon text-[11px] font-mono">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <div className="glass p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3"><Wrench size={16} className="text-neon" /> Ferramentas</h3>
            <div className="flex flex-wrap gap-2">
              {agent.tools.map((t) => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full border border-white/10 text-slate-300">{t}</span>
              ))}
            </div>
          </div>
          <div className="glass p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-2"><PackageCheck size={16} className="text-neon" /> Entrega</h3>
            <p className="text-sm text-slate-400">{agent.output}</p>
          </div>
        </aside>
      </div>

      {agent.id === 'gato' && (
        <Suspense fallback={null}>
          <BibliotecaGato />
        </Suspense>
      )}

      {agent.id === 'gato' && !preview && (
        <section className="glass flex items-center gap-3 border-amber-400/20 px-5 py-4 text-sm text-slate-300">
          <span className="text-2xl">🦫</span>
          <p>
            <strong className="text-white">Castor:</strong> escolha um site acima e clique em "{agent.cta}". Assim que o Gato abrir o site, o Castor
            mostra aqui os 3 modelos (designs criados pela Groq) para você escolher.
          </p>
        </section>
      )}

      <MenteAgente agente={agent.id} />

      <LogConsole logs={logs} running={running} />

      {abelha && <AbelhaPainel key={abelha.dados.geradoEm + abelha.siteId} resultado={abelha} />}

      {agent.id === 'tigre' && <TigreArquivo />}

      {agent.id === 'tigre' && (
        <FilaAprovacao
          onAbrir={(siteId) => {
            setTigre({ siteId })
            setTimeout(() => document.getElementById('tigre-painel')?.scrollIntoView({ behavior: 'smooth' }), 100)
          }}
        />
      )}

      {tigre && <TigrePainel key={tigre.siteId} siteId={tigre.siteId} rascunhoInicial={tigre.rascunho} keys={keys} />}

      {previaLeao && (
        <Suspense fallback={<div className="glass p-10 grid place-items-center"><Loader2 className="animate-spin text-neon" /></div>}>
          <PreviaLeao key={previaLeao.siteId} previa={previaLeao} />
        </Suspense>
      )}

      {preview && (
        <Suspense fallback={<div className="glass p-10 grid place-items-center"><Loader2 className="animate-spin text-neon" /></div>}>
          <GatoPreview key={preview.dados.geradoEm + preview.siteId} preview={preview} onMudar={setPreview} />
        </Suspense>
      )}

      {agent.id === 'pinguim' && <LeadsTable leads={leads} />}
      {agent.id === 'pinguim' && <JaTemSite />}
      {agent.id === 'leao' && <SitesList />}

      {next && (
        <Link to={`/agente/${next.id}`} className="group glass flex items-center gap-4 p-5 hover:border-neon/40 hover:shadow-glow transition">
          <span className="text-sm text-slate-400">Próximo na orquestra</span>
          <AgentBadge agent={next} size={40} />
          <span className="font-display font-semibold text-white">{next.name}</span>
          <ArrowRight className="ml-auto text-slate-500 group-hover:text-neon group-hover:translate-x-1 transition" />
        </Link>
      )}
    </div>
  )
}

// Campos marcados com `lembrar` (ex.: sites modelo do Gato) ficam guardados neste navegador.
const chaveLembrar = (agent) => `central-agentes:campos:${agent?.id}`
function lembrados(agent) {
  try {
    return JSON.parse(localStorage.getItem(chaveLembrar(agent)) || '{}')
  } catch {
    return {}
  }
}
function lembrar(agent, values) {
  const campos = agent.inputs.filter((f) => f.lembrar).map((f) => f.key)
  if (!campos.length) return
  try {
    localStorage.setItem(chaveLembrar(agent), JSON.stringify(Object.fromEntries(campos.map((k) => [k, values[k] || '']))))
  } catch {
    /* sem storage: só não lembra */
  }
}

// Pastas online do Leão (Vercel Blob) — o Gato abre sites criados em outros aparelhos.
function usePastas(ativo) {
  const [pastas, setPastas] = useState([])
  useEffect(() => {
    if (ativo) listarPastas().then(setPastas)
  }, [ativo])
  return pastas
}

// Quais chaves o backend tem (null = backend fora do ar).
function useApiStatus() {
  const [keys, setKeys] = useState(undefined)
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => setKeys({ ...d.keys, creditos: d.firecrawlCreditos }))
      .catch(() => setKeys(null))
  }, [])
  return keys
}

function SitesList() {
  const { sites, conversas = {} } = usePipeline()
  if (!sites.length) return null
  return (
    <div className="glass overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-display font-semibold text-white">Sites gerados</h3>
        <span className="text-xs text-slate-400">{sites.length} site(s)</span>
      </div>
      <ul>
        {sites.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-5 py-3 border-t border-white/5 first:border-t-0 text-sm">
            <span className="text-white font-medium">{s.nome}</span>
            {s.demo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300">DEMO</span>}
            {(() => {
              const selo = SELO_CONTATO[conversas[s.id]?.status] || SELO_CONTATO.site_feito
              return <span className={`text-xs px-2 py-0.5 rounded-full ${selo.cor}`}>{selo.texto}</span>
            })()}
            <span className="ml-auto font-mono text-xs text-slate-400 truncate">{s.zip}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
