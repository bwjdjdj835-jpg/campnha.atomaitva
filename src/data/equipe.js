// Time completo, na ordem do fluxo (pedido do usuário): os 5 agentes originais + Castor, Aranha e Águia.
import { agents } from './agents.js'

const porId = Object.fromEntries(agents.map((a) => [a.id, a]))
const extra = {
  castor: { id: 'castor', name: 'Castor', emoji: '🦫', accent: '#a16207', role: 'Diretor de arte', tagline: '3 modelos do site e o design system do ramo, antes do Gato.', link: '/agente/gato' },
  aranha: { id: 'aranha', name: 'Aranha Administradora', emoji: '🕷️', accent: '#22d3ee', role: 'Aprovação e conversa', tagline: 'Você confere vídeo e mensagem, manda e conversa até fechar.', link: '/admin' },
  aguia: { id: 'aguia', name: 'Águia', emoji: '🦅', accent: '#e2e8f0', role: 'Visão geral e relatório', tagline: 'Vê tudo de cima e te manda o relatório por e-mail.', link: '/aguia' },
}

export const equipe = ['pinguim', 'leao', 'castor', 'gato', 'abelha', 'tigre', 'aranha', 'aguia'].map((id, i) => {
  const a = porId[id] || extra[id]
  return { ...a, ordem: i + 1, link: a.link || `/agente/${id}` }
})
