// ☁️ Dados do app na nuvem (pedido do usuário: "o Tigre salva mas some quando entro de novo").
// Upstash Redis pelo Vercel Marketplace (grátis): KV_REST_API_URL + KV_REST_API_TOKEN (ou UPSTASH_REDIS_REST_URL/TOKEN).
// Cada aparelho entra com o mesmo "código da conta"; a chave no Redis é o hash do código (o código não fica guardado).

import { createHash } from 'node:crypto'

const url = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const token = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
export const temNuvem = () => Boolean(url() && token())

const chave = (codigo) => 'central-agentes:' + createHash('sha256').update(String(codigo)).digest('hex')
export const codigoValido = (c) => /^[A-Za-z0-9-]{12,64}$/.test(String(c || ''))

export async function redis(comando) {
  const res = await fetch(url(), { method: 'POST', headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(comando) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.error) throw new Error(`Nuvem: ${json.error || res.statusText}`)
  return json.result
}

export async function lerDados(codigo) {
  const v = await redis(['GET', chave(codigo)])
  return v ? JSON.parse(v) : null
}

export async function gravarDados(codigo, dados) {
  await redis(['SET', chave(codigo), JSON.stringify(dados)])
  return { ok: true }
}
