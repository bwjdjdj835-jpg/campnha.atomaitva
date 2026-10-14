# CLAUDE.md — Central de Agentes para criação de sites

Instruções para o Claude Code continuar este projeto. Responda sempre em português brasileiro.

## O que é
Web app que orquestra 5 agentes em sequência para achar comércios locais sem site,
construir um site para eles e fechar a venda:

| # | Agente | Papel | Prompt |
|---|--------|-------|--------|
| 1 | 🐧 Pinguim Azulado | Acha negócios sem site (Google Places + Firecrawl) | `prompts/01-pinguim-azulado.md` |
| 2 | 🦁 Leão | Monta o site minimalista + ZIP | `prompts/02-leao.md` |
| 3 | 🐈‍⬛ Gato Negro | Refina o design, prévia ao vivo, aprovação | `prompts/03-gato-negro.md` |
| 4 | 🐯 Tigre | Contato via WhatsApp e publicação | `prompts/04-tigre.md` |
| 5 | 🐝 Abelha Central | Auditoria e enriquecimento final | `prompts/05-abelha-central.md` |

Os prompts originais vieram de um PDF do usuário; nas cópias aqui "Firecrow" foi corrigido para **Firecrawl**
e "Leão Dourado" foi unificado como **Leão**.

## Estado atual
- Frontend: React 18 + Vite + Tailwind 3 + framer-motion + lucide-react + react-router.
- Visual: tema escuro "abyss" com brilho ciano (`neon`), inspirado na capa do PDF. Tokens em `tailwind.config.js`,
  classes utilitárias (`glass`, `btn-primary`, `input`) em `src/index.css`.
- Agentes são configurados em `src/data/agents.js` (uma página genérica `AgentPage` renderiza todos;
  `live: true` marca os que já usam o backend).
