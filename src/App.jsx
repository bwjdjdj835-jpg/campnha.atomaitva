import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'

// Cada página baixa só quando é aberta (no 4G a Central abria devagar com tudo num arquivo só).
const AgentPage = lazy(() => import('./pages/AgentPage.jsx'))
const Projeto = lazy(() => import('./pages/Projeto.jsx'))
const Automatico = lazy(() => import('./pages/Automatico.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))
const Aguia = lazy(() => import('./pages/Aguia.jsx'))
const Nuvem = lazy(() => import('./pages/Nuvem.jsx'))

const carregando = <div className="glass p-6 text-sm text-slate-400">Carregando…</div>
const pagina = (P) => (
  <Suspense fallback={carregando}>
    <P />
  </Suspense>
)

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="agente/:id" element={pagina(AgentPage)} />
        <Route path="projeto" element={pagina(Projeto)} />
        <Route path="automatico" element={pagina(Automatico)} />
        <Route path="admin" element={pagina(Admin)} />
        <Route path="aguia" element={pagina(Aguia)} />
        <Route path="nuvem" element={pagina(Nuvem)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
