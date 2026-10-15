# Skills do Claude Code neste projeto

Pacote **Replica** (Jake Schincariol, licença MIT — `REPLICA-LICENSE`, original em
https://github.com/Jakeschincariol/replica-skill): 11 skills que o Claude Code usa para recriar um app do zero,
testar e lançar. Ficam aqui (`.claude/skills/`) para carregarem sozinhas em toda conversa neste repositório.

Ordem: recon → architect → design → build → backend → test → diff → entrepreneur → brand → launch → deploy.
Cada uma grava o que fez na pasta `replica/` do projeto. Ferramentas em Python 3 (sem pip).

Regra do pacote: recria o que um app FAZ (funções e fluxos), nunca o que ele tem (código, logo, textos, conteúdo).
Pedido do usuário: "conectar vários agentes" ao Claude Code.
