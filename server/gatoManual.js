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

11. SITE PROFISSIONAL PASSO A PASSO (da Biblioteca do Gato — playlist "Como Criar um Site Profissional para sua Empresa",
    Darlan Evandro: site do zero, site pelo celular, landing page, site de vendas e e-mail profissional)
- Landing page = UMA página com UM objetivo. Para comércio local o objetivo é o contato (WhatsApp/agendar/visitar); corte o que
  não leva a ele.
- Site montado em BLOCOS (seções) que se reorganizam: cabeçalho → capa → sobre → serviços/produtos → fotos → avaliações →
  contato com mapa → rodapé. Cada bloco com uma altura justa: no celular, nenhuma seção vazia ou alta demais.
- Cabeçalho com o nome (ou logo real) à esquerda e menu curto de âncoras (Sobre, Serviços, Contato) que leva à seção certa.
- Cada botão com o link do tipo certo: WhatsApp (https://wa.me/55…), telefone (tel:+55…), e-mail (mailto:, só se o comércio
  tiver e-mail real), mapa ("Como chegar") ou âncora da própria página (#servicos). Botão sem link não existe.
- Botão com estado de hover visível: a cor de destaque escurece (ou clareia) um tom e a transição é suave.
- Imagem de fundo de seção sempre com camada de transparência/cor por cima para o texto ler bem.
- Versão do celular revisada de propósito, não só "encolhida": texto nunca por cima de foto sem overlay, nada sobreposto,
  botões ao alcance do polegar, fonte confortável.
- Se o comércio VENDE PRODUTOS (loja, confeitaria, açaí, autopeças…): vitrine em cards com a foto real, nome e descrição curta;
  preço só se veio nos dados; botão "Pedir pelo WhatsApp" em cada card. Organize por categorias quando houver muitas.
- No <head>: <title> "Nome — ramo em Cidade", <meta name="description"> com 1 frase do que é + cidade, e as metas de
  compartilhamento og:title, og:description e og:image="{{FOTO_1}}" (é a prévia que aparece quando mandam o link no WhatsApp).
- Contato completo e real no rodapé: endereço, telefone/WhatsApp, horário (se veio nos dados) e o nome do comércio.
- Antes de entregar, revise como um cliente: português sem erro, todo link/botão funcionando, todas as fotos aparecendo, nada
  de texto de modelo esquecido ("Lorem ipsum", "Sua empresa", "Título aqui").
- Profissionalismo vem de detalhe: domínio próprio (nome.com.br) e e-mail com o domínio (contato@nome.com.br) passam mais
  confiança que @gmail/@hotmail — nunca escreva um e-mail ou domínio que o comércio não tem; se não houver, não mostre.
`
