# Central de Agentes 🐧🦁🐈‍⬛🐯🐝

> Um detalhe entra. Um fluxo completo sai.

Web app que orquestra 5 agentes para encontrar comércios sem site, criar o site, refinar,
auditar e fechar a venda.

## Rodar

```bash
npm install
cp .env.example server/.env   # chaves opcionais: GOOGLE_PLACES_API_KEY e FIRECRAWL_API_KEY
npm run dev                   # sobe o site (5173) e a API (8787)
```

Abra http://localhost:5173. **Funciona sem nenhuma chave**: o Pinguim usa o OpenStreetMap (grátis).
Só se o backend estiver fora do ar o app cai no **modo demonstração** (resultados marcados DEMO).

| Agente | Situação |
|--------|----------|
| 🐧 Pinguim | Real — Google Maps via Apify (ou lendo a página do Maps com o Firecrawl); reservas: SerpApi, Google Places, OpenStreetMap |
| 🦁 Leão | Real — cole o link do Pinguim (Maps, Instagram ou WhatsApp); tira print, pega fotos e gera o ZIP |
| 🐈‍⬛ Gato Negro | Real — site animado (4 temas), prévia ao vivo, aprovação, vídeo da prévia e ZIP final |
| 🐯 Tigre | Real — mensagens (Claude ou modelos), envio aprovado por você (Z-API, Meta ou seu WhatsApp), leitura das respostas, publicação no Vercel |
| 🐝 Abelha | Real — auditoria com nota, dados públicos com fonte (você aprova), SEO e pasta final |

### Chaves

- **Apify** (recomendada para o Maps): crie a conta em https://console.apify.com, vá em *Settings → API &
  Integrations* e copie o *Personal API token* para `APIFY_TOKEN`. Usa o ator Google Maps Scraper
  (a partir de US$ 1,50 por 1.000 lugares; o plano grátis traz crédito mensal). Cada busca leva 1–2 minutos.

- **SerpApi** (recomendada para o Maps): crie a conta grátis em https://serpapi.com (250 buscas/mês) e copie a
  *Private API Key* do painel para `SERPAPI_KEY`. Cada busca traz até 20 negócios do Google Maps, com foto de capa.

- **Google Places API (New)** (opcional, reserva — traz fotos para o Leão): Google Cloud → ative "Places API (New)" e o faturamento →
  crie uma chave. Sem ela, ou se ela falhar, o Pinguim usa o **OpenStreetMap** — grátis, mas com menos comércios
  cadastrados (fotos só vêm do Google).
- **Firecrawl** (recomendada): https://www.firecrawl.dev → API key. Com ela o Pinguim busca direto no
  **Google Maps** (5 créditos por busca, sem precisar da chave/faturamento do Google) e confirma se o negócio
  tem domínio próprio. Sem ela, usa Google Places ou OpenStreetMap e a confiança fica "Médio".

- **Z-API** (envio de WhatsApp pelo Tigre, opcional): painel Z-API → Instâncias → editar → copie o
  **ID da instância** e o **Token** para `ZAPI_INSTANCE_ID` e `ZAPI_TOKEN`. Se ativou o "Token de segurança
  da conta", coloque-o em `ZAPI_CLIENT_TOKEN`. Cada mensagem continua passando pela sua aprovação.

### Vídeo da prévia (Gato Negro)

O Gato grava um vídeo curto do site (formato de celular, MP4) para mandar ao cliente. Funciona com o app
rodando no seu computador — na primeira vez, baixe o navegador usado na gravação:

```bash
npx playwright-core install chromium
```

### Publicar no Vercel

Importe a pasta `central-agentes` como projeto (framework Vite). A API sobe sozinha como função em `api/`.
Configure as mesmas chaves em *Settings → Environment Variables*.

## Continuar com o Claude Code

```bash
cd central-agentes
claude
```

Peça, por exemplo: *"Leia o CLAUDE.md e implemente o passo 1 (backend) e o passo 2 (Pinguim real)."*

## Estrutura

```
central-agentes/
├── CLAUDE.md            ← guia para o Claude Code
├── prompts/             ← system prompt de cada agente
├── server/              ← API (Hono): rotas e chaves de API
├── api/                 ← mesma API como função do Vercel
├── public/
├── src/
│   ├── components/      ← Layout, OrchestraHub, AgentBadge, LogConsole, LeadsTable
│   ├── data/agents.js   ← configuração dos 5 agentes
│   ├── lib/             ← utilitários (wa.me, nome do ZIP)
│   ├── pages/           ← Dashboard, AgentPage, Projeto
│   ├── services/        ← chamadas dos agentes (modo demo por enquanto)
│   └── store/           ← estado do pipeline
└── .env.example         ← modelo do server/.env (chaves só no backend)
```
