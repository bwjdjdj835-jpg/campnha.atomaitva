// Site montado pelo Gato a partir da imagem escolhida no Castor (dados.htmlProprio): as fotos estão como {{FOTO_n}}
// e viram o arquivo da foto (no ZIP) ou a foto embutida (na prévia).
import animacoesCss from './clienteAnimacoes.css?raw'
import efeitosSource from './clienteEfeitos.js?raw'
import { linkDeAgenda } from './ClienteSite.jsx'

const efeitosScript = efeitosSource.replace(/^export /gm, '').replace(/<\/script/gi, '<\\/script')
const esc = (t) => String(t || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

// Bloco de agendamento da biblioteca do Gato (a IA só marca o lugar com <!--AGENDA-->).
function agendaHtml(dados) {
  const ag = linkDeAgenda(dados.agendamento)
  if (!ag) return ''
  const nome = esc(dados.negocio?.nome)
  return ag.embutir
    ? `<section id="agendar" class="agenda" data-revelar><h2>Escolha seu horário</h2><div data-esqueleto class="agenda-quadro"><iframe src="${esc(ag.embutir)}" title="Agenda de ${nome}" loading="lazy"></iframe></div></section>`
    : `<section id="agendar" class="agenda" data-revelar><h2>Escolha seu horário</h2><a class="agenda-botao micro" href="${esc(ag.url)}">📅 Agendar online</a></section>`
}

const CSS_BIBLIOTECA = `.agenda{max-width:72rem;margin:0 auto;padding:64px 24px}.agenda h2{margin:0 0 24px}
.agenda-quadro{border-radius:16px;overflow:hidden}.agenda-quadro iframe{display:block;width:100%;height:680px;border:0;background:#fff}
.agenda-botao{display:inline-block;padding:14px 28px;border-radius:999px;background:#111;color:#fff;font-weight:600;text-decoration:none}`

// Monta a página final: fotos, agenda, CSS e script da biblioteca do Gato (Antes e Depois, esqueletos, revelar ao rolar).
export function montarSiteProprio(dados, caminho, { cabeca = '', fim = '' } = {}) {
  let html = trocarFotos(dados.htmlProprio, dados.imagens, caminho)
  const agenda = agendaHtml(dados)
  html = html.includes('<!--AGENDA-->') ? html.replace('<!--AGENDA-->', agenda) : html.replace(/<\/body>/i, agenda + '</body>')
  const topo = `<style>${animacoesCss}${CSS_BIBLIOTECA}</style>${cabeca}`
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (h) => h + topo) : topo + html
  const rodape = `<script>${efeitosScript}\niniciarEfeitos(document)</script>${fim}`
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, rodape + '</body>') : html + rodape
}
export function trocarFotos(html, imagens = [], caminho) {
  return String(html).replace(/\{\{FOTO_(\d+)\}\}/g, (_, n) => {
    const img = imagens[Number(n) - 1] || imagens[0]
    return img ? caminho(img.arquivo) : ''
  })
}

// Pede ao servidor o site igual à imagem (Gemini → Groq com visão), com os dados e as fotos reais.
export async function gerarSiteDaImagem(imagem, dados, conteudo) {
  const n = dados.negocio || {}
  const res = await fetch('/api/gato/site-da-imagem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imagem,
      negocio: { nome: n.nome, categoria: n.categoria, endereco: n.endereco, telefone: n.telefone, whatsapp: n.whatsapp, maps: n.maps, rating: n.rating, avaliacoes: n.avaliacoes },
      conteudo: { ...conteudo, sugerido: undefined },
      fotos: (dados.imagens || []).length,
      // Biblioteca do Gato: pares de Antes e Depois (números das fotos) e se há agenda online.
      antesDepois: (dados.antesDepois || [])
        .map((p) => ({ antes: idx(dados, p.antes), depois: idx(dados, p.depois), legenda: p.legenda }))
        .filter((p) => p.antes && p.depois),
      agendamento: Boolean(dados.agendamento),
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'O Gato não conseguiu montar o site pela imagem.')
  return json // { html, ia }
}

const idx = (dados, arquivo) => (dados.imagens || []).findIndex((i) => i.arquivo === arquivo) + 1
