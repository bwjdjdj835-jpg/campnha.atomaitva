// 🐯 Tigre — textos e regras usados tanto no servidor quanto no navegador (sem servidor/sem Claude).

// Os modelos de texto do prompt original, usados quando não há ANTHROPIC_API_KEY.
export const MODELOS = {
  primeiro: (n) =>
    `Olá${n.nome ? `, pessoal da ${n.nome}` : ''}! Vimos que o seu negócio ainda não tem um site. Ter presença online ajuda o seu comércio a aparecer no Google. Nós criamos e hospedamos um site exclusivo, personalizado com as suas fotos. Gostaria de ver uma prévia?`,
  fechamento: () =>
    'Perfeito! Podemos fechar agora. Assim que o pagamento for confirmado, te enviamos o link do site no ar.',
  link: (n, url) => `Prontinho! O site${n.nome ? ` da ${n.nome}` : ''} já está no ar: ${url}`,
}

// Palavras-chave quando não há Claude. Opt-out vem primeiro: na dúvida, respeitar.
const OPT_OUT = /(n[aã]o (me )?(mand|envi|cham|contat|perturb)|pare de|parar de|sair da lista|descadastr|bloque|n[aã]o tenho interesse em receber|stop\b)/i
const RECUSA = /(n[aã]o (quero|preciso|tenho interesse)|sem interesse|j[aá] tenho site|obrigad[oa],? mas|agora n[aã]o)/i
const INTERESSE = /(\bsim\b|quero|tenho interesse|interessad|pode mandar|manda a pr[eé]via|quanto (custa|fica|é)|valor|pre[cç]o|gostei|bora|fechado|vamos)/i

export function classificarPorPalavras(texto) {
  if (OPT_OUT.test(texto)) return { intencao: 'nao_contatar', resumo: 'Pediu para não receber mais mensagens.' }
  if (RECUSA.test(texto)) return { intencao: 'recusa', resumo: 'Não demonstrou interesse.' }
  if (INTERESSE.test(texto)) return { intencao: 'interesse', resumo: 'Demonstrou interesse.' }
  if (texto.includes('?')) return { intencao: 'duvida', resumo: 'Fez uma pergunta.' }
  return { intencao: 'outro', resumo: 'Resposta sem intenção clara.' }
}

