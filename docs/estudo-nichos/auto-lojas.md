# Estudo de web design — Oficina mecânica, Lava jato / Estética automotiva, Borracharia, Loja de roupas

Pesquisa feita em 15/10/2026 para sites de uma página de comércio local (objetivo: chamar no WhatsApp, pedir orçamento,
agendar ou ir até o local).

**Como ler este estudo**
- **Observado** = visto numa página que abri (vitrine/artigo ou leitura de cores e fontes do site, via Firecrawl `branding`).
- **Proposta** = recomendação nossa, derivada do que foi observado. Não é dado de mercado.
- Não há estatística inventada. Os poucos números vêm com fonte. Os textos de exemplo foram escritos para este estudo
  (nenhum foi copiado de marca).
- Limite da pesquisa: a API de busca/leitura ficou no limite de pedidos por minuto boa parte do tempo, então li ~14 páginas,
  e não o máximo de 25. Para borracharia, quase não existem sites de destaque; ali a base é menor (ver a seção 3).

---

## 0. Padrões que valem para os 4 nichos

Os 4 nichos aparecem com o mesmo esqueleto nas vitrines e artigos lidos:

1. **Prova logo de cara** — nota do Google ou número de avaliações perto do botão, e não no rodapé. A Zarla destaca a
   Ace Mechanics: "review badges belong beside CTAs, not in footers" (selos de avaliação junto dos botões, não no rodapé).
   O Detailers Roadmap diz a mesma coisa: avaliações "near the booking button" (perto do botão de agendar).
2. **Uma ação principal** repetida pela página (no nosso caso: WhatsApp). O Detailers Roadmap diz: "When a site offers
   five competing actions, buyers tend to pick none" (com cinco ações concorrendo, o cliente não escolhe nenhuma).
3. **Fotos reais do lugar e do trabalho**, nunca banco de imagem. Isso aparece em todos os artigos de oficina e de estética.
4. **Celular primeiro e rápido.** O web.dev considera bom um LCP de até 2,5 s (no percentil 75) e ruim acima de 4 s.
5. **Endereço, horário e "Como chegar" visíveis**, porque o comércio físico vende a visita. A Cake Plus-Size põe
   endereço e horário de cada dia logo abaixo da foto da loja.
6. **WhatsApp com mensagem pronta:** `https://wa.me/55DDNNNNNNNNN?text=` + `encodeURIComponent(msg)`. O link só abre a
   conversa com o texto preenchido, e a pessoa ainda aperta enviar (Bird / Unipile).

### Peça reutilizável: "orçamento guiado" que monta a mensagem do WhatsApp
Serve para oficina (carro + sintoma), estética (porte + pacote), borracharia (onde está + o que houve) e loja (peça + tamanho).

```html
<form id="orcamento" class="orc">
  <fieldset><legend>1. Qual o carro?</legend>
    <input name="carro" placeholder="Ex.: Gol 2015" required>
  </fieldset>
  <fieldset><legend>2. O que está acontecendo?</legend>
    <label><input type="radio" name="servico" value="Barulho ao frear" required> Barulho ao frear</label>
    <label><input type="radio" name="servico" value="Luz acesa no painel"> Luz no painel</label>
    <label><input type="radio" name="servico" value="Revisão / troca de óleo"> Revisão / óleo</label>
    <label><input type="radio" name="servico" value="Outro"> Outro</label>
  </fieldset>
  <fieldset><legend>3. Quando você pode trazer?</legend>
    <select name="quando"><option>Hoje</option><option>Amanhã</option><option>Esta semana</option></select>
  </fieldset>
  <button class="micro">Enviar pelo WhatsApp →</button>
</form>
<script>
document.getElementById('orcamento').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const msg = `Olá! Quero um orçamento.\nCarro: ${f.get('carro')}\nProblema: ${f.get('servico')}\nPosso levar: ${f.get('quando')}`;
  location.href = 'https://wa.me/55' + NUMERO + '?text=' + encodeURIComponent(msg);
});
</script>
```
- Sem back-end, sem guardar dado: tudo fica no navegador e vai para o WhatsApp do comércio.
- A Vanguard Automotive põe no formulário a promessa "Takes Less Than 30 Seconds" (leva menos de 30 segundos), com 4 campos.
  Equivalente nosso: "Leva 20 segundos" (só se for verdade: no máximo 3 perguntas).
- Na oficina, o rótulo do botão deve ser "Pedir orçamento", e não "Agendar": a mensagem é um pedido, não uma reserva
  confirmada. O theStacc insiste nessa honestidade ("request received" ≠ "booked", ou seja, pedido recebido não é horário marcado).