- **Backend** (Hono) em `server/`: `app.js` (rotas), `index.js` (servidor local, lê `server/.env`),
  `api/index.js` reaproveita a mesma app como função serverless no Vercel. Vite faz proxy de `/api` → `:8787`.
  - `GET /api/status` — quais chaves estão configuradas.
  - `POST /api/pinguim/buscar` — **real**: fonte em ordem — Google Maps via **Apify** (`server/apify.js`, ator
    `nwua9Gu5YrADL7ZDj` Google Maps Scraper, `APIFY_TOKEN`, run-sync-get-dataset-items, pt-BR, 20 lugares)
    → Google Maps via SerpApi (`server/serpapi.js`,
    `SERPAPI_KEY`, 250 buscas grátis/mês, traz foto de capa) → Google Maps via Firecrawl (`server/maps.js`,
    Alexandria `firecrawl-maps/businesses/search`, 5 créditos, só precisa da FIRECRAWL_API_KEY)
    → **página do Maps lida pelo Firecrawl** (`server/mapsPagina.js`: scrape comum da busca `maps/search/...?hl=pt-BR`
    com `location` BR + até 12 fichas para telefone/site; funciona em qualquer plano, 1 crédito por página)
    → Places Text Search → OpenStreetMap (Nominatim + Overpass em `server/osm.js`). Depois (`server/pinguim.js`): site do Maps que é
    Instagram/WhatsApp/agregador não conta como site; outra unidade com o mesmo telefone de quem tem site é descartada;
    Firecrawl `/v2/search` procura domínio próprio e Instagram. Sem Firecrawl, confiança fica "Médio".
  - `POST /api/leao/fotos` — baixa fotos da ficha (Places Photos ou links googleusercontent.com vindos da SerpApi;
    outros hosts são recusados) sem expor chaves (`server/leao.js`).
  - `POST /api/leao/print` — print da página (Google Maps/Instagram/Facebook, lista fechada) via Firecrawl
    `formats: ['screenshot','markdown','images']`; da página do Maps lê telefone, endereço e nota (`dadosDaPaginaMaps`)
    e as fotos do lugar (`fotosDaPaginaMaps`: googleusercontent `grass-cs`/`p`, sem avatares `/a-/`, pedidas em 1600px).
    A chave do Google do usuário não recebe `places.photos` (nem da Torre Eiffel) — sem faturamento; por isso o Leão
    usa essas fotos da página do Maps quando a ficha vem sem foto. `/leao/fotos` é chamado uma foto por vez
    (a resposta da função do Vercel tem limite de ~4,5 MB).
  - `POST /api/leao/hospedar` + `GET /api/leao/pastas` (`server/pasta.js`) — **pasta online** no Vercel Blob
    (`BLOB_READ_WRITE_TOKEN`, store público): o Leão sobe `sites/<slug>-<id>/fotos/*`, `prints/*` e `dados.json`
    (cada imagem ganha `hospedada` com o link). Um arquivo por requisição (limite ~4,5 MB da função).
  - `POST /api/gato/estudar` — referências fixas (21st.dev, GSAP) + 3 buscas no Firecrawl v2 (`server/gato.js`):
    vitrines de profissionais via `includeDomains` (Awwwards/Behance/Dribbble; Webflow/Framer/ThemeForest) e sites
    brasileiros do ramo. A busca v2 não aceita `lang`.
  - `server/app.js` aceita chaves com outro nome de variável (`apelido`): "google" (`AIza…`), "fire" (`fc-…`), "blob".
  - `POST /api/gato/video` (`server/video.js`) — grava ~12 s da prévia em 390×844 com Chromium (playwright-core,
    opcional) e converte para MP4 H.264 (ffmpeg-static, opcional). Precisa `npx playwright-core install chromium`
    ou `CHROMIUM_PATH`; não roda no Vercel. `POST /api/tigre/video` envia pela Z-API (`send-video`, base64).
  - `POST /api/abelha/enriquecer` (`server/abelha.js`) — busca o negócio no Firecrawl e extrai sobre/horário/serviços
    (Claude com structured output; sem chave, só horário por regex). Todo campo volta com a URL da fonte; campo que
    aponta para fonte inexistente é descartado.
  - `POST /api/tigre/{mensagem,classificar,enviar,publicar}` (`server/tigre.js`): Claude (`claude-opus-5-5`,
    effort low, `fallbacks: "default"`) escreve mensagens e lê respostas (sem chave: `src/lib/tigreTextos.js`);
    envio pela Z-API (`ZAPI_*`, prioridade) ou WhatsApp Cloud API da Meta (1º contato só por template
    `WHATSAPP_TEMPLATE`); deploy no Vercel. `/enviar` exige
    `aprovado: true` e `/publicar` exige `pagamentoConfirmado: true`.
- `src/services/agents.js`: os 5 agentes são reais; só sem backend o Pinguim cai em DEMO.
- Abelha (`src/components/AbelhaPainel.jsx` + `src/lib/auditoria.js`): checklist com nota 0–100, sugestões com fonte
  que o usuário marca; `gerarColmeia` injeta em `dados.conteudo` (seções Sobre/Serviços/Horário do `ClienteSite`),
  regrava `index.html` com meta description + JSON-LD LocalBusiness, adiciona `conteudo.json` e `AUDITORIA.md`
  e salva como `${siteId}:final` (o Tigre publica a versão enriquecida).
- Tigre (`src/components/TigrePainel.jsx`): conversa por cliente em `conversas[siteId]` (localStorage).
  Rascunho → "Aprovar e enviar" (API) ou "Abrir no meu WhatsApp" + "Já enviei". Resposta colada é
  classificada (interesse → alerta + rascunho de fechamento; pedido de parar → `nao_contatar`, contato bloqueado).
  Pagamento confirmado → publica o ZIP final (IndexedDB `${siteId}:final`) no Vercel ou salva link manual.
- Site do cliente: componente único `src/lib/ClienteSite.jsx` (sem imports, 4 temas: noite/claro/studio/vibrante):
  capa grande com água, destaques (nota, horário, cidade, WhatsApp — só dados reais), Sobre, Serviços, galeria em
  mosaico, faixa de contato com foto de fundo, contato + mapa, botão fixo de WhatsApp.
  Vai como texto (`?raw`) para `src/Site.jsx` do ZIP e renderiza a prévia — prévia aprovada = site entregue.
  `src/lib/siteTemplate.js` monta o resto do projeto React + Vite + Tailwind.
