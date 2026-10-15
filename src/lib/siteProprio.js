// Site montado pelo Gato a partir da imagem escolhida no Castor (dados.htmlProprio): as fotos estão como {{FOTO_n}}
// e viram o arquivo da foto (no ZIP) ou a foto embutida (na prévia).
export function trocarFotos(html, imagens = [], caminho) {
  return String(html).replace(/\{\{FOTO_(\d+)\}\}/g, (_, n) => {
    const img = imagens[Number(n) - 1] || imagens[0]
    return img ? caminho(img.arquivo) : ''
  })
}

// Pede ao servidor o site igual à imagem (Gemini → Groq com visão), com os dados e as fotos reais.
export async function gerarSiteDaImagem(imagem, dados, conteudo) {
  const n = dados.negocio || {}
  const res = await fetch('/api/gato/site-da-imagem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imagem,
      negocio: { nome: n.nome, categoria: n.categoria, endereco: n.endereco, telefone: n.telefone, whatsapp: n.whatsapp, maps: n.maps, rating: n.rating, avaliacoes: n.avaliacoes },
      conteudo: { ...conteudo, sugerido: undefined },
      fotos: (dados.imagens || []).length,
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'O Gato não conseguiu montar o site pela imagem.')
  return json // { html, ia }
}
