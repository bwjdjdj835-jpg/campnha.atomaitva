import { useEffect, useMemo, useRef, useState } from 'react'
import { Monitor, Smartphone, CheckCircle2, Download, Loader2, ExternalLink, Eye, Video } from 'lucide-react'
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

  const srcDoc = useMemo(
    () => (fotosUrl ? htmlDaPrevia({ ...preview.dados, tema }, fotosUrl) : ''),
    [preview, tema, fotosUrl],
  )

  function trocarTema(t) {
    setTema(t)
    if (aprovado) {
      setAprovado(false) // mudou o visual: precisa aprovar de novo
      setEntregue(null)
      setVideo(null)
      marcarSite(preview.siteId, { status: 'preview' })
    }
  }

  function aprovar() {
    setAprovado(true)
    marcarSite(preview.siteId, { status: 'aprovado', tema, aprovadoEm: new Date().toISOString() })
  }

  async function baixarFinal() {
    setGerando(true)
    try {
      const r = await gerarZipFinal(preview, tema)
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

      {preview.referencias.length > 0 && (
        <div className="px-5 pb-4">
          <div className="label">Referências estudadas</div>
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
