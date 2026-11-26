---
name: campanha-lote-clickup
description: Gera campanhas de produto no Illustrator a partir de IDs de cards de campanha do ClickUp (subtarefas "CRIATIVO NN - [Produto]") - aceita cards de campanhas diferentes no mesmo lote (cada campanha com seu CP base e sua pasta de fotos, cadastrados em campanhas.md), monta o JSON de lote do gerador_campanhas_v3.jsx com prévia para aprovação, localiza a pasta de cada cliente no Google Drive e roda a geração (PowerShell no Windows, AppleScript no macOS), devolvendo pendências ou arquivos gerados. Usar quando o usuário mandar IDs de cards de campanha/CP Meta Ads para produzir as artes, pedir "gera o lote", "monta o JSON da campanha" ou "roda as campanhas no Illustrator".
---

# Campanhas em lote: ClickUp → JSON → Illustrator (Windows e macOS)

Fluxo completo: IDs dos cards → leitura no ClickUp → campanha de cada card (CP base + fotos via `campanhas.md`) → produtos + pasta do Drive de cada cliente → prévia para aprovação → `lote - <data>.json` → `rodar_lote.ps1` (Windows) ou `rodar_lote.sh` (macOS) gera os `.ai` sem janelas → relatar o resultado.

Um mesmo lote pode misturar campanhas: ex. cliente A na Prorrogação Black, cliente B no Natal, cliente C na Le Creuset. Cada cliente sai com o CP base e as fotos da sua campanha, salvo na pasta daquela campanha no Drive.

## 0. Atualizar a skill e ver o sistema

Antes de tudo, atualizar a skill em silêncio: `git -C "<pasta da skill>" pull --ff-only -q`. Se falhar (sem internet, alteração local), seguir com a versão atual e avisar o usuário em uma linha. Se atualizou, reler este `SKILL.md`.


Ver o `Platform` do ambiente (`win32` = Windows, `darwin` = macOS) e usar em todo o fluxo os comandos e caminhos do sistema certo:

| | Windows | macOS |
|---|---|---|
| Executor | `rodar_lote.ps1` (PowerShell + COM) | `rodar_lote.sh` (bash + AppleScript) |
| Raiz do Drive | `G:\Meu Drive` | `~/Library/CloudStorage/GoogleDrive-<conta>/Meu Drive` |
| Listar pastas | `Get-ChildItem -Directory` | `ls -1` |
| Illustrator travado? | `Get-Process Illustrator` | `pgrep` + `osascript` (ver seção 7) |

O `gerador_campanhas_v3.jsx` é o mesmo nos dois sistemas.

Cada card vira um cliente no JSON; cada subtarefa `CRIATIVO NN` vira um produto.

Princípio: **nunca inventar dado comercial nem caminho**. O que o briefing não disser e não tiver regra padrão abaixo vira `"PENDENTE: <motivo / opções>"` — o script pula o cliente com PENDENTE e gera os demais.

## 1. Onde ficam as coisas

O código fica na pasta desta skill (a que contém este `SKILL.md`; se ela for um atalho em `~/.claude/skills`, usar o destino real). Os materiais ficam no **Google Drive**, compartilhados entre todos os computadores e designers.

```
<pasta da skill>/                 ← git (só texto)
├── SKILL.md, README.md
├── scripts/                      ← gerador_campanhas_v3.jsx, rodar_lote.ps1, rodar_lote.sh
├── lote - <data>.json            ← lotes gerados (fora do git)
└── relatorio_lote.txt            ← log acumulado (fora do git)

<raiz Clientes>/_Materiais Gerais - Anjos/campanhas base/      ← Drive (pasta "Campanhas base")
├── _Skill campanhas em lote/campanhas.md   ← cadastro: campanha → CP base + fotos
├── Campanha base - Natal/
│   ├── CP base - Renove o conforto (skill).ai
│   └── Fotos - Natal/
└── Campanha base - Black Anjos/ ...
```

