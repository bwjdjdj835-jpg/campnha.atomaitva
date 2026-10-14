// 🦁 Leão — entende o link colado pelo usuário (Google Maps, Instagram ou WhatsApp do Pinguim)
// e acha o lead correspondente.

function url(u) {
  try {
    return new URL(String(u).trim())
  } catch {
    return null
  }
}

export function tipoDoLink(link) {
  const u = url(link)
  if (!u) return null
  const h = u.hostname.replace(/^www\./, '')
  if (h === 'wa.me' || h.endsWith('whatsapp.com')) return 'whatsapp'
  if (h.endsWith('instagram.com')) return 'instagram'
  if (h.endsWith('facebook.com')) return 'facebook'
  if (/(^|\.)google\.com(\.br)?$/.test(h) && (h.startsWith('maps.') || u.pathname.startsWith('/maps'))) return 'maps'
  if (h === 'maps.app.goo.gl' || h === 'goo.gl') return 'maps'
  return null
}

const digitos = (s) => String(s || '').replace(/\D/g, '')

function chave(link) {
  const u = url(link)
  if (!u) return null
  switch (tipoDoLink(link)) {
    case 'whatsapp':
      return 'wa:' + digitos(u.pathname + (u.searchParams.get('phone') || ''))
    case 'instagram':
      return 'ig:' + (u.pathname.split('/').filter(Boolean)[0] || '').toLowerCase()
    case 'maps': {
      const id = u.searchParams.get('query_place_id') || u.searchParams.get('place_id')
      return id ? 'maps:' + id : 'url:' + u.href
    }
    default:
      return 'url:' + u.href
  }
}

export function acharLeadPorLink(link, leads) {
  const k = chave(link)
  if (!k) return null
  return leads.find((l) => [l.maps, l.instagram, l.whatsapp].filter(Boolean).some((x) => chave(x) === k)) || null
}

// "Barbearia Route 364 - Google Maps" → "Barbearia Route 364"; "Nome (@perfil) • Instagram…" → "Nome"
export function nomeDoTitulo(titulo) {
  if (!titulo) return null
  const nome = titulo
    .replace(/\s*[-–|]\s*Google Maps\s*$/i, '')
    .replace(/\s*\(@[^)]*\).*$/, '')
    .replace(/\s*[•|·]\s*(Instagram|Facebook).*$/i, '')
    .trim()
  return nome && !/^(google maps|instagram|facebook|log ?in|entrar)$/i.test(nome) ? nome : null
}

// No print do Google Maps (1920×1080), a foto de capa do negócio fica no painel da esquerda.
// Recorta essa área para usar como foto quando o lead não tem nenhuma.
export async function recortarCapaDoMaps(blob) {
  const bmp = await createImageBitmap(blob)
  if (bmp.width !== 1920 || bmp.height !== 1080) return null
  const [x, y, w, h] = [72, 66, 408, 182] // abaixo da caixa de busca, até o fim da foto
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bmp, x, y, w, h, 0, 0, w, h)
  // Área quase toda de uma cor só = não havia foto ali.
  const px = canvas.getContext('2d').getImageData(0, 0, w, h).data
  let soma = 0
  let somaQ = 0
  for (let i = 0; i < px.length; i += 16) {
    const v = (px[i] + px[i + 1] + px[i + 2]) / 3
    soma += v
    somaQ += v * v
  }
  const n = px.length / 16
  const desvio = Math.sqrt(somaQ / n - (soma / n) ** 2)
  if (desvio < 18) return null
  return new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.9))
}

// Link de busca no Google Maps para um negócio (sempre funciona, mesmo sem o link exato da ficha).
export function linkBuscaMaps(nome, endereco = '') {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([nome, endereco].filter(Boolean).join(' '))}`
}

// Quando o Pinguim não achou o Instagram: link de busca para o usuário conferir (não é o perfil em si).
export function linkBuscaInstagram(nome, cidade = '') {
  return `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com "${nome}" ${cidade}`.trim())}`
}