- Detalhe jurídico do setor (O Mecânico): aprovação de orçamento só pelo WhatsApp tem valor de prova fraco. O site deve
  pedir o orçamento, e a aprovação formal fica com a oficina.

### Peça reutilizável: barra fixa de ação no celular
```html
<nav class="barra-acao"><a href="tel:+55..." class="micro">📞 Ligar</a>
  <a href="https://wa.me/55...?text=..." class="micro principal">WhatsApp</a>
  <a href="https://maps.google.com/?q=..." class="micro">📍 Como chegar</a></nav>
<style>.barra-acao{position:fixed;inset:auto 0 0 0;display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:8px;
padding:8px 12px calc(8px + env(safe-area-inset-bottom));background:rgba(15,15,15,.9);backdrop-filter:blur(8px);z-index:50}
@media(min-width:900px){.barra-acao{display:none}}</style>
```
O theStacc chama isso de "mobile action rail" (barra de ação no celular) e avisa: ela não pode cobrir informação importante.
Dê `padding-bottom` ao `body` com a altura da barra.

---

## 1. OFICINA MECÂNICA

### 1.1 Ordem das seções (e por quê)
Observado nos exemplos da Zarla (Astra, Vanguard, Brisbane Automotive, Ace) e no UENI:

| # | Seção | Por quê |
|---|-------|---------|
| 1 | **Faixa do topo**: telefone + horário de hoje | A Astra põe "two phone numbers and posted hours in the top bar" (dois telefones e o horário na barra do topo): conserto ainda é um serviço em que muita gente liga primeiro. |
| 2 | **Capa** com foto real da oficina (elevadores, boxes) + promessa honesta + cidade + botão WhatsApp + nota do Google | A Brisbane Automotive usa "photograph of its actual hoists and bays" (foto dos próprios elevadores e boxes). O modelo Anchor ataca a desconfiança já no título ("The Mechanic You Can Actually Trust", o mecânico em quem dá mesmo para confiar). |
| 3 | **Orçamento guiado** (carro + sintoma) ao lado da capa ou logo abaixo | Vanguard: formulário de 4 campos na capa; Bumper Buddies: "photograph your dent, get a price" (fotografe o amassado e receba o preço). |
| 4 | **"Atendemos o seu carro?"**: faixa de marcas e tipos (nacionais, importados, diesel, flex) | Na Brisbane, a faixa de logos de montadoras "answers the question every caller asks first: 'do you work on mine?'" (responde à primeira pergunta de quem liga: "vocês mexem no meu?"). Use texto ou ícones genéricos, nunca logos de montadora sem autorização. |
| 5 | **Serviços** em 2 grupos: "Evitar problema" (revisão, óleo, freio preventivo) × "Resolver problema" (diagnóstico, suspensão, motor), com tempo médio quando a oficina informar | A Astra organiza assim: "avoid problems, fix problems" (evitar problemas, resolver problemas). |
| 6 | **Como funciona** (3 passos: chama → diagnóstico com foto/vídeo → aprova antes de mexer) | O UENI cita a Auto Craft: explicar o processo deixa o cliente "confident that they know exactly what they are paying for" (seguro de saber exatamente pelo que está pagando). |
| 7 | **Garantia** (só a que a oficina realmente dá) | Os modelos Maddox e Ironside usam a garantia como fecho. |
| 8 | **Avaliações reais** (do Google, com link) | — |
| 9 | **Sobre / equipe** (rosto do dono) | UENI: "a real bay and real faces beat stock photos" (um box de verdade e rostos de verdade valem mais que foto de banco). |
| 10 | **FAQ** (aceita cartão? faz orçamento sem compromisso? quanto tempo?) | — |
| 11 | **Mapa + endereço + horário + chamada final** | — |

### 1.2 Direção visual
**Paletas observadas**
- **Astra Automotive** (lida via `branding`): primária `#FFC513` (amarelo-ouro), acento `#FEDE00`, texto `#292929`,
  fundo `#FFFFFF`, cinza `#6C757D`. Botões retos (raio 0) em amarelo com texto preto. Nas fotos da capa, o clima é escuro e dourado.
- **Ace Mechanics** (lida via `branding`): vermelho `#E00D30`, vermelho escuro `#C02B0A`, cinza-azulado `#607382`,
  fundo `#F5F5F5`, texto `#000000`. As cores seguem a pintura das vans da empresa.
- **Modelos descritos pela Zarla** (sem hex no texto): Vanguard em azul-marinho + vermelho; Anchor em "deep slate with a
  signal-orange accent" (ardósia escura com acento laranja de sinalização); Ironhorse em escuro + âmbar.
  - Proposta inspirada neles: ardósia `#1E2A33` / `#0F171D`, laranja `#F26A1B`, claro `#F4F2EE`.

