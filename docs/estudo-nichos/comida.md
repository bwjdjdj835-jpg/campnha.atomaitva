# Estudo: sites de uma página para comércios de comida

Nichos: pizzaria · hamburgueria · lanchonete · restaurante · açaí · padaria · confeitaria
Objetivo do site: o visitante **chamar/pedir no WhatsApp**, **reservar** ou **ir até o local**.
Pesquisa feita em 15/10/2026. As paletas marcadas como "observada" foram extraídas pelo Firecrawl (`branding`) da página
inicial real do site citado. As marcadas como "proposta" são minhas, montadas a partir das observadas.

> **Sobre números:** quase todas as estatísticas de conversão que existem na web sobre sites de restaurante vêm de
> empresas que vendem software para restaurantes (Chowly, UpMenu etc.). Cito algumas abaixo **sempre com a fonte** e
> com o aviso de que são dados de fornecedor, não estudos independentes. Não use esses números na conversa com o cliente
> como se fossem fato comprovado.

---

## 0. O que vale para TODOS os nichos de comida

### 0.1 Princípios (consenso das fontes)
- **Nos primeiros segundos a pessoa precisa saber 3 coisas: o que você vende, onde fica e como pedir.** (Chowly, guia 2026;
  resumo do guia da DoorDash visto na busca diz o mesmo.)
- **Cardápio em HTML, nunca PDF.** PDF é ruim de ler no celular e o Google não lê direito. A Chowly afirma que quem trocou
  PDF por cardápio em HTML teve "até 58% mais pedidos concluídos" e que "89% dos usuários têm dificuldade com PDF no
  celular" — números de fornecedor, sem estudo primário citado.
- **Botão de pedir repetido**: no topo, na capa, dentro do cardápio e **fixo na tela** ao rolar. A Chowly cita casos
  (Smokin' Oak: +30% de pedidos digitais com botão "Order Online" visível; Mr. Jim's Pizza: +25% com botão flutuante) —
  são cases do próprio fornecedor.
- **Endereço, telefone e horário visíveis em todo lugar**, endereço com link para "Como chegar" e mapa embutido.
  Nome/endereço/telefone iguais aos do Perfil da Empresa no Google (NAP) ajudam na busca local.
- **Foto boa dos 10–15 itens mais vendidos**, não de tudo (Chowly). Luz natural, fundo limpo, ângulo de cima para
  pratos/bowls e 45° para itens altos (hambúrguer, bolo, sanduíche).
- **Velocidade**: a Chowly recomenda carregar em menos de 2 s no celular e LCP ≤ 2,5 s; texto ≥ 16 px; áreas de toque
  ≥ 44×44 px; nada de pop-up, vídeo com som automático ou música.
- **Organize o cardápio como o cliente pensa** ("Para dividir", "Clássicos", "Doces") e não como a cozinha organiza.
  Descrição que dá água na boca vende mais que só o nome do prato.
- **iFood/apps**: a Chowly argumenta que o botão principal não deve mandar o cliente para um marketplace que cobra
  comissão. Para o nosso público (comércio local brasileiro), a tradução prática é: **WhatsApp como botão principal**
  (sem comissão) e iFood/99Food como botão **secundário** ("Também estamos no iFood"), para quem prefere pagar pelo app.
- **WhatsApp é o canal de venda do ramo no Brasil.** A Saipos (fornecedor) cita levantamento do Instituto Foodservice Brasil
  dizendo que 35%–45% das vendas do setor fecham pelo WhatsApp — vi isso só no resultado de busca, não abri o relatório.

### 0.2 Esqueleto de uma página (base que cada nicho adapta)
1. **Barra fixa no topo** — logo/nome, "Cardápio", "Onde estamos", botão "Pedir no WhatsApp". Selo **"Aberto agora"**.
2. **Capa** — foto grande do carro-chefe, 1 frase de valor, 2 botões (primário WhatsApp, secundário Cardápio/Como chegar),
   linha de prova social real (nota do Google e nº de avaliações, se houver).
3. **Destaques / mais pedidos** — 3 a 6 cards com foto, nome, descrição curta, preço (se real) e "Pedir este".
4. **Cardápio completo** — abas por categoria, fixas ao rolar.
5. **Como pedir** — 3 passos (escolha → chame no WhatsApp → retire/receba), formas de pagamento (Pix, cartão, dinheiro),
   área/taxa de entrega se o cliente informou.
6. **História / diferencial** — curto: quem faz, desde quando, o que torna diferente (só dado real).
7. **Avaliações reais** — do Google, com link "Ver todas no Google".
8. **Galeria / ambiente** (restaurante, padaria, confeitaria).
9. **Onde estamos** — endereço, mapa, horário da semana inteira, "Como chegar".
10. **Chamada final** + rodapé com contato e redes.
11. **Botão de WhatsApp fixo** no canto (ou barra inferior no celular).

### 0.3 Interações comuns (receitas em HTML/CSS/JS leve)

**a) Botão de WhatsApp com o item já escrito**

