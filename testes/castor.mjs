// 🧪 Castor: cor de destaque certa para cada nicho (os específicos antes dos gerais). Rodar: npm test
import { transform } from 'esbuild'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
// castor.js importa o ClienteSite (JSX) e mentes.js: transforma os dois numa pasta temporária.
const pasta = mkdtempSync(join(tmpdir(), 'castor-'))
const jsx = readFileSync(new URL('../src/lib/ClienteSite.jsx', import.meta.url), 'utf8')
const react = new URL('../node_modules/react/jsx-runtime.js', import.meta.url).href
writeFileSync(join(pasta, 'ClienteSite.jsx.mjs'), (await transform(jsx, { loader: 'jsx', format: 'esm', jsx: 'automatic' })).code.replace(/from "react\/jsx-runtime"/, `from "${react}"`))
writeFileSync(join(pasta, 'mentes.mjs'), 'export const estiloPreferido = () => null\n')
const castor = readFileSync(new URL('../src/lib/castor.js', import.meta.url), 'utf8').replace("'./ClienteSite.jsx'", "'./ClienteSite.jsx.mjs'").replace("'./mentes.js'", "'./mentes.mjs'")
writeFileSync(join(pasta, 'castor.mjs'), castor.replace(/^import .*\.\/(?!ClienteSite|mentes).*$/gm, ''))
const { designDoCastor } = await import(join(pasta, 'castor.mjs'))
let falhas = 0
const ver = (categoria, destaque, esquema) => {
  const m = designDoCastor({ negocio: { categoria } })
  const ok = m.design.paleta_cores.destaque === destaque && m.estilo.esquema === esquema
  if (!ok) falhas++
  console.log(ok ? 'OK  ' : 'FALHA', categoria, ok ? '' : `→ ${m.design.paleta_cores.destaque} ${m.estilo.esquema}`)
}
ver('Barbearia', '#C9A227', 'escuro')
ver('Estética automotiva', '#22D3EE', 'escuro')
ver('Clínica de estética', '#B9767E', 'claro')
ver('Pizzaria', '#CE2A1E', 'claro')
ver('Açaí', '#7D5393', 'claro')
ver('Academia', '#C6F432', 'escuro')
ver('Borracharia', '#FFD000', 'escuro')
ver('Oficina mecânica', '#F26A1B', 'escuro')
ver('Lava jato', '#1F3B2D', 'claro')
ver('Pet shop', '#5F7F6B', 'claro')
ver('Ótica', '#DB4D11', 'claro')
ver('Hamburgueria', '#FFB000', 'escuro')
const cta = designDoCastor({ negocio: { categoria: 'Pizzaria' } }).design.estrutura_secoes[0].estilo
console.log(/Fazer pedido/.test(cta) ? 'OK  ' : 'FALHA', 'capa da pizzaria pede "Fazer pedido"')
if (!/Fazer pedido/.test(cta)) falhas++
if (falhas) process.exitCode = 1