**Fontes**
- Observadas: Poppins (títulos da Astra e da Ace) e Roboto (texto da Astra).
- Proposta de equivalentes "de oficina" no Google Fonts: **Barlow Condensed** ou **Oswald** nos títulos (lembram letreiro
  e placa) com **Inter** ou **Barlow** no texto. Evite fonte fina: oficina pede peso.

**Foto**
- Real e com luz de oficina: boxes, elevador com carro, mecânico de uniforme trabalhando, scanner de diagnóstico.
- Fachada para o cliente reconhecer o lugar.
- Contraste alto. Nada de foto de banco com mecânico sorrindo para a câmera.

### 1.3 Interações e como fazer
- **Orçamento guiado → WhatsApp** (código na seção 0). Os sintomas viram botões grandes, e "Outro" abre um campo de texto.
- **"Mande uma foto/vídeo do barulho"**: o botão abre o WhatsApp com "Vou te mandar um vídeo do barulho do meu [carro]".
  O site não recebe arquivo nenhum; a foto vai pelo próprio WhatsApp.
- **Serviços com tempo estimado** (só se a oficina informar): cartão com `<span class="tempo">⏱ ~1 h</span>`; sem dado,
  o campo não aparece.
- **"Aberto agora"**: JS compara `new Date()` com o horário do Google e mostra "🟢 Aberto agora · fecha às 18h" ou
  "Abre amanhã às 8h". Use o fuso do comércio (`Intl.DateTimeFormat('pt-BR',{timeZone:'America/Porto_Velho'})`).
- **Antes e depois** (funilaria/pintura): a peça `[data-antes-depois]` que já existe no projeto, com `clip-path: inset()`
  e `input type=range` para teclado (técnica das fontes de slider).
- **Faixa "atendemos"** (marquee em CSS puro), com os tipos de veículo escritos em texto.

### 1.4 Textos que vendem (escritos por nós)
- Título: "Oficina em [Cidade] que mostra o problema antes de mexer no seu carro."
- Subtítulo: "Diagnóstico explicado com foto, orçamento antes do serviço e nada de surpresa na hora de pagar."
- Botão: "Pedir orçamento no WhatsApp" · secundário: "Ligar agora".
- Orçamento: "Conta o que está acontecendo — leva 20 segundos."
- Processo: "1. Você chama · 2. A gente avalia e te manda o que achou · 3. Só mexe depois do seu OK."
- Fecho: "Barulho estranho, luz no painel? Chama antes que vire um conserto maior."

### 1.5 Erros a evitar
- Foto de banco (carro de luxo que nunca passou pela oficina).
- "Agende agora" quando, na verdade, é só um pedido.
- Formulário longo.
- Telefone só no rodapé.
- Logos de montadoras sem permissão.
- Prometer "o menor preço da cidade" ou um prazo que a oficina não garante.
- Garantia inventada.
- Lista enorme de 40 serviços sem agrupar.

---

## 2. LAVA JATO / ESTÉTICA AUTOMOTIVA

São dois públicos. O **lava jato rápido** quer preço fixo, rapidez e saber como chegar. A **estética/vitrificação** quer
prova visual, cuidado e confiança no artesanato. A Zarla mostra os dois polos (estúdios escuros de luxo × "express" claro).

