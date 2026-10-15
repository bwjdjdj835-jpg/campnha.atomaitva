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
| — | 🦫 Castor | Diretor de arte: design system por nicho + 3 modelos antes do Gato | `prompts/06-castor.md` |

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
  - `GET /api/status` — quais chaves estão configuradas + `firecrawlCreditos` (`server/firecrawlCreditos.js`,
    `GET /v2/team/credit-usage`, cache 60 s). Sem crédito, o Pinguim avisa (`avisoSemCredito`), pula as fontes do Firecrawl,
    marca os leads como `sem_firecrawl` e devolve `semCreditoFirecrawl`; `/pinguim/conferir` responde 402 `SEM_CREDITO`.
    O Automático e o Pinguim mostram "Firecrawl ✓ (N créditos)" ou "❌ SEM CRÉDITOS".
  - `POST /api/pinguim/buscar` — **real**: fonte em ordem — Google Maps via **Apify** (`server/apify.js`, ator
    `nwua9Gu5YrADL7ZDj` Google Maps Scraper, `APIFY_TOKEN` (apelido "apify"/`apify_api_`), run-sync-get-dataset-items, pt-BR,
    30 lugares, `locationQuery` "Cidade, Estado, Brasil" por `partesDaCidade` + `countryCode: 'br'`)
    → Google Maps via SerpApi (`server/serpapi.js`,
    `SERPAPI_KEY`, 250 buscas grátis/mês, traz foto de capa) → Google Maps via Firecrawl (`server/maps.js`,
    Alexandria `firecrawl-maps/businesses/search`, 5 créditos, só precisa da FIRECRAWL_API_KEY)
    → **página do Maps lida pelo Firecrawl** (`server/mapsPagina.js`: scrape comum da busca `maps/search/...?hl=pt-BR`
    com `location` BR + até 12 fichas para telefone/site; funciona em qualquer plano, 1 crédito por página)
    → Places Text Search → OpenStreetMap (Nominatim + Overpass em `server/osm.js`: cidade por **busca estruturada**
    `city`/`state`/`country=Brasil` + `countrycodes=br` — texto livre "Cacoal - RO, Brasil" voltava vazio;
    `partesDaCidade` entende "Cacoal - RO", "Cacoal, Rondônia, Brasil", "Cacoal-RO", "Ji-Paraná - RO" (UF → estado);
    User-Agent identificado `CentralDeAgentes/1.0 (+https://campnha-atomaitva.vercel.app)` e ≤1 pedido/s; sem relação de
    limite, usa `around:8000` do centro. Comércios: Overpass por tags; se falhar ou vier vazio, `poisNominatim` por TIPO
    (`amenity=fast_food` estruturado + `q=[tipo]` com `viewbox` da cidade e `bounded=1`) — nunca o nome do nicho na query). Depois (`server/pinguim.js`): site do Maps que é
    Instagram/WhatsApp/agregador não conta como site; quem tem site no Maps (ou é outra unidade com o mesmo telefone)
    volta em `comSite` (lista "Já têm site"); os outros voltam como leads com `conferencia: { status: 'pendente' }`.
  - `POST /api/pinguim/conferir` (`conferirSite`) — um negócio por vez: busca `"nome" cidade` (domínio com o nome =
    `tem`) e, se nada, `"(DD) NNNNN-NNNN"` (outro site não-diretório com o telefone = `provavel`); senão `nao`. Devolve
    evidências (links) e quantos pedidos usou. O `LeadsTable` roda a fila sozinho com no máx. 8 pedidos/min (plano
    grátis), mostra selo por lead (Não tem site / Tem site / Possível site com "É o site dele" ou "Não é"), pausa, e
    num 429 (`code: 'LIMITE'`) espera 1 minuto e tenta de novo.
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
  - `POST /api/gato/estudar` (`server/gato.js`, `estudar(categoria, modelos)`) → `{ referencias, cursos, secoes, modelos }`:
    referências fixas (21st.dev, GSAP, Code Eagle = nextcodeeagle.com) + 4 buscas no Firecrawl v2 via `includeDomains`:
    vitrines (Awwwards/Behance/Dribbble/Webflow/Framer/ThemeForest), favoritos do usuário (21st.dev/Code Eagle/GSAP),
    modelos grátis (HTML5 UP/templatemo/free-css/One Page Love/Colorlib) e sites BR do ramo; + 1 busca de **cursos
    grátis** com `scrapeOptions` (markdown); + até `MAX_MODELOS` = 4 **sites modelo colados pelo usuário**, lidos com
    `formats: ['markdown','branding']` (cores, fonte, claro/escuro). As seções (`SECOES`; `temos: false` =
    depoimentos/preços/equipe, que precisam de dado real) são contadas nos cursos + modelos. Total ≤ 9 pedidos, para
    caber no limite de ~10 pedidos/min do plano grátis. A busca v2 não aceita `lang`.
  - `POST /api/gato/aprofundar` (`aprofundar(categoria, rodada, lidos)`) — uma rodada do **estudo de 3 minutos**:
    2 buscas BR de sites reais do ramo (sem vitrines/redes/diretórios, `NAO_E_SITE_DO_RAMO`) + leitura com `branding`
    de até 6 páginas iniciais novas (8 pedidos). O Gato (`gato()` em `src/services/agents.js`) faz o estudo inicial e
    uma rodada por minuto (`ESTUDOS`: **1 min** = rodada 1, padrão escolhido pelo usuário; `3min` = rodadas 1–2;
    `5min` = rodadas 1–4; rápido = só a inicial; valores antigos '3'/'5'/'70' caem no padrão); cada rodada usa uma dupla de buscas diferente (`BUSCAS_POR_RODADA`);
    campo "Estudo" e botão "Encerrar estudo e gerar agora" (`encerrarEstudo`).
    `estiloDoEstudo` só usa leituras com `confianca` de cor ≥ `CONFIANCA_MINIMA` (0,5, vinda do `branding.confidence`)
    e cor principal ≠ fundo; esquema da maioria, cores do site mais confiável dele e a fonte mais usada. Estilo inicial do site: link colado pelo usuário
    (prioridade) → estilo do estudo → tema por segmento.
  - `server/app.js` aceita chaves com outro nome de variável (`apelido`): "google" (`AIza…`), "fire" (`fc-…`), "blob", "groq" (qualquer nome com valor `gsk_…`),
    "apify"/"apyfi" (`apify_api_`), "serp" (64 hex).
  - `POST /api/gato/video` (`server/video.js`, body `{ html, segundos }`, 8–40) — grava **20 s** (padrão) da prévia em 390×844 **quadro a quadro** (print em 2× a
    20 quadros/s, juntado pelo ffmpeg-static em MP4 H.264 High 780×1688 — nítido e nunca corrompe; sem ffmpeg, cai no
    gravador do Playwright em WebM). Navegador: `acharNavegador()` = CHROMIUM_PATH → Chromium do Playwright → **Google
    Chrome / Edge instalados** (Windows/Mac/Linux). Só quando o servidor tem navegador de verdade
    (`keys.videoServidor` = `servidorGrava()`: fora de Vercel/Netlify e algum navegador existe). **`iniciar-windows.bat`**
    (pedido do usuário, "gravar pelo computador"): confere o Node, `npm install` na 1ª vez, cria `server/.env` a partir
    do `.env.example` (abre o Bloco de Notas para colar as chaves) e roda `npm run dev` abrindo http://localhost:5173 —
    aí o automático grava pelo próprio computador, sem pedir para compartilhar a aba; se a
    gravação no servidor falhar, o Gato cai para a gravação no navegador (pede novo clique se já passou do tempo
    em que o navegador aceita `getDisplayMedia`). **No Vercel** o Gato grava no navegador do usuário
    (`gravarPreviaNoNavegador` em `src/lib/previa.jsx`: `getDisplayMedia` com `preferCurrentTab`, recorte no iframe
    com Region Capture, `MediaRecorder` em MP4 quando o navegador grava MP4, senão WebM; a prévia recebe
    `postMessage({ tipo: 'passeio-previa' })` e passa um cursor na capa e rola a página). Chrome/Edge no computador.
    **Pasta dos vídeos (pedido do usuário):** com `salvarComo: { pasta: nicho, nome }` o servidor local também salva em
    `~/Videos/Central de Agentes/<nicho>/<comércio>.mp4` (`salvarNaPasta`, header `X-Salvo-Em` → `site.videoArquivo`);
    `POST /api/gato/abrir-pasta` (`abrirPasta`, só arquivos dessa pasta) abre o Explorador. No notebook o automático grava
    sozinho mesmo com `videoModo: 'manual'`; o cartão da Aranha tem "Gravar agora no notebook (nítido)" e "Abrir a pasta".
    **Vídeo na nuvem (ScreenshotOne, pedido do usuário):** `server/videoNuvem.js` (`SCREENSHOTONE_ACCESS_KEY`, apelido "screenshot",
    `keys.videoNuvem`) → `POST /api/gato/video-nuvem` manda o HTML da prévia para `POST https://api.screenshotone.com/animate`
    (scroll, MP4, 390×844 em 2×, capa 3 s, `cache` + `response_type: json`) e devolve `{ url }` (cache_url — a função do
    Vercel não devolve arquivo grande); o navegador baixa direto ou por `GET /api/gato/video-nuvem/baixar?u=` (só domínios
    screenshotone). Cliente: `src/services/videoNuvem.js` (`gravarNaNuvem(pacote, siteId, segundos)`, fotos reduzidas por
    `fotosMenores` para caber no limite de ~4,5 MB do pedido). Ordem no automático: notebook → nuvem → aba do navegador.
    O cartão da Aranha tem "Gravar agora na nuvem".
    `POST /api/tigre/video` envia pela Z-API (`send-video`, base64).
  - `POST /api/abelha/enriquecer` (`server/abelha.js`) — busca o negócio no Firecrawl e extrai sobre/horário/serviços
    (Claude com structured output; sem chave, só horário por regex). Todo campo volta com a URL da fonte; campo que
    aponta para fonte inexistente é descartado.
  - `POST /api/tigre/{mensagem,classificar,enviar,publicar}` (`server/tigre.js`): a IA escreve mensagens e lê respostas —
    **Groq primeiro** (`GROQ_API_KEY`, apelido "groq"/`gsk_`, modelo `GROQ_MODEL` ou `llama-3.3-70b-versatile`, API no formato
    OpenAI; decisão do usuário para não gastar créditos do Claude); Claude (`claude-opus-5-5`, effort low,
    `fallbacks: "default"`) só sem Groq; sem chave (ou Groq falhando): `src/lib/tigreTextos.js`;
    envio pela Z-API (`ZAPI_*`, prioridade) ou WhatsApp Cloud API da Meta (1º contato só por template
    `WHATSAPP_TEMPLATE`); deploy no Vercel. `/enviar` exige
    `aprovado: true` e `/publicar` exige `pagamentoConfirmado: true`.
