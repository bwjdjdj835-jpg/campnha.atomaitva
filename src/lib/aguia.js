// 🦅 Águia: monta o relatório do processo inteiro a partir dos dados reais do app (nunca inventa).
import { lerPipeline } from '../store/pipeline.js'
import { pensamentos, PERSONALIDADES } from './mentes.js'

const st = (estado, s) => estado.conversas?.[s.id]?.status

export function numerosDaAguia(estado = lerPipeline()) {
  const { leads = [], sites = [], conversas = {}, comSite = [], auto = {} } = estado
  const reais = leads.filter((l) => !l.demo)
  const enviados = sites.filter((s) => conversas[s.id]?.mensagens?.some((m) => m.de === 'nos'))
  const conta = (...lista) => enviados.filter((s) => lista.includes(st(estado, s))).length
  return {
    achados: reais.length + comSite.length,
    semSite: reais.length,
    sites: sites.filter((s) => s.status !== 'descartado').length,
    paraAprovar: sites.filter((s) => s.status === 'revisar').length,
    enviados: enviados.length,
    responderam: enviados.filter((s) => conversas[s.id].mensagens.some((m) => m.de === 'cliente')).length,
    interessados: conta('interessado', 'duvida'),
    naoAgora: conta('recusou'),
    vendas: conta('vendido', 'publicado'),
    esperandoVoce: enviados.filter((s) => conversas[s.id].mensagens.at(-1)?.de === 'cliente' && st(estado, s) !== 'nao_contatar').length,
    nichosFeitos: auto.feitos?.length || 0,
    ultimaRodada: auto.relatorio || null,
  }
}

export function relatorioDaAguia(estado = lerPipeline()) {
  const n = numerosDaAguia(estado)
  const data = new Date().toLocaleString('pt-BR', { timeZone: 'America/Porto_Velho' })
  const linhas = [
    `🦅 Relatório da Águia — ${data}`,
    '',
    'NÚMEROS',
    `• Comércios vistos: ${n.achados} (${n.semSite} sem site)`,
    `• Sites montados: ${n.sites} · esperando sua aprovação: ${n.paraAprovar}`,
    `• Mensagens enviadas: ${n.enviados} · responderam: ${n.responderam}`,
    `• Interessados: ${n.interessados} · "agora não": ${n.naoAgora} · vendas: ${n.vendas}`,
    `• Clientes esperando a sua resposta: ${n.esperandoVoce}`,
    `• Nichos concluídos: ${n.nichosFeitos}`,
  ]
  if (n.ultimaRodada) {
    const prontos = (n.ultimaRodada.itens || []).filter((i) => i.resultado === 'pronto').map((i) => i.nome)
    linhas.push('', `ÚLTIMA RODADA (${n.ultimaRodada.nicho || 'nicho'})`, prontos.length ? `• Prontos: ${prontos.join(', ')}` : '• Nenhum cliente novo pronto')
  }
  linhas.push('', 'O QUE CADA AGENTE PENSA')
  for (const id of ['pinguim', 'leao', 'castor', 'gato', 'abelha', 'tigre', 'aranha']) {
    const p = pensamentos(id, estado)
    linhas.push(`${PERSONALIDADES[id].emoji} ${PERSONALIDADES[id].nome}: ${p.join(' ')}`)
  }
  if (n.esperandoVoce) linhas.push('', `👉 Próximo passo: responder os ${n.esperandoVoce} cliente(s) na Aranha Administradora.`)
  else if (n.paraAprovar) linhas.push('', `👉 Próximo passo: aprovar os ${n.paraAprovar} site(s) na Aranha Administradora.`)
  linhas.push('', 'https://campnha-atomaitva.vercel.app/admin')
  return { assunto: `🦅 Central de Agentes: ${n.vendas} venda(s), ${n.esperandoVoce} esperando você, ${n.paraAprovar} para aprovar`, texto: linhas.join('\n') }
}

// Manda pelo servidor (Resend). Sem chave, devolve false (a página oferece abrir no seu e-mail).
export async function enviarRelatorioAguia(estado) {
  const r = relatorioDaAguia(estado)
  const res = await fetch('/api/aguia/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(r) }).catch(() => null)
  if (!res) throw new Error('Servidor fora do ar.')
  if (res.status === 503) return false
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Não consegui mandar o e-mail.')
  return true
}
