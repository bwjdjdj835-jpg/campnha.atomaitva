// 🧠 Mente dos agentes (pedido do usuário): cada agente tem personalidade, memória do que fez e uma opinião
// sobre o que viu — calculada dos dados reais do app (nunca inventada).
// A memória fica em pipeline.mentes[agente] = [{ texto, tipo, dados, at }] (no máximo 60 por agente).

import { lerPipeline, setPipeline } from '../store/pipeline.js'

export const PERSONALIDADES = {
  pinguim: {
    emoji: '🐧',
    nome: 'Pinguim Azulado',
    personalidade: 'Curioso e metódico. Gosta de vasculhar a cidade inteira e só fica feliz quando confere duas vezes.',
    lema: '"Se não tem site, eu acho."',
  },
  leao: {
    emoji: '🦁',
    nome: 'Leão',
    personalidade: 'Prático e rápido. Pega o que o Pinguim trouxe e monta a estrutura sem enrolação.',
    lema: '"Primeiro a base forte, depois o enfeite."',
  },
  castor: {
    emoji: '🦫',
    nome: 'Castor',
    personalidade: 'Arquiteto caprichoso. Antes do Gato pintar, ele desenha 3 plantas diferentes para você escolher.',
    lema: '"Toda obra começa com um bom projeto."',
  },
  gato: {
    emoji: '🐈‍⬛',
    nome: 'Gato Negro',
    personalidade: 'Detalhista e exigente com estética. Estuda sites do ramo antes de dar a última pincelada.',
    lema: '"Bonito não basta: tem que parecer do ramo."',
  },
  abelha: {
    emoji: '🐝',
    nome: 'Abelha Central',
    personalidade: 'Fiscal de qualidade. Confere tudo depois do Gato e devolve se o site não ficou bom.',
    lema: '"Sem fonte, não entra no site."',
  },
  tigre: {
    emoji: '🐯',
    nome: 'Tigre',
    personalidade: 'Trabalhador incansável e organizado. Depois do seu Aprovar ele grava, manda e anota tudo — e nunca manda duas vezes para o mesmo comércio.',
    lema: '"Ninguém fica esquecido."',
  },
  aranha: {
    emoji: '🕷️',
    nome: 'Aranha Administradora',
    personalidade: 'Sua cadeira de administrador. Mostra tudo pronto para você só olhar e aprovar.',
    lema: '"Sem pressa e sem pressão — mas sem largar o fio."',
  },
  aguia: {
    emoji: '🦅',
    nome: 'Águia',
    personalidade: 'Vê tudo de cima. Acompanha o processo inteiro e te conta como está indo.',
    lema: '"Daqui de cima, nada me escapa."',
  },
  escorpiao: {
    emoji: '🦂',
    nome: 'Escorpião',
    personalidade: 'Especialista solo. Escolhe um nicho só, estuda os sites de referência que você manda e finaliza o site com interação de agência.',
    lema: '"Um ramo só, feito com precisão."',
  },
}

const MAX = 60

// Guarda uma lembrança do agente (o que ele fez ou viu).
export function lembrar(agente, texto, dados) {
  if (!PERSONALIDADES[agente] || !texto) return
  setPipeline((s) => {
    const mentes = s.mentes || {}
    const lista = [{ texto, ...(dados ? { dados } : {}), at: new Date().toISOString() }, ...(mentes[agente] || [])].slice(0, MAX)
    return { mentes: { ...mentes, [agente]: lista } }
  })
}

export const memorias = (agente, estado = lerPipeline()) => estado.mentes?.[agente] || []

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const maisFrequente = (lista) => {
  const conta = {}
  for (const x of lista) if (x) conta[x] = (conta[x] || 0) + 1
  const [valor, vezes] = Object.entries(conta).sort((a, b) => b[1] - a[1])[0] || []
  return valor ? { valor, vezes, total: lista.filter(Boolean).length } : null
}

// Estilo que você mais escolhe no Castor (para ele sugerir primeiro na próxima vez).
export function estiloPreferido(estado = lerPipeline()) {
  const escolhas = memorias('castor', estado).filter((m) => m.dados?.tema)
  const tema = maisFrequente(escolhas.map((m) => m.dados.tema))
  if (!tema || tema.vezes < 2) return null
  const daquele = escolhas.filter((m) => m.dados.tema === tema.valor)
  return {
    tema: tema.valor,
    hero: maisFrequente(daquele.map((m) => m.dados.hero))?.valor || 'agua',
    galeria: maisFrequente(daquele.map((m) => m.dados.galeria))?.valor || 'uniforme',
    vezes: tema.vezes,
    total: tema.total,
  }
}

const NOME_TEMA = { noite: 'Noite', claro: 'Claro', studio: 'Studio', vibrante: 'Vibrante', modelo: 'do modelo', castor: 'Direção de arte do Castor' }

