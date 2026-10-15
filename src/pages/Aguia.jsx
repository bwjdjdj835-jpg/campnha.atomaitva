import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Copy, CheckCircle2, Loader2, Send } from 'lucide-react'
import { usePipeline } from '../store/pipeline.js'
import { numerosDaAguia, relatorioDaAguia, enviarRelatorioAguia } from '../lib/aguia.js'
import { equipe } from '../data/equipe.js'
import { pensamentos } from '../lib/mentes.js'
import MenteAgente from '../components/MenteAgente.jsx'

// 🦅 Águia: vê o processo inteiro de cima e te manda o relatório por e-mail.
export default function Aguia() {
  const estado = usePipeline()
  const n = numerosDaAguia(estado)
  const relatorio = relatorioDaAguia(estado)
  const [temEmail, setTemEmail] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [copiado, setCopiado] = useState(false)
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => setTemEmail(Boolean(d.keys?.email)))
      .catch(() => setTemEmail(false))
  }, [])

  async function enviar() {
    setEnviando(true)
    setAviso(null)
    try {
      const ok = await enviarRelatorioAguia(estado)
      setAviso(ok ? '✅ Relatório enviado para o seu e-mail.' : 'O e-mail ainda não está configurado no servidor — use "Abrir no meu e-mail".')
    } catch (e) {
      setAviso(`❌ ${e.message}`)
    } finally {
      setEnviando(false)
    }
  }
  async function copiar() {
    await navigator.clipboard?.writeText(relatorio.texto).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const cartoes = [
    ['Comércios vistos', n.achados],
    ['Sem site', n.semSite],
    ['Sites montados', n.sites],
    ['Para aprovar', n.paraAprovar],
    ['Mensagens enviadas', n.enviados],
    ['Responderam', n.responderam],
    ['Esperando você', n.esperandoVoce],
    ['Vendas', n.vendas],
  ]

  return (
    <div className="space-y-6">
      <section className="glass circuit-bg p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-5xl leading-none" aria-hidden="true">🦅</span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-mono tracking-[0.3em] text-neon">🦅 ÁGUIA · VISÃO GERAL</div>
            <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Como está indo o processo</h1>
            <p className="mt-1 text-sm text-slate-400">Tudo o que os agentes fizeram, num lugar só. No fim de cada rodada do automático, a Águia te manda este relatório por e-mail.</p>
          </div>
        </div>
      </section>

      <MenteAgente agente="aguia" />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cartoes.map(([rotulo, valor]) => (
          <div key={rotulo} className="glass p-4">
            <div className="font-display text-2xl font-bold tabular-nums text-white">{valor}</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">{rotulo}</div>
          </div>
        ))}
      </section>

      <section className="glass overflow-hidden">
        <div className="border-b border-white/5 px-5 py-3 font-display font-semibold text-white">O time agora</div>
        <ul className="divide-y divide-white/5">
          {equipe.filter((a) => a.id !== 'aguia').map((a) => (
            <li key={a.id} className="flex items-start gap-3 px-5 py-3 text-sm">
              <span className="text-xl">{a.emoji}</span>
              <div className="min-w-0 flex-1">
                <Link to={a.link} className="font-medium text-white hover:text-neon">{a.name}</Link>
                <p className="text-slate-400">{pensamentos(a.id, estado).join(' ')}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Mail size={18} className="text-neon" />
          <span className="flex-1 font-display font-semibold text-white">Relatório por e-mail</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${temEmail ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/5 text-slate-400'}`}>
            {temEmail === null ? '…' : temEmail ? 'E-mail automático ligado' : 'E-mail automático desligado'}
          </span>
        </div>
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-4 text-xs text-slate-300">{relatorio.texto}</pre>
        <div className="flex flex-wrap gap-2">
          {temEmail && (
            <button className="btn-primary !py-2 !px-4 text-sm" onClick={enviar} disabled={enviando}>
              {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Mandar agora para o meu e-mail
            </button>
          )}
          <a
            className={`${temEmail ? 'btn-ghost border border-white/10' : 'btn-primary !py-2 !px-4'} text-sm`}
            href={`mailto:?subject=${encodeURIComponent(relatorio.assunto)}&body=${encodeURIComponent(relatorio.texto)}`}
          >
            <Mail size={16} /> Abrir no meu e-mail
          </a>
          <button className="btn-ghost border border-white/10 text-sm" onClick={copiar}>
            {copiado ? <CheckCircle2 size={16} /> : <Copy size={16} />} {copiado ? 'Copiado!' : 'Copiar relatório'}
          </button>
        </div>
        {aviso && <p className="text-sm text-slate-300">{aviso}</p>}
        {temEmail === false && (
          <p className="text-xs text-slate-500">
            Para a Águia mandar sozinha: crie uma conta grátis em resend.com, copie a API key (começa com re_) e coloque no Vercel
            <span className="font-mono"> RESEND_API_KEY</span> e o seu e-mail (o mesmo da conta do Resend) em <span className="font-mono">AGUIA_EMAIL</span>. Depois, Redeploy.
          </p>
        )}
      </section>
    </div>
  )
}
