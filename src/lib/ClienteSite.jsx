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
    nav: 'bg-neutral-950/60 text-white border-white/10',
    barra: 'bg-amber-400',
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
    nav: 'bg-white/75 text-neutral-900 border-black/10',
    barra: 'bg-emerald-600',
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
    nav: 'bg-zinc-950/60 text-white border-white/10',
    barra: 'bg-fuchsia-400',
  },
  // Cores e fonte de um site modelo lido pelo Gato (dados.modelo.estilo), aplicadas por variáveis CSS.
  modelo: {
    nome: 'Do modelo (cores e fonte do site escolhido)',
    pagina: 'bg-[var(--m-fundo)] text-[var(--m-texto)]',
    sobreposicao: 'bg-gradient-to-t from-[var(--m-fundo)] via-black/35 to-black/10',
    capaVazia: 'bg-[var(--m-primaria)]',
    rotulo: 'text-white/90',
    titulo: 'text-white',
    botao: 'bg-[var(--m-primaria)] text-[var(--m-sobre-primaria)] hover:brightness-110',
    secao: 'border-[var(--m-borda)]',
    cartao: 'bg-[var(--m-cartao)] border-[var(--m-borda)]',
    texto: 'text-[var(--m-texto-suave)]',
    link: 'text-[var(--m-primaria)] hover:brightness-125',
    rodape: 'border-[var(--m-borda)] text-[var(--m-texto-suave)]',
    acento: 'text-[var(--m-primaria)]',
    faixa: 'bg-[var(--m-primaria)] text-[var(--m-sobre-primaria)]',
    destaque: 'bg-[var(--m-cartao)] border-[var(--m-borda)]',
    nav: 'bg-black/45 text-white border-white/15',
    barra: 'bg-[var(--m-primaria)]',
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
    nav: 'bg-white/75 text-stone-900 border-orange-200',
    barra: 'bg-orange-600',
  },
}

// Texto escuro ou claro sobre uma cor, para dar leitura.
function textoSobre(hex) {
  const n = parseInt(String(hex).slice(1), 16)
  const luz = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return luz > 0.6 ? '#0A0A0A' : '#FFFFFF'
}

function estiloDoModelo(modelo) {
  const e = (modelo && modelo.estilo) || {}
  const c = e.cores || {}
  const escuro = e.esquema !== 'claro'
  const primaria = c.primaria || c.secundaria || (escuro ? '#FFFFFF' : '#111111')
  return {
    '--m-fundo': c.fundo || (escuro ? '#0A0A0A' : '#FFFFFF'),
    '--m-texto': c.texto || (escuro ? '#F5F5F5' : '#111111'),
    '--m-texto-suave': escuro ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)',
    '--m-primaria': primaria,
    '--m-sobre-primaria': textoSobre(primaria),
    '--m-cartao': escuro ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)',
    '--m-borda': escuro ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
    fontFamily: e.fonte ? "'" + e.fonte + "', ui-sans-serif, system-ui, sans-serif" : undefined,
  }
}