```html
<button class="pedir" data-item="Pizza Margherita grande">Pedir este</button>
<script>
const ZAP = '5569999999999'; // DDI 55 + DDD + número, só dígitos
document.addEventListener('click', e => {
  const b = e.target.closest('[data-item]'); if (!b) return;
  const txt = `Olá! Vi o site e quero pedir: ${b.dataset.item}.`;
  window.open(`https://wa.me/${ZAP}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener');
});
</script>
```
Formato `https://wa.me/<número>?text=<texto codificado>`; o texto aparece na caixa e a pessoa ainda aperta enviar
(conforme guia da Unipile visto na busca; confira na documentação "Click to Chat" do WhatsApp). Sempre use
`encodeURIComponent` (quebra de linha = `%0A`).

**b) "Sacola" simples que monta a mensagem** (sem checkout, sem backend)

```js
const sacola = [];
function add(nome, preco){ sacola.push({nome, preco}); render(); }
function mensagem(){
  const linhas = sacola.map(i => `• ${i.nome}${i.preco ? ' — R$ ' + i.preco.toFixed(2).replace('.', ',') : ''}`);
  const total = sacola.reduce((s,i)=>s+(i.preco||0),0);
  return `Olá! Quero fazer um pedido:\n${linhas.join('\n')}\n${total ? 'Total: R$ ' + total.toFixed(2).replace('.', ',') + '\n' : ''}Entrega ou retirada?`;
}
// botão: location.href = `https://wa.me/${ZAP}?text=${encodeURIComponent(mensagem())}`
```
Barra inferior fixa mostrando "2 itens · Enviar pedido no WhatsApp". Só mostre preço se o comércio informou.

**c) Selo "Aberto agora / Fecha às 23h / Abre amanhã às 18h"** (aceita horário que passa da meia-noite)

```js
// 0=domingo ... 6=sábado. Faixas em minutos; fechar depois da meia-noite: "18:00-01:00".
const HORARIO = {0:['18:00-23:30'],1:[],2:['18:00-23:30'],3:['18:00-23:30'],4:['18:00-23:30'],5:['18:00-01:00'],6:['18:00-01:00']};
const m = s => { const [h,mm] = s.split(':').map(Number); return h*60+mm; };
function status(agora = new Date()){
  const d = agora.getDay(), min = agora.getHours()*60 + agora.getMinutes();
  const ontem = (d+6)%7;
  for (const f of HORARIO[ontem]) { const [a,b] = f.split('-').map(m); if (b < a && min < b) return {aberto:true, fecha:f.split('-')[1]}; }
  for (const f of HORARIO[d]) { const [a,b] = f.split('-').map(m);
    if (b < a ? min >= a : (min >= a && min < b)) return {aberto:true, fecha:f.split('-')[1]}; }
  return {aberto:false};
}
```
Mostrar verde "● Aberto agora · fecha às 23:30" / cinza "Fechado · abre hoje às 18:00". O horário vem dos dados reais
(Google Maps). O mesmo objeto gera o JSON-LD `openingHoursSpecification` (ver 0.4). Atenção: o relógio é o do aparelho
do visitante; para comércio local isso basta (mesmo fuso).

**d) Cardápio com abas fixas + destaque da aba ao rolar (scroll-spy)**

```css
.abas{position:sticky;top:64px;display:flex;gap:.5rem;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch}
.abas a{scroll-snap-align:start;white-space:nowrap;padding:.6rem 1rem;border-radius:999px}
.abas a[aria-current="true"]{background:var(--destaque);color:var(--sobre-destaque)}
section[id]{scroll-margin-top:120px}
```
```js
const links = [...document.querySelectorAll('.abas a')];
const io = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  links.forEach(l => l.setAttribute('aria-current', l.hash === '#' + e.target.id));
  document.querySelector(`.abas a[href="#${e.target.id}"]`)?.scrollIntoView({inline:'center', block:'nearest'});
}), {rootMargin:'-40% 0px -55% 0px'});
document.querySelectorAll('.cardapio section[id]').forEach(s => io.observe(s));
```
Padrão que aparece em apps de delivery: abas entram no cabeçalho fixo, no celular rolam para o lado, e a aba ativa
acende sozinha ao rolar. Para cardápio grande, um campo "Buscar no cardápio" filtrando por texto
(`item.hidden = !item.textContent.toLowerCase().includes(q)`).

**e) Filtros/selos** — "🌱 Vegetariano", "Sem glúten", "Mais pedido", "Novo" como `data-tags="veg sem-gluten"`; botões
de filtro escondem os outros. Só use selos que o comércio confirmou.

**f) Carrossel leve (só CSS)** — `display:flex; overflow-x:auto; scroll-snap-type:x mandatory;` + `scroll-snap-align:center`
nos cards; setas opcionais com `el.scrollBy({left: el.clientWidth*0.8, behavior:'smooth'})`. Sem biblioteca.

**g) Mapa que não pesa** — carregue o iframe do Google Maps só quando a seção aparece (`loading="lazy"` no iframe, ou
trocar uma imagem estática pelo iframe ao clicar "Ver mapa"). Botão "📍 Como chegar":
`https://www.google.com/maps/dir/?api=1&destination=<endereço codificado>`.

**h) Animações** — entrada ao rolar com `IntersectionObserver` adicionando `.visivel` (opacity + translateY 16px,
300–500 ms); contador de nota (4,8 ★) só com nota real; respeitar `@media (prefers-reduced-motion: reduce)`.
Hover em card de produto: `transform: translateY(-4px)` + sombra. Nada de animação que atrase o botão de pedir.

