// 🐈‍⬛ Conteúdo sugerido pelo Gato Negro para deixar o site completo (amplo) antes da Abelha.
// São textos e listas TÍPICOS do segmento — não são fatos do negócio. Por isso:
//   - nada de preço, ano de fundação, prêmio, número de clientes ou nome de profissional;
//   - tudo vai marcado em conteudo.sugerido e aparece no Gato para o usuário conferir/editar antes de aprovar;
//   - a Abelha troca pelo dado real (com fonte) quando encontra.

const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const SEGMENTOS = [
  {
    re: /barbe/,
    servicos: ['Corte masculino', 'Barba', 'Corte + barba', 'Pigmentação', 'Sobrancelha', 'Corte infantil'],
    diferenciais: ['Ambiente pensado para o cliente relaxar', 'Acabamento caprichado na navalha', 'Horário marcado pelo WhatsApp'],
    sobre: (n) => `${n} é uma barbearia para quem gosta de sair bem cuidado: corte, barba e acabamento com atenção aos detalhes.`,
  },
  {
    re: /salao|cabelei|beleza|estetica|manicure|unha|sobrancelha|cilio/,
    servicos: ['Corte', 'Escova', 'Coloração', 'Hidratação', 'Manicure e pedicure', 'Design de sobrancelhas'],
    diferenciais: ['Atendimento personalizado', 'Produtos de qualidade', 'Agendamento pelo WhatsApp'],
    sobre: (n) => `${n} cuida de você com atenção em cada atendimento, para você sair se sentindo ainda melhor.`,
  },
  {
    re: /pizza/,
    servicos: ['Pizzas salgadas', 'Pizzas doces', 'Bebidas', 'Pedidos para viagem', 'Delivery'],
    diferenciais: ['Massa e recheios caprichados', 'Pedido fácil pelo WhatsApp', 'Ideal para reunir a família'],
    sobre: (n) => `${n} prepara pizzas com capricho para você saborear no local ou pedir pelo WhatsApp.`,
  },
  {
    re: /restaur|comida|marmit|lanch|hamburg|burger|pastel|espetinho|acai|sorvet|cafe/,
    servicos: ['Cardápio do dia', 'Pratos e lanches', 'Bebidas', 'Pedidos para viagem', 'Delivery'],
    diferenciais: ['Comida preparada na hora', 'Pedido rápido pelo WhatsApp', 'Bom para o dia a dia e para encontros'],
    sobre: (n) => `${n} prepara cada pedido com cuidado para você comer bem — no local ou pedindo pelo WhatsApp.`,
  },
  {
    re: /padaria|panific|confeit|doceria|bolo|doce/,
    servicos: ['Pães fresquinhos', 'Bolos', 'Doces e salgados', 'Encomendas para festas', 'Café da manhã'],
    diferenciais: ['Produção diária', 'Encomendas pelo WhatsApp', 'Receitas caprichadas'],
    sobre: (n) => `${n} faz pães, bolos e doces com carinho para o seu dia a dia e para as suas comemorações.`,
  },
  {
    re: /pet|veterin|banho e tosa/,
    servicos: ['Banho', 'Tosa', 'Rações e petiscos', 'Acessórios', 'Atendimento com hora marcada'],
    diferenciais: ['Carinho com o seu pet', 'Agendamento pelo WhatsApp', 'Produtos para o dia a dia'],
    sobre: (n) => `${n} trata o seu pet com carinho, do banho aos produtos do dia a dia.`,
  },
  {
    re: /oficina|mecanic|auto|borrachar|pneu|lava ?jato|lavagem|funilaria/,
    servicos: ['Revisão', 'Troca de óleo', 'Freios e suspensão', 'Diagnóstico', 'Orçamento sem compromisso'],
    diferenciais: ['Atendimento transparente', 'Orçamento pelo WhatsApp', 'Cuidado com o seu veículo'],
    sobre: (n) => `${n} cuida do seu veículo com atenção e transparência, do diagnóstico ao serviço pronto.`,
  },
  {
    re: /academia|crossfit|fitness|pilates|treino/,
    servicos: ['Musculação', 'Treino funcional', 'Aulas em grupo', 'Acompanhamento', 'Planos mensais'],
    diferenciais: ['Ambiente motivador', 'Acompanhamento no treino', 'Informações pelo WhatsApp'],
    sobre: (n) => `${n} é o lugar para você treinar com motivação e acompanhamento e alcançar os seus objetivos.`,
  },
  {
    re: /dentist|odonto|clinica|consultorio|fisio|psico|nutri/,
    servicos: ['Consultas', 'Avaliação', 'Tratamentos', 'Retornos', 'Agendamento'],
    diferenciais: ['Atendimento humanizado', 'Agendamento pelo WhatsApp', 'Ambiente acolhedor'],
    sobre: (n) => `${n} oferece atendimento cuidadoso e acolhedor, com agendamento simples pelo WhatsApp.`,
  },
  {
    re: /roupa|moda|boutique|calcad|sapat|loja|otica|presente|papelaria|floric|movel|eletron|celular|material/,
    servicos: ['Novidades da semana', 'Atendimento pelo WhatsApp', 'Reserva de produtos', 'Entrega ou retirada'],
    diferenciais: ['Atendimento próximo', 'Novidades pelo WhatsApp', 'Facilidade para comprar'],
    sobre: (n) => `${n} reúne produtos escolhidos com cuidado e atende você de perto, na loja ou pelo WhatsApp.`,
  },
]

