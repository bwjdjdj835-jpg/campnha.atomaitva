import { useEffect, useMemo, useState } from 'react'
import { Eye, Loader2, Monitor, Smartphone, Cloud, ExternalLink, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fotosEmDataUrl, htmlDaPrevia, SANDBOX_PREVIA } from '../lib/previa.jsx'

// O que o Leão extraiu (dados + fotos) e como o site fica com isso, antes de ir para o Gato Negro.
export default function PreviaLeao({ previa }) {
  const { dados, fotos, pasta, siteId } = previa
  const [fotosUrl, setFotosUrl] = useState(null)
  const [device, setDevice] = useState('desktop')

  useEffect(() => {
    let vivo = true
    fotosEmDataUrl(fotos).then((urls) => vivo && setFotosUrl(urls))
    return () => {
      vivo = false
    }
  }, [fotos])

  const srcDoc = useMemo(() => (fotosUrl ? htmlDaPrevia(dados, fotosUrl) : ''), [dados, fotosUrl])
  const n = dados.negocio
  const campos = [
    ['Nome', n.nome],
    ['Categoria', n.categoria],
    ['Telefone', n.telefone !== '—' ? n.telefone : null],
    ['Endereço', n.endereco],
    ['Nota no Google', n.rating ? `★ ${n.rating} (${n.avaliacoes} avaliações)` : null],
  ]
  const links = [
    ['WhatsApp', n.whatsapp],
    ['Google Maps', n.maps],
    ['Instagram', n.instagram],
  ].filter(([, url]) => url)

  return (
    <section className="glass overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-white/5">
        <h3 className="flex items-center gap-2 font-display font-semibold text-white">
          <Eye size={18} className="text-neon" /> O que o Leão extraiu
        </h3>
        {dados.demo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300">DEMO</span>}
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <dl className="space-y-2 text-sm">
          {campos.map(([rotulo, valor]) => (
            <div key={rotulo} className="flex gap-3">
              <dt className="w-32 shrink-0 text-slate-500">{rotulo}</dt>
              <dd className={valor ? 'text-slate-200' : 'text-slate-600'}>{valor || 'não encontrado'}</dd>
            </div>
          ))}
          {links.length > 0 && (
            <div className="flex gap-3">
              <dt className="w-32 shrink-0 text-slate-500">Links</dt>
              <dd className="flex flex-wrap gap-3">
                {links.map(([rotulo, url]) => (
                  <a key={rotulo} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-300 hover:text-neon">
                    <ExternalLink size={13} /> {rotulo}
                  </a>
                ))}
              </dd>
            </div>
          )}
        </dl>

        <div>
          <div className="label">Fotos ({dados.imagens.length})</div>
          {dados.imagens.length ? (
            <div className="grid grid-cols-3 gap-2">
              {dados.imagens.map((img) => (
                <a key={img.arquivo} href={img.hospedada || img.link} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-lg border border-white/10">
                  {fotosUrl?.[img.arquivo] ? (
                    <img src={fotosUrl[img.arquivo]} alt="" className="aspect-square w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="aspect-square w-full bg-white/5" />
                  )}
                  {img.hospedada && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/60 p-1 text-neon" title="Hospedada na pasta online">
                      <Cloud size={12} />
                    </span>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhuma foto — o site sai com capa em cor sólida.</p>
          )}
          <p className="mt-3 text-xs text-slate-400">
            {pasta ? (
              <>
                <Cloud size={12} className="inline text-neon" /> Pasta online:{' '}
                <a href={pasta} target="_blank" rel="noreferrer" className="font-mono text-slate-300 hover:text-neon">dados.json</a>{' '}
                — o Gato Negro abre de qualquer aparelho.
              </>
            ) : (
              'Pasta online desligada: o pacote ficou guardado neste navegador (o Gato abre por aqui).'
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 px-5 pt-2">
        <div className="label !mb-0">Prévia do site (mova o cursor sobre a capa)</div>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-white/10 p-1">
          <button className={`btn-ghost !px-2 !py-1 ${device === 'desktop' ? 'bg-white/10 text-white' : ''}`} onClick={() => setDevice('desktop')} title="Computador">
            <Monitor size={16} />
          </button>
          <button className={`btn-ghost !px-2 !py-1 ${device === 'mobile' ? 'bg-white/10 text-white' : ''}`} onClick={() => setDevice('mobile')} title="Celular">
            <Smartphone size={16} />
          </button>
        </div>
      </div>
      <div className="p-5">
        <div className="mx-auto overflow-hidden rounded-xl border border-white/10 bg-white transition-all" style={{ maxWidth: device === 'mobile' ? 390 : '100%' }}>
          {srcDoc ? (
            <iframe title="Prévia do site" srcDoc={srcDoc} sandbox={SANDBOX_PREVIA} className="block w-full h-[560px]" />
          ) : (
            <div className="grid h-[560px] place-items-center text-slate-500">
              <Loader2 className="animate-spin" />
            </div>
          )}
        </div>
      </div>
      <div className="px-5 pb-5">
        <Link to={`/agente/gato?site=${siteId}`} className="btn-primary w-full">
          Mandar para o 🐈‍⬛ Gato Negro refinar <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  )
}