- **Raiz Clientes**: localizar como na seção 4. **Campanhas base** = `<raiz Clientes>/_Materiais Gerais - Anjos/campanhas base`. Não existe → parar e perguntar.
- Ler `<Campanhas base>/_Skill campanhas em lote/campanhas.md`. Cada bloco `## <Campanha>` tem: **Nomes no ClickUp** (apelidos, separados por vírgula), **CP base** e **Fotos** (caminhos relativos a Campanhas base) e, opcional, **Nome no arquivo**. Blocos dentro de `<!-- -->` são exemplos — ignorar.
- Conferir que o CP base e a pasta de fotos de cada campanha usada existem. Arquivo que não existe (renomeado ou movido no Drive) → PENDENTE na prévia, com os `.ai`/pastas parecidos como opções.
- Listar as fotos da pasta de cada campanha usada (`.png/.jpg/.jpeg/.tif/.psd/.webp`, só o primeiro nível). Nomes: `<Modelo> <Tamanho>.png`, `<Modelo>.png` (sofás) e variantes `<Modelo> AZUL.png`.
- CP base preparado para o script leva `(skill)` no nome e fica ao lado do original usado à mão.
- Os scripts ficam só em `scripts/` (versionados no git). Ao alterá-los, avisar o usuário para fazer commit.

### Cadastrar campanha nova
Se um card trouxer uma campanha que não está em `campanhas.md`, ela vira PENDENTE na prévia. Perguntar ao usuário qual CP base e qual pasta de fotos usar (listar os `.ai` com "CP base" no nome e as pastas de fotos dentro de Campanhas base), ou se é um apelido de uma campanha já cadastrada. Com a resposta, **acrescentar o bloco (ou o apelido) em `campanhas.md` no Drive** para não perguntar de novo (vale para todos os computadores). Se o CP base ainda não existir, a campanha fica pendente — nunca usar o CP base de outra campanha sem o usuário mandar.

## 2. Ler os cards no ClickUp

Para cada ID (consultas independentes em paralelo):

1. `clickup_get_task` com `include: ["description", "subtasks"]`.
2. **Cliente** = nome da lista do card (`list.name`, ex.: "Anjos Caxias do Sul").
3. **Campanha** = texto entre colchetes no nome do card que não seja período nem formato. Ex.: `📢 Anjos Caxias - CP MetaAds 🔵 01 Dez - [ 01 dez - 10 dez] [Prorrogação Black] - [Estático]` → `Prorrogação Black`. Cada card pode ter uma campanha diferente.
   - Casar com os **Nomes no ClickUp** de `campanhas.md` (sem maiúsculas/acentos/espaços extras). Achou → usar o CP base e as fotos daquele bloco. Não achou ou achou mais de um → PENDENTE (ver "Cadastrar campanha nova").
   - Nome da campanha no arquivo e na pasta do Drive = **Nome no arquivo** do bloco, se houver; senão, o texto do card.
4. **Mês da campanha** = mês do `start_date` do card (antes de converter, chamar `clickup_get_user` e usar o fuso do `current_time`); sem `start_date`, usar o período no nome (`[01 dez - 10 dez]`).
5. Subtarefas válidas: `CRIATIVO NN - [Produto]` (tolerar espaços e hífen colado). Ordenar por `NN`. Não filtrar por status (vêm como "templates"). Ignorar as que começam com `[Fora da campanha]`.
6. Buscar cada subtarefa com `clickup_get_task` + `include: ["description"]` (em paralelo). O briefing está em `markdown_description`, seção "Briefing design". Remover Markdown (`**`, `\[ \]`).

## 3. Converter cada CRIATIVO em produto

Usar **Produto**, **Frase destaque**, **Benefícios**, **Preço** ou **Atrativo de oferta**, **Selo**, **CTA** e **Letras miúdas**. Ignorar complementos entre parênteses no produto (ajuste manual do design), mas citá-los na prévia.

### nome
Sempre preencher `"nome"` com o modelo, sem tamanho/cor/complemento: "Colchão Genialle + Box" → `"Genialle"`; "Colchão + Box Benvenutti + Box Baú" → `"Benvenutti"`. (Sem `nome`, o script usa o arquivo da foto sem "Casal/Queen/AZUL/BOX BAU".)

