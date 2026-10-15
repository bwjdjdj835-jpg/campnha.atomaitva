import { useState } from 'react'
import { Brain, ChevronDown } from 'lucide-react'
import { usePipeline } from '../store/pipeline.js'
import { PERSONALIDADES, pensamentos, memorias } from '../lib/mentes.js'

const quando = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

// 🧠 Mente do agente: personalidade, o que ele pensa (dos dados reais) e o que ele lembra de ter feito.
export default function MenteAgente({ agente }) {
  const estado = usePipeline()
  const [aberta, setAberta] = useState(false)
  const p = PERSONALIDADES[agente]
  if (!p) return null
  const ideias = pensamentos(agente, estado)
  const lembrancas = memorias(agente, estado)
  return (
    <section className="glass overflow-hidden">
      <button className="flex w-full items-center gap-3 px-5 py-3 text-left" onClick={() => setAberta(!aberta)}>
        <Brain size={18} className="text-neon" />
        <span className="font-display font-semibold text-white">Mente do {p.nome}</span>
        <span className="min-w-0 flex-1 truncate text-xs text-slate-400">{ideias[0]}</span>
        <ChevronDown size={16} className={`text-slate-400 transition ${aberta ? 'rotate-180' : ''}`} />
      </button>
      {aberta && (
        <div className="grid gap-4 border-t border-white/5 px-5 py-4 md:grid-cols-3">
          <div>
            <div className="label">Personalidade</div>
            <p className="text-sm text-slate-200">
              {p.emoji} {p.personalidade}
            </p>
            <p className="mt-1 text-xs italic text-slate-400">{p.lema}</p>
          </div>
          <div>
            <div className="label">O que eu penso</div>
            <ul className="space-y-1 text-sm text-slate-200">
              {ideias.map((t, i) => (
                <li key={i}>💭 {t}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="label">O que eu lembro ({lembrancas.length})</div>
            {lembrancas.length === 0 ? (
              <p className="text-sm text-slate-500">Nada ainda.</p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto pr-1 text-xs text-slate-300">
                {lembrancas.slice(0, 20).map((m, i) => (
                  <li key={i}>
                    <span className="text-slate-500">{quando(m.at)}</span> · {m.texto}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
