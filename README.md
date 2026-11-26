# campanha-lote-clickup

Skill do Claude Code que gera campanhas de produto no Illustrator a partir de cards de campanha do ClickUp:
ClickUp → JSON de lote → `gerador_campanhas_v3.jsx` → arquivos `.ai` na pasta do cliente no Google Drive.

## Conteúdo

- `SKILL.md` — instruções da skill (regras de conversão, prévia, geração e relatório).
- `scripts/gerador_campanhas_v3.jsx` — script do Illustrator que monta as campanhas.
- `scripts/rodar_lote.ps1` — executa o lote no Illustrator via PowerShell (COM).

## Instalar em outra máquina

```powershell
git clone <URL-do-repositório> "$env:USERPROFILE\.claude\skills\campanha-lote-clickup"
```

Depois, numa pasta de trabalho:

1. Copie `scripts\gerador_campanhas_v3.jsx` e `scripts\rodar_lote.ps1` para a pasta.
2. Coloque ali a pasta de fotos (ex.: `Fotos - Fundo loja`) com o `CP base*.ai` — fotos e base **não** ficam no repositório.
3. Abra o Claude Code nessa pasta e use `/campanha-lote-clickup <IDs dos cards>`.

Requisitos: Windows, Adobe Illustrator, Google Drive para computador (unidade `G:`) e os conectores ClickUp no Claude.

## Atualizar

```powershell
cd "$env:USERPROFILE\.claude\skills\campanha-lote-clickup"
git pull
```

Ao alterar os scripts na pasta de trabalho, copie-os de volta para `scripts\` e faça commit.
