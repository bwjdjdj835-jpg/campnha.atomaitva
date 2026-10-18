// Efeitos interativos do site do cliente, no estilo de 21st.dev, Code Eagle e GSAP — em JavaScript puro, sem
// bibliotecas: vai inteiro para o ZIP (src/efeitos.js) e roda também na prévia do Gato Negro.
// Liga só onde o ClienteSite marcou (quando dados.efeitos não é false):
//   [data-revelar]  seções entram ao rolar (sobem e aparecem, em cascata nos filhos [data-cascata])
//   [data-brilho]   cartões com uma luz que segue o cursor
//   [data-magnetico] botões que "puxam" levemente na direção do cursor
//   [data-parallax] fotos que andam um pouco mais devagar que a rolagem
//   [data-parallax-hero] foto da capa descendo devagar ao rolar (hero "parallax")
//   [data-progresso] barra de progresso da rolagem
//   [data-contar]   números que contam de 0 até o valor quando aparecem (data-casas = casas decimais)
//   [data-carrossel] depoimentos que passam sozinhos (botões [data-carrossel-ant] / [data-carrossel-prox])
//   [data-antes-depois] comparação Antes e Depois: arraste a linha (mouse, dedo ou teclado ← →)
//   [data-esqueleto] foto com brilho de "carregando" até chegar; depois aparece suave
//   [data-assistente] pedido / horário / orçamento montado na página → WhatsApp com a mensagem pronta ([data-socorro]: localização)
//   [data-aberto]   selo "Aberto agora / Fechado" (data-horarios do Google Maps + data-fuso), na hora da visita
// Antes e Depois, esqueletos, o assistente e o selo de aberto funcionam sempre (são parte do site, não enfeite).
// Respeita "reduzir movimento".

