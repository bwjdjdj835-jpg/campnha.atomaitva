import { useEffect, useMemo, useRef, useState } from 'react'
import { usePipeline } from '../store/pipeline.js'
import { propostasDoCastor, designsDaGroq, imagemDoModelo, lerImagemDeModelo, pedidoParaGemini } from '../lib/castor.js'
import { htmlDaPrevia, SANDBOX_PREVIA, CSS_MINIATURA } from '../lib/previa.jsx'
import { lembrar, PERSONALIDADES } from '../lib/mentes.js'
import MenteAgente from './MenteAgente.jsx'

// 🦫 Castor: 3 modelos do site do cliente lado a lado (prévia real, como imagem), antes do Gato finalizar.
// Escolher um aplica tema + capa + galeria no Gato; o Castor lembra a escolha para sugerir melhor da próxima vez.
export default function CastorModelos({ dados, fotosUrl, modelo, conteudo, escolhido, onEscolher }) {
  const estado = usePipeline()
  const [abertos, setAbertos] = useState(true)
  const locais = useMemo(() => propostasDoCastor(dados, modelo, estado), [dados, modelo]) // eslint-disable-line react-hooks/exhaustive-deps
  // Os 3 designs criados pela Groq (quando a chave existe); completa com a matriz do Castor se vierem menos de 3.
  const [daIA, setDaIA] = useState(undefined) // undefined = pensando, null = sem IA
  useEffect(() => {
    let vivo = true
    designsDaGroq(dados).then((r) => vivo && setDaIA(r && r.length ? r : null))
    return () => {
      vivo = false
    }
  }, [dados])
  const propostas = useMemo(() => (daIA ? [...daIA, ...locais].slice(0, 3) : locais), [daIA, locais])

  // 🍌 Nano Banana (Gemini): desenha uma imagem de cada modelo, só para você escolher. Uma de cada vez (limite da cota).
  const [temBanana, setTemBanana] = useState(false)
  const [desenhos, setDesenhos] = useState({}) // id → { url } | { carregando } | { erro }
  const [verReal, setVerReal] = useState({}) // id → true = mostra a prévia real em vez da imagem
  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => setTemBanana(Boolean(d.keys?.imagem)))
      .catch(() => {})
  }, [])
  const categoria = dados.negocio?.categoria || ''
  async function desenhar(p, deNovo) {
    setDesenhos((d) => ({ ...d, [p.id]: { carregando: true } }))
    try {
      const url = await imagemDoModelo(p, categoria, { deNovo })
      setDesenhos((d) => ({ ...d, [p.id]: { url } }))
    } catch (e) {
      setDesenhos((d) => ({ ...d, [p.id]: { erro: e.message } }))
    }
  }
  useEffect(() => {
    if (!temBanana || daIA === undefined) return
    let vivo = true
    ;(async () => {
      for (const p of propostas) {
        if (!vivo) return
        await desenhar(p)
      }
    })()
    return () => {
      vivo = false
    }
  }, [temBanana, daIA, propostas]) // eslint-disable-line react-hooks/exhaustive-deps
  // 📤 Imagens que você gerou no Gemini: o Castor lê, dá nota e aplica a melhor.
  const [enviadas, setEnviadas] = useState([])
  const [lendo, setLendo] = useState(false)
  const [avisoEnvio, setAvisoEnvio] = useState(null)
  const entrada = useRef(null)
  const melhor = useMemo(() => enviadas.filter((p) => p.nota != null).sort((a, b) => b.nota - a.nota)[0] || null, [enviadas])
  const todas = useMemo(() => [...enviadas, ...propostas], [enviadas, propostas])

  const imagens = useMemo(
    () =>
      fotosUrl
        ? Object.fromEntries(
            todas.map((p) => [
              p.id,
              htmlDaPrevia({ ...dados, tema: p.tema, modelo: p.modelo || modelo, hero: p.hero, galeria: p.galeria, efeitos: false, conteudo }, fotosUrl, CSS_MINIATURA),
            ]),
          )
        : {},
    [todas, dados, modelo, conteudo, fotosUrl],
  )

  async function enviarImagens(arquivos) {
    const lista = [...arquivos].filter((a) => a.type.startsWith('image/')).slice(0, 6)
    if (!lista.length) return
    setLendo(true)
    setAvisoEnvio(null)
    const lidas = []
    for (const [i, a] of lista.entries()) {
      try {
        lidas.push(await lerImagemDeModelo(a, categoria, enviadas.length + i + 1))
      } catch {
        setAvisoEnvio(`Não consegui abrir ${a.name}.`)
      }
    }
    const novas = [...enviadas, ...lidas]
    setEnviadas(novas)
    setLendo(false)
    if (!lidas.length) return
    // O Castor escolhe a de maior nota (ou a 1ª, se ninguém deu nota) e já manda para o Gato.
    const top = novas.filter((p) => p.nota != null).sort((a, b) => b.nota - a.nota)[0] || lidas[0]
    escolher(top)
    const semIA = lidas.find((p) => !p.lidaPelaIA)
    setAvisoEnvio(
      `✅ ${lidas.length} imagem(ns) lida(s). O Castor aplicou "${top.titulo}"${top.nota != null ? ` (nota ${top.nota}/10)` : ''} — confira a prévia do Gato abaixo.` +
        (semIA ? ' Sem a IA da Groq, as cores foram tiradas direto da imagem.' : ''),
    )
  }

  function escolher(p) {
    onEscolher(p)
    lembrar('castor', `${dados.negocio?.nome || 'Site'}: você escolheu "${p.titulo}"${p.ia ? ' (design da Groq)' : ''}`, { tema: p.titulo === 'Direção de arte do Castor' || p.ia || p.enviada ? 'castor' : p.tema, hero: p.hero, galeria: p.galeria, categoria: dados.negocio?.categoria })
  }

  return (
    <div className="space-y-3 border-b border-white/5 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xl" aria-hidden="true">{PERSONALIDADES.castor.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 font-display font-semibold text-white">
            Castor: 3 modelos para você escolher
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-normal text-slate-300">
              {daIA === undefined ? '🤖 Groq criando os designs…' : daIA ? '🤖 Designs criados pela Groq' : '📐 Matriz de design do Castor'}
            </span>
            {temBanana && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-normal text-amber-200">🍌 Imagens do Nano Banana</span>}
          </div>
          <p className="text-xs text-slate-400">
            Antes do Gato finalizar, o Castor desenhou o site de 3 jeitos diferentes, com base no estudo do Gato e no que você já escolheu
            antes. Escolha um e o Gato refina em cima dele.
            {temBanana && ' As imagens do 🍌 Nano Banana são só para você escolher o estilo — o cliente recebe o site real que o Gato produz.'}
          </p>
        </div>
        <button className="btn-ghost border border-white/10 !py-1 !px-3 text-xs" onClick={() => setAbertos(!abertos)}>
          {abertos ? 'Esconder' : 'Mostrar'}
        </button>
      </div>
      {abertos && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-xs text-slate-300">
          <span className="min-w-[12rem] flex-1">
            📤 <strong className="text-white">Fez imagens de site no Gemini?</strong> Mande aqui: o Castor lê cada uma, dá nota, escolhe a melhor e o
            Gato aplica as cores, a fonte e o estilo dela no site real.
          </span>
          <button
            className="btn-ghost border border-white/10 !py-1.5 !px-3 text-xs"
            onClick={() =>
              navigator.clipboard
                .writeText(pedidoParaGemini(categoria))
                .then(() => setAvisoEnvio('✅ Pedido copiado — cole no Gemini, gere 2 a 4 imagens e mande aqui.'))
                .catch(() => setAvisoEnvio(pedidoParaGemini(categoria)))
            }
          >
            📋 Copiar pedido para o Gemini
          </button>
          <button className="btn-primary !py-1.5 !px-3 text-xs" disabled={lendo} onClick={() => entrada.current?.click()}>
            {lendo ? '🦫 Lendo as imagens…' : '📤 Enviar minhas imagens'}
          </button>
          <input
            ref={entrada}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              enviarImagens(e.target.files)
              e.target.value = ''
            }}
          />
          {avisoEnvio && <p className="w-full text-slate-200">{avisoEnvio}</p>}
        </div>
      )}
      {abertos && (
        <div className="grid gap-3 sm:grid-cols-3">
          {todas.map((p, i) => {
            const ativo =
              escolhido && escolhido.tema === p.tema && escolhido.hero === p.hero && escolhido.galeria === p.galeria && (p.tema !== 'modelo' || escolhido.modelo === p.modelo)
            return (
              <div key={p.id} className={`overflow-hidden rounded-xl border ${ativo ? 'border-neon ring-2 ring-neon/40' : 'border-white/10'}`}>
                <div className="relative aspect-[3/4] overflow-hidden bg-black">
                  {p.enviada && !verReal[p.id] ? (
                    <img src={p.imagem} alt={`Sua imagem: ${p.titulo}`} className="absolute inset-0 h-full w-full object-cover object-top" />
                  ) : !p.enviada && temBanana && !verReal[p.id] && desenhos[p.id]?.url ? (
                    <img src={desenhos[p.id].url} alt={`Imagem do modelo ${i + 1}: ${p.titulo}`} className="absolute inset-0 h-full w-full object-cover object-top" />
                  ) : !p.enviada && temBanana && !verReal[p.id] && desenhos[p.id]?.carregando ? (
                    <div className="absolute inset-0 grid place-items-center text-center text-xs text-amber-200">🍌 Desenhando…</div>
                  ) : null}
                  {imagens[p.id] && (p.enviada ? verReal[p.id] : verReal[p.id] || !temBanana || !desenhos[p.id] || desenhos[p.id].erro) && (
                    <iframe
                      title={`Modelo ${i + 1}: ${p.titulo}`}
                      srcDoc={imagens[p.id]}
                      sandbox={SANDBOX_PREVIA}
                      tabIndex={-1}
                      className="pointer-events-none absolute left-0 top-0 origin-top-left"
                      style={{ width: '400%', height: '400%', transform: 'scale(0.25)' }}
                    />
                  )}
                  {p.enviada ? (
                    <span className="absolute left-2 top-2 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-black">
                      {melhor?.id === p.id ? '🏆 ESCOLHA DO CASTOR' : 'SUA IMAGEM'}
                      {p.nota != null && ` · ${p.nota}/10`}
                    </span>
                  ) : (
                    i === enviadas.length && <span className="absolute left-2 top-2 rounded-full bg-neon px-2 py-0.5 text-[10px] font-bold text-black">RECOMENDADO</span>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <div className="text-sm font-medium text-white">
                    {i + 1}. {p.titulo}
                  </div>
                  {p.porque && <p className="text-xs text-slate-400">{p.porque}</p>}
                  {p.enviada && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                      <button className="text-neon hover:underline" onClick={() => setVerReal((v) => ({ ...v, [p.id]: !v[p.id] }))}>
                        {verReal[p.id] ? '🖼️ Ver a sua imagem' : '👁️ Ver como fica no site real'}
                      </button>
                      <button className="text-rose-300 hover:underline" onClick={() => setEnviadas((l) => l.filter((x) => x.id !== p.id))}>
                        Tirar
                      </button>
                    </div>
                  )}
                  {!p.enviada && temBanana && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
                      {desenhos[p.id]?.url && (
                        <button className="text-neon hover:underline" onClick={() => setVerReal((v) => ({ ...v, [p.id]: !v[p.id] }))}>
                          {verReal[p.id] ? '🍌 Ver a imagem' : '👁️ Ver a prévia real'}
                        </button>
                      )}
                      {!desenhos[p.id]?.carregando && (
                        <button className="text-amber-200 hover:underline" onClick={() => desenhar(p, true)}>
                          🍌 Desenhar de novo
                        </button>
                      )}
                      {desenhos[p.id]?.erro && <span className="text-rose-300">{desenhos[p.id].erro}</span>}
                    </div>
                  )}
                  <button className={`${ativo ? 'btn-ghost border border-neon/50 text-neon' : 'btn-primary'} !py-1.5 !px-3 w-full text-sm`} onClick={() => escolher(p)}>
                    {ativo ? '✓ Escolhido' : 'Usar este modelo'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      {propostas[0]?.modelo?.design && (
        <details className="rounded-xl border border-white/10 px-4 py-2 text-xs text-slate-300">
          <summary className="cursor-pointer text-slate-200">Design system do Castor (JSON para o Gato)</summary>
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-[11px] text-slate-400">{JSON.stringify(propostas[0].modelo.design, null, 2)}</pre>
        </details>
      )}
      <MenteAgente agente="castor" />
    </div>
  )
}