export default function Site({ dados }) {
  const { negocio, imagens = [], conteudo = {} } = dados
  const nomeDe = (x) => (typeof x === 'string' ? x : (x && (x.nome || x.titulo)) || '')
  const servicos = (conteudo.servicos || []).filter((x) => nomeDe(x))
  const diferenciais = (conteudo.diferenciais || []).filter((x) => nomeDe(x))
  const passos = conteudo.passos || []
  const faq = conteudo.faq || []
  // Avaliações reais do Google (o Leão só guarda as que estão escritas na página do Maps).
  const depoimentos = (conteudo.depoimentos || []).filter((d) => d && d.texto && d.autor)
  // Efeitos interativos (src/efeitos.js): o Gato liga/desliga na prévia. Só põe os atributos quando ligado.
  const efeitos = dados.efeitos !== false
  const fx = (attrs) => (efeitos ? attrs : {})
  const heroParallax = dados.hero === 'parallax' // senão: foto com efeito de água
  const bento = dados.galeria === 'bento' // senão: grade uniforme
  const doModelo = dados.tema === 'modelo' && dados.modelo
  const t = (doModelo ? TEMAS.modelo : TEMAS[dados.tema === 'modelo' ? 'noite' : dados.tema]) || TEMAS.claro
  const capa = imagens[0]
  const galeria = imagens.slice(1)
  const telefone = negocio.telefone && negocio.telefone !== '—' ? negocio.telefone : null
  const cidade = (negocio.endereco || '').split(' - ').slice(-2).join(' - ').replace(/,?\s*\d{5}-?\d{3}.*$/, '')
  const mapa =
    negocio.endereco &&
    'https://maps.google.com/maps?output=embed&q=' + encodeURIComponent(negocio.nome + ', ' + negocio.endereco)
  const nota = negocio.rating ? Number(negocio.rating) : null
  const avaliacoes = Number(negocio.avaliacoes) || 0
  const links = [
    servicos.length && ['#servicos', 'Serviços'],
    galeria.length && ['#fotos', 'Fotos'],
    depoimentos.length && ['#avaliacoes', 'Avaliações'],
    ['#contato', 'Contato'],
  ].filter(Boolean)
  const rotulo = 'text-xs font-semibold uppercase tracking-[0.3em] ' + t.acento
  const estrelas = (n) => '★★★★★'.slice(0, Math.max(0, Math.min(5, Math.round(n || 5))))

  return (
    <div className={'min-h-screen font-sans antialiased ' + t.pagina} style={doModelo ? estiloDoModelo(dados.modelo) : undefined}>
      {/* Barra de progresso de rolagem */}
      {efeitos && <div data-progresso className={'fixed left-0 top-0 z-50 h-1 w-full origin-left scale-x-0 ' + t.barra} />}

      {/* Nav flutuante de vidro */}
      <nav className={'fixed inset-x-0 top-4 z-40 mx-auto flex w-[calc(100%-2rem)] max-w-5xl items-center gap-4 rounded-full border px-5 py-2.5 shadow-lg backdrop-blur-xl ' + t.nav}>
        <a href="#topo" target="_self" className="truncate font-bold tracking-tight">
          {negocio.nome}
        </a>
        <div className="ml-auto hidden items-center gap-6 text-sm sm:flex">
          {links.map(([href, texto]) => (
            <a key={href} href={href} target="_self" className="opacity-80 transition hover:opacity-100">
              {texto}
            </a>
          ))}
        </div>
        {negocio.whatsapp && (
          <a href={negocio.whatsapp} {...fx({ 'data-magnetico': '' })} className={'ml-auto shrink-0 rounded-full px-4 py-2 text-sm font-semibold sm:ml-0 ' + t.botao}>
            Agendar
          </a>
        )}
      </nav>

      {/* Hero em tela cheia: foto com água (padrão) ou com parallax; nome gigante subindo palavra por palavra */}
      <header id="topo" className="relative h-[100svh] min-h-[560px] overflow-hidden">
        {capa ? (
          heroParallax ? (
            <div className="absolute inset-0 overflow-hidden">
              <img src={capa.arquivo} alt={negocio.nome} {...fx({ 'data-parallax-hero': '' })} className="anim-zoom h-full w-full object-cover" />
            </div>
          ) : (
            <div data-agua="foto" className="absolute inset-0 overflow-hidden">
              <img src={capa.arquivo} alt={negocio.nome} className="anim-zoom h-full w-full object-cover" />
            </div>
          )
        ) : (
          <div data-agua="cor" className={'absolute inset-0 overflow-hidden ' + t.capaVazia} />
        )}
        <div className={'pointer-events-none absolute inset-0 ' + t.sobreposicao} />
        {efeitos && <div className="granulado pointer-events-none absolute inset-0" />}
        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-6 pb-16">
          {negocio.categoria && <p className={'anim-subir text-xs font-semibold uppercase tracking-[0.35em] ' + t.rotulo}>{negocio.categoria}</p>}
          <h1 className={'mt-4 max-w-5xl text-6xl font-extrabold leading-[0.95] tracking-tight sm:text-8xl lg:text-9xl ' + t.titulo}>
            {String(negocio.nome)
              .split(' ')
              .map((palavra, i, todas) => (
                <span key={i} className="inline-block overflow-hidden pb-2 align-bottom">
                  <span className={efeitos ? 'anim-palavra inline-block' : 'inline-block'} style={efeitos ? { animationDelay: 0.15 + i * 0.12 + 's' } : undefined}>
                    {palavra}
                    {i < todas.length - 1 ? ' ' : ''}
                  </span>
                </span>
              ))}
          </h1>
          {conteudo.slogan && <p className="anim-subir anim-atraso-2 mt-5 max-w-2xl text-xl text-white/90 sm:text-2xl">{conteudo.slogan}</p>}
          <div className="anim-subir anim-atraso-3 mt-8 flex flex-wrap items-center gap-3">
            {negocio.whatsapp && (
              <a href={negocio.whatsapp} {...fx({ 'data-magnetico': '' })} className={'inline-flex items-center gap-2 rounded-full px-8 py-4 text-lg font-semibold shadow-lg ' + t.botao}>
                Agendar pelo WhatsApp →
              </a>
            )}
            {(nota || cidade) && (
              <span className="text-sm text-white/85">
                {nota ? '★ ' + String(nota).replace('.', ',') + ' no Google' : ''}
                {nota && cidade ? ' · ' : ''}
                {cidade}
              </span>
            )}
          </div>
        </div>
        <span className="anim-pulso-suave absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-white/70 sm:block">Role ↓</span>
      </header>

      {/* Faixa marquee infinita */}
      {efeitos && servicos.length >= 3 && (
        <div className={'overflow-hidden border-b py-5 ' + t.secao} aria-hidden="true">
          <div className="faixa-correr">
            {[0, 1].map((volta) => (
              <div key={volta} className="flex shrink-0 items-center">
                {servicos.concat(servicos).map((x, i) => (
                  <span key={volta + '-' + i} className="flex items-center whitespace-nowrap px-6 text-2xl font-bold uppercase tracking-wide sm:text-4xl">
                    {nomeDe(x)}
                    <span className={'ml-12 ' + t.acento}>✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Números com contador animado (só dados reais) */}
      {(nota || avaliacoes > 0 || cidade || conteudo.horarios) && (
        <section {...fx({ 'data-revelar': '' })} className="mx-auto grid max-w-6xl gap-px overflow-hidden px-6 pt-20 sm:grid-cols-2 lg:grid-cols-4">
          {nota && (
            <div {...fx({ 'data-cascata': '' })} className="py-6">
              <p className="text-6xl font-extrabold tracking-tight sm:text-7xl">
                <span {...fx({ 'data-contar': String(nota), 'data-casas': '1' })}>{String(nota).replace('.', ',')}</span>
                <span className={'ml-1 text-3xl ' + t.acento}>★</span>
              </p>
              <p className={'mt-2 text-sm ' + t.texto}>nota no Google</p>
            </div>
          )}
          {avaliacoes > 0 && (
            <div {...fx({ 'data-cascata': '' })} className="py-6">
              <p className="text-6xl font-extrabold tracking-tight sm:text-7xl">
                <span {...fx({ 'data-contar': String(avaliacoes) })}>{avaliacoes}</span>
                <span className={'text-3xl ' + t.acento}>+</span>
              </p>
              <p className={'mt-2 text-sm ' + t.texto}>avaliações de clientes</p>
            </div>
          )}
          {cidade && (
            <div {...fx({ 'data-cascata': '' })} className="py-6">
              <p className="text-2xl font-bold leading-tight sm:text-3xl">{cidade}</p>
              <p className={'mt-2 text-sm ' + t.texto}>onde estamos</p>
            </div>
          )}
          {conteudo.horarios ? (
            <div {...fx({ 'data-cascata': '' })} className="py-6">
              <p className="text-2xl font-bold leading-tight sm:text-3xl">{conteudo.horarios}</p>
              <p className={'mt-2 text-sm ' + t.texto}>horário</p>
            </div>
          ) : (
            negocio.whatsapp && (
              <div {...fx({ 'data-cascata': '' })} className="py-6">
                <p className="text-2xl font-bold leading-tight sm:text-3xl">WhatsApp</p>
                <p className={'mt-2 text-sm ' + t.texto}>atendimento e agendamento</p>
              </div>
            )
          )}
        </section>
      )}

      <main className="mx-auto max-w-6xl space-y-28 px-6 py-24">
        {/* Sobre editorial */}
        {conteudo.sobre && (
          <section {...fx({ 'data-revelar': '' })} className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className={rotulo}>Sobre</p>
              <p className="mt-6 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{conteudo.sobre}</p>
            </div>
            {imagens[1] && (
              <div className="overflow-hidden rounded-3xl lg:col-span-5">
                <img src={imagens[1].arquivo} alt="" {...fx({ 'data-parallax': '' })} className="aspect-[4/5] w-full object-cover" />
              </div>
            )}
          </section>
        )}

        {diferenciais.length > 0 && (
          <section {...fx({ 'data-revelar': '' })}>
            <p className={rotulo}>Por que escolher</p>
            <h2 className="mt-3 mb-10 text-4xl font-bold tracking-tight sm:text-5xl">Nossos diferenciais</h2>
            <ul className="grid gap-4 sm:grid-cols-3">
              {diferenciais.map((d) => (
                <li key={nomeDe(d)} {...fx({ 'data-brilho': '', 'data-cascata': '' })} className={'rounded-3xl border p-7 transition duration-300 hover:-translate-y-1 ' + t.destaque}>
                  <span className={'text-2xl ' + t.acento}>✦</span>
                  <p className="mt-4 text-xl font-semibold leading-snug">{nomeDe(d)}</p>
                  {typeof d === 'object' && d.texto && <p className={'mt-2 text-sm leading-relaxed ' + t.texto}>{d.texto}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Lista de serviços grande com hover */}
        {servicos.length > 0 && (
          <section id="servicos" {...fx({ 'data-revelar': '' })}>
            <p className={rotulo}>O que fazemos</p>
            <h2 className="mt-3 mb-8 text-4xl font-bold tracking-tight sm:text-5xl">Serviços</h2>
            <ul className={'border-t ' + t.secao}>
              {servicos.map((x, i) => (
                <li key={nomeDe(x)} {...fx({ 'data-cascata': '' })} className={'group border-b ' + t.secao}>
                  <a
                    href={negocio.whatsapp || '#contato'}
                    target={negocio.whatsapp ? '_blank' : '_self'}
                    className="flex items-baseline gap-5 py-6 transition duration-300 group-hover:translate-x-2 sm:py-8"
                  >
                    <span className={'w-10 shrink-0 font-mono text-sm ' + t.acento}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="flex-1">
                      <span className="block text-3xl font-semibold tracking-tight sm:text-5xl">{nomeDe(x)}</span>
                      {typeof x === 'object' && x.descricao && <span className={'mt-2 block text-base ' + t.texto}>{x.descricao}</span>}
                    </span>
                    {typeof x === 'object' && x.preco && <span className="shrink-0 text-lg font-semibold">{x.preco}</span>}
                    <span className={'shrink-0 text-2xl opacity-0 transition duration-300 group-hover:opacity-100 ' + t.acento}>→</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Galeria: grade uniforme (padrão) ou bento */}
        {galeria.length > 0 && (
          <section id="fotos" {...fx({ 'data-revelar': '' })}>
            <p className={rotulo}>Galeria</p>
            <h2 className="mt-3 mb-10 text-4xl font-bold tracking-tight sm:text-5xl">Fotos</h2>
            {bento ? (
              <div className="grid auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[210px] sm:grid-cols-4 sm:gap-4">
                {galeria.map((img, i) => (
                  <div
                    key={img.arquivo}
                    {...fx({ 'data-cascata': '' })}
                    className={'group overflow-hidden rounded-3xl ' + (i % 6 === 0 ? 'col-span-2 row-span-2' : i % 6 === 3 ? 'sm:col-span-2' : '')}
                  >
                    <img src={img.arquivo} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
                {galeria.map((img) => (
                  <div
                    key={img.arquivo}
                    {...fx({ 'data-cascata': '' })}
                    className={
                      'group aspect-[4/3] overflow-hidden rounded-3xl ' +
                      (galeria.length === 1
                        ? 'w-full sm:w-2/3'
                        : galeria.length === 2
                          ? 'w-[calc(50%-0.375rem)] sm:w-[calc(50%-0.5rem)]'
                          : galeria.length === 4
                            ? 'w-[calc(50%-0.375rem)] sm:w-[calc(25%-0.75rem)]'
                            : 'w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.667rem)]')
                    }
                  >
                    <img src={img.arquivo} alt="" {...fx({ 'data-parallax': '' })} className="h-full w-full object-cover transition duration-700 group-hover:brightness-110" />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {passos.length > 0 && (
          <section {...fx({ 'data-revelar': '' })}>
            <p className={rotulo}>Simples assim</p>
            <h2 className="mt-3 mb-10 text-4xl font-bold tracking-tight sm:text-5xl">Como funciona</h2>
            <ol className="grid gap-4 sm:grid-cols-3">
              {passos.map((p, i) => (
                <li key={p} {...fx({ 'data-brilho': '', 'data-cascata': '' })} className={'relative rounded-3xl border p-7 ' + t.cartao}>
                  <span className={'text-6xl font-extrabold opacity-30 ' + t.acento}>{i + 1}</span>
                  <p className="mt-3 text-lg font-semibold">{p}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Depoimentos em carrossel (avaliações reais do Google) */}
        {depoimentos.length > 0 && (
          <section id="avaliacoes" {...fx({ 'data-revelar': '' })}>
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className={rotulo}>Quem já veio</p>
                <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">O que dizem os clientes</h2>
              </div>
              {efeitos && depoimentos.length > 1 && (
                <div className="flex gap-2">
                  <button type="button" data-carrossel-ant aria-label="Anterior" className={'grid h-11 w-11 place-items-center rounded-full border ' + t.cartao}>←</button>
                  <button type="button" data-carrossel-prox aria-label="Próximo" className={'grid h-11 w-11 place-items-center rounded-full border ' + t.cartao}>→</button>
                </div>
              )}
            </div>
            <div {...fx({ 'data-carrossel': '' })} className="carrossel -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4">
              {depoimentos.map((d, i) => (
                <figure key={i} className={'w-[85%] shrink-0 snap-start rounded-3xl border p-7 sm:w-[48%] lg:w-[32%] ' + t.destaque}>
                  <p className={'text-lg ' + t.acento}>{estrelas(d.nota)}</p>
                  <blockquote className="mt-4 text-lg leading-relaxed">“{d.texto}”</blockquote>
                  <figcaption className={'mt-6 text-sm ' + t.texto}>
                    <span className="font-semibold">{d.autor}</span> · avaliação no Google
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {faq.length > 0 && (
          <section {...fx({ 'data-revelar': '' })} className="mx-auto max-w-3xl">
            <p className={'text-center ' + rotulo}>Dúvidas</p>
            <h2 className="mt-3 mb-10 text-center text-4xl font-bold tracking-tight sm:text-5xl">Perguntas frequentes</h2>
            <div className="space-y-3">
              {faq.map((f) => (
                <details key={f.p} {...fx({ 'data-cascata': '' })} className={'group rounded-2xl border px-6 py-5 ' + t.cartao}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                    {f.p}
                    <span className={'text-2xl transition group-open:rotate-45 ' + t.acento}>+</span>
                  </summary>
                  <p className={'mt-3 leading-relaxed ' + t.texto}>{f.r}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Chamada final gigante + contato + mapa em preto e branco que ganha cor no hover */}
      <section id="contato" {...fx({ 'data-revelar': '' })} className={'border-t ' + t.secao}>
        <div className="mx-auto max-w-6xl px-6 py-24">
          <p className={rotulo}>Contato</p>
          {negocio.whatsapp ? (
            <a href={negocio.whatsapp} className="group mt-6 inline-flex items-baseline gap-4 text-7xl font-extrabold tracking-tight sm:text-9xl">
              Agende
              <span className={'transition duration-300 group-hover:translate-x-4 ' + t.acento}>→</span>
            </a>
          ) : (
            <h2 className="mt-6 text-6xl font-extrabold tracking-tight sm:text-8xl">Visite a gente</h2>
          )}
          <div className="mt-14 grid gap-10 lg:grid-cols-2">
            <ul className={'space-y-4 text-lg ' + t.texto}>
              {negocio.endereco && <li>{negocio.endereco}</li>}
              {conteudo.horarios && <li>Horário: {conteudo.horarios}</li>}
              {telefone && <li>{telefone}</li>}
              <li className="flex flex-wrap gap-5 pt-2">
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
              </li>
            </ul>
            {mapa && (
              <iframe
                title="Mapa"
                loading="lazy"
                src={mapa}
                className={'h-80 w-full rounded-3xl border grayscale transition duration-700 hover:grayscale-0 ' + t.cartao}
              />
            )}
          </div>
        </div>
      </section>

      <footer className={'border-t py-8 text-center text-sm ' + t.rodape}>
        © {new Date().getFullYear()} {negocio.nome}
      </footer>

      {negocio.whatsapp && (
        <a
          href={negocio.whatsapp}
          aria-label="WhatsApp"
          className="anim-pulso fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-green-500 text-white shadow-xl transition hover:scale-110"
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
