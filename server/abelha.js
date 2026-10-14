// 🐝 Abelha Central — busca dados públicos complementares do negócio (Firecrawl) e extrai
// "sobre", horário e serviços. Regra de ouro: nada sem fonte. Cada campo volta com a URL de onde veio,
// e o usuário escolhe na interface o que entra no site.
//   Com ANTHROPIC_API_KEY: Claude lê os trechos encontrados e extrai os campos (só do que está nos trechos).
//   Sem a chave: só horário, por padrão de texto, e a lista de fontes para o usuário conferir.

import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'

const MODELO = 'claude-opus-5-5'

async function buscarWeb(query) {
  const res = await fetch('https://api.firecrawl.dev/v2/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
    body: JSON.stringify({ query, limit: 6, country: 'BR', lang: 'pt' }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Firecrawl: ${data.error || res.statusText}`)
  return (data.data?.web || []).map((r) => ({ titulo: r.title || r.url, url: r.url, trecho: r.description || '' }))
}

// "Seg a Sex 8h às 18h", "segunda a sábado das 9h às 19h", "Seg-Sáb: 08:00–18:00"…
const HORARIO =
  /((seg(unda)?|ter(ça)?|qua(rta)?|qui(nta)?|sex(ta)?|s[áa]b(ado)?|dom(ingo)?)[^.;\n]{0,40}?\d{1,2}\s?(h|:\d{2})[^.;\n]{0,30}?\d{1,2}\s?(h|:\d{2})(\d{2})?)/i

export function extrairPorRegras(fontes) {
  for (const f of fontes) {
    const m = f.trecho.match(HORARIO)
    if (m) return { sobre: null, horarios: { texto: m[1].trim(), fonte: f.url }, servicos: [] }
  }
  return { sobre: null, horarios: null, servicos: [] }
}

const Extracao = z.object({
  sobre: z.object({ texto: z.string(), fonte: z.number().int() }).nullable(),
  horarios: z.object({ texto: z.string(), fonte: z.number().int() }).nullable(),
  servicos: z.array(z.object({ nome: z.string(), fonte: z.number().int() })),
})

async function extrairComClaude(negocio, fontes) {
  const lista = fontes.map((f, i) => `[${i}] ${f.titulo}\n${f.url}\n${f.trecho}`).join('\n\n')
  const resposta = await new Anthropic().beta.messages.parse({
    model: MODELO,
    max_tokens: 4000,
    output_config: { effort: 'low', format: betaZodOutputFormat(Extracao) },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system:
      'Você extrai dados de um comércio local a partir de trechos de busca. Use SOMENTE o que está escrito nos trechos; ' +
      'nunca complete com suposições. Ignore trechos que sejam de outro negócio com nome parecido. ' +
      '"sobre": 1 a 2 frases em português descrevendo o negócio, reescritas a partir do trecho (sem inventar). ' +
      '"horarios": como aparece no trecho. "servicos": nomes curtos. "fonte" é o número [i] do trecho usado. ' +
      'Se não houver dado, use null ou lista vazia.',
    messages: [
      {
        role: 'user',
        content: `Negócio: ${negocio.nome} — ${negocio.categoria || ''} — ${negocio.endereco || ''}\n\nTrechos:\n${lista}`,
      },
    ],
  })
  const r = resposta.stop_reason === 'refusal' ? null : resposta.parsed_output
  if (!r) return extrairPorRegras(fontes)
  // Só aceita campos que apontam para uma fonte que existe.
  const url = (i) => fontes[i]?.url
  return {
    sobre: r.sobre && url(r.sobre.fonte) ? { texto: r.sobre.texto, fonte: url(r.sobre.fonte) } : null,
    horarios: r.horarios && url(r.horarios.fonte) ? { texto: r.horarios.texto, fonte: url(r.horarios.fonte) } : null,
    servicos: r.servicos.filter((s) => url(s.fonte)).map((s) => ({ nome: s.nome, fonte: url(s.fonte) })),
  }
}

export async function enriquecer(negocio) {
  const cidade = (negocio.endereco || '').split(' - ').slice(-2).join(' ')
  const fontes = await buscarWeb(`"${negocio.nome}" ${cidade}`.trim())
  const campos =
    process.env.ANTHROPIC_API_KEY && fontes.length ? await extrairComClaude(negocio, fontes) : extrairPorRegras(fontes)
  return { fontes, campos, metodo: process.env.ANTHROPIC_API_KEY ? 'claude' : 'regras' }
}
