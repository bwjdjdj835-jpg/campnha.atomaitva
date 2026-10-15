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
    onMudar({
      ...preview,
      fotos: novas.map((x) => ({ caminho: x.caminho, blob: x.blob })),
      dados: { ...preview.dados, imagens: novas.map((x) => ({ ...x.imagem, arquivo: x.caminho })) },
    })
  }
  const atuais = () =>
    preview.fotos.map((f) => ({ blob: f.blob, imagem: imagens.find((i) => i.arquivo === f.caminho) || { nomeOriginal: 'foto' } }))

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
          <div className="font-display font-semibold text-white">📸 Fotos do site ({preview.fotos.length})</div>
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
      {aviso && <p className="text-xs text-slate-300">{aviso}</p>}
    </div>
  )
}
