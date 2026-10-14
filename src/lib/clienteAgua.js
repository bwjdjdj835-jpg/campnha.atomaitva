// Efeito de água na capa do site do cliente: a foto ondula seguindo o cursor (ou o dedo, no celular),
// com uma gota grande na abertura e garoa de vez em quando para a água "respirar".
// JavaScript puro, sem imports: vai inteiro para o ZIP (src/agua.js) e roda também na prévia do Gato Negro.
// Marque a área com data-agua; se tiver <img> dentro, a própria foto ondula, senão aparece só o brilho da água.
// Respeita "reduzir movimento".

const AMORTECIMENTO = 0.955
const DESLOCAMENTO = 0.06 // quanto a onda entorta a foto
const DESLOCAMENTO_MAX = 16 // px da simulação
const LARGURA_MAX = 960 // resolução máxima da simulação (desempenho)
const CALMA = 4 // abaixo disso a água é dada como parada e a foto nítida volta
const DURACAO = 4500 // ms que a água fica viva depois de uma gota: para mesmo em aparelho lento
const DURACAO_GAROA = 2500
const INTERVALO_GAROA = 8000

export function iniciarAgua(raiz, tentativas) {
  raiz = raiz || document
  tentativas = tentativas === undefined ? 30 : tentativas
  if (typeof window === 'undefined') return
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const areas = raiz.querySelectorAll('[data-agua]')
  // No site em React a capa pode ainda não estar na tela: tenta de novo por alguns instantes.
  if (!areas.length && tentativas > 0) {
    setTimeout(() => iniciarAgua(raiz, tentativas - 1), 100)
    return
  }
  areas.forEach(ligarAgua)
}

