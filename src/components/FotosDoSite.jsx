import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, Star } from 'lucide-react'

// 📸 Fotos do site no Gato: quando o Leão não trouxe fotos suficientes, você manda as suas (do celular ou do
// computador — prints das fotos do Maps/Instagram do cliente). A 1ª é a capa; as outras vão para a galeria.
// Cada mudança troca preview.fotos + preview.dados.imagens; o ZIP final sai com estas fotos.
const MAX = 12
const LADO = 1600 // reduz fotos grandes (celular) para a prévia e o vídeo não pesarem

async function reduzir(arquivo) {
  try {
    const img = await createImageBitmap(arquivo)
    const k = Math.min(1, LADO / Math.max(img.width, img.height))
    if (k === 1 && arquivo.type === 'image/jpeg') return arquivo
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * k)
    c.height = Math.round(img.height * k)
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
    return await new Promise((ok) => c.toBlob((b) => ok(b || arquivo), 'image/jpeg', 0.88))
  } catch {
    return arquivo
  }
}

const ext = (tipo) => ({ 'image/png': 'png', 'image/webp': 'webp' })[tipo] || 'jpg'

export default function FotosDoSite({ preview, onMudar }) {
  const entrada = useRef(null)
  const [miniaturas, setMiniaturas] = useState([])
  const [aviso, setAviso] = useState(null)
  const imagens = preview.dados.imagens || []

  useEffect(() => {
    const urls = preview.fotos.map((f) => URL.createObjectURL(f.blob))
    setMiniaturas(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [preview.fotos])

  // Renumera os arquivos (foto-1, foto-2…) para fotos e dados.imagens continuarem casando.
  function trocar(lista) {
    const carimbo = Date.now().toString(36)
    const novas = lista.map((x, i) => ({ ...x, caminho: `/fotos/foto-${i + 1}-${carimbo}.${ext(x.blob.type)}` }))
    // Os pares de Antes e Depois seguem as fotos (que foram renumeradas); par com foto tirada sai.
    const novoCaminho = Object.fromEntries(novas.filter((x) => x.antigo).map((x) => [x.antigo, x.caminho]))
    const antesDepois = (preview.dados.antesDepois || [])
      .map((p) => ({ ...p, antes: novoCaminho[p.antes], depois: novoCaminho[p.depois] }))
      .filter((p) => p.antes && p.depois)
    onMudar({
      ...preview,
      fotos: novas.map((x) => ({ caminho: x.caminho, blob: x.blob })),
      dados: { ...preview.dados, imagens: novas.map((x) => ({ ...x.imagem, arquivo: x.caminho })), antesDepois },
    })
  }
  const atuais = () =>
    preview.fotos.map((f) => ({ blob: f.blob, antigo: f.caminho, imagem: imagens.find((i) => i.arquivo === f.caminho) || { nomeOriginal: 'foto' } }))

  // ↔️ Antes e Depois (biblioteca do Gato): você escolhe o par de fotos reais do comércio.
  const pares = preview.dados.antesDepois || []
  const [antes, setAntes] = useState('')
  const [depois, setDepois] = useState('')
  const [legenda, setLegenda] = useState('')
  const mudarDados = (campos) => onMudar({ ...preview, dados: { ...preview.dados, ...campos } })
  function adicionarPar() {
    if (!antes || !depois || antes === depois) return setAviso('Escolha uma foto para o ANTES e outra para o DEPOIS.')
    mudarDados({ antesDepois: [...pares, { antes, depois, legenda: legenda.trim() || undefined }] })
    setAntes('')
    setDepois('')
    setLegenda('')
    setAviso('✅ Antes e Depois adicionado — arraste a linha na prévia.')
  }
  const numeroDa = (arquivo) => preview.fotos.findIndex((f) => f.caminho === arquivo) + 1
  const agendaAtual = typeof preview.dados.agendamento === 'string' ? preview.dados.agendamento : preview.dados.agendamento?.url || ''
  const [agenda, setAgenda] = useState(agendaAtual)

  async function adicionar(arquivos) {
    const lista = [...arquivos].filter((a) => a.type.startsWith('image/')).slice(0, MAX - preview.fotos.length)
    if (!lista.length) return setAviso(preview.fotos.length >= MAX ? `Máximo de ${MAX} fotos.` : 'Escolha arquivos de imagem.')
    const novas = await Promise.all(lista.map(async (a) => ({ blob: await reduzir(a), imagem: { nomeOriginal: a.name, enviadaPorVoce: true } })))
    trocar([...atuais(), ...novas])
    setAviso(`✅ ${novas.length} foto(s) adicionada(s). Confira na prévia.`)
  }

  const tirar = (i) => trocar(atuais().filter((_, j) => j !== i))
  const capa = (i) => {
    const lista = atuais()
    trocar([lista[i], ...lista.filter((_, j) => j !== i)])
  }

  return (
    <div className="space-y-3 border-b border-white/5 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold text-white">📸 Fotos e peças do site ({preview.fotos.length} fotos)</div>
          <p className="text-xs text-slate-400">
            {preview.fotos.length < 4
              ? 'Poucas fotos. Mande fotos do comércio (salve as fotos do Maps ou do Instagram dele no celular e escolha aqui).'
              : 'A 1ª é a capa; as outras vão para a galeria.'}{' '}
            Use só fotos do próprio comércio.
          </p>
        </div>
        <button className="btn-primary !py-2 !px-4 text-sm" onClick={() => entrada.current?.click()}>
          <ImagePlus size={16} /> Adicionar fotos
        </button>
        <input
          ref={entrada}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            adicionar(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
      {miniaturas.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {miniaturas.map((u, i) => (
            <div key={u} className={`relative overflow-hidden rounded-lg border ${i === 0 ? 'border-neon' : 'border-white/10'}`}>
              <img src={u} alt={`Foto ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
              {i === 0 && <span className="absolute left-1 top-1 rounded-full bg-neon px-1.5 text-[10px] font-bold text-black">CAPA</span>}
              <div className="absolute bottom-1 right-1 flex gap-1">
                {i > 0 && (
                  <button className="rounded bg-black/70 p-1 text-amber-300" title="Usar como capa" onClick={() => capa(i)}>
                    <Star size={14} />
                  </button>
                )}
                <button className="rounded bg-black/70 p-1 text-rose-300" title="Tirar esta foto" onClick={() => tirar(i)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {preview.fotos.length >= 2 && (
        <div className="space-y-2 rounded-xl border border-white/10 p-3">
          <div className="text-sm font-medium text-white">↔️ Antes e Depois (o visitante arrasta a linha para comparar)</div>
          <p className="text-xs text-slate-400">Só com fotos reais do comércio — ex.: corte antes e depois, carro antes e depois do polimento.</p>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-slate-400">
              Antes
              <select className="input !py-1.5" value={antes} onChange={(e) => setAntes(e.target.value)}>
                <option value="">Foto…</option>
                {preview.fotos.map((f, i) => (
                  <option key={f.caminho} value={f.caminho}>
                    Foto {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-400">
              Depois
              <select className="input !py-1.5" value={depois} onChange={(e) => setDepois(e.target.value)}>
                <option value="">Foto…</option>
                {preview.fotos.map((f, i) => (
                  <option key={f.caminho} value={f.caminho}>
                    Foto {i + 1}
                  </option>
                ))}
              </select>
            </label>
            <label className="min-w-[10rem] flex-1 text-xs text-slate-400">
              Legenda (opcional)
              <input className="input !py-1.5" value={legenda} onChange={(e) => setLegenda(e.target.value)} placeholder="Ex.: Degradê com barba" />
            </label>
            <button className="btn-primary !py-2 !px-3 text-sm" onClick={adicionarPar}>
              Adicionar
            </button>
          </div>
          {pares.length > 0 && (
            <ul className="flex flex-wrap gap-2 text-xs">
              {pares.map((p, i) => (
                <li key={i} className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-slate-200">
                  Foto {numeroDa(p.antes)} → Foto {numeroDa(p.depois)}
                  {p.legenda && <span className="text-slate-400">· {p.legenda}</span>}
                  <button className="text-rose-300" title="Tirar" onClick={() => mudarDados({ antesDepois: pares.filter((_, j) => j !== i) })}>
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="space-y-2 rounded-xl border border-white/10 p-3">
        <div className="text-sm font-medium text-white">📅 Agendamento online (link do próprio comércio)</div>
        <p className="text-xs text-slate-400">
          Calendly ou Cal.com aparecem como agenda dentro do site; outro link (Booksy, Trinks, Google Agenda…) vira o botão "Agendar online". Sem
          link, o site agenda pelo WhatsApp.
        </p>
        <div className="flex flex-wrap gap-2">
          <input className="input min-w-[14rem] flex-1 !py-1.5" value={agenda} onChange={(e) => setAgenda(e.target.value)} placeholder="https://calendly.com/…" />
          <button
            className="btn-ghost border border-white/10 !py-1.5 !px-3 text-sm"
            onClick={() => {
              const url = agenda.trim()
              if (url && !/^https:\/\/\S+$/.test(url)) return setAviso('Cole o link completo, começando com https://')
              mudarDados({ agendamento: url ? { url } : undefined })
              setAviso(url ? '✅ Agendamento adicionado ao site.' : 'Agendamento tirado do site.')
            }}
          >
            {agendaAtual ? 'Salvar link' : 'Adicionar ao site'}
          </button>
        </div>
      </div>
      {aviso && <p className="text-xs text-slate-300">{aviso}</p>}
    </div>
  )
}