**i) Barra inferior no celular** — 2–3 botões grandes fixos: "WhatsApp" · "Ligar" (`tel:`) · "Como chegar". Bom para
quem chega pelo Google Maps já com fome.

### 0.4 SEO local (JSON-LD)
Use o tipo certo: `Restaurant`, `FastFoodRestaurant`, `Bakery`, `IceCreamShop`/`CafeOrCoffeeShop` (açaí costuma
encaixar em `FoodEstablishment` ou `Restaurant`). Campos: `name`, `address`, `telephone`, `geo`, `servesCuisine`,
`priceRange` (só se real), `hasMenu` (URL `#cardapio`), `acceptsReservations`, `openingHoursSpecification`
(`dayOfWeek`, `opens`, `closes`), `aggregateRating` **só se for a nota real e houver como comprovar**. Título:
"Pizzaria X em Cacoal – RO | Delivery e retirada". Meta description com cidade + o que vende + "peça pelo WhatsApp".

---

## 1. PIZZARIA

### 1.1 Ordem das seções
1. **Topo fixo** com "Pedir no WhatsApp" e selo "Aberto agora" — pizzaria vende à noite; o "aberto/fechado" evita a
   mensagem perdida.
2. **Capa** com a pizza inteira (ou fatia puxando queijo) + frase de valor + botões "Pedir agora" / "Ver sabores".
   UpMenu destaca capas com imagem grande e vídeo do processo (Gino's East usa vídeo no lugar da foto; Pasquale Jones
   mostra o preparo); Lou Malnati's usa carrossel de ofertas na capa.
3. **Mais pedidas** (3–6 sabores) com "Pedir esta".
4. **Cardápio por abas**: Tradicionais · Especiais · Doces · Bebidas · (Combos). Tamanhos (P/M/G/família) e regra de
   "meia a meia" explicadas uma vez, no topo do cardápio.
5. **Promoções/combos do dia** (só se reais) — UpMenu aponta "Order Now" ao lado de cada oferta (Domino's, Marco's).
6. **Como pedir** + taxa/área de entrega + pagamento.
7. **O forno / a massa** (diferencial: forno a lenha, fermentação natural — se for verdade). Bráz (SP) baseia a
   comunicação em "fermentação natural, farinha italiana, forno a lenha" e na história da família.
8. **Avaliações** → **Onde estamos + horário** → **Chamada final**.

Por quê: a decisão de pizza é rápida e noturna; quem entra quer ver sabor e preço e pedir. A história vem depois
(serve para justificar preço), não antes do cardápio.

### 1.2 Direção visual
| Paleta | Fundo | Texto | Primária | Secundária / destaque | Origem |
|---|---|---|---|---|---|
| Cantina clássica clara | `#FFF9EE` (creme) | `#191919` | `#CE2A1E` (vermelho tomate) | `#FDB912` (amarelo) + botão `#316131` (verde manjericão) | **Observada** — Rubirosa (NY) |
| Tradição italiana | `#FFFFFF` | `#000000` | `#A83339` (vinho/tomate) | `#F1E1CF` (creme de farinha) + `#25D366` (WhatsApp) | **Observada** — Bráz Pizzaria (SP) |
| Forno a lenha escuro | `#141210` | `#F3ECE2` | `#E0552B` (brasa) | `#C9A227` (dourado) | **Proposta** |

Fontes:
- Rubirosa: títulos **Karla**, texto **Josefin Sans** (ambas no Google Fonts), botão em pílula (raio 50 px).
- Bráz: texto **Source Sans Pro** (Google Fonts: "Source Sans 3"), título com fonte display decorativa própria.
- Equivalentes sugeridos: títulos com caráter de cantina — **Playfair Display**, **DM Serif Display**, **Abril Fatface**
  (só títulos); texto **Inter**, **Karla**, **Source Sans 3**.
Fotos: pizza inteira vista de cima (mostra todos os ingredientes), fatia sendo puxada (queijo), forno/pá com fogo ao
fundo em tom quente. Fundo de madeira ou pedra. Evite flash e fundo branco estourado.

### 1.3 Interações
- **Montar meia a meia** (escolhe tamanho → sabor 1 → sabor 2 → borda) e mandar no WhatsApp: um `<form>` com `<select>`s,
  o JS junta tudo em texto (ver 0.3-b). Ex.: "Pizza G — ½ Calabresa + ½ Frango c/ catupiry — borda de cheddar".
- Abas fixas do cardápio + busca por sabor.
- Selo "Aberto agora · entregas até 23h30".
- Botão secundário "Também no iFood" (abre o link da loja no app), menor que o do WhatsApp.
- Vídeo curto em loop sem som na capa (≤ 3 MB, `muted playsinline autoplay loop`, com `poster`), só se o cliente tiver
  vídeo real; senão foto.

### 1.4 Textos que vendem (exemplos meus)
- Capa: "Massa de longa fermentação, forno quente e borda no ponto. Peça a sua em 1 minuto pelo WhatsApp."
- "Hoje é dia de pizza? A gente já está com o forno aceso."
- Botões: "Pedir agora no WhatsApp", "Montar meio a meio", "Ver todos os sabores".
- Como pedir: "1. Escolha os sabores · 2. Mande no WhatsApp · 3. Receba quentinha ou retire no balcão."
- Final: "Bateu a fome? Seu pedido sai do forno direto para a sua mesa."
(Só fale em "fermentação natural", "forno a lenha", "tempo de entrega" se o comércio confirmar.)

