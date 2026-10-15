import { useEffect, useState } from 'react'
import { Cloud, Copy, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react'
import { estadoNuvem, ouvirNuvem, codigoDaConta, usarCodigo, puxarDaNuvem } from '../store/nuvem.js'
import { erroLocal } from '../store/pipeline.js'

// ☁️ Nuvem: os dados do app (comércios, sites, conversas, selos, memórias) ficam salvos na conta,
// iguais em todos os aparelhos que usarem o mesmo código.
export default function Nuvem() {
  const [nuvem, setNuvem] = useState({ ...estadoNuvem })
  useEffect(() => ouvirNuvem(setNuvem), [])
  const [codigo, setCodigo] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [aviso, setAviso] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const meu = nuvem.ligada ? codigoDaConta() : ''

  async function trocar() {
    setOcupado(true)
    setAviso(null)
    try {
      await usarCodigo(codigo)
      setAviso('✅ Pronto: este aparelho agora usa a mesma conta (os dados foram juntados).')
      setCodigo('')
    } catch (e) {
      setAviso(`❌ ${e.message}`)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass circuit-bg p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <Cloud size={40} className="text-neon" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Dados salvos na nuvem</h1>
            <p className="mt-1 text-sm text-slate-400">
              Comércios, sites, conversas, selos ("aguardando", "não quer agora"…) e a memória dos agentes ficam guardados na sua conta —
              não somem ao entrar de novo e aparecem iguais no notebook e no celular. Vídeos e ZIPs continuam no aparelho onde foram feitos.
            </p>
          </div>
        </div>
      </section>

      {nuvem.ligada === false && (
        <section className="glass space-y-3 p-5 text-sm text-slate-300">
          <div className="font-display text-lg font-semibold text-white">Ligar a nuvem (grátis, 2 minutos)</div>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Entre no <strong>vercel.com</strong> → projeto <strong>campnha-atomaitva</strong> → aba <strong>Storage</strong>.</li>
            <li>Clique em <strong>Create Database</strong> (ou Marketplace) → escolha <strong>Upstash for Redis</strong> → plano <strong>Free</strong> → <strong>Create</strong>.</li>
            <li>Na tela seguinte, clique em <strong>Connect</strong> no projeto campnha-atomaitva (ele cria as variáveis sozinho).</li>
            <li>Vá em <strong>Deployments</strong> → <strong>⋯</strong> da última versão → <strong>Redeploy</strong>. Pronto!</li>
          </ol>
        </section>
      )}

      {nuvem.ligada && (
        <section className="glass space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className={`rounded-full px-2 py-0.5 ${nuvem.erro ? 'bg-rose-400/10 text-rose-300' : 'bg-emerald-400/10 text-emerald-300'}`}>
              {nuvem.erro ? `Erro: ${nuvem.erro}` : nuvem.enviando ? 'Salvando…' : '☁️ Nuvem ligada'}
            </span>
            {nuvem.ultimaVez && <span className="text-slate-400">salvo às {new Date(nuvem.ultimaVez).toLocaleTimeString('pt-BR')}</span>}
            <button className="btn-ghost border border-white/10 !py-1 !px-3 text-xs" onClick={puxarDaNuvem}>
              <RefreshCw size={12} /> Atualizar agora
            </button>
          </div>
          <div>
            <div className="label">Código da sua conta (use o mesmo no celular e no notebook)</div>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-black/40 px-3 py-2 text-sm text-neon">{meu}</code>
              <button
                className="btn-ghost border border-white/10 text-sm"
                onClick={async () => {
                  await navigator.clipboard?.writeText(meu).catch(() => {})
                  setCopiado(true)
                  setTimeout(() => setCopiado(false), 2000)
                }}
              >
                {copiado ? <CheckCircle2 size={16} /> : <Copy size={16} />} {copiado ? 'Copiado!' : 'Copiar código'}
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Guarde este código: é a chave dos seus dados. Não mande para ninguém.</p>
          </div>
          <div>
            <div className="label">Já usa o app em outro aparelho? Cole o código de lá</div>
            <div className="flex flex-wrap gap-2">
              <input className="input max-w-md" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="cole o código do outro aparelho" />
              <button className="btn-primary !py-2 !px-4 text-sm" onClick={trocar} disabled={!codigo.trim() || ocupado}>
                {ocupado ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />} Usar este código
              </button>
            </div>
          </div>
          {aviso && <p className="text-sm text-slate-300">{aviso}</p>}
        </section>
      )}

      {erroLocal && (
        <p className="glass p-4 text-sm text-amber-200">
          ⚠️ O navegador recusou guardar os dados aqui ({erroLocal}) — sem a nuvem ligada, eles podem sumir ao fechar.
        </p>
      )}
    </div>
  )
}
