import { useRef, useState } from 'react'
import { BookOpen, Link2, FileText, ClipboardPaste, Loader2, Trash2, Plus } from 'lucide-react'
import { usePipeline } from '../store/pipeline.js'
import { NO_MANUAL, itensDaBiblioteca, licoesAtivas, estudar, estudarLink, textoDoPdf, textoLegivel, mudarLicao, adicionarLicao, tirarLicao, removerItem } from '../lib/biblioteca.js'

const ICONE = { link: '🔗', pdf: '📄', texto: '📝' }
const CATEGORIA = { design: 'Design', estrutura: 'Estrutura', texto: 'Texto que vende', interacao: 'Interação', tecnica: 'Técnica' }

// 📚 Biblioteca do Gato: você dá material para ele estudar; as lições marcadas vão junto em todo site que ele monta.
export default function BibliotecaGato() {
  const estado = usePipeline()
  const itens = itensDaBiblioteca(estado)
  const ativas = licoesAtivas(estado).length
  const [aberta, setAberta] = useState(false)
  const [link, setLink] = useState('')
  const [colado, setColado] = useState('')
  const [tituloColado, setTituloColado] = useState('')
  const [trabalhando, setTrabalhando] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [novaLicao, setNovaLicao] = useState({})
  const entradaPdf = useRef(null)

  async function rodar(rotulo, fn) {
    setTrabalhando(rotulo)
    setAviso(null)
    try {
      const r = await fn()
      setAviso(r?.aviso || `✅ Estudado: "${r.item.titulo}" — ${r.item.licoes.length} lição(ões). Desmarque o que não quiser.`)
    } catch (e) {
      setAviso(`Não consegui: ${e.message}`)
    } finally {
      setTrabalhando(null)
    }
  }

  return (
    <section className="glass overflow-hidden">
      <button className="flex w-full flex-wrap items-center gap-2 px-5 py-4 text-left" onClick={() => setAberta(!aberta)}>
        <BookOpen size={18} className="text-neon" />
        <span className="font-display font-semibold text-white">📚 Biblioteca do Gato</span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">
          {itens.length} material(is) · {ativas} lição(ões) em uso
        </span>
        <span className="ml-auto text-xs text-slate-400">{aberta ? 'Esconder' : 'Abrir'}</span>
      </button>
      {aberta && (
        <div className="space-y-4 border-t border-white/5 px-5 py-4">
          <p className="text-sm text-slate-300">
            Dê material para o Gato estudar: <strong className="text-white">sites modelo</strong>, <strong className="text-white">sites interativos</strong>,{' '}
            <strong className="text-white">cursos em PDF</strong> ou um texto. Ele tira as lições, você revisa, e as marcadas vão junto em{' '}
            <strong className="text-white">todo site</strong> que ele montar.
          </p>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="space-y-2 rounded-xl border border-white/10 p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                <Link2 size={15} /> Link de site
              </div>
              <input className="input !py-1.5" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://site-que-voce-gostou.com" />
              <button
                className="btn-primary !py-1.5 !px-3 w-full text-sm"
                disabled={!!trabalhando || !/^https?:\/\/\S+$/.test(link.trim())}
                onClick={() => rodar('link', () => estudarLink(link.trim())).then(() => setLink(''))}
              >
                {trabalhando === 'link' ? <Loader2 size={14} className="animate-spin" /> : null} Estudar este site
              </button>
              <p className="text-[11px] text-slate-500">Lê o texto e as técnicas interativas do código (GSAP, rolagem suave, carrossel…).</p>
            </div>

            <div className="space-y-2 rounded-xl border border-white/10 p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                <FileText size={15} /> PDF (curso, e-book)
              </div>
              <button className="btn-primary !py-1.5 !px-3 w-full text-sm" disabled={!!trabalhando} onClick={() => entradaPdf.current?.click()}>
                {trabalhando === 'pdf' ? <Loader2 size={14} className="animate-spin" /> : null} Enviar PDF
              </button>
              <input
                ref={entradaPdf}
                type="file"
                accept="application/pdf"
                hidden
                onChange={(e) => {
                  const arquivo = e.target.files?.[0]
                  e.target.value = ''
                  if (!arquivo) return
                  rodar('pdf', async () => {
                    const { texto } = await textoDoPdf(arquivo)
                    if (texto.length < 80) throw new Error('não achei texto nesse PDF (pode ser só imagem). Cole o texto no campo ao lado.')
                    if (!textoLegivel(texto)) {
                      throw new Error(
                        'o texto deste PDF está embaralhado por dentro (proteção comum em PDFs do Canva) — na tela aparece certo, mas a IA receberia letras trocadas. Copie o texto das páginas (ou de um print) e use "Colar texto".',
                      )
                    }
                    return estudar({ tipo: 'pdf', titulo: arquivo.name.replace(/\.pdf$/i, ''), fonte: arquivo.name, texto })
                  })
                }}
              />
              <p className="text-[11px] text-slate-500">O PDF é lido aqui no aparelho; só o texto vai para a IA.</p>
            </div>

            <div className="space-y-2 rounded-xl border border-white/10 p-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-white">
                <ClipboardPaste size={15} /> Colar texto
              </div>
              <input className="input !py-1.5" value={tituloColado} onChange={(e) => setTituloColado(e.target.value)} placeholder="Título (ex.: Aula 3 — botões)" />
              <textarea className="input !py-1.5" rows={2} value={colado} onChange={(e) => setColado(e.target.value)} placeholder="Cole aqui o texto do curso, anotações…" />
              <button
                className="btn-primary !py-1.5 !px-3 w-full text-sm"
                disabled={!!trabalhando || colado.trim().length < 30}
                onClick={() =>
                  rodar('texto', () => estudar({ tipo: 'texto', titulo: tituloColado.trim() || 'Texto colado', texto: colado })).then(() => {
                    setColado('')
                    setTituloColado('')
                  })
                }
              >
                {trabalhando === 'texto' ? <Loader2 size={14} className="animate-spin" /> : null} Estudar texto
              </button>
            </div>
          </div>
          {aviso && <p className="text-sm text-slate-200">{aviso}</p>}

          <ul className="space-y-2">
            {NO_MANUAL.map((m) => (
              <li key={m.titulo} className="rounded-xl border border-neon/20 bg-neon/5 px-4 py-2 text-sm">
                <span className="font-medium text-white">{m.titulo}</span> <span className="text-[11px] text-neon">sempre em uso</span>
                <p className="text-xs text-slate-400">{m.resumo}</p>
              </li>
            ))}
            {itens.map((item) => (
              <li key={item.id} className="rounded-xl border border-white/10 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span>{ICONE[item.tipo] || '📌'}</span>
                  <span className="font-medium text-white">{item.titulo}</span>
                  {item.fonte && item.tipo === 'link' && (
                    <a href={item.fonte} target="_blank" rel="noreferrer" className="truncate text-xs text-neon hover:underline">
                      {item.fonte}
                    </a>
                  )}
                  <button className="ml-auto text-rose-300 hover:text-rose-200" title="Tirar da biblioteca" onClick={() => removerItem(item.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
                {item.resumo && <p className="mt-1 text-xs text-slate-400">{item.resumo}</p>}
                {item.fontes?.length > 0 && <p className="mt-1 text-[11px] text-slate-500">Fontes: {item.fontes.join(', ')}</p>}
                <ul className="mt-2 space-y-1">
                  {item.licoes.map((l) => (
                    <li key={l.id} className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1 accent-cyan-400" checked={l.ativa} onChange={(e) => mudarLicao(item.id, l.id, { ativa: e.target.checked })} />
                      <span className={l.ativa ? 'text-slate-200' : 'text-slate-500 line-through'}>
                        <span className="mr-1 rounded bg-white/10 px-1.5 text-[10px] text-slate-300">{CATEGORIA[l.categoria] || 'Lição'}</span>
                        {l.texto}
                      </span>
                      <button className="ml-auto text-xs text-slate-500 hover:text-rose-300" title="Apagar lição" onClick={() => tirarLicao(item.id, l.id)}>
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <input
                    className="input !py-1 text-xs"
                    value={novaLicao[item.id] || ''}
                    onChange={(e) => setNovaLicao((n) => ({ ...n, [item.id]: e.target.value }))}
                    placeholder="Escrever uma lição sua…"
                  />
                  <button
                    className="btn-ghost border border-white/10 !py-1 !px-2 text-xs"
                    onClick={() => {
                      adicionarLicao(item.id, novaLicao[item.id])
                      setNovaLicao((n) => ({ ...n, [item.id]: '' }))
                    }}
                  >
                    <Plus size={13} /> Adicionar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-500">
            As lições entram quando o Gato monta o site pela sua imagem (Castor → "Enviar minhas imagens"). Máximo de 40 lições em uso.
          </p>
        </div>
      )}
    </section>
  )
}
