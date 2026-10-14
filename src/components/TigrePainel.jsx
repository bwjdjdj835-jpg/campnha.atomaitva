import { useEffect, useState } from 'react'
import {
  MessageCircle, Send, RefreshCw, Loader2, BellRing, Ban, CheckCircle2, Rocket, ExternalLink, Inbox, Link2, Video, Download, Copy, Share2, ShieldAlert,
} from 'lucide-react'
import { usePipeline, setPipeline } from '../store/pipeline.js'
import { lerResposta, atualizarConversa } from '../services/tigreConversa.js'
import { negocioDoSite, rascunho, enviarPelaApi, publicarSite, videoDoSite, enviarVideoPelaApi } from '../services/agents.js'

const STATUS = {
  novo: { rotulo: 'Ainda não contatado', cor: 'bg-white/5 text-slate-300' },
  contatado: { rotulo: 'Aguardando resposta', cor: 'bg-sky-400/10 text-sky-300' },
  interessado: { rotulo: 'Interessado', cor: 'bg-emerald-400/10 text-emerald-300' },
  duvida: { rotulo: 'Fez uma pergunta', cor: 'bg-amber-400/10 text-amber-300' },
  bot: { rotulo: 'Respondeu um robô', cor: 'bg-violet-400/10 text-violet-300' },
  recusou: { rotulo: 'Recusou', cor: 'bg-white/5 text-slate-400' },
  nao_contatar: { rotulo: 'Não contatar', cor: 'bg-rose-400/10 text-rose-300' },
  vendido: { rotulo: 'Pagamento confirmado', cor: 'bg-emerald-400/15 text-emerald-200' },
  publicado: { rotulo: 'Site no ar', cor: 'bg-neon/15 text-neon-soft' },
}



function marcarSite(siteId, status) {
  setPipeline((s) => ({ sites: s.sites.map((x) => (x.id === siteId ? { ...x, status } : x)) }))
}

const digitos = (wa) => String(wa || '').replace(/\D/g, '')

// Conversa com um cliente: rascunho → sua aprovação → envio → resposta → fechamento → publicação.
const CHAVE_ENVIO_API = 'central-agentes:tigre-envio-api'

