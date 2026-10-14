// Projeto do site do cliente (React + Vite + Tailwind) montado a partir do dados.json.
// Retorna { caminho: conteúdo } para o JSZip. O componente visual é src/lib/ClienteSite.jsx,
// copiado como texto para src/Site.jsx — o mesmo usado na prévia do Gato Negro.

import siteSource from './ClienteSite.jsx?raw'
import animacoesCss from './clienteAnimacoes.css?raw'
import aguaSource from './clienteAgua.js?raw'

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
    'vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({ plugins: [react()] })
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
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(<Site dados={dados} />)
iniciarAgua(document)
`,
    'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

${animacoesCss}`,
    'src/Site.jsx': siteSource,
    'src/agua.js': aguaSource,
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
`,
  }
}
