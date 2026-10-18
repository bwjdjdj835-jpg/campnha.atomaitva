import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Bot, Loader2 } from 'lucide-react'
import { agents } from '../data/agents.js'
import { equipe } from '../data/equipe.js'
import OrchestraHub from '../components/OrchestraHub.jsx'
import AgentBadge from '../components/AgentBadge.jsx'
import { usePipeline } from '../store/pipeline.js'
import WaterRipple from '../components/WaterRipple.jsx'

const opcoesAuto = () => {
  try {
    return JSON.parse(localStorage.getItem('central-agentes:automatico') || '{}')
  } catch {
    return {}
  }
}

let automatico
const carregarAutomatico = () => (automatico ||= import('../services/automatico.js'))

export default function Dashboard() {
  const { leads, sites } = usePipeline()
  const navigate = useNavigate()
  const [iniciando, setIniciando] = useState(false)
  const [videoServidor, setVideoServidor] = useState(false)
  useEffect(() => {
    // O automático (Leão, Gato, ZIP…) baixa depois que a tela aparece — no clique já está pronto e o navegador
    // ainda aceita pedir a gravação da aba.
    carregarAutomatico()
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => setVideoServidor(Boolean(d.keys?.videoServidor)))
      .catch(() => {})
  }, [])
  const auto = opcoesAuto()
  const primeiroNicho = (auto.nichos || 'barbearia').split('\n')[0]

  // Pede a gravação da aba aqui mesmo (o navegador só pergunta logo depois de um clique) e abre o automático,
  // que começa sozinho e no fim leva para a Aranha Administradora.
  async function iniciarAutomatico() {
    setIniciando(true)
    const { prepararInicio, videoManualNasOpcoes } = await carregarAutomatico()
    await prepararInicio({ videoServidor, manual: videoManualNasOpcoes() })
    navigate('/automatico?iniciar=1')
  }


  const stats = [
    { label: 'Leads sem site', value: leads.length },
    { label: 'Sites gerados', value: sites.length },
    { label: 'Aguardando aprovação', value: sites.filter((s) => ['preview', 'revisar'].includes(s.status)).length },
    { label: 'Vendas fechadas', value: sites.filter((s) => ['vendido', 'publicado'].includes(s.status)).length },
  ]

  return (
    <div className="space-y-12">
      <section className="relative glass circuit-bg overflow-hidden p-6 sm:p-10">
        <WaterRipple />
        <div className="relative grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 border-l-2 border-neon pl-3 text-xs tracking-[0.3em] text-neon">
              PROJETO
            </div>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold text-white leading-[1.05]">
              Central de agentes para criação de sites
            </h1>
            <p className="mt-4 text-neon-soft text-lg">Um detalhe entra. Um fluxo completo sai.</p>
            <p className="mt-4 text-slate-400 max-w-md">
              Cinco agentes em sequência: acham comércios sem site, constroem, refinam o design,
              auditam o conteúdo e fecham a venda — com sua aprovação em cada etapa crítica.
            </p>
            <button onClick={iniciarAutomatico} disabled={iniciando} className="btn-primary mt-8 w-full sm:w-auto text-base py-4 px-6">
              {iniciando ? <Loader2 size={20} className="animate-spin" /> : <Bot size={20} />} Iniciar inteligência artificial automática
            </button>
            <p className="mt-2 text-xs text-slate-400">
              Roda os 5 agentes sozinhos em {auto.cidade || 'Cacoal - RO'}, começando em {primeiroNicho}, e no fim abre a 🛡️ Aranha Administradora
              com o vídeo e a mensagem de cada cliente. Nada é enviado sem você.{' '}
              <Link to="/automatico" className="text-neon hover:underline">Ajustar cidade e nichos</Link>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/agente/pinguim" className="btn-ghost border border-white/10">
                <Play size={18} /> Fazer passo a passo
              </Link>
              <Link to="/projeto" className="btn-ghost border border-white/10">
                Ver ferramentas do projeto
              </Link>
            </div>
          </motion.div>
          <OrchestraHub />
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass p-5">
            <div className="font-display text-3xl font-bold text-white tabular-nums">{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-slate-400">{s.label}</div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-white mb-1">O fluxo da orquestra</h2>
        <p className="text-slate-400 mb-6">Cada agente entrega para o próximo.</p>
        <ol className="grid grid-cols-1 gap-4">
          {equipe.map((a, i) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={a.link}
                className="group glass flex items-center gap-5 p-5 hover:border-neon/40 hover:shadow-glow transition"
              >
                <span className="hidden sm:block font-mono text-sm text-slate-500 w-6">0{a.ordem}</span>
                <AgentBadge agent={a} size={56} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <h3 className="font-display text-lg font-semibold text-white">{a.name}</h3>
                    <span className="text-xs uppercase tracking-wider" style={{ color: a.accent }}>
                      {a.role}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 truncate">{a.tagline}</p>
                </div>
                <ArrowRight className="text-slate-500 group-hover:text-neon group-hover:translate-x-1 transition" />
              </Link>
            </motion.li>
          ))}
        </ol>
      </section>
    </div>
  )
}
