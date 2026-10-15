import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutGrid, FolderCog, Menu, X, Bot, ShieldCheck } from 'lucide-react'
import { equipe } from '../data/equipe.js'
import { usePipeline } from '../store/pipeline.js'
import { estadoNuvem, ouvirNuvem } from '../store/nuvem.js'

function NavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
          isActive
            ? 'bg-neon/10 text-white shadow-[inset_2px_0_0_#22d3ee]'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      {children}
    </NavLink>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const close = () => setOpen(false)

  const paraAprovar = usePipeline().sites.filter((s) => s.status === 'revisar').length
  const [nuvem, setNuvem] = useState({ ...estadoNuvem })
  useEffect(() => ouvirNuvem(setNuvem), [])
  const sidebar = (
    <nav className="flex flex-col gap-1 p-4">
      <div className="flex items-center gap-3 px-2 pb-6 pt-2">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="w-9 h-9" />
        <div>
          <div className="font-display font-bold text-white leading-tight">Central de Agentes</div>
          <div className="text-[11px] text-neon">Um detalhe entra. Um fluxo sai.</div>
        </div>
      </div>
      <NavItem to="/" onClick={close}>
        <LayoutGrid size={18} /> Orquestra
      </NavItem>
      <NavItem to="/automatico" onClick={close}>
        <Bot size={18} /> Automático
      </NavItem>
      <NavItem to="/admin" onClick={close}>
        <span className="text-lg w-5 text-center">🕷️</span> <span className="flex-1">Aranha Administradora</span>
        {paraAprovar > 0 && <span className="rounded-full bg-neon/20 px-2 text-[11px] text-neon">{paraAprovar}</span>}
      </NavItem>
      <div className="px-3 pt-5 pb-2 text-[11px] uppercase tracking-widest text-slate-500">Agentes</div>
      {equipe.map((a) => (
        <NavItem key={a.id} to={a.link} onClick={close}>
          <span className="text-lg w-5 text-center">{a.emoji}</span>
          <span className="flex-1">{a.name}</span>
          {a.id === 'aranha' && paraAprovar > 0 ? (
            <span className="rounded-full bg-neon/20 px-2 text-[11px] text-neon">{paraAprovar}</span>
          ) : (
            <span className="text-[10px] font-mono text-slate-500">0{a.ordem}</span>
          )}
        </NavItem>
      ))}
      <div className="px-3 pt-5 pb-2 text-[11px] uppercase tracking-widest text-slate-500">Setup</div>
      <NavItem to="/projeto" onClick={close}>
        <FolderCog size={18} /> Projeto & ferramentas
      </NavItem>
      <NavItem to="/nuvem" onClick={close}>
        <span className="text-lg w-5 text-center">☁️</span>
        <span className="flex-1">Nuvem</span>
        <span className={`text-[10px] ${nuvem.ligada && !nuvem.erro ? 'text-emerald-300' : nuvem.erro ? 'text-rose-300' : 'text-slate-500'}`}>
          {nuvem.ligada === null ? '…' : !nuvem.ligada ? 'desligada' : nuvem.erro ? 'erro' : nuvem.enviando ? 'salvando…' : 'salvo ✓'}
        </span>
      </NavItem>
    </nav>
  )

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:block w-64 shrink-0 border-r border-white/5 bg-abyss-900/40 backdrop-blur-xl sticky top-0 h-screen">
        {sidebar}
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={close}>
          <aside
            className="w-72 h-full bg-abyss-900 border-r border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b border-white/5 bg-abyss-950/80 backdrop-blur-xl">
          <span className="font-display font-semibold text-white">Central de Agentes</span>
          <button className="btn-ghost" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>
        <main key={pathname} className="px-4 sm:px-8 py-8 max-w-6xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