const GENERICO = {
  servicos: ['Atendimento no local', 'Atendimento pelo WhatsApp', 'Orçamento sem compromisso'],
  diferenciais: ['Atendimento próximo', 'Resposta rápida pelo WhatsApp', 'Compromisso com o cliente'],
  sobre: (n) => `${n} atende você com atenção e cuidado. Fale com a gente pelo WhatsApp.`,
}

export function segmentoDe(categoria) {
  const c = norm(categoria)
  return SEGMENTOS.find((s) => s.re.test(c)) || GENERICO
}

// Monta o conteúdo do site: mantém o que já é real (vindo da Abelha) e completa o resto com sugestões.
export function conteudoSugerido(dados) {
  const n = dados.negocio || {}
  const atual = dados.conteudo || {}
  const seg = segmentoDe(n.categoria)
  const sugerido = new Set(atual.sugerido || [])
  const conteudo = { ...atual }
  const completar = (campo, valor) => {
    const vazio = Array.isArray(conteudo[campo]) ? !conteudo[campo].length : !conteudo[campo]
    if (vazio && valor && (!Array.isArray(valor) || valor.length)) {
      conteudo[campo] = valor
      sugerido.add(campo)
    }
  }
  completar('sobre', seg.sobre(n.nome))
  completar('servicos', seg.servicos)
  completar('diferenciais', seg.diferenciais)
  completar(
    'passos',
    n.whatsapp
      ? ['Chame a gente no WhatsApp', 'Combine o melhor dia e horário', 'Venha até nós' + (n.endereco ? '' : ' ou peça para receber')]
      : ['Entre em contato', 'Combine o melhor dia e horário', 'Venha até nós'],
  )
  completar('faq', perguntas(n, conteudo))
  return { ...conteudo, sugerido: [...sugerido] }
}

// Perguntas frequentes só com respostas que saem dos dados (WhatsApp, endereço, horário).
function perguntas(n, c) {
  const faq = []
  if (n.whatsapp) faq.push({ p: 'Como faço para agendar ou pedir?', r: 'É só chamar no WhatsApp pelo botão desta página.' })
  if (n.endereco) faq.push({ p: 'Onde vocês ficam?', r: n.endereco + '. O mapa está logo abaixo.' })
  if (c.horarios) faq.push({ p: 'Qual o horário de funcionamento?', r: c.horarios })
  if (n.rating) faq.push({ p: 'Vocês têm avaliações?', r: `Sim: nota ${String(n.rating).replace('.', ',')} no Google, com ${n.avaliacoes || 0} avaliações.` })
  return faq
}