### 2.1 Ordem das seções
| # | Seção | Por quê |
|---|-------|---------|
| 1 | **Capa que mostra o resultado**: gotas no capô vitrificado, reflexo, interior limpo; nota do Google; WhatsApp | Ceramic Coat Texas: "extreme close-up of water beading" (gotas d'água bem de perto) como prova do produto. Hyer Quality: capa em 3 painéis com os 3 pilares do serviço. |
| 2 | **Faixa de confiança** (4 itens curtos: "Produtos profissionais", "Busca e entrega" — só se houver —, "Com hora marcada", "Nota X no Google") | Modelo FastLane: faixa com as quatro coisas que importam ao cliente express. |
| 3 | **Pacotes com preço "a partir de"** por porte (hatch / sedã / SUV-picape) | Detail Mavericks: "three price points by vehicle size" (três preços por porte). Sydney Detail Studio: pacotes vendidos como produto. A Zarla resume: "'Call for a quote' is the biggest friction point in detailing" (o "ligue para orçar" é o maior atrito da estética automotiva). Só com preço real; sem preço, "Peça o valor do seu carro". |
| 4 | **Antes e depois** (polimento, higienização de banco, farol) | O Detailers Roadmap lista "real before-and-after photography" entre os 7 elementos; o DesignDetail diz que os sliders são "more engaging than static photos" (prendem mais que fotos paradas). |
| 5 | **Adicionais** (pelo de pet, motor, farol, cheiro) | Detail Mavericks: "add-ons grid" (grade de adicionais) que vende mais sem poluir. |
| 6 | **Como funciona / quanto tempo** | — |
| 7 | **Avaliações** (antes do "Sobre") | Royal Auto Finishes começa o "Sobre" com um depoimento: prova antes de autopromoção. |
| 8 | **FAQ por serviço** (polimento × vitrificação × lavagem) | Sydney Detail Studio separa a FAQ por categoria. |
| 9 | **Mapa + horário + "Como chegar"** | Zarla, sobre o modelo express: "Get Directions" (Como chegar) em vez de formulário. |

### 2.2 Direção visual
**Paletas observadas**
- **Ceramic Coat Texas / CCT** (lida via `branding`): laranja `#F96800`, ciano `#68CCD1`, fundo `#EEEEEE`, texto `#161519`,
  botões retos. Na descrição da Zarla, o tema é "black-and-orange" (preto e laranja) com setas em chevron como motivo.
- **Estúdios escuros** descritos pela Zarla: Hyer "Dark + teal" (escuro + verde-azulado), Sydney Detail "Dark + cyan"
  (escuro + ciano), Best Luxury e Detail Mavericks "Black + red" (preto + vermelho).
  - Proposta: fundo `#0B0F12`, superfície `#151B20`, ciano `#22D3EE` ou verde-água `#14B8A6`, texto `#E8EEF2`.
    A Zarla explica: o escuro "makes paint, chrome, and water-beading shots gleam" (faz pintura, cromado e gotas brilharem).
- **Lava jato de bairro / eco** (claro): Zarla cita o express em creme + verde e o eco em "sage-and-cream" (sálvia e creme).
  - Proposta: `#F7F5EF` / `#1F3B2D` / `#3FA34D` / amarelo `#FFC83D` para promoções. O Jet Splash (Colorlib) usa o amarelo
    como cor marcante.

**Fontes**
- Observada: Source Sans Pro (texto da CCT).
- Proposta: títulos em **Saira Condensed**, **Rajdhani** ou **Outfit** (ar técnico e automotivo); texto em
  **Inter** ou **Source Sans 3**.

**Foto**
- Close de gotas e reflexo, luz de LED no box, interior antes/depois com o mesmo ângulo e a mesma luz (o Detailers
  Roadmap pede "consistent lighting"), e a fachada para o lava jato de bairro.

### 2.3 Interações e como fazer
- **Antes e depois do polimento** — peça `[data-antes-depois]` (já existe). Duas fotos sobrepostas, a de cima com
  `clip-path: inset(0 calc(100% - var(--pos)) 0 0)`, `input type="range"` invisível por cima para teclado e leitor de tela,
  `touch-action: pan-y` para não travar a rolagem, e legenda: "Polimento técnico · porta do motorista".
- **Seletor de porte → preço** (só com preço real):
  ```html
  <div role="radiogroup" class="porte">
    <button data-porte="hatch" aria-pressed="true">Hatch</button>
    <button data-porte="sedan">Sedã</button><button data-porte="suv">SUV / Picape</button></div>
  <p class="preco" data-hatch="R$ X" data-sedan="R$ Y" data-suv="R$ Z"></p>
  ```
  O JS troca o texto e a mensagem do WhatsApp ("Quero a Lavagem Completa para meu SUV").
- **Montar o pacote** (checkboxes de adicionais) → a mensagem pronta lista o que foi marcado. Não mostre total se não houver preço.
- **Gotas na capa**: o efeito de água que o projeto já tem (`clienteAgua.js`) combina muito com este nicho. Use só na capa.
- **"Foto do carro para orçar"**: botão "Mandar foto do meu carro" → wa.me com "Vou te mandar fotos do carro para
  orçamento". A Best Luxury e a Zarla usam envio de foto no formulário; no nosso caso, a foto vai pelo WhatsApp.

### 2.4 Textos que vendem
- Estética: "Brilho de carro novo, proteção que dura. Estética automotiva em [Cidade]."
- Lava jato: "Seu carro limpo enquanto você resolve a vida. Lavagem com hora marcada em [Bairro]."
- Pacotes: "Escolha o tamanho do carro e veja o valor na hora."
- Antes/depois: "Arraste e veja a diferença."
- Garantia (só se existir): "Não ficou como você queria? A gente refaz."
- Botões: "Agendar minha lavagem" · "Pedir valor do polimento" · "Mandar foto do carro".

### 2.5 Erros a evitar
- Usar foto de carro de luxo de banco como se fosse trabalho do lava jato.
- Antes/depois com ângulo ou luz diferentes (parece montagem).
- Prometer durabilidade de vitrificação sem base: a iCarros fala em 1 a 5 anos, "dependendo da qualidade do produto e da
  manutenção". Se citar prazo, que seja o do produto usado.
- Esconder o preço quando ele é fixo.
- Vídeo pesado na capa no celular (atrapalha o LCP).
- Confundir polimento, cristalização e vitrificação no texto. São serviços diferentes (Jovem Pan / Vrum / Mecânica Online).
- Lição prática: o domínio da WOW Auto Spa, citado pela Zarla como bom exemplo, hoje redireciona para um site de apostas
  (vi isso na leitura). Domínio não renovado mata o site e a reputação. Avise o cliente sobre renovar o domínio.

---

## 3. BORRACHARIA

**Achado da pesquisa:** quase não há sites de destaque de borracharia independente. No Brasil, a presença é quase só em
diretórios (Solutudo, Lista Mais, Bendito Guia), com "24 horas" no nome e WhatsApp. Em um deles, clientes reclamam que a
empresa "não respeita o horário de atendimento 24 horas", e outra anuncia emergência 24 h mas lista horário de 07h às 22h.
Ou seja, um site simples e honesto já se destaca. Base usada: o guia do theStacc (padrões para tire shop), o modelo
Apex Tire & Wheel da Zarla, o template da MotoCMS e os diretórios brasileiros.

### 3.1 Ordem das seções
| # | Seção | Por quê |
|---|-------|---------|
| 1 | **Capa com dois caminhos**: 🚨 "Pneu furou agora?" (ligar / WhatsApp com localização) e 🛞 "Trocar ou consertar com calma" | theStacc: o primeiro bloco deve responder "What can I do here?" (o que posso fazer aqui?) e separar troca planejada de urgência ("A driver with a flat needs a bounded urgent-call path", ou seja, quem está com pneu furado precisa de um caminho curto de emergência). |
| 2 | **Status de horário real**: "🟢 Aberto agora" / "Socorro até 22h" / "24 h" (só se for verdade) | theStacc: "Urgent pages state current hours and destination without promising speed" (página de urgência mostra o horário atual e o destino, sem prometer rapidez). |
| 3 | **Serviços** (conserto de furo, troca, balanceamento, rodízio, calibragem, socorro móvel) com tempo médio informado | Modelo Apex: "most done in under an hour" (a maioria em menos de uma hora). A rapidez é o que decide. |
| 4 | **Área de atendimento do socorro** (bairros / km) | theStacc: "A storefront phone button does not imply mobile service" (botão de telefone da loja não significa que há socorro móvel). Deixe claro o que é na loja e o que é ir até o cliente. |
| 5 | **Tipos de veículo** (moto, carro, caminhonete, caminhão) | Os diretórios listam passeio, caminhão e moto. |
| 6 | **Pneus à venda** (novos/remold/usados, se tiver) → "Pergunte se tem a sua medida" | theStacc: não dizer "em estoque" sem confirmação, e sim "consultar disponibilidade". |
| 7 | **Avaliações + mapa + horário** | — |

### 3.2 Direção visual
**Paletas**
- Observadas, só por descrição: MotoCMS "black-and-white design accentuated with yellow" (preto e branco com amarelo);
  Apex (Zarla) "vivid blue color-field … with a yellow accent" (azul forte com acento amarelo). Não li hex de borracharia real.
- Proposta A, "sinalização" (alto contraste, ótimo ao sol): preto `#111111`, amarelo `#FFD000`, branco `#FFFFFF`,
  vermelho de urgência `#E11D2E` só no botão 🚨.
- Proposta B, "rápido e claro" (como o Apex): azul `#0B5FFF`, amarelo `#FFC400`, fundo `#F3F6FB`, texto `#0E1726`.
- Proposta C, "asfalto": grafite `#1C1F24`, laranja `#FF7A00`, cinza `#9AA3AD`. Faixas diagonais tipo zebrado como
  divisor — a Royal Auto Finishes usa "yellow diagonal hazard stripes" (listras diagonais amarelas de perigo) como identidade.

**Fontes (proposta)**
- **Anton**, **Bebas Neue** ou **Archivo Black** nos títulos curtos (cara de placa); **Inter** ou **Archivo** no texto.

**Foto**
- Pneu sendo trocado, calibrador, a fachada com a placa "Borracharia", o carro de socorro (se houver).
- Close de banda de rodagem como textura de fundo (escurecida).

### 3.3 Interações e como fazer
- **Botão de socorro com localização**:
  ```js
  socorro.onclick = () => navigator.geolocation.getCurrentPosition(p => {
    const link = `https://maps.google.com/?q=${p.coords.latitude},${p.coords.longitude}`;
    location.href = `https://wa.me/55${NUM}?text=` + encodeURIComponent(`Socorro! Pneu furado. Estou aqui: ${link}`);
  }, () => location.href = `https://wa.me/55${NUM}?text=` + encodeURIComponent('Socorro! Pneu furado. Estou em: '));
  ```
  Ao lado, um `tel:` grande ("Ligar agora"): em emergência, ligar é mais rápido. Sem permissão de localização, cai na
  mensagem com o campo em branco.
- **"Aberto agora"** com o horário real (mesmo JS da oficina). Se o horário for 24 h, mostrar "Atendimento 24 h" só quando o
  cliente confirmar.
- **"Qual a medida do seu pneu?"**: um pequeno guia com uma imagem/ilustração mostrando onde ler "175/70 R14" na lateral, e
  três campos → mensagem "Tem pneu 175/70 R14? Quero preço de [novo/remold]". O theStacc pede para guardar esse dado e
  deixar a confirmação com a loja.
- **Barra fixa de ação** com 🚨 Socorro em vermelho no meio.

### 3.4 Textos que vendem
- Título: "Pneu furou? A gente resolve. Borracharia em [Bairro], [Cidade]."
- Urgência: "Está parado na rua? Toque aqui e mande sua localização pelo WhatsApp."
- Planejado: "Conserto de furo, troca, balanceamento e calibragem — chega e sai rodando."
- Medida: "Mande a medida do pneu e a gente responde se tem e quanto fica."
- Fecho: "Antes de pegar a estrada, passa aqui para calibrar e conferir os pneus."

### 3.5 Erros a evitar
- Escrever "24 horas" sem atender 24 h (foi a reclamação vista nos diretórios).
- Prometer tempo de chegada do socorro.
- Esconder o telefone atrás de formulário (em urgência ninguém preenche formulário).
- Dizer "temos todas as medidas".
- Site pesado ou escuro demais para ler na rua, no sol.
- Esquecer motos e caminhões quando a borracharia atende esses veículos.

---

## 4. LOJA DE ROUPAS (loja física de bairro)

Observação central (Zarla): "Does a physical clothing shop need a different website from an online brand? Yes — it needs to
say where it is and when it opens." (uma loja física precisa de um site diferente de uma marca on-line? Sim: precisa dizer
onde fica e quando abre). A Cake Plus-Size "treats its website like a shop window" (trata o site como vitrine): foto do
salão, endereço, contato e horário de cada dia na primeira tela. Para loja de bairro sem e-commerce, o site é **vitrine +
"reserva pelo WhatsApp" + "venha provar"**.

### 4.1 Ordem das seções
| # | Seção | Por quê |
|---|-------|---------|
| 1 | **Faixa do topo** com 1 promessa real ("Chegou coleção nova", "Separamos para você provar", "Entrega no bairro" se houver) | Zarla: a promessa de envio fica "in a strip above the header, in one line" (numa faixa acima do cabeçalho, em uma linha) em quase todos os sites. Na loja física, troque pelo serviço da loja. |
| 2 | **Capa = uma foto forte + nome da estação/coleção em 2–5 palavras + 1 botão** | Zarla: "one photograph and the season" (uma foto e a estação); Wild Oak: "new season. new fits." (nova estação, novos caimentos); Taylor Stitch: título de duas palavras e um botão. |
| 3 | **Categorias em blocos com foto**, rotuladas por ocasião ("Para o trabalho", "Festa", "Dia a dia", "Plus size") | Hazel & Olive rotula por evento ("CONCERT CLOTHES", "HOMECOMING DRESSES"): "The last two labels are searches, not categories" (os dois últimos rótulos são buscas, não categorias). |
| 4 | **Vitrine / lookbook** (6–12 looks, cada um com "Quero este" → WhatsApp) | Blog da AI Frontdesk: incluir tamanho e preço em cada look ajuda a decidir (fonte de fornecedor, peso menor). Gosmarter: tecido, medidas, cores e preço, porque a falta disso faz o cliente desistir. |
| 5 | **A loja por dentro** (fotos do salão e do provador) + **endereço, horário por dia, "Como chegar"** | Cake Plus-Size. |
| 6 | **Como funciona a reserva** ("Escolha → mande no WhatsApp → separamos por X horas → venha provar") | Proposta nossa, para unir site e visita. |
| 7 | **Avaliações / Instagram** (prints reais ou link) | — |
| 8 | **FAQ** (troca, tamanhos, pagamento, provador) | ThunderEgg (via busca): FAQ de tamanho, entrega e troca. |
| 9 | **Chamada final + mapa** | — |

### 4.2 Direção visual
Zarla: "The photograph carries the palette, so the interface stays white, black and one accent" (a foto carrega a paleta;
a interface fica em branco, preto e um acento).

**Paletas observadas**
- **Wild Oak** (lida via `branding`): fundo off-white `#FBF9F6`, rosa-terroso `#926E6E`, taupe `#B3A2A0`, vermelho de
  promoção `#C52838`, texto `#111111`. Botões de pílula (raio 999 px). Fonte Figtree.
