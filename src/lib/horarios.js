// 🕘 Horário de funcionamento vindo do Google Maps (Apify / SerpApi) → formato único:
//   dias: { 0: [["08:00","12:00"]], 1: [["09:00","19:00"]], ... }  (0 = domingo; [] = fechado; dia ausente = sem informação)
// Usado no servidor (Pinguim), no Leão (dados.negocio.horarios) e no JSON-LD do ZIP. O "Aberto agora" é calculado no
// site do cliente, na hora em que a pessoa abre (src/lib/clienteEfeitos.js, [data-aberto]).

const DIAS = [
  [0, /^(dom|sun)/],
  [1, /^(seg|mon)/],
  [2, /^(ter|tue)/],
  [3, /^(qua|wed)/],
  [4, /^(qui|thu)/],
  [5, /^(sex|fri)/],
  [6, /^(s[aá]b|sat)/],
]
const CURTO = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const SCHEMA = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const diaDe = (t) => {
  const s = String(t || '').trim().toLowerCase().normalize('NFC')
  return DIAS.find(([, re]) => re.test(s))?.[0] ?? null
}

// "9 AM", "09:00", "9h30", "18h", "12 PM" → minutos; `ampm` herdado quando o 1º horário não tem ("9–11 AM").
function minutos(h, m, ampm) {
  let hora = Number(h)
  if (ampm === 'pm' && hora < 12) hora += 12
  if (ampm === 'am' && hora === 12) hora = 0
  return hora * 60 + Number(m || 0)
}
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

// "09:00–12:00, 13:30–18:00" | "9 AM to 7 PM" | "Fechado" | "Atendimento 24 horas" → [["09:00","12:00"], ...]
export function lerFaixas(texto) {
  const t = String(texto || '').toLowerCase().replace(/ | /g, ' ').replace(/a\.\s?m\./g, 'am').replace(/p\.\s?m\./g, 'pm')
  if (/fechad|closed/.test(t)) return []
  if (/24\s*h|24 horas|24 hours|aberto 24|open 24/.test(t)) return [['00:00', '24:00']]
  const faixas = []
  const HORA = String.raw`(\d{1,2})(?:[:h.](\d{2})|h)?\s*(am|pm)?`
  const re = new RegExp(`${HORA}\\s*(?:–|-|—|to|a|às|as|até)\\s*${HORA}`, 'g')
  for (const m of t.matchAll(re)) {
    const fimAmpm = m[6]
    const inicio = minutos(m[1], m[2], m[3] || (fimAmpm && Number(m[1]) <= Number(m[4]) ? fimAmpm : undefined))
    let fim = minutos(m[4], m[5], fimAmpm)
    if (fim === 0) fim = 24 * 60 // "até 00:00" = meia-noite
    if (inicio >= 24 * 60 || fim > 24 * 60) continue
    faixas.push([hhmm(inicio), hhmm(fim)])
  }
  return faixas
}

// Entrada: Apify [{ day, hours }] | SerpApi { segunda-feira: "…" } | ["segunda-feira: 9:00–18:00", …]
export function lerHorarios(entrada) {
  if (!entrada) return null
  let pares = []
  if (Array.isArray(entrada)) {
    pares = entrada.map((x) => (typeof x === 'string' ? x.split(/:\s(.+)/).slice(0, 2) : [x?.day, x?.hours]))
  } else if (typeof entrada === 'object') {
    pares = Object.entries(entrada)
  }
  const dias = {}
  for (const [dia, horas] of pares) {
    const d = diaDe(dia)
    if (d === null || horas == null) continue
    const faixas = lerFaixas(Array.isArray(horas) ? horas.join(', ') : horas)
    // Texto que não deu para entender (ex.: "Pode variar"): sem informação para o dia, nunca chuta.
    if (faixas.length || /fechad|closed/i.test(String(horas))) dias[d] = faixas
  }
  return Object.keys(dias).length ? dias : null
}

// "Seg a Sex 09:00–19:00 · Sáb 08:00–13:00 · Dom fechado" (junta dias seguidos com o mesmo horário).
export function textoDosHorarios(dias) {
  if (!dias) return ''
  const ordem = [1, 2, 3, 4, 5, 6, 0].filter((d) => dias[d])
  const desc = (d) => (dias[d].length ? dias[d].map(([a, f]) => (a === '00:00' && f === '24:00' ? '24 horas' : `${a}–${f}`)).join(', ') : 'fechado')
  const grupos = []
  for (const d of ordem) {
    const ultimo = grupos.at(-1)
    if (ultimo && ultimo.desc === desc(d) && [1, 2, 3, 4, 5, 6, 0].indexOf(d) === [1, 2, 3, 4, 5, 6, 0].indexOf(ultimo.fim) + 1) ultimo.fim = d
    else grupos.push({ ini: d, fim: d, desc: desc(d) })
  }
  return grupos
    .map((g) => `${CURTO[g.ini]}${g.fim !== g.ini ? ` a ${CURTO[g.fim]}` : ''} ${g.desc}`)
    .join(' · ')
}

// JSON-LD (schema.org): openingHoursSpecification só com faixas reais.
export function horariosSchema(dias) {
  if (!dias) return undefined
  const spec = []
  for (const [d, faixas] of Object.entries(dias)) {
    for (const [abre, fecha] of faixas) spec.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: SCHEMA[d], opens: abre, closes: fecha === '24:00' ? '23:59' : fecha })
  }
  return spec.length ? spec : undefined
}

// Fuso pelo estado do endereço (", Cacoal - RO, 76960-000") — o "Aberto agora" usa o horário da cidade do comércio.
const FUSOS = {
  RO: 'America/Porto_Velho', AC: 'America/Rio_Branco', AM: 'America/Manaus', RR: 'America/Boa_Vista',
  MT: 'America/Cuiaba', MS: 'America/Campo_Grande', PA: 'America/Belem', AP: 'America/Belem', TO: 'America/Araguaina',
}
export function fusoDoEndereco(endereco) {
  const uf = String(endereco || '').match(/(?:-|,)\s*([A-Z]{2})\b(?=\s*(?:,|$|\d))/g)?.at(-1)?.replace(/[-,\s]/g, '')
  return FUSOS[uf] || 'America/Sao_Paulo'
}
