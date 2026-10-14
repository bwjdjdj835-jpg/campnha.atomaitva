import { useEffect, useRef } from 'react'
import { Terminal } from 'lucide-react'

const colors = { info: 'text-slate-300', ok: 'text-emerald-400', warn: 'text-amber-300', error: 'text-rose-400' }
const tags = { info: 'INFO', ok: ' OK ', warn: 'WAIT', error: 'ERRO' }

export default function LogConsole({ logs, running }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
  }, [logs.length])

  return (
    <div className="glass overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 text-xs text-slate-400">
        <Terminal size={14} className="text-neon" /> Logs do agente
        {running && <span className="ml-auto flex items-center gap-1.5 text-neon"><span className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse" /> rodando</span>}
      </div>
      <div ref={ref} className="h-64 overflow-y-auto scrollbar-thin p-4 font-mono text-[13px] leading-relaxed bg-abyss-950/60">
        {logs.length === 0 ? (
          <div className="text-slate-600">Aguardando execução…</div>
        ) : (
          logs.map((l, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-slate-600 tabular-nums">{l.at.toLocaleTimeString('pt-BR')}</span>
              <span className={`${colors[l.level]} opacity-80`}>[{tags[l.level]}]</span>
              <span className={colors[l.level]}>{l.msg}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
