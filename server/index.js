// Servidor local da API. Lê as chaves de server/.env (veja .env.example).
import { existsSync } from 'node:fs'
import { serve } from '@hono/node-server'

const envFile = new URL('./.env', import.meta.url)
if (existsSync(envFile)) process.loadEnvFile(envFile)
else console.warn('server/.env não encontrado — APIs reais desligadas (copie .env.example).')

const { app } = await import('./app.js')
const port = Number(process.env.PORT) || 8787

serve({ fetch: app.fetch, port }, () => {
  console.log(`API da Central de Agentes em http://localhost:${port}/api`)
})
