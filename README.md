# campanha-lote-clickup

Skill do [Claude Code](https://claude.com/claude-code) que gera campanhas de produto no Adobe Illustrator a partir de cards de campanha do ClickUp.

Você passa os IDs dos cards, que podem ser de **campanhas diferentes**. O Claude lê os briefings, descobre a campanha de cada card, mostra uma prévia para aprovação e roda o Illustrator. Cada cliente recebe um `.ai` feito com o CP base e as fotos da sua campanha, salvo na pasta dessa campanha no Google Drive.

```
IDs dos cards → ClickUp → campanhas.md no Drive (CP base + fotos) → prévia → lote.json → Illustrator → .ai por cliente
```

## O que tem aqui

| Arquivo | Função |
|---|---|
| `SKILL.md` | Instruções da skill: leitura dos cards, regras de conversão, prévia, geração e relatório. |
| `instalar.sh` | **macOS** — instala ou atualiza a skill e confere o computador. |
| `scripts/gerador_campanhas_v3.jsx` | Script do Illustrator (ExtendScript) que monta as campanhas a partir do JSON. |
| `scripts/rodar_lote.ps1` | **Windows** — executa o lote no Illustrator via PowerShell (COM), sem janelas. |
| `scripts/rodar_lote.sh` | **macOS** — executa o lote no Illustrator via AppleScript (`osascript`), sem janelas. |

## Requisitos

- **Windows** com PowerShell **ou macOS** (bash e `osascript` já vêm no sistema)
- Adobe Illustrator instalado
- Claude Code com o conector do **ClickUp** ativo
- Google Drive para computador (Windows: unidade `G:`; macOS: `~/Library/CloudStorage/GoogleDrive-<conta>/`)

## Instalação

### macOS (um comando)

1. Instale o Adobe Illustrator, o [Claude Code](https://claude.com/claude-code) e o Google Drive para desktop (conta da Ampliar).
2. No Claude Code, ative o conector do **ClickUp**.
3. Abra o **Terminal** (Cmd + Espaço, digite "Terminal") e cole:

```bash
curl -fsSL https://raw.githubusercontent.com/jprospirski/campanha-lote-clickup/main/instalar.sh | bash
```

O instalador baixa a skill e confere o Illustrator, o Claude Code e a pasta `campanhas base` no Drive. Se aparecer um ✗, resolva o item e cole o comando de novo.

4. Feche e abra o Claude Code e mande `/campanha-lote-clickup` com os IDs dos cards.

**Atualização é automática:** toda vez que a skill roda, ela baixa a versão mais nova antes de começar.

### Windows

```powershell
git clone https://github.com/jprospirski/campanha-lote-clickup.git "$env:USERPROFILE\.claude\skills\campanha-lote-clickup"
```

Reinicie o Claude Code; a skill aparece como `/campanha-lote-clickup`.

## Onde fica cada coisa

| O quê | Onde | Como chega aos outros computadores |
|---|---|---|
| Scripts, `SKILL.md`, `README.md` | Este repositório | `git pull` |
| `campanhas.md` (campanha → CP base + fotos) | Drive: `02. Clientes/_Materiais Gerais - Anjos/campanhas base/_Skill campanhas em lote/` | Drive |
| CP base e fotos | Drive: `02. Clientes/_Materiais Gerais - Anjos/campanhas base/<Campanha base - X>/` | Drive |
| Lotes JSON e relatório | Pasta da skill, fora do git | Não sincronizam (rascunho de cada execução) |

Cada computador precisa do Google Drive para desktop com o "Meu Drive" da Ampliar, do Illustrator com as fontes das campanhas (Humanist 521 BT Light e Bold etc.) e do Claude Code com esta skill clonada.

CP base preparado para o script leva `(skill)` no nome e fica ao lado do original usado à mão (ex.: `Campanha base - Natal/CP base - Renove o conforto (skill).ai`).

Cada CP base precisa ter os textos-marcador que o script substitui (`V_DE`, `V_X`, `V_parcela`, `V_total`, `V_%`, `V_Oferta_TXT`) e três marcadores de benefício.

### O que o CP base pode ter (Story e Feed)

| Elemento | Como montar no CP base | O que o script faz |
|---|---|---|
| Nome do produto | Grupo com `{{Categoria}}`, `{{nome}}` e `Tam.: {{tamanho}} {{medida}}` **no Story e no Feed** | Preenche nas duas pranchetas. O preço do Feed sai reduzido na mesma proporção do nome (ex.: 75%). |
| Frase de destaque | Texto `{{frase}}` com a fonte normal, o corpo e o tracking finais | Troca pela frase do card, aplica Bold no trecho entre `*` e quebra em 2 linhas equilibradas. |
| Cidade | Símbolo `city` com o texto vivo `Cidade` | Edita o símbolo uma vez; todas as instâncias continuam símbolo. |
| Benefícios | Grupos com o texto `Para que busca conforto` (1 a 3) | Preenche de cima para baixo e apaga os que sobram. |
| Áreas de diagramação | Retângulos sem preenchimento nem contorno na camada `guides`, nomeados `area_nome`, `area_preco` ou `area_info` | Centraliza o nome e o preço nas áreas e depois apaga os retângulos. Opções no nome: `\| esquerda`, `\| direita`, `\| max 145%` (o nome pode crescer até 145%, nomes curtos crescem mais), `\| espaco 130` (distância nome–preço na `area_info`). Oferta de uma caixa só que não cabe na área quebra em 2 linhas. |

| Frase alinhada | Retângulo `area_frase` (opção `\| direita`) | Alinha a frase na área e reduz se não couber. |
| Selo | Retângulos `area_selo` e `area_selo \| beneficios` | Copia o selo pedido no card do arquivo de selos (`Elementos.ai`) e encaixa na área; com benefícios usa a segunda. |
| Faixa do tamanho | Item nomeado `faixa_tamanho` | Produto sem tamanho: apaga a faixa e centraliza o nome. `"tamanho": "Todos"` escreve "Todos os tamanhos". |
| CTA | Símbolo `WhatsApp` com texto vivo | Troca o texto (trecho em `*` no peso forte), estica a pílula; CTA diferente por produto vira `WhatsApp 2`. |
| Letras miúdas | Símbolo `letras miudas` com texto de área | Troca o texto (data em Bold) e reduz o corpo se não couber. |

A memória de enquadramento (`enquadramento.json`, no Drive) guarda zoom e posição de cada foto aprovados numa campanha final.

CP base sem esses elementos continua funcionando como antes.

### Cadastrar uma campanha

1. Salve o CP base `(skill)` na pasta da campanha em `campanhas base` no Drive.
2. Use (ou crie) uma pasta de fotos dentro dela.
3. Acrescente um bloco no `campanhas.md` do Drive (caminhos a partir de `campanhas base`):

```markdown
## Natal
- Nomes no ClickUp: Natal, Especial de Natal
- CP base: Campanha base - Natal/CP base - Natal (skill).ai
- Fotos: Campanha base - Natal/Fotos - Natal
```

Se um card chegar com uma campanha que não está cadastrada, a skill pergunta qual CP base e quais fotos usar e já grava o cadastro.

## Como usar

Abra o Claude Code na pasta de trabalho e chame a skill com os IDs dos cards:

```
/campanha-lote-clickup 86abc123 86abc456
```

Também funciona em linguagem natural: "gera o lote desses cards", "monta o JSON da campanha", "roda as campanhas no Illustrator".

O fluxo:

1. **Leitura** — cada card vira um cliente; cada subtarefa `CRIATIVO NN - [Produto]` vira um produto. O briefing vem da seção "Briefing design" da subtarefa.
2. **Prévia** — tabela por cliente com foto, nome, categoria, tamanho, benefícios e preço. Nada é gravado sem a sua aprovação.
3. **JSON** — grava `lote - <data>.json` na pasta da skill, com campanha, CP base e fotos por cliente.
4. **Geração** — roda `rodar_lote.ps1` (Windows) ou `rodar_lote.sh` (macOS), uma campanha por vez (gera → salva → fecha).
5. **Relatório** — lista o que foi gerado, o que ficou pendente, erros e arquivos que já existiam.

### Pendências

A skill nunca inventa dado comercial nem caminho. Foto ou preço que faltam não travam a campanha (quadro verde / campo em branco); o que não tiver regra padrão, como cliente ou campanha não encontrados, vira `"PENDENTE: <motivo>"` no JSON. O script pula o cliente com pendência e gera os demais; corrija o JSON e rode de novo — só o que falta é gerado.

### Formato dos preços

| Briefing | `preco` | Campos |
|---|---|---|
| "De X por: NX R$Y ou à vista R$Z" | `parcelado` | `V_DE`, `V_X`, `V_parcela`, `V_total` |
| "De X por R$Z à vista" | `a_vista` | `V_DE`, `V_total` |
| "Até N% off" | `desconto` | `V_%` |
| Só texto de oferta | `oferta` | `V_Oferta_TXT` |

| "De X por: NX R$Y" (sem à vista) | `parcelado` | `V_DE`, `V_X`, `V_parcela` (à vista em branco) |
| Card sem preço | `sem_preco` | nenhum (sem bloco de preço) |

Valores com os centavos do card (`"3399"`, `"199,90"`); o script troca o `,00` do CP base pelos centavos e nunca arredonda. Parcelas no formato `"18X"`. Campo que o card não informa sai **em branco** para edição manual.

Categorias: `Conjunto`, `Conjunto Box`, `Colchão`, `Colchão + Box`, `Cama`, `Sofá`, `Sofá-cama`, `Sofá Retrátil`, `Sofá Retrátil e Reclinável` — sempre o termo do card ("Colchão + Box" não vira "Conjunto Box").

Produto sem foto na pasta da campanha sai com um **quadro verde neon** do tamanho da prancheta no lugar da foto, para o designer localizar.

## Rodar sem o Claude

Com um JSON de lote pronto, o gerador funciona sozinho:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\rodar_lote.ps1" -Json ".\lote - Minha Campanha.json"   # Windows
```
```bash
bash ./scripts/rodar_lote.sh --json "./lote - Minha Campanha.json"                                             # macOS
```

O formato completo do JSON está na seção 6 do `SKILL.md`.

## Adaptar para a sua equipe

A skill foi escrita para o fluxo de uma agência específica. Para usar em outro contexto, ajuste no `SKILL.md`:

- **Seção 2** — padrão de nome dos cards e das subtarefas no ClickUp.
- **Seção 3** — categorias, tamanhos e regras de conversão do briefing.
- **Seção 4** — caminho das pastas de clientes no Drive (`G:\Meu Drive\...\02. Clientes\<cliente>\02 - Editáveis Campanhas\<MM> <MMM> - <Campanha>` no Windows; `~/Library/CloudStorage/GoogleDrive-<conta>/Meu Drive/...` no macOS).

## Problemas comuns

- **Illustrator travado** — Windows: `Get-Process Illustrator` mostra `Responding = False`. macOS: `osascript -e 'tell application id "com.adobe.illustrator" to get version'` não responde. Feche e reabra o Illustrator antes de rodar.
- **macOS: erro `-1743` / "Not authorized to send Apple events"** — libere o Terminal (ou o app onde o Claude Code roda) para controlar o Adobe Illustrator em Ajustes do Sistema → Privacidade e Segurança → Automação.
- **macOS: pasta do Drive não encontrada** — no Mac a pasta pode ter espaço no fim do nome (`Ampliar Digital `) e o Drive pode deixar montagens antigas `GoogleDrive-<conta> (data)`; a skill localiza a pasta `02. Clientes` certa sozinha.
- **Aviso de fonte faltando** — esperado quando a máquina não tem as fontes do arquivo-base; não impede a geração.
- **Arquivo não foi refeito** — o script não sobrescreve `.ai` existente. Apague o arquivo e rode de novo.
- **Log** — cada execução acumula em `relatorio_lote.txt`, ao lado do JSON.

## Ao alterar os scripts

Os scripts ficam só em `scripts/`. Depois de editar, faça commit.