### 1.5 Erros comuns
- Cardápio em foto/PDF do panfleto (ilegível no celular).
- Não explicar tamanhos (quantas fatias/cm) e regra do meia a meia → mensagens de dúvida no WhatsApp.
- Esconder o horário: pizzaria abre à noite; quem entra às 15h sem saber disso desiste.
- Botão principal mandando para o iFood (comissão) em vez do WhatsApp do próprio comércio.
- Foto de banco de imagem de pizza que não é a da casa.

---

## 2. HAMBURGUERIA e LANCHONETE (agrupadas)

Hamburgueria artesanal: mais "marca", tipografia forte, foto épica do burger. Lanchonete: mais cardápio, preço e
rapidez (salgados, lanches, sucos, porções); visual mais simples e direto.

### 2.1 Ordem das seções
1. **Topo fixo** + "Pedir no WhatsApp".
2. **Capa** com o burger carro-chefe em 45° (ou "explodido" em camadas) e tipografia gigante. Conceitos de vitrine (Contra:
   "Burgeon", "BURGY") usam letra condensada enorme que sai da tela e botão "Order Now" fixo ao rolar.
3. **Carro-chefe / mais pedidos** (3–4 cards grandes).
4. **Cardápio por abas**: Burgers · Smash · Combos · Porções · Bebidas · Sobremesas (lanchonete: Lanches · Salgados ·
   Pratos/PF · Sucos · Porções).
5. **Monte o seu / adicionais** (bacon, cheddar, ponto da carne) — se a casa oferece.
6. **Combos e promoções do dia** (só reais).
7. **Diferencial**: blend próprio, pão de fermentação própria, batata cortada na casa (Honest Burgers fala em carne da
   própria açougue e batata britânica cortada e frita no dia — a lógica "de onde vem o ingrediente" funciona).
8. **Avaliações** → **Onde estamos + horário** → **Chamada final**.

### 2.2 Direção visual
| Paleta | Fundo | Texto | Primária | Destaque | Origem |
|---|---|---|---|---|---|
| Verde escuro + mostarda | `#1D3012` | `#E8E8E4` | `#B9D694` (verde claro) | `#FFB000` (mostarda) | **Observada** — Honest Burgers (UK), tema escuro |
| Branco limpo + verde | `#FFFFFF` | `#000000` | `#418613` (verde, botões pílula) | `#DC0000` / `#FF3C3C` (vermelho) | **Observada** — Shake Shack (EUA) |
| Smash noturno | `#111111` | `#F5F0E6` | `#FF5A1F` (laranja chapa) | `#FFD23F` (cheddar) | **Proposta** (na linha do conceito "âmbar/creme/chocolate" do Burgeon) |
| Lanchonete alegre | `#FFF8E7` | `#2B1D14` | `#E63946` (ketchup) | `#FFB703` (mostarda) | **Proposta** |

Fontes:
- Shake Shack: **Jost** (Google Fonts) em tudo, botões pílula (raio ~40 px).
- Honest Burgers: títulos com fonte condensada pesada (fallback Impact).
- In-N-Out (referência vista na busca, shadcn.io): **Montserrat** pesada em caixa alta, vermelho sobre branco.
- Equivalentes Google: títulos **Anton**, **Bebas Neue**, **Oswald**, **Archivo Black**, **Bricolage Grotesque** (800);
  texto **Inter**, **Jost**, **DM Sans**.
Fotos: 45° na altura do burger (mostra as camadas), fundo escuro ou de cor sólida, queijo escorrendo, pão brilhando;
"ingredientes flutuando" funciona bem em hamburgueria artesanal. Lanchonete: foto do balcão/estufa cheia e do lanche
montado, luz clara.

### 2.3 Interações
- **Monte seu burger**: checkboxes de adicionais com preço (`data-preco`), total ao vivo, texto para o WhatsApp
  ("X-Bacon + cheddar extra, ponto ao ponto, sem cebola").
- Campo **"Observações"** (sem cebola, ponto da carne) que entra na mensagem.
- **Barra inferior fixa** com o total da sacola.
- Faixa marquee com os nomes dos burgers (CSS `@keyframes` com `transform: translateX`, pausa em `:hover` e em
  `prefers-reduced-motion`).
- Hover no card: leve zoom na foto (`scale(1.04)`) + sombra.
- Lanchonete: **"Prato do dia"** em destaque que muda pelo dia da semana (`new Date().getDay()` → objeto com o PF de cada
  dia, só com dado do cliente).

### 2.4 Textos que vendem (exemplos meus)
- Hamburgueria: "Smash na chapa quente, crosta crocante e queijo derretendo. Seu burger em poucos toques."
- "Chega de burger sem graça. Aqui o pão é macio, a carne é suculenta e o cheddar é de verdade."
- Botões: "Quero esse burger", "Montar o meu", "Pedir combo no WhatsApp".
- Lanchonete: "Lanche caprichado, preço justo e sai rapidinho." / "Fome de meio-dia? O prato do dia já está saindo."
- Final: "Bateu a vontade? Manda um 'oi' que a chapa já tá quente."

