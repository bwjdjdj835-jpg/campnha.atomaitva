import { useEffect, useRef } from 'react'

// Efeito de água que segue o cursor (ou o dedo, no celular).
// Simulação clássica de ondas em duas grades de altura, em baixa resolução, desenhada num canvas
// que o CSS estica — leve o bastante para rodar atrás do conteúdo. Respeita "reduzir movimento".
const ESCALA = 4 // 1 célula da simulação = 4px na tela
const AMORTECIMENTO = 0.965

export default function WaterRipple({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    let w = 0
    let h = 0
    let atual = new Float32Array(0)
    let anterior = new Float32Array(0)
    let imagem = null
    let quadro = 0
    let ultimoToque = 0

    function redimensionar() {
      const r = canvas.getBoundingClientRect()
      w = Math.max(2, Math.floor(r.width / ESCALA))
      h = Math.max(2, Math.floor(r.height / ESCALA))
      canvas.width = w
      canvas.height = h
      atual = new Float32Array(w * h)
      anterior = new Float32Array(w * h)
      imagem = ctx.createImageData(w, h)
    }

    function gota(x, y, forca = 260, raio = 2) {
      const cx = Math.floor(x / ESCALA)
      const cy = Math.floor(y / ESCALA)
      for (let dy = -raio; dy <= raio; dy++) {
        for (let dx = -raio; dx <= raio; dx++) {
          const px = cx + dx
          const py = cy + dy
          if (px > 0 && px < w - 1 && py > 0 && py < h - 1 && dx * dx + dy * dy <= raio * raio) {
            anterior[py * w + px] += forca
          }
        }
      }
    }

    function passo() {
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x
          const v = (anterior[i - 1] + anterior[i + 1] + anterior[i - w] + anterior[i + w]) / 2 - atual[i]
          atual[i] = v * AMORTECIMENTO
        }
      }
      const troca = anterior
      anterior = atual
      atual = troca

      // Desenha: a inclinação da onda vira brilho ciano; água parada fica transparente.
      const d = imagem.data
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x
          const inclinacao = anterior[i - 1] - anterior[i + 1] + anterior[i - w] - anterior[i + w]
          const luz = Math.min(150, Math.abs(inclinacao) * 1.1)
          const p = i * 4
          d[p] = 34 + luz * 0.4
          d[p + 1] = 211
          d[p + 2] = 238
          d[p + 3] = luz
        }
      }
      ctx.putImageData(imagem, 0, 0)
      quadro = requestAnimationFrame(passo)
    }

    function mover(e) {
      const r = canvas.getBoundingClientRect()
      const ponto = e.touches ? e.touches[0] : e
      const x = ponto.clientX - r.left
      const y = ponto.clientY - r.top
      if (x < 0 || y < 0 || x > r.width || y > r.height) return
      const agora = performance.now()
      if (agora - ultimoToque < 16) return
      ultimoToque = agora
      gota(x, y, e.touches ? 320 : 160)
    }

    // Uma gota de vez em quando, para a água "respirar" mesmo sem mouse.
    const chuva = setInterval(() => {
      if (document.hidden) return
      const r = canvas.getBoundingClientRect()
      gota(Math.random() * r.width, Math.random() * r.height, 520, 3)
    }, 2200)

    redimensionar()
    const observador = new ResizeObserver(redimensionar)
    observador.observe(canvas)
    window.addEventListener('pointermove', mover, { passive: true })
    window.addEventListener('touchmove', mover, { passive: true })
    quadro = requestAnimationFrame(passo)

    return () => {
      cancelAnimationFrame(quadro)
      clearInterval(chuva)
      observador.disconnect()
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('touchmove', mover)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ imageRendering: 'auto', filter: 'blur(1.6px)', opacity: 0.85 }}
    />
  )
}
