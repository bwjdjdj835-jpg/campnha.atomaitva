// Componente do site gerado para o cliente (React + Tailwind).
// ESTE ARQUIVO VAI INTEIRO PARA DENTRO DO ZIP (src/Site.jsx) e também renderiza a prévia do Gato Negro,
// então a prévia aprovada é exatamente o site entregue. Mantenha-o sem imports.
// As classes ficam literais (sem montar string) para o Tailwind do projeto gerado encontrá-las.

export const TEMAS = {
  noite: {
    nome: 'Noite (escuro + dourado)',
    pagina: 'bg-neutral-950 text-neutral-100',
    sobreposicao: 'bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent',
    capaVazia: 'bg-gradient-to-br from-neutral-900 to-neutral-800',
    rotulo: 'text-amber-400',
    titulo: 'text-white',
    botao: 'bg-amber-400 text-neutral-950 hover:bg-amber-300',
    secao: 'border-neutral-800',
    cartao: 'bg-neutral-900 border-neutral-800',
    texto: 'text-neutral-300',
    link: 'text-amber-400 hover:text-amber-300',
    rodape: 'border-neutral-800 text-neutral-500',
  },
  claro: {
    nome: 'Claro (minimalista)',
    pagina: 'bg-white text-neutral-900',
    sobreposicao: 'bg-gradient-to-t from-black/70 via-black/30 to-transparent',
    capaVazia: 'bg-gradient-to-br from-emerald-700 to-emerald-900',
    rotulo: 'text-emerald-200',
    titulo: 'text-white',
    botao: 'bg-emerald-600 text-white hover:bg-emerald-700',
    secao: 'border-neutral-200',
    cartao: 'bg-neutral-50 border-neutral-200',
    texto: 'text-neutral-600',
    link: 'text-emerald-700 hover:text-emerald-800',
    rodape: 'border-neutral-200 text-neutral-500',
  },
  studio: {
    nome: 'Studio (interativo)',
    pagina: 'bg-zinc-950 text-zinc-100',
    sobreposicao: 'bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-zinc-950/10',
    capaVazia: 'bg-gradient-to-br from-fuchsia-700 via-violet-800 to-cyan-700 anim-brilho',
    rotulo: 'text-fuchsia-300',
    titulo: 'text-white',
    botao: 'bg-white text-zinc-950 hover:bg-fuchsia-200 hover:shadow-[0_0_40px_-6px_rgba(232,121,249,0.8)]',
    secao: 'border-white/10',
    cartao: 'bg-white/5 border-white/10 backdrop-blur',
    texto: 'text-zinc-300',
    link: 'text-fuchsia-300 hover:text-fuchsia-200',
    rodape: 'border-white/10 text-zinc-500',
  },
  vibrante: {
    nome: 'Vibrante (quente)',
    pagina: 'bg-orange-50 text-stone-900',
    sobreposicao: 'bg-gradient-to-t from-orange-950/80 via-orange-900/30 to-transparent',
    capaVazia: 'bg-gradient-to-br from-orange-500 to-red-600',
    rotulo: 'text-orange-200',
    titulo: 'text-white',
    botao: 'bg-orange-600 text-white hover:bg-orange-700',
    secao: 'border-orange-200',
    cartao: 'bg-white border-orange-200',
    texto: 'text-stone-600',
    link: 'text-orange-700 hover:text-orange-800',
    rodape: 'border-orange-200 text-stone-500',
  },
}

