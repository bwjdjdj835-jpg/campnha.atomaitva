import { useEffect, useState } from 'react'
import { Bot, CheckCircle2, XCircle, Loader2, Copy, RefreshCw } from 'lucide-react'
import { statusAuto, salvarConfig, senhaDoTigre, guardarSenha, sincronizarCaixa, iniciarCaixa } from '../services/tigreAuto.js'

// 🐯 Tigre automático pela API oficial do WhatsApp: você põe a senha, o preço e a forma de pagamento; ele conversa sozinho.
export default function TigreAutoPainel() {
  const [senha, setSenha] = useState(senhaDoTigre())
  const [estado, setEstado] = useState(null) // { requisitos, config, motivo }
  const [form, setForm] = useState(null)
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const carregar = async () => {
    try {
      const e = await statusAuto()
      setEstado(e)
      if (e.config) setForm(e.config)
    } catch (err) {
      setEstado({ requisitos: null, config: null, motivo: err.message })
    }
  }
  useEffect(() => {
    carregar()
  }, [])

  const entrar = async () => {
    guardarSenha(senha.trim())
    await carregar()
    iniciarCaixa()
  }
  const salvar = async (mudanca = {}) => {
    setOcupado(true)
    setMsg('')
    try {
      const { config } = await salvarConfig({ ...form, ...mudanca })
      setForm(config)
      setEstado((e) => ({ ...e, config }))
      setMsg(mudanca.ligado === true ? '🐯 Ligado! O Tigre responde os clientes sozinho.' : mudanca.ligado === false ? 'Desligado.' : 'Salvo.')
    } catch (err) {
      setMsg('❌ ' + err.message)
    } finally {
      setOcupado(false)
    }
  }
  const puxar = async () => {
    setOcupado(true)
    try {
      const { novas } = await sincronizarCaixa()
      setMsg(novas ? `${novas} mensagem(ns) nova(s) — veja na Aranha.` : 'Nada novo.')
    } catch (err) {
      setMsg('❌ ' + err.message)
    } finally {
      setOcupado(false)
    }
  }

  const r = estado?.requisitos
  const webhook = `${location.origin}/api/tigre/webhook`
  const itens = r && [
    [r.meta, 'API oficial da Meta', 'WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID no Vercel'],
    [r.template, 'Modelo da 1ª mensagem aprovado', 'WHATSAPP_TEMPLATE = nome do modelo aprovado na Meta (com {{1}} = nome do comércio)'],
    [r.webhook, 'Webhook (respostas chegam sozinhas)', 'WHATSAPP_VERIFY_TOKEN e WHATSAPP_APP_SECRET no Vercel; na Meta, URL de retorno abaixo'],
    [r.nuvem, 'Nuvem ligada (guarda as conversas)', 'Upstash Redis — veja a página ☁️ Nuvem'],
    [r.senha, 'Senha do Tigre criada', 'TIGRE_SENHA no Vercel (uma senha só sua)'],
    [Boolean(r.ia), `IA para conversar${r.ia ? ` (${r.ia === 'groq' ? 'Groq' : 'Claude'})` : ''}`, 'GROQ_API_KEY (sem ela o Tigre usa textos prontos)'],
  ]
  const campo = (k, rotulo, dica, linhas = 1) => (
    <label className="block space-y-1">
      <span className="label">{rotulo}</span>
      {linhas > 1 ? (
        <textarea className="input min-h-[70px]" rows={linhas} value={form?.[k] || ''} placeholder={dica} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      ) : (
        <input className="input" value={form?.[k] || ''} placeholder={dica} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      )}
    </label>
  )

  return (
    <section className="space-y-4 border-t border-white/5 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Bot size={18} className="text-neon" />
        <h3 className="font-display font-semibold text-white">🤖 Tigre automático (API oficial do WhatsApp)</h3>
        {form?.ligado && <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs text-emerald-200">ligado</span>}
      </div>
      <p className="text-xs text-slate-400">
        Depois do seu “Aprovar” na Aranha, o Tigre manda a 1ª mensagem pelo modelo aprovado pela Meta e conversa sozinho: manda o
        vídeo quando pedirem, fala o <strong className="text-slate-200">seu</strong> preço e manda a <strong className="text-slate-200">sua</strong> forma de
        pagamento. Para na hora se pedirem para parar, nunca inventa valor nem desconto, e te avisa (Aranha + e-mail da Águia) quando
        querem fechar, pedem desconto ou dizem que pagaram — confirmar o pagamento e publicar é com você.
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[12rem] flex-1 space-y-1">
          <span className="label">Senha do Tigre (a TIGRE_SENHA do Vercel)</span>
          <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="só você sabe" />
        </label>
        <button className="btn-ghost border border-white/10 text-sm" onClick={entrar}>
          Entrar
        </button>
      </div>
      {estado?.motivo && !estado.config && <p className="text-xs text-amber-300">{estado.motivo}</p>}

      {itens && (
        <ul className="space-y-1.5 text-sm">
          {itens.map(([ok, nome, como]) => (
            <li key={nome} className="flex items-start gap-2">
              {ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-300" /> : <XCircle size={16} className="mt-0.5 shrink-0 text-rose-300" />}
              <span>
                <span className="text-slate-200">{nome}</span>
                {!ok && <span className="block text-xs text-slate-500">{como}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
        <span className="text-slate-400">URL de retorno (webhook) para colar na Meta:</span>
        <code className="break-all text-slate-200">{webhook}</code>
        <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => navigator.clipboard?.writeText(webhook)}>
          <Copy size={12} /> Copiar
        </button>
      </div>

      {form && (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {campo('preco', 'Seu preço do site', 'ex.: R$ 497')}
            {campo('condicoes', 'Condições (opcional)', 'ex.: à vista ou 3x de R$ 175')}
          </div>
          {campo('pagamento', 'Forma de pagamento (vai igualzinho para o cliente)', 'ex.: Pix CNPJ 00.000.000/0001-00 (Sua Empresa)', 2)}
          {campo('templateTexto', 'Texto do seu modelo aprovado na Meta (para a conversa ficar completa na Aranha)', 'Olá, {{1}}! Fiz uma prévia de site pra vocês…', 2)}
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost border border-white/10 text-sm" onClick={() => salvar()} disabled={ocupado}>
              Salvar
            </button>
            {form.ligado ? (
              <button className="btn-ghost border border-rose-400/30 text-sm text-rose-200" onClick={() => salvar({ ligado: false })} disabled={ocupado}>
                Desligar o Tigre automático
              </button>
            ) : (
              <button className="btn-primary text-sm" onClick={() => salvar({ ligado: true })} disabled={ocupado || !form.preco?.trim() || !form.pagamento?.trim()}>
                Ligar o Tigre automático
              </button>
            )}
            <button className="btn-ghost text-sm" onClick={puxar} disabled={ocupado}>
              {ocupado ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Puxar conversas agora
            </button>
          </div>
          {!form.ligado && (!form.preco?.trim() || !form.pagamento?.trim()) && (
            <p className="text-xs text-slate-500">Para ligar, preencha o preço e a forma de pagamento.</p>
          )}
        </div>
      )}
      {msg && <p className="text-sm text-slate-300">{msg}</p>}
    </section>
  )
}
