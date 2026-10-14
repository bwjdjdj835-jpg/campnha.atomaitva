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
    acento: 'text-amber-400',
    faixa: 'bg-amber-400 text-neutral-950',
    destaque: 'bg-neutral-900/80 border-neutral-800',
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
    acento: 'text-emerald-700',
    faixa: 'bg-emerald-700 text-white',
    destaque: 'bg-white border-neutral-200 shadow-sm',
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
    acento: 'text-fuchsia-300',
    faixa: 'bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-600 text-white',
    destaque: 'bg-white/5 border-white/10 backdrop-blur',
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
    acento: 'text-orange-700',
    faixa: 'bg-orange-600 text-white',
    destaque: 'bg-white border-orange-200 shadow-sm',
  },
}

export default function Site({ dados }) {
  const { negocio, imagens = [], conteudo = {} } = dados
  const servicos = conteudo.servicos || []
  const t = TEMAS[dados.tema] || TEMAS.claro
  const capa = imagens[0]
  const galeria = imagens.slice(1)
  // Foto de fundo da faixa de contato: outra foto do cliente (ou a capa, se só tiver uma).
  const fundoFaixa = imagens[2] || imagens[1] || capa
  const telefone = negocio.telefone && negocio.telefone !== '—' ? negocio.telefone : null
  const cidade = (negocio.endereco || '').split(' - ').slice(-2).join(' - ').replace(/,?\s*\d{5}-?\d{3}.*$/, '')
  const mapa =
    negocio.endereco &&
    'https://maps.google.com/maps?output=embed&q=' + encodeURIComponent(negocio.nome + ', ' + negocio.endereco)

  // Destaques: só fatos que vieram dos dados (nada inventado).
  const destaques = [
    negocio.rating && { titulo: '★ ' + String(negocio.rating).replace('.', ','), texto: (negocio.avaliacoes || 0) + ' avaliações no Google' },
    conteudo.horarios && { titulo: 'Horário', texto: conteudo.horarios },
    cidade && { titulo: 'Onde', texto: cidade },
    negocio.whatsapp && { titulo: 'WhatsApp', texto: 'Atendimento e agendamento pelo WhatsApp' },
  ].filter(Boolean)

  return (
    <div className={'min-h-screen font-sans antialiased ' + t.pagina}>
      <header className="relative">
        {/* data-agua: a capa ondula seguindo o cursor (src/agua.js) */}
        {capa ? (
          <div data-agua="foto" className="relative h-[85vh] min-h-[480px] w-full overflow-hidden">
            <img src={capa.arquivo} alt={negocio.nome} className="anim-zoom h-full w-full object-cover" />
          </div>
        ) : (
          <div data-agua="cor" className={'relative h-[70vh] min-h-[420px] w-full overflow-hidden ' + t.capaVazia} />
        )}
        <div className={'pointer-events-none absolute inset-0 ' + t.sobreposicao} />
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-20">
          {negocio.categoria && (
            <p className={'anim-subir text-xs font-semibold uppercase tracking-[0.3em] ' + t.rotulo}>{negocio.categoria}</p>
          )}
          <h1 className={'anim-subir anim-atraso-1 mt-3 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl ' + t.titulo}>
            {negocio.nome}
          </h1>
          {(negocio.rating || cidade) && (
            <p className="anim-subir anim-atraso-2 mt-4 text-base text-white/90">
              {negocio.rating && <span>★ {negocio.rating} · {negocio.avaliacoes} avaliações no Google</span>}
              {negocio.rating && cidade && <span> · </span>}
              {cidade && <span>{cidade}</span>}
            </p>
          )}
          <div className="anim-subir anim-atraso-3 mt-8 flex flex-wrap gap-3">
            {negocio.whatsapp && (
              <a href={negocio.whatsapp} className={'inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg font-semibold shadow-lg transition duration-300 hover:-translate-y-0.5 hover:scale-105 ' + t.botao}>
                Chamar no WhatsApp
              </a>
            )}
            {galeria.length > 0 && (
              <a href="#fotos" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-8 py-4 text-lg font-semibold text-white backdrop-blur transition hover:bg-white/10">
                Ver fotos
              </a>
            )}
          </div>
        </div>
      </header>

      {destaques.length > 0 && (
        <section className="relative z-10 mx-auto -mt-10 max-w-6xl px-6">
          <ul className={'grid gap-3 sm:grid-cols-2 ' + (destaques.length === 4 ? 'lg:grid-cols-4' : destaques.length === 3 ? 'lg:grid-cols-3' : '')}>
            {destaques.map((d) => (
              <li key={d.titulo} className={'anim-revelar rounded-2xl border px-5 py-5 transition duration-300 hover:-translate-y-1 ' + t.destaque}>
                <p className={'text-lg font-bold ' + t.acento}>{d.titulo}</p>
                <p className={'mt-1 text-sm ' + t.texto}>{d.texto}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <main className="mx-auto max-w-6xl space-y-24 px-6 py-24">
        {conteudo.sobre && (
          <section className="anim-revelar grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className={'text-xs font-semibold uppercase tracking-[0.3em] ' + t.acento}>Sobre</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Quem somos</h2>
              <p className={'mt-5 text-lg leading-relaxed ' + t.texto}>{conteudo.sobre}</p>
            </div>
            {imagens[1] && (
              <div className="overflow-hidden rounded-3xl">
                <img src={imagens[1].arquivo} alt="" className="aspect-[4/3] w-full object-cover transition duration-700 hover:scale-105" />
              </div>
            )}
          </section>
        )}

        {servicos.length > 0 && (
          <section className="anim-revelar">
            <p className={'text-xs font-semibold uppercase tracking-[0.3em] ' + t.acento}>O que fazemos</p>
            <h2 className="mt-3 mb-8 text-3xl font-bold sm:text-4xl">Serviços</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {servicos.map((s, i) => (
                <li key={s} className={'group rounded-2xl border px-6 py-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl ' + t.cartao}>
                  <span className={'text-sm font-mono ' + t.acento}>{String(i + 1).padStart(2, '0')}</span>
                  <p className="mt-2 text-lg font-semibold">{s}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {galeria.length > 0 && (
          <section id="fotos" className="anim-revelar">
            <p className={'text-xs font-semibold uppercase tracking-[0.3em] ' + t.acento}>Galeria</p>
            <h2 className="mt-3 mb-8 text-3xl font-bold sm:text-4xl">Fotos</h2>
            {/* Mosaico: a primeira foto ocupa um bloco grande. */}
            <div className="grid auto-rows-[160px] grid-cols-2 gap-3 sm:auto-rows-[220px] sm:grid-cols-4">
              {galeria.map((img, i) => (
                <div
                  key={img.arquivo}
                  className={'group overflow-hidden rounded-2xl ' + (i === 0 ? 'col-span-2 row-span-2' : i === 3 ? 'sm:col-span-2' : '')}
                >
                  <img src={img.arquivo} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {(negocio.whatsapp || telefone) && (
        <section className="relative overflow-hidden">
          {fundoFaixa ? (
            <img src={fundoFaixa.arquivo} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : null}
          <div className={'relative ' + (fundoFaixa ? 'bg-black/65 text-white' : t.faixa)}>
            <div className="anim-revelar mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-20 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-3xl font-bold sm:text-5xl">Fale com a gente agora</h2>
                <p className="mt-3 text-lg opacity-90">
                  {telefone ? 'Atendimento pelo ' + telefone : 'Atendimento rápido pelo WhatsApp'}
                </p>
              </div>
              {negocio.whatsapp && (
                <a href={negocio.whatsapp} className={'inline-flex shrink-0 items-center gap-2 rounded-full px-8 py-4 text-lg font-semibold shadow-xl transition duration-300 hover:scale-105 ' + t.botao}>
                  Chamar no WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <section className={'mx-auto grid max-w-6xl gap-10 px-6 py-24 lg:grid-cols-2'}>
        <div className="anim-revelar">
          <p className={'text-xs font-semibold uppercase tracking-[0.3em] ' + t.acento}>Contato</p>
          <h2 className="mt-3 mb-6 text-3xl font-bold sm:text-4xl">Onde estamos</h2>
          <ul className={'space-y-4 text-lg ' + t.texto}>
            {negocio.endereco && <li>{negocio.endereco}</li>}
            {conteudo.horarios && <li>Horário: {conteudo.horarios}</li>}
            {telefone && <li>{telefone}</li>}
          </ul>
          <div className="mt-6 flex flex-wrap gap-4">
            {negocio.instagram && (
              <a className={'font-semibold underline-offset-4 hover:underline ' + t.link} href={negocio.instagram}>
                Instagram
              </a>
            )}
            {negocio.maps && (
              <a className={'font-semibold underline-offset-4 hover:underline ' + t.link} href={negocio.maps}>
                Abrir no Google Maps
              </a>
            )}
          </div>
        </div>
        {mapa && (
          <iframe title="Mapa" loading="lazy" src={mapa} className={'anim-revelar h-80 w-full rounded-2xl border ' + t.cartao} />
        )}
      </section>

      <footer className={'border-t py-8 text-center text-sm ' + t.rodape}>
        © {new Date().getFullYear()} {negocio.nome}
      </footer>

      {negocio.whatsapp && (
        <a
          href={negocio.whatsapp}
          aria-label="WhatsApp"
          className="anim-pulso fixed bottom-5 right-5 z-20 grid h-14 w-14 place-items-center rounded-full bg-green-500 text-white shadow-xl transition hover:scale-110"
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