### beneficios
Lista com os itens de **Benefícios**/**Beneficio** do card separados por `|` (ex.: `["Molas ensacadas", "Conforto na medida certa"]`). O CP base tem de 1 a 3 marcadores: preenche de cima para baixo e remove os que sobram. Card sem benefícios → omitir o campo (todos os marcadores são removidos). Destaque como na frase: a palavra-chave do benefício entre `*` sai em Black (padrão do design: `"Alto *suporte*"`, `"Conforto *surpreendente*"`). Quebra de linha dentro de um benefício: `\n` (se o marcador do CP base já tem 2 linhas, o script quebra sozinho). Se o CP base não tiver marcadores, o relatório avisa.

### frase
Texto de **Frase destaque** do card, copiado como está (só remover Markdown). Marcar entre `*` o trecho de destaque, que sai na versão Bold da fonte do CP base. Padrão do design: destacar o benefício principal, 2 a 4 palavras, normalmente o fim da frase. Exemplos aprovados pelo designer:
- `Mais *espaço e praticidade* para receber bem.`
- `Muda suas noites e *transforme suas manhãs.*`
- `Mais espaço para *relaxar e aproveitar* seus momentos de descanso.`
- `Para fãs de *qualidade & conforto*`
- `Você merece começar o ano *dormindo bem!*`

O script quebra a frase em 2 linhas equilibradas. Para forçar outra quebra, usar `\n`. Card sem frase → omitir o campo (a caixa `{{frase}}` é removida e o relatório avisa). Mostrar a frase com o destaque na prévia, para o usuário confirmar.

### categoria (exatamente uma)
`Conjunto`, `Conjunto Box`, `Colchão`, `Colchão + Box`, `Cama`, `Sofá`, `Sofá-cama`, `Sofá Retrátil`, `Sofá Retrátil e Reclinável`

**Seguir o termo do card — não converter um no outro:**
- "Colchão + Box" / "Colchão X + Box" / "Colchão + Box X" → `Colchão + Box`
- "Conjunto Box" / "Conjunto X Box" → `Conjunto Box`
- "Conjunto X" → `Conjunto`
- "Colchão X" sem box → `Colchão`
- "Cama X" (cama, base com cabeceira) → `Cama`
- Sofás: variante citada (cama, retrátil, reclinável); sem variante → `Sofá`
- Não mapeável → PENDENTE

### tamanho
`Solteiro`, `Solteirão`, `Casal`, `Queen`, `King` ou `Neutro`.

- Usar o tamanho citado (ex.: "(casal 1,38 x 1,88)" → `Casal`).
- **Sem tamanho no briefing → NÃO preencher tamanho.** O padrão Casal vale **só para a escolha da foto** (`<Modelo> Casal.png`, a imagem mais convencional). Escrever "Casal" na arte sem estar no card cria uma informação falsa que passa despercebida na auditoria humana.
- Sem tamanho → **omitir `tamanho` e `medida`** do JSON: o script remove a linha de tamanho, a faixa dourada (`faixa_tamanho`) e centraliza o nome no cartão.
- Card que vale para **todos os tamanhos** ("todos os tamanhos", "linha completa") → `"tamanho": "Todos"`: a linha vira "Todos os tamanhos". Conjunto/colchão sem tamanho no card: perguntar na prévia se usa "Todos os tamanhos" ou deixa sem.
- `Neutro` só para sofás **com medida no card** (ex.: "Sofá-Cama Lungo (1,50 m)" → `"tamanho": "Neutro", "medida": "1,50m"`). Sofá sem medida → omitir tamanho (sem bloco), não usar PENDENTE.
- Não preencher `medida` em tamanho padrão — o script aplica a tabela.

### foto
Procurar só na pasta de fotos **da campanha do card**. Os arquivos podem ter sufixo da campanha (ex.: `Genialle Casal - Natal v2.png`) — comparar só o começo `<Modelo> <Tamanho>`.
1. `<Modelo> <Tamanho>` (ex.: `Differenza Casal.png`).
2. Se não existir: `<Modelo>` (ex.: `Milano.png`, `Milano - Natal.png`).
3. Variantes (`AZUL`, `aberto/fechado`, `Baú`, `3 lugares`) só se o briefing pedir; se pedir, usar a variante (ex.: sofá-cama "fechado como imagem principal" → `Lungo fechado`).
4. Comparar sem maiúsculas/acentos. Mais de uma opção igualmente boa → escolher a mais simples e citar as outras na prévia.
5. **Sem foto do modelo → `"foto": ""`.** O script gera o produto com um **quadro verde neon do tamanho da prancheta** no lugar da foto (camada `fotos`, nome `SEM FOTO - ...`) e avisa no relatório. Não usar PENDENTE para foto — a campanha sai mesmo assim.

### selo
Texto de **Selo** do card (ex.: `"Linha Ouro"`, `"Linha Diamante"`, `"Entrega em Ecoville e região."`). O script copia o selo do arquivo de selos da campanha (campo **Selos** do `campanhas.md`) e coloca na `area_selo` do CP base (com benefícios, na `area_selo | beneficios`). Antes da prévia, listar os selos disponíveis no arquivo de selos e marcar na prévia **"selo novo — criar à mão"** quando o pedido do card não existir lá (o relatório também avisa). Card sem selo → omitir.

### cta
Texto de **CTA** do card, com o trecho forte entre `*` (padrão do design: `"*Entre em contato*\ne saiba mais!"`, `"Fale agora pelo *WhatsApp!*"`). Vai no símbolo `WhatsApp` do CP base: ele continua símbolo, a pílula estica ou encolhe com o texto e cada CTA diferente vira uma cópia do símbolo (`WhatsApp 2`...). Se todos os criativos têm o mesmo CTA, colocar uma vez no cliente (`"cta"`); senão, em cada produto.

### letras_miudas
Texto de **Letras miúdas** do card, com a data de validade entre `*` (sai em Bold): `"Imagem meramente ilustrativa. ... Promoção válida até *31/12/2026*, conforme disponibilidade de produtos e cores."`. Vai no símbolo `letras miudas` (continua símbolo; o corpo diminui se não couber). Igual em todos os criativos → no cliente; diferente (ex.: validade 18/12 num e 10/12 nos outros) → em cada produto.

### enquadramento
Ler `<Campanhas base>/_Skill campanhas em lote/enquadramento.json`. Se houver entrada para a campanha e o arquivo da foto do produto, copiar para o produto: `"enquadramento": {"story": [x, y, largura], "feed": [x, y, largura]}` (frações da prancheta). O script aplica o zoom e a posição salvos em vez de só centralizar. Na prévia, marcar "enquadramento salvo" nos produtos que usam.

**Gravar enquadramento novo** só a partir de uma campanha **final revisada pelo chefe de design**, e só depois que o usuário confirmar vendo a comparação (miniaturas da versão final). Nunca gravar a partir da primeira correção.

### preco + valores
Formato (o script valida):
- `V_DE`, `V_parcela`, `V_total`: número **com os centavos do card** quando não forem zero (R$ 3.399,00 → `"3399"`; R$ 199,90 → `"199,90"`). O script põe o inteiro na tag e troca o `,00` fixo do CP base pelos centavos. Nunca arredondar.
- `V_%`: só número inteiro.
- `V_X`: número + X maiúsculo (`"18X"`).
- `V_Oferta_TXT`: texto do briefing, literal (sem corrigir ortografia). O script quebra em 2 linhas no `|` (ou na primeira vírgula: "Conforto de hotel, / Preço de Black!"); sem separador fica 1 linha.

| Briefing | preco | campos |
|---|---|---|
| "De X por: NX R$Y ou à vista R$Z" | `parcelado` | V_DE=X, V_X=NX, V_parcela=Y, V_total=Z |
| "De X por R$Z à vista" (sem parcelas) | `a_vista` | V_DE=X, V_total=Z |
| "Até N% off" / "N% off" | `desconto` | V_%=N |
| Só texto de oferta ("Últimas peças \| Preço de Black") | `oferta` | V_Oferta_TXT=texto |
| "De X por: NX R$Y" (sem à vista) | `parcelado` | V_DE=X, V_X=NX, V_parcela=Y, **V_total=""** |
| Sem preço nem texto de oferta no card | `sem_preco` | nenhum (sem bloco de preço na arte) |

- Campo do grupo que o card não informa → deixar `""` (não PENDENTE). O script gera com o campo **em branco** para o usuário editar à mão e lista em `AVISOS`. Citar na prévia.
- Card sem preço nenhum é escolha estética da campanha → `sem_preco`, sem perguntar.
- Preço com parcelas **e** texto de oferta: usar o grupo do preço e citar o texto na prévia.

## 4. Pasta de salvamento no Google Drive

Cada cliente recebe `"pasta_saida"` com o caminho absoluto da pasta da campanha:

```
<raiz Clientes>/<pasta do cliente>/02 - Editáveis Campanhas/<MM> <MMM> - <Campanha>
```

**Raiz Clientes** (pasta `02. Clientes`):
- Windows: `G:\Meu Drive\Ampliar Digital\02. Clientes`
- macOS: não fixar o caminho; localizar com
  `find ~/Library/CloudStorage/GoogleDrive-*/"Meu Drive" -maxdepth 2 -type d -name "02. Clientes" -path "*Ampliar Digital*"`
  - Ignorar pastas `GoogleDrive-<conta> (dd-mm-aaaa hh:mm)` (montagens antigas, desatualizadas) e qualquer `.Encrypted`.
  - No Mac a pasta pode se chamar `Ampliar Digital ` **com espaço no final** — usar o caminho exatamente como o `find` devolveu.
  - Nenhuma ou mais de uma raiz válida → perguntar ao usuário.

Ex. Windows: `G:/Meu Drive/Ampliar Digital/02. Clientes/Anjos - Caxias do Sul RS/02 - Editáveis Campanhas/12 DEZ - Prorrogação Black`
Ex. macOS: `/Users/<usuário>/Library/CloudStorage/GoogleDrive-<conta>/Meu Drive/Ampliar Digital /02. Clientes/Anjos - Caxias do Sul RS/02 - Editáveis Campanhas/12 DEZ - Prorrogação Black`

No JSON, usar sempre `/` como separador.

1. **Pasta do cliente**: listar a raiz Clientes (Windows `Get-ChildItem -Directory`; macOS `ls -1`) e casar com o nome da lista do ClickUp ignorando maiúsculas, acentos (no macOS os nomes vêm em Unicode decomposto/NFD — normalizar antes de comparar), hífens, a palavra da marca e sufixos de UF/região ("Anjos Caxias do Sul" ↔ "Anjos - Caxias do Sul RS"). Nenhuma ou mais de uma correspondência → `"pasta_saida": "PENDENTE: opções ..."`.
2. **`02 - Editáveis Campanhas`** precisa existir dentro do cliente; se não existir → PENDENTE.
3. **Pasta da campanha**: `MM` com dois dígitos + mês abreviado em maiúsculas (`JAN FEV MAR ABR MAI JUN JUL AGO SET OUT NOV DEZ`) + ` - ` + campanha. Se já existir uma pasta com o mesmo prefixo `MM MMM` e nome equivalente (diferença só de caixa/acento), usar a existente. Se não existir, o script cria esse último nível.
4. Nome do arquivo: `<Cliente> - <Campanha>.ai` (cliente explícito). Se já houver `.ai` com esse nome na pasta, o script **não sobrescreve** (aparece em "JÁ EXISTIAM").

## 5. Prévia para aprovação (obrigatória)

Agrupar por campanha (nome, CP base e pasta de fotos no título do grupo). Por cliente: pasta de destino + cidade + CTA e letras miúdas (se iguais para todos) + tabela `NN | foto | nome | categoria | tamanho (ou "sem") | frase (com *destaque*) | benefícios | selo | preço | valores | enquadramento salvo?`, marcando **PENDENTE** (com opções), selos que não existem no arquivo de selos e ajustes manuais ("Até", layouts especiais). Perguntar se aprova ou o que corrigir; resolver PENDENTEs com as respostas. Só gravar após aprovação explícita.

## 6. Gravar o JSON

`lote - <AAAA-MM-DD HHhMM>.json` na pasta da skill. **Campanha, CP base e fotos vão em cada cliente** (é isso que permite misturar campanhas). `arquivo_base`, `pasta_fotos` e `pasta_saida` com caminho **absoluto** (Campanhas base + caminho do `campanhas.md`):

```json
{
  "clientes": [
    {
      "cliente": "Anjos Caxias do Sul",
      "clickup_id": "17txe6ym9ap",
      "campanha": "Prorrogação Black",
      "cidade": "Caxias do Sul",
      "cta": "*Entre em contato*\ne saiba mais!",
      "letras_miudas": "Imagem meramente ilustrativa. Consulte condições de pagamento. Promoção válida até *10/12/2026*.",
      "selos_arquivo": "G:/Meu Drive/Ampliar Digital/02. Clientes/_Materiais Gerais - Anjos/campanhas base/Campanha base - Black Anjos/elementos.ai",
      "arquivo_base": "G:/Meu Drive/Ampliar Digital/02. Clientes/_Materiais Gerais - Anjos/campanhas base/Campanha base - Black Anjos/CP base.ai",
      "pasta_fotos": "G:/Meu Drive/Ampliar Digital/02. Clientes/_Materiais Gerais - Anjos/campanhas base/Campanha base - Black Anjos/Fotos - Fundo loja",
      "pasta_saida": "G:/Meu Drive/Ampliar Digital/02. Clientes/Anjos - Caxias do Sul RS/02 - Editáveis Campanhas/12 DEZ - Prorrogação Black",
      "produtos": [
        { "foto": "Differenza Casal.png", "nome": "Differenza", "categoria": "Conjunto Box", "tamanho": "Casal",
          "beneficios": ["Molas *ensacadas*", "Conforto na *medida certa*"], "frase": "Mais *conforto* para suas noites.",
          "selo": "Linha Diamante", "enquadramento": { "story": [-0.11, -0.11, 1.22], "feed": [-0.12, -0.58, 1.22] }, "preco": "parcelado",
          "V_DE": "3399", "V_X": "18X", "V_parcela": "115", "V_total": "2070", "V_%": "", "V_Oferta_TXT": "" },
        { "foto": "Genialle Casal.png", "nome": "Genialle", "categoria": "Conjunto Box", "preco": "oferta",
          "V_Oferta_TXT": "Ultimas peças | Preço de Black" }
      ]
    },
    {
      "cliente": "Anjos Itu",
      "clickup_id": "86abc456",
      "campanha": "Natal",
      "arquivo_base": "G:/Meu Drive/Ampliar Digital/02. Clientes/_Materiais Gerais - Anjos/campanhas base/Campanha base - Natal/CP base - Natal (skill).ai",
      "pasta_fotos": "G:/Meu Drive/Ampliar Digital/02. Clientes/_Materiais Gerais - Anjos/campanhas base/Campanha base - Natal/Fotos - Natal",
      "pasta_saida": "G:/Meu Drive/Ampliar Digital/02. Clientes/Anjos - Itu SP/02 - Editáveis Campanhas/12 DEZ - Natal",
      "produtos": [ ... ]
    }
  ]
}
```

- Cliente com campanha PENDENTE: `"arquivo_base": "PENDENTE: campanha X não cadastrada"` — o script pula só esse cliente.
- `campanha`, `arquivo_base` e `pasta_fotos` também podem ir no topo do JSON como padrão para todos (o do cliente prevalece).

- No macOS, `pasta_saida` começa com `/Users/<usuário>/Library/CloudStorage/GoogleDrive-<conta>/Meu Drive/...` (seção 4).
- `cliente` é obrigatório (vai no nome do arquivo).
- `selos_arquivo` (caminho absoluto do arquivo de selos) e `selos_secao` (campo **Seção dos selos**) vêm do bloco da campanha no `campanhas.md`. `cta` e `letras_miudas` no cliente valem para todos os produtos; no produto, prevalecem.
- `cidade` = nome da loja como aparece no logo, sem "Anjos" e sem UF (lista "Anjos Campo Grande" → `"Campo Grande"`; "Anjos Ecoville" → `"Ecoville"`). O script troca o texto "Cidade" dentro do símbolo `city` uma vez só: todas as instâncias continuam símbolo e o texto é reduzido se não couber na pílula. Sem `cidade`, o símbolo fica como está.
- Dois cards do mesmo cliente: `"arquivo"` distinto em cada um.
- Mais de 8 produtos num cliente: o script divide em partes.
- Validar o JSON (parse) depois de gravar.

## 7. Gerar e relatar

Logo após gravar o JSON aprovado, rodar o executor do sistema (o Illustrator abre sozinho se estiver fechado; timeout longo, ~40 s por campanha):

Windows:
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\rodar_lote.ps1" -Json ".\lote - <data>.json"
```

