import { useEffect, useState } from 'react'
import { FolderOpen, FolderDown, Loader2 } from 'lucide-react'
import { temPastaNoNavegador, escolherPasta, nomeDaPasta, pastaEscolhida } from '../lib/pastaClientes.js'
import { salvarPacoteDoSite } from '../services/pacoteCliente.js'

const quando = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

// 📁 Barra da Aranha: a pasta do notebook onde cada cliente vira <nicho>/<comércio>/ com vídeo + mensagem + atalho do WhatsApp.
export function BarraPastaClientes({ prontos }) {
  const [nome, setNome] = useState(null)
  const [liberada, setLiberada] = useState(false)
  const [salvando, setSalvando] = useState(null)
  const [msg, setMsg] = useState('')
  const suporta = temPastaNoNavegador()
  const atualizar = async () => {
    setNome(await nomeDaPasta())
    setLiberada(Boolean(await pastaEscolhida()))
  }
  useEffect(() => {
    if (suporta) atualizar()
  }, [suporta])

  const escolher = async () => {
    try {
      await escolherPasta()
      await atualizar()
      setMsg('Pronto! O automático já salva cada cliente aqui.')
    } catch {
      /* cancelou */
    }
  }
  const liberar = async () => {
    await pastaEscolhida({ pedir: true })
    await atualizar()
  }
  const salvarTodos = async () => {
    setMsg('')
    let n = 0
    for (const [i, site] of prontos.entries()) {
      setSalvando(`${i + 1}/${prontos.length}`)
      try {
        if (await salvarPacoteDoSite(site.id, { pedir: true })) n++
      } catch (e) {
        setMsg(`❌ ${site.nome}: ${e.message}`)
      }
    }
    setSalvando(null)
    await atualizar()
    setMsg(`✅ ${n} cliente(s) salvo(s) na pasta${nome ? ` "${nome}"` : ''}.`)
  }

  return (
    <div className="glass flex flex-wrap items-center gap-3 px-5 py-4">
      <FolderOpen size={18} className="text-neon" />
      <div className="min-w-[14rem] flex-1">
        <div className="font-semibold text-white">📁 Pasta dos clientes no notebook</div>
        <p className="text-xs text-slate-400">
          {suporta
            ? nome
              ? `Salvando em "${nome}" → nicho → comércio: 1 - Mensagem, 2 - Video da previa, 3 - Abrir conversa no WhatsApp.${liberada ? '' : ' (o navegador pede para liberar de novo)'}`
              : 'Escolha uma pasta uma vez (ex.: Documentos → Clientes). Cada cliente vira uma pasta com o vídeo, a mensagem e um atalho que abre a conversa dele.'
            : 'Neste navegador os arquivos vão para Downloads. No notebook, use o Chrome ou o Edge para salvar direto numa pasta.'}
        </p>
        {msg && <p className="mt-1 text-xs text-slate-300">{msg}</p>}
      </div>
      {suporta && (
        <button className="btn-ghost border border-white/10 text-sm" onClick={nome && !liberada ? liberar : escolher}>
          {nome ? (liberada ? 'Trocar pasta' : 'Liberar a pasta') : 'Escolher pasta'}
        </button>
      )}
      {prontos.length > 0 && (
        <button className="btn-primary !py-2 !px-4 text-sm" onClick={salvarTodos} disabled={Boolean(salvando)}>
          {salvando ? <Loader2 size={16} className="animate-spin" /> : <FolderDown size={16} />} {salvando ? `Salvando ${salvando}…` : `Salvar todos (${prontos.length})`}
        </button>
      )}
    </div>
  )
}

// 💾 Botão de cada cliente: grava vídeo + mensagem (a da caixa, já editada) + atalho do WhatsApp.
export function SalvarNaPasta({ site, texto }) {
  const [estado, setEstado] = useState(null)
  const salvar = async () => {
    setEstado('salvando')
    try {
      const r = await salvarPacoteDoSite(site.id, { texto, pedir: true })
      setEstado(r ? null : 'erro:não deu para salvar')
    } catch (e) {
      setEstado(e.name === 'AbortError' ? null : `erro:${e.message}`)
    }
  }
  const salvo = site.pastaLocal
  return (
    <div className="space-y-1">
      <button className="btn-ghost w-full justify-center border border-neon/30 text-sm sm:w-auto" onClick={salvar} disabled={estado === 'salvando' || !texto.trim()}>
        {estado === 'salvando' ? <Loader2 size={16} className="animate-spin" /> : '💾'} Salvar vídeo + mensagem na pasta
      </button>
      {salvo && (
        <p className="text-xs text-emerald-300">
          ✅ Salvo em <span className="font-mono">{salvo.caminho}</span> ({quando(salvo.at)}){salvo.video ? '' : ' — sem vídeo ainda'}. Na pasta: dois cliques em
          “3 - Abrir conversa no WhatsApp”, arraste o “2 - Video da previa” para a conversa e envie.
        </p>
      )}
      {estado?.startsWith('erro:') && <p className="text-xs text-rose-300">{estado.slice(5)}</p>}
    </div>
  )
}
