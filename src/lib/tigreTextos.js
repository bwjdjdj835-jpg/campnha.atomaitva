// 🐯 Tigre — textos e regras usados tanto no servidor quanto no navegador (sem servidor/sem Claude).

// Os modelos de texto do prompt original, usados quando não há ANTHROPIC_API_KEY.
export const MODELOS = {
  primeiro: (n) =>
    `Olá${n.nome ? `, pessoal da ${n.nome}` : ''}! Vimos que o seu negócio ainda não tem um site. Ter presença online ajuda o seu comércio a aparecer no Google. Nós criamos e hospedamos um site exclusivo, personalizado com as suas fotos. Gostaria de ver uma prévia?`,
  fechamento: () =>
    'Perfeito! Podemos fechar agora. Assim que o pagamento for confirmado, te enviamos o link do site no ar.',
  link: (n, url) => `Prontinho! O site${n.nome ? ` da ${n.nome}` : ''} já está no ar: ${url}`,
  // Cliente disse "não quero agora" (sem pedir para parar): uma resposta leve, sem insistir, só uma vez.
  olhada: () =>
    'Tudo bem, sem problema! 😊 Só dá uma olhadinha no projeto que eu preparei pra vocês, sem compromisso nenhum. Se um dia fizer sentido, é só me chamar aqui.',
}

// Palavras-chave quando não há Claude. Opt-out vem primeiro: na dúvida, respeitar.
const OPT_OUT = /(n[aã]o (me )?(mand|envi|cham|contat|perturb|incomod)|\bpar[ae]r? de (me )?(mand|envi|cham|contat|perturb|incomod)|pare de|parar de|sair da lista|descadastr|bloque|n[aã]o (quero|tenho interesse em) (mais )?receber|n[aã]o quero mais (mensage|contato)|me (tira|remove)|stop\b)/i
const RECUSA = /(n[aã]o (quero|preciso|tenho interesse)|sem interesse|j[aá] tenho site|obrigad[oa],? mas|agora n[aã]o|no momento|por enquanto|mais (pra|para) frente|fica pra (pr[oó]xima|depois))/i
const INTERESSE = /(\bsim\b|quero|tenho interesse|interessad|pode mandar|manda a pr[eé]via|quanto (custa|fica|é)|valor|pre[cç]o|gostei|bora|fechado|vamos)/i

export function classificarPorPalavras(texto) {
  if (OPT_OUT.test(texto)) return { intencao: 'nao_contatar', resumo: 'Pediu para não receber mais mensagens.' }
  if (RECUSA.test(texto)) return { intencao: 'recusa', resumo: 'Não demonstrou interesse.' }
  if (INTERESSE.test(texto)) return { intencao: 'interesse', resumo: 'Demonstrou interesse.' }
  if (texto.includes('?')) return { intencao: 'duvida', resumo: 'Fez uma pergunta.' }
  return { intencao: 'outro', resumo: 'Resposta sem intenção clara.' }
}

