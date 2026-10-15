import { useMemo, useState } from 'react'
import { Copy, Download, CheckCircle2, Users } from 'lucide-react'
import { usePipeline, setPipeline } from '../store/pipeline.js'
import { chaveContato, contatoDoLead } from '../lib/contato.js'
import { lembrar } from '../lib/mentes.js'

// 📋 Lista para envio em massa (pedido do usuário: mandar pelo Premium Sender): os números dos comércios SEM site do
// nicho, com a mensagem personalizada. Fica de fora quem já recebeu mensagem, pediu para parar ou já tem site.
// "Já mandei para esta lista" marca todos como contatados — o Tigre nunca manda de novo para eles.

const CHAVE_MODELO = 'central-agentes:massa-modelo'
const CHAVE_EMPRESA = 'central-agentes:massa-empresa'
const MODELO_PADRAO =
  'Olá, {nome}! 👋 Somos da {empresa}. Vimos que vocês ainda não têm um site — hoje é por ele que muita gente encontra {nicho} no Google aqui em {cidade}. Preparamos uma prévia do site de vocês, sem compromisso. Gostariam de se destacar? Posso te mostrar?'

const ler = (k, p) => {
  try {
    return localStorage.getItem(k) ?? p
  } catch {
    return p
  }
}
const gravar = (k, v) => {
  try {
    localStorage.setItem(k, v)
  } catch {
    /* sem storage */
  }
}
const numero = (l) => {
  const d = String(l.whatsapp || l.telefone || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  return d.length === 10 || d.length === 11 ? `55${d}` : null
}
const cidadeDe = (l) => String(l.cidade || '').split(/\s*[-,/]\s*/)[0] || 'na cidade'
const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

export default function ListaEnvioMassa() {
  const estado = usePipeline()
  const { leads = [], auto = {} } = estado
  const reais = leads.filter((l) => !l.demo)
  const nichos = [...new Set(reais.map((l) => l.categoria).filter(Boolean))]
  const atual = auto.relatorio?.nicho && nichos.includes(auto.relatorio.nicho) ? auto.relatorio.nicho : nichos[0] || ''
  const [nicho, setNicho] = useState(atual)
  const [empresa, setEmpresa] = useState(() => ler(CHAVE_EMPRESA, 'Carmesin'))
  const [modelo, setModelo] = useState(() => ler(CHAVE_MODELO, MODELO_PADRAO))
  const [aviso, setAviso] = useState(null)

  const lista = useMemo(() => {
    const vistos = new Set()
    return reais
      .filter((l) => l.categoria === nicho)
      .filter((l) => !['tem', 'provavel'].includes(l.conferencia?.status))
      .filter((l) => {
        const c = contatoDoLead(l, estado)
        return !c || c.status === 'site_feito'
      })
      .map((l) => ({ lead: l, numero: numero(l) }))
      .filter((x) => x.numero && !vistos.has(x.numero) && vistos.add(x.numero))
  }, [reais, nicho, estado])

  const mensagemDe = (l) =>
    modelo
      .replaceAll('{nome}', l.nome || '')
      .replaceAll('{empresa}', empresa || '')
      .replaceAll('{nicho}', l.categoria || nicho || '')
      .replaceAll('{cidade}', cidadeDe(l))

  async function copiar(texto, rotulo) {
    try {
      await navigator.clipboard.writeText(texto)
      setAviso(`✅ ${rotulo} copiado(s).`)
    } catch {
      setAviso('Não consegui copiar — use "Baixar planilha".')
    }
  }

  function baixarPlanilha() {
    const linhas = [['numero', 'nome', 'mensagem'], ...lista.map(({ lead, numero }) => [numero, lead.nome, mensagemDe(lead)])]
    const texto = '﻿' + linhas.map((r) => r.map(csv).join(',')).join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }))
    a.download = `lista-${(nicho || 'nicho').replace(/\s+/g, '-')}-${lista.length}.csv`
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
    setAviso(`✅ Planilha com ${lista.length} contato(s) baixada (colunas: numero, nome, mensagem).`)
  }

  // Marca todos como "contatado": o selo aparece em todos os agentes e o Tigre/automático não mandam de novo.
  function jaMandei() {
    if (!lista.length) return
    const em = new Date().toISOString()
    setPipeline((s) => {
      const contatos = { ...(s.contatos || {}) }
      for (const { lead } of lista) contatos[chaveContato(lead)] = { status: 'contatado', nome: lead.nome, em, via: 'envio-em-massa' }
      return { contatos }
    })
    lembrar('tigre', `Anotei ${lista.length} comércio(s) de ${nicho} como já contatados (envio em massa)`)
    setAviso(`✅ ${lista.length} comércio(s) marcados como "⏳ Aguardando resposta". Não entram mais em nenhuma lista nem no automático.`)
  }

  return (
    <div className="space-y-3 border-b border-white/5 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-white">
        <Users size={16} className="text-neon" /> 📋 Lista para envio em massa (Premium Sender)
      </div>
      {nichos.length === 0 ? (
        <p className="text-sm text-slate-500">O Pinguim ainda não achou comércios. Rode uma busca primeiro.</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="label">Nicho</span>
              <select className="input" value={nicho} onChange={(e) => setNicho(e.target.value)}>
                {nichos.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="label">Nome da sua empresa</span>
              <input
                className="input"
                value={empresa}
                onChange={(e) => {
                  setEmpresa(e.target.value)
                  gravar(CHAVE_EMPRESA, e.target.value)
                }}
              />
            </label>
          </div>
          <label className="block">
            <span className="label">Mensagem (use {'{nome}'}, {'{empresa}'}, {'{nicho}'}, {'{cidade}'} — cada comércio recebe a sua)</span>
            <textarea
              rows={4}
              className="input"
              value={modelo}
              onChange={(e) => {
                setModelo(e.target.value)
                gravar(CHAVE_MODELO, e.target.value)
              }}
            />
          </label>
          {lista[0] && (
            <p className="rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200">
              <span className="text-xs text-slate-500">Exemplo para {lista[0].lead.nome}:</span>
              <br />
              {mensagemDe(lista[0].lead)}
            </p>
          )}
          <p className="text-sm text-slate-300">
            <strong className="text-white">{lista.length}</strong> comércio(s) sem site em <strong className="text-white">{nicho}</strong> com WhatsApp, que ainda não
            receberam mensagem.
          </p>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary !py-2 !px-4 text-sm" onClick={baixarPlanilha} disabled={!lista.length}>
              <Download size={16} /> Baixar planilha (CSV)
            </button>
            <button className="btn-ghost border border-white/10 text-sm" onClick={() => copiar(lista.map((x) => x.numero).join('\n'), `${lista.length} número(s)`)} disabled={!lista.length}>
              <Copy size={16} /> Copiar só os números
            </button>
            <button
              className="btn-ghost border border-white/10 text-sm"
              onClick={() => copiar(lista.map(({ lead, numero }) => `${numero}\t${lead.nome}\t${mensagemDe(lead)}`).join('\n'), 'Números + mensagens')}
              disabled={!lista.length}
            >
              <Copy size={16} /> Copiar números + mensagens
            </button>
            <button className="btn-ghost border border-emerald-400/40 text-emerald-200 text-sm" onClick={jaMandei} disabled={!lista.length}>
              <CheckCircle2 size={16} /> Já mandei para esta lista
            </button>
          </div>
          {aviso && <p className="text-xs text-slate-300">{aviso}</p>}
          <p className="text-xs text-slate-500">
            Dica: mande aos poucos (ex.: 20–30 por dia, com intervalo) e respeite quem pedir para parar — envio em massa para quem não te conhece é o que
            mais faz o WhatsApp bloquear o número.
          </p>
        </>
      )}
    </div>
  )
}
