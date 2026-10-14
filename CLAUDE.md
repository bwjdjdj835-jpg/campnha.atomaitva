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
  - `server/app.js` aceita chaves com outro nome de variável (`apelido`): "google" (`AIza…`), "fire" (`fc-…`), "blob".
  - `POST /api/gato/video` (`server/video.js`) — grava ~12 s da prévia em 390×844 com Chromium (playwright-core,
    opcional) e converte para MP4 H.264 (ffmpeg-static, opcional). Só quando o servidor tem navegador de verdade
    (`keys.videoServidor` = `servidorGrava()`: fora de Vercel/Netlify e o executável do Chromium existe); se a
    gravação no servidor falhar, o Gato cai para a gravação no navegador (pede novo clique se já passou do tempo
    em que o navegador aceita `getDisplayMedia`). **No Vercel** o Gato grava no navegador do usuário
    (`gravarPreviaNoNavegador` em `src/lib/previa.jsx`: `getDisplayMedia` com `preferCurrentTab`, recorte no iframe
    com Region Capture, `MediaRecorder` em MP4 quando o navegador grava MP4, senão WebM; a prévia recebe
    `postMessage({ tipo: 'passeio-previa' })` e passa um cursor na capa e rola a página). Chrome/Edge no computador.
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
  **Robô** (resposta automática, menu, assistente virtual — regex `BOT`, intenção `bot`, status "Respondeu um robô") →
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
  `conversas[siteId].rascunho`. O site fica com status `revisar`; **nada é enviado**. Limite do Firecrawl: `gastar(n)`
  (8 pedidos/min). Vídeo: servidor local grava sozinho; no Vercel `pedirGravacaoDaAba()` UMA vez no clique de começar e
  `gravarComFluxo(stream, iframe)` por cliente (iframe fixo no canto). Nichos concluídos ficam em `pipeline.auto.feitos`
  (continua de onde parou; "Recomeçar do 1º nicho"). Wake Lock + aviso ao fechar a aba.
  **Tela inicial:** botão "Iniciar inteligência artificial automática" — pede a gravação da aba no próprio clique
  (`guardarFluxo`), abre `/automatico?iniciar=1` (começa sozinho com `pegarFluxo()` e as opções salvas) e, ao terminar
  com clientes prontos, abre o Tigre.
  **Rápido por padrão** (pedido do usuário: "só gravar o vídeo e mandar mensagem"): estudo do Gato de **1 minuto** só no
  1º site de cada nicho (os outros reaproveitam; `nenhum` = sem estudo) e Abelha desligada (opções `v: 3` em
  `central-agentes:automatico`); vídeo de 9 s; o
  vídeo + mensagem de um cliente (`finalizar`) roda enquanto o próximo site é montado (`montarSite`, fila `filaFinal`).
  Status do site: `preparando` → `revisar` (vídeo e mensagem prontos). O quadro de gravação fica montado a rodada
  inteira (`gravarComFluxo` só recorta de novo se o quadro mudar e tem tempo máximo em cada passo — antes o 2º vídeo travava).
  **Um nicho por vez** (pedido do usuário): `rodarAutomatico` para depois do 1º nicho com cliente pronto (nicho sem
  cliente passa direto) e devolve `resumo.proximo` (`proximoNicho`). O próximo só começa pela Área do Administrador,
  quando não há nada para aprovar nem sendo preparado: botão "Começar: <nicho>" → `prepararInicio` (pede a gravação no
  clique; a tela inicial usa o mesmo) → `/automatico?iniciar=1`. Antes, o automático seguia sozinho para o nicho
  seguinte e, se você saísse da página para aprovar, a gravação era encerrada (salão ficou sem vídeo).
  Ao terminar abre a **Área do Administrador** (`/admin`, `src/pages/Admin.jsx`, contador no menu): cartões "Para aprovar"
  com vídeo e mensagem editável em **dois passos** (o wa.me só leva texto, e compartilhar vídeo + texto juntos faz o
  WhatsApp largar o vídeo): 1️⃣ vídeo — "Mandar o vídeo no WhatsApp" (Web Share só com o arquivo) / "Salvar vídeo (MP4)"
  (Downloads; anexar pelo 📎); 2️⃣ mensagem — "Aprovar e abrir no WhatsApp" (wa.me com DDI 55) / "Copiar"; mais "Ver
  prévia", "Gerar outra", "Ajustar no Gato", "Descartar". Gravação prioriza MP4 H.264 (`TIPO_VIDEO`, 4 Mbps, quadro-chave a cada 1 s; o
  tipo do blob guarda o codec — "video/mp4" sem codec vira `codecs=vp9`, pois só é escolhido sem H.264) e avisa quando
  `videoAceitoNoWhatsApp` é falso. O vídeo (automático e Gato) usa `htmlDaPrevia(..., CSS_GRAVACAO, { agua: false })`:
  sem água e sem granulado, que no vídeo comprimido pareciam defeito ("vídeo bugado");
  "Já enviei" registra a mensagem (+ vídeo) na conversa (status `contatado`, site `aprovado`). Aba "Enviados" com selo e
  "Responder no Tigre" (`/agente/tigre?cliente=<id>` abre a conversa). O Tigre também mostra a fila (`FilaAprovacao.jsx`).
- Estado global simples em `src/store/pipeline.js` (localStorage): `leads`, `sites`, `conversas`, `comSite`, `contatos`;
  `lerPipeline()` lê o estado atual fora do React (laço da conferência).

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
