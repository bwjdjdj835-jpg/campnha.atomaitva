// 🧪 Tigre sem IA: entende as respostas típicas de WhatsApp. Rodar: npm test
import { classificarPorPalavras as c } from '../src/lib/tigreTextos.js'
const casos = [
  ['sim', 'interesse'], ['Sim pode mandar', 'interesse'], ['quero ver sim', 'interesse'], ['manda aí', 'interesse'], ['pode ser', 'interesse'],
  ['Quanto fica?', 'interesse'], ['qual o valor', 'interesse'], ['opa, manda', 'interesse'], ['claro', 'interesse'], ['tenho interesse sim', 'interesse'],
  ['não quero', 'recusa'], ['Não obrigado', 'recusa'], ['nao tenho interesse', 'recusa'], ['já tenho site', 'recusa'], ['agora não', 'recusa'],
  ['não, valeu', 'recusa'], ['nao precisa', 'recusa'], ['sem interesse obrigado', 'recusa'], ['Não, obrigada', 'recusa'], ['dispenso', 'recusa'],
  ['para de me mandar mensagem', 'nao_contatar'], ['não me mande mais nada', 'nao_contatar'], ['me tira da lista', 'nao_contatar'], ['vou bloquear', 'nao_contatar'],
  ['Olá! Seja bem-vindo à Barbearia X. Digite 1 para agendar', 'bot'], ['Obrigado pelo contato! Em breve retornaremos.', 'bot'],
  ['quem é?', 'duvida'], ['como funciona?', 'duvida'], ['não sei, quanto custa?', 'interesse'], ['não entendi', 'duvida'],
  ['nao quero sim', 'recusa'], ['sim mas agora nao', 'recusa'], ['valeu mas nao', 'recusa'], ['vou pensar', 'outro'], ['👍', 'outro'], ['claro que não', 'recusa'], ['acho que não', 'recusa'], ['não aceito', 'recusa'],
]
let ok = 0
for (const [t, esp] of casos) { const r = c(t).intencao; if (r === esp) ok++; else console.log('ERRO:', JSON.stringify(t), '→', r, '(esperado', esp + ')') }
console.log(ok + '/' + casos.length)
if (ok !== casos.length) process.exitCode = 1
