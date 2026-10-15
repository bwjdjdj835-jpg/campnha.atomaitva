// 📲 WhatsApp Web pelo notebook (servidor local). A Aranha só manda depois do seu clique em "Aprovar e enviar".

async function chamar(rota, corpo) {
  const res = await fetch(`/api/zap/${rota}`, corpo ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) } : undefined)
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'WhatsApp Web não respondeu.')
  return json
}

const emBase64 = (blob) =>
  new Promise((ok, erro) => {
    const r = new FileReader()
    r.onload = () => ok(String(r.result).split(',')[1])
    r.onerror = erro
    r.readAsDataURL(blob)
  })

export const conectarZap = () => chamar('conectar', {})
export const lerConversaNoZap = (telefone) => chamar('ler', { telefone })
export const statusZap = () => chamar('status')

export async function enviarPeloZap({ telefone, texto, video }) {
  return chamar('enviar', {
    telefone,
    texto,
    aprovado: true, // só chamado pelo botão "Aprovar e enviar"
    ...(video ? { video: await emBase64(video), tipoVideo: video.type } : {}),
  })
}

// Mantido para a Aranha: o Tigre vigia (lê as respostas, manda a prévia se pediram, marca "Sua vez").
export async function buscarRespostas(aoAvancar) {
  const { tigreVigiar } = await import('./tigreTrabalho.js')
  return tigreVigiar(aoAvancar)
}