- **Cake Plus-Size** (lida via `branding`): preto `#000000`, fundo `#FAFAFA`, texto `#4B4B4B`, cantos retos. Títulos em
  **Oswald** (condensada e pesada).
- **Petal & Pup / Hazel & Olive** (descrição da Zarla): branco + rosa-chá / blush.
  - Proposta: `#FFFFFF` / `#E8B4B8` / `#2B2B2B` / `#F6EDE8`.

**Fontes**
- Proposta: **Cormorant Garamond** ou **Playfair Display** (título editorial com serifa, como a Taylor Stitch e a Faherty)
  + **Figtree** ou **Jost** no texto.
- Para loja jovem/streetwear: **Oswald** ou **Anton** + **Inter**.
- Script só em uma palavra, como a Petal & Pup.

**Foto**
- Peças vestidas em gente real (de preferência clientes ou equipe, com autorização), em fila mostrando a variedade (Wild Oak:
  "Five washes in one photograph", cinco lavagens de jeans numa foto só).
- O salão e o provador bem iluminados, e a fachada.
- Nada de manequim de loja em foto escura.

### 4.3 Interações e como fazer
- **"Quero este look" → WhatsApp com a peça e o tamanho**:
  ```html
  <article class="look" data-revelar>
    <img src="fotos/look-3.jpg" alt="Vestido midi verde">
    <h3>Vestido midi</h3><p class="det">Viscose · P ao GG</p>
    <div class="tam" role="radiogroup"><button>P</button><button>M</button><button>G</button><button>GG</button></div>
    <a class="micro btn" data-wa="Oi! Vi no site o Vestido midi (look 3). Tem no tamanho {T}? Pode separar pra eu provar?">Separar para provar</a>
  </article>
  ```
  O JS troca `{T}` pelo tamanho escolhido e monta o `wa.me`. O preço só aparece se a loja informar.