### 2.5 Erros comuns
- Tipografia gigante que empurra o botão de pedir para fora da primeira tela no celular.
- Fundo escuro com texto cinza fraco (contraste baixo). Conferir contraste ≥ 4,5:1.
- Lista de adicionais sem preço → negociação no WhatsApp.
- Fotos escuras demais sem luz no produto (o burger some no fundo preto).
- Lanchonete com 120 itens sem categorias nem busca.

---

## 3. RESTAURANTE (almoço/jantar, self-service, à la carte)

### 3.1 Ordem das seções
1. **Topo fixo** com 2 ações: "Reservar" (WhatsApp com data/pessoas) e "Cardápio".
2. **Capa** com prato assinatura ou salão cheio; nome + tipo de cozinha + bairro; botões "Reservar mesa" / "Ver cardápio".
3. **Cardápio** (abas: Entradas · Principais · Sobremesas · Bebidas; ou "Almoço" / "Jantar"). Self-service: preço do
   quilo e o que costuma ter.
4. **Experiência / ambiente** (galeria: salão, cozinha, equipe).
5. **História / chef / origem** — Mocotó (SP) conta a história de fundação e a cozinha sertaneja; Rubirosa resume como
   "clássicos ítalo-americanos reinventados". Uma frase clara do que é a cozinha ajuda Google e cliente.
6. **Eventos e grupos / encomendas** (Rubirosa tem "Events & Catering"; Pasquale Jones e Rubirosa dão acesso fácil a
   reservas, cardápios e eventos — UpMenu).
7. **Delivery/retirada** (se faz).
8. **Avaliações e reconhecimentos reais** (prêmios só com fonte).
9. **Onde estamos + horário (almoço e jantar separados) + estacionamento**.

Por quê: restaurante vende experiência e hora marcada; a reserva é a conversão principal, o cardápio é o que convence.

### 3.2 Direção visual
| Paleta | Fundo | Texto | Primária | Destaque | Origem |
|---|---|---|---|---|---|
| Regional quente | `#FDB913` (amarelo) | `#684642` (marrom) | `#4D2F29` (marrom escuro) | `#FFFFFF` | **Observada** — Mocotó (SP) |
| Cantina creme | `#FFF9EE` | `#191919` | `#CE2A1E` | `#316131` | **Observada** — Rubirosa |
| Jantar elegante | `#0F0F0E` | `#EDE6DA` | `#B08D57` (latão) | `#6B1F2A` (vinho) | **Proposta** |
| Caseiro claro | `#FAF7F2` | `#2A2420` | `#7A8B5C` (oliva) | `#C8553D` (terracota) | **Proposta** |

Fontes: Mocotó usa **Raleway** (Google) no texto. Para restaurante: títulos **Playfair Display**, **Cormorant Garamond**
(só títulos grandes — traço fino some em tamanho pequeno), **Fraunces**; texto **Lato**, **Inter**, **Karla**.
Os blogs de tipografia vistos sugerem no máximo 2–3 fontes (uma para títulos, uma para texto).
Fotos: escolha UM estilo e mantenha — **claro e arejado** (luz difusa, sombras suaves, transmite frescor) ou **escuro e
dramático** (claro-escuro, mais "premium"), segundo os guias de fotografia vistos (Expert Photography/Nikon, na busca).
Pratos de cima (mesa posta) + detalhe a 45° + mãos servindo.

### 3.3 Interações
- **Reserva pelo WhatsApp**: mini formulário (data `<input type="date">`, horário, nº de pessoas, nome, ocasião) → texto
  "Olá! Quero reservar para 4 pessoas no sábado 18/10 às 20h. Nome: Ana." Sem prometer confirmação automática:
  "Respondemos para confirmar."
- **Almoço x jantar**: troca de aba automática pela hora (antes das 16h abre "Almoço").
- **Cardápio do dia / PF da semana** (por dia da semana).
- Galeria com lightbox simples (`<dialog>` nativo + `<img>` maior).
- Agendamento externo (se o restaurante usar alguma ferramenta de reserva com link) embutido ou como botão.

### 3.4 Textos que vendem (exemplos meus)
- Capa: "Comida de verdade, feita com calma, servida com carinho. Reserve sua mesa."
- "Almoço pronto em minutos, sabor de comida de casa." (self-service/PF)
- "Aniversário, reunião ou jantar a dois: a gente separa a mesa para você."
- Botões: "Reservar pelo WhatsApp", "Ver o cardápio de hoje", "Como chegar".

### 3.5 Erros comuns
- Horário confuso (almoço e jantar misturados, sem indicar segunda fechado).
- Só fotos do salão vazio ou só do letreiro.
- Prometer "reserva confirmada" num formulário que só abre o WhatsApp.
- Usar prêmio ou "o melhor da cidade" sem fonte.
- Fonte serifada fina em texto corrido no celular.

---

## 4. AÇAÍ (açaiteria, bowls, sorvetes)

### 4.1 Ordem das seções
1. **Topo fixo** + "Pedir no WhatsApp" + "Aberto agora" (açaí vende muito à tarde/noite e no calor).
2. **Capa** com copo/bowl cheio de cobertura, cor roxa dominando; frase curta e energética.
3. **Tamanhos e preços** (300/500/700 ml…) — no Brasil o cardápio típico é "tamanho + nº de adicionais grátis"
   (ex.: 500 ml com 3 adicionais), visto nas lojas da 99Food na busca.
