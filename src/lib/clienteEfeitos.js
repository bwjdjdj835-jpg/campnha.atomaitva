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
// Antes e Depois e esqueletos funcionam sempre (são parte do site, não enfeite).
// Respeita "reduzir movimento".

export function iniciarEfeitos(raiz, tentativas) {
  raiz = raiz || document
  tentativas = tentativas === undefined ? 30 : tentativas
  if (typeof window === 'undefined') return
  const alvos = raiz.querySelectorAll(
    '[data-revelar],[data-brilho],[data-magnetico],[data-parallax],[data-parallax-hero],[data-progresso],[data-contar],[data-carrossel],[data-antes-depois],[data-esqueleto]',
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