export function iniciarEfeitos(raiz, tentativas) {
  raiz = raiz || document
  tentativas = tentativas === undefined ? 30 : tentativas
  if (typeof window === 'undefined') return
  const alvos = raiz.querySelectorAll(
    '[data-revelar],[data-brilho],[data-magnetico],[data-parallax],[data-parallax-hero],[data-progresso],[data-contar],[data-carrossel],[data-antes-depois],[data-esqueleto],[data-aberto],[data-assistente]',
  )
  // No site em React a página pode ainda não estar na tela: tenta de novo por alguns instantes.
  if (!alvos.length && tentativas > 0) {
    setTimeout(() => iniciarEfeitos(raiz, tentativas - 1), 100)
    return
  }
  if (raiz.__efeitos) return
  raiz.__efeitos = true
  const calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Revelar ao rolar.
  const revelar = raiz.querySelectorAll('[data-revelar]')
  if (calmo || !('IntersectionObserver' in window)) {
    revelar.forEach((el) => el.classList.add('efeito-visivel'))
  } else {
    revelar.forEach((el) => {
      el.classList.add('efeito-oculto')
      el.querySelectorAll('[data-cascata]').forEach((filho, i) => {
        filho.style.transitionDelay = Math.min(i, 8) * 70 + 'ms'
      })
    })
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('efeito-visivel')
          observador.unobserve(e.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    revelar.forEach((el) => observador.observe(el))
  }
  // Assistente do ramo: o que o cliente escolhe vira a mensagem do WhatsApp (sem preço nem horário inventado).
  raiz.querySelectorAll('[data-assistente]').forEach((sec) => {
    const tipo = sec.getAttribute('data-assistente')
    const base = sec.getAttribute('data-whats') || ''
    const enviar = sec.querySelector('[data-enviar]')
    const link = (texto) => base + (base.indexOf('?') >= 0 ? '&' : '?') + 'text=' + encodeURIComponent(texto)
    const escolhidos = (g) =>
      Array.prototype.map.call(sec.querySelectorAll('[data-opcao][data-grupo="' + g + '"][aria-pressed="true"]'), (b) => b.getAttribute('data-valor'))
    const campo = (n) => {
      const c = sec.querySelector('[data-campo="' + n + '"]')
      return c ? c.value.trim().slice(0, 400) : ''
    }
    const atualizar = () => {
      if (enviar) enviar.href = link(mensagemDoAssistente(tipo, sec, escolhidos, campo))
    }
    sec.addEventListener('click', (e) => {
      const op = e.target.closest('[data-opcao]')
      if (op) {
        const ligado = op.getAttribute('aria-pressed') === 'true'
        if (op.parentElement.hasAttribute('data-unico')) op.parentElement.querySelectorAll('[data-opcao]').forEach((b) => b.setAttribute('aria-pressed', 'false'))
        op.setAttribute('aria-pressed', ligado ? 'false' : 'true')
        atualizar()
      }
      const conta = e.target.closest('[data-mais],[data-menos]')
      if (conta) {
        const item = conta.closest('[data-item]')
        const q = item.querySelector('[data-qtd]')
        const n = Math.max(0, Math.min(20, (Number(q.textContent) || 0) + (conta.hasAttribute('data-mais') ? 1 : -1)))
        q.textContent = String(n)
        item.classList.toggle('item-escolhido', n > 0)
        atualizar()
      }
      const socorro = e.target.closest('[data-socorro]')
      if (socorro) pedirSocorro(socorro, link)
    })
    sec.addEventListener('input', atualizar)
    atualizar()
  })

  // Selo "Aberto agora / Fechado" (site feito pela imagem; o ClienteSite calcula o dele na hora de desenhar).
  raiz.querySelectorAll('[data-aberto][data-horarios]').forEach((el) => {
    let dias
    try {
      dias = JSON.parse(el.getAttribute('data-horarios'))
    } catch (e) {
      return
    }
    const s = statusAberto(dias, el.getAttribute('data-fuso'))
    if (!s) return el.remove()
    el.textContent = s.texto
    el.classList.add('selo-aberto', s.aberto ? 'selo-aberto-sim' : 'selo-aberto-nao')
  })
  // Esqueletos: a foto mostra um brilho até carregar e aparece com fade (o site nunca parece travado).
  raiz.querySelectorAll('[data-esqueleto]').forEach((el) => {
    const img = el.tagName === 'IMG' ? el : el.querySelector('img,iframe')
    const pronto = () => el.classList.add('esqueleto-pronto')
    if (!img || (img.tagName === 'IMG' && img.complete && img.naturalWidth)) return pronto()
    if (img.tagName === 'IFRAME') setTimeout(pronto, 8000) // agenda de fora: some o brilho mesmo se demorar
    img.addEventListener('load', pronto, { once: true })
    img.addEventListener('error', pronto, { once: true })
  })

  // Antes e Depois: Pointer Events (mouse, dedo e caneta com o mesmo código) + teclado; só a variável --pos muda.
  raiz.querySelectorAll('[data-antes-depois]').forEach((fig) => {
    const linha = fig.querySelector('[data-ad-linha]') || fig
    let pos = 50
    let pedido = 0
    const pintar = () => {
      pedido = 0
      fig.style.setProperty('--pos', pos + '%')
      linha.setAttribute('aria-valuenow', String(Math.round(pos)))
    }
    const ir = (v) => {
      pos = Math.max(0, Math.min(100, v))
      if (!pedido) pedido = requestAnimationFrame(pintar)
    }
    const doPonteiro = (e) => {
      const r = fig.getBoundingClientRect()
      ir(((e.clientX - r.left) / r.width) * 100)
    }
    let arrastando = false
    fig.addEventListener('pointerdown', (e) => {
      arrastando = true
      fig.classList.add('ad-arrastando')
      if (fig.setPointerCapture) fig.setPointerCapture(e.pointerId)
      doPonteiro(e)
    })
    fig.addEventListener('pointermove', (e) => arrastando && doPonteiro(e))
    const soltar = () => {
      arrastando = false
      fig.classList.remove('ad-arrastando')
    }
    fig.addEventListener('pointerup', soltar)
    fig.addEventListener('pointercancel', soltar)
    linha.addEventListener('keydown', (e) => {
      const passo = { ArrowLeft: -5, ArrowRight: 5, Home: -100, End: 100 }[e.key]
      if (passo === undefined) return
      e.preventDefault()
      ir(pos + passo)
    })
    pintar()
    // Ao aparecer, um vai-e-vem rápido mostra que dá para arrastar (também aparece no vídeo da prévia).
    if (!calmo && 'IntersectionObserver' in window) {
      const obs = new IntersectionObserver((ents) => {
        if (!ents[0].isIntersecting) return
        obs.disconnect()
        const inicio = performance.now()
        const dica = (agora) => {
          const t = Math.min(1, (agora - inicio) / 1800)
          if (!arrastando) ir(50 + Math.sin(t * Math.PI * 2) * 22 * (1 - t))
          if (t < 1) requestAnimationFrame(dica)
        }
        requestAnimationFrame(dica)
      }, { threshold: 0.5 })
      obs.observe(fig)
    }
  })

  if (calmo) return

  // Barra de progresso + parallax da capa (um só ouvinte de rolagem).
  const barra = raiz.querySelector('[data-progresso]')
  const capa = raiz.querySelector('[data-parallax-hero]')
  if (barra || capa) {
    let quadro = 0
    const rolar = () => {
      quadro = 0
      const doc = document.documentElement
      if (barra) barra.style.transform = 'scaleX(' + Math.min(1, window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight)) + ')'
      if (capa && window.scrollY < window.innerHeight * 1.2) {
        capa.style.transform = 'translateY(' + (window.scrollY * 0.35).toFixed(1) + 'px) scale(1.08)'
      }
    }
    window.addEventListener('scroll', () => quadro || (quadro = requestAnimationFrame(rolar)), { passive: true })
    rolar()
  }

  // Números contando quando aparecem na tela.
  const numeros = raiz.querySelectorAll('[data-contar]')
  if (numeros.length && 'IntersectionObserver' in window) {
    // O valor real fica escrito até a hora de contar (miniatura, print ou aba parada nunca mostram "0,0"),
    // e no fim volta sempre ao texto original.
    const contar = (el) => {
      const original = el.textContent
      const alvo = parseFloat(el.getAttribute('data-contar')) || 0
      const casas = parseInt(el.getAttribute('data-casas') || '0', 10)
      const inicio = performance.now()
      const passo = (agora) => {
        const p = Math.min(1, (agora - inicio) / 1600)
        const v = alvo * (1 - Math.pow(1 - p, 3))
        el.textContent = p < 1 ? v.toFixed(casas).replace('.', ',') : original
        if (p < 1) requestAnimationFrame(passo)
      }
      requestAnimationFrame(passo)
      setTimeout(() => (el.textContent = original), 2000)
    }
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return
        obs.unobserve(e.target)
        contar(e.target)
      })
    }, { threshold: 0.6 })
    numeros.forEach((el) => obs.observe(el))
  }

  // Carrossel de depoimentos: passa sozinho a cada 5 s (para quando o cursor está em cima).
  raiz.querySelectorAll('[data-carrossel]').forEach((trilho) => {
    const secao = trilho.closest('section') || raiz
    const largura = () => (trilho.firstElementChild ? trilho.firstElementChild.getBoundingClientRect().width + 16 : 300)
    const ir = (dir) => {
      const fim = trilho.scrollLeft + trilho.clientWidth >= trilho.scrollWidth - 8
      trilho.scrollTo({ left: dir > 0 && fim ? 0 : trilho.scrollLeft + dir * largura(), behavior: 'smooth' })
    }
    const ant = secao.querySelector('[data-carrossel-ant]')
    const prox = secao.querySelector('[data-carrossel-prox]')
    if (ant) ant.addEventListener('click', () => ir(-1))
    if (prox) prox.addEventListener('click', () => ir(1))
    let parado = false
    trilho.addEventListener('pointerenter', () => (parado = true))
    trilho.addEventListener('pointerleave', () => (parado = false))
    setInterval(() => {
      if (!parado && !document.hidden && trilho.scrollWidth > trilho.clientWidth + 8) ir(1)
    }, 5000)
  })

  // Luz que segue o cursor nos cartões.
  raiz.querySelectorAll('[data-brilho]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', e.clientX - r.left + 'px')
      el.style.setProperty('--my', e.clientY - r.top + 'px')
    })
  })

  // Botões magnéticos.
  raiz.querySelectorAll('[data-magnetico]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left - r.width / 2) * 0.25
      const y = (e.clientY - r.top - r.height / 2) * 0.35
      el.style.transform = 'translate(' + x + 'px,' + y + 'px)'
    })
    el.addEventListener('pointerleave', () => {
      el.style.transform = ''
    })
  })

  // Parallax nas fotos.
  const fotos = Array.prototype.slice.call(raiz.querySelectorAll('[data-parallax]'))
  if (fotos.length) {
    let pedido = 0
    const mover = () => {
      pedido = 0
      const meio = window.innerHeight / 2
      fotos.forEach((el) => {
        const r = el.parentElement.getBoundingClientRect()
        if (r.bottom < 0 || r.top > window.innerHeight) return
        const desvio = (r.top + r.height / 2 - meio) * -0.08
        el.style.transform = 'translateY(' + desvio.toFixed(1) + 'px) scale(1.12)'
      })
    }
    window.addEventListener('scroll', () => pedido || (pedido = requestAnimationFrame(mover)), { passive: true })
    mover()
  }
}