export default function Site({ dados }) {
  const { negocio, imagens = [], conteudo = {} } = dados
  const servicos = conteudo.servicos || []
  const t = TEMAS[dados.tema] || TEMAS.claro
  const capa = imagens[0]
  const galeria = imagens.slice(1)
  const mapa =
    negocio.endereco &&
    'https://maps.google.com/maps?output=embed&q=' + encodeURIComponent(negocio.nome + ', ' + negocio.endereco)

  return (
    <div className={'min-h-screen font-sans antialiased ' + t.pagina}>
      <header className="relative">
        {/* data-agua: a capa ondula seguindo o cursor (src/agua.js) */}
        {capa ? (
          <div data-agua="foto" className="relative h-[70vh] min-h-[420px] w-full overflow-hidden">
            <img src={capa.arquivo} alt={negocio.nome} className="anim-zoom h-full w-full object-cover" />
          </div>
        ) : (
          <div data-agua="cor" className={'relative h-[55vh] min-h-[360px] w-full overflow-hidden ' + t.capaVazia} />
        )}
        <div className={'absolute inset-0 ' + t.sobreposicao} />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl px-6 pb-12">
          {negocio.categoria && (
            <p className={'anim-subir text-xs font-semibold uppercase tracking-[0.3em] ' + t.rotulo}>{negocio.categoria}</p>
          )}
          <h1 className={'anim-subir anim-atraso-1 mt-3 text-4xl font-bold leading-tight sm:text-6xl ' + t.titulo}>{negocio.nome}</h1>
          {negocio.rating && (
            <p className="anim-subir anim-atraso-2 mt-3 text-sm text-white/90">
              ★ {negocio.rating} · {negocio.avaliacoes} avaliações no Google
            </p>
          )}
          {negocio.whatsapp && (
            <a
              href={negocio.whatsapp}
              className={'anim-subir anim-atraso-3 mt-6 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold shadow-lg transition duration-300 hover:-translate-y-0.5 hover:scale-105 ' + t.botao}
            >
              Chamar no WhatsApp
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-16 px-6 py-16">
        {conteudo.sobre && (
          <section className="anim-revelar max-w-3xl">
            <h2 className="mb-4 text-2xl font-bold sm:text-3xl">Sobre</h2>
            <p className={'text-lg leading-relaxed ' + t.texto}>{conteudo.sobre}</p>
          </section>
        )}

        {servicos.length > 0 && (
          <section className="anim-revelar">
            <h2 className="mb-6 text-2xl font-bold sm:text-3xl">Serviços</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {servicos.map((s) => (
                <li key={s} className={'rounded-xl border px-5 py-4 font-medium transition duration-300 hover:-translate-y-1 hover:shadow-xl ' + t.cartao}>
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}

        {galeria.length > 0 && (
          <section className="anim-revelar">
            <h2 className="mb-6 text-2xl font-bold sm:text-3xl">Fotos</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {galeria.map((img) => (
                <div key={img.arquivo} className="group overflow-hidden rounded-xl">
                  <img src={img.arquivo} alt="" className="aspect-square w-full object-cover transition duration-500 group-hover:scale-110" />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={'anim-revelar grid gap-8 border-t pt-16 sm:grid-cols-2 ' + t.secao}>
          <div>
            <h2 className="mb-6 text-2xl font-bold sm:text-3xl">Onde estamos</h2>
            <ul className={'space-y-3 ' + t.texto}>
              {negocio.endereco && <li>{negocio.endereco}</li>}
              {conteudo.horarios && <li>Horário: {conteudo.horarios}</li>}
              {negocio.telefone && negocio.telefone !== '—' && <li>{negocio.telefone}</li>}
              {negocio.instagram && (
                <li>
                  <a className={'font-medium underline-offset-4 hover:underline ' + t.link} href={negocio.instagram}>
                    Instagram
                  </a>
                </li>
              )}
              {negocio.maps && (
                <li>
                  <a className={'font-medium underline-offset-4 hover:underline ' + t.link} href={negocio.maps}>
                    Abrir no mapa
                  </a>
                </li>
              )}
            </ul>
          </div>
          {mapa && (
            <iframe title="Mapa" loading="lazy" src={mapa} className={'h-72 w-full rounded-xl border ' + t.cartao} />
          )}
        </section>
      </main>

      <footer className={'border-t py-8 text-center text-sm ' + t.rodape}>
        © {new Date().getFullYear()} {negocio.nome}
      </footer>

      {negocio.whatsapp && (
        <a
          href={negocio.whatsapp}
          aria-label="WhatsApp"
          className="anim-pulso fixed bottom-5 right-5 grid h-14 w-14 place-items-center rounded-full bg-green-500 text-white shadow-xl transition hover:scale-110"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.6-.3Z" />
          </svg>
        </a>
      )}
    </div>
  )
}

// Escolhe um tema inicial pelo segmento do negócio (o usuário pode trocar na prévia).
export function temaSugerido(categoria) {
  const c = String(categoria || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  if (/barbe|bar\b|tatu|pub|choper|academia|oficina|mecanic/.test(c)) return 'noite'
  if (/restaur|lanch|pizza|hamburg|acai|sorvet|pet|confeit|doce|padaria/.test(c)) return 'vibrante'
  return 'claro'
}
