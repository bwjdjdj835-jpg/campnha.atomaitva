# 🐯 Tigre automático — passo a passo (API oficial do WhatsApp)

O Tigre conversa sozinho com o cliente pela **API oficial da Meta** (WhatsApp Cloud API). Ele não usa o seu WhatsApp
pessoal nem automação não oficial, por isso não corre o risco de bloqueio que essas automações têm.

## O que custa

- **Respostas do Tigre**: grátis. Quando o cliente escreve, abre uma janela de 24 h em que você responde à vontade.
- **1ª mensagem** (o modelo aprovado): a Meta cobra por mensagem de marketing. No Brasil são alguns centavos de dólar
  por mensagem. Confira o valor atual em developers.facebook.com/docs/whatsapp/pricing.
- **Número de teste da Meta**: grátis, mas só manda para até 5 números cadastrados. Serve para testar com o seu
  próprio celular.

## 1. Conta e número na Meta (você faz, uma vez)

1. Entre em developers.facebook.com → **Criar app** → tipo **Empresa** → adicione o produto **WhatsApp**.
2. Em **WhatsApp → Configuração da API**:
   - copie o **ID do número de telefone** → `WHATSAPP_PHONE_NUMBER_ID`;
   - crie um **token permanente** (Configurações do negócio → Usuários do sistema → gerar token com
     `whatsapp_business_messaging`) → `WHATSAPP_TOKEN`.
3. Em **Configurações do app → Básico**, copie a **Chave secreta do app** → `WHATSAPP_APP_SECRET`.
4. Para usar com clientes de verdade: adicione um número seu (que **não** esteja no WhatsApp normal) e verifique a empresa.

## 2. Modelo da 1ª mensagem

Em **WhatsApp Manager → Modelos de mensagem → Criar**, categoria **Marketing**, idioma **Português (BR)**.
O `{{1}}` é o nome do comércio. Sugestão:

> Olá, {{1}}! Tudo bem? Aqui é da Carmesin, a gente cria sites para comércios da região. Vi que vocês ainda não têm site e
> montei uma prévia com as fotos de vocês, sem compromisso. Posso te mandar para dar uma olhada?

Quando for aprovado, coloque o **nome do modelo** em `WHATSAPP_TEMPLATE`. Cole o mesmo texto no campo "Texto do seu modelo"
do painel do Tigre, para a conversa aparecer completa na Aranha.

## 3. Variáveis no Vercel (Settings → Environment Variables)

| Variável | O que é |
|---|---|
| `WHATSAPP_TOKEN` | token permanente da Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | ID do número |
| `WHATSAPP_TEMPLATE` | nome do modelo aprovado |
| `WHATSAPP_APP_SECRET` | chave secreta do app (confere se o aviso veio mesmo da Meta) |
| `WHATSAPP_VERIFY_TOKEN` | uma palavra que você inventa (ex.: `tigre-verifica-2026`) |
| `TIGRE_SENHA` | uma senha só sua (protege o seu preço e o seu Pix) |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | a nuvem (Upstash Redis) — veja a página ☁️ Nuvem |
| `BLOB_READ_WRITE_TOKEN` | pasta online (o vídeo da prévia vai por link) |
| `GROQ_API_KEY` | IA para conversar (sem ela o Tigre usa textos prontos) |
| `RESEND_API_KEY` + `AGUIA_EMAIL` | opcional: aviso por e-mail quando querem fechar ou dizem que pagaram |

Depois de salvar, faça um **Redeploy** no Vercel.

## 4. Webhook (para as respostas chegarem sozinhas)

Na Meta, em **WhatsApp → Configuração → Webhook → Editar**:
- **URL de retorno**: `https://SEU-APP.vercel.app/api/tigre/webhook` (o painel do Tigre mostra e copia);
- **Token de verificação**: o mesmo `WHATSAPP_VERIFY_TOKEN`;
- depois **Gerenciar** → assine o campo **messages**.

## 5. No app

1. Página do 🐯 Tigre → **Tigre automático** → digite a senha → **Entrar**. A lista mostra o que falta.
2. Preencha **seu preço**, **condições** e **forma de pagamento** (vai igualzinho para o cliente) → **Ligar o Tigre automático**.
3. Na 🕷️ Aranha, **Aprovar — o 🐯 Tigre faz o resto**. Daí em diante ele conversa sozinho e te avisa.

## O que o Tigre faz sozinho e o que é seu

| Cliente | Tigre |
|---|---|
| "sim / pode mandar" | manda o vídeo da prévia por link |
| pergunta preço | fala o seu preço e as condições |
| quer fechar | manda a sua forma de pagamento e te avisa |
| pede desconto | "vou ver com o responsável" e te avisa |
| "paguei" | agradece, diz que vai conferir e te avisa; **você** confirma e publica |
| "não quero agora" | uma mensagem leve ("só dá uma olhadinha"); se recusar de novo, despede e para |
| "para de mandar" | para na hora e nunca mais escreve |
| robô / menu | pede para falar com uma pessoa |
| áudio, foto | te avisa para responder |
