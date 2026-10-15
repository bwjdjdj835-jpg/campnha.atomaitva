// 🦫 Castor + 🍌 Nano Banana (Gemini): desenha uma IMAGEM de cada um dos 3 modelos do site, só para você escolher o
// estilo (pedido do usuário). Não vai para o cliente: depois da escolha o Gato produz o site de verdade e o vídeo é da
// prévia real. Por isso a imagem não leva nome, telefone, preço ou avaliação — nada que pareça dado do comércio.
// API: generateContent com responseModalities IMAGE (https://ai.google.dev/gemini-api/docs/image-generation).

const MODELOS = () => [process.env.GEMINI_IMAGE_MODEL, 'gemini-3.1-flash-image', 'gemini-2.5-flash-image'].filter(Boolean)

export const temImagem = () => Boolean(process.env.GEMINI_API_KEY)

function pedido({ categoria, design }) {
  const c = design?.paleta_cores || {}
  return `Design a high-end mobile website homepage mockup (UI design shot, flat screen, no phone frame, no hands) for a local ${
    categoria || 'small business'
  } in Brazil. Art direction "${design?.titulo || 'premium'}": ${design?.esquema === 'claro' ? 'light, warm, welcoming' : 'dark, bold, premium'} look,
background ${c.fundo || ''}, alternate section background ${c.fundo_alternado || ''}, text ${c.texto || ''}, accent ${c.destaque || ''},
typography in the style of the Google font "${design?.fonte || 'Outfit'}".
Show, from top to bottom: floating glass navigation bar, full-screen hero with a professional photo typical of a ${categoria || 'local business'} and a dark overlay,
a big headline, an accent call-to-action button, a services section with rounded glass cards, a photo gallery, a map and contact block, and a floating WhatsApp button.
Use short neutral placeholder words only (like "Serviços", "Galeria", "Agende"). Do NOT write a business name, phone number, prices, ratings, reviews or addresses.
Agency-quality, modern, clean spacing, consistent with the palette.`
}

export async function imagemDoCastor({ categoria, design }) {
  let ultimoErro
  for (const modelo of MODELOS()) {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: pedido({ categoria, design }) }] }],
        generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '9:16', imageSize: '1K' } },
      }),
    })
    const json = await res.json().catch(() => null)
    if (res.status === 404) {
      ultimoErro = new Error(`Modelo ${modelo} não encontrado`)
      continue // tenta o próximo nome de modelo
    }
    if (!res.ok) {
      const msg = json?.error?.message || res.statusText
      if (res.status === 400 && /API key/i.test(msg)) throw new Error('Gemini: chave inválida (confira GEMINI_API_KEY)')
      if (res.status === 429) throw new Error('Gemini: limite atingido (cota grátis ou por minuto) — tente mais tarde')
      throw new Error(`Gemini: ${msg}`)
    }
    const parte = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)
    if (!parte) throw new Error('Gemini: não devolveu imagem (tente de novo)')
    return { base64: parte.inlineData.data, tipo: parte.inlineData.mimeType || 'image/png', modelo }
  }
  throw ultimoErro || new Error('Gemini: nenhum modelo de imagem disponível')
}
