import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, Download, Eye, MessageCircle, Search, Layers } from 'lucide-react'
import { usePipeline } from '../store/pipeline.js'
import { SELO_CONTATO } from '../lib/contato.js'
import { lerZip } from '../lib/zipStore.js'
import { NICHOS_PADRAO, chaveNicho } from '../services/automatico.js'
import { lerOpcoes } from '../pages/Automatico.jsx'

// 🐯 Arquivo do Tigre: a conversa com o cliente agora fica na Aranha Administradora; o Tigre guarda a memória de tudo —
// os sites de quem disse "agora não" (para oferecer de novo depois), quem respondeu, os comércios já verificados pelo
// Pinguim e quais nichos já foram feitos, estão em andamento ou ainda não vimos.

const GRUPOS = [
  { id: 'recusou', titulo: '🙅 Não querem agora — sites guardados', status: ['recusou'], dica: 'O site e o vídeo continuam guardados aqui. Dá para oferecer de novo daqui a um tempo.' },
  { id: 'respondeu', titulo: '🔥 Responderam / interessados', status: ['interessado', 'duvida', 'bot'] },
  { id: 'aguardando', titulo: '⏳ Aguardando resposta', status: ['contatado'] },
  { id: 'vendido', titulo: '💰 Vendidos', status: ['vendido', 'publicado'] },
  { id: 'nao_contatar', titulo: '⛔ Não contatar', status: ['nao_contatar'] },
]

async function baixar(chave, nome) {
  const blob = await lerZip(chave)
  if (!blob) return alert('Este ZIP não está mais neste navegador.')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nome
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
}

const quando = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '')

