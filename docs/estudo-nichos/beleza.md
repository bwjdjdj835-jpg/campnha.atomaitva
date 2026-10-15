# Estudo de web design — Beleza: Barbearia, Salão, Manicure/Nail, Estética

Pesquisa feita em 15/10/2026 para sites de **uma página** de comércio local cujo objetivo é: chamar no WhatsApp,
agendar ou ir até o local. As cores e fontes abaixo foram **extraídas do CSS real** de cada site (leitura com
`branding` do Firecrawl); quando a fonte é paga, indico uma equivalente do Google Fonts.

> Regra usada: nenhum número inventado. Onde aparece número, ele vem da página indicada — e, quando a página é de
> quem vende software/serviço, isso está avisado.

---

## 0. O que vale para os quatro nichos (padrões que se repetiram)

1. **Ação no topo e em todo lugar.** Todos os sites reais brasileiros bons repetem o mesmo botão de WhatsApp em
   cada seção (Dom Barbudo, Swze Hair, Clínica Aura, Studio Debora Spies). O link do `wa.me` já leva **mensagem
   pronta** dizendo de onde veio e qual serviço ("Vim pelo site e quero agendar um horário para barba").
   Dom Barbudo tem um texto pronto diferente **por serviço** — a recepção já sabe o que a pessoa quer.
2. **Prova social de terceiros > depoimento escrito pela casa.** O artigo da NanoGlobals (análise de 20 barbearias)
   destaca sites que embutem avaliações do Google (um deles mostra 1.066 avaliações na home) porque "o visitante sabe
   que você não pode editar". Dom Barbudo mostra "5,0 no Google · 1.523 avaliações" e diz que o texto é o original;
   Swze Hair mostra "4,9 · 34 avaliações" com selo de verificação.
3. **Preço visível (ou pelo menos "a partir de").** NanoGlobals: esconder preço manda o visitante para o concorrente
   que responde a pergunta. GlossGenius (nail): menu de serviços com preço "reduz o tempo respondendo perguntas
   básicas". Em estética o padrão é **não** mostrar preço de procedimento injetável e sim "avaliação" (Aura, LYEV).
4. **Fotos reais do espaço e do trabalho.** NanoGlobals: os sites com banco de imagens tiveram as piores notas;
   "barbearia é negócio de atmosfera". Aura mostra recepção e salas; Swze Hair agrupa fotos por serviço.
5. **Bloco "como chegar" completo:** endereço clicável, horário por dia, "Traçar rota" (Google Maps) — Swze Hair
   ainda dá **Waze e Uber** com destino preenchido. Comodidades (estacionamento, ar-condicionado, Pix, parcela,
   café, aceita pet) aparecem como selos curtos.
6. **FAQ que responde objeção** (dói? precisa agendar? tem estacionamento? formas de pagamento?) — presente em
   Dom Barbudo, Swze Hair e Aura. Serve para SEO local e para tirar dúvida sem o cliente precisar perguntar.
7. **"Como agendar" em 3 passos** (Dom Barbudo): 1) fale no WhatsApp 2) escolha serviço e horário 3) confirme.
   Reduz a ansiedade de quem nunca foi.
8. **Velocidade no celular.** Med spa (Ambrose/Marcelline) e nail (GlossGenius) insistem: agendar em poucos toques,
   sem login nem app. GlossGenius recomenda um fluxo que se completa "em menos de 30 segundos" (é recomendação de
   fornecedor de agenda, não estudo independente).

---

## 1. BARBEARIA

### 1.1 Ordem das seções (e por quê)
| # | Seção | Por quê |
|---|-------|---------|
| 1 | **Hero escuro em tela cheia**: nome + bairro/cidade + 1 frase + "Agendar pelo WhatsApp" + "Ver serviços". Faixa de selos curtos (Estacionamento · Climatizado · Aceita Pix) | Dom Barbudo põe o bairro no H1 ("Barbearia no Caminho das Árvores") — responde "é perto de mim?" e ajuda no Google. Colorlib destaca a Scissors & Scotch por pôr a localização "antes de qualquer coisa". |
| 2 | **Serviços com preço** (lista numerada 01, 02, 03… com botão por serviço) | NanoGlobals: preço + duração antes do horário é o fluxo mais transparente. Wayward mostra "— $35 to $50 —" grande abaixo de cada serviço. |
| 3 | **Combos** (corte + barba, corte + barba + hidratação) | Resident Barber (NanoGlobals): 3 pacotes em faixas de preço guiam o 1º cliente para um ticket maior sem empurrar. Dom Barbudo destaca "condição para novos clientes". |
| 4 | **A experiência / por que nós** (4 diferenciais curtos com número) | Wayward: "a melhor sala de estar do mundo", disco tocando, bebida. Barbearia vende ambiente. |
| 5 | **Barbeiros** (foto, nome, especialidade, @ do Instagram, "agendar com ele") | NanoGlobals: perfil de cada barbeiro transforma "qualquer um disponível" em "quero o Henrique". Wayward faz isso com bio longa e botão por barbeiro. |
| 6 | **Galeria de cortes** (grade) | New York Barbershop (Colorlib) usa grade de cortes "para o cliente escolher o próximo". |
| 7 | **Avaliações do Google** (carrossel + nota grande + link "ver todas") | Ver item 0.2. |
| 8 | **Localização + horários + mapa** + "Traçar rota" | Dom Barbudo e Wayward fecham com isso. |
| 9 | **Como agendar (3 passos)** + **FAQ** | Dom Barbudo. |
| 10 | **Chamada final** ("Seu próximo corte começa aqui") + botão fixo de WhatsApp | Dom Barbudo. |

