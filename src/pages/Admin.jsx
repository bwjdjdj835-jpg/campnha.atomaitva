import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldCheck, CheckCircle2, Play, Inbox, Ban, Video, Upload, MonitorPlay, Copy, Download, Share2, Eye, EyeOff, RefreshCw, Trash2, Loader2, MessageCircle, Bot, ExternalLink, Send } from 'lucide-react'
import { usePipeline, setPipeline } from '../store/pipeline.js'
import { videoDoSite, guardarVideo, negocioDoSite, rascunho, lerPacoteLeao, gravarVideoPrevia, abrirPastaDoVideo } from '../services/agents.js'
import { lerZip } from '../lib/zipStore.js'
import { gravarNaNuvem } from '../services/videoNuvem.js'
import { conectarZap, buscarRespostas } from '../services/zapWeb.js'
import { tigreExecutar, tigreResponder, estrategiaDoTigre } from '../services/tigreTrabalho.js'
import { fotosEmDataUrl, htmlDaPrevia, SANDBOX_PREVIA, videoAceitoNoWhatsApp, CSS_GRAVACAO } from '../lib/previa.jsx'
import { SELO_CONTATO } from '../lib/contato.js'
import { lerResposta, registrarEnviada, outraSugestao, esperandoVoce, marcarVenda } from '../services/tigreConversa.js'
import { NICHOS_PADRAO, proximoNicho, prepararInicio, conferirProntos, nichoEmAndamento, videoManualNasOpcoes } from '../services/automatico.js'
import { lerOpcoes } from './Automatico.jsx'
import MenteAgente from '../components/MenteAgente.jsx'
import { lembrar } from '../lib/mentes.js'

// 🛡️ Aranha Administradora: tudo o que a IA fez no modo automático passa por aqui.
// Você confere o vídeo da prévia e a mensagem de cada cliente, aprova e manda pelo seu WhatsApp. Nada sai sozinho.

const marcarSite = (id, campos) => setPipeline((s) => ({ sites: s.sites.map((x) => (x.id === id ? { ...x, ...campos } : x)) }))
function atualizarConversa(siteId, fn) {
  setPipeline((s) => {
    const atual = s.conversas?.[siteId] || { status: 'novo', mensagens: [] }
    return { conversas: { ...s.conversas, [siteId]: { ...atual, ...fn(atual) } } }
  })
}
// wa.me precisa do DDI 55.
const foneWhats = (n) => {
  const d = String(n.whatsapp || n.telefone || '').replace(/\D/g, '')
  return d.length === 10 || d.length === 11 ? `55${d}` : d
}