export default function TigreArquivo() {
  const { sites, leads, conversas = {}, comSite = [], auto = {} } = usePipeline()
  const [aba, setAba] = useState('recusou')

  // Clientes por situação (só quem já recebeu mensagem).
  const comConversa = sites.filter((s) => conversas[s.id]?.mensagens?.some((m) => m.de === 'nos'))
  const doGrupo = (g) => comConversa.filter((s) => g.status.includes(conversas[s.id]?.status))
  const grupo = GRUPOS.find((g) => g.id === aba)

  // Nichos: feitos, em andamento (com quantos faltam) e os que ainda não vimos.
  const nichos = (lerOpcoes().nichos || NICHOS_PADRAO.join('\n')).split('\n').map((n) => n.trim()).filter(Boolean)
  const feitos = auto.feitos || []
  const listas = auto.listas || {}
  const leadPorId = new Map(leads.map((l) => [l.id, l]))
  const siteDoLead = new Set(sites.filter((s) => s.status !== 'descartado').map((s) => s.leadId))
  const linhasNicho = nichos.map((n) => {
    const k = chaveNicho(n)
    const doNicho = leads.filter((l) => !l.demo && chaveNicho(l.categoria) === k)
    const lista = listas[k]
    const faltam = lista ? lista.filter((id) => leadPorId.has(id) && !siteDoLead.has(id)).length : null
    const estado = feitos.includes(k) ? 'feito' : lista ? 'andamento' : doNicho.length ? 'visto' : 'nao_visto'
    return { nicho: n, estado, achados: doNicho.length, sites: doNicho.filter((l) => siteDoLead.has(l.id)).length, faltam }
  })
  const ESTADO = {
    feito: ['✅ Concluído', 'text-emerald-300'],
    andamento: ['🔄 Em andamento', 'text-sky-300'],
    visto: ['👀 Buscado (fora do automático)', 'text-slate-300'],
    nao_visto: ['⏸️ Ainda não vimos', 'text-slate-500'],
  }

  // Comércios verificados pelo Pinguim.
  const reais = leads.filter((l) => !l.demo)
  const conta = (st) => reais.filter((l) => l.conferencia?.status === st).length
  const verificados = [
    ['Comércios achados', reais.length],
    ['Sem site (conferido)', conta('nao') + conta('sem_firecrawl')],
    ['Já têm site', comSite.length + conta('tem')],
    ['Possível site', conta('provavel')],
    ['Falta conferir', conta('pendente') + conta('erro')],
  ]

  return (
    <section className="glass overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-5 py-4">
        <Archive size={18} className="text-neon" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-white">🐯 Arquivo do Tigre</h3>
          <p className="text-xs text-slate-400">
            A conversa com o cliente acontece na <Link to="/admin" className="text-neon hover:underline">🕷️ Aranha Administradora</Link>. Aqui o Tigre
            guarda tudo: sites de quem disse "agora não", quem respondeu, comércios verificados e os nichos que faltam.
          </p>
        </div>
      </div>

      {/* Clientes por situação */}
      <div className="space-y-3 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {GRUPOS.map((g) => (
            <button
              key={g.id}
              onClick={() => setAba(g.id)}
              className={`btn-ghost border !py-1.5 !px-3 text-xs ${aba === g.id ? 'border-neon/50 text-neon bg-neon/10' : 'border-white/10'}`}
            >
              {g.titulo.split(' — ')[0]} ({doGrupo(g).length})
            </button>
          ))}
        </div>
        {grupo.dica && <p className="text-xs text-slate-500">{grupo.dica}</p>}
        {doGrupo(grupo).length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Ninguém aqui ainda.</p>
        ) : (
          <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
            {doGrupo(grupo).map((s) => {
              const c = conversas[s.id]
              const selo = SELO_CONTATO[c.status] || SELO_CONTATO.contatado
              const ultima = c.mensagens.filter((m) => m.de === 'cliente').at(-1)
              const lead = leadPorId.get(s.leadId)
              const base = s.nome.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{s.nome}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${selo.cor}`}>{selo.texto}</span>
                      {lead?.categoria && <span className="text-xs text-slate-500">{lead.categoria}</span>}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {ultima ? `“${ultima.texto}” · ${quando(ultima.at)}` : `Mensagem enviada ${quando(c.mensagens.at(-1)?.at)}`}
                    </div>
                  </div>
                  <Link to={`/agente/gato?site=${s.id}`} className="btn-ghost border border-white/10 !py-1 !px-2 text-xs">
                    <Eye size={12} /> Prévia
                  </Link>
                  <button className="btn-ghost border border-white/10 !py-1 !px-2 text-xs" onClick={() => baixar(`${s.id}:final`, `${base}-final.zip`)}>
                    <Download size={12} /> Site (ZIP)
                  </button>
                  <Link to="/admin" className="btn-ghost !py-1 !px-2 text-xs text-slate-400">
                    <MessageCircle size={12} /> Conversa na Aranha
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Nichos */}
      <div className="space-y-2 border-t border-white/5 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Layers size={16} className="text-neon" /> Nichos ({linhasNicho.filter((l) => l.estado === 'feito').length} de {linhasNicho.length} concluídos)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-1 pr-3 font-medium">Nicho</th>
                <th className="py-1 pr-3 font-medium">Situação</th>
                <th className="py-1 pr-3 font-medium">Achados</th>
                <th className="py-1 pr-3 font-medium">Sites feitos</th>
                <th className="py-1 font-medium">Faltam</th>
              </tr>
            </thead>
            <tbody>
              {linhasNicho.map((l) => (
                <tr key={l.nicho} className="border-t border-white/5">
                  <td className="py-1.5 pr-3 text-slate-200">{l.nicho}</td>
                  <td className={`py-1.5 pr-3 ${ESTADO[l.estado][1]}`}>{ESTADO[l.estado][0]}</td>
                  <td className="py-1.5 pr-3 tabular-nums text-slate-300">{l.achados || '—'}</td>
                  <td className="py-1.5 pr-3 tabular-nums text-slate-300">{l.sites || '—'}</td>
                  <td className="py-1.5 tabular-nums text-slate-300">{l.faltam ?? (l.estado === 'feito' ? 0 : '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comércios verificados */}
      <div className="space-y-2 border-t border-white/5 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Search size={16} className="text-neon" /> Comércios verificados pelo Pinguim
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {verificados.map(([rotulo, n]) => (
            <div key={rotulo} className="rounded-xl border border-white/10 px-3 py-2">
              <div className="font-display text-xl font-bold tabular-nums text-white">{n}</div>
              <div className="text-[11px] text-slate-400">{rotulo}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
