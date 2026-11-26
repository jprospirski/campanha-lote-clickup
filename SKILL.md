---
name: campanha-lote-clickup
description: Gera campanhas de produto no Illustrator a partir de IDs de cards de campanha do ClickUp (subtarefas "CRIATIVO NN - [Produto]") - monta o JSON de lote do gerador_campanhas_v3.jsx com prévia para aprovação, localiza a pasta de cada cliente no Google Drive e roda a geração via PowerShell, devolvendo pendências ou arquivos gerados. Usar quando o usuário mandar IDs de cards de campanha/CP Meta Ads para produzir as artes, pedir "gera o lote", "monta o JSON da campanha" ou "roda as campanhas no Illustrator".
---

# Campanhas em lote: ClickUp → JSON → Illustrator (via PowerShell)

Fluxo completo: IDs dos cards → leitura no ClickUp → produtos + pasta do Drive de cada cliente → prévia para aprovação → `lote - <Campanha>.json` → `rodar_lote.ps1` gera os `.ai` sem janelas → relatar o resultado.

Cada card vira um cliente no JSON; cada subtarefa `CRIATIVO NN` vira um produto.

Princípio: **nunca inventar dado comercial nem caminho**. O que o briefing não disser e não tiver regra padrão abaixo vira `"PENDENTE: <motivo / opções>"` — o script pula o cliente com PENDENTE e gera os demais.

## 1. Pasta de trabalho

A pasta de trabalho contém `gerador_campanhas_v3.jsx`, `rodar_lote.ps1` e a pasta de fotos (ex.: `Fotos - Fundo loja`) com o `CP base*.ai`.

- Usar o diretório atual se tiver esses arquivos; senão perguntar o caminho.
- Os dois scripts são versionados na pasta `scripts/` desta skill. Se a pasta de trabalho tiver as fotos mas não os scripts (máquina nova), copiá-los de lá. Ao alterar um script na pasta de trabalho, copiar de volta para `scripts/` e avisar o usuário para fazer commit.
- Listar as fotos disponíveis (`.png/.jpg/.jpeg/.tif/.psd/.webp`, exceto o CP base). Nomes: `<Modelo> <Tamanho>.png`, `<Modelo>.png` (sofás) e variantes `<Modelo> AZUL.png`.
- Mais de um `CP base*`: perguntar qual usar.

## 2. Ler os cards no ClickUp

Para cada ID (consultas independentes em paralelo):

1. `clickup_get_task` com `include: ["description", "subtasks"]`.
2. **Cliente** = nome da lista do card (`list.name`, ex.: "Anjos Caxias do Sul").
3. **Campanha** = texto entre colchetes no nome do card que não seja período nem formato. Ex.: `📢 Anjos Caxias - CP MetaAds 🔵 01 Dez - [ 01 dez - 10 dez] [Prorrogação Black] - [Estático]` → `Prorrogação Black`. Todos os cards do lote devem ter a mesma campanha; se divergirem, perguntar.
4. **Mês da campanha** = mês do `start_date` do card (antes de converter, chamar `clickup_get_user` e usar o fuso do `current_time`); sem `start_date`, usar o período no nome (`[01 dez - 10 dez]`).
5. Subtarefas válidas: `CRIATIVO NN - [Produto]` (tolerar espaços e hífen colado). Ordenar por `NN`. Não filtrar por status (vêm como "templates").
6. Buscar cada subtarefa com `clickup_get_task` + `include: ["description"]` (em paralelo). O briefing está em `markdown_description`, seção "Briefing design". Remover Markdown (`**`, `\[ \]`).

## 3. Converter cada CRIATIVO em produto

Usar **Produto**, **Benefícios** e **Preço** ou **Atrativo de oferta**. Ignorar Selo, CTA, letras miúdas e complementos entre parênteses no produto (ajuste manual do design), mas citá-los na prévia quando diferirem entre criativos (ex.: validade 18/12 num e 10/12 nos outros).

### nome
Sempre preencher `"nome"` com o modelo, sem tamanho/cor/complemento: "Colchão Genialle + Box" → `"Genialle"`; "Colchão + Box Benvenutti + Box Baú" → `"Benvenutti"`. (Sem `nome`, o script usa o arquivo da foto sem "Casal/Queen/AZUL/BOX BAU".)