// Mesma conta do abertoAgora do ClienteSite (os dois são testados juntos em testes/site-cliente.mjs).
// dias: { 0: [["09:00","19:00"]], ... } (0 = domingo; [] = fechado; dia sem informação = não mostra nada).
const DIA_NOME = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']
export function statusAberto(dias, fuso, agora) {
  if (!dias) return null
  let partes
  try {
    partes = {}
    new Intl.DateTimeFormat('en-GB', { timeZone: fuso || 'America/Sao_Paulo', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(agora || new Date())
      .forEach((x) => (partes[x.type] = x.value))
  } catch (e) {
    return null
  }
  const hoje = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(partes.weekday)
  const min = (h) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5))
  const curta = (h) => h.replace(/^0(?=\d)/, '').replace(':00', 'h').replace(':', 'h')
  const aHora = (h) => (h === '24:00' || h === '00:00' ? 'à meia-noite' : 'às ' + curta(h))
  const abre = (f) => (f[0] === '00:00' && f[1] === '24:00' ? '(24 horas)' : aHora(f[0]))
  const agoraMin = (Number(partes.hour) % 24) * 60 + Number(partes.minute)
  if (!dias[hoje]) return null
  const deOntem = (dias[(hoje + 6) % 7] || []).find((f) => min(f[1]) < min(f[0]) && agoraMin < min(f[1]))
  if (deOntem) return { aberto: true, texto: 'Aberto agora · fecha ' + aHora(deOntem[1]) }
  const atual = dias[hoje].find((f) => agoraMin >= min(f[0]) && (min(f[1]) < min(f[0]) || agoraMin < min(f[1])))
  if (atual) return { aberto: true, texto: atual[0] === '00:00' && atual[1] === '24:00' ? 'Aberto 24 horas' : 'Aberto agora · fecha ' + aHora(atual[1]) }
  const maisTarde = dias[hoje].find((f) => min(f[0]) > agoraMin)
  if (maisTarde) return { aberto: false, texto: 'Fechado agora · abre ' + abre(maisTarde) }
  for (let i = 1; i <= 7; i++) {
    const d = (hoje + i) % 7
    if (dias[d] && dias[d].length) return { aberto: false, texto: 'Fechado agora · abre ' + (i === 1 ? 'amanhã' : DIA_NOME[d]) + ' ' + abre(dias[d][0]) }
  }
  return { aberto: false, texto: 'Fechado agora' }
}

