import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, MessageCircle, Instagram, Copy, Check, ArrowRight, Search, Globe, Loader2, Pause, Play, ExternalLink } from 'lucide-react'
import { linkBuscaInstagram } from '../lib/links.js'
import { conferirSite } from '../services/agents.js'
import { lerPipeline, setPipeline, usePipeline } from '../store/pipeline.js'
import { SELO_CONTATO, chaveContato, contatoDoLead } from '../lib/contato.js'

// O plano grátis do Firecrawl aceita ~10 pedidos por minuto; cada negócio usa até 2 (nome e telefone).
const PEDIDOS_POR_MINUTO = 9 // plano grátis: 10 buscas/min (fica 1 de folga)
const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

function atualizarLead(id, campos) {
  setPipeline((s) => ({ leads: s.leads.map((l) => (l.id === id ? { ...l, ...campos(l) } : l)) }))
}

// Confere um por um os leads "pendentes", sem passar do limite por minuto. Roda enquanto a página está aberta.
function useConferencia(leads) {
  const [pausado, setPausado] = useState(false)
  // Leads achados antes da conferência existir (só tinham Alto/Médio): entram na fila também.
  useEffect(() => {
    if (!leads.some((l) => !l.demo && !l.conferencia)) return
    setPipeline((s) => ({ leads: s.leads.map((l) => (!l.demo && !l.conferencia ? { ...l, conferencia: { status: 'pendente' } } : l)) }))
  }, [leads])
  const [esperando, setEsperando] = useState(null) // segundos até poder pedir de novo
  const rodando = useRef(false)
  const pausadoRef = useRef(false)
  pausadoRef.current = pausado
  const pendentes = leads.filter((l) => l.conferencia?.status === 'pendente')

  useEffect(() => {
    if (rodando.current || pausado || !pendentes.length) return
    rodando.current = true
    const pedidos = [] // horários dos pedidos do último minuto
    ;(async () => {
      try {
        for (;;) {
          if (pausadoRef.current) break
          const proximo = lerPipeline().leads.find((l) => l.conferencia?.status === 'pendente')
          if (!proximo) break
          // Espera até ter espaço para 2 pedidos no último minuto.
          for (;;) {
            const agora = Date.now()
            while (pedidos.length && agora - pedidos[0] > 60_000) pedidos.shift()
            if (pedidos.length + 2 <= PEDIDOS_POR_MINUTO) break
            setEsperando(Math.ceil((60_000 - (agora - pedidos[0])) / 1000))
            await esperar(1000)
          }
          setEsperando(null)
          atualizarLead(proximo.id, () => ({ conferencia: { status: 'conferindo' } }))
          try {
            const r = await conferirSite(proximo)
            for (let i = 0; i < r.pedidos; i++) pedidos.push(Date.now())
            atualizarLead(proximo.id, (l) => ({
              conferencia: { status: r.veredito, site: r.site, evidencias: r.evidencias, em: new Date().toISOString() },
              instagram: l.instagram || r.instagram,
              confianca: r.veredito === 'nao' ? 'Alto' : 'Médio',
            }))
          } catch (e) {
            if (e.code === 'LIMITE') {
              // Bateu no limite (outro agente usou o Firecrawl no mesmo minuto): devolve pra fila e espera 1 minuto.
              atualizarLead(proximo.id, () => ({ conferencia: { status: 'pendente' } }))
              for (let s = 60; s > 0 && !pausadoRef.current; s--) {
                setEsperando(s)
                await esperar(1000)
              }
              setEsperando(null)
              continue
            }
            atualizarLead(proximo.id, () => ({ conferencia: { status: 'erro', erro: e.message } }))
            if (e.code === 'NO_KEY' || e.code === 'OFFLINE') break
          }
        }
      } finally {
        rodando.current = false
        setEsperando(null)
      }
    })()
  }, [pendentes.length, pausado])

  return { pendentes: pendentes.length, pausado, setPausado, esperando }
}

const SELO = {
  nao: { texto: '✅ Não tem site', cor: 'bg-emerald-400/10 text-emerald-300', dica: 'Nada no Google Maps nem no Firecrawl (nome e telefone)' },
  tem: { texto: '🌐 Tem site', cor: 'bg-rose-400/10 text-rose-300', dica: 'O Firecrawl achou um domínio com o nome do negócio' },
  provavel: { texto: '⚠️ Possível site', cor: 'bg-amber-400/10 text-amber-300', dica: 'O telefone aparece em outro site — confira o link' },
  pendente: { texto: 'Na fila para conferir', cor: 'bg-white/5 text-slate-400' },
  conferindo: { texto: 'Conferindo…', cor: 'bg-sky-400/10 text-sky-300' },
  erro: { texto: 'Não deu para conferir', cor: 'bg-white/5 text-slate-400' },
  sem_firecrawl: { texto: 'Sem site no Maps (não conferido)', cor: 'bg-white/5 text-slate-400', dica: 'Configure o Firecrawl para conferir domínio e telefone' },
}

