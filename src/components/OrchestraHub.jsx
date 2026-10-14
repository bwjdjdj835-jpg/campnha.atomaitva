import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BrainCircuit } from 'lucide-react'
import { agents } from '../data/agents.js'
import AgentBadge from './AgentBadge.jsx'

// Rede em forma de pentágono, inspirada na capa do PDF: 5 agentes ao redor do núcleo.
const SIZE = 400
const C = SIZE / 2
const R = 150

const nodes = agents.map((a, i) => {
  const ang = (-90 + i * 72) * (Math.PI / 180)
  return { agent: a, x: C + R * Math.cos(ang), y: C + R * Math.sin(ang) }
})

export default function OrchestraHub() {
  return (
    <div className="relative mx-auto w-full max-w-[400px] aspect-square">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity=".35" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r={R + 40} fill="none" stroke="rgba(34,211,238,.12)" />
        <circle cx={C} cy={C} r={R - 70} fill="none" stroke="rgba(34,211,238,.18)" strokeDasharray="2 6" />
        <circle cx={C} cy={C} r={90} fill="url(#core)" />
        {/* anel externo */}
        {nodes.map((n, i) => {
          const m = nodes[(i + 1) % nodes.length]
          return (
            <line key={`r${i}`} x1={n.x} y1={n.y} x2={m.x} y2={m.y}
              stroke="#22d3ee" strokeOpacity=".55" strokeWidth="1.5"
              strokeDasharray="4 6" className="animate-flow" />
          )
        })}
        {/* raios para o núcleo */}
        {nodes.map((n, i) => (
          <g key={`s${i}`}>
            <line x1={C} y1={C} x2={n.x} y2={n.y} stroke="#22d3ee" strokeOpacity=".35" strokeWidth="1" />
            <circle cx={(C + n.x) / 2} cy={(C + n.y) / 2} r="3" fill="#22d3ee" />
          </g>
        ))}
      </svg>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center w-20 h-20 rounded-full bg-abyss-800 border-2 border-neon/80 shadow-glow-lg">
        <BrainCircuit className="text-neon" size={36} />
      </div>

      {nodes.map((n, i) => (
        <motion.div
          key={n.agent.id}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 180 }}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(n.x / SIZE) * 100}%`, top: `${(n.y / SIZE) * 100}%` }}
        >
          <Link to={`/agente/${n.agent.id}`} className="group block" title={n.agent.name}>
            <div className="transition group-hover:scale-110">
              <AgentBadge agent={n.agent} size={68} />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