// O que o agente "pensa", tirado dos dados do app.
export function pensamentos(agente, estado = lerPipeline()) {
  const { leads = [], sites = [], conversas = {}, comSite = [], auto = {} } = estado
  const reais = leads.filter((l) => !l.demo)
  const comConversa = sites.filter((s) => conversas[s.id]?.mensagens?.some((m) => m.de === 'nos'))
  const st = (s) => conversas[s.id]?.status
  const out = []
  if (agente === 'pinguim') {
    if (!reais.length) return ['Ainda não saí para caçar. Me dá uma cidade e um nicho!']
    const total = reais.length + comSite.length
    out.push(`Já vi ${total} comércio(s); ${reais.length} sem site no Maps (${pct(reais.length, total)}%).`)
    const nicho = maisFrequente(reais.map((l) => l.categoria))
    if (nicho) out.push(`O nicho com mais comércio sem site até agora: ${nicho.valor} (${nicho.vezes}).`)
    const pend = reais.filter((l) => ['pendente', 'erro'].includes(l.conferencia?.status)).length
    if (pend) out.push(`Ainda tenho ${pend} para conferir se têm site em outro lugar.`)
    const feitos = auto.feitos?.length || 0
    if (feitos) out.push(`Terminei ${feitos} nicho(s) inteiro(s) no automático.`)
  }
  if (agente === 'leao') {
    const feitos = sites.filter((s) => s.status !== 'descartado')
    if (!feitos.length) return ['Nenhum site montado ainda — estou pronto quando o Pinguim trouxer alguém.']
    out.push(`Montei ${feitos.length} site(s). ${sites.filter((s) => s.status === 'descartado').length} foram descartados.`)
  }
  if (agente === 'castor') {
    const pref = estiloPreferido(estado)
    const n = memorias('castor', estado).filter((m) => m.dados?.tema).length
    if (!n) return ['Ainda não sei do que você gosta. Escolha um dos meus 3 modelos e eu vou aprendendo.']
    out.push(`Você já escolheu ${n} modelo(s) comigo.`)
    if (pref) out.push(`Seu estilo preferido: ${NOME_TEMA[pref.tema] || pref.tema} (${pref.vezes} de ${pref.total}). Ele vem primeiro nas minhas sugestões.`)
    else out.push('Ainda não vi um estilo preferido — você varia bastante.')
  }
  if (agente === 'gato') {
    const aprov = sites.filter((s) => s.tema && s.aprovadoEm)
    const tema = maisFrequente(aprov.map((s) => s.tema))
    if (!aprov.length) return ['Nenhuma prévia aprovada ainda. Quero caprichar na primeira!']
    out.push(`${aprov.length} prévia(s) aprovada(s).`)
    if (tema) out.push(`O tema que mais sai aprovado: ${NOME_TEMA[tema.valor] || tema.valor} (${tema.vezes}).`)
  }
  if (agente === 'abelha') {
    const notas = memorias('abelha', estado).map((m) => m.dados?.nota).filter((n) => typeof n === 'number')
    if (!notas.length) return ['Ainda não auditei nenhum site.']
    const media = Math.round(notas.reduce((a, b) => a + b, 0) / notas.length)
    out.push(`Auditei ${notas.length} site(s); nota média ${media}/100.`)
    if (media < 70) out.push('Os sites estão saindo com pouca informação — vale buscar mais dados do comércio.')
  }
  if (agente === 'tigre' || agente === 'aranha') {
    if (!comConversa.length) return [agente === 'tigre' ? 'Ainda não tenho ninguém na memória.' : 'Ainda não conversei com nenhum cliente.']
    const responderam = comConversa.filter((s) => conversas[s.id].mensagens.some((m) => m.de === 'cliente')).length
    const vendas = comConversa.filter((s) => ['vendido', 'publicado'].includes(st(s))).length
    const naoAgora = comConversa.filter((s) => st(s) === 'recusou').length
    if (agente === 'tigre') {
      out.push(`Tenho ${comConversa.length} cliente(s) na memória; ${naoAgora} disseram "agora não" (sites guardados).`)
      const parados = comConversa.filter((s) => st(s) === 'contatado' && Date.now() - new Date(conversas[s.id].mensagens.at(-1)?.at || 0) > 3 * 864e5).length
      if (parados) out.push(`${parados} estão sem resposta há mais de 3 dias.`)
    } else {
      out.push(`Conversei com ${comConversa.length}; ${responderam} responderam (${pct(responderam, comConversa.length)}%) e ${vendas} fecharam.`)
      const bots = comConversa.filter((s) => conversas[s.id].mensagens.some((m) => m.intencao === 'bot')).length
      if (bots) out.push(`${bots} tinham robô no WhatsApp — sempre peço para falar com uma pessoa.`)
    }
  }
  if (agente === 'escorpiao') {
    const modelos = Object.values(estado.escorpiao || {})
    const feitos = sites.filter((s) => s.escorpiao)
    if (!modelos.length && !feitos.length) return ['Ainda não tenho especialidade. Me dá um nicho e 3 sites de referência de interatividade.']
    if (modelos.length) out.push(`Sei ${modelos.length} especialidade(s): ${modelos.map((m) => m.especialidade).join(', ')}.`)
    if (feitos.length) out.push(`Finalizei ${feitos.length} site(s) aprovado(s).`)
  }
  if (agente === 'aguia') {
    out.push(`Comércios: ${reais.length} · sites: ${sites.length} · conversas: ${comConversa.length} · vendas: ${comConversa.filter((s) => ['vendido', 'publicado'].includes(st(s))).length}.`)
  }
  return out
}
