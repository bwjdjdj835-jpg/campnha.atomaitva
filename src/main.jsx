import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { iniciarNuvem } from './store/nuvem.js'

// ☁️ Busca os dados da conta na nuvem (se estiver ligada) e passa a salvar lá a cada mudança.
iniciarNuvem()

// Build de demonstração (npm run build:demo) usa rotas com # para funcionar em hospedagem estática.
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
)
