# Estado da arte 2025–2026: sites one-page para comércio local

> Pesquisa feita em 15/10/2026 com busca na web (WebSearch + Firecrawl). Alguns sites (web.dev, developers.google.com,
> MDN) não puderam ser abertos direto deste ambiente; nesses casos os dados vieram dos trechos indexados das próprias
> páginas oficiais, com o link. **Todo número tem link.** Quando a fonte é secundária ou antiga, isso está escrito do lado.
> Nada aqui é dado de comércio real.

---

## Resumo em 10 regras (o que aplicar já)

1. **Celular primeiro e rápido**: meta de LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 no percentil 75 ([web.dev – Web Vitals](https://web.dev/articles/vitals)). Foto da capa em AVIF/WebP com `fetchpriority="high"`, sem `loading="lazy"` nela.
2. **WhatsApp em 3 lugares**: na capa (botão principal), fixo no canto inferior direito e na chamada final — sempre com mensagem pronta (`wa.me/55DDNUMERO?text=...`) ([WhatsApp FAQ](https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat?lang=kk)).
3. **Responder nos primeiros segundos**: o que é, onde fica, se está aberto agora, como chamar. Telefone/endereço/horário perto do topo.
4. **Prova social real**: nota + nº de avaliações do Google com link para o perfil. Não usar estrelas falsas nem marcação `AggregateRating` do próprio negócio (o Google não mostra e trata como "self-serving") ([Google – Review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)).
5. **JSON-LD `LocalBusiness`** (subtipo certo: `HairSalon`, `Restaurant`, `AutoRepair`…) com `address`, `telephone` com DDI, `openingHoursSpecification`, `geo` com 5 casas decimais ([Google – LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business)).
6. **Mapa como "fachada"**: imagem estática + botão "Como chegar"; o iframe do Maps só com `loading="lazy"` ou no clique ([web.dev – embeds](https://web.dev/articles/embed-best-practices)).
7. **Animação = enfeite progressivo**: Intersection Observer ou `animation-timeline: view()` com fallback; tudo desligado com `prefers-reduced-motion` ([W3C – SC 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)).
8. **Carrossel nunca gira sozinho no celular**; arrastar com dedo, ≤ 5 itens, indicador de posição ([NN/g – Auto-forwarding](https://www.nngroup.com/articles/auto-forwarding/), [NN/g – Carousels](https://www.nngroup.com/articles/designing-effective-carousels/)).
9. **Fotos reais do comércio** > banco de imagem: o usuário examina fotos de produtos e pessoas reais e ignora as genéricas ([NN/g – Photos as Web Content](https://www.nngroup.com/articles/photos-as-web-content/)).
10. **Agendamento**: se o comércio já usa Trinks/Booksy/AgendaPro/Calendly/Cal.com, botão "Agendar online" para o link deles; o mesmo link no Perfil da Empresa no Google ([Google – links de reserva](https://support.google.com/business/answer/6218037?hl=en)).

---

## A) Conversão de site de negócio local

### A1. Velocidade e Core Web Vitals

| Métrica | Bom | Ruim | Fonte |
|---|---|---|---|
| LCP (maior elemento visível) | ≤ 2,5 s | > 4 s | [web.dev/articles/lcp](https://web.dev/articles/lcp) |
| INP (resposta ao toque) | ≤ 200 ms | > 500 ms | [web.dev/articles/inp](https://web.dev/articles/inp) |
| CLS (layout pulando) | ≤ 0,1 | > 0,25 | [web.dev/articles/optimize-cls](https://web.dev/articles/optimize-cls) |

- A página "passa" quando as três metas são atingidas no **percentil 75** das visitas (3 de cada 4) — escolha explicada em [How the Core Web Vitals thresholds were defined](https://web.dev/articles/defining-core-web-vitals-thresholds).
- INP substituiu o FID em março/2024 (fonte secundária: [sizzy.co](https://sizzy.co/blog/core-web-vitals-guide)).
- **Impacto em negócio**: estudo da Deloitte encomendado pelo Google — melhorar 0,1 s a velocidade no celular aumentou a conversão em **8,4% no varejo** e **10,1% em viagens** ([web.dev – Milliseconds make millions](https://web.dev/case-studies/milliseconds-make-millions)). Atenção: o ganho exigia melhorar 0,1 s em todas as páginas da jornada e é correlação, não garantia ([MediaPost](https://www.mediapost.com/publications/article/352986/speed-turns-into-a-performance-metric-per-google.html)).
- O clássico "**53%** das visitas no celular são abandonadas se a página demora mais de 3 s" é de 2016–2017 ([Think with Google](https://thinkwithgoogle.com/consumer-insights/consumer-trends/mobile-site-load-time-statistics/)). Ainda é citado, mas é dado antigo.
- Estudos de caso web.dev: The Economic Times passou nas CWV e reduziu a taxa de rejeição em 43% ([web.dev](https://web.dev/case-studies/economic-times-cwv?hl=en)).

**Na prática, para um one-page:**
```html
<!-- capa: a foto é o LCP -->
<link rel="preload" as="image" href="/fotos/capa-1200.avif" fetchpriority="high">
<img src="/fotos/capa-1200.avif" width="1200" height="800" alt="Fachada da barbearia"
     fetchpriority="high" decoding="async">
<!-- resto das fotos -->
<img src="/fotos/foto-3.webp" width="800" height="600" loading="lazy" alt="Corte degradê">
```
- `width`/`height` em toda imagem (evita CLS). Fonte do Google com `display=swap` e no máximo 2 famílias.
- Nada de biblioteca pesada na capa; JS de efeitos com `defer`.

### A2. O que o visitante procura primeiro

- O NN/g não tem um estudo dedicado a "site de comércio local" que eu tenha achado; as diretrizes gerais de homepage pedem que o site diga logo quem é e o que faz e mostre fotos de pessoas reais ligadas ao conteúdo ([NN/g – 113 Homepage Guidelines](https://www.nngroup.com/articles/113-design-guidelines-homepage-usability/)).
- Fonte secundária (2012): a seção mais visitada de site de loja física é "onde fica/horário/telefone" ([smallbizsurvival.com](https://smallbizsurvival.com/2012/04/is-your-website-missing-1-most-used.html)) — antiga, mas coerente com o Perfil do Google.
- Ordem recomendada no one-page: **Capa (nome + o que faz + bairro + botão WhatsApp + "aberto agora")** → prova social → serviços → fotos → como chegar/horário → chamada final.

### A3. Botão de WhatsApp

- Link oficial: `https://wa.me/<número internacional sem +, zeros, parênteses ou traços>?text=<mensagem codificada>`; sem número abre a lista de contatos; o texto aparece na caixa e o usuário ainda toca em enviar ([WhatsApp – click to chat](https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat?lang=kk)).
- Contexto Brasil: pesquisa Opinion Box (jun/2025, 1.126 pessoas) — **97%** acessam o WhatsApp ao menos uma vez por dia ([Canaltech](https://canaltech.com.br/apps/o-que-os-brasileiros-mais-fazem-no-whatsapp-segundo-pesquisa/)); CX Trends 2025 (Octadesk + Opinion Box): **30%** já usam o app para comprar ([Digisac](https://digisac.com.br/blog/whatsapp-no-brasil)). Dados de pesquisa divulgada pelo próprio WhatsApp (jun/2026): **73,3%** preferem mandar mensagem a empresas a usar outros canais ([ABC da Comunicação](https://www.abcdacomunicacao.com.br/73-dos-consumidores-preferem-mensagens-e-64-ja-compram-pelo-whatsapp-aponta-pesquisa-da-plataforma/)).
- **Botão flutuante**: o NN/g define o FAB como o controle da ação mais importante, que fica na tela durante a rolagem e é muito usado no celular ([NN/g – UI glossary](https://www.nngroup.com/articles/ui-elements-glossary/)); o canto inferior direito é onde o usuário espera um controle persistente ([NN/g – Back-to-top](https://www.nngroup.com/articles/back-to-top/)). Botão fixo no rodapé "custa" tela, então mantenha pequeno ([NN/g – iOS rules to break](https://www.nngroup.com/articles/4-ios-rules-break/)). Rótulo claro ("Chamar no WhatsApp"), nunca genérico ([NN/g – "Get Started" stops users](https://www.nngroup.com/articles/get-started/)).
- Cabeçalho fixo: pequeno, sem animação, ou que some ao descer e volta ao subir ([NN/g – Sticky headers](https://www.nngroup.com/articles/sticky-headers/)).

```html
<a class="zap" href="https://wa.me/5569999999999?text=Ol%C3%A1!%20Vi%20o%20site%20e%20quero%20agendar%20um%20hor%C3%A1rio."
   aria-label="Chamar no WhatsApp" target="_blank" rel="noopener">WhatsApp</a>
<style>
.zap{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));
     min-height:48px;padding:0 18px;border-radius:999px;display:flex;align-items:center;z-index:50}
</style>
```
Dica: mensagem pronta diferente por botão (capa: "quero agendar"; serviço X: "quanto custa o X?") ajuda o dono a saber de onde veio.

### A4. Prova social com avaliações do Google

BrightLocal — Local Consumer Review Survey 2026 ([página da pesquisa](https://www.brightlocal.com/research/local-consumer-review-survey/)):
- **97%** leem avaliações de negócios locais.
- **68%** só usam negócio com 4★ ou mais (eram 55% em 2025); **31%** exigem 4,5★+ (eram 17%).
- **74%** procuram avaliações dos últimos 3 meses; **47%** não usam negócio com menos de 20 avaliações.
- **89%** esperam que o dono responda às avaliações.
- Uso de IA para achar negócio local subiu de 6% (2025) para **45%** ([BrightLocal – AI trust](https://www.brightlocal.com/research/lcrs-ai-trust/)).
(Pesquisa com consumidores dos EUA; serve como tendência, não como dado do Brasil.)

**Como mostrar no site:**
- Nota + nº de avaliações + "Ver no Google" (link do perfil). Depoimento escrito só se for cópia real (o projeto já faz isso com `depoimentosConferidos`).
- **Não** pôr `AggregateRating`/`Review` do próprio negócio no JSON-LD esperando estrelas: desde 2019 o Google não mostra estrelas de LocalBusiness/Organization quando o próprio negócio controla as avaliações, mesmo vindas de widget ([Google Search Central Blog 2019](https://developers.google.com/search/blog/2019/09/making-review-rich-results-more-helpful)).
- Avaliação recente pesa mais que avaliação antiga (74% querem dos últimos 3 meses, link acima) → mostrar a data, se houver.

### A5. "Aberto agora" e horário

Calcular no navegador a partir do mesmo horário do JSON-LD (fuso de Brasília/Rondônia):
```js
// horarios: { 1:[["09:00","19:00"]], ..., 6:[["08:00","13:00"]], 0:[] }  (0 = domingo)
function abertoAgora(horarios, fuso = 'America/Porto_Velho') {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:fuso,weekday:'short',
    hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date()).map(x=>[x.type,x.value]));
  const dia = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(p.weekday);
  const agora = `${p.hour}:${p.minute}`;
  return (horarios[dia]||[]).some(([a,f]) => agora >= a && agora < f);
}
```
Mostrar "🟢 Aberto agora · fecha às 19h" / "🔴 Fechado · abre amanhã às 9h". Só com horário de fonte real.

### A6. Mapa e "Como chegar"

- web.dev recomenda `loading="lazy"` no iframe do Google Maps Embed e diz que adiar o embed do YouTube poupa ~500 KB no carregamento inicial ([web.dev – iframe lazy loading](https://web.dev/iframe-lazy-loading/), [web.dev – embed best practices](https://web.dev/articles/embed-best-practices)).
- Fachada (imagem + clique troca pelo embed) continua válida, embora a auditoria "third-party facades" tenha saído do Lighthouse 13 ([Chrome – Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0), [Chrome – facades](https://developer.chrome.com/docs/lighthouse/performance/third-party-facades)).
- O botão "📍 Como chegar" com `https://www.google.com/maps/dir/?api=1&destination=<endereço codificado>` abre o app de mapas no celular.

### A7. SEO local: JSON-LD + Perfil da Empresa

- **LocalBusiness** ([Google](https://developers.google.com/search/docs/appearance/structured-data/local-business)): obrigatório `address` (e `name`); recomendados `telephone` (com DDI e DDD), `url` (da unidade, funcionando), `geo` (≥ 5 casas decimais), `openingHoursSpecification` (`hh:mm`; 24h = 00:00–23:59; fechado = 00:00–00:00; madrugada num único bloco), `priceRange` curto ("$$" — o Google limita a 100 caracteres, e o carrossel a 12) ([carrossel](https://developers.google.com/search/docs/appearance/structured-data/carousels-beta)).
```html
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BarberShop","name":"Nome Real","telephone":"+55-69-99999-9999",
 "url":"https://exemplo.com.br","image":"https://exemplo.com.br/fotos/capa.jpg",
 "address":{"@type":"PostalAddress","streetAddress":"Rua X, 123","addressLocality":"Cacoal","addressRegion":"RO","postalCode":"76960-000","addressCountry":"BR"},
 "geo":{"@type":"GeoCoordinates","latitude":-11.43872,"longitude":-61.44711},
 "openingHoursSpecification":[{"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"09:00","closes":"19:00"}],
 "sameAs":["https://www.instagram.com/..."]}
</script>
```
- **Ranking local do Google** = relevância, distância e proeminência; proeminência inclui links para o negócio e quantidade/nota das avaliações; dados completos e corretos ajudam; não dá para pagar por posição ([Google – dicas de classificação local](https://support.google.com/business/answer/7091?hl=en)). → O site novo deve ser colocado como "site" no Perfil da Empresa e o NAP (nome, endereço, telefone) deve ser idêntico nos dois.

---

## B) Técnicas interativas leves que impressionam no celular

Regra geral de acessibilidade: WCAG 2.3.3 (AAA) pede que movimento disparado por interação possa ser desligado; caminhos aceitos: evitar animação desnecessária, dar um botão para desligar ou respeitar a preferência do sistema; parallax é citado como gatilho típico de enjoo ([W3C – Understanding 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html); técnicas [C39 (CSS)](https://www.w3.org/WAI/WCAG22/Techniques/css/C39) e [SCR40 (JS)](https://www.w3.org/WAI/WCAG21/Techniques/client-side-script/SCR40)).

```css
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;
    transition-duration:.01ms!important;scroll-behavior:auto!important}
}
```
```js
const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;
```

### B1. Revelar ao rolar — Intersection Observer (recomendado)
- **Vale**: sempre; é o "efeito de agência" mais barato. **Custo**: quase zero (não roda a cada scroll). Suporte universal.
```js
const io = new IntersectionObserver((es) => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('visivel'); io.unobserve(e.target); }
}), { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-revelar]').forEach(el => io.observe(el));
```
```css
[data-revelar]{opacity:0;transform:translateY(24px);transition:opacity .6s,transform .6s cubic-bezier(.2,.7,.2,1)}
[data-revelar].visivel{opacity:1;transform:none}
```
Cuidado: não esconder com `opacity:0` o conteúdo da capa (atrasa o LCP). Animar só `transform` e `opacity`.

### B2. CSS scroll-driven animations (`animation-timeline: view()/scroll()`)
- **Suporte (caniuse, out/2026)**: Chrome/Edge 115+, Safari 26+ (inclusive iOS 26) ([caniuse – view()](https://caniuse.com/mdn-css_properties_animation-timeline_view)); Firefox ainda sem suporte padrão no estável — a tabela de busca do caniuse lista Firefox como não suportado até a 161 ([caniuse](https://caniuse.com/?search=scroll-driven)) e o Mozilla dizia "em desenvolvimento" ([Mozilla Connect](https://connect.mozilla.org/t5/ideas/implement-css-scroll-driven-animations-animation-timeline/idc-p/116613)).
- **Vale**: barra de progresso de leitura, fotos que "entram" e parallax leve — sem JS e fora da thread principal. Usar sempre dentro de `@supports`.
```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .foto{animation:entra linear both;animation-timeline:view();animation-range:entry 0% cover 30%}
    @keyframes entra{from{opacity:.2;scale:.92}to{opacity:1;scale:1}}
    .progresso{position:fixed;top:0;left:0;height:3px;width:100%;transform-origin:left;
      animation:cresce linear;animation-timeline:scroll(root)}
    @keyframes cresce{from{scale:0 1}to{scale:1 1}}
  }
}
```

### B3. View Transitions
- Mesma página (SPA/troca de estado): Chrome/Edge 111+, Safari 18+, Firefox 144+ ([caniuse](https://caniuse.com/view-transitions)).
- Entre páginas (`@view-transition { navigation: auto; }`): Chrome 126+, Safari 18.2+, Firefox ainda não; quem não suporta só navega sem animação ([Chrome for Developers](https://developer.chrome.com/docs/web-platform/view-transitions?hl=en)).
- **Vale** em one-page para: abrir foto da galeria em tela cheia, trocar abas de serviços, tema claro/escuro.
```js
function trocar(fn){ document.startViewTransition && !semMovimento ? document.startViewTransition(fn) : fn(); }
```

### B4. Rolagem suave — Lenis
- Respeita `prefers-reduced-motion` por padrão (desliga a suavização) ([README Lenis](https://cdn.jsdelivr.net/gh/darkroomengineering/lenis@1.3.26/README.md)); ~5 KB gzip segundo [depscope](https://depscope.dev/pkg/npm/lenis) (fontes variam).
- **Vale**: só em site "vitrine" com parallax/ScrollTrigger. Para one-page de comércio, `scroll-behavior: smooth` nas âncoras basta — rolagem "sequestrada" no celular costuma piorar, e o toque nativo já é suave.

### B5. GSAP + ScrollTrigger
- **Licença atual**: desde a compra pela Webflow (2025, versão 3.13) **todo o GSAP é grátis inclusive para uso comercial**, com SplitText, ScrollSmoother, MorphSVG etc. ([Webflow blog](https://webflow.com/blog/gsap-becomes-free), [GSAP 3.13](https://gsap.com/blog/3-13/), [README](https://cdn.jsdelivr.net/npm/gsap@3.15.0/README.md)). Restrição: não pode ser usado em ferramenta *no-code* de animação visual que concorra com a Webflow; sites comuns são uso permitido ([Standard License](https://gsap.com/community/standard-license/)).
- **Vale**: sequências encadeadas (timeline), pin de seção, texto quebrado em letras. **Custo**: ~dezenas de KB; carregar com `defer` e só se o site usa. Usar `gsap.matchMedia()` com `(prefers-reduced-motion: no-preference)`.
- Para o nosso caso (comércio local), IO + CSS cobre 90%; GSAP fica para o "premium".

### B6. Slider antes/depois
- **Vale muito** para barbearia, estética, oficina, lava-jato, reforma. Sem biblioteca:
```html
<div class="ad" style="--pos:50%">
  <img src="depois.webp" alt="Depois"><img class="antes" src="antes.webp" alt="Antes">
  <input type="range" min="0" max="100" value="50" aria-label="Comparar antes e depois"
         oninput="this.parentNode.style.setProperty('--pos',this.value+'%')">
</div>
<style>
.ad{position:relative;aspect-ratio:4/3;overflow:hidden}
.ad img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ad .antes{clip-path:inset(0 calc(100% - var(--pos)) 0 0)}
.ad input{position:absolute;inset:0;width:100%;opacity:0;cursor:ew-resize;touch-action:pan-y}
</style>
```
O `input range` dá teclado e leitor de tela de graça (o projeto usa Pointer Events + `aria-valuenow`, equivalente). `touch-action: pan-y` evita prender a rolagem vertical.

### B7. Carrossel com arraste
- **CSS scroll-snap** (sem JS, suporte universal) resolve galeria e depoimentos. Chrome 135+ trouxe `::scroll-button()` e `::scroll-marker` (botões e bolinhas nativos, com ARIA e tab corretos) — Firefox ainda não ([Chrome – Carousels with CSS](https://developer.chrome.com/blog/carousels-with-css), [I/O 2025](https://developer.chrome.com/blog/new-in-web-ui-io-2025-recap), [acessível](https://developer.chrome.com/blog/accessible-carousel)).
```css
.trilho{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;scrollbar-width:none}
.trilho>*{flex:0 0 85%;scroll-snap-align:center}
```
- Biblioteca, se precisar de loop/autoplay: **Embla** (~3–7 KB gzip, "headless") vs **Swiper** (~25–47 KB) ([PkgPulse 2026](https://www.pkgpulse.com/guides/embla-carousel-vs-swiper-vs-splide-2026); comparativo do próprio Swiper: [swiperjs.com](https://swiperjs.com/compare/swiper-vs-embla-carousel)).
- **UX (NN/g)**: não girar sozinho no celular; ≤ 5 itens; mostrar posição; suportar swipe; último item em 3–4 gestos; respeitar reduced motion ([NN/g – Carousels](https://www.nngroup.com/articles/designing-effective-carousels/), [mobile](https://www.nngroup.com/articles/mobile-carousels/), [auto-forward](https://www.nngroup.com/articles/auto-forwarding/)).

### B8. Texto animado
- Nome entrando palavra por palavra/letra por letra: `span` por palavra + `animation-delay: calc(var(--i) * 60ms)`. Manter o texto real no HTML (`aria-label` no título e `aria-hidden` nos spans) para leitor de tela e SEO. GSAP SplitText agora é grátis (B5).
- `text-wrap: balance` em títulos grandes (quebra de linha bonita, custo zero).
- Não animar o elemento LCP de forma que ele fique invisível no começo.

### B9. Cursor e hover
- Celular não tem hover: usar `@media (hover:hover) and (pointer:fine)` para luz que segue o cursor, botão magnético e cursor customizado. No toque, feedback com `:active { scale: .97 }`.
- Alvos de toque ≥ 48 px; o NN/g critica o iOS 26 justamente por reduzir espaçamento entre alvos ([NN/g – Liquid Glass](https://www.nngroup.com/articles/liquid-glass/)).

### B10. Vídeo de fundo leve
- `autoplay muted loop playsinline` (sem `muted` alguns navegadores ignoram autoplay; `playsinline` é necessário no iOS); tirar a trilha de áudio do arquivo; o pôster/1º quadro pode ser o LCP — não usar `loading="lazy"` nele; abaixo da dobra, lazy ([web.dev – Video performance](https://web.dev/learn/performance/video-performance), [lazy video](https://web.dev/articles/lazy-loading-video), [autoplay Chrome](https://developer.chrome.com/blog/autoplay)).
- Conteúdo importante não pode estar só no vídeo de fundo (link acima). Com `prefers-reduced-motion` ou `Save-Data`, mostrar só o pôster. 5–8 s, 720p, < 1–2 MB, MP4 H.264 + WebM/AV1.

### B11. Esqueletos de carregamento
- NN/g: esqueleto para carregamento de página inteira < 10 s; spinner para módulo isolado (2–10 s); < 1 s não precisa nada; não substitui otimização ([NN/g – Skeleton Screens 101](https://www.nngroup.com/articles/skeleton-screens/)).
- Num one-page estático, o uso certo é em **fotos e iframes** (mapa, agenda): fundo com brilho até o `load`, depois fade. Sempre com `aspect-ratio` reservado (zera CLS).

### B12. Modo claro/escuro
- `light-dark()` é Baseline desde mai/2024 (Chrome/Edge 123, Firefox 120, Safari 17.5); precisa de `color-scheme: light dark` no `:root` ([web.dev – light-dark](https://web.dev/articles/light-dark), [MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)).
```css
:root{color-scheme:light dark;--fundo:light-dark(#faf9f5,#121212);--texto:light-dark(#1a1a1a,#f2f2f2)}
body{background:var(--fundo);color:var(--texto)}
```
- Para site de comércio, o tema deve ser **escolha de marca** (barbearia escura, confeitaria clara); seguir o sistema é opcional.

### Tabela de decisão rápida

| Técnica | Impressiona? | Custo | Sem lib? | Recomendação |
|---|---|---|---|---|
| Revelar com IO | média | ~0 | sim | sempre |
| `view()` scroll-driven | alta | ~0 (CSS) | sim | com `@supports` |
| View Transitions | alta | ~0 | sim | galeria/tema |
| Antes/depois | muito alta | ~0 | sim | quando houver par real |
| Scroll-snap | média | 0 | sim | galeria/depoimentos |
| Lenis | média | ~5 KB | não | só no premium |
| GSAP/ScrollTrigger | muito alta | dezenas de KB | não | só no premium |
| Vídeo de fundo | alta | alto (MB) | sim | só se houver vídeo real e curto |
| Glass/blur pesado | média | GPU no celular | sim | pouco, com contraste |

---

## C) Agendamento e pedidos usados no Brasil

| Ferramenta | Uso típico | Como pôr no site | Fonte |
|---|---|---|---|
| **Link do WhatsApp com mensagem** | todos | `wa.me/55…?text=` | [WhatsApp](https://faq.whatsapp.com/general/chats/how-to-use-click-to-chat?lang=kk) |
| **Calendly** | serviços, consultas | inline, pop-up por link, pop-up widget (botão flutuante) — `widget.js` de `assets.calendly.com`, `Calendly.initInlineWidget/initPopupWidget/initBadgeWidget` | [Calendly – embed options](https://calendly.com/help/embed-options-overview), [dev](https://developer.calendly.com/how-to-display-the-scheduling-page-for-users-of-your-app) |
| **Cal.com** (código aberto) | idem | inline `Cal("inline",{elementOrSelector,calLink})`, botão flutuante, pop-up no clique; dá para pré-preencher nome/e-mail | [Cal.com – embed](https://cal.com/help/embedding/adding-embed), [prefill](https://cal.com/help/embedding/prefill-booking-form-embed) |
| **Trinks** | salão, barbearia, estética | link da página do estabelecimento na Trinks → botão "Agendar online"; é parceira do Google para "Reservar" no Maps (matéria de ~2022, "a partir de R$ 39,99/mês" na época) | [Tecnoblog](https://tecnoblog.net/noticias/google-maps-horario-salao-beleza/) |
| **Booksy** | barbearia, beleza | link de reserva / QR / botão no Instagram e Google; Reserve with Google confirmado para EUA, Reino Unido e Irlanda — não achei confirmação para o Brasil nem widget de site | [Booksy blog](https://biz.booksy.com/blog/reserve-with-google-booksy-takes-online-beauty-bookings-to-the-next-level), [marketplace](https://biz.booksy.com/es-es/funcionalidades/marketplace) |
| **AgendaPro** | beleza, saúde | "site de reservas" próprio com link para WhatsApp/Instagram; não achei doc de widget nem confirmação de operação no Brasil | [AgendaPro](https://agendapro.com/agenda-online), [App Store](https://apps.apple.com/app/id1218956898) |
| **Google Agenda (agendamentos)** | serviços simples | página de reserva pública por link | (não verificado nesta pesquisa) |
| **iFood / cardápio digital** | restaurantes | link para a loja no iFood ou cardápio próprio (Anota Aí, Goomer); botão "Pedir online" do Google no Perfil, com iFood, Rappi, Anota Aí e Goomer como parceiros | [Blog do Google Brasil](https://blog.google/intl/pt-br/produtos/novos-recursos-na-busca-do-google-melhoram-experiencia-entre-restaurantes-e-plataformas-de-delivery/), [Google – pedidos online](https://support.google.com/business/answer/10842217) |

**No Perfil da Empresa no Google:** dá para (a) escolher um provedor integrado (Reserve with Google — só em alguns países e com provedor parceiro; aparece em até uma semana) ou (b) colar um link próprio de reserva/pedido ([Google – reservas por provedor](https://support.google.com/business/answer/7475773?hl=en), [Google – links](https://support.google.com/business/answer/6218037?hl=en), [Reserve with Google](https://support.google.com/reserve/answer/9172607?hl=en)).

**Como embutir sem pesar:**
- Calendly/Cal.com/Trinks como **iframe só quando a seção aparece** (IO) ou no clique ("Ver horários") — o widget de agenda é pesado e de terceiro (mesma lógica de fachada do A6).
- Sem plataforma de agenda: o botão de agendar é o WhatsApp com mensagem "Quero agendar [serviço] para [dia]".
- Restaurante: "Pedir no iFood" + "Pedir pelo WhatsApp" (o pedido direto evita a taxa da plataforma — argumento de venda, sem número inventado).

```js
// carrega a agenda só quando a seção #agendar chega perto da tela
new IntersectionObserver(([e], o) => { if (!e.isIntersecting) return; o.disconnect();
  const f = document.createElement('iframe'); f.src = AGENDA_URL; f.loading = 'lazy';
  f.title = 'Agendar horário'; f.style.cssText = 'width:100%;height:700px;border:0';
  document.querySelector('#agendar .lugar').replaceChildren(f);
}, { rootMargin: '400px' }).observe(document.querySelector('#agendar'));
```

---

## D) Tendências visuais 2025–2026 para pequenos negócios

- **Bento grid**: virou layout padrão (popularizado pela Apple); para pequeno negócio serve para mostrar serviços, avaliação e botão de agendar num bloco só, com o mais importante no maior card e conferindo como empilha no celular ([Line25](https://line25.com/articles/web-design-trends-2026/), [Exabytes](https://www.exabytes.sg/blog/web-design-trends-singapore-businesses/), [Tinyfrog](https://tinyfrog.com/web-design-trends-2026/)). No celular vira coluna única — então o ganho é no desktop.
- **Tipografia gigante** na capa (títulos que ocupam a tela, fontes variáveis) substituindo a foto de banco como chamariz; "o segredo é a contenção" ([Line25](https://line25.com/articles/web-design-trends-2026/), [Tinyfrog](https://tinyfrog.com/web-design-trends-2026/)). Para comércio: nome grande **sobre a foto real**, não no lugar dela.
- **Vidro (glassmorphism / Liquid Glass)**: a Apple popularizou no iOS 26, mas o NN/g mostrou problemas de contraste em texto sobre imagem e controles flutuantes que cobrem conteúdo ([NN/g – Liquid Glass](https://www.nngroup.com/articles/liquid-glass/)); a recomendação é usar pouco e respeitar contraste ([NN/g – Glassmorphism](https://www.nngroup.com/articles/glassmorphism/)). `backdrop-filter` em muitas camadas pesa no celular → só na nav e no botão flutuante.
- **Cores**: Pantone 2026 seria "Cloud Dancer" (11-4201, branco suave) — confirmado só por fonte secundária ([Milksono](https://www.milksono.com/blog/tag/color)); WGSN + Coloro apontam "Transformative Teal" para 2026 (mesma fonte). Leitura prática: fundos off-white quentes + um destaque forte do ramo (o Castor do projeto já faz `#faf9f5` / `#121212`).
- **Fotos reais vs. banco**: o usuário examina fotos de produtos e pessoas reais e ignora fotos genéricas de modelos; num site de serviço, foto genérica de "resultado" é tratada como enchimento ([NN/g – Photos as Web Content](https://www.nngroup.com/articles/photos-as-web-content/), [NN/g – Trustworthy design](https://www.nngroup.com/articles/trustworthy-design/)). Um teste de 2026 do NN/g não achou queda de confiança com imagens geradas por IA — mas só 6 imagens de escritório num site fictício ([NN/g – AI images](https://www.nngroup.com/articles/ai-generated-images/)). Para comércio local, a regra continua: **foto do lugar, da equipe e do trabalho**.
- **Contra o "visual de IA"**: as tendências convergem em textura (granulado), assimetria editorial, micro-interações com propósito e menos gradiente roxo genérico — sem estudo quantitativo que eu tenha achado; trate como direção estética, não como dado.

---

## O que isso muda no projeto (sugestões para o Gato/ClienteSite)

1. Selo "Aberto agora / Fechado" na capa, calculado do horário com fonte (A5).
2. Mensagem do WhatsApp diferente por botão (capa, cada serviço, chamada final) (A3).
3. Mapa como imagem + "Como chegar"; iframe só no clique ou com `loading="lazy"` (A6).
4. Galeria e depoimentos em `scroll-snap` sem autoplay; `::scroll-marker` como bônus no Chrome (B7).
5. `animation-timeline: view()` dentro de `@supports` como camada extra sobre o IO que já existe (B2).
6. Agenda embutida carregada por IO (C).
7. Conferir que o JSON-LD gerado pela Abelha não inclui `aggregateRating` do próprio negócio (A4) e que `geo` tem 5 casas decimais (A7).
8. Manter o vidro só na nav e no botão do WhatsApp, com contraste conferido (D).
