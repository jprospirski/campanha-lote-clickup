# campanha-lote-clickup

Skill do [Claude Code](https://claude.com/claude-code) que gera campanhas de produto no Adobe Illustrator a partir de cards de campanha do ClickUp.

Você passa os IDs dos cards; o Claude lê os briefings, monta um JSON de lote, mostra uma prévia para aprovação e roda o Illustrator para gerar um `.ai` por cliente, já salvo na pasta da campanha no Google Drive.

```
IDs dos cards → ClickUp → prévia → lote - <Campanha>.json → Illustrator → .ai por cliente
```

## O que tem aqui

| Arquivo | Função |
|---|---|
| `SKILL.md` | Instruções da skill: leitura dos cards, regras de conversão, prévia, geração e relatório. |
| `scripts/gerador_campanhas_v3.jsx` | Script do Illustrator (ExtendScript) que monta as campanhas a partir do JSON. |
| `scripts/rodar_lote.ps1` | Executa o lote no Illustrator via PowerShell (COM), sem janelas. |

## Requisitos

- Windows com PowerShell
- Adobe Illustrator instalado
- Claude Code com o conector do **ClickUp** ativo
- Google Drive para computador (os arquivos são salvos em uma unidade local, ex.: `G:`)

## Instalação

Clone direto na pasta de skills do Claude Code:

```powershell
git clone https://github.com/jprospirski/campanha-lote-clickup.git "$env:USERPROFILE\.claude\skills\campanha-lote-clickup"
```

Reinicie o Claude Code; a skill aparece como `/campanha-lote-clickup`.

Para atualizar depois:

```powershell
git -C "$env:USERPROFILE\.claude\skills\campanha-lote-clickup" pull
```

## Preparar a pasta de trabalho

Crie uma pasta com:

```
minha-pasta/
├── gerador_campanhas_v3.jsx      ← copiar de scripts/
├── rodar_lote.ps1                ← copiar de scripts/
└── Fotos - Fundo loja/
    ├── CP base - <campanha>.ai   ← arquivo-base do Illustrator
    ├── Differenza Casal.png      ← <Modelo> <Tamanho>.png
    ├── Milano.png                ← <Modelo>.png (sofás)
    └── Milano AZUL.png           ← variantes
```

As fotos e o arquivo-base **não** fazem parte do repositório — cada equipe usa os seus.

O arquivo-base precisa ter os textos-marcador que o script substitui (`V_DE`, `V_X`, `V_parcela`, `V_total`, `V_%`, `V_Oferta_TXT`) e três marcadores de benefício.

## Como usar

Abra o Claude Code na pasta de trabalho e chame a skill com os IDs dos cards:

```
/campanha-lote-clickup 86abc123 86abc456
```

Também funciona em linguagem natural: "gera o lote desses cards", "monta o JSON da campanha", "roda as campanhas no Illustrator".

O fluxo:

1. **Leitura** — cada card vira um cliente; cada subtarefa `CRIATIVO NN - [Produto]` vira um produto. O briefing vem da seção "Briefing design" da subtarefa.
2. **Prévia** — tabela por cliente com foto, nome, categoria, tamanho, benefícios e preço. Nada é gravado sem a sua aprovação.
3. **JSON** — grava `lote - <Campanha>.json` na pasta de trabalho.
4. **Geração** — roda `rodar_lote.ps1`, uma campanha por vez (gera → salva → fecha).
5. **Relatório** — lista o que foi gerado, o que ficou pendente, erros e arquivos que já existiam.

### Pendências

A skill nunca inventa dado comercial nem caminho. O que o briefing não informar e não tiver regra padrão vira `"PENDENTE: <motivo>"` no JSON. O script pula o cliente com pendência e gera os demais; corrija o JSON e rode de novo — só o que falta é gerado.

### Formato dos preços

| Briefing | `preco` | Campos |
|---|---|---|
| "De X por: NX R$Y ou à vista R$Z" | `parcelado` | `V_DE`, `V_X`, `V_parcela`, `V_total` |
| "De X por R$Z à vista" | `a_vista` | `V_DE`, `V_total` |
| "Até N% off" | `desconto` | `V_%` |
| Só texto de oferta | `oferta` | `V_Oferta_TXT` |

Valores são números inteiros (`"3399"`); parcelas no formato `"18X"`. Centavos diferentes de zero viram pendência — o script não arredonda.

## Rodar sem o Claude

Com um JSON de lote pronto, o gerador funciona sozinho:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\rodar_lote.ps1" -Json ".\lote - Minha Campanha.json"
```

O formato completo do JSON está na seção 6 do `SKILL.md`.

## Adaptar para a sua equipe

A skill foi escrita para o fluxo de uma agência específica. Para usar em outro contexto, ajuste no `SKILL.md`:

- **Seção 2** — padrão de nome dos cards e das subtarefas no ClickUp.
- **Seção 3** — categorias, tamanhos e regras de conversão do briefing.
- **Seção 4** — caminho das pastas de clientes no Drive (`G:\Meu Drive\...\02. Clientes\<cliente>\02 - Editáveis Campanhas\<MM> <MMM> - <Campanha>`).

## Problemas comuns

- **Illustrator travado** — se `Get-Process Illustrator` mostrar `Responding = False`, feche e reabra o Illustrator antes de rodar.
- **Aviso de fonte faltando** — esperado quando a máquina não tem as fontes do arquivo-base; não impede a geração.
- **Arquivo não foi refeito** — o script não sobrescreve `.ai` existente. Apague o arquivo e rode de novo.
- **Log** — cada execução acumula em `relatorio_lote.txt`, ao lado do JSON.

## Ao alterar os scripts

Os scripts versionados ficam em `scripts/`. Se você editar a cópia da pasta de trabalho, copie-a de volta para `scripts/` e faça commit.