- **Lookbook com rolagem lateral** (`scroll-snap-type: x mandatory`, cartões `scroll-snap-align: center`) no celular e grade
  no computador. Leve e sem biblioteca.
- **Hover troca a foto** (frente → costas): duas `<img>` sobrepostas e `opacity` no `:hover`. No celular, um toque alterna.
- **"Aberto agora" + horário de cada dia** (como a Cake) e o botão "Como chegar".
- **Esqueleto de carregamento** (`[data-esqueleto]`, já no projeto) na grade de looks, que tem muitas fotos.
- **Filtro por ocasião** sem recarregar: botões que alternam a classe `.oculto` por `data-ocasiao`.

### 4.4 Textos que vendem
- Capa: "Coleção de verão chegou." / "Novidades toda semana em [Bairro]."
- Subtítulo: "Escolha aqui, a gente separa e você prova com calma na loja."
- Botão do look: "Separar para provar" · "Tem no meu tamanho?"
- Categorias: "Pro trabalho" · "Pra sair à noite" · "Dia a dia confortável" · "Do P ao G4" (só se for verdade).
- Promoção (em vez de "SALE"): "Última chamada" / "Peças com preço de despedida". A Zarla cita a Taylor Stitch, que
  renomeia a liquidação para "Last Call" (última chamada).
