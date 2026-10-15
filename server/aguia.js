// 🦅 Águia — manda o relatório do processo por e-mail (Resend: https://resend.com/docs/api-reference/emails/send-email).
// RESEND_API_KEY (grátis: 100 e-mails/dia) e AGUIA_EMAIL (para quem mandar). Sem domínio próprio, o Resend só entrega
// no e-mail da própria conta — use o mesmo e-mail da conta do Resend em AGUIA_EMAIL.

// Basta a chave do Resend: o e-mail de destino vem de AGUIA_EMAIL ou do campo "Seu e-mail" da página da Águia.
export const temEmail = () => Boolean(process.env.RESEND_API_KEY)
const EMAIL = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i

export async function enviarRelatorio({ assunto, texto, para }) {
  const destino = process.env.AGUIA_EMAIL || (EMAIL.test(String(para || '').trim()) ? String(para).trim() : '')
  if (!destino) throw new Error('Diga para qual e-mail mandar (campo "Seu e-mail" na página da Águia).')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.AGUIA_REMETENTE || 'Águia · Central de Agentes <onboarding@resend.dev>',
      to: [destino],
      subject: String(assunto || 'Relatório da Central de Agentes').slice(0, 150),
      text: String(texto || '').slice(0, 20000),
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Resend: ${json.message || json.error || res.statusText}`)
  return { id: json.id }
}