- Página inicial: `WaterRipple.jsx` (ondas de água em canvas seguindo o cursor/dedo no hero).
- Capa do site do cliente: `src/lib/clienteAgua.js` (JS puro, vai no ZIP como `src/agua.js`) — a foto de capa ondula
  seguindo o cursor (refração em canvas), gota de abertura, garoa a cada 8 s; para sozinho e volta à foto nítida.
  Áreas marcadas com `data-agua` no `ClienteSite`. A prévia (`src/lib/previa.jsx`, usada por Leão e Gato) embute o script
  e o iframe tem `allow-scripts` (sem `allow-same-origin`).
- Leão mostra o painel `PreviaLeao.jsx` (dados extraídos, fotos, prévia) e manda pro Gato com `?site=<id>`.
  Gato abre do IndexedDB, da pasta online do site (`site.pasta`) ou de uma pasta da lista (`pasta:<url>`, outro aparelho).
- Leão aceita link colado (`src/lib/links.js`): acha o lead pelo Maps/Instagram/WhatsApp; link de Maps/Instagram
  fora da lista vira lead novo (nome do título, telefone/endereço da página). Prints vão em `public/prints/`
  (e `dados.prints`); sem fotos, recorta a capa do print do Maps (`recortarCapaDoMaps`, layout 1920×1080).
- ZIP enviado manualmente ao Gato/Abelha é ligado ao site pelo nome ou pelo conteúdo (`siteDoPacote`).
- Animações do site do cliente: `src/lib/clienteAnimacoes.css` (CSS puro, vai no ZIP e na prévia; tema `studio`).
- Leão gera o ZIP no navegador (JSZip) com `public/fotos/`, `dados.json` (mapa arquivo ↔ nome original ↔ link),
  nome via `zipName()`, e guarda o ZIP no IndexedDB (`src/lib/zipStore.js`) para o Gato abrir.
- Gato Negro (`src/components/GatoPreview.jsx`): lê o ZIP do Leão (ou upload), pesquisa referências, prévia em
  `<iframe srcDoc>` (desktop/celular, troca de tema) com CSS compilado embutido (`src/lib/cliente.css` +
  `tailwind.cliente.config.js`, sem CDN). "Aprovar prévia" é obrigatório para liberar o ZIP final
  (`*-final.zip`); trocar o tema depois de aprovar exige nova aprovação.
- Estado global simples em `src/store/pipeline.js` (localStorage): `leads` e `sites`.

## Próximos passos (em ordem)
1. ~~Backend~~ e ~~Pinguim real~~ — feitos.
2. ~~Leão~~ — feito, com fotos hospedadas no Vercel Blob (pasta online).
3. ~~Gato Negro~~ — feito.
4. ~~Abelha~~ — feito.
4b. ~~Fonte de Maps~~ — página do Maps via scrape do Firecrawl (sem API de Maps). Falta testar com a chave real do usuário.
5. ~~Tigre~~ — feito. Falta: webhook do WhatsApp para receber respostas automaticamente (hoje o usuário cola).
6. Trocar os emojis em `AgentBadge.jsx` por logos vetoriais (SVG) de cada animal.
7. Persistência real (Supabase) no lugar do localStorage.

## Regras do projeto
- Nunca inventar dados de negócios; resultados de demo sempre marcados como DEMO.
- Nunca expor chaves de API no código do frontend.
- Manter o visual: fundo escuro, ciano neon, cards `glass`, fonte Space Grotesk nos títulos.
- Toda etapa crítica (prévia do site, envio de mensagem, publicação) exige aprovação do usuário.

## Comandos
```
npm install
cp .env.example server/.env   # preencha as chaves
npm run dev      # web em http://localhost:5173 + API em :8787
npm run build
```