function Selo({ c }) {
  const s = SELO[c?.status]
  if (!s) return null
  return (
    <span title={c.erro || s.dica} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${s.cor}`}>
      {c.status === 'conferindo' && <Loader2 size={12} className="animate-spin" />}
      {s.texto}
    </span>
  )
}

// Copia para a área de transferência; se o navegador recusar, cai no jeito antigo (selecionar + copiar).
async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    const t = document.createElement('textarea')
    t.value = texto
    t.setAttribute('readonly', '')
    t.style.position = 'fixed'
    t.style.opacity = '0'
    document.body.appendChild(t)
    t.select()
    let ok = false
    try {
      ok = document.execCommand('copy')
    } catch {
      ok = false
    }
    t.remove()
    return ok
  }
}

function LinhaLink({ icone: Icone, cor, rotulo, href, busca = false }) {
  const [copiado, setCopiado] = useState(false)
  if (!href) return null
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icone size={16} className={`${cor} shrink-0`} />
      <a href={href} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm text-slate-300 hover:text-white underline-offset-4 hover:underline">
        <span className="text-slate-500">{rotulo}: </span>
        {busca ? 'procurar (não encontrado automaticamente)' : href.replace(/^https?:\/\/(www\.)?/, '')}
      </a>
      {!busca && (
        <button
          type="button"
          onClick={async () => {
            if (await copiar(href)) {
              setCopiado(true)
              setTimeout(() => setCopiado(false), 1500)
            }
          }}
          className="btn-ghost !px-2 !py-1 text-xs shrink-0"
          aria-label={`Copiar link do ${rotulo}`}
        >
          {copiado ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      )}
    </div>
  )
}

const cidadeDe = (endereco = '') => endereco.split(' - ').slice(-2).join(' ')

const ORDEM = { nao: 0, provavel: 2, tem: 3 }

// Marcação manual (você mandou mensagem fora do Tigre): fica guardada pelo telefone.
function marcarContato(lead, status) {
  setPipeline((s) => {
    const contatos = { ...(s.contatos || {}) }
    if (status) contatos[chaveContato(lead)] = { status, nome: lead.nome, em: new Date().toISOString() }
    else delete contatos[chaveContato(lead)]
    return { contatos }
  })
}

function SeloContato({ c }) {
  if (!c) return null
  const s = SELO_CONTATO[c.status]
  return (
    <span title={c.manual ? 'Marcado por você' : 'Pela conversa no 🐯 Tigre'} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${s.cor}`}>
      {s.texto}
    </span>
  )
}