macOS:
```bash
bash ./scripts/rodar_lote.sh --json "./lote - <data>.json"
```
(rodar a partir da pasta da skill). Cada CP base é aberto uma vez só e gera todos os clientes da sua campanha.
Na primeira execução o macOS pode pedir permissão para o Terminal controlar o Adobe Illustrator (Ajustes do Sistema → Privacidade e Segurança → Automação). Erro `-1743` ("Not authorized to send Apple events") = pedir ao usuário para liberar ali e rodar de novo.

O modo automático gera as campanhas **uma de cada vez** (gera → salva → fecha → próxima), sem janelas, e devolve:

- `STATUS:` OK / PARCIAL / PENDÊNCIAS / NADA A FAZER
- `Campanha: ... | CP base: ... | Fotos: ...` — uma linha por campanha do lote
- `GERADAS` — cliente, `[campanha]` e caminho do `.ai`
- `AVISOS` — produtos SEM FOTO (quadro verde) e campos de preço em branco
- `PENDÊNCIAS - NÃO GERADAS` — por cliente, o que impede a geração
- `ERROS NA GERAÇÃO` — falhas do Illustrator
- `JÁ EXISTIAM - NÃO REFEITAS`

Relatar ao usuário exatamente isso: pendências que impedem a geração (de um cliente ou de todos) ou o aviso de arquivos gerados, com os caminhos. Para resolver uma pendência: corrigir o JSON e rodar de novo (só o que falta é gerado). Para refazer uma campanha: apagar o `.ai` dela e rodar de novo.