- Fecho: "Passa aqui! [Rua], [nº] — aberto hoje até as 19h."

### 4.5 Erros a evitar
- Montar como e-commerce (carrinho, frete, checkout) quando a loja vende no balcão e no WhatsApp.
- Esconder endereço e horário.
- Fotos de banco ou de fornecedor com marca d'água.
- Preço desatualizado (melhor não pôr preço do que errar).
- Muitas cores na interface brigando com as roupas.
- Grade de 60 fotos pesadas sem compressão (o LCP passa de 2,5 s).
- Prometer "tem todos os tamanhos".

---

## 5. Resumo para o Gato (tabela rápida)

| Nicho | Clima | Paleta-base sugerida | Títulos / texto | Peça-chave | Ação principal |
|---|---|---|---|---|---|
| Oficina | confiança, técnica | ardósia `#1E2A33` + laranja `#F26A1B` + claro `#F4F2EE` (ou preto + ouro `#FFC513`, como a Astra) | Barlow Condensed / Inter | orçamento guiado carro + sintoma | "Pedir orçamento no WhatsApp" |
| Estética | brilho, cuidado | `#0B0F12` + ciano `#22D3EE` (ou laranja `#F96800`, como a CCT) | Saira Condensed / Inter | antes/depois + preço por porte | "Agendar / pedir valor" |
| Lava jato bairro | rápido, simpático | `#F7F5EF` + verde `#1F3B2D` + amarelo `#FFC83D` | Outfit / Inter | pacotes fixos + "Como chegar" | "Agendar lavagem" |
| Borracharia | urgência, clareza | preto `#111111` + amarelo `#FFD000` (+ vermelho `#E11D2E` no socorro) | Anton / Inter | botão de socorro com localização + "Aberto agora" | "Socorro: mandar localização" |
| Loja de roupas | vitrine, editorial | off-white `#FBF9F6` + rosa-terroso `#926E6E` + vermelho `#C52838` (Wild Oak) | Cormorant Garamond / Figtree | lookbook com "Separar para provar" | "Separar para provar" |