### 1.2 Direção visual
**Paletas reais observadas**
- **Dom Barbudo (Salvador/BA) — preto + dourado envelhecido:** fundo `#080908`, dourado `#96885F`, areia `#D7D3C8`,
  oliva escuro `#4E462F`, texto `#FFFFFF`. Botões retos (raio 0). Fontes: **Teko** (títulos, condensada, 108 px no H1)
  + **Montserrat** (texto).
- **Wayward (Canadá) — azul petróleo + cobre:** fundo `#253A4B`, cobre `#D8AC84`, azul profundo `#0A252D`, borda de
  botão `#AAA075`, texto branco. Botão em pílula (raio 100 px). Fontes: **Barlow Condensed** (títulos enormes, H1 140 px)
  + Poppins / Avenir (equivalente Google: **Nunito Sans**).
- **SHED Barber (Austin) — claro "papel" + vermelho:** fundo `#FBF8F2`, vermelho `#EE4037`, bordô `#790000`, texto
  `#000000`. Fonte GT America / GT America Extended (paga; equivalente Google: **Archivo** com largura expandida, ou
  **Familjen Grotesk**). Prova de que barbearia não precisa ser escura.

**Fontes que funcionam:** condensadas e altas nos títulos (Teko, Barlow Condensed, Oswald, Bebas Neue, Anton) +
sem serifa neutra no texto (Montserrat, Poppins, Inter). Para estilo "clássico 1920" (Hagi's, B&H): serifa com
contraste (Playfair Display) ou slab (Roboto Slab).

**Foto:** barbeiro em ação (navalha, acabamento de nuca), close de ferramenta, poltrona e espelho do próprio
salão, luz quente e baixa, contraste alto; P&B funciona (Balls Barbershop usa hero monocromático, via Colorlib).
Nada de banco de imagem.

### 1.3 Interações que aparecem
- **Vídeo de fundo no hero** (Wayward, Scissors & Scotch, Rosemont — via thesalonbusiness/Colorlib/NanoGlobals).
- **Parallax no hero** (Gentlemen Barberclubs, Maverick — via Colorlib).
- **Tela dividida com metades que deslizam em sentidos opostos** (Shed, Maverick — via Colorlib).
- **Menu fixo (sticky)** e **animações ao rolar** (Boardroom Salon — via Colorlib).
- **Hover nas fotos** (Shed).
- **Agendamento sem sair do site** (modal) — NanoGlobals cita como boa prática; redirecionar para outra plataforma
  pontuou pior. Para nós: o WhatsApp é o "modal".

**Como fazer leve (HTML/CSS/JS):**

*Vídeo de fundo que não pesa e respeita quem não quer movimento*
```html
<section class="hero">
  <video class="hero-video" autoplay muted loop playsinline preload="none" poster="fotos/capa.jpg">
    <source src="video/capa-720p.mp4" type="video/mp4">
  </video>
  <div class="hero-escurece"></div>
  <h1>Barbearia no <em>Centro de Cacoal</em></h1>
  <a class="btn" href="https://wa.me/55DDNNNNNNNNN?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20quero%20agendar">Agendar pelo WhatsApp</a>
</section>
<style>
.hero{position:relative;min-height:100svh;display:grid;place-content:center;overflow:hidden}
.hero-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}
.hero-escurece{position:absolute;inset:0;background:linear-gradient(#0008,#000c);z-index:-1}
@media (prefers-reduced-motion:reduce){.hero-video{display:none}.hero{background:url(fotos/capa.jpg) center/cover}}
</style>
```
(Sem vídeo real do comércio, usar só a foto — vídeo de banco destrói a confiança.)

*Lista de serviços numerada com botão por serviço (mensagem pronta diferente)*
```html
<ol class="servicos">
  <li><span class="n">01</span><h3>Corte masculino</h3><p>Tesoura ou máquina, lavagem e finalização.</p>
      <strong>R$ 45</strong><a href="https://wa.me/55…?text=Quero%20agendar%20um%20corte">Agendar</a></li>
</ol>
```
Gerar o `text=` com `encodeURIComponent('Olá! Vim pelo site e quero agendar: ' + servico.nome)`.

*Barra de WhatsApp fixa só no celular*
```css
.zap-fixo{position:fixed;inset:auto 12px 12px;display:none;z-index:50}
@media (max-width:768px){.zap-fixo{display:flex}}
```

### 1.4 Textos e chamadas (escritos para o nosso uso)
- H1: "Barbearia no [bairro] — corte, barba e aquele acabamento de respeito."
- Sub: "Hora marcada, sem fila. Fale com a gente no WhatsApp e escolha o seu barbeiro."
- Botões: "Agendar pelo WhatsApp" · "Ver serviços e preços" · "Agendar com o [nome]" · "Traçar rota".
- Combo: "Primeira vez aqui? Corte + barba com condição especial — pergunte no WhatsApp."
- Diferenciais: "Navalha e toalha quente" · "Ambiente climatizado" · "Estacionamento" · "Cerveja/café por conta da casa"
  (só se for verdade).
- Fechamento: "Seu próximo corte começa com uma mensagem."
- Selo de avaliação: "Nota [x] no Google · [n] avaliações" (número real, com link para o Maps).

### 1.5 Erros comuns
- Foto de banco (modelo de barba perfeita que não é cliente) — derruba confiança (NanoGlobals).
- Sem preço nem "a partir de" (NanoGlobals cita a Rosemont como ótima mas falhando nisso).
- Redirecionar para app de agenda que pede cadastro antes de mostrar horário.
- Telefone/WhatsApp escondido só no rodapé; Resident Barber (NanoGlobals) põe o telefone no cabeçalho.
- Escuro demais: texto cinza sobre preto sem contraste; foto escura sem película de gradiente para o título.
- Fonte condensada usada também no parágrafo (fica ilegível no celular).
- Vídeo pesado tocando no 4G — use `poster`, `preload="none"` e versão 720p curta.

---

## 2. SALÃO DE BELEZA (cabelo; muitas vezes com unha/sobrancelha junto)

### 2.1 Ordem das seções
| # | Seção | Por quê |
|---|-------|---------|
| 1 | **Barra superior fina**: endereço clicável · horário de hoje · @Instagram | Swze Hair (SP). Responde "onde fica / está aberto?" antes do hero. |
| 2 | **Hero claro e editorial**: nome + palavra em itálico ("beleza *autoral*") + bairro + "Agendar no WhatsApp" + "Como chegar" + nota do Google + "Hoje: 8h30 às 20h" | Swze Hair. Duas fotos reais do trabalho ao lado. |
| 3 | **Serviços por categoria** (Cabelo · Unhas e pés · Sobrancelhas e cílios · Estética), lista curta e marcando "Especialidade" | Swze Hair. Salão faz muita coisa — agrupar evita lista infinita. |
| 4 | **Vitrine por especialidade**: bloco "Coloração e Mechas" com 3 fotos + "+5 fotos", texto curto, "Agendar agora" | Swze Hair repete isso para Penteado/Maquiagem e Nail. É a "galeria com contexto". |
| 5 | **Equipe** (foto + especialidade: "cacheados", "loiros", "noivas") | Colorlib (hair salon 2026) aponta bios de profissionais com portfólio próprio entre o que separa os melhores. |
| 6 | **Comodidades** (ar, Wi-Fi, café, Pix, parcela, pet) | Swze Hair. |
| 7 | **Horários + contato + Maps/Waze/Uber** | Swze Hair. |
| 8 | **Avaliações do Google** (nota + depoimentos com nome) | Swze Hair (com selo de verificação), Fringe (muitas avaliações positivas, segundo o próprio site). |
| 9 | **FAQ** (onde fica, horário, como agendar, pagamento, pet, noivas) | Swze Hair. |
| 10 | **Chamada final** repetindo o slogan + botão flutuante | Swze Hair ("Beleza autoral, feita para você"). |

### 2.2 Direção visual
**Paletas reais observadas**
- **Swze Hair (Vila Buarque/SP) — off-white rosado + vermelho carmim:** fundo `#FFFAF8`, carmim `#B3272B` (botão),
  rosa-chá `#F8DDD8`, rosa claríssimo `#FDEEEB`, texto `#1E1919`. Botão quase reto (raio 3 px). Fontes:
  **Cormorant Garamond** (títulos/itálico) + **Montserrat** (texto).
- **Fringe Salon (NY) — branco + pêssego + menta + berinjela:** fundo `#FFFFFF`, pêssego `#F6AFA1` (botão),
  berinjela `#292145` (texto do botão), menta `#CEE5DC`, texto `#47405F`. Cantos bem arredondados (botão em pílula
  40 px; cards 18 px). Fontes: **Cormorant Infant** (títulos) + **Onest** (texto). Clima artístico e acolhedor.
- **Sally Hershberger (loja do salão) — preto + dourado:** fundo `#000000`, dourado `#C8AD79`, botões retos com borda
  dourada, Montserrat. Serve de referência para "salão premium escuro" (o site em si é loja de produtos).

**Fontes:** serifa elegante com itálico nos títulos (Cormorant Garamond, Cormorant Infant, Playfair Display,
Bodoni Moda) + sem serifa limpa (Montserrat, Onest, Jost, DM Sans). O itálico numa palavra-chave do título é a marca
do estilo editorial (Swze: "beleza *autoral*", "*beleza natural*", "*visita*").

**Foto:** resultado de cor/mecha com luz natural (janela), costas/movimento do cabelo, antes/depois de
coloração, detalhes do salão (cadeira, espelho, ladrilho — a foto de capa da Fringe é o salão vazio com ladrilho
vintage e espelhos de madeira). Tons quentes, pele com cor real.

### 2.3 Interações
- **Galeria por serviço com "+N fotos"** que abre em tela cheia (Swze Hair).
- **Hero slider / parallax suave** (Websitevice cita Michele Simmerer com "smooth parallax" e David Mallett com slider).
- **Vídeo de fundo + P&B** (Sally Hershberger, via Websitevice).
- **Antes e depois de coloração** (arrastar).
- **Selo "aberto agora / fecha às 20h"** calculado pelo horário (Swze tem "Aberto até 20:00h" no botão flutuante).
- **Botão flutuante que abre um mini-menu** (WhatsApp · Maps · Waze · Instagram · Avaliar) — Swze Hair.

*Galeria com lightbox usando `<dialog>` (sem biblioteca)*
```html
<div class="grade" data-galeria>
  <button><img src="fotos/mecha-1.jpg" alt="Mechas iluminadas em cabelo castanho" loading="lazy"></button>
  …
</div>
<dialog id="foto-grande"><img alt=""><button value="fechar">✕</button></dialog>
<script>
const d=document.getElementById('foto-grande'),im=d.querySelector('img');
document.querySelectorAll('[data-galeria] button').forEach(b=>b.onclick=()=>{const f=b.querySelector('img');im.src=f.src;im.alt=f.alt;d.showModal()});
d.onclick=e=>{if(e.target===d||e.target.value==='fechar')d.close()};
</script>
<style>
.grade{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}
.grade img{aspect-ratio:4/5;object-fit:cover;width:100%;border-radius:12px}
dialog::backdrop{background:#000c} dialog img{max-height:85vh;max-width:90vw}
</style>
```

*"Aberto agora"*
```js
const H={0:null,1:[10,19],2:[8.5,20],3:[8.5,20],4:[8.5,20],5:[8.5,20],6:[8.5,17.5]}; // do horário real
const a=new Date(),h=a.getHours()+a.getMinutes()/60,hoje=H[a.getDay()];
selo.textContent = hoje && h>=hoje[0] && h<hoje[1] ? `Aberto agora · fecha às ${fmt(hoje[1])}` : 'Fechado agora · chame no WhatsApp';
```
(Só usar com horário vindo da ficha real do Google.)

### 2.4 Textos e chamadas
- H1: "[Nome], o seu salão no [bairro]." / "Cor, corte e cuidado com hora marcada."
- Sub: "Cabelo, unhas e sobrancelhas no mesmo lugar. Chame no WhatsApp e escolha o melhor horário."
- Vitrine: "Loiras e mechas — iluminado sem judiar do fio." · "Cacheadas — corte que respeita a sua curvatura."
  (só os serviços que o salão realmente faz).
- Noivas: "Vai casar ou tem evento? Reserve a produção com antecedência."
- Botões: "Quero agendar" · "Ver mais fotos" · "Como chegar" · "Ir pelo Waze".
- Comodidades: "Café à vontade · Wi-Fi · Pix e cartão em até [x]x" (dados reais).
- Fechamento: "Seu horário está a uma mensagem de distância."

### 2.5 Erros comuns
- Lista gigante de 30 serviços sem agrupamento (Swze resolve com 4 categorias).
- Usar foto de cabelo de banco/Pinterest — a cliente reconhece e perde a confiança (e é problema de direito autoral).
- Itálico/serifa fina em texto pequeno (Cormorant abaixo de ~18 px fica ilegível); usar serifa só em títulos.
- Rosa claro com texto branco (contraste ruim). No Swze o botão é carmim escuro com texto branco — esse é o jeito.
- Esquecer o horário de cada dia (segunda costuma ser diferente).
- Prometer "sem danificar o fio", "progressiva sem formol" sem o salão confirmar.

---

## 3. MANICURE / NAIL DESIGNER

### 3.1 Ordem das seções
| # | Seção | Por quê |
|---|-------|---------|
| 1 | **Hero com foto de mão/unha em close** + "Unhas impecáveis e duráveis em [bairro]" + botão "Fale direto com a [nome]" | Debora Spies (Sinop/MT): a profissional é a marca — o botão fala com ELA. |
| 2 | **Galeria / lookbook** logo no começo (grade de unhas, idealmente com filtro: curtas · francesinha · nail art · fibra) | GlossGenius: "fotos e vídeos de alta qualidade… demonstram o nível de habilidade"; atualizar com nail art sazonal. AKIKO tem "lookbook". "Cliente de unha compra com os olhos" (agência citada na busca). |
| 3 | **Serviços com preço e duração** (alongamento fibra/gel, manutenção, banho de gel, blindagem, esmaltação em gel, pé) | GlossGenius: organizar por categoria ou por duração; preço visível gerencia expectativa. ALM Studio (Setmore) mostra duração "2 h 30 min" e preço por serviço. |
| 4 | **Dor → solução** ("unha fraca que quebra no meio da semana corrida…") | Debora Spies usa texto empático de dor e transformação — funciona bem no público dela. |
| 5 | **Sobre a profissional** (anos de experiência, técnica, higiene/esterilização) | Debora Spies: "mais de 5 anos"; Artiva Nails (Colorlib) destaca esterilização de nível hospitalar. Higiene é a objeção nº 1 de unha. |
| 6 | **Antes e depois** (unha roída → alongada/blindada) | Pedido natural do nicho; usar só fotos da própria profissional. |
| 7 | **Avaliações** (print/texto real com nome) | Debora Spies e Swze Hair. |
| 8 | **Regras do atendimento** (só com hora marcada, tolerância de atraso, manutenção a cada X dias) | GlossGenius cita seção de políticas de cancelamento; Debora: "exclusivamente com agendamento". |
| 9 | **Localização + horários** + chamada final | todos. |

### 3.2 Direção visual
**Paletas reais observadas**
- **Studio Debora Spies (Sinop/MT) — lilás:** lilás `#D3B8EB`, ameixa `#765378` (botão), roxo `#9555CF`
  (botão secundário), azul-gelo `#D1ECF1`, fundo `#FFFFFF`, texto `#212529`. Botões em pílula. Fontes:
  **Playfair Display** + **Raleway**.
- **Paintbox (NY) — editorial preto e branco + vermelho esmalte:** fundo `#FFFFFF`, texto `#000000`, vermelho
  `#D02E2E`. Fonte Freight Display Pro (paga; equivalente Google: **Playfair Display** ou **Fraunces**), título
  de seção grande (80 px). Muito branco, as unhas dão a cor.
- **AKIKO Nails (NY) — creme + preto, minimalista:** fundo `#FAF7EF`, preto `#000000`. Fonte Degular (paga;
  equivalente: **Outfit** ou **DM Sans**). Títulos grandes (~72 px).
- **House of NAF! (Londres) — creme pêssego:** `#FFF1E3` + preto, Good Sans Light (equivalente: **Manrope** /
  **Urbanist** leve); horário da semana em lista grande com setas "→". Colorlib descreve a marca com gradiente pastel,
  marquee animado e elementos circulares.
- (Via Colorlib, não aberto por mim: Gloss Nail Studio usa verde/teal com **Bebas Neue + Lora**.)

**Fontes:** serifa display (Playfair, Fraunces, Cormorant) para o luxo; sem serifa geométrica arredondada
(Outfit, Urbanist, Quicksand, Nunito) para o "fofo/moderno".

**Foto:** close de mão em fundo neutro (tecido, mármore, flor), luz difusa, unha bem cutilada em foco; mãos em
contexto (segurando café, anel); vídeo curto do esmalte sendo aplicado. Padronizar fundo e luz — a grade fica com
cara de marca.

### 3.3 Interações
- **Filtro da galeria por estilo** (chips: Todas · Curtas · Nail art · Francesinha · Fibra).
- **Marquee** com serviços ou "Agenda aberta" (House of NAF).
- **Carrossel de fotos** (House of NAF: "Item 1 of 8").
- **Antes e depois** (arrastar).
- **Seletor de serviço → mensagem pronta** no WhatsApp ("Quero manutenção de fibra").

*Filtro da galeria sem biblioteca*
```html
<div role="group" aria-label="Filtrar estilos">
  <button aria-pressed="true" data-f="*">Todas</button>
  <button aria-pressed="false" data-f="art">Nail art</button>
  <button aria-pressed="false" data-f="curta">Curtas</button>
</div>
<ul class="grade"><li data-tags="art curta"><img …></li>…</ul>
<script>
document.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('[data-f]').forEach(x=>x.setAttribute('aria-pressed',x===b));
  document.querySelectorAll('.grade li').forEach(li=>li.hidden=!(b.dataset.f==='*'||li.dataset.tags.split(' ').includes(b.dataset.f)));
});
</script>
```

*Marquee só com CSS*
```html
<div class="faixa"><div class="trilho"><span>Alongamento em fibra · Banho de gel · Blindagem · Nail art · </span><span aria-hidden="true">Alongamento em fibra · Banho de gel · Blindagem · Nail art · </span></div></div>
<style>
.faixa{overflow:hidden;white-space:nowrap}.trilho{display:inline-flex;animation:correr 25s linear infinite}
@keyframes correr{to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.trilho{animation:none}}
</style>
```

### 3.4 Textos e chamadas
- H1: "Unhas lindas que duram — alongamento e gel em [bairro]."
- Sub: "Atendimento com hora marcada, material esterilizado e acabamento caprichado."
- Dor: "Unha que quebra no meio da semana? A blindagem resolve sem deixar artificial."
- Botões: "Falar com a [nome] no WhatsApp" · "Quero esse estilo" (em cada foto) · "Ver preços".
- Manutenção: "Já é cliente? Agende sua manutenção antes de completar [x] dias." (prazo dito pela profissional)
- Regras: "Atendo só com horário marcado para dar atenção total a você."
- Fechamento: "Suas mãos falam por você. Vamos deixar elas do seu jeito?"

### 3.5 Erros comuns
- Galeria com fotos de fundos/luzes diferentes, tremidas ou repostadas de outras nail designers (direito autoral e
  confiança).
- Muitos emojis no texto (o site da Debora funciona, mas exagera — usar 1 ou 2 no máximo).
- Esconder higiene/esterilização — é o que mais pesa para quem nunca foi.
- Sem duração do serviço (alongamento leva horas; a cliente precisa saber).
- Hero com texto em cima de foto de unha colorida sem película (não dá para ler).
- Usar nomes de técnica que a profissional não faz só porque estão na moda.

---

## 4. ESTÉTICA / CLÍNICA DE ESTÉTICA

### 4.1 Ordem das seções
| # | Seção | Por quê |
|---|-------|---------|
| 1 | **Hero calmo e de confiança**: pergunta que espelha o desejo ("Quer realçar sua beleza natural com segurança?") + "avaliação personalizada" + botão "Quero agendar minha avaliação" + foto da equipe real | Clínica Aura (Sete Lagoas/MG). Ambrose: mostrar o profissional e credencial "antes da dobra" tira a principal ansiedade. |
| 2 | **Faixa de urgência honesta** ("Agenda de [mês] aberta") | Aura usa marquee com agenda aberta. Só usar se for verdade — "últimas vagas" inventado é propaganda enganosa. |
| 3 | **Tratamentos em cards** (foto + nome + "Eu quero") agrupados por **Rosto · Pele · Corpo** | Aura (12 cards); Colorlib: categorizar por área reduz a fadiga de decisão (VIO usa 4 categorias). Minimale: grade dá o mesmo peso a cada tratamento. |
| 4 | **Por que nós** (Resultado natural · Segurança · Avaliação antes de tudo) | Aura. Ambrose: o site precisa parecer "clínico **e** luxuoso ao mesmo tempo". |
| 5 | **Profissionais com formação e registro** (foto, formação, nº do conselho) | Aura (enfermeiro esteta e farmacêutica, com texto de propósito). Ambrose/Marcelline/Colorlib: credenciais visíveis. |
| 6 | **Resultados (antes e depois)** com consentimento e aviso | Colorlib: Skin Solutions e LYEV têm o antes/depois como peça central. **No Brasil há regras** (ver 4.5). |
| 7 | **Conheça a clínica** (recepção, salas) | Aura: 3 fotos do espaço. Marcelline: fotos reais de equipe e espaço > banco de imagem. |
| 8 | **Depoimentos** (Google/Instagram, com nome) | Aura (com a origem: google/instagram). |
| 9 | **Objeções** ("Medo de ficar artificial?", "É seguro?", "Vou precisar de repouso?") | Aura tem um bloco só disso, antes do FAQ. |
| 10 | **FAQ por tratamento** (dói? quanto dura? quem pode fazer?) | Aura; Dixie Raiz Pacheco: cada tratamento deve "responder objeções e terminar com CTA". |
| 11 | **Localização + chamada final** | todos. |

### 4.2 Direção visual
Colorlib resume os dois caminhos que dão certo: **"luxo escuro e sóbrio" ou "clínico claro e limpo"**. Marcelline:
neutros suaves, azul-marinho, dourado quente e muito respiro.

**Paletas reais observadas**
- **Clínica Aura (MG) — nude + caramelo:** fundo `#FAF8F5`, caramelo `#9A734B`, botão `#BC9364`, areia `#E1D0BB`,
  texto `#161616`. Botão reto com sombra suave. Fontes: **Playfair Display** + **Inter**.
- **LYEV Beverly Hills — linho + taupe:** fundo `#F5F0EA`, linho `#EDE5DB`, taupe `#6E5D50`, marrom-cinza `#5C534D`,
  botão quase preto `#181715` com texto `#F5F0EA`. Fontes: **Cormorant Garamond** (H1 96 px) + **Figtree**.
- **Skin Solutions Collective (NY) — branco + rosa choque, ousado:** fundo `#FFFFFF`, rosa `#FF5FB0`, botão vermelho
  `#FF2929` com **sombra sólida deslocada** rosa (`4px 3px 0 rgb(255,180,210)`), texto `#080808`, cantos retos.
  Fontes: **Montserrat** + **Tenor Sans**. Mostra que dá para fugir do bege.
- **Minimale Skin (NY) — azul acinzentado "clínico":** fundo `#E4E8F0`, aço `#6D8690`, azul `#B8C7D9`, `#9DB1C5`.
  **Poppins**. Calmo, quase hospitalar-chique.

**Fontes:** serifa clássica fina nos títulos (Cormorant Garamond, Playfair Display, Tenor Sans) + sem serifa
leve no texto (Inter, Figtree, Montserrat). Muito espaço em branco; tamanho de corpo ≥ 16 px.

**Foto:** rosto com pele real (sem filtro exagerado), mãos do profissional com luva, ambiente claro, profissional
olhando para a câmera com jaleco. Evitar agulha/sangue em destaque (ver 4.5).

### 4.3 Interações
- **Antes e depois com arrastar** (Skin Solutions, LYEV — via Colorlib).
- **Animações sutis de entrada** e microinterações (Dixie Raiz Pacheco: "movimento com propósito, nada de parque de
  diversões"; RJ Med Spa e Tribeca com transições ao rolar — via Colorlib).
- **Marquee de "agenda aberta"** (Aura).
- **Cards de tratamento com hover** que sobem / mostram "Eu quero".
- **FAQ em acordeão** (Aura).

*Antes e depois acessível (arrastar + teclado)*
```html
<figure class="ad" style="--pos:50%">
  <img src="fotos/depois.jpg" alt="Depois do tratamento">
  <img class="antes" src="fotos/antes.jpg" alt="Antes do tratamento">
  <input type="range" min="0" max="100" value="50" aria-label="Comparar antes e depois"
         oninput="this.parentNode.style.setProperty('--pos',this.value+'%')">
  <figcaption>Resultado real de paciente, publicado com autorização. Resultados variam.</figcaption>
</figure>
<style>
.ad{position:relative;display:grid}.ad>img{grid-area:1/1;width:100%;aspect-ratio:4/5;object-fit:cover}
.ad .antes{clip-path:inset(0 calc(100% - var(--pos)) 0 0)}
.ad input{grid-area:1/1;align-self:stretch;opacity:0;cursor:ew-resize;touch-action:pan-y}
.ad::after{content:"";position:absolute;top:0;bottom:2.5rem;left:var(--pos);width:2px;background:#fff;pointer-events:none}
</style>
```
O `<input type="range">` invisível dá arrastar no toque, setas do teclado e leitor de tela de graça.
(No nosso `ClienteSite` isso já existe como `[data-antes-depois]`.)

*Revelar ao rolar (leve)*
```js
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visivel');io.unobserve(e.target)}}),{threshold:.15});
document.querySelectorAll('[data-revelar]').forEach(el=>io.observe(el));
```
```css
[data-revelar]{opacity:0;transform:translateY(24px);transition:.7s cubic-bezier(.2,.7,.2,1)}
[data-revelar].visivel{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){[data-revelar]{opacity:1;transform:none;transition:none}}
```

*FAQ sem JS*
```html
<details><summary>Dói?</summary><p>[resposta dada pela clínica]</p></details>
```

### 4.4 Textos e chamadas
- H1: "Beleza natural, com segurança e avaliação de verdade."
- Sub: "Cada rosto é único. Comece por uma avaliação para entender o que faz sentido para você."
- Botões: "Agendar minha avaliação" · "Quero saber se é para mim" · "Falar com a recepção".
- Por que nós: "Resultado natural — você continua parecendo você." · "Avaliação antes de qualquer procedimento." ·
  "Acompanhamento depois do tratamento."
- Objeção: "Medo de ficar artificial? Nossa linha é conservadora: menos é mais."
- Profissional: "[Nome], [formação], [conselho e número]." (dados reais)
- Fechamento: "O primeiro passo é uma conversa. Chame no WhatsApp e tire suas dúvidas."

### 4.5 Erros comuns (e cuidados legais)
- **Antes e depois sem regra.** A Resolução CFM nº 2.336/2023 (em vigor desde 11/03/2024) passou a permitir
  imagens de pacientes por médicos **em caráter educativo, com autorização do paciente e preservando a identidade**
  (portal do CFM e análise da Conjur; li só os resumos da busca). Biomédicos, enfermeiros, farmacêuticos e
  esteticistas seguem **o próprio conselho** — o site deve mostrar antes/depois **só com autorização por escrito do
  cliente e confirmação do profissional**, e com aviso "resultados variam".
- Prometer resultado ("rejuvenesça 10 anos", "sem dor", "definitivo") e urgência falsa ("últimas vagas").
- Preço de injetável em destaque com "promoção" — além de arriscado no conselho, puxa público errado; o padrão das
  boas clínicas é "avaliação".
- Foto de banco com modelo de pele perfeita (Marcelline: fotos reais de profissionais e espaço convertem melhor —
  afirmação da agência, sem estudo citado).
- Esconder quem atende e a formação.
- Visual "spa genérico" (folha, pedra, vela) que não diz nada da clínica.
- Site lento: Ambrose recomenda primeira pintura abaixo de 1 s no celular (meta da agência).
- Número citado por agências sem base: o "38% mais agendamentos com antes/depois no hero" do artigo da Ambrose vem de
  um post de outra agência (PxlPeak), não de estudo — **não usar como argumento de venda**.

---

## 5. Resumo para o Castor/Gato (matriz rápida)

| Nicho | Esquema | Paleta-base sugerida (das observadas) | Títulos + texto | Hero | Galeria | Peças-chave |
|---|---|---|---|---|---|---|
| Barbearia clássica | escuro | `#080908` / `#96885F` / `#D7D3C8` | Teko ou Barlow Condensed + Montserrat | foto/vídeo do salão, película escura | grade de cortes | serviços numerados com preço, barbeiros, avaliações Google, rota |
| Barbearia moderna | claro | `#FBF8F2` / `#EE4037` / `#000000` | Archivo (expandida) + Inter | foto P&B | grade | idem |
| Salão editorial | claro | `#FFFAF8` / `#B3272B` / `#F8DDD8` | Cormorant Garamond (itálico) + Montserrat | 2 fotos do trabalho + nota + horário | vitrine por especialidade "+N fotos" | categorias, comodidades, Waze/Uber, FAQ |
| Salão acolhedor | claro | `#FFFFFF` / `#F6AFA1` / `#292145` / `#CEE5DC` | Cormorant Infant + Onest | salão real | bento | pílulas arredondadas, equipe |
| Nail designer | claro | `#FFFFFF` / `#765378` / `#D3B8EB` ou `#FAF7EF` / `#000` | Playfair + Raleway, ou Outfit | close de mão | grade com filtro por estilo | preço + duração, higiene, antes/depois, marquee |
| Estética nude | claro | `#FAF8F5` / `#9A734B` / `#E1D0BB` | Playfair Display + Inter | equipe real | cards de tratamento | profissionais com registro, objeções, antes/depois com aviso |
| Estética luxo | claro | `#F5F0EA` / `#6E5D50` / `#181715` | Cormorant Garamond + Figtree | foto calma | uniforme | botão escuro reto, muito respiro |
| Estética ousada | claro | `#FFFFFF` / `#FF2929` / `#FF5FB0` | Montserrat + Tenor Sans | foto de rosto | uniforme | botão com sombra sólida deslocada |

Regras que o Gato deve seguir em todos: botão de WhatsApp com mensagem pronta por serviço; nota e nº de avaliações
**só se vierem do Google**; horário por dia; "Traçar rota"; FAQ com respostas que o comércio confirme;
`prefers-reduced-motion` em toda animação; nada de foto de banco.

---

## 6. Fontes

### Páginas que eu abri (leitura completa ou da identidade visual pelo Firecrawl)
1. https://www.waywardbarbershop.com/ — barbearia (estrutura, preços, barbeiros, cores/fontes)
2. https://dombarbudobarberclub.com.br/ — barbearia BR (estrutura completa, textos, cores/fontes)
3. https://shedbarber.com/ — barbearia (cores/fontes, resumo)
4. https://www.steventabach.com/ — tentei abrir; a página bloqueou (403), não usei
5. https://salaovilabuarque.com.br/ — salão BR Swze Hair (estrutura completa, cores/fontes)
6. https://www.fringeny.com/ — salão (cores/fontes, resumo)
7. https://sally-hershberger.com/ — loja de salão premium (cores/fontes)
8. https://paint-box.com/ — nail studio (cores/fontes, resumo)
9. https://www.akikonailsnyc.com/ — nail studio (cores/fontes, resumo)
10. https://houseofnaf.com/ — nail studio (estrutura, cores/fontes)
11. https://studiodeboraspies.odoo.com/ — nail designer BR (estrutura completa, textos, cores/fontes)
12. https://clinicaauraestetica.com.br/ — clínica de estética BR (estrutura completa, cores/fontes)
13. https://lyevbeverlyhills.com/ — clínica de estética (cores/fontes, resumo)
14. https://skinsolutions.co/ — clínica de estética (cores/fontes, resumo)
15. https://minimaleskin.com/ — clínica de estética (cores/fontes, resumo)
16. https://nanoglobals.com/barbershop-websites/ — análise de 20 sites de barbearia (resumo da página)
17. https://glossgenius.com/blog/nail-salon-websites — recomendações para nail salon (fornecedor de software de agenda)
18. https://www.ambrosemarketing.com/blog/medspa-website-design — 6 decisões para med spa e a origem do "38%" (agência)

### Lidas só no trecho mostrado pela busca (não abri a página inteira)
- https://thesalonbusiness.com/barbershop-website-designs/
- https://colorlib.com/wp/barbershop-websites/
- https://colorlib.com/wp/nail-salon-website-examples/
- https://colorlib.com/wp/med-spa-website-examples/
- https://websitevice.com/salon-examples
- https://marcelinestudios.com/blog/medical-spa-website-design-tips
- https://dixieraizpacheco.com/med-spa-website-design
- https://alm.setmore.com/ (exemplo de serviço com duração e preço)
- Resumos de busca sobre a Resolução CFM 2.336/2023: https://portal.cfm.org.br/noticias/cfm-atualiza-resolucao-da-publicidade-medica ·
  https://www.conjur.com.br/2023-set-22/lidice-mayo-resolucao-publicidade-uso-imagem-paciente/ ·
  https://med.estrategia.com/portal/noticias/publicidade-medica/ — conferir o texto oficial antes de usar como regra.
- Busca geral sobre nail salon (Moneris, Wix, HTMLBurger, SchedulingKit) e hair salon (Colorlib, MyCodelessWebsite,
  Lovable): só usei as ideias que se repetiram, nenhum número.
