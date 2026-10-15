// 🦅 Águia — manda o relatório do processo por e-mail (Resend: https://resend.com/docs/api-reference/emails/send-email).
// RESEND_API_KEY (grátis: 100 e-mails/dia) e AGUIA_EMAIL (para quem mandar). Sem domínio próprio, o Resend só entrega
// no e-mail da própria conta — use o mesmo e-mail da conta do Resend em AGUIA_EMAIL.

export const temEmail = () => Boolean(process.env.RESEND_API_KEY && process.env.AGUIA_EMAIL)

export async function enviarRelatorio({ assunto, texto }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.AGUIA_REMETENTE || 'Águia · Central de Agentes <onboarding@resend.dev>',
      to: [process.env.AGUIA_EMAIL],
      subject: String(assunto || 'Relatório da Central de Agentes').slice(0, 150),
      text: String(texto || '').slice(0, 20000),
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Resend: ${json.message || json.error || res.statusText}`)
  return { id: json.id }
}
