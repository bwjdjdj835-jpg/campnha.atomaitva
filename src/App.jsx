import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AgentPage from './pages/AgentPage.jsx'
import Projeto from './pages/Projeto.jsx'
import Automatico from './pages/Automatico.jsx'
import Admin from './pages/Admin.jsx'
import Aguia from './pages/Aguia.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="agente/:id" element={<AgentPage />} />
        <Route path="projeto" element={<Projeto />} />
        <Route path="automatico" element={<Automatico />} />
        <Route path="admin" element={<Admin />} />
        <Route path="aguia" element={<Aguia />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