4. **Monte o seu** (passo a passo: tamanho → base → adicionais grátis → extras pagos → calda).
5. **Combos / barca / promoção** (só reais).
6. **Mais pedidos / sugestões da casa** (Oakberry destaca bowls prontos: Original, Crunchy, Fruity).
7. **Diferencial** (açaí puro/grosso, sem xarope, de onde vem — só se o cliente confirmar). Oakberry fala de açaí
   orgânico da Amazônia.
8. **Avaliações** → **Onde estamos + horário** → **Chamada final**.

### 4.2 Direção visual
| Paleta | Fundo | Texto | Primária | Destaque | Origem |
|---|---|---|---|---|---|
| Roxo + creme + amarelo | `#F5EEE0` (creme) | `#4A1F60` (roxo escuro) | `#7D5393` (roxo) | `#FFBB33` (botão amarelo) | **Observada** — Oakberry |
| Roxo noturno | `#1E0B2B` | `#F7EFFF` | `#8E3FD1` | `#B6E36B` (verde limão) | **Proposta** (roxo + verde, como pedem briefings de açaí vistos na busca: "verde, roxo e branco") |
| Tropical claro | `#FFFFFF` | `#2D1340` | `#5B1E7A` | `#FF6F91` (morango) + `#FFD23F` (banana) | **Proposta** |

Fontes: Oakberry usa uma slab própria (nexaSlab). Equivalentes Google: **Roboto Slab** ou **Zilla Slab** (títulos),
ou arredondadas e simpáticas: **Fredoka**, **Baloo 2**, **Nunito** (900), **Quicksand**. Texto: **Nunito**, **DM Sans**.
Botões em pílula (Oakberry usa raio total). Formas arredondadas lembrando a fruta (o case da Project Açaí, Singapura, usa
curvas e círculos da baga — visto na busca).
Fotos: bowl de cima com coberturas organizadas em faixas; copo em 45° com a calda escorrendo; fundo de cor sólida
(creme, roxo claro) ou com frutas espalhadas. Luz clara.

### 4.3 Interações
- **Montador de açaí** (o recurso mais útil do nicho):
```html
<form id="monte">
  <fieldset><legend>Tamanho</legend>
    <label><input type="radio" name="tam" value="300 ml" data-preco="18" data-gratis="3" required> 300 ml</label>
    <label><input type="radio" name="tam" value="500 ml" data-preco="24" data-gratis="4"> 500 ml</label>
  </fieldset>
  <fieldset id="adic"><legend>Adicionais <small id="contagem"></small></legend>
    <label><input type="checkbox" name="ad" value="Leite em pó"> Leite em pó</label> …
  </fieldset>
</form>
<script>
const f = document.getElementById('monte');
f.addEventListener('change', () => {
  const t = f.querySelector('[name=tam]:checked'); const marcados = [...f.querySelectorAll('[name=ad]:checked')];
  const gratis = t ? +t.dataset.gratis : 0;
  document.getElementById('contagem').textContent = t ? `${Math.min(marcados.length, gratis)}/${gratis} grátis` : '';
  // extras acima do limite: somar data-extra de cada adicional, se o cliente cobrar
});
</script>
```
  Mensagem: "Açaí 500 ml — Leite em pó, Granola, Banana, Leite condensado (calda)."
- Contador "x de 4 adicionais grátis" com aviso quando passar.
- Animação de "gota/onda" roxa no fundo da capa (SVG com `animate` ou CSS `border-radius` animado) — leve.
- "Aberto agora" + "Peça antes das 22h".

### 4.4 Textos que vendem (exemplos meus)
- Capa: "Açaí cremoso do jeito que você gosta. Escolha o tamanho, monte e peça em segundos."
- "Calor pede açaí. E açaí bom pede cobertura caprichada."
- "Monte o seu: tamanho, adicionais e calda — a gente prepara na hora."
- Botões: "Montar meu açaí", "Pedir no WhatsApp", "Ver tamanhos".

### 4.5 Erros comuns
- Não deixar claro quantos adicionais são grátis em cada tamanho → muita pergunta.
- Roxo escuro com texto preto (ilegível) ou roxo saturado em tudo (cansa); usar creme/branco como respiro.
- Prometer "100% puro/orgânico/sem açúcar" sem confirmação.
- Fotos de bowl de outra loja ou de banco de imagem.

---

## 5. PADARIA e CONFEITARIA (agrupadas; diferenças marcadas)

### 5.1 Ordem das seções
**Padaria (pão do dia, café, lanches, encomendas de salgados):**
1. Topo fixo + "Encomendar no WhatsApp" + horário (padaria abre cedo — o "Aberto agora" importa muito).
2. Capa com pão saindo do forno / balcão cheio + "Pão quentinho a partir das 6h".
3. **Fornadas e horários** (que horas sai o pão francês, o pão de queijo) — se o cliente informar.
4. Produtos por categoria: Pães · Doces · Salgados · Café da manhã · Bolos.
5. **Encomendas** (salgados para festa, cesta de café da manhã, bolo) com prazo mínimo.
6. História / processo (fermentação natural, receitas da família — só verdade).
7. Ambiente / café no local → Avaliações → Onde estamos + horário → Chamada final.

