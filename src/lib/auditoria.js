// 🐝 Abelha Central — checklist do site a partir do dados.json e dos arquivos do pacote.
// Cada item: { id, area, titulo, status: 'ok' | 'aviso' | 'falta', detalhe }.

export function auditar(dados, arquivos = []) {
  const n = dados.negocio || {}
  const c = dados.conteudo || {}
  const fotos = (dados.imagens || []).length
  const temArquivo = (fim) => arquivos.some((a) => a.endsWith(fim))
  const item = (id, area, titulo, ok, detalheOk, detalheFalta, aviso = false) => ({
    id,
    area,
    titulo,
    status: ok ? 'ok' : aviso ? 'aviso' : 'falta',
    detalhe: ok ? detalheOk : detalheFalta,
  })

  // Texto sugerido pelo Gato (típico do segmento): vale meio ponto até a Abelha trocar pelo dado real.
  const TITULO = { sobre: 'Texto "Sobre"', servicos: 'Serviços' }
  const sugerido = (campo) =>
    (c.sugerido || []).includes(campo) && {
      id: campo,
      area: 'Conteúdo',
      titulo: TITULO[campo],
      status: 'aviso',
      detalhe: 'Sugestão do Gato Negro (típico do segmento) — confirme com o cliente ou troque pelo dado real',
    }

  const itens = [
    item('nome', 'Contato', 'Nome do negócio', Boolean(n.nome), n.nome, 'Sem nome'),
    item('telefone', 'Contato', 'Telefone', n.telefone && n.telefone !== '—', n.telefone, 'Sem telefone — o cliente não tem como ligar'),
    item('whatsapp', 'Contato', 'Botão de WhatsApp', Boolean(n.whatsapp), 'Botão fixo ativo', 'Sem WhatsApp — o site perde o principal botão de contato'),
    item('endereco', 'Contato', 'Endereço e mapa', Boolean(n.endereco), n.endereco, 'Sem endereço — o mapa não aparece'),
    item('instagram', 'Contato', 'Instagram', Boolean(n.instagram), n.instagram, 'Não encontrado', true),
    item('fotos', 'Conteúdo', 'Fotos', fotos >= 3, `${fotos} foto(s)`, fotos ? `Só ${fotos} foto(s) — galeria fraca` : 'Sem fotos — capa em cor sólida', fotos > 0),
    sugerido('sobre') ||
      item('sobre', 'Conteúdo', 'Texto "Sobre"', Boolean(c.sobre), 'Preenchido', 'Sem descrição do negócio'),
    sugerido('servicos') ||
      item('servicos', 'Conteúdo', 'Serviços', (c.servicos || []).length > 0, `${(c.servicos || []).length} serviço(s)`, 'Nenhum serviço listado'),
    item('horarios', 'Conteúdo', 'Horário de funcionamento', Boolean(c.horarios), c.horarios, 'Sem horário'),
    item('avaliacao', 'Confiança', 'Nota no Google', n.rating != null, `★ ${n.rating} (${n.avaliacoes || 0} avaliações)`, 'Sem nota pública', true),
    item('seo', 'Técnico', 'SEO (título, descrição, dados estruturados)', temArquivo('index.html'), 'index.html presente — a Abelha regrava com JSON-LD', 'index.html não encontrado'),
    item('estrutura', 'Técnico', 'Estrutura do projeto', temArquivo('package.json') && temArquivo('src/Site.jsx'), 'React + Vite + Tailwind completo', 'Faltam arquivos do projeto (package.json ou src/Site.jsx)'),
    item('demo', 'Técnico', 'Dados reais', !dados.demo, 'Sem dados de demonstração', 'Pacote DEMO — não publicar'),
  ]
  const pontos = itens.reduce((t, i) => t + (i.status === 'ok' ? 1 : i.status === 'aviso' ? 0.5 : 0), 0)
  return { itens, nota: Math.round((pontos / itens.length) * 100) }
}
