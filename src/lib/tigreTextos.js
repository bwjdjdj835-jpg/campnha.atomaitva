// 🐯 Tigre — textos e regras usados tanto no servidor quanto no navegador (sem servidor/sem Claude).

// Os modelos de texto do prompt original, usados quando não há chave de IA (GROQ_API_KEY ou ANTHROPIC_API_KEY).
export const MODELOS = {
  primeiro: (n) =>
    `Olá${n.nome ? `, pessoal da ${n.nome}` : ''}! Vimos que o seu negócio ainda não tem um site. Ter presença online ajuda o seu comércio a aparecer no Google. Nós criamos e hospedamos um site exclusivo, personalizado com as suas fotos. Gostaria de ver uma prévia?`,
  fechamento: () =>
    'Perfeito! Podemos fechar agora. Assim que o pagamento for confirmado, te enviamos o link do site no ar.',
  link: (n, url) => `Prontinho! O site${n.nome ? ` da ${n.nome}` : ''} já está no ar: ${url}`,
  // Cliente disse "não quero agora" (sem pedir para parar): uma resposta leve, sem insistir, só uma vez.
  olhada: () =>
    'Tudo bem, sem problema! 😊 Só dá uma olhadinha no projeto que eu preparei pra vocês, sem compromisso nenhum. Se um dia fizer sentido, é só me chamar aqui.',
  // Recusou de novo depois do "só dá uma olhada": agradece e encerra, sem insistir.
  despedida: () => 'Tudo bem, obrigado pela atenção! 🙏 Desejo muito sucesso pra vocês. Se um dia precisarem de um site, é só me chamar aqui.',
  // Quem respondeu foi um robô (resposta automática / menu do WhatsApp Business): pedir para falar com uma pessoa.
  pessoa: (n, opcao) =>
    `${opcao ? `${opcao}\n\n` : ''}Oi, tudo bem? Eu gostaria de falar com o responsável${n.nome ? ` pela ${n.nome}` : ''} ou com alguém da equipe, por favor. É sobre um site que eu preparei pra vocês — é rapidinho!`,
}

// Menu do robô: acha o número da opção de falar com atendente/pessoa (ex.: "3 - Falar com atendente").
export function opcaoDeAtendente(texto) {
  const linha = String(texto || '')
    .replace(/(\d)\uFE0F?\u20E3/g, '\n$1 - ') // 2️⃣ → "2 -"
    .split(/\n|(?=\b\d{1,2}\s*[-–).:]\s)/)
    .find((l) => /atendente|atendimento humano|falar com (uma )?(pessoa|algu[eé]m|a equipe|vendedor|respons[aá]vel)|outros assuntos|outro assunto/i.test(l))
  const m = linha && linha.match(/^\s*\*?(\d{1,2})\s*\*?\s*[-–).:]/)
  return m ? m[1] : ''
}

// Palavras-chave quando não há Claude. Opt-out vem primeiro: na dúvida, respeitar.
const OPT_OUT = /(n[aã]o (me )?(mand|envi|cham|contat|perturb|incomod)|\bpar[ae]r? de (me )?(mand|envi|cham|contat|perturb|incomod)|pare de|parar de|sair da lista|descadastr|bloque|n[aã]o (quero|tenho interesse em) (mais )?receber|n[aã]o quero mais (mensage|contato)|me (tira|remove)|stop\b)/i
// Resposta automática, menu ou assistente virtual do WhatsApp Business.
const BOT = /(mensagem autom[aá]tica|resposta autom[aá]tica|atendimento autom[aá]tico|assistente virtual|sou (o|a) (bot|rob[oô]|assistente)|\bchatbot\b|digite (o n[uú]mero|a op[cç][aã]o|\d)|(selecione|escolha|informe) (uma|a) op[cç][aã]o|op[cç][aã]o desejada|menu (principal|de op)|em breve (retornaremos|responderemos|entraremos|daremos)|retornaremos (o mais breve|em breve|assim que)|(nosso|fora do) hor[aá]rio de atendimento|agradecemos (o|seu|pelo) contato|obrigad[oa] (por|pelo) (entrar em )?contato|recebemos sua mensagem|aguarde (um momento|que (j[aá] )?(vamos|iremos))|seja bem[- ]vind[oa])/i
const RECUSA = /(n[aã]o (quero|preciso|tenho interesse)|sem interesse|j[aá] tenho site|obrigad[oa],? mas|agora n[aã]o|no momento|por enquanto|mais (pra|para) frente|fica pra (pr[oó]xima|depois))/i
const INTERESSE = /(\bsim\b|quero|tenho interesse|interessad|pode mandar|manda a pr[eé]via|quanto (custa|fica|é)|valor|pre[cç]o|gostei|bora|fechado|vamos)/i

