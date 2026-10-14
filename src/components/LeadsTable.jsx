import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, MessageCircle, Instagram, Copy, Check, ArrowRight, Search } from 'lucide-react'
import { linkBuscaInstagram } from '../lib/links.js'

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

export default function LeadsTable({ leads }) {
  const navigate = useNavigate()
  if (!leads.length) return null
  return (
    <div className="glass overflow-hidden">
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-display font-semibold text-white">Leads confirmados</h3>
        <span className="text-xs text-slate-400">{leads.length} negócio(s)</span>
      </div>
      <ul>
        {leads.map((l) => {
          const linkLeao = l.maps || l.instagram || l.whatsapp
          return (
            <li key={l.id} className="border-t border-white/5 first:border-t-0 px-5 py-4 space-y-3">
              <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                <div className="min-w-0 flex-1">
                  <div className="text-white font-medium flex flex-wrap items-center gap-2">
                    {l.nome}
                    {l.demo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300">DEMO</span>}
                  </div>
                  <div className="text-xs text-slate-500">{l.endereco}</div>
                  <div className="text-sm font-mono text-slate-300 mt-0.5">{l.telefone}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${l.confianca === 'Alto' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>
                  {l.confianca}
                </span>
              </div>

              <div className="space-y-1.5">
                <LinhaLink icone={MapPin} cor="text-sky-400" rotulo="Google Maps" href={l.maps} />
                {l.instagram ? (
                  <LinhaLink icone={Instagram} cor="text-pink-400" rotulo="Instagram" href={l.instagram} />
                ) : (
                  <LinhaLink icone={Search} cor="text-pink-400/60" rotulo="Instagram" href={linkBuscaInstagram(l.nome, cidadeDe(l.endereco))} busca />
                )}
                <LinhaLink icone={MessageCircle} cor="text-emerald-400" rotulo="WhatsApp" href={l.whatsapp} />
              </div>

              {linkLeao && (
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