// Mensagem do assistente do ramo (pedido / agendar / orçamento) com o que a pessoa escolheu.
const PERIODO = { Manhã: 'de manhã', Tarde: 'à tarde', Noite: 'à noite' }
export function mensagemDoAssistente(tipo, sec, escolhidos, campo) {
  const linhas = []
  if (tipo === 'pedido') {
    const itens = Array.prototype.map
      .call(sec.querySelectorAll('[data-item]'), (i) => [i.getAttribute('data-item'), Number(i.querySelector('[data-qtd]').textContent) || 0])
      .filter((x) => x[1] > 0)
    linhas.push('Olá! Vi o site e quero fazer um pedido' + (itens.length ? ':' : '.'))
    itens.forEach((x) => linhas.push('• ' + x[1] + 'x ' + x[0]))
    const receber = escolhidos('receber')[0]
    if (receber) linhas.push(receber === 'Vou buscar' ? 'Vou buscar no local.' : 'Queria saber da entrega.')
    if (campo('texto')) linhas.push('Obs.: ' + campo('texto'))
  } else if (tipo === 'agendar') {
    const serv = escolhidos('servico')
    linhas.push('Olá! Vi o site e quero agendar' + (serv.length ? ': ' + serv.join(', ') : ' um horário') + '.')
    const quando = escolhidos('quando')[0]
    const periodo = escolhidos('periodo')[0]
    if (quando || periodo) linhas.push('Quando: ' + [quando && quando.toLowerCase(), periodo && PERIODO[periodo]].filter(Boolean).join(', ') + '.')
    if (campo('nome')) linhas.push('Meu nome é ' + campo('nome') + '.')
  } else {
    const serv = escolhidos('servico')
    linhas.push('Olá! Vi o site e quero um orçamento' + (serv.length ? ' de ' + serv.join(', ') : '') + '.')
    if (campo('texto')) linhas.push(campo('texto'))
  }
  return linhas.join('\n')
}

// 🆘 Socorro (borracharia): manda a localização da pessoa pelo WhatsApp; sem permissão, manda o pedido sem ela.
function pedirSocorro(botao, link) {
  const abrir = (texto) => {
    window.location.href = link(texto)
  }
  const semLocal = '🆘 Preciso de socorro! Vi o site de vocês. Já te mando minha localização aqui.'
  if (!navigator.geolocation) return abrir(semLocal)
  const antes = botao.textContent
  botao.textContent = '📍 Pegando sua localização…'
  navigator.geolocation.getCurrentPosition(
    (p) => {
      botao.textContent = antes
      abrir('🆘 Preciso de socorro! Estou aqui: https://maps.google.com/?q=' + p.coords.latitude.toFixed(5) + ',' + p.coords.longitude.toFixed(5))
    },
    () => {
      botao.textContent = antes
      abrir(semLocal)
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  )
}