export function classificarPorPalavras(texto) {
  if (OPT_OUT.test(texto)) return { intencao: 'nao_contatar', resumo: 'Pediu para não receber mais mensagens.' }
  if (BOT.test(texto)) return { intencao: 'bot', resumo: 'Quem respondeu foi um atendimento automático (robô).', opcao: opcaoDeAtendente(texto) }
  if (RECUSA.test(texto)) return { intencao: 'recusa', resumo: 'Não demonstrou interesse.' }
  if (INTERESSE.test(texto)) return { intencao: 'interesse', resumo: 'Demonstrou interesse.' }
  if (texto.includes('?')) return { intencao: 'duvida', resumo: 'Fez uma pergunta.' }
  return { intencao: 'outro', resumo: 'Resposta sem intenção clara.' }
}


// Resposta à última mensagem do cliente quando não há IA: casos comuns em que a conversa sai do roteiro.
// Nunca inventa preço, prazo ou promoção.
const RESPOSTAS = [
  [/(engano|n[uú]mero errado|n[aã]o (é|e|sou) (daqui|eu|d[aoe]ss[ae])|n[aã]o conhe[cç]o|pessoa errada)/i,
    () => 'Opa, desculpa o engano! Obrigado por avisar e tenha um ótimo dia. 🙏'],
  [/(golpe|spam|fake|confi[aá]vel|confian[cç]a|seguro\b|desconfi)/i,
    (n) => `Entendo a desconfiança, é bom mesmo tomar cuidado! Não precisa pagar nada pra ver: é só uma prévia do site que eu montei${n.nome ? ` pra ${n.nome}` : ''}. Se gostar, a gente conversa; se não, sem problema nenhum.`],
  [/(quem (é|e|fala|s[aã]o)|como (conseguiu|achou|pegou)|onde (conseguiu|achou|pegou)|de onde (vc|voc[eê])|qual (empresa|o seu nome))/i,
    (n) => `Desculpa não ter me apresentado! Eu crio sites para comércios aqui da região e encontrei${n.nome ? ` a ${n.nome}` : ' vocês'} no Google Maps. Preparei uma prévia de site pra vocês — posso te mostrar?`],
  [/(quanto (custa|fica|é|e|sai|cobra)|valor|pre[cç]o|or[cç]amento|mensalidade|caro)/i,
    () => 'Ótima pergunta! O valor depende do que vocês precisam no site. Posso te mandar a prévia que eu já fiz e aí a gente combina um valor que caiba no bolso de vocês. Pode ser?'],
  [/(fechad[oa]|bora|vamos fechar|quero (fazer|contratar|fechar)|pode fazer|como (eu )?pago|pix)/i,
    () => 'Perfeito! 🎉 Assim que o pagamento for confirmado, eu coloco o site no ar e te mando o link aqui.'],
  [/(quero ver|pode mandar|manda( a| o)?( pr[eé]via| v[ií]deo| ai| aí)?|mostra|deixa eu ver|tenho interesse|interessad)/i,
    () => 'Que bom! 😊 Vou te mandar agora o vídeo da prévia do site. Dá uma olhada e me diz o que achou!'],
  [/(como funciona|o que (é|e) isso|que site|explica|n[aã]o entendi)/i,
    (n) => `É simples: eu montei um site com as fotos e as informações${n.nome ? ` da ${n.nome}` : ''}. Se vocês gostarem, eu coloco no ar com um endereço próprio e o botão do WhatsApp. Posso te mandar a prévia pra ver como ficou?`],
  [/(ocupad|depois|mais tarde|agora n[aã]o posso|t[oô] trabalhando|outra hora)/i,
    () => 'Sem problema! Fica à vontade — quando tiver um tempinho, me chama aqui. 😊'],
  [/^\s*(oi|ol[aá]|opa|bom dia|boa tarde|boa noite|e a[ií]|tudo bem)[\s!?.,]*$/i,
    (n) => `Oi! Tudo bem? 😊 Eu preparei uma prévia de site${n.nome ? ` pra ${n.nome}` : ' pra vocês'} — posso te mandar pra você dar uma olhada?`],
  [/(obrigad|valeu|show|legal|top|gostei|ficou (bom|lindo|bonito))/i,
    () => 'Eu que agradeço! 😊 Se quiser, já deixo tudo pronto pra colocar o site no ar. É só me falar.'],
]

export function respostaPorPalavras(texto, n = {}) {
  const achada = RESPOSTAS.find(([re]) => re.test(String(texto || '')))
  if (achada) return achada[1](n)
  return `Entendi! Qualquer dúvida é só me falar. Posso te mandar a prévia do site que eu preparei${n.nome ? ` pra ${n.nome}` : ''}?`
}