- `src/services/agents.js`: os 5 agentes são reais; só sem backend o Pinguim cai em DEMO.
- Abelha (`src/components/AbelhaPainel.jsx` + `src/lib/auditoria.js`): checklist com nota 0–100, sugestões com fonte
  que o usuário marca; `gerarColmeia` injeta em `dados.conteudo` (seções Sobre/Serviços/Horário do `ClienteSite`),
  regrava `index.html` com meta description + JSON-LD LocalBusiness, adiciona `conteudo.json` e `AUDITORIA.md`
  e salva como `${siteId}:final` (o Tigre publica a versão enriquecida).
- Tigre (`src/components/TigrePainel.jsx`): conversa por cliente em `conversas[siteId]` (localStorage).
  **Envio manual é o padrão** (decisão do usuário: mensagem automática pode fazer o WhatsApp bloquear o número):
  o Tigre gera a mensagem sugerida → "Abrir no meu WhatsApp" (wa.me com o texto) / "Copiar mensagem" + "Já enviei";
  vídeo por "Compartilhar no WhatsApp" (Web Share no celular) ou "Baixar o vídeo". O envio pela API (Z-API/Meta)
  só aparece se o usuário marcar a caixa de risco (`central-agentes:tigre-envio-api` no localStorage). Resposta colada é
  classificada (interesse → alerta + rascunho de fechamento; pedido de parar → `nao_contatar`, contato bloqueado;
  **recusa leve** ("não quero agora", "no momento não", "fica pra próxima") → UMA mensagem `olhada` ("só dá uma olhadinha
  no projeto, sem compromisso", `MODELOS.olhada`), marcada com `tipo: 'olhada'`; se recusar de novo, o Tigre não sugere
  mais nada). Na dúvida entre recusa e parar, vale parar (`OPT_OUT` vem antes de `RECUSA`).
  **Robô** (resposta automática, saudação do WhatsApp Business com horário/links de agendamento/"podemos demorar"/
  "agradeço o contato"/"seja muito bem-vindo", menu, assistente virtual — regex `BOT`, intenção `bot`, status
  "Respondeu um robô") →
  rascunho `pessoa` pedindo para falar com o responsável/alguém da equipe; `opcaoDeAtendente` acha no menu o número da
  opção "falar com atendente" (inclusive 2️⃣) e põe na 1ª linha da mensagem.
  **Conversa contínua:** toda resposta colada ("Ler e sugerir resposta") gera a próxima mensagem — interesse, dúvida e
  "outro" usam o rascunho `resposta` (a IA responde a última mensagem; sem IA, `respostaPorPalavras`: preço sem inventar
  valor, "quem é?", golpe, engano, "pode mandar", fechar, ocupado, "como funciona", saudação). Recusou de novo depois
  da `olhada` → `despedida` (agradece e encerra). Só "parar" não gera nada.
  Pagamento confirmado → publica o ZIP final (IndexedDB `${siteId}:final`) no Vercel ou salva link manual.
- Site do cliente: componente único `src/lib/ClienteSite.jsx` (sem imports, 5 temas: noite/claro/studio/vibrante/modelo),
  **modelo premium** (pedido do usuário a partir de um roteiro do Lovable; cada seção só aparece com dado):
  barra de progresso, nav flutuante de vidro, hero em tela cheia (`dados.hero`: 'agua' padrão ou 'parallax') com o nome
  subindo palavra por palavra (`.anim-palavra`) + granulado (`.granulado`) + `conteudo.slogan`, faixa marquee de
  serviços, números com contador (`data-contar`: nota e nº de avaliações), Sobre editorial, Diferenciais
  (string ou `{titulo,texto}`), lista grande de Serviços com hover (string ou `{nome,descricao,preco}`), galeria
  (`dados.galeria`: 'uniforme' padrão ou 'bento'), Como funciona, **depoimentos em carrossel** (`conteudo.depoimentos`
  `[{texto,nota,autor}]`, `data-carrossel`), FAQ, chamada final gigante "Agende →" + contato + mapa P&B que ganha cor
  no hover, botão fixo de WhatsApp. Links da nav com `target="_self"` (a prévia tem `<base target="_blank">`).
- Depoimentos reais: o print do Maps no Leão (`tirarPrint`) pede também o formato `json` do Firecrawl com as
  avaliações; `depoimentosConferidos` só aceita a avaliação cujo texto aparece no markdown da página (nunca inventa),
  no máx. 5; o Leão grava em `dados.conteudo.depoimentos`.
- Gato: "Escolha o estilo" mostra os temas lado a lado em miniaturas reais (`htmlDaPrevia(..., CSS_MINIATURA)`) e os
  seletores Capa (água/parallax) e Galeria (uniforme/bento); `gerarZipFinal(..., { hero, galeria })` grava a escolha.
  Vai como texto (`?raw`) para `src/Site.jsx` do ZIP e renderiza a prévia — prévia aprovada = site entregue.
  `src/lib/siteTemplate.js` monta o resto do projeto React + Vite + Tailwind.
- Efeitos interativos do site do cliente (estilo 21st.dev / Code Eagle / GSAP, sem bibliotecas):
  `src/lib/clienteEfeitos.js` (vai no ZIP como `src/efeitos.js`; roda na prévia junto com a água) liga
  `[data-revelar]` (entra ao rolar, filhos `[data-cascata]` em cascata), `[data-brilho]` (luz segue o cursor),
  `[data-magnetico]` (botões) e `[data-parallax]` (fotos); CSS em `clienteAnimacoes.css` (+ título letra por letra
  `.anim-letra` e faixa de serviços `.faixa-correr`). O `ClienteSite` só põe esses atributos se `dados.efeitos !== false`
  (`fx()`); o Gato tem o botão "Efeitos interativos: ligados/desligados" e o ZIP final guarda a escolha.
- Galeria uniforme: todas as fotos em 4:3 do mesmo tamanho; colunas pela quantidade (4 → 4, 2 → 2, senão 3) e última
  linha centralizada (flex-wrap).
- Página inicial: `WaterRipple.jsx` (ondas de água em canvas seguindo o cursor/dedo no hero).
- Capa do site do cliente: `src/lib/clienteAgua.js` (JS puro, vai no ZIP como `src/agua.js`) — a foto de capa ondula
  seguindo o cursor (refração em canvas), gota de abertura, garoa a cada 8 s; para sozinho e volta à foto nítida.
  Áreas marcadas com `data-agua` no `ClienteSite`. A prévia (`src/lib/previa.jsx`, usada por Leão e Gato) embute o script
  e o iframe tem `allow-scripts` (sem `allow-same-origin`).
- Gato: campo "Seu modelo de site" (textarea, `lembrar: true` em `src/data/agents.js` → guardado no localStorage por
  `AgentPage`; `opcoes` vira select). O 1º modelo lido já entra aplicado (`preview.modeloInicial`); em "Estilo do site"
  o botão "Usar cores e fonte deste modelo" troca entre os modelos e o do estudo, ligando o tema `modelo` do `ClienteSite`
  (classes com `var(--m-*)`, valores de `dados.modelo.estilo`; fonte pelo Google Fonts na prévia e no `index.html`).
- Site amplo: o Gato completa `dados.conteudo` com `src/lib/conteudoSugerido.js` (sobre, serviços, diferenciais,
  passos, faq típicos do segmento — sem preço, ano, prêmio ou nome; o nome do negócio é o sujeito da frase para não
  errar gênero). Campos sugeridos ficam em `conteudo.sugerido`; o `EditorConteudo` do `GatoPreview` deixa editar
  (editar tira a marca), a auditoria conta sugestão como "aviso" e a Abelha tira a marca do que trouxe com fonte.
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
- **Selo de contato** (`src/lib/contato.js`, `contatoDoLead`): cada comércio mostra "⏳ Aguardando resposta", "🙅 Não quer
  site ainda", "🔥 Interessado", "⛔ Não contatar" etc. pela conversa do Tigre (site do lead, ou mesmo telefone/nome) ou
  por marcação manual na lista do Pinguim ("Já mandei mensagem" / "Não quer site ainda", em `contatos` pela chave do
  telefone — vale quando o Pinguim acha o comércio de novo). Contatados vão para o fim da lista; o selo aparece também
  nos seletores do Leão e do Tigre e em "Sites gerados".
- **Modo automático** (`/automatico`, `src/pages/Automatico.jsx` + `src/services/automatico.js`, pedido do usuário):
  cidade + lista de nichos (padrão `NICHOS_PADRAO`, começa em barbearia) → para cada nicho o Pinguim busca, cada lead
  real com telefone, sem selo de contato e com conferência `nao`/`sem_firecrawl` passa por Leão (`semDownload`) → Gato
  (`reaproveitar`: estudo 1 vez por nicho, `estudoDoNicho`) + `gerarZipFinal(..., { baixarZip: false })` → Abelha
  (aceita só campos com fonte, `gerarColmeia(..., { baixarZip: false })`) → vídeo → `rascunho('primeiro')` guardado em
  `conversas[siteId].rascunho`. O site fica com status `revisar`; **nada é enviado**. Limite do Firecrawl:
  `gastar(n, log, parar, 'busca' | 'pagina')` — o plano grátis tem limites SEPARADOS (10 buscas/min e 10 leituras de
  página/min; usamos 9 de cada). **Conferência adiantada:** `conferirAntes` põe até 4 comércios à frente numa fila de
  conferência (buscas) enquanto o site atual é montado (páginas); `conferirUm` reserva 1 busca e só conta a 2ª (telefone)
  se ela aconteceu (`r.pedidos`). Nicho com 6 de 8 comércios já com site: >4 min → ~50 s. Vídeo: servidor local grava sozinho; no Vercel `pedirGravacaoDaAba()` UMA vez no clique de começar e
  `gravarComFluxo(stream, iframe)` por cliente (iframe fixo no canto). Nichos concluídos ficam em `pipeline.auto.feitos`
  (continua de onde parou; "Recomeçar do 1º nicho"). Wake Lock + aviso ao fechar a aba.
  **Tela inicial:** botão "Iniciar inteligência artificial automática" — pede a gravação da aba no próprio clique
  (`guardarFluxo`), abre `/automatico?iniciar=1` (começa sozinho com `pegarFluxo()` e as opções salvas) e, ao terminar
  com clientes prontos, abre o Tigre.
  **Vídeo "eu gravo no meu notebook" (padrão, `videoModo: 'manual'`, pedido do usuário):** o automático não grava nem pede
  para compartilhar a aba (`prepararInicio({ manual })`, `videoManualNasOpcoes()`); `finalizar` só escreve a mensagem e
  marca `revisar` com `videoManual: true` (`conferirProntos` não manda para "Falta o vídeo"). No cartão do Admin sem
  vídeo: "Abrir prévia para gravar" (janela 430×900 com a prévia sem água/granulado; gravar com Win + Alt + R) e
  "Enviar o vídeo gravado" (`guardarVideo`); com vídeo: **"Mandar direto para o cliente"** (`mandarDireto`, principal:
  salva o vídeo em Downloads + copia a mensagem + abre wa.me/55… do cliente com o texto — o compartilhar do sistema sempre
  pede para escolher o contato; lá o usuário anexa pelo 📎), "Compartilhar vídeo + mensagem" (Web Share com arquivo + texto,
  e a mensagem vai antes para a área de transferência), "Só o vídeo", "Salvar vídeo", "Trocar o vídeo".
  'auto' = o app grava sozinho (como antes).
  **Rápido por padrão** (pedido do usuário: "só gravar o vídeo e mandar mensagem"): estudo do Gato de **1 minuto** só no
  1º site de cada nicho (os outros reaproveitam; `nenhum` = sem estudo) e Abelha desligada (opções `v: 3` em
  `central-agentes:automatico`); **vídeo de 20 s** (opção 15/20/30 s, `duracao`; `DURACAO_VIDEO` em `previa.jsx` —
  9 s era curto demais para ver o comércio; capa 3 s + rolagem devagar); o
  vídeo + mensagem de um cliente (`finalizar`) roda enquanto o próximo site é montado (`montarSite`, fila `filaFinal`).
  Status do site: `preparando` → `revisar` **só com vídeo E mensagem** (pedido do usuário); sem vídeo → `sem_video`
  (lista "Falta o vídeo" na Área do Administrador, botão "Gravar os vídeos que faltam" → `/automatico?regravar=1` →
  `regravarVideos`; cada um dá para descartar). `conferirProntos()` (Admin e fila do Tigre) arruma os antigos:
  `revisar` sem vídeo → `sem_video`, sem mensagem → escreve. Vídeo é obrigatório: sem autorização para gravar o
  automático nem começa, e parar de compartilhar a aba para a rodada. O próximo nicho só libera com "Para aprovar" e
  "Falta o vídeo" vazios. O quadro de gravação fica montado a rodada
  inteira (`gravarComFluxo` só recorta de novo se o quadro mudar e tem tempo máximo em cada passo — antes o 2º vídeo travava).
  **Um nicho por vez, até acabar a lista** (pedido do usuário): a lista do Pinguim do nicho fica em `auto.listas[nicho]`
  (ids dos leads) e as rodadas seguintes continuam nela sem nova busca; cada rodada faz até "Clientes por rodada"
  (`porNicho`) e para para aprovação; o nicho só entra em `auto.feitos` quando a lista acaba (`esgotou`). Botão
  "Continuar: <nicho>" (`nichoEmAndamento`) até o fim, depois "Começar: <próximo>". "Recomeçar" limpa `listas`.
  Migração `auto.v` < 2: apaga UMA vez as marcas antigas de `feitos`/`listas` (as versões antigas marcavam nicho como
  feito com poucos clientes e seguiam sozinhas até confeitaria) — tudo recomeça na barbearia; contatados continuam pulados.
  `rodarAutomatico` para depois do nicho com cliente pronto (nicho sem cliente passa direto) e devolve
  `resumo.proximo` (`proximoNicho`). O próximo só começa pela Área do Administrador,
  quando não há nada para aprovar nem sendo preparado: botão "Começar: <nicho>" → `prepararInicio` (pede a gravação no
  clique; a tela inicial usa o mesmo) → `/automatico?iniciar=1`. Antes, o automático seguia sozinho para o nicho
  seguinte e, se você saísse da página para aprovar, a gravação era encerrada (salão ficou sem vídeo).
  **Para no fim de CADA nicho**, mesmo sem cliente novo, e em erro da busca do Pinguim (não pula de nicho em silêncio):
  `resumo.itens` (`anotar`: pronto, sem_video, tem_site, possivel_site, sem_telefone, ja_contatado, ja_feito,
  erro_conferir, erro, erro_busca) vai para `auto.relatorio`; a Aranha mostra "📋 Relatório da última rodada". Cada cartão
  mostra o que cada agente entregou (`ArquivosDosAgentes`: 🐧 Pinguim, 🦁 Leão ZIP e 🐈‍⬛ Gato ZIP final com "baixar",
  🎬 vídeo, 🐯 mensagem). A Área do Administrador passou a se chamar **🕷️ Aranha Administradora** (último agente,
  pedido do usuário).
  Ao terminar abre a **Aranha Administradora** (antes "Área do Administrador") (`/admin`, `src/pages/Admin.jsx`, contador no menu): cartões "Para aprovar"
  com vídeo e mensagem editável em **dois passos** (o wa.me só leva texto, e compartilhar vídeo + texto juntos faz o
  WhatsApp largar o vídeo): 1️⃣ vídeo — "Mandar o vídeo no WhatsApp" (Web Share só com o arquivo) / "Salvar vídeo (MP4)"
  (Downloads; anexar pelo 📎); 2️⃣ mensagem — "Aprovar e abrir no WhatsApp" (wa.me com DDI 55) / "Copiar"; mais "Ver
  prévia", "Gerar outra", "Ajustar no Gato", "Descartar". Gravação prioriza MP4 H.264 (`TIPO_VIDEO`, 4 Mbps, quadro-chave a cada 1 s; o
  tipo do blob guarda o codec — "video/mp4" sem codec vira `codecs=vp9`, pois só é escolhido sem H.264) e avisa quando
  `videoAceitoNoWhatsApp` é falso. O vídeo (automático e Gato) usa `htmlDaPrevia(..., CSS_GRAVACAO, { agua: false })`:
  sem água e sem granulado, que no vídeo comprimido pareciam defeito. **Vídeo corrompido (só o 1º quadro, resto cinza):**
  o Chrome gerava MP4 H.264 quebrado quando o tamanho da captura mudava no meio (recorte entrando, zoom do Windows).
  `gravarComFluxo` agora desenha a captura num **canvas de tamanho fixo** (largura 540, altura pelo formato do quadro
  medido no começo; recorte à mão se o Region Capture falhar) e grava `canvas.captureStream(30)` com `start()` sem
  fatias (MP4 inteiro). O `<video>` da captura fica na página (2 px, quase invisível) e o canvas é redesenhado num
  `setInterval` de 30 quadros/s — fora da página e só com `requestVideoFrameCallback`, alguns Chrome soltavam poucos quadros;
  "Já enviei" registra a mensagem (+ vídeo) na conversa (status `contatado`, site `aprovado`). Aba "Enviados" com selo,
  **"Ele respondeu"** (cola a resposta → `lerResposta` → mensagem sugerida → "Aprovar e abrir no WhatsApp" → "Já enviei"
  = `registrarEnviada`) e "Conversa completa" (`/agente/tigre?cliente=<id>`). **Aba "Conversas"** (pedido do usuário: "tem que ser
  uma interação, não só uma mensagem"): histórico em balões, quem respondeu por último vem primeiro com "💬 Esperando
  você" (`esperandoVoce`), cola a resposta → próxima mensagem com selo da IA (`FONTE_IA`: Groq/Claude/texto pronto) →
  "Gerar outra" (`outraSugestao`) → "Já enviei" → cola a próxima… até "💰 Fechou! Pagou" (`marcarVenda`). O `SISTEMA` do
  Tigre tem o objetivo de levar a conversa até fechar, lendo a conversa inteira. `olhada`/`despedida` mantêm o selo `recusou`. A lógica de ler a resposta e escolher a
  próxima mensagem fica em `src/services/tigreConversa.js` (usada pelo `TigrePainel` e pelo Admin). O Tigre também mostra a fila (`FilaAprovacao.jsx`).
- **🐯 Arquivo do Tigre** (`src/components/TigreArquivo.jsx`, topo da página do Tigre; pedido do usuário — a conversa final é da
  Aranha): clientes por situação (🙅 não querem agora = sites guardados com prévia/ZIP, responderam, aguardando, vendidos,
  não contatar), tabela de nichos (✅ concluído `auto.feitos`, 🔄 em andamento `auto.listas` com quantos faltam, ⏸️ ainda não
  vimos; `chaveNicho`) e números dos comércios verificados pelo Pinguim.
- **🦫 Castor** (pedido do usuário; fica antes do Gato finalizar): `src/lib/castor.js` (`propostasDoCastor(dados, modelo, estado)`
  → 3 modelos bem diferentes: "Do estudo" (tema `modelo`, se houver) → "Seu preferido" (`estiloPreferido`, ≥2 escolhas) →
  "Clássico do ramo" (`temaSugerido`) → extras Editorial/Premium escuro/Moderno/Alegre, sem repetir tema) e
  `src/components/CastorModelos.jsx` no topo do `GatoPreview` (prévias reais lado a lado; "Usar este modelo" aplica tema + capa +
  galeria e `lembrar('castor', …, { tema, hero, galeria })`). No automático o Castor usa a 1ª proposta.
- **Padrão de agência no site do cliente** (pedido do usuário): `fonteDoSite` (Google Fonts em todos os temas: noite/studio
  Outfit, claro/vibrante Plus Jakarta Sans, modelo/Castor a do design; `linkDaFonte` e `siteTemplate` carregam), overlay
  `bg-black/30` extra na capa, cards de vidro `rounded-2xl` (`cartaoVidro`), seções alternadas de ponta a ponta
  (`faixaAlternada` com `before:` + `t.alternada`) em Diferenciais e Avaliações, Serviços em **grid de cards**, prova social
  só com dado real (sem depoimento escrito → nota + "Ver avaliações no Google"), botão "📍 Como chegar (Google Maps)"
  (`linkMaps`). Castor: `designDoCastor(dados)` (matriz por nicho: rústico escuro `#121212` + dourado/laranja queimado/
  verde musgo, Outfit; acolhedor `#faf9f5` + rosé/verde/marrom, Plus Jakarta Sans; pet shop = claro, decisão do usuário)
  vira um `modelo` (`estilo.cores` com `fundoAlt`/`cartao`/`borda` → `--m-fundo-alt` etc.) e `modelo.design` guarda o JSON
  (`paleta_cores`, `fontes_google`, `estrutura_secoes`). É a 1ª proposta do Castor, o Gato começa nela (sem link colado) e o
  automático usa ela.
- **Castor com Groq** (pedido do usuário): `server/castor.js` (`designsDoCastor`, `POST /api/castor/design`) pede à Groq
  (`groq()` exportado de `server/tigre.js`, `maxTokens`/`temperatura`) 3 design systems em JSON (titulo, porque, esquema, fonte
  de uma lista fechada, hero, galeria, paleta hex) seguindo a matriz do `prompts/06-castor.md`; valida hex/fonte e descarta o
  inválido. Cliente: `designsDaGroq(dados)` + `modeloDoDesign` (`src/lib/castor.js`) → `CastorModelos` mostra os 3 como prévias
  reais (selo "🤖 Designs criados pela Groq"; sem Groq, "📐 Matriz de design do Castor"); o automático usa o 1º da Groq. A Groq
  não gera imagem — a "imagem" é a prévia real do site com aquele design. Página do Gato sem site mostra onde o Castor aparece.
- **Time completo no menu e na tela inicial** (`src/data/equipe.js`, pedido do usuário): Pinguim → Leão → 🦫 Castor (abre o
  Gato) → Gato → Abelha → Tigre → 🕷️ Aranha (`/admin`) → 🦅 Águia (`/aguia`).
- **🦅 Águia** (`src/pages/Aguia.jsx`, `src/lib/aguia.js`, `server/aguia.js`): números do processo (`numerosDaAguia`), o que
  cada agente pensa e o relatório (`relatorioDaAguia`, só dados reais). E-mail pelo Resend (`POST /api/aguia/email`,
  `RESEND_API_KEY` — apelido por valor `re_…` — e `AGUIA_EMAIL` — apelido: variável com "mail"/"aguia"/"resend" no nome e valor de e-mail; `keys.email`); sem chave, "Abrir no meu e-mail" (mailto) e
  "Copiar". O automático manda o relatório sozinho no fim de cada rodada (`enviarRelatorioAguia`). Basta a chave do
  Resend: o destino é `AGUIA_EMAIL` ou o campo "Seu e-mail" da página (localStorage `central-agentes:aguia-email`, mandado
  como `para`); `keys.emailDestino` diz se o servidor já tem o e-mail.
- **🧠 Mente dos agentes** (pedido do usuário): `src/lib/mentes.js` — `PERSONALIDADES` (pinguim, leao, castor, gato, abelha, tigre,
  aranha, aguia), `lembrar(agente, texto, dados)` → `pipeline.mentes[agente]` (máx. 60), `pensamentos(agente, estado)` (opiniões
  calculadas dos dados reais, nunca inventadas). `MenteAgente.jsx` em cada página de agente, na Aranha e no Castor. Memórias
  gravadas: Pinguim (buscas), Leão (sites), Castor (escolhas), Gato (aprovações), Abelha (notas), Aranha/Tigre (respostas, vendas,
  "agora não").
- Estado global simples em `src/store/pipeline.js` (localStorage): `leads`, `sites`, `conversas`, `comSite`, `contatos`;
  `lerPipeline()` lê o estado atual fora do React (laço da conferência); `assinar(fn)`; `erroLocal` quando o navegador recusa.
- **📲 WhatsApp Web pelo notebook** (pedido do usuário: "a Aranha clica no meu WhatsApp, manda e responde"; escolha: "ela digita,
  eu aprovo cada uma"): `server/zapWeb.js` — Playwright `launchPersistentContext` com o Chrome/Edge instalado (`acharNavegador`
  exportado de `video.js`), perfil logado em `~/.central-agentes/whatsapp`, janela visível. `POST /api/zap/conectar` (QR na 1ª
  vez), `GET /api/zap/status`, `POST /api/zap/enviar` (exige `aprovado: true`; abre `web.whatsapp.com/send?phone=55…`, anexa o
  vídeo pelo input de arquivo com a mensagem na legenda, ou só digita e Enter), `POST /api/zap/ler` (últimas 15
  `div.message-in`). Só no servidor local (`soNoNotebook` → 501 `SO_LOCAL`). `ZAP_BASE`/`ZAP_HEADLESS`/`ZAP_PERFIL` só para
  teste (página falsa). Cliente `src/services/zapWeb.js`: `enviarPeloZap` (blob → base64), `buscarRespostas` (abre cada conversa
  enviada, pega as mensagens do cliente que ainda não estão na conversa, roda `lerResposta` e guarda `conversas[id].sugestao`).
  Aranha: `ZapWeb` no cartão "Para aprovar" e em cada conversa ("Aprovar e enviar pelo WhatsApp Web" → registra "Já enviei") e
  `BuscarRespostas` na aba Conversas. Automação não oficial: risco de bloqueio avisado na tela.
- **🕷️ Aranha = seu lugar de administrador; 🐯 Tigre = o trabalhador** (pedido do usuário): no cartão "Para aprovar" o botão
  principal é **"Aprovar — o 🐯 Tigre faz o resto"** (`AprovarTigre` → `tigreExecutar` em `src/services/tigreTrabalho.js`):
  `jaRecebeuMensagem` (mesmo site ou outro site do mesmo `chaveContato`) bloqueia envio repetido; grava o vídeo se faltar
  (notebook → nuvem); no notebook manda vídeo + mensagem pelo WhatsApp Web e registra (`registrarPrimeiroEnvio`); no Vercel
  devolve `modo: 'manual'` e a Aranha abre a conversa (`mandarDireto`) para "Já enviei". Respostas: `ResponderTigre` →
  `tigreResponder`. Tudo vai para `pipeline.tigreDiario` (máx. 60), mostrado em "🐯 Trabalho do Tigre" no Arquivo do Tigre.
  As opções manuais antigas ficam em "Fazer eu mesmo" (`<details>`).
- **☁️ Nuvem** (pedido do usuário: "o Tigre salva mas some quando entro de novo"): `server/nuvem.js` (Upstash Redis do Vercel
  Marketplace: `KV_REST_API_URL`/`KV_REST_API_TOKEN` ou `UPSTASH_REDIS_REST_*`; `keys.nuvem`), `GET/PUT /api/dados` pelo
  **código da conta** (chave no Redis = sha256 do código). Cliente `src/store/nuvem.js`: `iniciarNuvem()` no `main.jsx` puxa e
  `juntar(local, nuvem)` (listas por id, conversa com mais mensagens, site com status mais adiantado, memórias e nichos somados),
  salva 2 s depois de cada mudança, puxa de novo ao voltar para a aba e a cada 60 s. Página `/nuvem` (código, copiar, usar o
  código de outro aparelho, passo a passo para ligar) e status no menu. Vídeos e ZIPs (IndexedDB) ficam no aparelho.

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
