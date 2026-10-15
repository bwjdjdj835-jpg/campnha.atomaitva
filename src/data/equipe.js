// Time completo, na ordem do fluxo (pedido do usuário): os 5 agentes originais + Castor, Aranha e Águia.
// 🦂 Escorpião vem por último: é agente SOLO (fora do automático), finaliza sites por especialidade.
import { agents } from './agents.js'

const porId = Object.fromEntries(agents.map((a) => [a.id, a]))
const extra = {
  castor: { id: 'castor', name: 'Castor', emoji: '🦫', accent: '#a16207', role: 'Diretor de arte', tagline: '3 modelos do site e o design system do ramo, antes do Gato.', link: '/agente/gato' },
  aranha: { id: 'aranha', name: 'Aranha Administradora', emoji: '🕷️', accent: '#22d3ee', role: 'Seu lugar de administrador', tagline: 'Você confere vídeo e mensagem e só clica em Aprovar — o Tigre faz o resto.', link: '/admin' },
  escorpiao: { id: 'escorpiao', name: 'Escorpião', emoji: '🦂', accent: '#dc2626', role: 'Agente solo · sites por especialidade', tagline: 'Um nicho + 3 sites de referência → site interativo de agência com os dados dos agentes.', link: '/escorpiao' },
  aguia: { id: 'aguia', name: 'Águia', emoji: '🦅', accent: '#e2e8f0', role: 'Visão geral e relatório', tagline: 'Vê tudo de cima e te manda o relatório por e-mail.', link: '/aguia' },
}

export const equipe = ['pinguim', 'leao', 'castor', 'gato', 'abelha', 'tigre', 'aranha', 'aguia', 'escorpiao'].map((id, i) => {
  const a = porId[id] || extra[id]
  return { ...a, ordem: i + 1, link: a.link || `/agente/${id}` }
})
