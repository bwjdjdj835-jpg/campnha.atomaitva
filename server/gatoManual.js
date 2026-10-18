// 📘 Manual de agência do 🐈‍⬛ Gato (pedido do usuário: "uma biblioteca para o meu agente estudar e criar sites profissionais").
// Vai junto em todo pedido que o Gato faz à IA para montar um site. Regras de design de agência adaptadas a comércio local
// brasileiro, inspiradas nas boas práticas de front-end (ex.: a skill "frontend-design" da Anthropic) — texto nosso.

export const MANUAL_DO_GATO = `MANUAL DE AGÊNCIA DO GATO NEGRO — sites para comércio local (barbearia, salão, oficina, pet shop, restaurante…)

1. OBJETIVO DO SITE
- Uma página que faz o visitante AGENDAR / CHAMAR NO WHATSAPP / VIR ATÉ O LOCAL. Todo botão principal leva a isso.
- Em 5 segundos o visitante entende: o que é, onde fica, por que confiar, como chamar.
- Mobile-first: 80% abre no celular. Botões com no mínimo 44px de altura, texto base 16–18px, nada de rolagem lateral.

2. FUGIR DO "VISUAL DE IA" (genérico)
- Nada de gradiente roxo-azul aleatório, emojis como ícones em todo lugar, cards todos iguais e centralizados, "Bem-vindo ao nosso site".
- Escolha UMA direção clara e vá até o fim: ex. rústico escuro (barbearia, oficina, hamburgueria), claro acolhedor (salão,
  estética, pet, clínica), editorial elegante, moderno com cor forte. Coerência vale mais que enfeite.
- Títulos curtos e com personalidade do ramo ("Corte na régua, barba no capricho"), sem clichê corporativo.

3. TIPOGRAFIA
- No máximo 2 famílias do Google Fonts: uma de títulos com caráter (ex.: Outfit, Sora, Fraunces, Playfair Display, Bebas Neue)
  e uma de texto muito legível (Inter, Plus Jakarta Sans, DM Sans, Manrope).
- Escala marcante: título da capa grande (clamp(2.6rem, 9vw, 6rem)), letter-spacing negativo leve nos títulos, rótulos pequenos
  em CAIXA ALTA com espaçamento largo acima dos títulos de seção.
- Linhas de texto com no máximo ~65 caracteres; line-height 1.5–1.7 no texto, 1.05–1.15 nos títulos.

4. COR E CONTRASTE
- Paleta de 3–4 cores: fundo, fundo alternado (seções intercaladas), texto e UMA cor de destaque usada com parcimônia (botões,
  números, detalhes). Use variáveis CSS (--fundo, --texto, --destaque…).
- Contraste de leitura sempre alto (texto claro em fundo escuro e vice-versa). Sobre foto, use overlay escuro (gradiente).

5. LAYOUT E RITMO
- Capa em tela cheia com a melhor foto real, overlay, título, frase curta e botão grande "Agendar pelo WhatsApp".
- Seções com respiro (padding vertical 64–120px), largura máxima ~1100–1200px, alternando fundo para dar ritmo.
- Ordem que vende: capa → prova (nota do Google, números reais) → serviços → fotos/resultado → como funciona → avaliações reais →
  agendamento → contato com mapa e "Como chegar".
- Serviços em grade de cards (2 colunas no celular grande, 3 no computador), cada card clicável levando ao WhatsApp.
- Cantos arredondados consistentes (ex.: 16–24px), sombras suaves e longas, bordas finas translúcidas ("vidro").

6. INTERAÇÃO E MOVIMENTO (micro-interações)
- Botões e cards com transição de 0.3s (cubic-bezier(.22,1,.36,1)): hover sobe 2px e ganha sombra; active encolhe para 0.97.
- Seções entram ao rolar (marque com data-revelar; os filhos em cascata com data-cascata) — o app já traz o script.
- Movimento com propósito, nunca atrapalhando a leitura; respeite prefers-reduced-motion.

7. FOTOS
- Só as fotos reais do comércio. Proporções consistentes (4:3 na galeria, 4:5 em destaque), object-fit: cover.
- Envolva cada foto num bloco com data-esqueleto (o app mostra um brilho de "carregando" até a foto chegar).

8. CONFIANÇA E VERDADE (obrigatório)
- Nunca inventar preço, depoimento, prêmio, ano de fundação, equipe, certificado, telefone ou endereço.
- Sem depoimento escrito real: mostre a nota e o número de avaliações do Google + botão "Ver avaliações no Google".
- Botão flutuante do WhatsApp fixo no canto inferior direito.

9. BIBLIOTECA DO GATO (peças prontas — use exatamente estas marcações; o app liga o comportamento)
- Revelar ao rolar: <section data-revelar> … <div data-cascata>…</div> …
- Foto com carregamento: <div data-esqueleto class="sua-classe"><img src="{{FOTO_n}}" alt="…"></div>
- Antes e Depois (só quando informado o par de fotos):
  <div data-antes-depois data-esqueleto class="ad-caixa">
    <img src="{{FOTO_depois}}" alt="Depois"><img src="{{FOTO_antes}}" alt="Antes" class="ad-antes">
    <span class="ad-rotulo" style="left:12px">Antes</span><span class="ad-rotulo" style="right:12px">Depois</span>
    <div data-ad-linha role="slider" tabindex="0" aria-label="Comparar antes e depois" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"></div>
  </div>
  (dê à .ad-caixa uma proporção, ex. aspect-ratio:4/3, e cantos arredondados; o app cuida do arraste.)
- Agendamento online (só quando informado): escreva exatamente <!--AGENDA--> no lugar da seção; o app coloca a agenda real.
  Estilize a classe .agenda-botao com a cor de destaque.

10. TEXTO QUE VENDE (da Biblioteca do Gato — e-book "Criando um site para ganhar dinheiro", Carlos A. Leutz)
- Chamada para ação no IMPERATIVO, curta e direta: "Agende seu horário", "Chame no WhatsApp", "Veja como chegar". Frase sutil não
  gera resposta. O botão principal aparece logo na capa e de novo no fim.
- Um foco por bloco: cada seção fala de uma coisa só (como as propagandas da Apple); nada de parágrafos longos.
- Mostre o BENEFÍCIO, não só o serviço: "Saia com o visual renovado" > "Fazemos cortes". Ganhos: praticidade, conveniência,
  resolver um problema, cuidado.
- Gente gera conexão: entre as fotos reais, prefira na capa e nos destaques as que mostram pessoas ou o resultado (corte pronto,
  carro brilhando, pet tosado) em vez de fachada vazia — sem inventar foto.
- Contraste forte entre botão e fundo para o olho achar a ação.
- Prova vem dos clientes: use a nota e as avaliações reais do Google perto da chamada principal.

11. RECEITAS POR NICHO (pesquisa de out/2026 em sites reais; docs/estudo-nichos/). Use a do ramo como ponto de partida — a imagem
escolhida pelo dono manda mais. Paletas: fundo / destaque / apoio. Fontes: título + texto (Google Fonts).
- Barbearia clássica: escuro #080908 / #96885F / #D7D3C8 · Barlow Condensed + Montserrat · capa com o salão e película escura ·
  serviços numerados, equipe, nota do Google, rota.  Barbearia moderna: claro #FBF8F2 / #EE4037 / #000 · Archivo + Inter · foto P&B.
- Salão de beleza: claro #FFFAF8 / #B3272B / #F8DDD8 · Cormorant Garamond (itálico) + Montserrat · trabalhos por especialidade,
  comodidades, FAQ. Acolhedor: #FFFFFF / #F6AFA1 / #292145 · Cormorant Infant + Onest · galeria bento, pílulas arredondadas.
- Manicure / nail: claro #FFFFFF / #765378 / #D3B8EB · Playfair Display + Raleway · close das mãos, preço + duração, higiene.
- Estética: claro #FAF8F5 / #9A734B / #E1D0BB · Playfair Display + Inter · profissionais com registro, antes e depois com aviso,
  muito respiro (nunca prometa resultado).
- Pizzaria: creme #FFF9EE / vermelho tomate #CE2A1E / amarelo #FDB912 (botão verde manjericão #316131) · cardápio em abas, sabor
  em destaque, "Fazer pedido".  Hamburgueria/lanchonete: escuro #1D3012 / mostarda #FFB000 ou branco + verde #418613 · combos.
- Restaurante: quente #FDB913 / marrom #4D2F29 (regional) ou claro neutro · prato do dia, horário de almoço, como chegar.
- Açaí: creme #F5EEE0 / roxo #4A1F60 / amarelo #FFBB33 (ou noturno #1E0B2B + verde-limão #B6E36B) · monte seu copo.
- Padaria/confeitaria: branco #FFFFFF / caramelo #C87E1E ou creme #F8F5F0 / terracota #DE7D58 · fornadas, encomendas de bolo.
- Pet shop: claro quente · Fredoka + Nunito · azul bebê #95B3EC ou coral #FF6B5A · agendar banho e tosa por porte do pet.
- Academia: escuro · Anton ou Bebas Neue + Inter · lima #C6F432 ou laranja #FF5A1F · planos, "aula experimental" no WhatsApp.
- Ótica: claro neutro · Outfit + Inter · laranja queimado #DB4D11 · "mande sua receita" no WhatsApp, marcas e armações.
- Floricultura: creme · Cormorant Garamond + Lora · sálvia #607369 ou rosé #F2B8C6 · buquês, horário-limite de entrega.
- Oficina: ardósia #1E2A33 / laranja #F26A1B / claro #F4F2EE · Barlow Condensed + Inter · orçamento (carro + problema).
- Estética automotiva: escuro #0B0F12 + ciano #22D3EE · Saira Condensed + Inter · antes e depois, valor por porte do carro.
- Lava jato: claro #F7F5EF / verde #1F3B2D / amarelo #FFC83D · Outfit + Inter · pacotes, "Agendar lavagem", como chegar.
- Borracharia: preto #111111 / amarelo #FFD000 (+ vermelho #E11D2E no socorro) · Anton + Inter · "Aberto agora" e socorro com
  localização no WhatsApp bem no topo.
- Loja de roupas: off-white #FBF9F6 / rosa-terroso #926E6E / vermelho #C52838 · Cormorant Garamond + Figtree · lookbook, "Separar
  para provar".

12. REGRAS DE CONVERSÃO (todo site)
- O botão diz a ação do ramo: "Agendar" (beleza, saúde, pet, academia), "Fazer pedido" (comida), "Pedir orçamento" (oficina e
  serviços) ou "Chamar no WhatsApp" (o resto). Use o rótulo e a mensagem que vierem em "acao" nos dados.
- Cada botão do WhatsApp com mensagem pronta: href="LINK_DO_WHATSAPP?text=" + texto codificado (encodeURIComponent). Na capa e no
  fim a mensagem geral; em cada serviço, "Olá! Vi no site e quero … <nome do serviço>."
- Horário perto do topo quando vier nos dados ("horario"); nunca invente horário. Escreva <span data-aberto></span> ao lado do botão
  da capa: o app troca pelo selo "Aberto agora / Fechado" calculado na hora.
- "Como chegar" com Google Maps; Waze e Uber quando vierem os links nos dados.
- Nota e número de avaliações só se vierem nos dados (do Google). Nada de estrelas inventadas.
`
