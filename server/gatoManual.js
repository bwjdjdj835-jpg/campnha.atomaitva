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
`