export default function LeadsTable({ leads }) {
  const navigate = useNavigate()
  const { pendentes, pausado, setPausado, esperando } = useConferencia(leads)
  const pipeline = usePipeline()
  if (!leads.length) return null
  const conta = (st) => leads.filter((l) => l.conferencia?.status === st).length
  const contato = Object.fromEntries(leads.map((l) => [l.id, contatoDoLead(l, pipeline)]))
  // Quem você já procurou (mensagem enviada, recusou…) vai para o fim da lista; "site feito" ainda está por mandar.
  const jaFalou = (l) => contato[l.id] && contato[l.id].status !== 'site_feito'
  const contatados = leads.filter(jaFalou).length
  const ordenados = [...leads].sort(
    (a, b) => jaFalou(a) - jaFalou(b) || (ORDEM[a.conferencia?.status] ?? 1) - (ORDEM[b.conferencia?.status] ?? 1),
  )
  return (
    <div className="glass overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 flex flex-wrap items-center gap-x-4 gap-y-1">
        <h3 className="font-display font-semibold text-white">Leads</h3>
        <span className="text-xs text-emerald-300">{conta('nao')} sem site</span>
        {conta('provavel') > 0 && <span className="text-xs text-amber-300">{conta('provavel')} possível site</span>}
        {conta('tem') > 0 && <span className="text-xs text-rose-300">{conta('tem')} com site</span>}
        {contatados > 0 && <span className="text-xs text-sky-300">{contatados} já contatado(s)</span>}
        <span className="ml-auto text-xs text-slate-400">{leads.length} negócio(s)</span>
      </div>
      {pendentes > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-5 py-2.5 border-b border-white/5 bg-sky-400/5 text-xs text-sky-200">
          {pausado ? <Pause size={14} /> : <Loader2 size={14} className="animate-spin" />}
          <span>
            {pausado ? 'Conferência pausada' : 'Firecrawl conferindo domínio e telefone de cada negócio'} — faltam {pendentes}
            {esperando ? ` · próximo em ${esperando}s (limite do plano grátis: ~4 negócios por minuto)` : ''}
          </span>
          <button className="btn-ghost ml-auto !py-1 !px-2 text-xs" onClick={() => setPausado(!pausado)}>
            {pausado ? <Play size={12} /> : <Pause size={12} />} {pausado ? 'Continuar' : 'Pausar'}
          </button>
        </div>
      )}
      <ul>
        {ordenados.map((l) => {
          const linkLeao = l.maps || l.instagram || l.whatsapp
          return (
            <li key={l.id} className="border-t border-white/5 first:border-t-0 px-5 py-4 space-y-3">
              <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                <div className="min-w-[10rem] flex-1">
                  <div className="text-white font-medium flex flex-wrap items-center gap-2">
                    {l.nome}
                    {l.demo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300">DEMO</span>}
                  </div>
                  <div className="text-xs text-slate-500">{l.endereco}</div>
                  <div className="text-sm font-mono text-slate-300 mt-0.5">{l.telefone}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <SeloContato c={contato[l.id]} />
                  {!l.demo && <Selo c={l.conferencia || { status: 'pendente' }} />}
                </div>
              </div>
              {!l.demo && (!contato[l.id] || contato[l.id].manual || contato[l.id].status === 'site_feito') && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500">Já falou com ele fora do Tigre?</span>
                  {[
                    ['contatado', 'Já mandei mensagem'],
                    ['recusou', 'Não quer site ainda'],
                  ].map(([st, rotulo]) => (
                    <button
                      key={st}
                      className={`btn-ghost border !py-1 !px-2 text-xs ${contato[l.id]?.status === st ? 'border-neon/50 text-neon' : 'border-white/10'}`}
                      onClick={() => marcarContato(l, contato[l.id]?.status === st ? null : st)}
                    >
                      {rotulo}
                    </button>
                  ))}
                </div>
              )}
              {['tem', 'provavel'].includes(l.conferencia?.status) && (
                <div className="space-y-1">
                  {(l.conferencia.evidencias || []).map((e) => (
                    <a key={e.url} href={e.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-slate-300 hover:text-white">
                      <Globe size={13} className={e.tipo === 'dominio' ? 'text-rose-300' : 'text-amber-300'} />
                      <span className="text-slate-500">{e.tipo === 'dominio' ? 'Site com o nome:' : 'Site com o mesmo telefone:'}</span>
                      <span className="truncate">{e.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                    </a>
                  ))}
                  {l.conferencia.status === 'provavel' && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button className="btn-ghost border border-white/10 !py-1 !px-2 text-xs" onClick={() => atualizarLead(l.id, () => ({ conferencia: { ...l.conferencia, status: 'tem' } }))}>
                        É o site dele
                      </button>
                      <button className="btn-ghost border border-white/10 !py-1 !px-2 text-xs" onClick={() => atualizarLead(l.id, () => ({ conferencia: { ...l.conferencia, status: 'nao' }, confianca: 'Alto' }))}>
                        Não é — não tem site
                      </button>
                    </div>
                  )}
                </div>
              )}
              {l.conferencia?.status === 'erro' && (
                <button className="btn-ghost border border-white/10 !py-1 !px-2 text-xs" onClick={() => atualizarLead(l.id, () => ({ conferencia: { status: 'pendente' } }))}>
                  Conferir de novo
                </button>
              )}

              <div className="space-y-1.5">
                <LinhaLink icone={MapPin} cor="text-sky-400" rotulo="Google Maps" href={l.maps} />
                {l.instagram ? (
                  <LinhaLink icone={Instagram} cor="text-pink-400" rotulo="Instagram" href={l.instagram} />
                ) : (
                  <LinhaLink icone={Search} cor="text-pink-400/60" rotulo="Instagram" href={linkBuscaInstagram(l.nome, cidadeDe(l.endereco))} busca />
                )}
                <LinhaLink icone={MessageCircle} cor="text-emerald-400" rotulo="WhatsApp" href={l.whatsapp} />
              </div>

              {linkLeao && l.conferencia?.status !== 'tem' && (
                <button
                  type="button"
                  onClick={() => navigate(`/agente/leao?link=${encodeURIComponent(linkLeao)}`)}
                  className="btn-ghost border border-neon/30 text-neon hover:bg-neon/10"
                >
                  Mandar pro 🦁 Leão <ArrowRight size={16} />
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// Negócios que o Google Maps já mostra com site (ficam fora dos leads).
export function JaTemSite() {
  const { comSite = [] } = usePipeline()
  const [aberto, setAberto] = useState(false)
  if (!comSite.length) return null
  return (
    <div className="glass overflow-hidden">
      <button className="flex w-full items-center gap-2 px-5 py-3 text-left" onClick={() => setAberto(!aberto)}>
        <Globe size={16} className="text-rose-300" />
        <h3 className="font-display font-semibold text-white">Já têm site</h3>
        <span className="text-xs text-slate-400">{comSite.length} negócio(s) — fora dos leads</span>
        <span className="ml-auto text-xs text-slate-400">{aberto ? 'esconder' : 'ver'}</span>
      </button>
      {aberto && (
        <ul>
          {comSite.map((c) => (
            <li key={c.id || c.nome} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/5 px-5 py-3 text-sm">
              <span className="font-medium text-white">{c.nome}</span>
              <span className="text-xs text-slate-500">{c.motivo}</span>
              <a href={c.site} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs text-slate-300 hover:text-neon">
                <ExternalLink size={12} /> {String(c.site).replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