**Confeitaria (bolos, doces finos, festas):**
1. Topo fixo + "Fazer orçamento" (WhatsApp).
2. Capa com o bolo-assinatura (fundo limpo) + "Bolos sob encomenda para o seu dia especial".
3. **Portfólio/galeria** por ocasião (Aniversário · Casamento · Chá revelação · Corporativo). Zarla mostra que confeitaria
   de festa/casamento troca o "cardápio" por **portfólio** e CTA "Agendar degustação".
4. **Sabores e recheios** (massas, recheios, coberturas) e **tamanhos** (fatias/kg/andares).
5. **Como encomendar + prazo mínimo** (Tartine pede 7 dias para bolos especiais; confeitarias brasileiras vistas na busca
   pedem de 2 dias a semanas, conforme o pedido).
6. Pronta-entrega / doces do dia (se tiver vitrine).
7. Datas especiais (Páscoa, Natal, Dia das Mães) com aviso de antecedência.
8. Avaliações → Onde estamos/retirada → Chamada final.

Por quê: na padaria a decisão é "está aberto e tem pão agora?"; na confeitaria é "confio nessa pessoa para o meu evento?"
— por isso portfólio, prazos e processo de encomenda claros.

### 5.2 Direção visual
| Paleta | Fundo | Texto | Primária | Destaque | Origem |
|---|---|---|---|---|---|
| Padaria clara e direta | `#FFFFFF` | `#000000` | `#C87E1E` (casca de pão / caramelo) | `#D9534F` | **Observada** — Tartine (EUA) |
| Retrô quente | `#F8F5F0` (creme) | `#979467` (oliva) | `#DE7D58` (laranja terracota, botão com sombra sólida deslocada) | `#97956A` | **Observada** — Self Raised (Austrália) |
| Azul acinzentado artesanal | `#96A7C9` | `#586A7E` | `#586A7E` | `#F4EBE4` (creme) | **Observada** — Bluebird Bakery (UK) — título gigante (h1 ~188 px) |
| Confeitaria pastel | `#FFFFFF` | `#00211A` (verde quase preto) | `#E7CBEF` (lilás, botão pílula, texto `#43234C`) | `#BAE8D4` (menta) | **Observada** — Magnolia Bakery (EUA) |
| Cacau e creme | `#F7F2EC` | `#4B2E2A` | `#7A4A3A` | `#B98B6A` / `#E9D8C6` | Paleta "Cocoa and Cream" sugerida para padaria (media.io, visto na busca) |

Outras direções descritas pela Zarla (sem hex): Bluebird com fotos escuras e dramáticas de pão; Beaucoup Bakery com
blush + creme e fotos suaves; Bobbette & Belle com azul pastel + creme e serifa refinada; Tori's com verde-menta e
desenhos à mão; Leaven & Co com fundo quase preto e letras brancas pesadas sobre a tábua de pão.

Fontes: Self Raised usa **Crimson Pro** (Google) no texto + display própria; Tartine, Magnolia e Bluebird usam fontes
pagas. Equivalentes Google — padaria: títulos **Fraunces**, **DM Serif Display**, **Recoleta**-like → **Young Serif**;
retrô: **Shrikhand** ou **Bagel Fat One** (só no logo/título); texto **Work Sans**, **Inter**, **Crimson Pro**.
Confeitaria: **Playfair Display** / **Cormorant Garamond** (títulos) + **Lato** / **Nunito Sans**; script só em detalhe
(**Great Vibes**, **Dancing Script**) — nunca em parágrafo.
Fotos: padaria — mãos com farinha, pão cortado mostrando o miolo, vitrine cheia, luz de janela (ou estilo escuro
artesanal). Confeitaria — bolo inteiro com fundo limpo e luz suave + fatia mostrando camadas + detalhe da decoração.

### 5.3 Interações
- **Formulário de encomenda → WhatsApp** (bolo): ocasião, data (com `min` = hoje + prazo mínimo), nº de pessoas/tamanho,
  massa, recheio, cobertura, tema/referência, retirada ou entrega. Os modelos de formulário de confeitaria (Jotform,
  forms.app) pedem exatamente: tipo, tamanho, sabor, decoração, retirada/entrega, pagamento.
```js
const PRAZO_DIAS = 3; // do cliente
const d = new Date(); d.setDate(d.getDate() + PRAZO_DIAS);
dataInput.min = d.toISOString().slice(0,10);
```
- **Galeria filtrável por ocasião** (botões que filtram `data-ocasiao`), com lightbox em `<dialog>`.
- **Horário das fornadas** como linha do tempo ("6h pão francês · 7h pão de queijo · 16h segunda fornada").
- **Selo "Aberto agora"** (padaria abre às 6h; com o código de 0.3-c).
- **Calculadora de salgados** para festa: nº de convidados × quantidade por pessoa → sugestão de cento (use uma regra que
  o próprio cliente informar; não invente).
- Contador regressivo para data especial ("Encomendas de Páscoa até 10/04") só com data real.

