// Projeto do site do cliente (React + Vite + Tailwind) montado a partir do dados.json.
// Retorna { caminho: conteúdo } para o JSZip. O componente visual é src/lib/ClienteSite.jsx,
// copiado como texto para src/Site.jsx — o mesmo usado na prévia do Gato Negro.

import { fonteDoSite } from './ClienteSite.jsx'
import siteSource from './ClienteSite.jsx?raw'
import animacoesCss from './clienteAnimacoes.css?raw'
import aguaSource from './clienteAgua.js?raw'
import efeitosSource from './clienteEfeitos.js?raw'

const json = (v) => JSON.stringify(v, null, 2) + '\n'

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
}

// Dados estruturados (schema.org) para o Google entender o negócio. Só usa o que existe em dados.json.
function jsonLd(dados) {
  const { negocio, conteudo = {} } = dados
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: negocio.nome,
    address: negocio.endereco || undefined,
    telephone: negocio.telefone && negocio.telefone !== '—' ? negocio.telefone : undefined,
    description: conteudo.sobre || undefined,
    openingHours: conteudo.horarios || undefined,
    sameAs: [negocio.instagram, negocio.maps].filter(Boolean),
    aggregateRating: negocio.rating
      ? { '@type': 'AggregateRating', ratingValue: negocio.rating, reviewCount: negocio.avaliacoes || 0 }
      : undefined,
  }
  return JSON.stringify(ld, null, 2).replace(/</g, '\\u003c')
}

// Mesmo link do Google Fonts da prévia (tema "Do modelo").
function fonteDoModelo(dados) {
  const fonte = fonteDoSite(dados)
  return `\n    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(fonte).replace(/%20/g, '+')}:wght@400;600;700;800&display=swap" />`
}

// Ícone da aba: a inicial do comércio num quadrado escuro (SVG embutido, sem arquivo e sem 404).
function iconeDaInicial(nome) {
  const letra = (String(nome || '').trim().match(/[\p{L}\p{N}]/u)?.[0] || '•').toUpperCase()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#111"/><text x="32" y="44" font-family="Arial,sans-serif" font-size="36" font-weight="700" text-anchor="middle" fill="#fff">${letra}</text></svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}

// Prévia do link no WhatsApp/Facebook (foto de capa; o vite.config completa o endereço na Vercel) + ícone da aba.
export function metasDeCompartilhar(dados) {
  const capa = /^\/fotos\/[\w.-]+$/.test(dados.imagens?.[0]?.arquivo || '') ? dados.imagens[0].arquivo : ''
  return `
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="pt_BR" />${capa ? `
    <meta property="og:image" content="${escapeHtml(capa)}" />
    <meta name="twitter:card" content="summary_large_image" />` : ''}
    <link rel="icon" href="${iconeDaInicial(dados.negocio?.nome)}" />`
}

export function siteFiles(dados) {
  const { negocio, conteudo = {} } = dados
  const descricao = conteudo.sobre || [negocio.categoria, negocio.endereco].filter(Boolean).join(' — ')
  return {
    'package.json': json({
      name: dados.slug || 'site',
      private: true,
      version: '1.0.0',
      type: 'module',
      scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
      dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
      devDependencies: {
        '@vitejs/plugin-react': '^4.3.3',
        autoprefixer: '^10.4.20',
        postcss: '^8.4.49',
        tailwindcss: '^3.4.15',
        vite: '^5.4.11',
      },
    }),
    // Na Vercel o endereço do site existe na hora do build: a imagem de compartilhamento (WhatsApp/Facebook) precisa de link completo.
    'vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const dominio = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
const linkCompleto = {
  name: 'link-completo',
  transformIndexHtml: (html) => (dominio ? html.replace(/content="\\/(fotos\\/[^"]+)"/g, \`content="https://\${dominio}/$1"\`) : html),
}

export default defineConfig({ plugins: [react(), linkCompleto] })
`,
    'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
`,
    'postcss.config.js': `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
`,
    'index.html': `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(negocio.nome)}</title>
    <meta name="description" content="${escapeHtml(descricao)}" />
    <meta property="og:title" content="${escapeHtml(negocio.nome)}" />
    <meta property="og:description" content="${escapeHtml(descricao)}" />
${metasDeCompartilhar(dados)}${fonteDoModelo(dados)}
    <script type="application/ld+json">
${jsonLd(dados)}
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
    'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import Site from './Site.jsx'
import dados from './dados.json'
import { iniciarAgua } from './agua.js'
import { iniciarEfeitos } from './efeitos.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(<Site dados={dados} />)
iniciarAgua(document)
if (dados.efeitos !== false) iniciarEfeitos(document)
`,
    'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

${animacoesCss}`,
    'src/Site.jsx': siteSource,
    'src/agua.js': aguaSource,
    'src/efeitos.js': efeitosSource,
    'src/dados.json': json(dados),
    'dados.json': json(dados),
    'README.md': `# ${negocio.nome}

Site gerado pela Central de Agentes (${dados.gerador}) em ${new Date(dados.geradoEm).toLocaleString('pt-BR')}.
${dados.demo ? '\n> ⚠️ DEMO — dados de demonstração, não publicar.\n' : ''}${dados.aprovadoEm ? `\nPrévia aprovada em ${new Date(dados.aprovadoEm).toLocaleString('pt-BR')} (tema: ${dados.tema}).\n` : ''}
## Rodar

\`\`\`bash
npm install
npm run dev
\`\`\`

## Estrutura

- \`src/dados.json\` — dados do negócio usados pelo site (edite aqui). \`tema\`: noite, claro ou vibrante.
- \`dados.json\` — mesma cópia, com o mapa de imagens (arquivo ↔ nome original ↔ link).
- \`public/fotos/\` — fotos do negócio.
- \`src/Site.jsx\` — página única: capa, fotos, contato, mapa e botão fixo de WhatsApp.
- \`src/agua.js\` — efeito de água na capa (a foto ondula seguindo o cursor).
- \`src/efeitos.js\` — efeitos interativos (seções entrando ao rolar, luz nos cartões, botões magnéticos, parallax).
`,
  }
}