export default function Admin() {
  const { sites, leads, conversas = {} } = usePipeline()
  const [aba, setAba] = useState('aprovar')
  const navigate = useNavigate()
  const [iniciando, setIniciando] = useState(false)
  const [videoServidor, setVideoServidor] = useState(false)
  const [videoNuvem, setVideoNuvem] = useState(false)
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => {
        setVideoServidor(Boolean(d.keys?.videoServidor))
        setVideoNuvem(Boolean(d.keys?.videoNuvem))
      })
      .catch(() => {})
  }, [])
  // Um nicho por vez: o próximo só começa depois que você aprova (ou descarta) todos os clientes do nicho atual.
  const opcoesAuto = lerOpcoes()
  const proximo = proximoNicho((opcoesAuto.nichos || NICHOS_PADRAO.join('\n')).split('\n').map((n) => n.trim()).filter(Boolean))
  async function comecarProximo() {
    setIniciando(true)
    await prepararInicio({ videoServidor, manual: videoManualNasOpcoes() })
    navigate('/automatico?iniciar=1')
  }
  async function gravarQueFaltam() {
    setIniciando(true)
    await prepararInicio({ videoServidor })
    navigate('/automatico?regravar=1')
  }
  const paraAprovar = sites.filter((s) => s.status === 'revisar')
  const preparando = sites.filter((s) => s.status === 'preparando').length
  const semVideo = sites.filter((s) => s.status === 'sem_video')
  // Só fica em "Para aprovar" quem tem vídeo e mensagem; os antigos sem vídeo vão para "Falta o vídeo".
  useEffect(() => {
    conferirProntos()
  }, [])
  // Conversas: quem está esperando a sua resposta vem primeiro, depois a mais recente.
  const ultimaEm = (s) => conversas[s.id]?.mensagens?.at(-1)?.at || ''
  const enviados = sites
    .filter((s) => conversas[s.id]?.mensagens?.some((m) => m.de === 'nos'))
    .sort((a, b) => esperandoVoce(conversas[b.id]) - esperandoVoce(conversas[a.id]) || ultimaEm(b).localeCompare(ultimaEm(a)))
  const esperando = enviados.filter((s) => esperandoVoce(conversas[s.id])).length
  const conta = (...st) => sites.filter((s) => st.includes(conversas[s.id]?.status)).length
  const numeros = [
    ['Para aprovar', paraAprovar.length, 'text-neon'],
    ['Aguardando resposta', conta('contatado', 'bot', 'duvida'), 'text-sky-300'],
    ['Interessados', conta('interessado', 'fechando', 'pagou'), 'text-emerald-300'],
    ['Não querem agora', conta('recusou'), 'text-orange-300'],
    ['Vendas', conta('vendido', 'publicado'), 'text-emerald-200'],
  ]

  return (
    <div className="space-y-6">
      <section className="glass circuit-bg p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-5xl leading-none" aria-hidden="true">🕷️</span>
          <div className="flex-1 min-w-[14rem]">
            <div className="text-xs font-mono tracking-[0.3em] text-neon">🕷️ ARANHA ADMINISTRADORA · ÚLTIMO AGENTE</div>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-white">Confirme o que os agentes fizeram</h1>
            <p className="mt-1 text-sm text-slate-400">
              Confira o vídeo e a mensagem de cada cliente. Aprovou → abre o seu WhatsApp com a mensagem pronta. Nada é enviado sem você.
            </p>
          </div>
          <Link to="/automatico" className="btn-ghost border border-white/10 text-sm">
            <Bot size={16} /> Modo automático
          </Link>
        </div>
      </section>

      <MenteAgente agente="aranha" />

      <section className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {numeros.map(([rotulo, n, cor]) => (
          <div key={rotulo} className="glass p-4">
            <div className={`font-display text-2xl font-bold tabular-nums ${cor}`}>{n}</div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400">{rotulo}</div>
          </div>
        ))}
      </section>

      <div className="flex gap-2">
        {[
          ['aprovar', `Para aprovar (${paraAprovar.length})`],
          ['enviados', `Conversas (${enviados.length})${esperando ? ` · 🔔 ${esperando} sua vez` : ''}`],
        ].map(([id, rotulo]) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`btn-ghost border text-sm ${aba === id ? 'border-neon/50 text-neon bg-neon/10' : 'border-white/10'}`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {aba === 'aprovar' && (
        <div className="space-y-4">
          <RelatorioRodada />
          {semVideo.length > 0 && (
            <div className="glass border-amber-400/30 p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Video size={18} className="text-amber-300" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white">Falta o vídeo ({semVideo.length})</div>
                  <p className="text-xs text-slate-400">Só entram para aprovação com vídeo e mensagem prontos. O Chrome vai pedir para compartilhar esta aba.</p>
                </div>
                <button className="btn-primary !py-2 !px-4 text-sm" onClick={gravarQueFaltam} disabled={iniciando}>
                  {iniciando ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />} Gravar os vídeos que faltam
                </button>
              </div>
              <ul className="flex flex-wrap gap-2">
                {semVideo.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    {s.nome}
                    <button title="Descartar" className="text-rose-300 hover:text-rose-200" onClick={() => marcarSite(s.id, { status: 'descartado' })}>
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {preparando === 0 && paraAprovar.length === 0 && semVideo.length === 0 && proximo && (
            <div className="glass flex flex-wrap items-center gap-4 border-neon/30 p-5">
              <div className="flex-1 min-w-[14rem]">
                <div className="font-display text-lg font-semibold text-white">Tudo aprovado! ✅</div>
                <p className="text-sm text-slate-400">{nichoEmAndamento(proximo) ? 'Ainda tem comércios sem site em' : 'Próximo nicho da lista:'} <strong className="text-white">{proximo}</strong>. O Chrome vai pedir para compartilhar esta aba (para gravar os vídeos).</p>
              </div>
              <button className="btn-primary text-base py-3 px-5" onClick={comecarProximo} disabled={iniciando}>
                {iniciando ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />} {nichoEmAndamento(proximo) ? 'Continuar' : 'Começar'}: {proximo}
              </button>
            </div>
          )}
          {(paraAprovar.length > 0 || semVideo.length > 0) && proximo && (
            <p className="text-sm text-slate-400">
              Aprove (ou descarte) os {paraAprovar.length + semVideo.length} cliente(s) desta página para liberar o próximo nicho: <strong className="text-slate-200">{proximo}</strong>.
            </p>
          )}
          {preparando === 0 && paraAprovar.length === 0 && semVideo.length === 0 && !proximo && (
            <div className="glass p-5 text-sm text-slate-300">
              🎉 Todos os nichos da lista foram feitos. Para fazer de novo ou trocar a lista,{' '}
              <Link to="/automatico" className="text-neon hover:underline">abra o modo automático</Link>.
            </div>
          )}
          {preparando > 0 && (
            <div className="glass flex items-center gap-2 px-5 py-3 text-sm text-sky-200">
              <Loader2 size={16} className="animate-spin" /> {preparando} cliente(s) sendo preparado(s) pelo automático (vídeo e mensagem)…
            </div>
          )}
          {paraAprovar.map((s) => <CartaoAprovar key={s.id} site={s} negocio={negocioDoSite(s, leads)} conversa={conversas[s.id]} videoServidor={videoServidor} videoNuvem={videoNuvem} />)}
        </div>
      )}

      {aba === 'enviados' && (
        <section className="glass overflow-hidden">
          {enviados.length > 0 && videoServidor && <BuscarRespostas />}
          {enviados.length > 0 && (
            <p className="border-b border-white/5 px-5 py-3 text-xs text-slate-400">
              Quando o cliente responder no WhatsApp, abra a conversa dele aqui e cole a resposta: a Aranha lê, sugere a próxima mensagem e
              vocês seguem conversando até fechar (ou até ele dizer que agora não — aí ela só convida a dar uma olhada na prévia, sem
              compromisso). Todos os agentes veem o selo do comércio.
            </p>
          )}
          {enviados.length === 0 ? (
            <p className="p-10 text-center text-slate-400">Nenhuma mensagem enviada ainda.</p>
          ) : (
            <ul>
              {enviados.map((s) => (
                <ConversaRapida key={s.id} site={s} negocio={negocioDoSite(s, leads)} conversa={conversas[s.id]} videoServidor={videoServidor} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

function CartaoAprovar({ site, negocio, conversa, videoServidor, videoNuvem }) {
  const [video, setVideo] = useState(null) // { blob, url }
  const [texto, setTexto] = useState(conversa?.rascunho || '')
  const [abriu, setAbriu] = useState(false)
  const [previa, setPrevia] = useState(null) // HTML ou 'carregando'
  const [ocupado, setOcupado] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const fone = foneWhats(negocio)

  useEffect(() => {
    let url = null
    videoDoSite(site.id).then((blob) => blob && setVideo({ blob, url: (url = URL.createObjectURL(blob)) }))
    return () => url && URL.revokeObjectURL(url)
  }, [site.id])

  const ext = video?.blob.type.includes('mp4') ? 'mp4' : 'webm'
  const aceito = video && videoAceitoNoWhatsApp(video.blob)
  const nomeArquivo = `previa-${site.nome.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')}.${ext}`
  const arquivo = video && new File([video.blob], nomeArquivo, { type: video.blob.type.split(';')[0] })
  const podeCompartilhar = arquivo && typeof navigator !== 'undefined' && navigator.canShare?.({ files: [arquivo] })
  const [videoFeito, setVideoFeito] = useState(false) // passo 1 (vídeo salvo ou compartilhado)

  // O cartão fica aqui até você confirmar "Já enviei" (aí o site vira aprovado e o cliente vai para "Enviados").
  function aprovar() {
    atualizarConversa(site.id, () => ({ rascunho: texto }))
    setAbriu(true)
  }

  // Salva o vídeo no aparelho (pasta Downloads no computador).
  function salvarVideo() {
    const a = document.createElement('a')
    a.href = video.url
    a.download = nomeArquivo
    a.click()
    setVideoFeito(true)
  }

  // Compartilha SÓ o vídeo: junto com texto, o WhatsApp (principalmente no computador) fica com o texto e larga o vídeo.
  async function compartilharVideo() {
    try {
      await navigator.share({ files: [arquivo] })
      setVideoFeito(true)
    } catch {
      /* cancelado */
    }
  }

  function jaEnviei() {
    const at = new Date().toISOString()
    atualizarConversa(site.id, (c) => ({
      mensagens: [
        ...c.mensagens,
        { de: 'nos', texto, via: 'whatsapp-manual', at },
        ...(video ? [{ de: 'nos', texto: '🎬 Vídeo da prévia', via: 'whatsapp-manual', at }] : []),
      ],
      status: 'contatado',
      rascunho: undefined,
    }))
    marcarSite(site.id, { status: 'aprovado', aprovadoEm: at })
  }

  async function outraMensagem() {
    setOcupado(true)
    try {
      setTexto((await rascunho('primeiro', negocio)).texto)
    } finally {
      setOcupado(false)
    }
  }

  // Abre a prévia numa janela do tamanho de um celular, para gravar com o gravador do Windows (Win + Alt + R).
  // A janela abre no clique (senão o navegador bloqueia) e recebe o site em seguida.
  async function abrirParaGravar() {
    const janela = window.open('about:blank', `previa-${site.id}`, 'width=430,height=900')
    try {
      const p = await lerPacoteLeao(await lerZip(`${site.id}:final`))
      const html = htmlDaPrevia(p.dados, await fotosEmDataUrl(p.fotos), CSS_GRAVACAO, { agua: false })
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
      if (janela) janela.location.href = url
      else window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 120_000)
    } catch {
      janela?.close()
    }
  }

  // App rodando no notebook (iniciar-windows.bat): a Aranha grava sozinha, nítido, e salva em
  // Vídeos\Central de Agentes\<nicho>\. Você não precisa abrir gravador nenhum.
  const [gravando, setGravando] = useState(false)
  const [erroVideo, setErroVideo] = useState(null)
  async function gravarNoNotebook() {
    setGravando(true)
    setErroVideo(null)
    try {
      const p = await lerPacoteLeao(await lerZip(`${site.id}:final`))
      const segundos = Number(lerOpcoes().duracao) || 20
      const blob = videoServidor
        ? await gravarVideoPrevia(htmlDaPrevia(p.dados, await fotosEmDataUrl(p.fotos), CSS_GRAVACAO, { agua: false }), site.id, segundos)
        : await gravarNaNuvem(p, site.id, segundos)
      setVideo((v) => {
        if (v?.url) URL.revokeObjectURL(v.url)
        return { blob, url: URL.createObjectURL(blob) }
      })
    } catch (e) {
      setErroVideo(e.message)
    } finally {
      setGravando(false)
    }
  }
  const abrirPasta = () => abrirPastaDoVideo(site.videoArquivo).catch((e) => setErroVideo(e.message))

  // Vídeo que você gravou no notebook: fica guardado neste navegador junto com o cliente.
  async function enviarVideo(e) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo) return
    await guardarVideo(site.id, arquivo)
    setVideo((v) => {
      if (v?.url) URL.revokeObjectURL(v.url)
      return { blob: arquivo, url: URL.createObjectURL(arquivo) }
    })
    setVideoFeito(false)
  }

  // Direto na conversa do cliente: o "compartilhar" do sistema sempre pede para escolher o contato, e o link do
  // WhatsApp (wa.me) abre o cliente certo mas só leva texto. Então: salva o vídeo e abre a conversa DELE com a
  // mensagem escrita — lá é só anexar o vídeo pelo 📎 (ou arrastar o arquivo para a conversa).
  const [direto, setDireto] = useState(false)
  function mandarDireto() {
    if (site.videoArquivo && videoServidor) abrirPasta()
    else if (video) salvarVideo()
    navigator.clipboard?.writeText(texto).catch(() => {})
    window.open(`https://wa.me/${fone}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
    setDireto(true)
    aprovar()
  }

  // Vídeo + mensagem juntos (como você pediu). A mensagem vai também para a área de transferência: se o WhatsApp
  // ficar só com o vídeo, é só colar (Ctrl + V) na conversa.
  async function compartilharTudo() {
    try {
      await navigator.clipboard?.writeText(texto).catch(() => {})
      await navigator.share({ files: [arquivo], text: texto })
      setVideoFeito(true)
      aprovar()
    } catch {
      /* cancelado */
    }
  }

  async function verPrevia() {
    if (previa) return setPrevia(null)
    setPrevia('carregando')
    try {
      const p = await lerPacoteLeao(await lerZip(`${site.id}:final`))
      setPrevia(htmlDaPrevia(p.dados, await fotosEmDataUrl(p.fotos)))
    } catch {
      setPrevia(null)
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      /* sem permissão: o texto está na caixa para copiar à mão */
    }
  }

  return (
    <article className="glass p-5">
      <div className="flex flex-col md:flex-row gap-5">
        {video ? (
          <video src={video.url} controls playsInline className="w-full md:w-48 rounded-xl border border-white/10 bg-black self-start" />
        ) : (
          <div className="grid w-full md:w-48 h-56 place-items-center rounded-xl border border-dashed border-white/10 px-3 text-center text-xs text-slate-500">
            Sem vídeo ainda — grave e envie abaixo
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h3 className="font-display text-lg font-semibold text-white">{site.nome}</h3>
            <span className="font-mono text-xs text-slate-400">{negocio.telefone || 'sem telefone'}</span>
            {negocio.categoria && <span className="text-xs text-slate-500">{negocio.categoria}</span>}
          </div>
          <ArquivosDosAgentes site={site} temVideo={Boolean(video)} />
          <label className="label" htmlFor={`msg-${site.id}`}>🐯 Mensagem do Tigre (dá para editar)</label>
          <textarea id={`msg-${site.id}`} rows={4} className="input" value={texto} onChange={(e) => setTexto(e.target.value)} />
          {/* 🕷️ Você aprova; o 🐯 Tigre faz o trabalho (grava o vídeo se faltar, manda e registra). */}
          <AprovarTigre
            site={site}
            texto={texto}
            keys={{ videoServidor, videoNuvem }}
            aoVideo={(blob) =>
              setVideo((v) => {
                if (v?.url) URL.revokeObjectURL(v.url)
                return { blob, url: URL.createObjectURL(blob) }
              })
            }
            aoManual={() => {
              mandarDireto()
            }}
          />

          <details className="rounded-xl border border-white/10 px-4 py-2">
            <summary className="cursor-pointer text-sm text-slate-300">Fazer eu mesmo (gravar, salvar, mandar à mão)</summary>
            <div className="mt-3 space-y-3">
          {/* Sem vídeo: você grava a prévia no notebook e envia aqui. */}
          {!video && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3 space-y-2">
              <div className="text-sm font-medium text-white">1️⃣ Grave o vídeo da prévia</div>
              {(videoServidor || videoNuvem) && (
                <div className="space-y-1">
                  <button className="btn-primary !py-2 !px-4 text-sm" onClick={gravarNoNotebook} disabled={gravando}>
                    {gravando ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}{' '}
                    {gravando ? 'Gravando… (uns 30 s a 1 min)' : videoServidor ? 'Gravar agora no notebook (nítido)' : 'Gravar agora na nuvem (nítido)'}
                  </button>
                  <p className="text-xs text-slate-500">
                    {videoServidor
                      ? `A Aranha grava sozinha e salva em Vídeos → Central de Agentes → ${negocio.categoria || 'nicho'}.`
                      : 'A Aranha manda a prévia para a ScreenshotOne gravar (formato de celular, 20 s) e o vídeo aparece aqui.'}
                  </p>
                </div>
              )}
              {erroVideo && <p className="text-xs text-rose-300">{erroVideo}</p>}
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary !py-2 !px-4 text-sm" onClick={abrirParaGravar}>
                  <MonitorPlay size={16} /> Abrir prévia para gravar
                </button>
                <label className="btn-ghost border border-white/10 text-sm cursor-pointer">
                  <Upload size={16} /> Enviar o vídeo gravado
                  <input type="file" accept="video/*" className="hidden" onChange={enviarVideo} />
                </label>
              </div>
              <p className="text-xs text-slate-500">
                Abra a prévia, aperte <strong className="text-slate-300">Win + Alt + R</strong> para gravar (Xbox Game Bar), role o site
                devagar por uns 20 segundos e aperte Win + Alt + R de novo. O vídeo fica em Vídeos → Capturas; depois é só enviar aqui.
              </p>
            </div>
          )}

          {/* Passo 1: vídeo. O link do WhatsApp (wa.me) só leva texto — o vídeo vai separado. */}
          {video && (
            <div className={`rounded-xl border px-4 py-3 space-y-2 ${videoFeito ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-white/10'}`}>
              <div className="text-sm font-medium text-white">{videoFeito ? '✅' : '1️⃣'} Vídeo da prévia</div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary !py-2 !px-4 text-sm" onClick={mandarDireto} disabled={!texto.trim() || !fone}>
                  <Send size={16} /> Mandar direto para o cliente
                </button>
                {podeCompartilhar && (
                  <button className="btn-ghost border border-white/10 text-sm" onClick={compartilharTudo} disabled={!texto.trim()}>
                    <Share2 size={16} /> Compartilhar vídeo + mensagem
                  </button>
                )}
                {podeCompartilhar && (
                  <button className="btn-ghost border border-white/10 text-sm" onClick={compartilharVideo}>
                    <Share2 size={16} /> Só o vídeo
                  </button>
                )}
                <button className="btn-ghost border border-white/10 text-sm" onClick={salvarVideo}>
                  <Download size={16} /> Salvar vídeo {ext === 'mp4' ? '(MP4)' : '(WebM)'}
                </button>
                <label className="btn-ghost text-xs cursor-pointer">
                  <Upload size={14} /> Trocar o vídeo
                  <input type="file" accept="video/*" className="hidden" onChange={enviarVideo} />
                </label>
              </div>
              {site.videoArquivo && videoServidor && (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  📁 Salvo em <span className="font-mono text-slate-400 break-all">{site.videoArquivo}</span>
                  <button className="btn-ghost border border-white/10 !py-1 !px-2 text-xs" onClick={abrirPasta}>
                    Abrir a pasta
                  </button>
                </div>
              )}
              {direto && (
                <div className="rounded-lg border border-neon/30 bg-neon/5 px-3 py-2 text-sm text-slate-200">
                  ✅ A conversa de <strong>{site.nome}</strong> abriu com a mensagem escrita e o vídeo {site.videoArquivo && videoServidor ? 'está na pasta que abriu' : 'foi salvo em Downloads'} (
                  <span className="font-mono text-xs">{site.videoArquivo && videoServidor ? site.videoArquivo.split(/[\\/]/).pop() : nomeArquivo}</span>). Na conversa: clique no <strong>📎</strong> → Fotos e
                  vídeos → escolha o vídeo (ou arraste o arquivo para a conversa) e envie junto com a mensagem.
                </div>
              )}
              <p className="text-xs text-slate-500">
                <strong className="text-slate-300">"Mandar direto para o cliente"</strong> abre a conversa DELE (sem procurar contato).{' '}
                {podeCompartilhar
                  ? '"Compartilhar vídeo + mensagem" abre o compartilhar: escolha o WhatsApp e o cliente. A mensagem também fica copiada — se só o vídeo chegar, cole (Ctrl + V) na conversa.'
                  : 'Salva na pasta Downloads. Na conversa do WhatsApp, clique no 📎 → Fotos e vídeos e escolha o arquivo (ou arraste para a conversa).'}
                {!aceito && ' ⚠️ Este vídeo não saiu em MP4 H.264 e o WhatsApp pode recusar. Use o Google Chrome ou o Edge atualizados e grave de novo (no Gato ou rodando o automático).'}
              </p>
            </div>
          )}

          {/* Passo 2: mensagem */}
          <div className="rounded-xl border border-white/10 px-4 py-3 space-y-2">
            <div className="text-sm font-medium text-white">2️⃣ Mensagem</div>
            <div className="flex flex-wrap gap-2">
              <a
                className={`btn-primary !py-2 !px-4 text-sm ${!texto.trim() || !fone ? 'pointer-events-none opacity-40' : ''}`}
                href={`https://wa.me/${fone}?text=${encodeURIComponent(texto)}`}
                target="_blank"
                rel="noreferrer"
                onClick={aprovar}
              >
                <CheckCircle2 size={16} /> Aprovar e abrir no WhatsApp
              </a>
              <button className="btn-ghost border border-white/10 text-sm" onClick={copiar} disabled={!texto.trim()}>
                {copiado ? <CheckCircle2 size={16} /> : <Copy size={16} />} {copiado ? 'Copiada!' : 'Copiar mensagem'}
              </button>
            </div>
            <p className="text-xs text-slate-500">Abre a conversa do cliente com a mensagem já escrita — é só tocar em enviar.</p>
          </div>

            </div>
          </details>

          {abriu && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              <span className="flex-1">
                {video && !videoFeito ? 'Falta o vídeo (passo 1). ' : ''}Mandou a mensagem{video ? ' e o vídeo' : ''} no WhatsApp?
              </span>
              <button className="btn-primary !py-1.5 !px-3 text-sm" onClick={jaEnviei}>
                <CheckCircle2 size={16} /> Já enviei
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3">
            <button className="btn-ghost text-xs" onClick={verPrevia}>
              {previa ? <EyeOff size={14} /> : <Eye size={14} />} {previa ? 'Esconder prévia' : 'Ver prévia do site'}
            </button>
            <button className="btn-ghost text-xs" onClick={outraMensagem} disabled={ocupado}>
              {ocupado ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Gerar outra mensagem
            </button>
            <Link to={`/agente/gato?site=${site.id}`} className="btn-ghost text-xs">
              <ExternalLink size={14} /> Ajustar no Gato
            </Link>
            <button className="btn-ghost text-xs text-rose-300 hover:bg-rose-400/10 ml-auto" onClick={() => marcarSite(site.id, { status: 'descartado' })}>
              <Trash2 size={14} /> Descartar
            </button>
          </div>
        </div>
      </div>
      {previa === 'carregando' && <div className="mt-4 grid place-items-center py-10"><Loader2 className="animate-spin text-neon" /></div>}
      {previa && previa !== 'carregando' && (
        <iframe title={`Prévia — ${site.nome}`} srcDoc={previa} sandbox={SANDBOX_PREVIA} className="mt-4 w-full h-[70vh] rounded-xl border border-white/10 bg-white" />
      )}
    </article>
  )
}

// Aba Enviados: cola a resposta do cliente (ou do robô dele) e já recebe a próxima mensagem sugerida, sem ir ao Tigre.
const FONTE_IA = { groq: '🤖 Groq', claude: '🤖 Claude', modelo: '📝 texto pronto (sem IA)' }

// Conversa com um cliente, do primeiro contato até fechar: histórico + cola a resposta → a Aranha sugere a próxima.
function ConversaRapida({ site, negocio, conversa, videoServidor }) {
  const precisa = esperandoVoce(conversa)
  const [aberta, setAberta] = useState(precisa)
  const [resposta, setResposta] = useState('')
  const [sugestao, setSugestao] = useState(conversa.sugestao || null) // { texto, tipo, aviso, fonte } — a busca no WhatsApp Web já deixa pronta
  useEffect(() => {
    if (conversa.sugestao) setSugestao(conversa.sugestao)
  }, [conversa.sugestao])
  const [ocupado, setOcupado] = useState(false)
  const [abriu, setAbriu] = useState(false)
  const [erro, setErro] = useState(null)
  const selo = SELO_CONTATO[conversa.status] || SELO_CONTATO.contatado
  const ultima = conversa.mensagens.at(-1)
  const bloqueado = conversa.status === 'nao_contatar'
  const vendido = ['vendido', 'publicado'].includes(conversa.status)
  const fone = foneWhats(negocio)

  async function ler() {
    setOcupado(true)
    setErro(null)
    try {
      const r = await lerResposta(site.id, negocio, resposta.trim())
      setResposta('')
      setSugestao(r)
      setAbriu(false)
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  async function outra() {
    setOcupado(true)
    setErro(null)
    try {
      const r = await outraSugestao(site.id, negocio, sugestao?.tipo || 'resposta')
      setSugestao((s) => ({ ...(s || {}), ...r }))
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  function jaEnviei() {
    registrarEnviada(site.id, sugestao.texto, sugestao.tipo)
    setSugestao(null)
    setAbriu(false)
  }

  return (
    <li className={`border-t border-white/5 first:border-t-0 px-5 py-3 text-sm ${precisa ? 'bg-amber-400/[0.04]' : ''}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-medium text-white">{site.nome}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${selo.cor}`}>{selo.texto}</span>
        {precisa && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-200">🔔 Sua vez</span>}
        {conversa.previaPendente && <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400">prévia vai quando pedirem</span>}
        <span className="min-w-0 flex-1 truncate text-slate-400">
          {ultima ? `${ultima.de === 'cliente' ? 'Cliente' : 'Você'}: “${ultima.texto}”` : ''}
        </span>
        <button className={`btn-ghost border !py-1 !px-3 text-xs ${aberta ? 'border-neon/50 text-neon' : 'border-white/10'}`} onClick={() => setAberta(!aberta)}>
          <MessageCircle size={14} /> {aberta ? 'Fechar conversa' : 'Abrir conversa'}
        </button>
      </div>
      {aberta && (
        <div className="mt-3 space-y-3 rounded-xl border border-white/10 p-4">
          {/* Histórico: tudo o que você mandou e o que o cliente respondeu. */}
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {conversa.mensagens.map((m, i) => (
              <div key={i} className={`flex ${m.de === 'cliente' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${
                    m.de === 'cliente' ? 'rounded-bl-sm bg-white/10 text-slate-100' : 'rounded-br-sm bg-neon/15 text-cyan-50'
                  }`}
                >
                  {m.texto}
                  <div className="mt-1 text-[10px] text-slate-400">
                    {m.de === 'cliente' ? (m.intencao === 'bot' ? '🤖 robô do cliente' : 'cliente') : 'você'}
                    {m.at ? ` · ${new Date(m.at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {bloqueado ? (
            <p className="flex items-center gap-2 text-xs text-rose-300"><Ban size={14} /> Pediu para não receber mensagens — contato bloqueado. A Aranha não sugere mais nada.</p>
          ) : (
            <>
              {!sugestao && (
                <>
                  <label className="label" htmlFor={`resp-${site.id}`}>
                    {precisa ? 'Ele respondeu de novo? Cole aqui' : 'Cole aqui o que ele respondeu no WhatsApp (ou a mensagem automática dele)'}
                  </label>
                  <textarea id={`resp-${site.id}`} rows={3} className="input" value={resposta} onChange={(e) => setResposta(e.target.value)} />
                  <button className="btn-primary !py-2 !px-4 text-sm" onClick={ler} disabled={!resposta.trim() || ocupado}>
                    {ocupado ? <Loader2 size={16} className="animate-spin" /> : <Inbox size={16} />} Ler e sugerir a próxima mensagem
                  </button>
                </>
              )}
              {sugestao && (
                <div className="space-y-2 rounded-xl border border-neon/30 bg-neon/5 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium text-white">Próxima mensagem</span>
                    {sugestao.fonte && <span className="rounded-full bg-white/10 px-2 py-0.5 text-slate-300">{FONTE_IA[sugestao.fonte] || sugestao.fonte}</span>}
                  </div>
                  <p className="text-xs text-slate-400">{sugestao.aviso}</p>
                  {sugestao.texto ? (
                    <>
                      <textarea rows={4} className="input" value={sugestao.texto} onChange={(e) => setSugestao({ ...sugestao, texto: e.target.value })} />
                      <div className="flex flex-wrap gap-2">
                        <a
                          className={`btn-primary !py-2 !px-4 text-sm ${!fone ? 'pointer-events-none opacity-40' : ''}`}
                          href={`https://wa.me/${fone}?text=${encodeURIComponent(sugestao.texto)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => setAbriu(true)}
                        >
                          <CheckCircle2 size={16} /> Aprovar e abrir no WhatsApp
                        </a>
                        <button className="btn-ghost border border-white/10 text-sm" onClick={outra} disabled={ocupado}>
                          {ocupado ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Gerar outra
                        </button>
                        {videoServidor && <ResponderTigre siteId={site.id} texto={sugestao.texto} aoEnviar={jaEnviei} />}
                        {abriu && (
                          <button className="btn-ghost border border-emerald-400/40 text-emerald-200 text-sm" onClick={jaEnviei}>
                            <CheckCircle2 size={16} /> Já enviei
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <button className="btn-ghost border border-white/10 text-xs" onClick={() => setSugestao(null)}>OK</button>
                  )}
                </div>
              )}
              {!vendido && (
                <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
                  <span className="text-xs text-slate-500">Fechou a venda?</span>
                  <button className="btn-ghost border border-emerald-400/30 text-emerald-200 !py-1 !px-3 text-xs" onClick={() => marcarVenda(site.id)}>
                    💰 Fechou! Pagou
                  </button>
                  <Link to={`/agente/tigre?cliente=${site.id}`} className="btn-ghost !py-1 !px-2 text-xs text-slate-400">
                    <ExternalLink size={12} /> Publicar o site no Tigre
                  </Link>
                </div>
              )}
            </>
          )}
          {erro && <p className="text-xs text-rose-300">{erro}</p>}
        </div>
      )}
    </li>
  )
}

// O que cada agente entregou para este cliente: dá para baixar o arquivo do Leão e do Gato a qualquer hora.
function ArquivosDosAgentes({ site, temVideo }) {
  const [tem, setTem] = useState({ leao: false, gato: false })
  useEffect(() => {
    Promise.all([lerZip(site.id), lerZip(`${site.id}:final`)]).then(([leao, gato]) => setTem({ leao: Boolean(leao), gato: Boolean(gato) }))
  }, [site.id])
  async function baixar(chave, nome) {
    const blob = await lerZip(chave)
    if (!blob) return
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = nome
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
  }
  const base = (site.zip || `${site.nome}.zip`).replace(/(-final)?\.zip$/, '')
  const item = (ok, rotulo, acao) => (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${ok ? 'bg-emerald-400/10 text-emerald-200' : 'bg-white/5 text-slate-500'}`}>
      {ok ? '✓' : '…'} {rotulo}
      {ok && acao && (
        <button className="ml-1 underline decoration-dotted hover:text-white" onClick={acao}>
          baixar
        </button>
      )}
    </span>
  )
  return (
    <div className="flex flex-wrap gap-1.5">
      {item(true, '🐧 Pinguim: achou (sem site)')}
      {item(tem.leao, '🦁 Leão: site (ZIP)', () => baixar(site.id, `${base}.zip`))}
      {item(tem.gato, '🐈‍⬛ Gato: site final (ZIP)', () => baixar(`${site.id}:final`, `${base}-final.zip`))}
      {item(temVideo, '🎬 Vídeo')}
      {item(true, '🐯 Tigre: mensagem')}
    </div>
  )
}

const MOTIVO = {
  pronto: ['✅', 'pronto para você confirmar'],
  sem_video: ['🎬', 'falta o vídeo'],
  tem_site: ['🌐', 'já tem site'],
  possivel_site: ['⚠️', 'possível site — confira no Pinguim'],
  sem_telefone: ['📵', 'sem telefone'],
  ja_contatado: ['⏳', 'você já procurou'],
  ja_feito: ['🦁', 'site já feito antes'],
  erro_conferir: ['❓', 'não deu para conferir se tem site'],
  erro: ['❌', 'erro'],
  erro_busca: ['❌', 'erro na busca do Pinguim'],
}

// O que aconteceu com cada comércio na última rodada do automático.
function RelatorioRodada() {
  const { auto } = usePipeline()
  const r = auto?.relatorio
  const [aberto, setAberto] = useState(false)
  if (!r) return null
  const conta = {}
  for (const i of r.itens || []) conta[i.resultado] = (conta[i.resultado] || 0) + 1
  return (
    <section className="glass p-5 space-y-3">
      <button className="flex w-full flex-wrap items-center gap-2 text-left" onClick={() => setAberto(!aberto)}>
        <span className="font-semibold text-white">📋 Relatório da última rodada — {r.nicho}</span>
        <span className="text-xs text-slate-500">{new Date(r.em).toLocaleString('pt-BR')}</span>
        <span className="ml-auto text-xs text-neon">{aberto ? 'esconder' : 'ver cada comércio'}</span>
      </button>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(conta).map(([k, n]) => (
          <span key={k} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-300">
            {MOTIVO[k]?.[0] || '•'} {n} {MOTIVO[k]?.[1] || k}
          </span>
        ))}
        {!r.itens?.length && <span className="text-xs text-slate-400">Nenhum comércio novo nesta busca.</span>}
      </div>
      {aberto && (
        <ul className="space-y-1 text-sm">
          {(r.itens || []).map((i, k) => (
            <li key={k} className="flex flex-wrap gap-x-2 text-slate-300">
              <span>{MOTIVO[i.resultado]?.[0] || '•'}</span>
              <span className="text-white">{i.nome}</span>
              <span className="text-slate-500">— {MOTIVO[i.resultado]?.[1] || i.resultado}</span>
              {i.detalhe && <span className="min-w-0 truncate text-xs text-slate-500">{i.detalhe}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// Lê no WhatsApp Web o que cada cliente respondeu e deixa a próxima mensagem sugerida (você aprova cada envio).
function BuscarRespostas() {
  const [rodando, setRodando] = useState(false)
  const [passo, setPasso] = useState('')
  const [fim, setFim] = useState(null)
  async function buscar() {
    setRodando(true)
    setFim(null)
    try {
      const r = await buscarRespostas(setPasso)
      setFim(r.novas ? `✅ ${r.novas} resposta(s) nova(s) — a próxima mensagem já está sugerida em cada conversa.` : 'Nenhuma resposta nova.')
    } catch (e) {
      setFim(`❌ ${e.message}`)
    } finally {
      setRodando(false)
      setPasso('')
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-5 py-3">
      <button className="btn-primary !py-2 !px-4 text-sm" onClick={buscar} disabled={rodando}>
        {rodando ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} 🐯 Tigre: buscar respostas no WhatsApp
      </button>
      <span className="text-xs text-slate-400">{rodando ? `Lendo ${passo}…` : fim || 'A Aranha abre cada conversa no seu WhatsApp Web e traz o que responderam.'}</span>
    </div>
  )
}

// 🕷️ → 🐯 Aprovar: o Tigre confere que não é repetido, grava o vídeo se faltar e manda pelo WhatsApp Web (notebook).
// No Vercel (sem WhatsApp Web), ele prepara e abre a conversa do cliente para você mandar e clicar "Já enviei".
function AprovarTigre({ site, texto, keys, aoVideo, aoManual }) {
  const [estado, setEstado] = useState(null) // null | 'trabalhando' | 'enviado' | 'manual' | erro
  const [conectado, setConectado] = useState(null)
  async function aprovar() {
    setEstado('trabalhando')
    try {
      const r = await tigreExecutar(site.id, { texto, keys, segundos: Number(lerOpcoes().duracao) || 20 })
      if (r.video) aoVideo(r.video)
      if (r.modo === 'manual') {
        aoManual()
        setEstado('manual')
      } else setEstado('enviado')
    } catch (e) {
      setEstado(e.message)
    }
  }
  async function conectar() {
    try {
      const s = await conectarZap()
      setConectado(s.status)
    } catch (e) {
      setEstado(e.message)
    }
  }
  const erro = estado && !['trabalhando', 'enviado', 'manual'].includes(estado) ? estado : null
  return (
    <div className="space-y-2 rounded-xl border border-neon/40 bg-neon/5 px-4 py-3">
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary !py-2.5 !px-5 text-sm" onClick={aprovar} disabled={!texto.trim() || estado === 'trabalhando' || estado === 'enviado'}>
          {estado === 'trabalhando' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}{' '}
          {estado === 'trabalhando' ? 'O Tigre está trabalhando…' : 'Aprovar — o 🐯 Tigre faz o resto'}
        </button>
        {keys.videoServidor && (
          <button className="btn-ghost border border-white/10 text-sm" onClick={conectar}>
            Conectar WhatsApp {conectado === 'pronto' ? '✓' : ''}
          </button>
        )}
      </div>
      <p className="text-xs text-slate-400">
        {keys.videoServidor
          ? estrategiaDoTigre() === 'pergunta'
            ? 'O Tigre manda esta mensagem pelo seu WhatsApp Web, deixa o vídeo pronto e vigia a resposta: se pedirem a prévia, ele manda o vídeo sozinho e te avisa (🔔 Sua vez).'
            : 'O Tigre grava o vídeo (se faltar), manda vídeo + mensagem pelo seu WhatsApp Web e anota que este comércio já recebeu.'
          : 'O Tigre grava o vídeo (se faltar) e abre a conversa do cliente com a mensagem pronta; anexe o vídeo pelo 📎 e clique "Já enviei".'}
      </p>
      {conectado === 'qr' && <p className="text-xs text-amber-200">Escaneie o QR code na janela do WhatsApp Web (Aparelhos conectados). Só na 1ª vez.</p>}
      {estado === 'enviado' && <p className="text-xs text-emerald-300">✅ O Tigre mandou e anotou. Este comércio foi para a aba Conversas.</p>}
      {estado === 'manual' && <p className="text-xs text-sky-200">A conversa do cliente abriu. Mande lá e clique em "Já enviei" aqui embaixo.</p>}
      {erro && <p className="text-xs text-rose-300">{erro}</p>}
    </div>
  )
}

// Resposta aprovada: o Tigre manda pelo WhatsApp Web (notebook) e registra.
function ResponderTigre({ siteId, texto, aoEnviar }) {
  const [estado, setEstado] = useState(null)
  async function enviar() {
    setEstado('enviando')
    try {
      await tigreResponder(siteId, texto)
      setEstado(null)
      aoEnviar()
    } catch (e) {
      setEstado(e.message)
    }
  }
  return (
    <>
      <button className="btn-primary !py-2 !px-4 text-sm" onClick={enviar} disabled={!texto?.trim() || estado === 'enviando'}>
        {estado === 'enviando' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Aprovar — o Tigre envia
      </button>
      {estado && estado !== 'enviando' && <span className="text-xs text-rose-300">{estado}</span>}
    </>
  )
}