### 5.4 Textos que vendem (exemplos meus)
- Padaria: "Pão quentinho toda manhã, café passado na hora e aquele cheiro que chega na calçada."
- "Saiu fornada! Passe aqui ou encomende pelo WhatsApp."
- "Festa chegando? Salgados fresquinhos, fritos ou assados, prontos para retirar."
- Confeitaria: "O bolo que vai ser o centro da sua festa. Feito sob encomenda, do seu jeito."
- "Conte a data e o tema: a gente sugere sabores e manda o orçamento pelo WhatsApp."
- "Encomendas com pelo menos 3 dias de antecedência." (o prazo é o do cliente)
- Botões: "Encomendar meu bolo", "Pedir orçamento no WhatsApp", "Ver bolos já feitos".

### 5.5 Erros comuns
- Não informar prazo mínimo de encomenda e datas lotadas (Páscoa, fim de ano) → pedidos impossíveis.
- Galeria com fotos de bolos de outras confeiteiras (Pinterest).
- Fonte script em textos longos; tons pastel com texto branco (sem contraste).
- Padaria sem horário de abertura/fornada visível.
- Formulário longo que não manda nada para o WhatsApp (o cliente acha que enviou e ninguém recebe).

---

## 6. Checklist rápido para o Gato/Castor (todos os nichos)
- [ ] Botão "Pedir/Reservar/Encomendar no WhatsApp" na capa, no topo fixo, nos cards e fixo no rodapé do celular.
- [ ] Mensagem do WhatsApp já preenchida com o item/pedido (`encodeURIComponent`).
- [ ] Selo "Aberto agora" calculado do horário real (aceita após meia-noite).
- [ ] Cardápio em HTML com abas fixas + aba ativa ao rolar; nada de PDF.
- [ ] Preços, prazos, área de entrega, adicionais grátis: **só se o comércio informou**.
- [ ] Endereço + "Como chegar" + mapa preguiçoso + horário da semana.
- [ ] Avaliações reais com link para o Google; nota só se real.
- [ ] iFood/99Food como botão secundário, se o comércio estiver lá.
- [ ] 2 fontes (título + texto), contraste ≥ 4,5:1, texto ≥ 16 px, toque ≥ 44 px, `prefers-reduced-motion`.
- [ ] JSON-LD do tipo certo com `openingHoursSpecification`.
- [ ] Fotos do próprio comércio, um estilo só (claro ou escuro), carro-chefe na capa.

---

## 7. Fontes (páginas que realmente abri)
Lidas por inteiro ou extraídas com Firecrawl (`markdown`, `summary`, `branding` ou `query`):
1. Chowly — Restaurant Website Design: Real Examples That Convert (2026): https://chowly.com/resources/blogs/restaurant-website-design-real-examples-that-convert-visitors-into-orders/
2. UpMenu — 20+ Best Pizza Websites & Designs (2025): https://www.upmenu.com/blog/best-pizza-websites
3. Zarla — 15 Best Bakery Website Examples (2026): https://www.zarla.com/inspiration/bakery
4. Andando em Curitiba — Cardápio Digital para Restaurante: Guia Completo (2026): https://andandoemcuritiba.com.br/cardapio-digital-restaurante/
5. Framer Marketplace — Slice Town (template de uma página para comida): https://www.framer.com/marketplace/templates/slice-town/
6. Rubirosa (pizzaria/restaurante, NY) — cores/fontes: https://www.rubirosanyc.com/
7. Bráz Pizzaria (SP) — cores/fontes: https://familiabraz.com.br/braz-pizzaria/ (aberto via https://www.brazpizzaria.com.br/)
8. Shake Shack (hamburgueria) — cores/fontes: https://shakeshack.com/
9. Honest Burgers (hamburgueria, UK) — cores/fontes: https://www.honestburgers.co.uk/
10. Mocotó (restaurante, SP) — cores/fontes: https://mocoto.com.br/
11. Oakberry (açaí) — cores/fontes: https://www.oakberry.com/
12. Tartine Bakery (padaria) — cores/fontes, prazo de 7 dias para bolos: https://tartinebakery.com/
13. Self Raised Bread Shoppe (padaria) — cores/fontes: https://selfraised.com.au/
14. Bluebird Bakery (padaria) — cores/fontes: https://bluebirdbakery.co.uk/
15. Magnolia Bakery (confeitaria) — cores/fontes: https://www.magnoliabakery.com/

Vistas só pelo resumo da busca (não abri a página; usadas como apoio, não como dado):
- DoorDash Merchants (restaurant website 2026), getsauce.com, Contra (conceitos "Burgeon" e "BURGY"), shadcn.io (In-N-Out),
  Creative Boom (identidade BURGER Edinburgh), Saipos (pedido de pizza por WhatsApp; cita Instituto Foodservice Brasil),
  Unipile (formato wa.me), 99Food (cardápios de açaiterias), kinetic.com.sg (Project Açaí), packagingoftheworld (BerryGood),
  media.io (paleta Cocoa and Cream), Jotform/forms.app (formulário de encomenda de bolo), Mary Bolos & Doces (Solutudo),
  casamentos.com.br (prazos de doceiras), Expert Photography / Nikon (estilos de foto), blogs de tipografia
  (fontalternatives.com, manypixels.co), comunidade Adobe e estudo MIT (abas/filtros de cardápio no celular).
- Tentei abrir o design system da Deliveroo (design.deliveroo.net) — pede senha; o padrão de abas citado veio do resumo da busca.
