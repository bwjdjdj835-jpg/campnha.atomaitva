import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Monitor, Smartphone, CheckCircle2, Download, RefreshCw, Search, Sparkles, AlertTriangle } from 'lucide-react'
import { usePipeline, setPipeline } from '../store/pipeline.js'
import MenteAgente from '../components/MenteAgente.jsx'
import { lembrar } from '../lib/mentes.js'
import { fotosEmDataUrl, htmlDaPrevia, SANDBOX_PREVIA } from '../lib/previa.jsx'
import { gerarZipFinal, SEM_DOWNLOAD } from '../services/agents.js'
import {
  MAX_REFERENCIAS,
  abrirPacoteDoSite,
  conteudoParaEscorpiao,
  gerarSiteEscorpiao,
  lerReferencias,
  linksColados,
  modeloDaEspecialidade,
  modelosDoEscorpiao,
  salvarModelo,
} from '../lib/escorpiao.js'

function marcarSite(siteId, campos) {
  if (!siteId) return
  setPipeline((s) => ({ sites: s.sites.map((x) => (x.id === siteId ? { ...x, ...campos } : x)) }))
}

// 🦂 Escorpião — agente SOLO (fora do automático): pega um site já montado pelos agentes, a especialidade e até 3 sites de
// referência de interatividade, e finaliza um site interativo de agência. Prévia + "Aprovar" obrigatório antes do ZIP final.
export default function Escorpiao() {
  const estado = usePipeline()
  const sites = (estado.sites || []).filter((s) => s.status !== 'descartado')
  const modelos = modelosDoEscorpiao(estado)

  const [siteId, setSiteId] = useState('')
  const [pacote, setPacote] = useState(null) // { dados, fotos, prints, origem }
  const [abrindo, setAbrindo] = useState(false)
  const [especialidade, setEspecialidade] = useState('')
  const [links, setLinks] = useState('')
  const [referencias, setReferencias] = useState(null)
  const [lendo, setLendo] = useState(false)
  const [gerado, setGerado] = useState(null) // { html, ia }
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState(null)
  const [fotosUrl, setFotosUrl] = useState(null)
  const [device, setDevice] = useState('celular')
  const [aprovado, setAprovado] = useState(false)
  const [entregue, setEntregue] = useState(null)
  const [empacotando, setEmpacotando] = useState(false)
  const [temIA, setTemIA] = useState(null)

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => setTemIA(Boolean(d.keys?.escorpiao)))
      .catch(() => setTemIA(false))
  }, [])

  // Escolheu a especialidade: se já tem modelo guardado, os links e as referências lidas voltam sozinhos.
  function usarEspecialidade(nome) {
    setEspecialidade(nome)
    const m = modeloDaEspecialidade(nome)
    if (m) {
      setLinks(m.links.join('\n'))
      setReferencias(m.referencias)
    }
  }

  async function escolherSite(id) {
    setSiteId(id)
    setPacote(null)
    setGerado(null)
    setAprovado(false)
    setEntregue(null)
    setErro(null)
    setFotosUrl(null)
    if (!id) return
    setAbrindo(true)
    try {
      const p = await abrirPacoteDoSite(sites.find((s) => s.id === id))
      setPacote(p)
      setFotosUrl(await fotosEmDataUrl(p.fotos))
      if (!especialidade) usarEspecialidade(p.dados.negocio?.categoria || '')
    } catch (e) {
      setErro(e.message)
    } finally {
      setAbrindo(false)
    }
  }

  async function lerRefs() {
    const lista = linksColados(links).slice(0, MAX_REFERENCIAS)
    setLendo(true)
    setErro(null)
    try {
      const refs = await lerReferencias(lista)
      setReferencias(refs)
      if (especialidade.trim() && refs.some((r) => !r.erro)) salvarModelo(especialidade, lista, refs)
    } catch (e) {
      setErro(e.message)
    } finally {
      setLendo(false)
    }
  }

  async function gerar() {
    setGerando(true)
    setErro(null)
    setAprovado(false)
    setEntregue(null)
    try {
      const conteudo = conteudoParaEscorpiao(pacote.dados)
      const r = await gerarSiteEscorpiao(pacote.dados, conteudo, especialidade.trim(), (referencias || []).filter((x) => !x.erro))
      setGerado({ ...r, conteudo })
    } catch (e) {
      setErro(e.message)
    } finally {
      setGerando(false)
    }
  }

  const dadosFinais = useMemo(() => (pacote && gerado ? { ...pacote.dados, conteudo: gerado.conteudo, htmlProprio: gerado.html } : null), [pacote, gerado])
  const srcDoc = useMemo(() => (dadosFinais && fotosUrl ? htmlDaPrevia(dadosFinais, fotosUrl) : ''), [dadosFinais, fotosUrl])

  function aprovar() {
    setAprovado(true)
    marcarSite(siteId, { status: 'aprovado', escorpiao: especialidade.trim(), aprovadoEm: new Date().toISOString() })
    lembrar('escorpiao', `Site aprovado: ${pacote.dados.negocio?.nome || 'site'} (especialidade ${especialidade.trim()}, ${referencias?.filter((r) => !r.erro).length || 0} referência(s))`)
  }

  async function baixarFinal() {
    setEmpacotando(true)
    try {
      const preview = { ...pacote, siteId, referencias: (referencias || []).filter((r) => !r.erro), cursos: [] }
      const r = await gerarZipFinal(preview, pacote.dados.tema || 'noite', gerado.conteudo, pacote.dados.modelo, true, {
        htmlProprio: gerado.html,
        gerador: `Escorpião (${especialidade.trim()}) — Central de Agentes`,
      })
      setEntregue(r)
      marcarSite(siteId, { zipFinal: r.nomeZip })
    } catch (e) {
      setErro(e.message)
    } finally {
      setEmpacotando(false)
    }
  }

  const nLinks = linksColados(links).length
  const refsOk = (referencias || []).filter((r) => !r.erro)

  return (
    <div className="space-y-6">
      <section className="glass circuit-bg p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-5xl leading-none" aria-hidden="true">🦂</span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-mono tracking-[0.3em] text-neon">🦂 ESCORPIÃO · AGENTE SOLO</div>
            <h1 className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">Site interativo por especialidade</h1>
            <p className="mt-1 text-sm text-slate-400">
              Fora do automático. Escolha um site que os agentes já montaram, diga a especialidade e cole até 3 sites de referência de
              interatividade: o Escorpião finaliza um site de agência só para aquele ramo, com os dados reais do comércio.
            </p>
          </div>
        </div>
      </section>

      <MenteAgente agente="escorpiao" />

      {temIA === false && (
        <div className="glass flex items-start gap-2 border-amber-400/30 p-4 text-sm text-amber-200">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" /> Configure a GROQ_API_KEY no servidor para o Escorpião gerar o site.
        </div>
      )}

      <section className="glass space-y-3 p-5">
        <div className="font-display font-semibold text-white">1. Site dos agentes</div>
        {sites.length ? (
          <select className="input" value={siteId} onChange={(e) => escolherSite(e.target.value)}>
            <option value="">Escolha um site montado pelo Leão / Gato</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
                {s.demo ? ' (DEMO)' : ''}
                {s.escorpiao ? ` · 🦂 ${s.escorpiao}` : ''}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-slate-400">
            Nenhum site montado ainda. Monte um pelo <Link to="/agente/leao" className="text-neon">🦁 Leão</Link> primeiro.
          </p>
        )}
        {abrindo && (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" /> Abrindo o pacote do site…
          </p>
        )}
        {pacote && (
          <p className="text-sm text-slate-300">
            ✓ {pacote.dados.negocio?.nome}
            {pacote.dados.demo ? ' (DEMO)' : ''} · {pacote.fotos.length} foto(s) · {pacote.dados.negocio?.categoria || 'sem ramo'} · aberto do {pacote.origem}
          </p>
        )}
      </section>

      <section className="glass space-y-3 p-5">
        <div className="font-display font-semibold text-white">2. Especialidade e sites de referência</div>
        {Object.keys(modelos).length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-400">Especialidades que eu já sei:</span>
            {Object.values(modelos).map((m) => (
              <button key={m.especialidade} className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-neon/15" onClick={() => usarEspecialidade(m.especialidade)}>
                🦂 {m.especialidade}
              </button>
            ))}
          </div>
        )}
        <label className="block">
          <span className="label">Especialidade (um nicho só)</span>
          <input className="input" placeholder="ex: barbearia" value={especialidade} onChange={(e) => usarEspecialidade(e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Até 3 sites de referência de interatividade (um por linha)</span>
          <textarea
            className="input min-h-[96px]"
            placeholder={'https://site-interativo-1.com\nhttps://site-interativo-2.com\nhttps://site-interativo-3.com'}
            value={links}
            onChange={(e) => setLinks(e.target.value)}
          />
        </label>
        {nLinks > MAX_REFERENCIAS && <p className="text-xs text-amber-300">Você colou {nLinks} links — eu leio os {MAX_REFERENCIAS} primeiros.</p>}
        <button className="btn-ghost border border-white/10 text-sm" onClick={lerRefs} disabled={lendo || !nLinks}>
          {lendo ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Estudar as referências
        </button>
        {referencias && (
          <ul className="space-y-2">
            {referencias.map((r) => (
              <li key={r.url} className="rounded-xl bg-black/20 p-3 text-sm">
                <div className="truncate font-medium text-white">{r.titulo || r.url}</div>
                {r.erro ? (
                  <div className="text-xs text-red-300">Não consegui ler: {r.erro}</div>
                ) : (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(r.tecnicas.length ? r.tecnicas : ['nenhuma técnica reconhecida no código']).map((t) => (
                      <span key={t} className="rounded-full bg-neon/10 px-2 py-0.5 text-[11px] text-neon">
                        {t}
                      </span>
                    ))}
                    {r.fontes.map((f) => (
                      <span key={f} className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                        Aa {f}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="glass space-y-3 p-5">
        <div className="font-display font-semibold text-white">3. Finalizador especial</div>
        <button className="btn-primary !py-2 !px-4 text-sm" onClick={gerar} disabled={!pacote || !especialidade.trim() || gerando || temIA === false}>
          {gerando ? <Loader2 size={16} className="animate-spin" /> : gerado ? <RefreshCw size={16} /> : <Sparkles size={16} />}{' '}
          {gerando ? 'Criando o site…' : gerado ? 'Gerar de novo' : `Criar o site${refsOk.length ? ` com ${refsOk.length} referência(s)` : ''}`}
        </button>
        {!refsOk.length && pacote && <p className="text-xs text-slate-400">Sem referências lidas, uso o padrão de agência do ramo.</p>}
        {erro && <p className="text-sm text-red-300">❌ {erro}</p>}

        {srcDoc && (
          <>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="flex-1 text-slate-400">Feito por {gerado.ia}</span>
              <button className={`btn-ghost text-sm ${device === 'celular' ? 'text-neon' : ''}`} onClick={() => setDevice('celular')}>
                <Smartphone size={16} /> Celular
              </button>
              <button className={`btn-ghost text-sm ${device === 'desktop' ? 'text-neon' : ''}`} onClick={() => setDevice('desktop')}>
                <Monitor size={16} /> Computador
              </button>
            </div>
            <div className={`mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black ${device === 'celular' ? 'max-w-[390px]' : ''}`}>
              <iframe title="Prévia do site do Escorpião" srcDoc={srcDoc} sandbox={SANDBOX_PREVIA} className="block h-[720px] w-full" />
            </div>
            {!aprovado ? (
              <button className="btn-primary !py-2 !px-4 text-sm" onClick={aprovar}>
                <CheckCircle2 size={16} /> Aprovar prévia
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 text-sm text-emerald-300">
                  <CheckCircle2 size={18} /> Prévia aprovada
                </span>
                <button className="btn-primary !py-2 !px-4 text-sm" onClick={baixarFinal} disabled={empacotando}>
                  {empacotando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {SEM_DOWNLOAD ? 'Guardar ZIP final' : 'Baixar ZIP final'}
                </button>
                {entregue && <span className="text-sm text-slate-300">✓ {entregue.nomeZip} (o 🐯 Tigre publica esta versão)</span>}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}
