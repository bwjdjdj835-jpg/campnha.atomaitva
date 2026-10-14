import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Pencil, Trash2, Bot } from 'lucide-react'
import { usePipeline, setPipeline } from '../store/pipeline.js'
import { videoDoSite, negocioDoSite } from '../services/agents.js'

const marcarSite = (id, campos) => setPipeline((s) => ({ sites: s.sites.map((x) => (x.id === id ? { ...x, ...campos } : x)) }))

// Clientes que o modo automático deixou prontos: você confere o vídeo da prévia e a mensagem e aprova um por um.
// Aprovar abre a conversa do Tigre logo abaixo (mensagem + vídeo) para você mandar pelo seu WhatsApp.
export default function FilaAprovacao({ onAbrir }) {
  const { sites, leads, conversas } = usePipeline()
  const fila = sites.filter((s) => s.status === 'revisar')
  if (!fila.length) return null
  return (
    <section className="glass overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
        <Bot size={18} className="text-neon" />
        <h3 className="font-display font-semibold text-white">Aguardando sua aprovação</h3>
        <span className="ml-auto text-xs text-slate-400">{fila.length} cliente(s) do modo automático</span>
      </div>
      <ul>
        {fila.map((s) => (
          <ItemFila key={s.id} site={s} negocio={negocioDoSite(s, leads)} texto={conversas?.[s.id]?.rascunho} onAbrir={onAbrir} />
        ))}
      </ul>
    </section>
  )
}

function ItemFila({ site, negocio, texto, onAbrir }) {
  const [video, setVideo] = useState(null)
  useEffect(() => {
    let url = null
    videoDoSite(site.id).then((blob) => blob && setVideo((url = URL.createObjectURL(blob))))
    return () => url && URL.revokeObjectURL(url)
  }, [site.id])

  function aprovar() {
    marcarSite(site.id, { status: 'aprovado', aprovadoEm: new Date().toISOString() })
    onAbrir(site.id)
  }

  return (
    <li className="flex flex-col sm:flex-row gap-4 border-t border-white/5 first:border-t-0 px-5 py-4">
      {video ? (
        <video src={video} controls playsInline className="w-full sm:w-36 rounded-xl border border-white/10 bg-black" />
      ) : (
        <div className="grid w-full sm:w-36 h-40 place-items-center rounded-xl border border-dashed border-white/10 text-xs text-slate-500 text-center px-2">
          Sem vídeo — grave no Gato
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-2">
        <div className="text-white font-medium">{site.nome}</div>
        <div className="text-xs font-mono text-slate-400">{negocio.telefone || 'sem telefone'}</div>
        <p className="rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200 whitespace-pre-wrap">{texto || 'Mensagem ainda não escrita.'}</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary !py-2 !px-4 text-sm" onClick={aprovar}>
            <CheckCircle2 size={16} /> Aprovar prévia e mensagem
          </button>
          <Link to={`/agente/gato?site=${site.id}`} className="btn-ghost border border-white/10 text-sm">
            <Pencil size={14} /> Ajustar no Gato
          </Link>
          <button className="btn-ghost text-sm text-rose-300 hover:bg-rose-400/10" onClick={() => marcarSite(site.id, { status: 'descartado' })}>
            <Trash2 size={14} /> Descartar
          </button>
        </div>
      </div>
    </li>
  )
}