export default function TigrePainel({ siteId, rascunhoInicial, keys }) {
  const { sites, leads, conversas } = usePipeline()
  const site = sites.find((x) => x.id === siteId)
  const conversa = conversas?.[siteId] || { status: 'novo', mensagens: [] }
  const [texto, setTexto] = useState(rascunhoInicial || conversa.rascunho || '')
  const [resposta, setResposta] = useState('')
  const [ocupado, setOcupado] = useState(null)
  const [erro, setErro] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [abriuWhats, setAbriuWhats] = useState(false)
  const [pago, setPago] = useState(conversa.status === 'vendido' || conversa.status === 'publicado')
  const [linkManual, setLinkManual] = useState('')
  const [video, setVideo] = useState(null) // { blob, url }
  const [legenda, setLegenda] = useState('Olha a prévia do site que preparamos para vocês 👇')
  // Envio automático pela API (Z-API/Meta) fica desligado: mensagem automática para quem não te conhece
  // é o que mais leva o WhatsApp a bloquear o número. Padrão: você envia pelo seu WhatsApp.
  const [envioApi, setEnvioApi] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_ENVIO_API) === '1'
    } catch {
      return false
    }
  })
  const [copiado, setCopiado] = useState(false)
  const [tipoRascunho, setTipoRascunho] = useState(null) // 'olhada' = a mensagem leve depois de um "não"; 'pessoa' = pedir um humano ao robô
  const jaMandouOlhada = conversa?.mensagens?.some((m) => m.tipo === 'olhada')

  useEffect(() => {
    let url = null
    videoDoSite(siteId).then((blob) => {
      if (!blob) return
      url = URL.createObjectURL(blob)
      setVideo({ blob, url })
    })
    return () => url && URL.revokeObjectURL(url)
  }, [siteId])

  if (!site) return null
  const negocio = negocioDoSite(site, leads)
  const bloqueado = conversa.status === 'nao_contatar'
  const primeiroContato = !conversa.mensagens.some((m) => m.de === 'nos')
  const status = STATUS[conversa.status] || STATUS.novo
  const fone = digitos(negocio.whatsapp || negocio.telefone)

  async function tarefa(nome, fn) {
    setOcupado(nome)
    setErro(null)
    try {
      await fn()
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(null)
    }
  }

  function registrarEnvio(via) {
    atualizarConversa(siteId, (c) => ({
      mensagens: [...c.mensagens, { de: 'nos', texto, via, at: new Date().toISOString(), ...(tipoRascunho ? { tipo: tipoRascunho } : {}) }],
      status: ['novo', 'recusou', 'duvida', 'bot'].includes(c.status) ? 'contatado' : c.status,
      rascunho: undefined,
    }))
    setTexto('')
    setAbriuWhats(false)
    setTipoRascunho(null)
  }

  const gerar = (tipo) =>
    tarefa('gerar', async () => {
      setTexto((await rascunho(tipo, negocio, conversa.mensagens)).texto)
      setTipoRascunho(['olhada', 'pessoa', 'despedida'].includes(tipo) ? tipo : null)
    })

  const enviarApi = () =>
    tarefa('enviar', async () => {
      const r = await enviarPelaApi({ telefone: fone, texto, primeiroContato, nome: negocio.nome })
      registrarEnvio(r.provedor === 'zapi' ? 'zapi' : r.viaTemplate ? 'api-template' : 'api')
      setAviso(r.provedor === 'zapi' ? 'Mensagem enviada pela Z-API.' : r.viaTemplate ? 'Enviado pelo template aprovado da Meta.' : 'Mensagem enviada pelo WhatsApp Business.')
    })

  const registrarResposta = () =>
    tarefa('classificar', async () => {
      const r = await lerResposta(siteId, negocio, resposta, { temVideo: Boolean(video) })
      setResposta('')
      setTexto(r.texto)
      setTipoRascunho(r.tipo)
      setAviso(r.aviso)
    })

  const enviarVideo = () =>
    tarefa('video', async () => {
      await enviarVideoPelaApi({ telefone: fone, video: video.blob, legenda })
      atualizarConversa(siteId, (c) => ({
        mensagens: [...c.mensagens, { de: 'nos', texto: `🎬 Vídeo da prévia${legenda ? ` — ${legenda}` : ''}`, via: 'zapi', at: new Date().toISOString() }],
        status: ['novo', 'recusou', 'duvida'].includes(c.status) ? 'contatado' : c.status,
      }))
      setAviso('Vídeo da prévia enviado pela Z-API.')
    })

  function videoEnviadoManual() {
    atualizarConversa(siteId, (c) => ({
      mensagens: [...c.mensagens, { de: 'nos', texto: '🎬 Vídeo da prévia', via: 'whatsapp-manual', at: new Date().toISOString() }],
      status: ['novo', 'recusou', 'duvida'].includes(c.status) ? 'contatado' : c.status,
    }))
  }

  function naoContatar() {
    atualizarConversa(siteId, () => ({ status: 'nao_contatar' }))
    setTexto('')
  }

  function confirmarPagamento(v) {
    setPago(v)
    if (v) {
      atualizarConversa(siteId, (c) => ({ status: c.status === 'publicado' ? c.status : 'vendido' }))
      marcarSite(siteId, 'vendido')
    }
  }

  const publicar = () =>
    tarefa('publicar', async () => {
      const r = await publicarSite(site)
      if (!r.url) throw new Error('O Vercel não devolveu o link.')
      concluirPublicacao(r.url)
    })

  async function concluirPublicacao(url) {
    atualizarConversa(siteId, () => ({ status: 'publicado', url }))
    marcarSite(siteId, 'publicado')
    setTexto((await rascunho('link', negocio, conversa.mensagens, url)).texto)
    setAviso('Site no ar. A mensagem com o link está pronta para sua aprovação.')
  }

  const interessado = ['interessado', 'vendido', 'publicado'].includes(conversa.status)
  const apiLigada = Boolean(keys?.whatsapp) && envioApi
  const extVideo = video?.blob?.type.includes('mp4') ? 'mp4' : 'webm'

  function alternarEnvioApi(v) {
    setEnvioApi(v)
    try {
      localStorage.setItem(CHAVE_ENVIO_API, v ? '1' : '0')
    } catch {
      /* sem storage */
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setAbriuWhats(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      setErro('Não consegui copiar — selecione o texto e copie à mão.')
    }
  }

  // Celular: abre a folha de compartilhar do aparelho (escolha o WhatsApp e o contato).
  const podeCompartilhar =
    video && typeof navigator !== 'undefined' && navigator.canShare?.({ files: [new File([video.blob], `previa.${extVideo}`, { type: video.blob.type.split(';')[0] })] })
  async function compartilharVideo() {
    try {
      // Só o arquivo: junto com texto, o WhatsApp costuma ficar com o texto e largar o vídeo.
      await navigator.share({ files: [new File([video.blob], `previa-${site.nome}.${extVideo}`, { type: video.blob.type.split(';')[0] })] })
    } catch {
      /* cancelado */
    }
  }

  return (
    <section id="tigre-painel" className="glass overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-white/5">
        <h3 className="flex items-center gap-2 font-display font-semibold text-white">
          <MessageCircle size={18} className="text-neon" /> {site.nome}
        </h3>
        {negocio.demo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300">DEMO</span>}
        <span className="font-mono text-xs text-slate-400">{negocio.telefone || 'sem telefone'}</span>
        <span className={`ml-auto text-xs px-2.5 py-1 rounded-full ${status.cor}`}>{status.rotulo}</span>
      </div>

      {interessado && (
        <div className="flex items-start gap-3 mx-5 mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
          <BellRing size={18} className="mt-0.5 shrink-0" />
          <span>
            <strong>Cliente interessado</strong> — {site.nome} — {negocio.telefone || 'sem telefone'} — quer fechar a venda
          </span>
        </div>
      )}
      {bloqueado && (
        <div className="flex items-start gap-3 mx-5 mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          <Ban size={18} className="mt-0.5 shrink-0" />
          <span>Este cliente pediu para não receber mensagens. O contato está bloqueado.</span>
        </div>
      )}

      {/* Histórico */}
      <div className="px-5 py-4 space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
        {conversa.mensagens.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma mensagem ainda.</p>
        ) : (
          conversa.mensagens.map((m, i) => (
            <div key={i} className={`flex ${m.de === 'nos' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  m.de === 'nos' ? 'bg-neon/15 text-slate-100 rounded-br-sm' : 'bg-white/5 text-slate-200 rounded-bl-sm'
                }`}
              >
                {m.texto}
                <div className="mt-1 text-[10px] text-slate-500">
                  {new Date(m.at).toLocaleString('pt-BR')}
                  {m.via === 'whatsapp-manual' && ' · enviada por você'}
                  {m.via?.startsWith('api') && ' · WhatsApp Business'}
                  {m.via === 'zapi' && ' · Z-API'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rascunho + aprovação */}
      {!bloqueado && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
          <label className="label" htmlFor="tigre-rascunho">Mensagem sugerida — você envia pelo seu WhatsApp</label>
          <textarea
            id="tigre-rascunho"
            rows={4}
            className="input"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              setAbriuWhats(false)
            }}
            placeholder="Escreva ou gere uma mensagem"
          />
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost border border-white/10" onClick={() => gerar(primeiroContato ? 'primeiro' : conversa.status === 'bot' ? 'pessoa' : conversa.status === 'recusou' ? (jaMandouOlhada ? 'despedida' : 'olhada') : 'resposta')} disabled={!!ocupado}>
              {ocupado === 'gerar' ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Gerar outra
            </button>
            <button className="btn-ghost border border-white/10" onClick={copiar} disabled={!texto.trim()}>
              {copiado ? <CheckCircle2 size={16} /> : <Copy size={16} />} {copiado ? 'Copiada!' : 'Copiar mensagem'}
            </button>
            {apiLigada && (
              <button className="btn-ghost border border-amber-400/30 text-amber-300" onClick={enviarApi} disabled={!texto.trim() || !fone || !!ocupado}>
                {ocupado === 'enviar' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Enviar pela API
              </button>
            )}
            <a
              className={`btn-primary !py-2 !px-4 text-sm ${!texto.trim() || !fone ? 'pointer-events-none opacity-40' : ''}`}
              href={`https://wa.me/${fone}?text=${encodeURIComponent(texto)}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => setAbriuWhats(true)}
            >
              <ExternalLink size={16} /> Abrir no meu WhatsApp
            </a>
            {abriuWhats && (
              <button className="btn-ghost border border-white/10" onClick={() => registrarEnvio('whatsapp-manual')}>
                <CheckCircle2 size={16} /> Já enviei
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            "Abrir no meu WhatsApp" abre a conversa com o cliente e a mensagem já escrita — confira e toque em enviar.
          </p>
          {keys?.whatsapp && (
            <label className="flex items-start gap-2 text-xs text-slate-400">
              <input type="checkbox" className="mt-0.5" checked={envioApi} onChange={(e) => alternarEnvioApi(e.target.checked)} />
              <span>
                <ShieldAlert size={13} className="mr-1 inline text-amber-300" />
                Mostrar envio automático pela API ({keys.whatsappProvedor === 'zapi' ? 'Z-API' : 'Meta'}). Não recomendado:
                mensagem automática para quem não te conhece pode fazer o WhatsApp bloquear o seu número.
              </span>
            </label>
          )}
          {apiLigada && primeiroContato && keys?.whatsappProvedor === 'meta' && !keys?.whatsappTemplate && (
            <p className="text-xs text-amber-300/80">
              Primeiro contato pela API exige template aprovado pela Meta (WHATSAPP_TEMPLATE). Sem ele, use "Abrir no meu WhatsApp".
            </p>
          )}
        </div>
      )}

      {/* Vídeo da prévia (gravado no Gato Negro) */}
      {!bloqueado && video && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
          <div className="label">Vídeo da prévia — você envia pelo seu WhatsApp</div>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <video src={video.url} controls playsInline className="w-40 rounded-xl border border-white/10 bg-black" />
            <div className="flex-1 min-w-0 space-y-2">
              <input id="tigre-legenda" className="input !py-2" value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder="Legenda do vídeo" />
              <div className="flex flex-wrap gap-2">
                {podeCompartilhar && (
                  <button className="btn-primary !py-2 !px-4 text-sm" onClick={compartilharVideo}>
                    <Share2 size={16} /> Compartilhar no WhatsApp
                  </button>
                )}
                {apiLigada && keys?.whatsappProvedor === 'zapi' && (
                  <button className="btn-ghost border border-amber-400/30 text-amber-300" onClick={enviarVideo} disabled={!fone || !!ocupado}>
                    {ocupado === 'video' ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />} Enviar vídeo pela API
                  </button>
                )}
                <a className="btn-ghost border border-white/10" href={video.url} download={`previa-${site.nome}.${extVideo}`}>
                  <Download size={16} /> Baixar o vídeo
                </a>
                <button className="btn-ghost border border-white/10" onClick={videoEnviadoManual}>
                  <CheckCircle2 size={16} /> Já enviei o vídeo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resposta do cliente */}
      {!bloqueado && conversa.mensagens.some((m) => m.de === 'nos') && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
          <label className="label" htmlFor="tigre-resposta">Resposta do cliente</label>
          <textarea
            id="tigre-resposta"
            rows={2}
            className="input"
            value={resposta}
            onChange={(e) => setResposta(e.target.value)}
            placeholder="Cole aqui o que o cliente respondeu no WhatsApp"
          />
          <div className="flex flex-wrap gap-2">
            <button className="btn-ghost border border-white/10" onClick={registrarResposta} disabled={!resposta.trim() || !!ocupado}>
              {ocupado === 'classificar' ? <Loader2 size={16} className="animate-spin" /> : <Inbox size={16} />} Ler e sugerir resposta
            </button>
            <button className="btn-ghost text-rose-300 hover:bg-rose-400/10" onClick={naoContatar}>
              <Ban size={16} /> Marcar como não contatar
            </button>
          </div>
        </div>
      )}

      {/* Fechamento e publicação */}
      {interessado && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4">
          <div className="label">Fechamento</div>
          <label className="flex items-center gap-2 text-sm text-slate-300" htmlFor="tigre-pago">
            <input id="tigre-pago" type="checkbox" className="accent-cyan-400 w-4 h-4" checked={pago} onChange={(e) => confirmarPagamento(e.target.checked)} />
            Pagamento confirmado
          </label>
          {conversa.status === 'publicado' && conversa.url ? (
            <a href={conversa.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-neon hover:underline">
              <Link2 size={16} /> {conversa.url}
            </a>
          ) : keys?.vercel ? (
            <button className="btn-primary !py-2 !px-4 text-sm" onClick={publicar} disabled={!pago || !!ocupado}>
              {ocupado === 'publicar' ? <Loader2 size={16} className="animate-spin" /> : <Rocket size={16} />} Publicar no Vercel
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Publicação automática desligada (falta VERCEL_TOKEN). Publique o ZIP final no Vercel ou Netlify e cole o link:
              </p>
              <div className="flex gap-2">
                <input
                  id="tigre-link"
                  className="input !py-2"
                  placeholder="https://nome-do-negocio.vercel.app"
                  value={linkManual}
                  onChange={(e) => setLinkManual(e.target.value)}
                />
                <button
                  className="btn-ghost border border-white/10 shrink-0"
                  disabled={!pago || !/^https?:\/\/\S+\.\S+/.test(linkManual)}
                  onClick={() => concluirPublicacao(linkManual.trim())}
                >
                  Salvar link
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {(erro || aviso) && (
        <div className={`px-5 pb-5 text-sm ${erro ? 'text-rose-300' : 'text-slate-400'}`}>{erro || aviso}</div>
      )}
    </section>
  )
}
