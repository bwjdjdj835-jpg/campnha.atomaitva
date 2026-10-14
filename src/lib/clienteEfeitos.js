// Efeitos interativos do site do cliente, no estilo de 21st.dev, Code Eagle e GSAP — em JavaScript puro, sem
// bibliotecas: vai inteiro para o ZIP (src/efeitos.js) e roda também na prévia do Gato Negro.
// Liga só onde o ClienteSite marcou (quando dados.efeitos não é false):
//   [data-revelar]  seções entram ao rolar (sobem e aparecem, em cascata nos filhos [data-cascata])
//   [data-brilho]   cartões com uma luz que segue o cursor
//   [data-magnetico] botões que "puxam" levemente na direção do cursor
//   [data-parallax] fotos que andam um pouco mais devagar que a rolagem
// Respeita "reduzir movimento".

export function iniciarEfeitos(raiz, tentativas) {
  raiz = raiz || document
  tentativas = tentativas === undefined ? 30 : tentativas
  if (typeof window === 'undefined') return
  const alvos = raiz.querySelectorAll('[data-revelar],[data-brilho],[data-magnetico],[data-parallax]')
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
  if (calmo) return

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