### beneficios
Lista com os itens de **Benefícios**/**Beneficio** do card separados por `|` (ex.: `["Molas ensacadas", "Conforto na medida certa"]`). O CP base tem 3 marcadores: preenche de cima para baixo e remove os que sobram. Card sem benefícios → omitir o campo (todos os marcadores são removidos).

### categoria (exatamente uma)
`Conjunto`, `Conjunto Box`, `Colchão`, `Sofá`, `Sofá-cama`, `Sofá Retrátil`, `Sofá Retrátil e Reclinável`

- "Colchão + Box", "Colchão X + Box", "Box" → `Conjunto Box`
- "Conjunto X" → `Conjunto`
- "Colchão X" sem box → `Colchão`
- Sofás: variante citada (cama, retrátil, reclinável); sem variante → `Sofá`
- Não mapeável → PENDENTE

### tamanho
`Solteiro`, `Solteirão`, `Casal`, `Queen`, `King` ou `Neutro`.

- Usar o tamanho citado (ex.: "(casal 1,38 x 1,88)" → `Casal`).
- **Sem tamanho no briefing → NÃO preencher tamanho.** O padrão Casal vale **só para a escolha da foto** (`<Modelo> Casal.png`, a imagem mais convencional). Escrever "Casal" na arte sem estar no card cria uma informação falsa que passa despercebida na auditoria humana.
- Sem tamanho → **omitir `tamanho` e `medida`** do JSON: o script remove o bloco "Tamanho:" da arte.
- `Neutro` só para sofás **com medida no card** (ex.: "Sofá-Cama Lungo (1,50 m)" → `"tamanho": "Neutro", "medida": "1,50m"`). Sofá sem medida → omitir tamanho (sem bloco), não usar PENDENTE.
- Não preencher `medida` em tamanho padrão — o script aplica a tabela.

### foto
1. `<Modelo> <Tamanho>.png` (ex.: `Differenza Casal.png`).
2. Se não existir: `<Modelo>.png` (ex.: `Milano.png`).
3. Variantes `AZUL` só se o briefing pedir.
4. Comparar sem maiúsculas/acentos. Sem correspondência única → `"PENDENTE: opções A | B | C"`.

### preco + valores
Formato obrigatório (o script valida):
- `V_DE`, `V_parcela`, `V_total`, `V_%`: **só número inteiro** (R$ 3.399,00 → `"3399"`).
- `V_X`: número + X maiúsculo (`"18X"`).
- `V_Oferta_TXT`: texto do briefing, literal (sem corrigir ortografia). O script quebra em 2 linhas no `|` (ou na primeira vírgula: "Conforto de hotel, / Preço de Black!"); sem separador fica 1 linha.
- Centavos diferentes de zero (ex.: R$ 249,90) → PENDENTE. Nunca arredondar.

| Briefing | preco | campos |
|---|---|---|
| "De X por: NX R$Y ou à vista R$Z" | `parcelado` | V_DE=X, V_X=NX, V_parcela=Y, V_total=Z |
| "De X por R$Z à vista" (sem parcelas) | `a_vista` | V_DE=X, V_total=Z |
| "Até N% off" / "N% off" | `desconto` | V_%=N |
| Só texto de oferta ("Últimas peças \| Preço de Black") | `oferta` | V_Oferta_TXT=texto |

Faltou campo exigido pelo grupo (ex.: parcelado sem "De") → PENDENTE naquele campo. Preço com parcelas **e** texto de oferta: usar o grupo do preço e citar o texto na prévia.

## 4. Pasta de salvamento no Google Drive

Cada cliente recebe `"pasta_saida"` com o caminho absoluto da pasta da campanha:

```
G:\Meu Drive\Ampliar Digital\02. Clientes\<pasta do cliente>\02 - Editáveis Campanhas\<MM> <MMM> - <Campanha>
```
Ex.: `G:\Meu Drive\Ampliar Digital\02. Clientes\Anjos - Caxias do Sul RS\02 - Editáveis Campanhas\12 DEZ - Prorrogação Black`

1. **Pasta do cliente**: listar `G:\Meu Drive\Ampliar Digital\02. Clientes` (PowerShell `Get-ChildItem -Directory`) e casar com o nome da lista do ClickUp ignorando maiúsculas, acentos, hífens, a palavra da marca e sufixos de UF/região ("Anjos Caxias do Sul" ↔ "Anjos - Caxias do Sul RS"). Nenhuma ou mais de uma correspondência → `"pasta_saida": "PENDENTE: opções ..."`.
2. **`02 - Editáveis Campanhas`** precisa existir dentro do cliente; se não existir → PENDENTE.
3. **Pasta da campanha**: `MM` com dois dígitos + mês abreviado em maiúsculas (`JAN FEV MAR ABR MAI JUN JUL AGO SET OUT NOV DEZ`) + ` - ` + campanha. Se já existir uma pasta com o mesmo prefixo `MM MMM` e nome equivalente (diferença só de caixa/acento), usar a existente. Se não existir, o script cria esse último nível.
4. Nome do arquivo: `<Cliente> - <Campanha>.ai` (cliente explícito). Se já houver `.ai` com esse nome na pasta, o script **não sobrescreve** (aparece em "JÁ EXISTIAM").

## 5. Prévia para aprovação (obrigatória)

Por cliente: pasta de destino + tabela `NN | foto | nome | categoria | tamanho (ou "sem") | benefícios | preço | valores`, marcando **PENDENTE** (com opções) e ajustes manuais (validade, "Até", selos). Perguntar se aprova ou o que corrigir; resolver PENDENTEs com as respostas. Só gravar após aprovação explícita.

## 6. Gravar o JSON

`lote - <Campanha>.json` na pasta de trabalho (perguntar antes de sobrescrever). Caminhos de fotos/base relativos à pasta do JSON; `pasta_saida` absoluto por cliente:

```json
{
  "campanha": "Prorrogação Black",
  "pasta_fotos": "Fotos - Fundo loja",
  "arquivo_base": "Fotos - Fundo loja/CP base - Ressaca prorrogação.ai",
  "clientes": [
    {
      "cliente": "Anjos Caxias do Sul",
      "clickup_id": "17txe6ym9ap",
      "pasta_saida": "G:/Meu Drive/Ampliar Digital/02. Clientes/Anjos - Caxias do Sul RS/02 - Editáveis Campanhas/12 DEZ - Prorrogação Black",
      "produtos": [
        { "foto": "Differenza Casal.png", "nome": "Differenza", "categoria": "Conjunto Box", "tamanho": "Casal",
          "beneficios": ["Molas ensacadas", "Conforto na medida certa"], "preco": "parcelado",
          "V_DE": "3399", "V_X": "18X", "V_parcela": "115", "V_total": "2070", "V_%": "", "V_Oferta_TXT": "" },
        { "foto": "Genialle Casal.png", "nome": "Genialle", "categoria": "Conjunto Box", "preco": "oferta",
          "V_Oferta_TXT": "Ultimas peças | Preço de Black" }
      ]
    }
  ]
}
```

- `cliente` é obrigatório (vai no nome do arquivo).
- Dois cards do mesmo cliente: `"arquivo"` distinto em cada um.
- Mais de 8 produtos num cliente: o script divide em partes.
- Validar o JSON (parse) depois de gravar.

## 7. Gerar via PowerShell e relatar

Logo após gravar o JSON aprovado, rodar (o Illustrator abre sozinho se estiver fechado; timeout longo, ~40 s por campanha):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\rodar_lote.ps1" -Json ".\lote - <Campanha>.json"
```

O modo automático gera as campanhas **uma de cada vez** (gera → salva → fecha → próxima), sem janelas, e devolve:

- `STATUS:` OK / PARCIAL / PENDÊNCIAS / NADA A FAZER
- `GERADAS` — cliente e caminho do `.ai`
- `PENDÊNCIAS - NÃO GERADAS` — por cliente, o que impede a geração
- `ERROS NA GERAÇÃO` — falhas do Illustrator
- `JÁ EXISTIAM - NÃO REFEITAS`

Relatar ao usuário exatamente isso: pendências que impedem a geração (de um cliente ou de todos) ou o aviso de arquivos gerados, com os caminhos. Para resolver uma pendência: corrigir o JSON e rodar de novo (só o que falta é gerado). Para refazer uma campanha: apagar o `.ai` dela e rodar de novo.

Antes de rodar, conferir que o Illustrator responde:
`Get-Process Illustrator | Select-Object Responding, WorkingSet64` — se o processo existir com memória ~0 ou `Responding = False`, ele travou: pedir ao usuário para fechar/reabrir o Illustrator antes de seguir (não matar o processo sem avisar).

Observações:
- Log acumulado em `relatorio_lote.txt` ao lado do JSON.
- As imagens são **incorporadas** ao salvar (arquivos vão para o Drive e são abertos em outras máquinas); `"incorporar_imagens": false` no JSON desliga.
- O arquivo é repassado ao chefe de design, que corrige o necessário e exporta as imagens. Por isso:
  - aviso de **fonte faltando** no computador do usuário é esperado — não é erro;
  - o grupo `oferta` repete a mesma frase nas duas caixas de texto — é o comportamento aceito;
  - a duplicação/ajuste do Feed é manual (o Feed do CP base não tem o bloco de produto/preço). Não automatizar.
- Não abrir os `.ai` gerados para conferência/exportação de prévias sem o usuário pedir: abrir arquivos com fonte faltando via COM mostra janela modal e já travou o Illustrator. A conferência é o resumo do script.
