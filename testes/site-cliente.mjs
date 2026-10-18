// 🧪 Site do cliente: "Aberto agora" no fuso da cidade e botão/mensagem do WhatsApp por ramo. Rodar: npm test
import { transform } from 'esbuild'
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const fonte = readFileSync(new URL('../src/lib/ClienteSite.jsx', import.meta.url), 'utf8')
const { code } = await transform(fonte, { loader: 'jsx', format: 'esm', jsx: 'automatic' })
const arquivo = join(mkdtempSync(join(tmpdir(), 'site-')), 'ClienteSite.mjs')
writeFileSync(arquivo, code.replace(/from "react\/jsx-runtime"/, `from "${new URL('../node_modules/react/jsx-runtime.js', import.meta.url).href}"`))
const { abertoAgora, acaoDoNicho } = await import(arquivo)

let falhas = 0
const ver = (nome, real, esperado) => {
  const ok = JSON.stringify(real) === JSON.stringify(esperado)
  if (!ok) falhas++
  console.log(ok ? 'OK  ' : 'FALHA', nome, ok ? '' : `→ ${JSON.stringify(real)} (esperado ${JSON.stringify(esperado)})`)
}
const seg = [['09:00', '12:00'], ['13:30', '19:00']]
const dias = { 0: [], 1: seg, 2: seg, 3: seg, 4: seg, 5: seg, 6: [['08:00', '13:00']] }
const RO = 'America/Porto_Velho' // UTC-4
const em = (iso) => new Date(iso) // horários em UTC; em RO são 4 h a menos
ver('segunda 10h (RO)', abertoAgora(dias, RO, em('2026-10-19T14:00:00Z')), { aberto: true, texto: 'Aberto agora · fecha às 12h' })
ver('segunda 12h30, almoço', abertoAgora(dias, RO, em('2026-10-19T16:30:00Z')), { aberto: false, texto: 'Fechado agora · abre às 13h30' })
ver('segunda 18h59', abertoAgora(dias, RO, em('2026-10-19T22:59:00Z')), { aberto: true, texto: 'Aberto agora · fecha às 19h' })
ver('segunda 19h', abertoAgora(dias, RO, em('2026-10-19T23:00:00Z')), { aberto: false, texto: 'Fechado agora · abre amanhã às 9h' })
ver('sábado 14h → abre segunda', abertoAgora(dias, RO, em('2026-10-24T18:00:00Z')), { aberto: false, texto: 'Fechado agora · abre segunda às 9h' })
ver('domingo (fechado)', abertoAgora(dias, RO, em('2026-10-25T15:00:00Z')), { aberto: false, texto: 'Fechado agora · abre amanhã às 9h' })
ver('fuso: 10h em SP é 9h em RO', abertoAgora({ 1: [['09:30', '18:00']] }, RO, em('2026-10-19T13:00:00Z')), { aberto: false, texto: 'Fechado agora · abre às 9h30' })
ver('pizzaria até 2h da manhã (madrugada de sábado)', abertoAgora({ 5: [['18:00', '02:00']], 6: [['18:00', '02:00']] }, RO, em('2026-10-24T05:00:00Z')), { aberto: true, texto: 'Aberto agora · fecha às 2h' })
ver('fecha à meia-noite', abertoAgora({ 1: [['18:00', '24:00']] }, RO, em('2026-10-19T23:00:00Z')), { aberto: true, texto: 'Aberto agora · fecha à meia-noite' })
ver('domingo fechado, segunda 24h', abertoAgora({ 0: [], 1: [['00:00', '24:00']] }, RO, em('2026-10-18T18:00:00Z')), { aberto: false, texto: 'Fechado agora · abre amanhã (24 horas)' })
ver('24 horas', abertoAgora({ 1: [['00:00', '24:00']] }, RO, em('2026-10-19T07:00:00Z')), { aberto: true, texto: 'Aberto 24 horas' })
ver('sem horário do dia → não mostra', abertoAgora({ 2: seg }, RO, em('2026-10-19T14:00:00Z')), null)
ver('sem horário → não mostra', abertoAgora(null, RO), null)
ver('barbearia agenda', acaoDoNicho('Barbearia').botao, 'Agendar')
ver('pizzaria pede', acaoDoNicho('Pizzaria').botao, 'Fazer pedido')
ver('espetinho pede (não é pet)', acaoDoNicho('Espetinho').botao, 'Fazer pedido')
ver('oficina orçamento', acaoDoNicho('Oficina mecânica').botao, 'Orçamento')
ver('pet shop agenda', acaoDoNicho('Pet shop').botao, 'Agendar')
ver('loja de roupas conversa', acaoDoNicho('Loja de roupas').botao, 'WhatsApp')
ver('mensagem do serviço', acaoDoNicho('Salão de beleza').sobre('Escova'), 'Olá! Vi no site e quero agendar: Escova.')
// O selo do site feito pela imagem (efeitos.js) dá o mesmo resultado que o do ClienteSite, a semana inteira, de 15 em 15 min.
const { statusAberto } = await import('../src/lib/clienteEfeitos.js')
const casos = [dias, { 5: [['18:00', '02:00']], 6: [['18:00', '02:00']], 0: [] }, { 1: [['00:00', '24:00']], 0: [] }]
let diferentes = 0
for (const d of casos) for (let t = Date.parse('2026-10-18T00:00:00Z'); t < Date.parse('2026-10-25T00:00:00Z'); t += 15 * 60000) {
  if (JSON.stringify(statusAberto(d, RO, new Date(t))) !== JSON.stringify(abertoAgora(d, RO, new Date(t)))) diferentes++
}
ver('efeitos.js e ClienteSite iguais em 2.016 horários', diferentes, 0)
if (falhas) process.exitCode = 1
