// 🧪 Horário de funcionamento do Google Maps (Apify/SerpApi) → dias, texto, JSON-LD e fuso. Rodar: npm test
import { lerFaixas, lerHorarios, textoDosHorarios, horariosSchema, fusoDoEndereco } from '../src/lib/horarios.js'
let falhas = 0
const ver = (nome, real, esperado) => {
  const ok = JSON.stringify(real) === JSON.stringify(esperado)
  if (!ok) falhas++
  console.log(ok ? 'OK  ' : 'FALHA', nome, ok ? '' : `→ ${JSON.stringify(real)} (esperado ${JSON.stringify(esperado)})`)
}
ver('09:00–19:00', lerFaixas('09:00–19:00'), [['09:00', '19:00']])
ver('duas faixas', lerFaixas('08:00–12:00, 13:30–18:00'), [['08:00', '12:00'], ['13:30', '18:00']])
ver('9 AM to 7 PM', lerFaixas('9 AM to 7 PM'), [['09:00', '19:00']])
ver('9–11 AM', lerFaixas('9–11 AM'), [['09:00', '11:00']])
ver('11 AM–2 PM', lerFaixas('11 AM–2 PM'), [['11:00', '14:00']])
ver('10 AM–12 AM (meia-noite)', lerFaixas('10 AM–12 AM'), [['10:00', '24:00']])
ver('9h às 18h30', lerFaixas('9h às 18h30'), [['09:00', '18:30']])
ver('Fechado', lerFaixas('Fechado'), [])
ver('Atendimento 24 horas', lerFaixas('Atendimento 24 horas'), [['00:00', '24:00']])
ver('texto estranho não chuta', lerFaixas('Pode variar'), [])
const apify = [
  { day: 'segunda-feira', hours: '09:00–19:00' }, { day: 'terça-feira', hours: '09:00–19:00' }, { day: 'quarta-feira', hours: '09:00–19:00' },
  { day: 'quinta-feira', hours: '09:00–19:00' }, { day: 'sexta-feira', hours: '09:00–19:00' }, { day: 'sábado', hours: '08:00–13:00' }, { day: 'domingo', hours: 'Fechado' },
]
const dias = lerHorarios(apify)
ver('Apify pt-BR', dias, { 0: [], 1: [['09:00', '19:00']], 2: [['09:00', '19:00']], 3: [['09:00', '19:00']], 4: [['09:00', '19:00']], 5: [['09:00', '19:00']], 6: [['08:00', '13:00']] })
ver('texto agrupado', textoDosHorarios(dias), 'Seg a Sex 09:00–19:00 · Sáb 08:00–13:00 · Dom fechado')
ver('SerpApi em inglês', lerHorarios({ monday: '9 AM–6 PM', sunday: 'Closed' }), { 1: [['09:00', '18:00']], 0: [] })
ver('lista de textos', lerHorarios(['segunda-feira: 8:00 - 18:00']), { 1: [['08:00', '18:00']] })
ver('nada', lerHorarios(null), null)
ver('dia com texto estranho fica sem informação', lerHorarios([{ day: 'sábado', hours: 'Pode variar' }]), null)
ver('JSON-LD', horariosSchema({ 1: [['09:00', '19:00']], 0: [['00:00', '24:00']] }), [
  { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '00:00', closes: '23:59' },
  { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Monday', opens: '09:00', closes: '19:00' },
])
ver('fuso RO', fusoDoEndereco('R. Dom Pedro II, 1234 - Centro, Cacoal - RO, 76960-000'), 'America/Porto_Velho')
ver('fuso SP', fusoDoEndereco('Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100'), 'America/Sao_Paulo')
ver('fuso AM', fusoDoEndereco('Manaus - AM'), 'America/Manaus')
if (falhas) process.exitCode = 1