function ligarAgua(area) {
  if (area.__agua) return
  area.__agua = true
  const foto = area.querySelector('img')
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;transition:opacity .5s ease'
  area.appendChild(canvas)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  let w = 0
  let h = 0
  let atual = new Float32Array(0)
  let anterior = new Float32Array(0)
  let base = null // pixels da foto (ou null = só brilho)
  let saida = null
  let rodando = false
  let calmo = 0
  let ultimoToque = 0
  let fim = 0 // até quando a água fica viva

  function preparar() {
    const r = area.getBoundingClientRect()
    if (!r.width || !r.height) return
    const escala = Math.max(1.25, r.width / LARGURA_MAX)
    w = Math.max(8, Math.round(r.width / escala))
    h = Math.max(8, Math.round(r.height / escala))
    canvas.width = w
    canvas.height = h
    atual = new Float32Array(w * h)
    anterior = new Float32Array(w * h)
    saida = ctx.createImageData(w, h)
    base = null
    if (foto && foto.complete && foto.naturalWidth) {
      try {
        // Mesmo recorte do object-cover da <img>.
        const s = Math.max(w / foto.naturalWidth, h / foto.naturalHeight)
        const dw = foto.naturalWidth * s
        const dh = foto.naturalHeight * s
        ctx.drawImage(foto, (w - dw) / 2, (h - dh) / 2, dw, dh)
        base = ctx.getImageData(0, 0, w, h).data
        saida.data.set(base)
      } catch {
        base = null // imagem de outro domínio: fica só o brilho
      }
    }
    ctx.clearRect(0, 0, w, h)
  }

  function gota(px, py, forca, raio, duracao) {
    const cx = Math.round(px)
    const cy = Math.round(py)
    for (let dy = -raio; dy <= raio; dy++) {
      for (let dx = -raio; dx <= raio; dx++) {
        const x = cx + dx
        const y = cy + dy
        if (x > 0 && x < w - 1 && y > 0 && y < h - 1 && dx * dx + dy * dy <= raio * raio) {
          anterior[y * w + x] += forca
        }
      }
    }
    calmo = 0
    fim = Math.max(fim, performance.now() + (duracao || DURACAO))
    if (!rodando) {
      rodando = true
      canvas.style.opacity = '1'
      requestAnimationFrame(passo)
    }
  }

  function passo() {
    let energia = 0
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        const v = ((anterior[i - 1] + anterior[i + 1] + anterior[i - w] + anterior[i + w]) / 2 - atual[i]) * AMORTECIMENTO
        atual[i] = v
        if (v > energia) energia = v
        else if (-v > energia) energia = -v
      }
    }
    const troca = anterior
    anterior = atual
    atual = troca

    const d = saida.data
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        const ix = anterior[i - 1] - anterior[i + 1]
        const iy = anterior[i - w] - anterior[i + w]
        const p = i * 4
        if (base) {
          // Refração: cada pixel mostra a foto um pouco deslocada pela inclinação da onda.
          let ox = ix * DESLOCAMENTO
          let oy = iy * DESLOCAMENTO
          ox = ox > DESLOCAMENTO_MAX ? DESLOCAMENTO_MAX : ox < -DESLOCAMENTO_MAX ? -DESLOCAMENTO_MAX : ox
          oy = oy > DESLOCAMENTO_MAX ? DESLOCAMENTO_MAX : oy < -DESLOCAMENTO_MAX ? -DESLOCAMENTO_MAX : oy
          let sx = (x + ox) | 0
          let sy = (y + oy) | 0
          sx = sx < 0 ? 0 : sx >= w ? w - 1 : sx
          sy = sy < 0 ? 0 : sy >= h ? h - 1 : sy
          const q = (sy * w + sx) * 4
          const luz = (ix + iy) * 0.12
          d[p] = base[q] + luz
          d[p + 1] = base[q + 1] + luz
          d[p + 2] = base[q + 2] + luz
          d[p + 3] = 255
        } else {
          const brilho = Math.abs(ix + iy) * 0.6
          d[p] = 255
          d[p + 1] = 255
          d[p + 2] = 255
          d[p + 3] = brilho > 150 ? 150 : brilho
        }
      }
    }
    ctx.putImageData(saida, 0, 0)

    // Água parada: para de desenhar e mostra a foto nítida de novo (o fade esconde o resto da onda).
    calmo = energia < CALMA ? calmo + 1 : 0
    if (calmo > 20 || performance.now() > fim) {
      rodando = false
      canvas.style.opacity = '0'
      return
    }
    requestAnimationFrame(passo)
  }

  function mover(e) {
    const ponto = e.touches ? e.touches[0] : e
    if (!ponto || !w) return
    const r = area.getBoundingClientRect()
    const x = ponto.clientX - r.left
    const y = ponto.clientY - r.top
    if (x < 0 || y < 0 || x > r.width || y > r.height) return
    const agora = performance.now()
    if (agora - ultimoToque < 16) return
    ultimoToque = agora
    gota((x / r.width) * w, (y / r.height) * h, e.touches ? 420 : 260, 2)
  }

  function abertura() {
    // Gota grande no centro + duas menores: a capa "abre" como água.
    gota(w / 2, h / 2, 1400, 5)
    setTimeout(() => gota(w * 0.3, h * 0.6, 700, 3), 350)
    setTimeout(() => gota(w * 0.72, h * 0.4, 700, 3), 650)
  }

  function iniciar() {
    preparar()
    setTimeout(abertura, 900)
  }

  if (foto && !(foto.complete && foto.naturalWidth)) foto.addEventListener('load', iniciar, { once: true })
  else iniciar()

  let tamanho = ''
  new ResizeObserver(() => {
    const r = area.getBoundingClientRect()
    const novo = Math.round(r.width) + 'x' + Math.round(r.height)
    if (novo !== tamanho) {
      tamanho = novo
      preparar()
    }
  }).observe(area)

  window.addEventListener('pointermove', mover, { passive: true })
  window.addEventListener('touchmove', mover, { passive: true })
  setInterval(() => {
    if (document.hidden || !w) return
    const r = area.getBoundingClientRect()
    if (r.bottom < 0 || r.top > window.innerHeight) return
    gota(Math.random() * w, Math.random() * h, 380, 2, DURACAO_GAROA)
  }, INTERVALO_GAROA)
}
