// Função serverless do Vercel: expõe a mesma app Hono de server/app.js.
// O vercel.json reescreve /api/* para cá. Configure as chaves em Settings → Environment Variables.
import { handle } from 'hono/vercel'
import { app } from '../server/app.js'

export const GET = handle(app)
export const POST = handle(app)