Antes de rodar, conferir que o Illustrator responde:
- Windows: `Get-Process Illustrator | Select-Object Responding, WorkingSet64` — processo com memória ~0 ou `Responding = False` = travado.
- macOS: se `pgrep -l "Adobe Illustrator"` mostrar o processo, testar `osascript -e 'with timeout of 15 seconds' -e 'tell application id "com.adobe.illustrator" to get version' -e 'end timeout'` — erro de timeout (`-1712`) = travado.

Se travou: pedir ao usuário para fechar/reabrir o Illustrator antes de seguir (não matar o processo sem avisar).

Observações:
- Log acumulado em `relatorio_lote.txt` ao lado do JSON.
- As imagens são **incorporadas** ao salvar (arquivos vão para o Drive e são abertos em outras máquinas); `"incorporar_imagens": false` no JSON desliga.
- O arquivo é repassado ao chefe de design, que corrige o necessário e exporta as imagens. Por isso:
  - aviso de **fonte faltando** no computador do usuário é esperado — não é erro;
  - o grupo `oferta` repete a mesma frase nas duas caixas de texto — é o comportamento aceito;
  - a duplicação/ajuste do Feed é manual (o Feed do CP base não tem o bloco de produto/preço). Não automatizar.
- Não abrir os `.ai` gerados para conferência/exportação de prévias sem o usuário pedir: abrir arquivos com fonte faltando via COM mostra janela modal e já travou o Illustrator. A conferência é o resumo do script.

## 8. Atualizar o CP base com uma campanha final (sob pedido)

Quando o usuário disser que uma campanha foi finalizada pelo chefe de design e pedir para comparar/aprender com ela:
1. Abrir só para leitura (alertas desligados, fechar sem salvar) a versão final e a gerada pelo script; comparar texto a texto (fonte, corpo, posição), símbolos, selos e fotos.
2. Listar as diferenças e separar: **dado do card** (CTA, selo, tamanho), **regra do script**, **desenho do CP base** e **layout especial** (não automatizar).
3. Com aprovação: salvar um CP base novo ao lado do atual (`... (skill) v2.ai`), nunca sobrescrever; gerar a mesma campanha de novo e mostrar lado a lado com a final; só então trocar o **CP base** no `campanhas.md`.
4. Gravar o enquadramento das fotos da versão final em `enquadramento.json` (com confirmação, ver seção 3).
