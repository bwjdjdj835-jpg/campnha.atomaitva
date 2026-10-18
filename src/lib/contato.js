// Selo de contato de cada comércio: mostra se você já mandou mensagem, se ele não quer site ainda etc.
// Vem da conversa do Tigre (pelo site feito para o lead) ou de uma marcação manual na lista do Pinguim
// (pipeline.contatos, guardada pelo telefone — continua valendo quando o Pinguim acha o comércio de novo).

export const SELO_CONTATO = {
  site_feito: { texto: '🦁 Site feito — falta mandar', cor: 'bg-white/5 text-slate-300' },
  contatado: { texto: '⏳ Aguardando resposta', cor: 'bg-sky-400/10 text-sky-300' },
  duvida: { texto: '💬 Fez uma pergunta', cor: 'bg-amber-400/10 text-amber-300' },
  bot: { texto: '🤖 Respondeu um robô', cor: 'bg-violet-400/10 text-violet-300' },
  interessado: { texto: '🔥 Interessado', cor: 'bg-emerald-400/10 text-emerald-300' },
  fechando: { texto: '🤝 Quer fechar', cor: 'bg-emerald-400/15 text-emerald-200' },
  pagou: { texto: '💸 Disse que pagou (confira)', cor: 'bg-amber-400/15 text-amber-200' },
  recusou: { texto: '🙅 Não quer site ainda', cor: 'bg-orange-400/10 text-orange-300' },
  nao_contatar: { texto: '⛔ Não contatar', cor: 'bg-rose-400/10 text-rose-300' },
  vendido: { texto: '💰 Pagou', cor: 'bg-emerald-400/15 text-emerald-200' },
  publicado: { texto: '✅ Site no ar', cor: 'bg-neon/15 text-neon-soft' },
}

const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

// Telefone sem DDI (só os 10–11 dígitos) ou, sem telefone, o nome.
export function chaveContato(lead) {
  const d = String(lead?.telefone || lead?.whatsapp || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '')
  return d.length >= 10 ? `fone:${d}` : `nome:${norm(lead?.nome)}`
}

// { status, manual } ou null (ainda sem contato).
export function contatoDoLead(lead, { sites = [], conversas = {}, contatos = {}, leads = [] }) {
  const chave = chaveContato(lead)
  const doSite = sites.filter((s) => {
    if (s.leadId === lead.id) return true
    const outro = leads.find((l) => l.id === s.leadId)
    return outro ? chaveContato(outro) === chave : norm(s.nome) === norm(lead.nome)
  })
  // A conversa mais adiantada entre os sites deste comércio.
  const ordem = Object.keys(SELO_CONTATO)
  const status = doSite
    .map((s) => conversas[s.id]?.status)
    .filter((st) => st && st !== 'novo' && SELO_CONTATO[st])
    .sort((a, b) => ordem.indexOf(b) - ordem.indexOf(a))[0]
  if (status) return { status, manual: false }
  if (contatos[chave]) return { status: contatos[chave].status, manual: true }
  if (doSite.length) return { status: 'site_feito', manual: false }
  return null
}

export const rotuloContato = (c) => (c ? ` — ${SELO_CONTATO[c.status]?.texto || ''}` : '')
