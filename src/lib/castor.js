// 🦫 Castor: antes do Gato finalizar, propõe 3 modelos de site bem diferentes entre si (tema + capa + galeria),
// com base no estudo do Gato (estilo do ramo / seu site modelo), no ramo do comércio e no que você já escolheu antes.
// Você escolhe um e o Gato refina em cima dele.

import { temaSugerido } from './ClienteSite.jsx'
import { estiloPreferido } from './mentes.js'

const TODOS = ['noite', 'claro', 'studio', 'vibrante']

// → [{ id, titulo, porque, tema, hero, galeria }] (3 propostas, a 1ª é a recomendada)
export function propostasDoCastor(dados, modelo, estado) {
  const doRamo = temaSugerido(dados?.negocio?.categoria || dados?.categoria)
  const pref = estiloPreferido(estado)
  const lista = []
  const usado = new Set()
  const add = (p) => {
    if (usado.has(p.tema) || lista.length >= 3) return
    usado.add(p.tema)
    lista.push({ id: `${p.tema}-${p.hero}-${p.galeria}`, ...p })
  }
  if (modelo) add({ titulo: 'Do estudo', porque: `Cores e fonte de ${modelo.fonte || 'um site real do ramo'} que o Gato estudou.`, tema: 'modelo', hero: 'agua', galeria: 'uniforme' })
  if (pref) add({ titulo: 'Seu preferido', porque: `Você escolheu este estilo ${pref.vezes} de ${pref.total} vezes.`, tema: pref.tema, hero: pref.hero, galeria: pref.galeria })
  add({ titulo: 'Clássico do ramo', porque: 'O visual mais comum para este tipo de comércio.', tema: doRamo, hero: 'agua', galeria: 'uniforme' })
  // Completa com estilos bem diferentes (contraste claro × escuro, capa e galeria trocadas).
  const extras = [
    { titulo: 'Editorial', porque: 'Claro e limpo, com fotos em mosaico — passa organização.', tema: 'claro', hero: 'parallax', galeria: 'bento' },
    { titulo: 'Premium escuro', porque: 'Escuro com dourado — passa sofisticação.', tema: 'noite', hero: 'parallax', galeria: 'bento' },
    { titulo: 'Moderno', porque: 'Visual de estúdio com animações — passa modernidade.', tema: 'studio', hero: 'agua', galeria: 'bento' },
    { titulo: 'Alegre', porque: 'Cores vivas — chama atenção no celular.', tema: 'vibrante', hero: 'parallax', galeria: 'uniforme' },
  ]
  for (const e of extras) add(e)
  for (const t of TODOS) add({ titulo: t, porque: '', tema: t, hero: 'agua', galeria: 'uniforme' })
  return lista
}
