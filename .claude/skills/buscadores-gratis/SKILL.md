---
name: buscadores-gratis
description: Acha APIs de busca na web grátis (ou com créditos mensais) e liga uma nova na fila de buscadores do Pinguim (server/buscaWeb.js) da Central de Agentes. Use quando o usuário disser "acabou o crédito da busca", "acha outra API de busca grátis", "adiciona o buscador X", "o Pinguim parou de conferir" ou pedir para revisar os planos grátis dos buscadores.
---

# Buscadores grátis da Central de Agentes

O Pinguim confere "esse comércio tem site?" com 1–2 buscas na web por comércio. Essas buscas passam por uma fila em
`server/buscaWeb.js`: **Firecrawl → Tavily → Exa → Serper → Brave**. Só entra quem tem chave; se um falhar (sem crédito,
limite por minuto, fora do ar) o próximo tenta, e quem acusou falta de crédito fica de fora por 1 hora.

## 1. Pesquisar planos grátis (sempre conferir, os planos mudam)

Faça as buscas no mesmo turno e confira na página oficial de preços de cada um:
- "free web search API {mês} {ano} free tier credits"
- "<buscador> API pricing free plan {ano}"

Anote para cada um: buscas grátis, se renova todo mês, se pede cartão, endpoint, cabeçalho de autenticação e formato
da resposta. Situação em out/2026:

| Buscador | Grátis | Cartão | Endpoint / chave |
|---|---|---|---|
| Firecrawl | 1.000 créditos/mês | não | `POST api.firecrawl.dev/v2/search`, `Authorization: Bearer fc-…` |
| Tavily | 1.000 buscas/mês | não | `POST api.tavily.com/search`, `Authorization: Bearer tvly-…` |
| Exa | US$ 10/mês em créditos | não | `POST api.exa.ai/search`, `x-api-key` |
| Serper (Google) | 2.500 uma vez só | não | `POST google.serper.dev/search`, `X-API-KEY` (40 hex) |
| Brave | US$ 5/mês (~1.000) | **sim** | `GET api.search.brave.com/res/v1/web/search`, `X-Subscription-Token` (BSA…) |

Fora da fila de propósito: Bing (API encerrada em 2025), Google Programmable Search (fechada para clientes novos),
scraping do Google/DuckDuckGo sem API (quebra os termos e bloqueia), Jina (grátis só para uso não comercial).

## 2. Ligar um buscador novo na fila

1. Em `server/buscaWeb.js`, acrescente um item em `PROVEDORES` com `id`, `nome`, `chave()` (variável de ambiente),
   `pedir(q, chave, n)` usando `chamar(url, cabecalhos, corpo)` e `ler(dados)` devolvendo `[{ url, title, description }]`.
   Peça resultados do Brasil e em português quando a API aceitar (país/idioma).
2. Em `server/app.js`: `apelido('NOVO_API_KEY', /nome/i, /formato-da-chave/)` (o usuário cola a chave com qualquer nome
   no Vercel) — o `/api/status` já mostra o novo em `keys.buscadores`.
3. `src/lib/buscadores.js`: nome bonito em `NOMES`. `src/pages/Projeto.jsx`: link e o plano grátis.
4. `.env.example`: a variável com o link para pegar a chave e o plano grátis.
5. CLAUDE.md: uma linha na seção do Pinguim.

## 3. Testar sem gastar crédito

A rede da sessão na nuvem costuma bloquear essas APIs; teste com `fetch` falso (modelo em
`testes/buscadores.mjs` (roda com `npm test`)): só o novo com chave, o anterior sem crédito (402) → o novo,
limite por minuto (429), todos sem crédito (o erro tem que casar com `erroDeCredito` para virar `SEM_CREDITO`), e
`conferirSite` achando o domínio pelo novo. Depois `npm run build`.

## Regras

- Nunca cadastre conta nem ponha cartão em nome do usuário: diga o link e o plano grátis, ele cria a chave.
- Nunca ponha chave no código nem no git; só em `server/.env` (local) ou nas variáveis do Vercel.
- Só APIs oficiais. Nada de raspar o Google ou burlar limites.
