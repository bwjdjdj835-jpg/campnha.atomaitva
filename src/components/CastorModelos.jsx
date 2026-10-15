import { useMemo, useState } from 'react'
import { usePipeline } from '../store/pipeline.js'
import { propostasDoCastor } from '../lib/castor.js'
import { htmlDaPrevia, SANDBOX_PREVIA, CSS_MINIATURA } from '../lib/previa.jsx'
import { lembrar, PERSONALIDADES } from '../lib/mentes.js'
import MenteAgente from './MenteAgente.jsx'

// 🦫 Castor: 3 modelos do site do cliente lado a lado (prévia real, como imagem), antes do Gato finalizar.
// Escolher um aplica tema + capa + galeria no Gato; o Castor lembra a escolha para sugerir melhor da próxima vez.
export default function CastorModelos({ dados, fotosUrl, modelo, conteudo, escolhido, onEscolher }) {
  const estado = usePipeline()
  const [abertos, setAbertos] = useState(true)
  const propostas = useMemo(() => propostasDoCastor(dados, modelo, estado), [dados, modelo]) // eslint-disable-line react-hooks/exhaustive-deps
  const imagens = useMemo(
    () =>
      fotosUrl
        ? Object.fromEntries(
            propostas.map((p) => [
              p.id,
              htmlDaPrevia({ ...dados, tema: p.tema, modelo, hero: p.hero, galeria: p.galeria, efeitos: false, conteudo }, fotosUrl, CSS_MINIATURA),
            ]),
          )
        : {},
    [propostas, dados, modelo, conteudo, fotosUrl],
  )

  function escolher(p) {
    onEscolher(p)
    lembrar('castor', `${dados.negocio?.nome || 'Site'}: você escolheu "${p.titulo}"`, { tema: p.tema, hero: p.hero, galeria: p.galeria, categoria: dados.negocio?.categoria })
  }

  return (
    <div className="space-y-3 border-b border-white/5 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-2xl" aria-hidden="true">{PERSONALIDADES.castor.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="font-display font-semibold text-white">Castor: 3 modelos para você escolher</div>
          <p className="text-xs text-slate-400">
            Antes do Gato finalizar, o Castor desenhou o site de 3 jeitos diferentes, com base no estudo do Gato e no que você já escolheu
            antes. Escolha um e o Gato refina em cima dele.
          </p>
        </div>
        <button className="btn-ghost border border-white/10 !py-1 !px-3 text-xs" onClick={() => setAbertos(!abertos)}>
          {abertos ? 'Esconder' : 'Mostrar'}
        </button>
      </div>
      {abertos && (
        <div className="grid gap-3 sm:grid-cols-3">
          {propostas.map((p, i) => {
            const ativo = escolhido && escolhido.tema === p.tema && escolhido.hero === p.hero && escolhido.galeria === p.galeria
            return (
              <div key={p.id} className={`overflow-hidden rounded-xl border ${ativo ? 'border-neon ring-2 ring-neon/40' : 'border-white/10'}`}>
                <div className="relative aspect-[3/4] overflow-hidden bg-black">
                  {imagens[p.id] && (
                    <iframe
                      title={`Modelo ${i + 1}: ${p.titulo}`}
                      srcDoc={imagens[p.id]}
                      sandbox={SANDBOX_PREVIA}
                      tabIndex={-1}
                      className="pointer-events-none absolute left-0 top-0 origin-top-left"
                      style={{ width: '400%', height: '400%', transform: 'scale(0.25)' }}
                    />
                  )}
                  {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-neon px-2 py-0.5 text-[10px] font-bold text-black">RECOMENDADO</span>}
                </div>
                <div className="space-y-2 p-3">
                  <div className="text-sm font-medium text-white">
                    {i + 1}. {p.titulo}
                  </div>
                  {p.porque && <p className="text-xs text-slate-400">{p.porque}</p>}
                  <button className={`${ativo ? 'btn-ghost border border-neon/50 text-neon' : 'btn-primary'} !py-1.5 !px-3 w-full text-sm`} onClick={() => escolher(p)}>
                    {ativo ? '✓ Escolhido' : 'Usar este modelo'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <MenteAgente agente="castor" />
    </div>
  )
}