---

## 6. Fontes (páginas que abri)

**Lidas por inteiro (Firecrawl)**
- Zarla — Auto Repair Website Examples: https://www.zarla.com/inspiration/auto-repair
- Zarla — Car Detailing Website Examples: https://www.zarla.com/inspiration/car-detailing
- Zarla — Clothing Store Website Examples: https://www.zarla.com/inspiration/clothing-store (aberta a partir de
  /guides/boutique-website-examples, que redireciona para ela)
- Detailers Roadmap — Car Detailing Website Examples That Actually Book Jobs: https://www.detailersroadmap.com/car-detailing-website-examples
- theStacc — Tire Shop Website Design Examples: https://thestacc.com/blog/tire-shop-website-design-examples/
- Colorlib — 21 Best Car Wash Website Design Examples: https://colorlib.com/wp/car-wash-website-design/

**Cores e fontes lidas do site real (Firecrawl `branding`)**
- Astra Automotive: https://www.astraauto.ca/
- Ace Mechanics: https://www.acemechanics.com.au/
- Ceramic Coat Texas / CCT: https://www.ceramiccoattexas.com/
- Wild Oak Boutique: https://www.wildoakboutique.com/
- Cake Plus-Size Resale: https://cakeplussize.com/
- wowautospa.com — redireciona hoje para um site de apostas; serve só de alerta sobre domínio vencido.

**Vistas só como trecho de busca** (não abri a página inteira; usei apenas o que o trecho dizia)
- UENI — 30 Best Mechanic Website Examples: https://ueni.com/blog/mechanic-websites/
- DesignDetail — Car Detailing Website Best Practices: https://designdetail.io/blog/car-detailing-website-best-practices-conversions
- web.dev — limites dos Core Web Vitals: https://web.dev/articles/defining-core-web-vitals-thresholds
- Bird e Unipile — link wa.me com texto: https://bird.com/explained/whatsapp/what-is-a-whatsapp-click-to-chat-link ·
  https://www.unipile.com/br/?p=275019
- O Mecânico — aprovação de orçamento por WhatsApp: https://omecanico.com.br/whatsapp-serve-para-aprovar-orcamento-da-oficina/
- Diretórios de borracharia (Solutudo, Bendito Guia, Lista Mais):
  https://www.solutudo.com.br/borracharia-movel-24hs-18404571 ·
  https://www.benditoguia.com.br/empresa/borracharia-movel-do-daniel-planalto-aracatuba-sp ·
  https://www.listamais.com.br/local/5DQ9Df/borracharia-movel-do%20jean-borracharias-em-aracatuba-sp
- MotoCMS — template de pneus: https://www.motocms.com/website-templates/motocms-ecommerce-template/81567.html
- Polimento × vitrificação: https://www.icarros.com.br/noticias/geral/como-aplicar-vitrificacao-automotiva/31467.html ·
  https://jovempan.com.br/noticias/veiculos/qual-a-diferenca-exata-entre-polimento-cristalizacao-e-vitrificacao-da-pintura-do-carro.html
- Moda e WhatsApp: https://gosmarter.com.br/?p=9477 ·
  https://www.myaifrontdesk.com/blog/tips-for-creating-and-promoting-an-online-lookbook-for-your-clothing-boutique
- Slider de antes e depois com clip-path e range:
  https://instagit.com/emilkowalski/skills/how-to-build-comparison-sliders-clip-path.md ·
  https://www.cssscript.com/comparison-slider-before-after-image/
