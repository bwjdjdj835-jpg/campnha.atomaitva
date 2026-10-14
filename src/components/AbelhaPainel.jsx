import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, AlertTriangle, XCircle, ExternalLink, Download, Loader2, FolderCog } from 'lucide-react'
import { gerarColmeia, SEM_DOWNLOAD } from '../services/agents.js'

const ICONE = {
  ok: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />,
  aviso: <AlertTriangle size={16} className="text-amber-300 shrink-0" />,
  falta: <XCircle size={16} className="text-rose-400 shrink-0" />,
}

const host = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function Fonte({ url }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-neon">
      <ExternalLink size={12} /> {host(url)}
    </a>
  )
}

// Resultado da Abelha: checklist do site + dados encontrados na web (cada um com fonte) para o usuário aprovar.
export default function AbelhaPainel({ resultado }) {
  const { auditoria, campos, fontes, dados } = resultado
  const [aceitos, setAceitos] = useState({
    sobre: Boolean(campos.sobre),
    horarios: Boolean(campos.horarios),
    servicos: campos.servicos.map((s) => s.nome),
  })
  const [gerando, setGerando] = useState(false)
  const [entregue, setEntregue] = useState(null)
  const [erro, setErro] = useState(null)

  const temSugestao = campos.sobre || campos.horarios || campos.servicos.length > 0
  const alternarServico = (nome) =>
    setAceitos((a) => ({
      ...a,
      servicos: a.servicos.includes(nome) ? a.servicos.filter((s) => s !== nome) : [...a.servicos, nome],
    }))

  async function injetar() {
    setGerando(true)
    setErro(null)
    try {
      setEntregue(await gerarColmeia(resultado, aceitos))
    } catch (e) {
      setErro(e.message)
    } finally {
      setGerando(false)
    }
  }

  const areas = [...new Set(auditoria.itens.map((i) => i.area))]

  return (
    <section className="glass overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-white/5">
        <h3 className="font-display font-semibold text-white">🐝 Auditoria — {dados.negocio.nome}</h3>
        {dados.demo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300">DEMO</span>}
        <div className="ml-auto flex items-baseline gap-1">
          <span className="font-display text-3xl font-bold text-amber-300 tabular-nums">{auditoria.nota}</span>
          <span className="text-xs text-slate-400">/100 nota da colmeia</span>
        </div>
      </div>

      <div className="grid gap-6 p-5 lg:grid-cols-2">
        {/* Checklist */}
        <div className="space-y-4 min-w-0">
          {areas.map((area) => (
            <div key={area}>
              <div className="label">{area}</div>
              <ul className="space-y-2">
                {auditoria.itens
                  .filter((i) => i.area === area)
                  .map((i) => (
                    <li key={i.id} className="flex items-start gap-2.5 text-sm">
                      {ICONE[i.status]}
                      <div className="min-w-0">
                        <div className="text-slate-200">{i.titulo}</div>
                        <div className="text-xs text-slate-500 break-words">{i.detalhe}</div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Sugestões com fonte */}
        <div className="space-y-4 min-w-0">
          <div className="label">Encontrado na web (só entra o que você marcar)</div>
          {!temSugestao && (
            <p className="text-sm text-slate-400">
              Nenhum dado confiável encontrado. A Abelha não inventa: o que faltar fica em branco no site.
            </p>
          )}
          {campos.sobre && (
            <label className="block rounded-xl border border-white/10 p-4 cursor-pointer hover:border-amber-300/40" htmlFor="abelha-sobre">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <input id="abelha-sobre" type="checkbox" className="accent-amber-300 w-4 h-4" checked={aceitos.sobre}
                  onChange={(e) => setAceitos({ ...aceitos, sobre: e.target.checked })} />
                Texto "Sobre"
              </div>
              <p className="mt-2 text-sm text-slate-300">{campos.sobre.texto}</p>
              <div className="mt-1"><Fonte url={campos.sobre.fonte} /></div>
            </label>
          )}
          {campos.horarios && (
            <label className="block rounded-xl border border-white/10 p-4 cursor-pointer hover:border-amber-300/40" htmlFor="abelha-horarios">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <input id="abelha-horarios" type="checkbox" className="accent-amber-300 w-4 h-4" checked={aceitos.horarios}
                  onChange={(e) => setAceitos({ ...aceitos, horarios: e.target.checked })} />
                Horário
              </div>
              <p className="mt-2 text-sm text-slate-300">{campos.horarios.texto}</p>
              <div className="mt-1"><Fonte url={campos.horarios.fonte} /></div>
            </label>
          )}
          {campos.servicos.length > 0 && (
            <div className="rounded-xl border border-white/10 p-4">
              <div className="text-sm font-medium text-white mb-2">Serviços</div>
              <ul className="space-y-1.5">
                {campos.servicos.map((s, i) => (
                  <li key={s.nome}>
                    <label className="flex flex-wrap items-center gap-2 text-sm text-slate-300 cursor-pointer" htmlFor={`abelha-servico-${i}`}>
                      <input id={`abelha-servico-${i}`} type="checkbox" className="accent-amber-300 w-4 h-4"
                        checked={aceitos.servicos.includes(s.nome)} onChange={() => alternarServico(s.nome)} />
                      {s.nome} <Fonte url={s.fonte} />
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fontes.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-400 hover:text-white">{fontes.length} fonte(s) consultada(s)</summary>
              <ul className="mt-2 space-y-1">
                {fontes.map((f) => (
                  <li key={f.url} className="truncate">
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-neon">{f.titulo}</a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-5 border-t border-white/5">
        <button onClick={injetar} disabled={gerando} className="btn-primary !bg-amber-300 hover:!bg-amber-200 sm:flex-1">
          {gerando ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}{' '}
          {SEM_DOWNLOAD ? 'Injetar dados na pasta final' : 'Injetar e baixar pasta final'}
        </button>
        <Link to="/projeto" className="btn-ghost border border-white/10 justify-center">
          <FolderCog size={16} /> Projeto e ferramentas
        </Link>
      </div>
      {entregue && (
        <p className="px-5 pb-5 -mt-2 text-sm text-emerald-300">
          🐝 Colmeia completa! <span className="font-mono">{entregue.nomeZip}</span> ({(entregue.tamanho / 1024).toFixed(0)} KB) · nota{' '}
          {auditoria.nota} → {entregue.nota}. Pronta pro VS Code{resultado.siteId ? ' e para o Tigre publicar' : ''}.
        </p>
      )}
      {erro && <p className="px-5 pb-5 -mt-2 text-sm text-rose-300">{erro}</p>}
    </section>
  )
}
