import { useEffect, useMemo, useRef, useState } from 'react'
import { Monitor, Smartphone, CheckCircle2, Download, Loader2, ExternalLink, Eye, Video, X, Plus, GraduationCap, LayoutList, PenLine } from 'lucide-react'
import { TEMAS } from '../lib/ClienteSite.jsx'
import { gerarZipFinal, gravarVideoPrevia, SEM_DOWNLOAD } from '../services/agents.js'
import { setPipeline } from '../store/pipeline.js'
import { fotosEmDataUrl, htmlDaPrevia, SANDBOX_PREVIA } from '../lib/previa.jsx'

function marcarSite(siteId, campos) {
  if (!siteId) return
  setPipeline((s) => ({ sites: s.sites.map((x) => (x.id === siteId ? { ...x, ...campos } : x)) }))
}

// Prévia ao vivo do site (mesmo componente que vai no ZIP) + aprovação obrigatória antes do ZIP final.
export default function GatoPreview({ preview }) {
  const [tema, setTema] = useState(preview.dados.tema)
  const [conteudo, setConteudo] = useState(preview.dados.conteudo || {})
  const [device, setDevice] = useState('desktop')
  const [fotosUrl, setFotosUrl] = useState(null)
  const [aprovado, setAprovado] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [entregue, setEntregue] = useState(null)
  const [gravando, setGravando] = useState(false)
  const [video, setVideo] = useState(null) // { url, tipo, tamanho }
  const [erroVideo, setErroVideo] = useState(null)
  const videoUrl = useRef(null)
  useEffect(() => () => videoUrl.current && URL.revokeObjectURL(videoUrl.current), [])

  useEffect(() => {
    let vivo = true
    fotosEmDataUrl(preview.fotos).then((urls) => {
      if (vivo) setFotosUrl(urls)
    })
    return () => {
      vivo = false
    }
  }, [preview])

  // A prévia espera você parar de digitar (cada atualização recarrega o site no quadro).
  const [conteudoPrevia, setConteudoPrevia] = useState(conteudo)
  useEffect(() => {
    const t = setTimeout(() => setConteudoPrevia(conteudo), 500)
    return () => clearTimeout(t)
  }, [conteudo])

  const srcDoc = useMemo(
    () => (fotosUrl ? htmlDaPrevia({ ...preview.dados, tema, conteudo: conteudoPrevia }, fotosUrl) : ''),
    [preview, tema, conteudoPrevia, fotosUrl],
  )

  function desaprovar() {
    if (aprovado) {
      setAprovado(false)
      setEntregue(null)
      setVideo(null)
      marcarSite(preview.siteId, { status: 'preview' })
    }
  }

  function trocarTema(t) {
    setTema(t)
    desaprovar() // mudou o visual: precisa aprovar de novo
  }

  // Editar um campo = você assumiu o texto: ele deixa de ser "sugestão do Gato".
  function editar(campo, valor) {
    setConteudo((c) => ({ ...c, [campo]: valor, sugerido: (c.sugerido || []).filter((x) => x !== campo) }))
    desaprovar()
  }

  function aprovar() {
    setAprovado(true)
    marcarSite(preview.siteId, { status: 'aprovado', tema, aprovadoEm: new Date().toISOString() })
  }

  async function baixarFinal() {
    setGerando(true)
    try {
      const r = await gerarZipFinal(preview, tema, conteudo)
      setEntregue(r)
      marcarSite(preview.siteId, { zipFinal: r.nomeZip })
    } finally {
      setGerando(false)
    }
  }

  async function gravar() {
    setGravando(true)
    setErroVideo(null)
    try {
      const blob = await gravarVideoPrevia(srcDoc, preview.siteId)
      if (videoUrl.current) URL.revokeObjectURL(videoUrl.current)
      videoUrl.current = URL.createObjectURL(blob)
      setVideo({ url: videoUrl.current, tipo: blob.type, tamanho: blob.size })
    } catch (e) {
      setErroVideo(e.message)
    } finally {
      setGravando(false)
    }
  }

  const nomeVideo = `previa-${preview.dados.slug || 'site'}.${video?.tipo.includes('mp4') ? 'mp4' : 'webm'}`

  return (
    <section className="glass overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-white/5">
        <h3 className="flex items-center gap-2 font-display font-semibold text-white">
          <Eye size={18} className="text-neon" /> Prévia ao vivo
        </h3>
        {preview.dados.demo && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300">DEMO</span>
        )}
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 p-1">
          <button
            className={`btn-ghost !px-2 !py-1 ${device === 'desktop' ? 'bg-white/10 text-white' : ''}`}
            onClick={() => setDevice('desktop')}
            title="Computador"
          >
            <Monitor size={16} />
          </button>
          <button
            className={`btn-ghost !px-2 !py-1 ${device === 'mobile' ? 'bg-white/10 text-white' : ''}`}
            onClick={() => setDevice('mobile')}
            title="Celular"
          >
            <Smartphone size={16} />
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 flex flex-wrap gap-2">
        {Object.entries(TEMAS).map(([id, t]) => (
          <button
            key={id}
            onClick={() => trocarTema(id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              tema === id ? 'border-neon bg-neon/10 text-white' : 'border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {t.nome}
          </button>
        ))}
      </div>

      <div className="p-5">
        <div
          className="mx-auto overflow-hidden rounded-xl border border-white/10 bg-white transition-all"
          style={{ maxWidth: device === 'mobile' ? 390 : '100%' }}
        >
          {srcDoc ? (
            <iframe title="Prévia do site" srcDoc={srcDoc} sandbox={SANDBOX_PREVIA} className="block w-full h-[640px]" />
          ) : (
            <div className="grid h-[640px] place-items-center text-slate-500">
              <Loader2 className="animate-spin" />
            </div>
          )}
        </div>
      </div>

      <EditorConteudo conteudo={conteudo} editar={editar} />

      {preview.secoes?.length > 0 && (
        <div className="px-5 pb-4">
          <div className="label flex items-center gap-1.5"><LayoutList size={14} /> Seções que os cursos e modelos recomendam</div>
          <ul className="flex flex-wrap gap-2">
            {preview.secoes.map((x) => (
              <li
                key={x.id}
                title={x.fontes.join('\n')}
                className={`text-xs px-2.5 py-1 rounded-full border ${x.temos ? 'border-emerald-400/30 text-emerald-300' : 'border-amber-400/30 text-amber-300'}`}
              >
                {x.temos ? '✓' : '…'} {x.nome} · {x.vezes} fonte(s){x.temos ? '' : ' — precisa de dado real'}
              </li>
            ))}
          </ul>
        </div>
      )}

      {preview.cursos?.length > 0 && (
        <div className="px-5 pb-4">
          <div className="label flex items-center gap-1.5"><GraduationCap size={14} /> Cursos e tutoriais estudados</div>
          <ul className="space-y-1">
            {preview.cursos.map((c) => (
              <li key={c.url}>
                <a href={c.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-neon">
                  <ExternalLink size={13} /> {c.titulo}
                  {c.fonte && <span className="text-xs text-slate-500">· {c.fonte}</span>}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {preview.referencias.length > 0 && (
        <div className="px-5 pb-4">
          <div className="label">Modelos de sites profissionais estudados</div>
          <ul className="space-y-1">
            {preview.referencias.map((r) => (
              <li key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm text-slate-300 hover:text-neon">
                  <ExternalLink size={13} /> {r.titulo}
                  {r.fonte && <span className="text-xs text-slate-500">· {r.fonte}</span>}
                </a>
                {r.descricao && <p className="ml-5 text-xs text-slate-500 line-clamp-2">{r.descricao}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 p-5 border-t border-white/5">
        {!aprovado ? (
          <button onClick={aprovar} disabled={!srcDoc} className="btn-primary flex-1">
            <CheckCircle2 size={20} /> Aprovar prévia
          </button>
        ) : (
          <>
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2 size={18} /> Prévia aprovada · tema {TEMAS[tema].nome}
            </div>
            <button onClick={baixarFinal} disabled={gerando} className="btn-primary flex-1">
              {gerando ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
              {SEM_DOWNLOAD ? 'Gerar ZIP final' : 'Baixar ZIP final'}
            </button>
          </>
        )}
      </div>
      {entregue && (
        <p className="px-5 pb-5 -mt-2 text-xs text-slate-400">
          {SEM_DOWNLOAD ? 'Gerado e guardado aqui (o download só funciona na versão com servidor): ' : 'Entregue: '}
          <span className="font-mono text-slate-300">{entregue.nomeZip}</span> ({(entregue.tamanho / 1024).toFixed(0)} KB)
        </p>
      )}
      {!aprovado && (
        <p className="px-5 pb-5 -mt-2 text-xs text-slate-500">O ZIP final só é liberado depois da sua aprovação.</p>
      )}

      {aprovado && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
          <div className="label">Vídeo da prévia para o cliente</div>
          <p className="text-xs text-slate-400">
            Grava ~12 s do site rolando, em formato de celular (MP4), para mandar no WhatsApp. O Tigre também consegue enviar.
          </p>
          <button onClick={gravar} disabled={gravando || !srcDoc} className="btn-ghost border border-white/10">
            {gravando ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
            {gravando ? 'Gravando… (uns 15 segundos)' : video ? 'Gravar de novo' : 'Gravar vídeo da prévia'}
          </button>
          {video && (
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <video src={video.url} controls playsInline className="w-48 rounded-xl border border-white/10 bg-black" />
              <div className="space-y-2 text-sm">
                <a href={video.url} download={nomeVideo} className="btn-ghost border border-white/10">
                  <Download size={16} /> Baixar vídeo ({(video.tamanho / 1024 / 1024).toFixed(1)} MB)
                </a>
                <p className="text-xs text-slate-500">Também ficou guardado para o 🐯 Tigre enviar.</p>
              </div>
            </div>
          )}
          {erroVideo && <p className="text-sm text-rose-300">{erroVideo}</p>}
        </div>
      )}
    </section>
  )
}

// Conteúdo do site antes da aprovação. Os campos com "sugestão" vieram do típico do segmento (não são fatos do
// negócio): confira com o cliente, edite ou apague. A Abelha troca pelo dado real quando encontra.
function EditorConteudo({ conteudo, editar }) {
  const sugerido = conteudo.sugerido || []
  const Selo = ({ campo }) =>
    sugerido.includes(campo) ? (
      <span className="ml-2 rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-normal normal-case tracking-normal text-amber-300">sugestão — confira</span>
    ) : null
  return (
    <div className="px-5 pb-5 space-y-4">
      <div className="label flex items-center gap-1.5"><PenLine size={14} /> Conteúdo do site (edite antes de aprovar)</div>
      <div>
        <div className="label">Sobre <Selo campo="sobre" /></div>
        <textarea rows={3} className="input" value={conteudo.sobre || ''} onChange={(e) => editar('sobre', e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Lista titulo="Serviços" campo="servicos" itens={conteudo.servicos || []} editar={editar} selo={<Selo campo="servicos" />} />
        <Lista titulo="Diferenciais" campo="diferenciais" itens={conteudo.diferenciais || []} editar={editar} selo={<Selo campo="diferenciais" />} />
        <Lista titulo="Como funciona (passos)" campo="passos" itens={conteudo.passos || []} editar={editar} selo={<Selo campo="passos" />} />
        <div>
          <div className="label">Perguntas frequentes <Selo campo="faq" /></div>
          <ul className="space-y-1.5">
            {(conteudo.faq || []).map((f, i) => (
              <li key={f.p} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="flex-1"><b className="text-white">{f.p}</b> {f.r}</span>
                <button className="btn-ghost !p-1" title="Tirar" onClick={() => editar('faq', conteudo.faq.filter((_, j) => j !== i))}><X size={14} /></button>
              </li>
            ))}
            {!(conteudo.faq || []).length && <li className="text-xs text-slate-500">Seção escondida.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}

function Lista({ titulo, campo, itens, editar, selo }) {
  const [novo, setNovo] = useState('')
  const adicionar = () => {
    const v = novo.trim()
    if (v && !itens.includes(v)) editar(campo, [...itens, v])
    setNovo('')
  }
  return (
    <div>
      <div className="label">{titulo} {selo}</div>
      <ul className="flex flex-wrap gap-1.5">
        {itens.map((x) => (
          <li key={x} className="inline-flex items-center gap-1 rounded-full border border-white/10 py-0.5 pl-2.5 pr-1 text-xs text-slate-200">
            {x}
            <button className="rounded-full p-0.5 hover:bg-white/10" title="Tirar" onClick={() => editar(campo, itens.filter((y) => y !== x))}><X size={12} /></button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input className="input !py-1.5 text-sm" placeholder="Adicionar…" value={novo} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && adicionar()} />
        <button className="btn-ghost border border-white/10 !px-2" onClick={adicionar} title="Adicionar"><Plus size={16} /></button>
      </div>
    </div>
  )
}
