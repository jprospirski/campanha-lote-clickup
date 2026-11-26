/*
    Gerador de Campanhas - Adobe Illustrator
    Versão 3.0 - modo LOTE (JSON) + modo MANUAL (igual à v2.1)
    Autor: ChatGPT / Claude / Ampliar

    MODOS
    - Manual: fluxo idêntico à v2.1 (janela de seleção, uma campanha por vez).
    - Lote (JSON): lê um arquivo .json com vários clientes e gera UMA campanha
      por execução (para não sobrecarregar o computador):
        1. rode o script e escolha o JSON;
        2. ele pega o próximo cliente que ainda não tem .ai na pasta de saída;
        3. gera, salva como "<Cliente> - <Campanha>.ai" e deixa o arquivo aberto;
        4. revise, salve (Ctrl+S), feche e rode o script de novo para o próximo.
      Mais de 8 produtos no mesmo cliente: vira "parte 1", "parte 2" (uma por execução).
      Para refazer uma campanha, apague o .ai dela e rode de novo.
      Cada geração registra uma linha em "relatorio_lote.txt" ao lado do JSON.
    - Automático (sem janelas): rodar_lote.ps1 (Windows) ou rodar_lote.sh (macOS)
      definem $.global.LOTE_AUTO.
      Gera em sequência todas as campanhas pendentes (gera, salva, fecha, próxima)
      e devolve um resumo: STATUS, GERADAS, PENDÊNCIAS, ERROS e JÁ EXISTIAM.
      Cliente com pendência é pulado; os demais são gerados.

    FORMATO DO JSON (modo lote)
    Campanha, CP base e fotos podem ser definidos no lote (padrão para todos) ou
    em cada cliente (o do cliente vale). Assim um lote mistura campanhas:
    cliente A na Black, cliente B no Natal, cada um com seu CP base e suas fotos.
    {
      "campanha": "Prorrogação Black",               // padrão do lote (opcional se cada cliente tiver)
      "pasta_fotos": "Fotos/Fundo loja",             // relativo à pasta do JSON ou absoluto
      "arquivo_base": "Campanhas base/CP base - X.ai", // opcional (padrão: "CP base*" da pasta_fotos)
      "pasta_saida": "Campanhas geradas",            // opcional (padrão: <pasta do JSON>/Campanhas geradas)
      "clientes": [
        {
          "cliente": "Anjos Caxias do Sul",
          "clickup_id": "17txe6ym9ap",               // opcional, só para o relatório
          "campanha": "Natal",                       // opcional: substitui a do lote
          "arquivo_base": "Campanhas base/CP base - Natal.ai", // opcional: substitui o do lote
          "pasta_fotos": "Fotos/Natal",              // opcional: substitui a do lote
          "pasta_saida": "G:/Meu Drive/.../02 - Editáveis Campanhas/12 DEZ - Prorrogação Black",
                                                     // opcional; a pasta-mãe tem de existir, a última é criada
          "produtos": [
            {
              "foto": "Differenza Casal.png",        // nome do arquivo na pasta_fotos (extensão opcional)
                                                     // vazio ou não encontrado = quadro verde neon (aviso)
              "nome": "Differenza",                  // opcional (padrão: nome do arquivo sem tamanho/AZUL)
              "categoria": "Conjunto Box",
              "tamanho": "Casal",                    // Solteiro | Solteirão | Casal | Queen | King | Neutro
                                                     // vazio/ausente = card sem tamanho: o bloco "Tamanho:" é removido
              "medida": "",                          // obrigatório só no tamanho Neutro
              "beneficios": ["Molas ensacadas", "Conforto na medida certa"],
                                                     // até 3 (lista ou "A | B"); vazio/ausente = remove os marcadores
              "preco": "parcelado",                  // a_vista | oferta | parcelado | desconto | sem_preco
                                                     // sem_preco = nenhum bloco de preço na arte
              "V_DE": "3399",                        // inteiro ou com centavos ("4980" / "199,90")
              "V_X": "18X",                          // número + X maiúsculo
              "V_parcela": "115",                    // inteiro ou com centavos
              "V_total": "2070",                     // inteiro ou com centavos
                                                     // campo do grupo vazio = fica em branco (aviso)
              "V_%": "",                             // só número inteiro
              "V_Oferta_TXT": ""                     // texto livre
            }
          ]
        }
      ]
    }
    - Qualquer campo com o texto "PENDENTE" bloqueia o lote (pendência da IA a resolver).
    - O script lê no CP base quais tags existem em cada grupo de preço e exige que
      essas tags estejam preenchidas no JSON.

    O que faz (modo manual):
    1. Pergunta a pasta dos produtos.
    2. Lê imagens da pasta.
    3. Exibe uma janela com abas para:
       - selecionar os produtos da campanha;
       - selecionar categoria, tamanho e preço por produto;
       - preencher manualmente valores/textos promocionais por produto;
       - ordenar manualmente os produtos selecionados.
    4. Preenche automaticamente a medida conforme o tamanho escolhido.
       - No tamanho Neutro, a medida fica habilitada para edição manual.
    5. Procura o arquivo "CP base" na mesma pasta.
    6. Cria um novo documento com duas pranchetas por produto:
       - Story: 1080 x 1920
       - Feed: 1080 x 1080
    7. Copia o layout do CP base para cada prancheta mantendo a posição relativa exata à prancheta de origem.
    8. Adiciona a foto do produto na camada "fotos", centralizada, cobrindo 100% da prancheta, sem distorcer, com clipping mask.
    9. Procura tags de texto na camada "txt" e preenche:
       - categoria
       - tamanho
       - medida
       - nome
       - V_total
       - V_DE
       - V_parcela
       - V_X
       - V_%
       - V_Oferta_TXT

    Requisitos do arquivo CP base:
    - Deve estar na mesma pasta dos produtos.
    - Nome do arquivo deve começar exatamente com: CP base
      Exemplos aceitos: CP base.ai, CP base.ait, CP base.eps, CP base.pdf
    - Deve conter as camadas principais exatamente com estes nomes:
      txt, BG, fotos, guides
    - Preferencialmente deve conter 2 pranchetas modelo:
      uma 1080x1920 para Story e uma 1080x1080 para Feed.
      Se não encontrar pelo tamanho, o script usa a primeira prancheta como Story e a segunda como Feed.

    Formatos de tag aceitos na camada "txt":
    - nome exato do textFrame: categoria, tamanho, medida, nome
    - conteúdo exato: categoria, tamanho, medida, nome
    - placeholders dentro do texto:
      {{categoria}}, {categoria}, <categoria>, [categoria]
      {{tamanho}}, {tamanho}, <tamanho>, [tamanho]
      {{medida}}, {medida}, <medida>, [medida]
      {{nome}}, {nome}, <nome>, [nome]
      {{V_total}}, {V_total}, <V_total>, [V_total]
      {{V_DE}}, {V_DE}, <V_DE>, [V_DE]
      {{V_parcela}}, {V_parcela}, <V_parcela>, [V_parcela]
      {{V_X}}, {V_X}, <V_X>, [V_X]
      {{V_%}}, {V_%}, <V_%>, [V_%]
      {{V_Oferta_TXT}}, {V_Oferta_TXT}, <V_Oferta_TXT>, [V_Oferta_TXT]
*/

#target illustrator

(function () {
    // =========================
    // CONFIGURAÇÕES PRINCIPAIS
    // =========================
    var STORY_W = 1080;
    var STORY_H = 1920;
    var FEED_W = 1080;
    var FEED_H = 1080;

    var GAP_X = 80;
    var GAP_Y = 80;
    var PRODUCT_GAP_X = 160;

    var PRODUCT_COLUMNS = 2;
    var MAX_PRODUCTS_PER_FILE = 8;

    var LAYER_NAMES = ["txt", "BG", "fotos", "guides"];

    var IMAGE_EXT_RE = /\.(jpg|jpeg|png|tif|tiff|psd|webp)$/i;
    var BASE_EXT_RE = /\.(ai|ait|eps|pdf)$/i;

    var COPY_BLEED = 20;

    // A camada "fotos" do CP base tem só fotos de referência (ex.: Admirable Queen).
    // Elas não são copiadas: cada prancheta recebe apenas a foto do produto.
    var SKIP_BASE_LAYERS = { "fotos": true };
    var EMBED_IMAGES = false;
    var FORCE_IMAGE_REDRAW = false;

    // O ScriptUI do Illustrator trata um item chamado exatamente "-" como separador.
    // Por isso, a interface mostra "Neutro (-)", mas o valor aplicado na tag tamanho continua sendo "-".
    var NEUTRAL_SIZE_UI = "Neutro (-)";
    var NEUTRAL_SIZE_VALUE = "-";
    var NEUTRAL_DEFAULT_MEASURE = "000m";

    var CATEGORY_OPTIONS = [
        "Conjunto",
        "Conjunto Box",
        "Colchão",
        "Colchão + Box",
        "Cama",
        "Sofá",
        "Sofá-cama",
        "Sofá Retrátil",
        "Sofá Retrátil e Reclinável"
    ];

    var SIZE_OPTIONS = [
        NEUTRAL_SIZE_UI,
        "Solteiro",
        "Solteirão",
        "Casal",
        "Queen",
        "King"
    ];

    // Apenas tamanhos padronizados ficam neste mapa.
    // O tamanho Neutro usa medida manual e, por isso, não deve ser sobrescrito por este objeto.
    var SIZE_TO_MEASURE = {
        "Solteiro": "0,88 x 1,88",
        "Solteirão": "0,96 x 2,03",
        "Casal": "1,38 x 1,88",
        "Queen": "1,58 x 1,98",
        "King": "1,93 x 2,03"
    };

    var PRICE_GROUP_OPTIONS = [
        "a_vista",
        "oferta",
        "parcelado",
        "desconto"
    ];

    var PRICE_GROUP_GAP = 24;

    // Produto sem preço no card (estética da campanha): nenhum bloco de preço é inserido.
    var NO_PRICE_GROUP = "sem_preco";

    // Produto sem foto: quadro verde neon do tamanho da prancheta, na camada "fotos",
    // para o designer localizar e trocar pela foto certa.
    var MISSING_PHOTO_RGB = [57, 255, 20];

    // Tags de valor cujo ",00" fica num texto separado no CP base (ex.: "R$ {{V_parcela}}" + ",00").
    var CENTS_TAGS = ["V_DE", "V_parcela", "V_total"];

    // Marcadores de benefício do CP base: texto de exemplo de cada linha (pílula + ponto + texto).
    var BENEFIT_PLACEHOLDER = "Para que busca conforto";
    var MAX_BENEFITS = 3;

    // Quebra de linha forçada do Illustrator (Shift+Enter): mantém o mesmo parágrafo.
    // No JSON, "\n" dentro do texto vira esta quebra (frase e benefícios).
    var FORCED_BREAK = "\u0003";

    // Frase de destaque: texto "{{frase}}" no CP base (Story e Feed).
    // No JSON: "frase": "Mais *espaço e praticidade* para receber bem."
    //   *palavras* = destaque na versão Bold da mesma família da fonte do CP base.
    //   Sem "\n", a frase é quebrada em 2 linhas equilibradas quando passa deste tamanho.
    var FRASE_TAG = "frase";
    var FRASE_AUTO_BREAK_MIN = 26;

    // Cidade: símbolo "city" do CP base com o texto "Cidade" (ou "{{cidade}}").
    // O script edita o símbolo uma vez e todas as instâncias continuam como símbolo.
    var CITY_SYMBOL_NAMES = ["city", "cidade"];
    var CITY_TEXT_FIT = 0.9; // o texto ocupa no máximo 90% da pílula do símbolo

    // Áreas de diagramação: retângulos invisíveis (camada guides) no CP base, nomeados:
    //   "area_nome"  -> bloco nome/categoria/tamanho centralizado na área
    //   "area_preco" -> grupo de preço centralizado na área (na largura e na altura)
    //   "area_info"  -> linha nome + preço centralizada na área
    // Opções no nome: "| esquerda", "| direita", "| max 145%" (o nome pode crescer até 145%),
    // "| espaco 130" (distância nome-preço na area_info).
    //   "area_frase" -> frase de destaque alinhada (e reduzida se não couber) na área
    //   "area_selo"  -> lugar do selo do produto; "area_selo | beneficios" = lugar do selo
    //                   quando o produto tem benefícios (senão usa "area_selo")
    var SLOT_RE = /^\s*area_(nome|preco|info|frase|selo)\b(.*)$/i;
    var NAME_FIT_EXPONENT = 0.5; // nomes curtos crescem mais que nomes longos

    // Tamanho "Todos" no JSON: a linha de tamanho do CP base vira este texto.
    var SIZE_ALL_TEXT = "Todos os tamanhos";
    // Produto sem tamanho: itens com este nome no CP base (ex.: faixa dourada da linha de
    // tamanho) são apagados e o nome fica centralizado na altura da "area_nome".
    var SIZE_STRIP_NAME = "faixa_tamanho";
    // Destaque (*palavra*) nos benefícios: peso usado (cai para Bold se a família não tiver).
    var BENEFIT_BOLD_WEIGHT = "Black";

    // Textos dentro de símbolos (continuam símbolo): CTA e letras miúdas.
    // Produtos com textos diferentes ganham uma cópia do símbolo ("WhatsApp 2"...).
    //   anchor: lado que fica parado quando o texto muda de largura.
    var SYMBOL_TEXT_SPECS = [
        { field: "cta", names: ["whatsapp", "cta"], anchor: "left", pill: true },
        { field: "letras_miudas", names: ["letras miudas", "letras miúdas", "legal"], anchor: "center", pill: false }
    ];
    var LEGAL_MIN_SIZE = 9; // letras miúdas: menor corpo antes de avisar que não coube

    // Palavras removidas do nome do arquivo da foto quando o produto não tem "nome"
    // (ex.: "Genialle Casal.png" -> "Genialle").
    var NAME_VARIANT_WORDS = ["solteiro", "solteirao", "casal", "queen", "king", "azul", "box", "bau"];

    // Preenchimento neutro usado somente pelo botão de teste da interface.
    var TEST_PRODUCT_CONFIGS = [
        { categoria: "Conjunto Box", tamanho: "Solteiro", priceGroup: "a_vista", V_X: "10X" },
        { categoria: "Conjunto Box", tamanho: "Casal", priceGroup: "oferta", V_X: "11X" },
        { categoria: "Conjunto Box", tamanho: "Queen", priceGroup: "parcelado", V_X: "12X" },
        { categoria: "Conjunto Box", tamanho: "King", priceGroup: "desconto", V_X: "13X" }
    ];

    // Constantes calculadas uma única vez para reduzir trabalho repetido durante a geração.
    var PRODUCT_BLOCK_W = STORY_W + GAP_X + FEED_W;
    var PRODUCT_BLOCK_H = STORY_H;
    var MAX_PRODUCT_ROWS = Math.ceil(MAX_PRODUCTS_PER_FILE / PRODUCT_COLUMNS);
    var TOTAL_LAYOUT_HEIGHT = (MAX_PRODUCT_ROWS * PRODUCT_BLOCK_H) + ((MAX_PRODUCT_ROWS - 1) * GAP_Y);
    var LAYOUT_START_TOP = TOTAL_LAYOUT_HEIGHT / 2;

    // Ordem dos campos na interface de valores manuais segue o fluxo comercial:
    // 1. Valor original -> 2. Quantidade parcelas -> 3. Valor parcela ->
    // 4. Valor total -> 5. Desconto -> 6. Texto da oferta
    var MANUAL_TEXT_TAGS = [
        { key: "V_DE", label: "V_DE", helper: "Valor original" },
        { key: "V_X", label: "V_X", helper: "Qtd. parcelas" },
        { key: "V_parcela", label: "V_parcela", helper: "Valor da parcela" },
        { key: "V_total", label: "V_total", helper: "Soma das parcelas" },
        { key: "V_%", label: "V_%", helper: "% desconto" },
        { key: "V_Oferta_TXT", label: "V_Oferta_TXT", helper: "Oferta em texto" }
    ];

    var TEXT_TAGS = [
        "categoria",
        "tamanho",
        "medida",
        "nome",
        "V_total",
        "V_DE",
        "V_parcela",
        "V_X",
        "V_%",
        "V_Oferta_TXT"
    ];

    var PRICE_ANCHOR_TAGS = [
        "categoria",
        "tamanho",
        "medida",
        "nome"
    ];

    var REQUIRED_LAYER_LOOKUP = buildValueLookup(LAYER_NAMES);
    var PRICE_GROUP_LOOKUP = buildValueLookup(PRICE_GROUP_OPTIONS);

    // Caches de tags: evita recriar RegExp e normalizações para cada text frame.
    var TAG_PATTERN_CACHE = buildTagPatternCache(TEXT_TAGS);
    var TAG_NORMALIZED_CACHE = buildNormalizedTagCache(TEXT_TAGS);
    var ANCHOR_TAG_NORMALIZED_CACHE = buildNormalizedTagCache(PRICE_ANCHOR_TAGS);

    // =========================
    // INÍCIO
    // =========================
    if (app.documents.length > 0) {
        try {
            app.activeDocument.selection = null;
        } catch (e) {}
    }

    // Modo automático (Windows: rodar_lote.ps1 via COM | macOS: rodar_lote.sh via AppleScript):
    // defina antes de rodar
    //   $.global.LOTE_AUTO = { json: "C:/caminho/lote.json" };   (ou "/Users/.../lote.json" no Mac)
    // O script pula janelas e confirmações, gera a próxima campanha pendente
    // e devolve o resultado em $.global.LOTE_AUTO_RESULT (texto).
    var AUTO = null;
    var IS_MAC = (typeof $ !== "undefined" && /mac/i.test(String($.os)));
    try {
        if (typeof $ !== "undefined" && $.global.LOTE_AUTO && $.global.LOTE_AUTO.json) AUTO = $.global.LOTE_AUTO;
    } catch (autoErr) {}

    if (AUTO) {
        AUTO.messages = [];
        try {
            runBatchAuto();
        } catch (autoRunErr) {
            AUTO.messages.push("ERRO: " + autoRunErr.message + " (linha " + (autoRunErr.line || "?") + ")");
        }
        $.global.LOTE_AUTO_RESULT = AUTO.messages.join("\n\n");
        $.global.LOTE_AUTO = null;
        return;
    }

    var runMode = askRunMode();
    if (runMode === "manual") runManualMode();
    else if (runMode === "lote") runBatchMode();
    return;

    // Saídas do modo lote: janelas no uso normal, texto no modo automático.
    function notify(msg) {
        if (AUTO) AUTO.messages.push(String(msg));
        else alert(msg);
    }

    function ask(msg) {
        if (AUTO) {
            AUTO.messages.push(String(msg).replace(/\n*Gerar esta campanha agora\?$/, ""));
            return true;
        }
        return confirm(msg);
    }

    function report(title, lines) {
        if (AUTO) AUTO.messages.push(title + "\n" + lines.join("\n"));
        else showBatchReport(title, lines);
    }

    // =========================
    // ESCOLHA DO MODO
    // =========================
    function askRunMode() {
        var win = new Window("dialog", "Gerador de Campanhas v3");
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.margins = 16;
        win.spacing = 10;

        win.add("statictext", undefined, "Como deseja gerar as campanhas?");

        var result = null;
        var batchBtn = win.add("button", undefined, "Lote (arquivo JSON)");
        batchBtn.preferredSize = [320, 34];
        var manualBtn = win.add("button", undefined, "Manual (uma campanha, preenchimento na janela)");
        manualBtn.preferredSize = [320, 34];
        var cancelBtn = win.add("button", undefined, "Cancelar", { name: "cancel" });

        batchBtn.onClick = function () { result = "lote"; win.close(1); };
        manualBtn.onClick = function () { result = "manual"; win.close(1); };
        cancelBtn.onClick = function () { result = null; win.close(0); };

        win.center();
        win.show();
        return result;
    }

    // =========================
    // MODO MANUAL (fluxo da v2.1)
    // =========================
    function runManualMode() {
        var folder = Folder.selectDialog("Selecione a pasta onde estão as fotos dos produtos e o arquivo CP base");
        if (!folder) return;

        var baseFile = findBaseFile(folder);
        if (!baseFile) {
            alert('Não encontrei o arquivo "CP base" na pasta selecionada.\n\nO arquivo deve se chamar, por exemplo: CP base.ai');
            return;
        }

        var imageFiles = getImageFiles(folder);
        if (imageFiles.length === 0) {
            alert("Não encontrei imagens de produto na pasta selecionada.");
            return;
        }

        var selectedItems = showCampaignDialog(imageFiles);
        if (!selectedItems) return;

        if (selectedItems.length === 0) {
            alert("Nenhum produto selecionado.");
            return;
        }

        var maxProductsInOneDocument = getMaxProductsInOneDocument();
        if (selectedItems.length > maxProductsInOneDocument) {
            alert(
                "Você selecionou " + selectedItems.length + " produtos.\n\n" +
                "Para manter as pranchetas dentro de uma área segura do Illustrator, esta versão gera até " +
                maxProductsInOneDocument + " produtos por arquivo.\n\n" +
                "Organização usada: 2 colunas de produtos x até 4 linhas.\n" +
                "Cada produto terá uma prancheta Story e uma Feed lado a lado."
            );
            return;
        }

        var ctx = null;
        var targetDoc = null;
        var uiState = suppressIllustratorAlerts();

        try {
            ctx = openBaseContext(baseFile);
            targetDoc = generateCampaignDocument(ctx, selectedItems);

            targetDoc.activate();
            targetDoc.artboards.setActiveArtboardIndex(0);

            closeBaseContext(ctx);
            restoreIllustratorAlerts(uiState);

            alert("Campanha gerada com sucesso!\n\nO novo arquivo permanecerá aberto para edição.");
        } catch (err) {
            closeBaseContext(ctx);
            restoreIllustratorAlerts(uiState);
            alert("Ocorreu um erro ao gerar a campanha:\n\n" + err.message + "\nLinha: " + (err.line || "não informada"));
        }
    }

    // =========================
    // MOTOR COMPARTILHADO (manual e lote)
    // =========================
    function suppressIllustratorAlerts() {
        var state = { level: null };
        try {
            state.level = app.userInteractionLevel;
            app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
        } catch (e) {}
        return state;
    }

    function restoreIllustratorAlerts(state) {
        try {
            if (state && state.level !== null) app.userInteractionLevel = state.level;
        } catch (e) {}
    }

    // Abre o CP base uma única vez e monta todos os caches.
    // O documento base fica aberto enquanto houver campanhas a gerar.
    function openBaseContext(baseFile) {
        var baseDoc = app.open(baseFile);

        try {
            unlockLayersAndItems(baseDoc);

            var baseLayerMap = getLayerMap(baseDoc, LAYER_NAMES);
            var sourceStoryRect = getSourceArtboardRect(baseDoc, STORY_W, STORY_H, 0);
            var sourceFeedRect = getSourceArtboardRect(baseDoc, FEED_W, FEED_H, 1);

            // Otimização principal:
            // o layout base, os grupos de preço e os text frames são mapeados uma única vez.
            var sourceLayoutCache = buildSourceLayoutCache(baseLayerMap, sourceStoryRect, sourceFeedRect);
            var priceGroupCache = buildPriceGroupCache(baseDoc, sourceStoryRect, sourceFeedRect);

            return {
                baseDoc: baseDoc,
                sourceStoryRect: sourceStoryRect,
                sourceFeedRect: sourceFeedRect,
                sourceLayoutCache: sourceLayoutCache,
                priceGroupCache: priceGroupCache,
                priceGroupTags: detectPriceGroupTags(priceGroupCache),
                feedPriceScale: detectFeedPriceScale(sourceLayoutCache)
            };
        } catch (e) {
            try { baseDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (closeErr) {}
            throw e;
        }
    }

    function closeBaseContext(ctx) {
        if (!ctx || !ctx.baseDoc) return;
        try { ctx.baseDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (e) {}
        ctx.baseDoc = null;
    }

    // Lê, no CP base, quais tags existem dentro de cada grupo de preço.
    // Retorna { a_vista: ["V_DE", "V_total"], ... }; grupos ausentes ficam como null.
    function detectPriceGroupTags(priceGroupCache) {
        var result = {};

        for (var i = 0; i < PRICE_GROUP_OPTIONS.length; i++) {
            var groupName = PRICE_GROUP_OPTIONS[i];
            var group = priceGroupCache.fallback[groupName];
            if (!group) {
                result[groupName] = null;
                continue;
            }

            var frames = [];
            collectTextFramesRecursive(group, frames);
            var found = [];

            for (var t = 0; t < TEXT_TAGS.length; t++) {
                var tag = TEXT_TAGS[t];
                for (var f = 0; f < frames.length; f++) {
                    if (frameHasTag(frames[f], tag)) {
                        found.push(tag);
                        break;
                    }
                }
            }

            result[groupName] = found;
        }

        return result;
    }

    function frameHasTag(tf, tag) {
        var frameName = "";
        var content = "";
        try { frameName = tf.name || ""; } catch (e) {}
        try { content = tf.contents || ""; } catch (e2) {}

        if (normalizeTagValue(frameName) === TAG_NORMALIZED_CACHE[tag]) return true;
        if (normalizeTagValue(content) === TAG_NORMALIZED_CACHE[tag]) return true;
        return hasTagToken(content, tag);
    }

    // Gera um documento novo com Story + Feed para cada item e retorna o documento.
    // opts (opcional, modo lote): { cidade: "Campo Grande", warnings: [] }
    function generateCampaignDocument(ctx, selectedItems, opts) {
        opts = opts || {};
        if (!opts.warnings) opts.warnings = [];
        prepareSelectedItems(selectedItems);

        // Biblioteca de selos: aberta só se algum produto pede selo.
        opts.sealLib = null;
        var wantsSeal = false;
        for (var w = 0; w < selectedItems.length; w++) if (selectedItems[w].selo) wantsSeal = true;
        if (wantsSeal && opts.selosFile) {
            try { opts.sealLib = openSealLibrary(opts.selosFile, opts.selosSecao); }
            catch (libErr) { opts.warnings.push((opts.label ? opts.label + ": " : "") + "não consegui abrir a biblioteca de selos: " + libErr.message); }
        }

        var targetDoc = createTargetDocument(selectedItems);
        try { targetDoc.activate(); } catch (eAct) {}
        var symbolEntries = {};

        try {
            var targetLayerMap = createTargetLayers(targetDoc, LAYER_NAMES);

            for (var i = 0; i < selectedItems.length; i++) {
                var selectedItem = selectedItems[i];
                var productFile = selectedItem.fileRef;
                var productName = selectedItem.productName;

                var productTagData = {
                    categoria: selectedItem.categoria,
                    tamanho: selectedItem.tamanho,
                    medida: selectedItem.medida,
                    nome: productName
                };
                addManualTagValuesToObject(productTagData, selectedItem.manualValues);

                var storyRect = selectedItem.storyRect;
                var feedRect = selectedItem.feedRect;

                var storyDupMap = duplicateLayoutFromCache(ctx.sourceLayoutCache.story, targetLayerMap, ctx.sourceStoryRect, storyRect);
                fillArtboardText(ctx, ctx.priceGroupCache.story, targetLayerMap, storyDupMap, selectedItem, productTagData, "story", opts);

                var feedDupMap = duplicateLayoutFromCache(ctx.sourceLayoutCache.feed, targetLayerMap, ctx.sourceFeedRect, feedRect);
                fillArtboardText(ctx, ctx.priceGroupCache.feed, targetLayerMap, feedDupMap, selectedItem, productTagData, "feed", opts);

                for (var sp = 0; sp < SYMBOL_TEXT_SPECS.length; sp++) {
                    var fld = SYMBOL_TEXT_SPECS[sp].field;
                    var val = selectedItem[fld] !== null && selectedItem[fld] !== undefined ? selectedItem[fld] : (opts[fld] || "");
                    if (!trimText(val)) continue;
                    if (!symbolEntries[fld]) symbolEntries[fld] = [];
                    symbolEntries[fld].push({ rect: storyRect, text: val });
                    symbolEntries[fld].push({ rect: feedRect, text: val });
                }

                var framing = selectedItem.enquadramento || {};
                if (productFile) {
                    placeImageWithClipping(targetDoc, targetLayerMap["fotos"], productFile, storyRect, productName + " - Story", framing.story);
                    placeImageWithClipping(targetDoc, targetLayerMap["fotos"], productFile, feedRect, productName + " - Feed", framing.feed);
                } else {
                    placeMissingPhotoBox(targetDoc, targetLayerMap["fotos"], storyRect, productName + " - Story");
                    placeMissingPhotoBox(targetDoc, targetLayerMap["fotos"], feedRect, productName + " - Feed");
                }
            }

            if (opts.cidade) {
                var cityWarning = applyCitySymbol(targetDoc, opts.cidade);
                // Erro interno do Illustrator (MRAP) às vezes aparece no breakLink: tenta de novo.
                if (cityWarning && /não foi possível/.test(cityWarning)) {
                    try { app.redraw(); } catch (eRd) {}
                    cityWarning = applyCitySymbol(targetDoc, opts.cidade);
                }
                if (cityWarning) opts.warnings.push((opts.label ? opts.label + ": " : "") + cityWarning);
            }
            for (var ss = 0; ss < SYMBOL_TEXT_SPECS.length; ss++) {
                var spec = SYMBOL_TEXT_SPECS[ss];
                if (!symbolEntries[spec.field]) continue;
                var symWarn = applySymbolTextVariants(targetDoc, spec, symbolEntries[spec.field]);
                if (symWarn && /não foi possível/.test(symWarn)) {
                    try { app.redraw(); } catch (eRd2) {}
                    symWarn = applySymbolTextVariants(targetDoc, spec, symbolEntries[spec.field]);
                }
                if (symWarn) opts.warnings.push((opts.label ? opts.label + ": " : "") + symWarn);
            }
        } catch (genErr) {
            genErr.targetDoc = targetDoc;
            closeSealLibrary(opts.sealLib);
            throw genErr;
        }
        closeSealLibrary(opts.sealLib);
        opts.sealLib = null;
        try { targetDoc.activate(); } catch (eAct2) {}

        return targetDoc;
    }

    // =========================
    // MODO LOTE (JSON)
    // =========================
    function runBatchMode() {
        var jsonFile = AUTO ? new File(AUTO.json) : File.openDialog("Selecione o arquivo JSON do lote", IS_MAC ? function (f) { return (f instanceof Folder) || /\.json$/i.test(safeDecode(f.name)); } : "JSON:*.json,Todos:*.*", false);
        if (!jsonFile) return;
        if (!jsonFile.exists) { notify("JSON não encontrado: " + jsonFile.fsName); return; }

        var data;
        try {
            data = parseJsonText(readTextFile(jsonFile));
        } catch (parseErr) {
            notify("Não consegui ler o JSON do lote:\n\n" + parseErr.message);
            return;
        }

        var plan = buildBatchPlan(data, jsonFile.parent);
        if (plan.errors.length > 0) {
            report("Lote bloqueado - corrija o JSON", plan.errors);
            return;
        }

        // Uma campanha por execução: cada cliente (ou parte, se passar de 8
        // produtos) vira um "trabalho". Trabalho com .ai já salvo = concluído.
        var jobs = buildBatchJobs(plan);
        var duplicateNames = findDuplicateJobNames(jobs);
        if (duplicateNames.length > 0) {
            report("Lote bloqueado - nomes de arquivo repetidos", [
                "Dois ou mais clientes gerariam o mesmo arquivo:",
                ""
            ].concat(duplicateNames).concat([
                "",
                "Use o campo \"arquivo\" no cliente para diferenciar os nomes."
            ]));
            return;
        }

        var jobIndex = -1;
        var doneCount = 0;
        for (var j = 0; j < jobs.length; j++) {
            if (jobs[j].outFile.exists) doneCount++;
            else if (jobIndex < 0) jobIndex = j;
        }

        if (jobIndex < 0) {
            notify(
                (jobs.length === 1
                    ? "A campanha deste lote já foi gerada.\n\n"
                    : "Todas as " + jobs.length + " campanhas deste lote já foram geradas.\n\n") +
                "Para refazer uma campanha, apague o .ai dela e rode o script de novo."
            );
            return;
        }

        var job = jobs[jobIndex];

        if (job.client.errors.length > 0) {
            report("Campanha de " + job.label + " bloqueada - corrija o JSON",
                job.client.errors.concat(["", "Nada foi gerado. Corrija o JSON e rode o script de novo."]));
            return;
        }

        var nextJob = null;
        for (var n = jobIndex + 1; n < jobs.length; n++) {
            if (!jobs[n].outFile.exists) { nextJob = jobs[n]; break; }
        }

        var otherProblems = [];
        for (var o = 0; o < plan.clients.length; o++) {
            if (plan.clients[o] !== job.client && plan.clients[o].errors.length > 0) {
                otherProblems.push("- " + (plan.clients[o].cliente || "Cliente " + (o + 1)) + ": " + plan.clients[o].errors.length + " problema(s) no JSON");
            }
        }

        var confirmMsg =
            "CAMPANHA " + (jobIndex + 1) + " DE " + jobs.length + "\n\n" +
            "CLIENTE: " + job.label + "\n" +
            "Produtos: " + job.items.length + "\n" +
            "Salvar como: " + safeDecode(job.outFile.name) + "\n\n" +
            "Campanha: " + job.client.campanha + "\n" +
            "CP base: " + safeDecode(job.client.baseFile.name) + "\n" +
            "Pasta de saída: " + job.client.outFolder.fsName + "\n" +
            "Já geradas: " + doneCount + " de " + jobs.length +
            (plan.warnings.length ? "\n\nAvisos:\n" + plan.warnings.join("\n") : "") +
            (otherProblems.length ? "\n\nOutros clientes com problemas (resolva antes da vez deles):\n" + otherProblems.join("\n") : "") +
            "\n\nGerar esta campanha agora?";
        if (!ask(confirmMsg)) return;

        var uiState = suppressIllustratorAlerts();
        var ctx = null;
        var targetDoc = null;
        var logFile = plan.logFile;

        try {
            ctx = openBaseContext(job.client.baseFile);
        } catch (baseErr) {
            restoreIllustratorAlerts(uiState);
            notify("Erro ao abrir o CP base:\n\n" + baseErr.message);
            return;
        }

        // Segunda validação: com o CP base aberto, confere se cada produto
        // preencheu todas as tags que existem no grupo de preço escolhido.
        var tagErrors = validatePriceTagsAgainstBase(job.items, ctx.priceGroupTags, plan.warnings);
        if (tagErrors.length > 0) {
            var groupInfo = describePriceGroupTags(ctx.priceGroupTags);
            closeBaseContext(ctx);
            restoreIllustratorAlerts(uiState);
            report("Campanha de " + job.label + " bloqueada - faltam valores exigidos pelo CP base", tagErrors.concat(["", groupInfo]));
            return;
        }

        var saved = false;
        try {
            ensureOutputFolder(job.client.outFolder);
            targetDoc = generateCampaignDocument(ctx, job.items, { cidade: job.client.cidade, cta: job.client.cta, letras_miudas: job.client.letras_miudas, selosFile: job.client.selosFile, selosSecao: job.client.selosSecao, warnings: plan.warnings, label: job.label });
            var embedFailed = plan.embed ? embedAllPlacedItems(targetDoc) : [];
            saveDocumentAsAi(targetDoc, job.outFile);
            saved = true;

            closeBaseContext(ctx);
            restoreIllustratorAlerts(uiState);

            targetDoc.activate();
            targetDoc.artboards.setActiveArtboardIndex(0);

            appendTextFile(logFile, "[" + formatDateTime(new Date()) + "] [OK]   " + job.label + " -> " + safeDecode(job.outFile.name) +
                " (" + job.items.length + " produtos)" + (job.client.clickup_id ? " [ClickUp " + job.client.clickup_id + "]" : ""));

            notify(
                "CAMPANHA " + (jobIndex + 1) + " DE " + jobs.length + " GERADA\n\n" +
                "CLIENTE: " + job.label + "\n" +
                "Salva como: " + safeDecode(job.outFile.name) + "\n\n" +
                (embedFailed.length ? "ATENÇÃO - não incorporados:\n" + embedFailed.join("\n") + "\n\n" : "") +
                "Revise o arquivo, salve (Ctrl+S) e feche.\n\n" +
                (nextJob
                    ? "Depois rode o script de novo para gerar a próxima:\n" + nextJob.label
                    : "Esta era a última campanha pendente do lote.")
            );
        } catch (genErr) {
            var failedDoc = targetDoc || genErr.targetDoc;
            if (failedDoc) {
                try { failedDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (closeErr) {}
            }
            // Se o arquivo chegou a ser criado sem terminar, remove para a
            // campanha continuar pendente na próxima execução.
            try { if (!saved && job.outFile.exists) job.outFile.remove(); } catch (removeErr) {}

            closeBaseContext(ctx);
            restoreIllustratorAlerts(uiState);

            appendTextFile(logFile, "[" + formatDateTime(new Date()) + "] [ERRO] " + job.label + ": " + genErr.message + " (linha " + (genErr.line || "?") + ")");

            notify(
                "Erro ao gerar a campanha de " + job.label + ":\n\n" +
                genErr.message + "\nLinha: " + (genErr.line || "não informada") + "\n\n" +
                (saved
                    ? "O arquivo já tinha sido salvo; confira-o antes de seguir."
                    : "Nada foi salvo para este cliente. Rode o script de novo para tentar outra vez.")
            );
        }
    }

    // =========================
    // MODO AUTOMÁTICO (PowerShell, sem janelas)
    // Gera em sequência todas as campanhas pendentes, uma de cada vez:
    // gera -> salva -> fecha o arquivo -> próxima. O CP base fica aberto
    // durante o lote e é fechado no fim. Devolve um resumo em texto.
    // =========================
    function runBatchAuto() {
        var out = AUTO.messages;
        var jsonFile = new File(AUTO.json);

        if (!jsonFile.exists) {
            out.push("STATUS: BLOQUEADO\nJSON não encontrado: " + jsonFile.fsName);
            return;
        }

        var data;
        try {
            data = parseJsonText(readTextFile(jsonFile));
        } catch (parseErr) {
            out.push("STATUS: BLOQUEADO\nJSON inválido: " + parseErr.message);
            return;
        }

        var plan = buildBatchPlan(data, jsonFile.parent);
        if (plan.errors.length > 0) {
            out.push("STATUS: BLOQUEADO (nenhuma campanha gerada)\n\nPENDÊNCIAS DO LOTE:\n- " + plan.errors.join("\n- "));
            return;
        }

        var jobs = buildBatchJobs(plan);
        var duplicateNames = findDuplicateJobNames(jobs);
        if (duplicateNames.length > 0) {
            out.push("STATUS: BLOQUEADO (nenhuma campanha gerada)\n\nArquivos repetidos (use \"arquivo\" no cliente):\n" + duplicateNames.join("\n"));
            return;
        }

        var generated = [];
        var existing = [];
        var pending = [];
        var failed = [];
        var toRun = [];

        for (var j = 0; j < jobs.length; j++) {
            var jb = jobs[j];
            if (jb.outFile.exists) existing.push(jb);
            else if (jb.client.errors.length > 0) pending.push({ job: jb, errors: jb.client.errors });
            else toRun.push(jb);
        }

        // Agrupa por CP base: cada arquivo-base é aberto uma vez só.
        var baseGroups = [];
        var baseIndex = {};
        for (var t = 0; t < toRun.length; t++) {
            var bKey = normalizeKey(toRun[t].client.baseFile.fsName);
            if (!baseIndex.hasOwnProperty(bKey)) {
                baseIndex[bKey] = baseGroups.length;
                baseGroups.push({ baseFile: toRun[t].client.baseFile, jobs: [] });
            }
            baseGroups[baseIndex[bKey]].jobs.push(toRun[t]);
        }

        if (toRun.length > 0) {
            var uiState = suppressIllustratorAlerts();

          for (var bg = 0; bg < baseGroups.length; bg++) {
            var groupJobs = baseGroups[bg].jobs;
            var ctx = null;

            try {
                ctx = openBaseContext(baseGroups[bg].baseFile);
            } catch (baseErr) {
                for (var b = 0; b < groupJobs.length; b++) failed.push({ job: groupJobs[b], message: "Erro ao abrir o CP base " + safeDecode(baseGroups[bg].baseFile.name) + ": " + baseErr.message });
                continue;
            }

            for (var r = 0; r < groupJobs.length; r++) {
                var job = groupJobs[r];

                var tagErrors = validatePriceTagsAgainstBase(job.items, ctx.priceGroupTags, plan.warnings);
                if (tagErrors.length > 0) {
                    pending.push({ job: job, errors: tagErrors.concat([describePriceGroupTags(ctx.priceGroupTags)]) });
                    continue;
                }

                var targetDoc = null;
                var saved = false;
                try {
                    ensureOutputFolder(job.client.outFolder);
                    targetDoc = generateCampaignDocument(ctx, job.items, { cidade: job.client.cidade, cta: job.client.cta, letras_miudas: job.client.letras_miudas, selosFile: job.client.selosFile, selosSecao: job.client.selosSecao, warnings: plan.warnings, label: job.label });
                    job.embedFailed = plan.embed ? embedAllPlacedItems(targetDoc) : [];
                    saveDocumentAsAi(targetDoc, job.outFile);
                    saved = true;
                    targetDoc.close(SaveOptions.DONOTSAVECHANGES);
                    targetDoc = null;

                    generated.push(job);
                    appendTextFile(plan.logFile, "[" + formatDateTime(new Date()) + "] [OK]   " + job.label + " -> " + job.outFile.fsName +
                        " (" + job.items.length + " produtos)" + (job.client.clickup_id ? " [ClickUp " + job.client.clickup_id + "]" : ""));
                } catch (genErr) {
                    var failedDoc = targetDoc || genErr.targetDoc;
                    if (failedDoc) {
                        try { failedDoc.close(SaveOptions.DONOTSAVECHANGES); } catch (closeErr) {}
                    }
                    if (!saved) {
                        try { if (job.outFile.exists) job.outFile.remove(); } catch (removeErr) {}
                    }
                    var msg = genErr.message + " (linha " + (genErr.line || "?") + ")";
                    if (saved) {
                        // Salvou, mas falhou ao fechar: conta como gerada.
                        generated.push(job);
                    } else {
                        failed.push({ job: job, message: msg });
                    }
                    appendTextFile(plan.logFile, "[" + formatDateTime(new Date()) + "] [ERRO] " + job.label + ": " + msg);
                }
            }

            closeBaseContext(ctx);
          }
            restoreIllustratorAlerts(uiState);
        }

        // Resumo
        var status;
        if (pending.length === 0 && failed.length === 0) {
            status = generated.length > 0 ? "OK - todas as campanhas pendentes foram geradas" : "NADA A FAZER - todas já existiam";
        } else if (generated.length > 0) {
            status = "PARCIAL - " + generated.length + " gerada(s), " + (pending.length + failed.length) + " com pendência/erro";
        } else {
            status = "PENDÊNCIAS - nenhuma campanha nova gerada";
        }

        var lines = [];
        lines.push("STATUS: " + status);
        var seenCamp = {};
        for (var sc = 0; sc < plan.clients.length; sc++) {
            var cl = plan.clients[sc];
            if (!cl.campanha || !cl.baseFile) continue;
            var campLine = "Campanha: " + cl.campanha + " | CP base: " + safeDecode(cl.baseFile.name) +
                (cl.fotosFolder ? " | Fotos: " + safeDecode(cl.fotosFolder.name) : "");
            if (!seenCamp[campLine]) { seenCamp[campLine] = true; lines.push(campLine); }
        }

        if (generated.length) {
            lines.push("");
            lines.push("GERADAS (" + generated.length + "):");
            for (var g = 0; g < generated.length; g++) {
                lines.push("- " + generated[g].label + " [" + generated[g].client.campanha + "] (" + generated[g].items.length + " produtos) -> " + generated[g].outFile.fsName);
                var ef = generated[g].embedFailed || [];
                for (var q = 0; q < ef.length; q++) lines.push("    ATENÇÃO - não incorporado: " + ef[q]);
            }
            lines.push("Imagens: " + (plan.embed ? "incorporadas" : "vinculadas (incorporar_imagens = false)"));
        }
        if (pending.length) {
            lines.push("");
            lines.push("PENDÊNCIAS - NÃO GERADAS (" + pending.length + "):");
            for (var p = 0; p < pending.length; p++) {
                lines.push("- " + pending[p].job.label + ":");
                for (var e = 0; e < pending[p].errors.length; e++) lines.push("    " + pending[p].errors[e].replace(/\n/g, "\n    "));
            }
        }
        if (failed.length) {
            lines.push("");
            lines.push("ERROS NA GERAÇÃO (" + failed.length + "):");
            for (var f = 0; f < failed.length; f++) lines.push("- " + failed[f].job.label + ": " + failed[f].message);
        }
        if (existing.length) {
            lines.push("");
            lines.push("JÁ EXISTIAM - NÃO REFEITAS (" + existing.length + "):");
            for (var x = 0; x < existing.length; x++) lines.push("- " + existing[x].label + " -> " + existing[x].outFile.fsName);
        }
        if (plan.warnings.length) {
            lines.push("");
            lines.push("AVISOS:");
            for (var w = 0; w < plan.warnings.length; w++) lines.push("- " + plan.warnings[w]);
        }

        out.push(lines.join("\n"));
    }

    // Transforma os clientes em trabalhos (um arquivo .ai cada).
    // O nome do arquivo sempre começa pelo cliente.
    function buildBatchJobs(plan) {
        var jobs = [];
        for (var c = 0; c < plan.clients.length; c++) {
            var client = plan.clients[c];
            var chunks = client.items.length > 0 ? splitIntoChunks(client.items, MAX_PRODUCTS_PER_FILE) : [[]];
            var clientName = client.cliente || ("Cliente " + (c + 1));

            for (var k = 0; k < chunks.length; k++) {
                var baseName = client.arquivo || (clientName + " - " + client.campanha);
                var label = clientName;
                if (chunks.length > 1) {
                    baseName += " - parte " + (k + 1);
                    label += " (parte " + (k + 1) + " de " + chunks.length + ")";
                }

                jobs.push({
                    client: client,
                    items: chunks[k],
                    label: label,
                    outFile: new File(client.outFolder.fsName + "/" + sanitizeFileName(baseName) + ".ai")
                });
            }
        }
        return jobs;
    }

    function findDuplicateJobNames(jobs) {
        var seen = {};
        var dups = [];
        for (var i = 0; i < jobs.length; i++) {
            var key = normalizeKey(jobs[i].outFile.fsName);
            if (seen[key]) dups.push("- " + jobs[i].outFile.fsName);
            seen[key] = true;
        }
        return dups;
    }

    // Cria a pasta de saída se faltar só ela (a pasta-mãe já foi validada).
    function ensureOutputFolder(folder) {
        if (folder.exists) return;
        if (!folder.create()) throw new Error("Não consegui criar a pasta de saída: " + folder.fsName);
    }

    // Valida e normaliza o JSON. Não abre nada no Illustrator.
    function buildBatchPlan(data, jsonFolder) {
        var plan = { errors: [], warnings: [], clients: [], campanha: "", fotosFolder: null, baseFile: null, outFolder: null };

        if (!data || typeof data !== "object" || data instanceof Array) {
            plan.errors.push("O JSON precisa ser um objeto { ... } com a lista \"clientes\".");
            return plan;
        }

        // Padrões do lote. Cada cliente pode ter "campanha", "arquivo_base" e
        // "pasta_fotos" próprios (lote com campanhas diferentes).
        plan.campanha = trimText(data.campanha);
        checkPending("campanha", data.campanha, plan.errors);
        checkPending("pasta_fotos", data.pasta_fotos, plan.errors);
        checkPending("arquivo_base", data.arquivo_base, plan.errors);
        if (plan.errors.length > 0) return plan;

        // Pasta das fotos do lote (padrão: pasta do JSON)
        var fotosPath = trimText(data.pasta_fotos);
        plan.fotosFolder = fotosPath ? resolveFolder(fotosPath, jsonFolder) : jsonFolder;
        if (fotosPath && !plan.fotosFolder.exists) {
            plan.errors.push("pasta_fotos não encontrada: " + fotosPath);
            return plan;
        }

        // CP base do lote (opcional; sem ele, procura "CP base*" na pasta de fotos do cliente)
        var basePath = trimText(data.arquivo_base);
        if (basePath) {
            plan.baseFile = resolveFile(basePath, jsonFolder);
            if (!plan.baseFile.exists) {
                plan.errors.push("arquivo_base não encontrado: " + basePath);
                return plan;
            }
        }

        // Saída
        // Padrão do lote; cada cliente pode ter a própria "pasta_saida" (ex.: pasta do Drive).
        var outPath = trimText(data.pasta_saida);
        plan.outFolder = outPath ? resolveFolder(outPath, jsonFolder) : new Folder(jsonFolder.fsName + "/Campanhas geradas");
        plan.logFile = new File(jsonFolder.fsName + "/relatorio_lote.txt");

        // Por padrão o lote incorpora as imagens ao salvar ("incorporar_imagens": false desliga).
        plan.embed = data.incorporar_imagens !== false;

        // Fotos já listadas, por pasta (vários clientes costumam usar a mesma).
        var imageCache = {};
        function imagesOf(folder) {
            var key = folder.fsName;
            if (!imageCache.hasOwnProperty(key)) imageCache[key] = getImageFiles(folder);
            return imageCache[key];
        }

        if (!(data.clientes instanceof Array) || data.clientes.length === 0) {
            plan.errors.push("A lista \"clientes\" está vazia ou ausente.");
            return plan;
        }

        for (var c = 0; c < data.clientes.length; c++) {
            var rawClient = data.clientes[c] || {};
            var clientName = trimText(rawClient.cliente);
            var clientLabel = "Cliente " + (c + 1) + (clientName ? " (" + clientName + ")" : "");

            // Erros de um cliente só bloqueiam a campanha dele (uma por execução).
            var client = {
                cliente: clientName,
                clickup_id: trimText(rawClient.clickup_id),
                arquivo: trimText(rawClient.arquivo),
                campanha: trimText(rawClient.campanha) || plan.campanha,
                cidade: trimText(rawClient.cidade),
                cta: rawClient.cta === undefined || rawClient.cta === null ? "" : String(rawClient.cta),
                letras_miudas: rawClient.letras_miudas === undefined || rawClient.letras_miudas === null ? "" : String(rawClient.letras_miudas),
                selosFile: null,
                selosSecao: trimText(rawClient.selos_secao),
                baseFile: null,
                fotosFolder: null,
                outFolder: plan.outFolder,
                items: [],
                errors: []
            };

            // O nome do cliente é obrigatório: ele vai no nome do arquivo salvo.
            if (!clientName) plan.errors.push(clientLabel + ": campo \"cliente\" vazio (ele é usado no nome do arquivo).");
            checkPending(clientLabel + " > cliente", rawClient.cliente, plan.errors);
            checkPending(clientLabel + " > arquivo", rawClient.arquivo, client.errors);

            // Campanha, fotos e CP base do cliente (ou os padrões do lote).
            // Problema aqui bloqueia só este cliente.
            var configBefore = client.errors.length;
            checkPending(clientLabel + " > campanha", rawClient.campanha, client.errors);
            checkPending(clientLabel + " > pasta_fotos", rawClient.pasta_fotos, client.errors);
            checkPending(clientLabel + " > arquivo_base", rawClient.arquivo_base, client.errors);
            if (!client.campanha && client.errors.length === configBefore) {
                client.errors.push(clientLabel + ": campanha vazia (informe \"campanha\" no lote ou no cliente).");
            }
            var imageFiles = [];
            if (client.errors.length === configBefore) {
                var clientFotos = trimText(rawClient.pasta_fotos);
                client.fotosFolder = clientFotos ? resolveFolder(clientFotos, jsonFolder) : plan.fotosFolder;
                if (!client.fotosFolder.exists) {
                    client.errors.push(clientLabel + ": pasta_fotos não encontrada: " + client.fotosFolder.fsName);
                } else {
                    imageFiles = imagesOf(client.fotosFolder);
                    if (imageFiles.length === 0) client.errors.push(clientLabel + ": nenhuma imagem em " + client.fotosFolder.fsName);
                }

                var clientBase = trimText(rawClient.arquivo_base);
                if (clientBase) {
                    client.baseFile = resolveFile(clientBase, jsonFolder);
                    if (!client.baseFile.exists) client.errors.push(clientLabel + ": arquivo_base não encontrado: " + client.baseFile.fsName);
                } else if (plan.baseFile) {
                    client.baseFile = plan.baseFile;
                } else if (client.fotosFolder.exists) {
                    client.baseFile = findBaseFile(client.fotosFolder);
                    if (!client.baseFile) client.errors.push(clientLabel + ': nenhum "CP base" em ' + client.fotosFolder.fsName + ' (informe "arquivo_base").');
                }
            }

            // Biblioteca de selos (opcional): arquivo .ai com os selos da campanha.
            var selosPath = trimText(rawClient.selos_arquivo);
            if (selosPath && client.errors.length === configBefore) {
                client.selosFile = resolveFile(selosPath, jsonFolder);
                if (!client.selosFile.exists) {
                    plan.warnings.push(clientLabel + ": biblioteca de selos não encontrada (" + client.selosFile.fsName + "); selos ficam para a revisão.");
                    client.selosFile = null;
                }
            }

            // Pasta de saída do cliente: pode faltar só o último nível (a pasta da
            // campanha), que é criado na geração. A pasta-mãe tem de existir.
            var clientOut = trimText(rawClient.pasta_saida);
            if (clientOut) {
                var pendingBefore = client.errors.length;
                checkPending(clientLabel + " > pasta_saida", clientOut, client.errors);
                if (client.errors.length === pendingBefore) {
                    client.outFolder = resolveFolder(clientOut, jsonFolder);
                    if (!client.outFolder.exists && !(client.outFolder.parent && client.outFolder.parent.exists)) {
                        client.errors.push(clientLabel + ": pasta_saida inválida - nem a pasta nem a pasta-mãe existem: " + client.outFolder.fsName);
                    }
                }
            }

            if (client.errors.length > configBefore) {
                plan.clients.push(client);
                continue;
            }

            if (!(rawClient.produtos instanceof Array) || rawClient.produtos.length === 0) {
                client.errors.push(clientLabel + ": lista \"produtos\" vazia.");
                plan.clients.push(client);
                continue;
            }

            var clientCtx = { errors: client.errors, warnings: plan.warnings };
            for (var p = 0; p < rawClient.produtos.length; p++) {
                var item = buildBatchItem(rawClient.produtos[p] || {}, clientLabel + " > produto " + (p + 1), imageFiles, clientCtx);
                if (item) client.items.push(item);
            }

            plan.clients.push(client);
        }

        return plan;
    }

    function buildBatchItem(raw, label, imageFiles, plan) {
        var errors = plan.errors;
        var startErrors = errors.length;

        // Pendências deixadas pela IA bloqueiam o lote.
        // Produto com pendência: lista só as pendências (sem erros derivados).
        for (var key in raw) {
            if (raw.hasOwnProperty(key)) checkPending(label + " > " + key, raw[key], errors);
        }
        if (errors.length > startErrors) return null;

        // Foto
        // Sem foto (campo vazio ou arquivo não encontrado): gera com o quadro verde neon.
        var fotoName = trimText(raw.foto);
        var fileRef = null;
        if (!fotoName) {
            plan.warnings.push(label + ": SEM FOTO - quadro verde neon no lugar da foto.");
        } else {
            var match = findImageByName(imageFiles, fotoName);
            if (match.ambiguous) errors.push(label + ": " + match.error);
            else if (match.error) plan.warnings.push(label + ": SEM FOTO - " + match.error + " Quadro verde neon no lugar da foto.");
            else fileRef = match.file;
        }
        if (fotoName) label += " [" + fotoName + "]";

        // Categoria
        var categoria = matchOption(raw.categoria, CATEGORY_OPTIONS);
        if (!categoria) errors.push(label + ": categoria inválida \"" + trimText(raw.categoria) + "\". Use: " + CATEGORY_OPTIONS.join(", "));

        // Tamanho / medida
        // Sem tamanho no card = sem bloco de tamanho na arte (a foto pode ser a Casal,
        // mas a arte não pode afirmar um tamanho que o card não informa).
        var tamanhoRaw = trimText(raw.tamanho);
        var todosTamanhos = false;
        if (/^todos( os tamanhos)?$/.test(normalizeKey(tamanhoRaw))) {
            todosTamanhos = true;
            tamanhoRaw = "";
        }
        var tamanho = null;
        var medida = "";
        var semTamanho = false;
        if (tamanhoRaw === "") {
            semTamanho = true;
            tamanho = "";
            if (trimText(raw.medida)) {
                plan.warnings.push(label + ": medida \"" + trimText(raw.medida) + "\" ignorada; produto sem tamanho (para sofá com medida use tamanho \"Neutro\").");
            }
        } else if (tamanhoRaw === "-" || normalizeKey(tamanhoRaw) === "neutro" || tamanhoRaw === NEUTRAL_SIZE_UI) {
            tamanho = NEUTRAL_SIZE_VALUE;
            if (raw.medida === undefined || raw.medida === null) {
                errors.push(label + ": tamanho Neutro exige o campo \"medida\" (use \"\" para deixar vazio de propósito).");
            } else {
                medida = trimText(raw.medida);
            }
        } else {
            var sizeList = SIZE_OPTIONS.slice(1); // sem o Neutro
            tamanho = matchOption(tamanhoRaw, sizeList);
            if (!tamanho) {
                errors.push(label + ": tamanho inválido \"" + tamanhoRaw + "\". Use: Neutro, " + sizeList.join(", "));
            } else {
                medida = SIZE_TO_MEASURE[tamanho] || "";
                var givenMeasure = trimText(raw.medida);
                if (givenMeasure && normalizeKey(givenMeasure) !== normalizeKey(medida)) {
                    plan.warnings.push(label + ": medida \"" + givenMeasure + "\" ignorada; tamanho " + tamanho + " usa \"" + medida + "\".");
                }
            }
        }

        // Grupo de preço
        var priceRaw = raw.preco !== undefined ? raw.preco : raw.priceGroup;
        var priceKey = String(priceRaw === undefined || priceRaw === null ? "" : priceRaw).replace(/\s+/g, "_");
        var priceGroup = matchOption(priceKey, PRICE_GROUP_OPTIONS.concat([NO_PRICE_GROUP]));
        if (!priceGroup) errors.push(label + ": preço inválido \"" + trimText(priceRaw) + "\". Use: " + PRICE_GROUP_OPTIONS.concat([NO_PRICE_GROUP]).join(", "));

        // Valores manuais no formato padronizado.
        // V_DE, V_parcela e V_total aceitam centavos ("199,90"): o inteiro vai na tag
        // e os centavos substituem o ",00" fixo do CP base ao lado do valor.
        var values = createEmptyManualValues();
        var cents = {};
        values.V_DE = normalizeMoneyValue(raw.V_DE, label + " > V_DE", errors, cents, "V_DE");
        values.V_X = normalizeInstallmentsValue(raw.V_X, label + " > V_X", errors);
        values.V_parcela = normalizeMoneyValue(raw.V_parcela, label + " > V_parcela", errors, cents, "V_parcela");
        values.V_total = normalizeMoneyValue(raw.V_total, label + " > V_total", errors, cents, "V_total");
        values["V_%"] = normalizeIntegerValue(raw["V_%"], label + " > V_%", errors);
        values.V_Oferta_TXT = trimText(raw.V_Oferta_TXT);

        if (errors.length > startErrors) return null;

        var nome = trimText(raw.nome);
        if (!nome && fileRef) nome = stripVariantFromName(getBaseName(fileRef));

        // Benefícios: lista ou texto separado por "|". Vazio = remove os marcadores.
        var beneficios = parseBenefitList(raw.beneficios);
        if (beneficios.length > MAX_BENEFITS) {
            plan.warnings.push(label + ": " + beneficios.length + " benefícios; o CP base tem " + MAX_BENEFITS + " marcadores. Ficaram de fora: " + beneficios.slice(MAX_BENEFITS).join(" | "));
            beneficios = beneficios.slice(0, MAX_BENEFITS);
        }

        return {
            fileRef: fileRef,
            productNameOverride: nome || null,
            categoria: categoria,
            tamanho: tamanho,
            medida: medida,
            semTamanho: semTamanho,
            beneficios: beneficios,
            frase: raw.frase === undefined || raw.frase === null ? "" : String(raw.frase),
            todosTamanhos: todosTamanhos,
            cta: raw.cta === undefined || raw.cta === null ? null : String(raw.cta),
            letras_miudas: raw.letras_miudas === undefined || raw.letras_miudas === null ? null : String(raw.letras_miudas),
            selo: trimText(raw.selo),
            enquadramento: parseFraming(raw.enquadramento, label, plan.warnings),
            priceGroup: priceGroup,
            manualValues: values,
            cents: cents,
            label: label
        };
    }

    // Erros: grupo de preço que não existe no CP base.
    // Tags do grupo vazias no JSON não bloqueiam: ficam em branco para edição manual
    // e são listadas em "warnings" (se for passado).
    function validatePriceTagsAgainstBase(items, priceGroupTags, warnings) {
        var errors = [];

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.priceGroup === NO_PRICE_GROUP) continue;
            var tags = priceGroupTags[item.priceGroup];

            if (tags === null || tags === undefined) {
                errors.push(item.label + ": o CP base não tem o grupo de preço \"" + item.priceGroup + "\".");
                continue;
            }

            var missing = [];
            for (var t = 0; t < tags.length; t++) {
                var tag = tags[t];
                if (!isManualTag(tag)) continue;
                if (!item.manualValues[tag]) missing.push(tag);
            }

            if (missing.length > 0 && warnings) {
                warnings.push(item.label + ": " + missing.join(", ") + " em branco no grupo \"" + item.priceGroup + "\" (preencher à mão).");
            }
        }

        return errors;
    }

    function describePriceGroupTags(priceGroupTags) {
        var lines = ["Tags encontradas em cada grupo de preço do CP base:"];
        for (var i = 0; i < PRICE_GROUP_OPTIONS.length; i++) {
            var name = PRICE_GROUP_OPTIONS[i];
            var tags = priceGroupTags[name];
            lines.push("- " + name + ": " + (tags === null ? "(grupo não existe)" : (tags.length ? tags.join(", ") : "(sem tags)")));
        }
        return lines.join("\n");
    }

    function isManualTag(tag) {
        for (var i = 0; i < MANUAL_TEXT_TAGS.length; i++) {
            if (MANUAL_TEXT_TAGS[i].key === tag) return true;
        }
        return false;
    }

    // V_DE, V_parcela, V_total, V_%: só número inteiro.
    // Aceita e limpa "R$", "%", espaços, separador de milhar e ",00".
    // Centavos diferentes de zero geram erro (não arredonda preço).
    function normalizeIntegerValue(value, label, errors) {
        if (value === undefined || value === null) return "";
        var s = trimText(value);
        if (s === "") return "";

        s = s.replace(/R\$/gi, "").replace(/%/g, "").replace(/\s+/g, "");

        var cents = s.match(/,(\d{1,2})$/);
        if (cents) {
            if (parseInt(cents[1], 10) !== 0) {
                errors.push(label + ": \"" + trimText(value) + "\" tem centavos; use só o número inteiro.");
                return "";
            }
            s = s.replace(/,\d{1,2}$/, "");
        }

        if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");

        if (!/^\d+$/.test(s)) {
            errors.push(label + ": \"" + trimText(value) + "\" não é um número inteiro.");
            return "";
        }

        return String(parseInt(s, 10));
    }

    // V_DE, V_parcela, V_total: inteiro + centavos opcionais ("4.980,00" -> "4980";
    // "199,90" -> "199" e cents[key] = "90"). Nunca arredonda.
    function normalizeMoneyValue(value, label, errors, cents, key) {
        if (value === undefined || value === null) return "";
        var s = trimText(value).replace(/R\$/gi, "").replace(/\s+/g, "");
        if (s === "") return "";
        var m = s.match(/^(.*),(\d{1,2})$/);
        if (m && parseInt(m[2], 10) !== 0) {
            var cc = m[2].length === 1 ? m[2] + "0" : m[2];
            var intPart = normalizeIntegerValue(m[1], label, errors);
            if (intPart !== "") cents[key] = cc;
            return intPart;
        }
        return normalizeIntegerValue(value, label, errors);
    }

    // V_X: número + X maiúsculo (ex.: 12X). Aceita "12", "12x", "12 X".
    function normalizeInstallmentsValue(value, label, errors) {
        if (value === undefined || value === null) return "";
        var s = trimText(value);
        if (s === "") return "";

        var m = s.replace(/\s+/g, "").match(/^(\d+)[xX]?$/);
        if (!m) {
            errors.push(label + ": \"" + s + "\" fora do formato (ex.: 12X).");
            return "";
        }
        return String(parseInt(m[1], 10)) + "X";
    }

    function checkPending(label, value, errors) {
        if (value === undefined || value === null) return;
        if (typeof value === "object") return;
        if (/PENDENTE/i.test(String(value))) errors.push(label + ": pendência não resolvida (\"" + String(value) + "\").");
    }

    function findImageByName(imageFiles, wanted) {
        var wantedKey = normalizeKey(wanted);
        var wantedNoExt = normalizeKey(String(wanted).replace(/\.[^\.]+$/, ""));
        var hasExt = IMAGE_EXT_RE.test(String(wanted));
        var matches = [];

        for (var i = 0; i < imageFiles.length; i++) {
            var fileName = safeDecode(imageFiles[i].name);
            if (hasExt) {
                if (normalizeKey(fileName) === wantedKey) return { file: imageFiles[i] };
            } else if (normalizeKey(getBaseName(imageFiles[i])) === wantedNoExt) {
                matches.push(imageFiles[i]);
            }
        }

        if (matches.length === 1) return { file: matches[0] };
        if (matches.length > 1) return { ambiguous: true, error: "foto \"" + wanted + "\" é ambígua (várias extensões); informe a extensão." };
        return { error: "foto \"" + wanted + "\" não encontrada na pasta_fotos." };
    }

    function matchOption(value, options) {
        var key = normalizeKey(value);
        if (!key) return null;
        for (var i = 0; i < options.length; i++) {
            if (normalizeKey(options[i]) === key) return options[i];
        }
        var compact = key.replace(/\s*\+\s*/g, "+");
        for (var j = 0; j < options.length; j++) {
            if (normalizeKey(options[j]).replace(/\s*\+\s*/g, "+") === compact) return options[j];
        }
        return null;
    }

    // Minúsculas, sem acentos e com espaços simples, para comparar nomes.
    function normalizeKey(value) {
        // No macOS os nomes de arquivo/pasta vêm decompostos (NFD: "a" + acento combinante);
        // remove os acentos combinantes para comparar igual ao Windows (NFC).
        var s = trimText(value).toLowerCase().replace(/[\u0300-\u036f]/g, "");
        var from = "áàâãäéèêëíìîïóòôõöúùûüçñ";
        var to = "aaaaaeeeeiiiiooooouuuucn";
        var out = "";
        for (var i = 0; i < s.length; i++) {
            var idx = from.indexOf(s.charAt(i));
            out += idx >= 0 ? to.charAt(idx) : s.charAt(i);
        }
        return out.replace(/\s+/g, " ");
    }

    function trimText(value) {
        if (value === undefined || value === null) return "";
        return String(value).replace(/^\s+|\s+$/g, "");
    }

    function splitIntoChunks(arr, size) {
        var chunks = [];
        for (var i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
        return chunks;
    }

    function isAbsolutePath(p) {
        return /^[A-Za-z]:[\\\/]/.test(p) || /^[\\\/]/.test(p) || /^~/.test(p);
    }

    function resolveFolder(p, baseFolder) {
        var clean = String(p).replace(/\\/g, "/");
        return isAbsolutePath(clean) ? new Folder(clean) : new Folder(baseFolder.fsName + "/" + clean);
    }

    function resolveFile(p, baseFolder) {
        var clean = String(p).replace(/\\/g, "/");
        return isAbsolutePath(clean) ? new File(clean) : new File(baseFolder.fsName + "/" + clean);
    }

    function sanitizeFileName(name) {
        var s = String(name).replace(/[\\\/:\*\?"<>\|]/g, "-").replace(/\s+/g, " ");
        s = trimText(s);
        return s || "campanha";
    }

    // Incorpora todos os itens vinculados (fotos e elementos de biblioteca) para o
    // .ai abrir completo em qualquer computador a partir do Drive.
    // Retorna a lista de vínculos que não puderam ser incorporados.
    function embedAllPlacedItems(doc) {
        var failed = [];
        for (var i = doc.placedItems.length - 1; i >= 0; i--) {
            var item = doc.placedItems[i];
            var name = "";
            try { name = decodeURI(item.file.name); } catch (e) { name = item.name || "(sem nome)"; }
            try {
                item.embed();
            } catch (embedErr) {
                failed.push(name + ": " + embedErr.message);
            }
        }
        return failed;
    }

    function saveDocumentAsAi(doc, file) {
        var opts = new IllustratorSaveOptions();
        try { opts.pdfCompatible = true; } catch (e1) {}
        try { opts.embedLinkedFiles = false; } catch (e2) {}
        try { opts.embedICCProfile = true; } catch (e3) {}
        try { opts.compressed = true; } catch (e4) {}
        doc.saveAs(file, opts);
    }

    function readTextFile(file) {
        file.encoding = "UTF-8";
        if (!file.open("r")) throw new Error("Não foi possível abrir " + file.fsName);
        var text = file.read();
        file.close();
        if (text.charCodeAt(0) === 0xFEFF) text = text.substring(1);
        return text;
    }

    // Acrescenta uma linha ao relatório do lote (cria o arquivo se não existir).
    function appendTextFile(file, line) {
        try {
            var isNew = !file.exists;
            file.encoding = "UTF-8";
            file.lineFeed = IS_MAC ? "Unix" : "Windows";
            if (!file.open(isNew ? "w" : "e")) return false;
            if (isNew) {
                file.write("﻿");
            } else {
                file.seek(0, 2);
            }
            file.writeln(line);
            file.close();
            return true;
        } catch (e) {
            return false;
        }
    }

    function pad2(n) {
        return (n < 10 ? "0" : "") + n;
    }

    function formatDateTime(d) {
        return pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
    }

    function showBatchReport(title, lines) {
        var win = new Window("dialog", title);
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.margins = 16;
        var box = win.add("edittext", undefined, lines.join("\n"), { multiline: true, scrolling: true, readonly: true });
        box.preferredSize = [760, 360];
        var okBtn = win.add("button", undefined, "OK", { name: "ok" });
        okBtn.alignment = ["right", "top"];
        win.center();
        win.show();
    }

    // =========================
    // PARSER JSON (ExtendScript não tem JSON nativo; sem eval)
    // =========================
    function parseJsonText(text) {
        var at = 0;
        var ch = " ";

        function fail(msg) {
            var before = text.substring(0, at);
            var lineNo = before.split("\n").length;
            throw new Error(msg + " (linha " + lineNo + ")");
        }

        function next(expected) {
            if (expected && expected !== ch) fail("Esperava '" + expected + "' e encontrei '" + ch + "'");
            ch = text.charAt(at);
            at += 1;
            return ch;
        }

        function white() {
            while (ch && ch <= " ") next();
        }

        function number() {
            var str = "";
            if (ch === "-") { str = "-"; next("-"); }
            while (ch >= "0" && ch <= "9") { str += ch; next(); }
            if (ch === ".") { str += "."; while (next() && ch >= "0" && ch <= "9") str += ch; }
            if (ch === "e" || ch === "E") {
                str += ch; next();
                if (ch === "-" || ch === "+") { str += ch; next(); }
                while (ch >= "0" && ch <= "9") { str += ch; next(); }
            }
            var n = +str;
            if (isNaN(n)) fail("Número inválido");
            return n;
        }

        function string() {
            var str = "";
            var escapes = { "\"": "\"", "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };
            if (ch !== "\"") fail("Esperava texto entre aspas");
            while (next()) {
                if (ch === "\"") { next(); return str; }
                if (ch === "\\") {
                    next();
                    if (ch === "u") {
                        var hex = 0;
                        for (var i = 0; i < 4; i++) {
                            var h = parseInt(next(), 16);
                            if (!isFinite(h)) fail("Escape \\u inválido");
                            hex = hex * 16 + h;
                        }
                        str += String.fromCharCode(hex);
                    } else if (escapes.hasOwnProperty(ch)) {
                        str += escapes[ch];
                    } else {
                        fail("Escape inválido");
                    }
                } else {
                    str += ch;
                }
            }
            fail("Texto sem aspas de fechamento");
        }

        function word() {
            if (ch === "t") { next("t"); next("r"); next("u"); next("e"); return true; }
            if (ch === "f") { next("f"); next("a"); next("l"); next("s"); next("e"); return false; }
            if (ch === "n") { next("n"); next("u"); next("l"); next("l"); return null; }
            fail("Valor inesperado '" + ch + "'");
        }

        function array() {
            var arr = [];
            next("[");
            white();
            if (ch === "]") { next("]"); return arr; }
            while (ch) {
                arr.push(value());
                white();
                if (ch === "]") { next("]"); return arr; }
                next(",");
                white();
            }
            fail("Lista sem ']' de fechamento");
        }

        function object() {
            var obj = {};
            next("{");
            white();
            if (ch === "}") { next("}"); return obj; }
            while (ch) {
                var key = string();
                white();
                next(":");
                obj[key] = value();
                white();
                if (ch === "}") { next("}"); return obj; }
                next(",");
                white();
            }
            fail("Objeto sem '}' de fechamento");
        }

        function value() {
            white();
            if (ch === "{") return object();
            if (ch === "[") return array();
            if (ch === "\"") return string();
            if (ch === "-" || (ch >= "0" && ch <= "9")) return number();
            return word();
        }

        var result = value();
        white();
        if (ch) fail("Conteúdo extra depois do fim do JSON");
        return result;
    }

    // =========================
    // FUNÇÕES DE ARQUIVOS
    // =========================
    function findBaseFile(folder) {
        var files = folder.getFiles(function (f) {
            if (!(f instanceof File)) return false;
            var name = safeDecode(f.name);
            return /^CP base/i.test(name) && BASE_EXT_RE.test(name);
        });

        if (files && files.length > 0) {
            for (var i = 0; i < files.length; i++) {
                var n = safeDecode(files[i].name);
                if (/^CP base\.(ai|ait|eps|pdf)$/i.test(n)) return files[i];
            }
            return files[0];
        }
        return null;
    }

    function getImageFiles(folder) {
        var files = folder.getFiles(function (f) {
            if (!(f instanceof File)) return false;
            var name = safeDecode(f.name);
            if (/^CP base/i.test(name)) return false;
            return IMAGE_EXT_RE.test(name);
        });

        files.sort(function (a, b) {
            var an = safeDecode(a.name).toLowerCase();
            var bn = safeDecode(b.name).toLowerCase();
            if (an < bn) return -1;
            if (an > bn) return 1;
            return 0;
        });

        return files;
    }

    function getBaseName(file) {
        var name = safeDecode(file.name);
        return name.replace(/\.[^\.]+$/, "");
    }

    // "Genialle Casal" -> "Genialle"; "Benvenutti BOX BAU" -> "Benvenutti";
    // "Suavitta (Magnólia + Stella)" -> "Suavitta". Nunca devolve vazio.
    function stripVariantFromName(name) {
        var base = String(name || "").replace(/\s*\([^)]*\)\s*/g, " ");
        var words = base.split(/\s+/);
        var kept = [];
        for (var i = 0; i < words.length; i++) {
            if (!words[i]) continue;
            var isVariant = false;
            var key = normalizeKey(words[i]);
            for (var v = 0; v < NAME_VARIANT_WORDS.length; v++) {
                if (key === NAME_VARIANT_WORDS[v]) { isVariant = true; break; }
            }
            if (!isVariant) kept.push(words[i]);
        }
        var out = kept.join(" ");
        return out || String(name || "");
    }

    function parseBenefitList(value) {
        var list = [];
        if (value === undefined || value === null) return list;
        var parts = (value instanceof Array) ? value : String(value).split("|");
        for (var i = 0; i < parts.length; i++) {
            var s = trimText(parts[i]);
            if (s) list.push(s);
        }
        return list;
    }

    // "A | B" -> ["A", "B"]; "Conforto de hotel, Preço de Black!" -> ["Conforto de hotel,", "Preço de Black!"];
    // sem separador -> ["texto", ""]. Mais de um "|": linha 2 recebe o resto.
    function splitOfferText(text) {
        var s = trimText(text);
        var bar = s.indexOf("|");
        if (bar >= 0) {
            var rest = s.substring(bar + 1).split("|");
            for (var i = 0; i < rest.length; i++) rest[i] = trimText(rest[i]);
            return [trimText(s.substring(0, bar)), rest.join(" | ")];
        }
        var comma = s.indexOf(",");
        if (comma > 0 && comma < s.length - 1) {
            return [trimText(s.substring(0, comma + 1)), trimText(s.substring(comma + 1))];
        }
        return [s, ""];
    }

    function safeDecode(str) {
        try {
            return decodeURI(str);
        } catch (e) {
            return str;
        }
    }

    // =========================
    // INTERFACE DE SELEÇÃO
    // =========================
    function showCampaignDialog(files) {
        var win = new Window("dialog", "Selecionar produtos e dados da campanha");
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 10;
        win.margins = 16;

        var info = win.add("statictext", undefined, "Selecione os produtos e defina as tags individualmente para cada produto, incluindo o grupo de preço:");
        info.alignment = ["fill", "top"];

        var tabs = win.add("tabbedpanel");
        tabs.alignChildren = ["fill", "fill"];
        tabs.preferredSize = [920, 500];

        var tabProducts = tabs.add("tab", undefined, "Produtos");
        tabProducts.orientation = "column";
        tabProducts.alignChildren = ["fill", "top"];
        tabProducts.margins = 16;

        var productPanel = tabProducts.add("panel", undefined, "Produtos encontrados");
        productPanel.orientation = "row";
        productPanel.alignChildren = ["left", "top"];
        productPanel.margins = 12;
        productPanel.spacing = 18;

        var maxRows = 18;
        var colCount = Math.ceil(files.length / maxRows);
        if (colCount < 1) colCount = 1;
        if (colCount > 4) colCount = 4;

        var rowsPerCol = Math.ceil(files.length / colCount);
        var checkboxes = [];
        var productConfigs = {};
        var selectedOrder = [];

        for (var c = 0; c < colCount; c++) {
            var col = productPanel.add("group");
            col.orientation = "column";
            col.alignChildren = ["left", "top"];
            col.spacing = 4;

            for (var r = 0; r < rowsPerCol; r++) {
                var index = c * rowsPerCol + r;
                if (index >= files.length) break;

                var cb = col.add("checkbox", undefined, getBaseName(files[index]));
                cb.value = false;
                cb.fileRef = files[index];
                cb.onClick = function () {
                    syncSelectedOrderFromCheckboxes();
                    rebuildProductConfigRows();
                };
                checkboxes.push(cb);
            }
        }

        var tools = tabProducts.add("group");
        tools.orientation = "row";
        tools.alignment = ["left", "top"];

        var selectAllBtn = tools.add("button", undefined, "Selecionar todos");
        var clearBtn = tools.add("button", undefined, "Limpar seleção");
        var updateBtn = tools.add("button", undefined, "Atualizar dados dos selecionados");

        var testPanel = tabProducts.add("panel", undefined, "TESTE RÁPIDO DA CAMPANHA");
        testPanel.orientation = "row";
        testPanel.alignChildren = ["left", "center"];
        testPanel.margins = 12;
        testPanel.spacing = 12;

        var testBtn = testPanel.add("button", undefined, "★ Preparar teste com 4 produtos");
        testBtn.preferredSize = [250, 30];
        testBtn.helpTip = "Seleciona os 4 primeiros produtos e preenche dados fictícios para conferir o layout.";
        var testInfo = testPanel.add("statictext", undefined, "Preenche dados neutros e abre Valores manuais para conferência.");
        testInfo.preferredSize = [520, 24];

        selectAllBtn.onClick = function () {
            for (var i = 0; i < checkboxes.length; i++) checkboxes[i].value = true;
            syncSelectedOrderFromCheckboxes();
            rebuildProductConfigRows();
        };

        clearBtn.onClick = function () {
            for (var i = 0; i < checkboxes.length; i++) checkboxes[i].value = false;
            selectedOrder = [];
            rebuildProductConfigRows();
        };

        updateBtn.onClick = function () {
            syncSelectedOrderFromCheckboxes();
            rebuildProductConfigRows();
            tabs.selection = tabData;
        };

        var tabData = tabs.add("tab", undefined, "Dados por produto");
        tabData.orientation = "column";
        tabData.alignChildren = ["fill", "top"];
        tabData.margins = 16;
        tabData.spacing = 10;

        var dataInfo = tabData.add("statictext", undefined, "Defina categoria, tamanho, grupo de preço e a ordem das pranchetas. Use as setas para mover cada produto para cima ou para baixo.");
        dataInfo.alignment = ["fill", "top"];

        var header = tabData.add("group");
        header.orientation = "row";
        header.alignChildren = ["left", "center"];
        header.spacing = 10;
        header.add("statictext", undefined, "Ordem").preferredSize = [72, 20];
        header.add("statictext", undefined, "Produto").preferredSize = [220, 20];
        header.add("statictext", undefined, "Categoria").preferredSize = [220, 20];
        header.add("statictext", undefined, "Tamanho").preferredSize = [120, 20];
        header.add("statictext", undefined, "Medida").preferredSize = [140, 20];
        header.add("statictext", undefined, "Preço").preferredSize = [120, 20];

        var rowsPanel = tabData.add("panel", undefined, "Produtos selecionados");
        rowsPanel.orientation = "column";
        rowsPanel.alignChildren = ["fill", "top"];
        rowsPanel.margins = 12;
        rowsPanel.spacing = 6;
        rowsPanel.preferredSize = [900, 300];

        var rowsGroup = rowsPanel.add("group");
        rowsGroup.orientation = "column";
        rowsGroup.alignChildren = ["fill", "top"];
        rowsGroup.spacing = 6;

        var bulkTools = tabData.add("panel", undefined, "Preenchimento rápido (opcional)");
        bulkTools.orientation = "row";
        bulkTools.alignChildren = ["left", "center"];
        bulkTools.margins = 12;
        bulkTools.spacing = 10;

        bulkTools.add("statictext", undefined, "Aplicar em todos:");
        var bulkCategory = bulkTools.add("dropdownlist", undefined, ["— Categoria —"].concat(CATEGORY_OPTIONS));
        bulkCategory.selection = 0;
        bulkCategory.preferredSize = [190, 24];
        var bulkSize = bulkTools.add("dropdownlist", undefined, ["— Tamanho —"].concat(SIZE_OPTIONS));
        bulkSize.selection = 0;
        bulkSize.preferredSize = [140, 24];
        var bulkPrice = bulkTools.add("dropdownlist", undefined, ["— Preço —"].concat(PRICE_GROUP_OPTIONS));
        bulkPrice.selection = 0;
        bulkPrice.preferredSize = [120, 24];
        var applyBulkBtn = bulkTools.add("button", undefined, "Aplicar aos selecionados");

        var nameInfo = tabData.add("panel", undefined, "Tag automática");
        nameInfo.orientation = "column";
        nameInfo.alignChildren = ["left", "top"];
        nameInfo.margins = 12;
        nameInfo.spacing = 6;
        nameInfo.add("statictext", undefined, 'A tag "nome" é preenchida automaticamente com o nome do arquivo do produto.');
        nameInfo.add("statictext", undefined, 'Exemplo: "Benvenutti.jpg" → nome = "Benvenutti"');

        var tabManual = tabs.add("tab", undefined, "Valores manuais");
        tabManual.orientation = "column";
        tabManual.alignChildren = ["fill", "top"];
        tabManual.margins = 16;
        tabManual.spacing = 10;

        var manualInfo = tabManual.add("statictext", undefined, "Preencha os textos que substituirão as novas tags de valor. Os campos aceitam vírgula, R$, %, acentos e caracteres especiais.");
        manualInfo.alignment = ["fill", "top"];

        var manualHeader = tabManual.add("group");
        manualHeader.orientation = "row";
        manualHeader.alignChildren = ["left", "center"];
        manualHeader.spacing = 8;
        manualHeader.add("statictext", undefined, "Produto").preferredSize = [160, 20];
        manualHeader.add("statictext", undefined, "{{V_DE}}").preferredSize = [105, 20];
        manualHeader.add("statictext", undefined, "{{V_X}}").preferredSize = [60, 20];
        manualHeader.add("statictext", undefined, "{{V_parcela}}").preferredSize = [105, 20];
        manualHeader.add("statictext", undefined, "{{V_total}}").preferredSize = [105, 20];
        manualHeader.add("statictext", undefined, "{{V_%}}").preferredSize = [70, 20];
        manualHeader.add("statictext", undefined, "{{V_Oferta_TXT}}").preferredSize = [205, 20];

        var manualRowsPanel = tabManual.add("panel", undefined, "Valores por produto");
        manualRowsPanel.orientation = "column";
        manualRowsPanel.alignChildren = ["fill", "top"];
        manualRowsPanel.margins = 12;
        manualRowsPanel.spacing = 6;
        manualRowsPanel.preferredSize = [900, 320];

        var manualRowsGroup = manualRowsPanel.add("group");
        manualRowsGroup.orientation = "column";
        manualRowsGroup.alignChildren = ["fill", "top"];
        manualRowsGroup.spacing = 6;

        var manualTip = tabManual.add("panel", undefined, "Exemplos de preenchimento");
        manualTip.orientation = "column";
        manualTip.alignChildren = ["left", "top"];
        manualTip.margins = 12;
        manualTip.spacing = 4;
        manualTip.add("statictext", undefined, '{{V_DE}} = 4499 | {{V_parcela}} = 249 | {{V_total}} = 2988   (só número inteiro, sem centavos)');
        manualTip.add("statictext", undefined, '{{V_X}} = 12X | {{V_%}} = 30 | {{V_Oferta_TXT}} = Oferta imperdível');

        var rowControls = [];
        var manualRowControls = [];

        function getSelectedFilesFromCheckboxes() {
            var selected = [];
            for (var i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i].value) selected.push(checkboxes[i].fileRef);
            }
            return selected;
        }

        function getOrderedSelectedFiles() {
            syncSelectedOrderFromCheckboxes();
            return selectedOrder.slice(0);
        }

        function syncSelectedOrderFromCheckboxes() {
            var selected = getSelectedFilesFromCheckboxes();
            var newOrder = [];

            for (var i = 0; i < selectedOrder.length; i++) {
                if (arrayContainsFile(selected, selectedOrder[i])) {
                    newOrder.push(selectedOrder[i]);
                }
            }

            for (var j = 0; j < selected.length; j++) {
                if (!arrayContainsFile(newOrder, selected[j])) {
                    newOrder.push(selected[j]);
                }
            }

            selectedOrder = newOrder;
        }

        function arrayContainsFile(arr, fileRef) {
            var key = getProductKey(fileRef);
            for (var i = 0; i < arr.length; i++) {
                if (getProductKey(arr[i]) === key) return true;
            }
            return false;
        }

        function moveSelectedFile(fileRef, direction) {
            syncSelectedOrderFromCheckboxes();
            var key = getProductKey(fileRef);
            var index = -1;

            for (var i = 0; i < selectedOrder.length; i++) {
                if (getProductKey(selectedOrder[i]) === key) {
                    index = i;
                    break;
                }
            }

            if (index < 0) return;

            var newIndex = index + direction;
            if (newIndex < 0 || newIndex >= selectedOrder.length) return;

            var temp = selectedOrder[index];
            selectedOrder[index] = selectedOrder[newIndex];
            selectedOrder[newIndex] = temp;

            rebuildProductConfigRows();
        }

        function getProductKey(fileRef) {
            try { return String(fileRef.fsName); } catch (e) {}
            return safeDecode(fileRef.name);
        }

        function ensureConfig(fileRef) {
            var key = getProductKey(fileRef);
            var config = productConfigs[key];

            if (!config) {
                config = {
                    categoria: CATEGORY_OPTIONS[0],
                    tamanho: NEUTRAL_SIZE_VALUE,
                    medida: NEUTRAL_DEFAULT_MEASURE,
                    neutralMeasure: NEUTRAL_DEFAULT_MEASURE,
                    priceGroup: PRICE_GROUP_OPTIONS[0],
                    manualValues: createEmptyManualValues()
                };
                productConfigs[key] = config;
            } else if (config.neutralMeasure === undefined || config.neutralMeasure === null) {
                config.neutralMeasure = isNeutralSize(config.tamanho)
                    ? String(config.medida || NEUTRAL_DEFAULT_MEASURE)
                    : NEUTRAL_DEFAULT_MEASURE;
            }

            return config;
        }

        function clearGroupChildren(group) {
            while (group.children.length > 0) {
                group.remove(group.children[0]);
            }
        }

        function setManualValue(configRef, key, value) {
            if (!configRef.manualValues) configRef.manualValues = createEmptyManualValues();
            configRef.manualValues[key] = String(value || "");
        }

        function getManualValue(configRef, key) {
            if (!configRef.manualValues) configRef.manualValues = createEmptyManualValues();
            var value = configRef.manualValues[key];
            if (value === undefined || value === null) return "";
            return String(value);
        }

        function prepareFourProductTest() {
            if (files.length < TEST_PRODUCT_CONFIGS.length) {
                alert("O teste precisa de pelo menos 4 imagens de produto na pasta selecionada.");
                return;
            }

            syncManualValuesFromFields();
            syncMeasureValuesFromFields();

            for (var i = 0; i < checkboxes.length; i++) {
                checkboxes[i].value = (i < TEST_PRODUCT_CONFIGS.length);
            }

            selectedOrder = [];
            for (var j = 0; j < TEST_PRODUCT_CONFIGS.length; j++) {
                var fileRef = checkboxes[j].fileRef;
                var preset = TEST_PRODUCT_CONFIGS[j];
                var cfg = ensureConfig(fileRef);

                selectedOrder.push(fileRef);
                cfg.categoria = preset.categoria;
                cfg.tamanho = preset.tamanho;
                cfg.medida = SIZE_TO_MEASURE[preset.tamanho] || "";
                cfg.priceGroup = preset.priceGroup;
                cfg.manualValues = {
                    V_DE: "2000",
                    V_X: preset.V_X,
                    V_parcela: "999",
                    V_total: "1000",
                    "V_%": "50",
                    V_Oferta_TXT: "Oferta Imperdível"
                };
            }

            rebuildProductConfigRows();
            rebuildManualValueRows();
            tabs.selection = tabManual;
            win.layout.layout(true);
        }

        function rebuildProductConfigRows() {
            syncMeasureValuesFromFields();
            clearGroupChildren(rowsGroup);
            rowControls = [];

            syncSelectedOrderFromCheckboxes();
            var selectedFiles = selectedOrder.slice(0);

            if (selectedFiles.length === 0) {
                var emptyText = rowsGroup.add("statictext", undefined, "Nenhum produto selecionado. Volte à aba Produtos e marque os itens desejados.");
                emptyText.preferredSize = [800, 20];
                rebuildManualValueRows();
                win.layout.layout(true);
                return;
            }

            for (var i = 0; i < selectedFiles.length; i++) {
                var fileRef = selectedFiles[i];
                var productName = getBaseName(fileRef);
                var cfg = ensureConfig(fileRef);

                var row = rowsGroup.add("group");
                row.orientation = "row";
                row.alignChildren = ["left", "center"];
                row.spacing = 10;

                var orderGroup = row.add("group");
                orderGroup.orientation = "row";
                orderGroup.alignChildren = ["left", "center"];
                orderGroup.spacing = 3;
                orderGroup.preferredSize = [72, 24];

                var upBtn = orderGroup.add("button", undefined, "↑");
                upBtn.preferredSize = [32, 22];
                upBtn.enabled = (i > 0);

                var downBtn = orderGroup.add("button", undefined, "↓");
                downBtn.preferredSize = [32, 22];
                downBtn.enabled = (i < selectedFiles.length - 1);

                upBtn.onClick = (function (fileToMove) {
                    return function () {
                        moveSelectedFile(fileToMove, -1);
                    };
                })(fileRef);

                downBtn.onClick = (function (fileToMove) {
                    return function () {
                        moveSelectedFile(fileToMove, 1);
                    };
                })(fileRef);

                var nameText = row.add("statictext", undefined, productName);
                nameText.preferredSize = [220, 24];

                var ddCategory = row.add("dropdownlist", undefined, CATEGORY_OPTIONS);
                ddCategory.preferredSize = [220, 24];
                setDropdownByText(ddCategory, cfg.categoria, CATEGORY_OPTIONS[0]);

                var ddSize = row.add("dropdownlist", undefined, SIZE_OPTIONS);
                ddSize.preferredSize = [120, 24];
                setDropdownByText(ddSize, cfg.tamanho, SIZE_OPTIONS[0]);

                var measureField = row.add("edittext", undefined, cfg.medida || "");
                measureField.preferredSize = [140, 24];
                measureField.enabled = isNeutralSize(cfg.tamanho);
                measureField.helpTip = "Editável quando o tamanho selecionado for Neutro.";

                var ddPriceGroup = row.add("dropdownlist", undefined, PRICE_GROUP_OPTIONS);
                ddPriceGroup.preferredSize = [120, 24];
                setDropdownByText(ddPriceGroup, cfg.priceGroup, PRICE_GROUP_OPTIONS[0]);

                ddCategory.onChange = (function (configRef, dropdownRef) {
                    return function () {
                        configRef.categoria = getDropdownValue(dropdownRef);
                    };
                })(cfg, ddCategory);

                ddSize.onChange = (function (configRef, dropdownRef, measureRef) {
                    return function () {
                        applySizeSelection(configRef, getDropdownValue(dropdownRef), measureRef);
                    };
                })(cfg, ddSize, measureField);

                var syncMeasureField = (function (configRef, measureRef) {
                    return function () {
                        if (!isNeutralSize(configRef.tamanho)) return;
                        configRef.medida = String(measureRef.text || "");
                        configRef.neutralMeasure = configRef.medida;
                    };
                })(cfg, measureField);

                measureField.onChanging = syncMeasureField;
                measureField.onChange = syncMeasureField;

                ddPriceGroup.onChange = (function (configRef, dropdownRef) {
                    return function () {
                        configRef.priceGroup = getDropdownValue(dropdownRef);
                    };
                })(cfg, ddPriceGroup);

                rowControls.push({
                    fileRef: fileRef,
                    config: cfg,
                    categoryDropdown: ddCategory,
                    sizeDropdown: ddSize,
                    measureField: measureField,
                    priceDropdown: ddPriceGroup
                });
            }

            rebuildManualValueRows();
            win.layout.layout(true);
        }

        function syncMeasureValuesFromFields() {
            for (var i = 0; i < rowControls.length; i++) {
                var control = rowControls[i];
                var config = control.config;

                if (isNeutralSize(config.tamanho)) {
                    config.medida = String(control.measureField.text || "");
                    config.neutralMeasure = config.medida;
                } else {
                    config.medida = SIZE_TO_MEASURE[config.tamanho] || "";
                }
            }
        }

        function rebuildManualValueRows() {
            clearGroupChildren(manualRowsGroup);
            manualRowControls = [];

            syncSelectedOrderFromCheckboxes();
            var selectedFiles = selectedOrder.slice(0);

            if (selectedFiles.length === 0) {
                var emptyManualText = manualRowsGroup.add("statictext", undefined, "Nenhum produto selecionado. Volte à aba Produtos e marque os itens desejados.");
                emptyManualText.preferredSize = [800, 20];
                return;
            }

            for (var i = 0; i < selectedFiles.length; i++) {
                var fileRef = selectedFiles[i];
                var cfg = ensureConfig(fileRef);
                var productName = getBaseName(fileRef);

                var row = manualRowsGroup.add("group");
                row.orientation = "row";
                row.alignChildren = ["left", "center"];
                row.spacing = 8;

                var nameText = row.add("statictext", undefined, productName);
                nameText.preferredSize = [160, 24];

                var controls = {
                    fileRef: fileRef,
                    config: cfg,
                    fields: {}
                };

                addManualField(row, controls, "V_DE", 105);
                addManualField(row, controls, "V_X", 60);
                addManualField(row, controls, "V_parcela", 105);
                addManualField(row, controls, "V_total", 105);
                addManualField(row, controls, "V_%", 70);
                addManualField(row, controls, "V_Oferta_TXT", 205);

                manualRowControls.push(controls);
            }
        }

        function addManualField(row, controls, key, width) {
            var field = row.add("edittext", undefined, getManualValue(controls.config, key));
            field.preferredSize = [width, 24];
            field.onChange = (function (configRef, tagKey, fieldRef) {
                return function () {
                    setManualValue(configRef, tagKey, fieldRef.text);
                };
            })(controls.config, key, field);

            controls.fields[key] = field;
            return field;
        }

        function syncManualValuesFromFields() {
            for (var i = 0; i < manualRowControls.length; i++) {
                var controls = manualRowControls[i];
                for (var t = 0; t < MANUAL_TEXT_TAGS.length; t++) {
                    var key = MANUAL_TEXT_TAGS[t].key;
                    if (controls.fields[key]) {
                        setManualValue(controls.config, key, controls.fields[key].text);
                    }
                }
            }
        }

        applyBulkBtn.onClick = function () {
            var categoryValue = (bulkCategory.selection && bulkCategory.selection.index > 0) ? bulkCategory.selection.text : null;
            var sizeValue = (bulkSize.selection && bulkSize.selection.index > 0) ? getDropdownValue(bulkSize) : null;
            var priceValue = (bulkPrice.selection && bulkPrice.selection.index > 0) ? bulkPrice.selection.text : null;

            if (!categoryValue && !sizeValue && !priceValue) {
                alert("Selecione pelo menos uma categoria, um tamanho ou um tipo de preço no preenchimento rápido.");
                return;
            }

            for (var i = 0; i < rowControls.length; i++) {
                var rc = rowControls[i];
                if (categoryValue) {
                    rc.config.categoria = categoryValue;
                    setDropdownByText(rc.categoryDropdown, categoryValue, CATEGORY_OPTIONS[0]);
                }
                if (sizeValue) {
                    setDropdownByText(rc.sizeDropdown, sizeValue, SIZE_OPTIONS[0]);
                    applySizeSelection(rc.config, sizeValue, rc.measureField);
                }
                if (priceValue) {
                    rc.config.priceGroup = priceValue;
                    setDropdownByText(rc.priceDropdown, priceValue, PRICE_GROUP_OPTIONS[0]);
                }
            }
        };

        testBtn.onClick = prepareFourProductTest;

        tabs.selection = tabProducts;
        rebuildProductConfigRows();

        var actions = win.add("group");
        actions.orientation = "row";
        actions.alignment = ["right", "top"];

        var cancelBtn = actions.add("button", undefined, "Cancelar", { name: "cancel" });
        var okBtn = actions.add("button", undefined, "Gerar campanha", { name: "ok" });

        var result = null;

        okBtn.onClick = function () {
            syncManualValuesFromFields();
            syncMeasureValuesFromFields();
            var selectedFiles = getOrderedSelectedFiles();

            if (selectedFiles.length === 0) {
                tabs.selection = tabProducts;
                alert("Selecione pelo menos um produto.");
                return;
            }

            var selectedItems = [];
            for (var i = 0; i < selectedFiles.length; i++) {
                var fileRef = selectedFiles[i];
                var cfg = ensureConfig(fileRef);

                if (!cfg.categoria) {
                    tabs.selection = tabData;
                    alert("Selecione uma categoria para todos os produtos.");
                    return;
                }

                if (!cfg.tamanho) {
                    tabs.selection = tabData;
                    alert("Selecione um tamanho para todos os produtos.");
                    return;
                }

                if (isNeutralSize(cfg.tamanho)) {
                    if (cfg.medida === undefined || cfg.medida === null) {
                        cfg.medida = NEUTRAL_DEFAULT_MEASURE;
                    }
                    cfg.medida = String(cfg.medida);
                    cfg.neutralMeasure = cfg.medida;
                } else {
                    cfg.medida = SIZE_TO_MEASURE[cfg.tamanho] || "";
                }

                if (!cfg.priceGroup) {
                    tabs.selection = tabData;
                    alert("Selecione um tipo de preço para todos os produtos.");
                    return;
                }

                selectedItems.push({
                    fileRef: fileRef,
                    categoria: cfg.categoria,
                    tamanho: cfg.tamanho,
                    medida: cfg.medida,
                    priceGroup: cfg.priceGroup,
                    manualValues: cloneManualValues(cfg.manualValues)
                });
            }

            result = selectedItems;
            win.close(1);
        };

        cancelBtn.onClick = function () {
            result = null;
            win.close(0);
        };

        win.center();
        win.show();
        return result;
    }

    function isNeutralSize(sizeValue) {
        return sizeValue === NEUTRAL_SIZE_VALUE || sizeValue === NEUTRAL_SIZE_UI;
    }

    function applySizeSelection(configRef, sizeValue, measureField) {
        if (!configRef) return;

        // Salva a medida manual antes de sair do modo Neutro.
        if (isNeutralSize(configRef.tamanho) && measureField) {
            configRef.neutralMeasure = String(measureField.text || "");
        }

        configRef.tamanho = sizeValue;

        if (isNeutralSize(sizeValue)) {
            if (configRef.neutralMeasure === undefined || configRef.neutralMeasure === null) {
                configRef.neutralMeasure = NEUTRAL_DEFAULT_MEASURE;
            }

            configRef.medida = String(configRef.neutralMeasure);

            if (measureField) {
                measureField.text = configRef.medida;
                measureField.enabled = true;
            }
            return;
        }

        configRef.medida = SIZE_TO_MEASURE[sizeValue] || "";

        if (measureField) {
            measureField.text = configRef.medida;
            measureField.enabled = false;
        }
    }

    function getDropdownValue(dd) {
        if (!dd || !dd.selection) return "";
        var value = dd.selection.text;
        if (value === NEUTRAL_SIZE_UI) return NEUTRAL_SIZE_VALUE;
        return value;
    }

    function setDropdownByText(dd, text, fallbackText) {
        var target = text || fallbackText || "";
        for (var i = 0; i < dd.items.length; i++) {
            if (dd.items[i].text === target || (target === NEUTRAL_SIZE_VALUE && dd.items[i].text === NEUTRAL_SIZE_UI)) {
                dd.selection = i;
                return;
            }
        }
        if (fallbackText) {
            for (var j = 0; j < dd.items.length; j++) {
                if (dd.items[j].text === fallbackText || (fallbackText === NEUTRAL_SIZE_VALUE && dd.items[j].text === NEUTRAL_SIZE_UI)) {
                    dd.selection = j;
                    return;
                }
            }
        }
        if (dd.items.length > 0) dd.selection = 0;
    }

    function createEmptyManualValues() {
        var values = {};
        for (var i = 0; i < MANUAL_TEXT_TAGS.length; i++) {
            values[MANUAL_TEXT_TAGS[i].key] = "";
        }
        return values;
    }

    function cloneManualValues(values) {
        var clone = {};
        for (var i = 0; i < MANUAL_TEXT_TAGS.length; i++) {
            var key = MANUAL_TEXT_TAGS[i].key;
            var value = values ? values[key] : "";
            clone[key] = (value === undefined || value === null) ? "" : String(value);
        }
        return clone;
    }

    function addManualTagValuesToObject(target, values) {
        if (!target) return;
        for (var i = 0; i < MANUAL_TEXT_TAGS.length; i++) {
            var key = MANUAL_TEXT_TAGS[i].key;
            var value = values ? values[key] : "";
            target[key] = (value === undefined || value === null) ? "" : String(value);
        }
    }

    function escapeRegExp(value) {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function escapeReplacementValue(value) {
        return String(value || "").replace(/\$/g, "$$$$");
    }

    // =========================
    // PREENCHIMENTO DOS TEXTOS
    // =========================
    // Preenche os textos de uma prancheta (Story ou Feed) já duplicada do CP base.
    function fillArtboardText(ctx, priceGroupArtCache, targetLayerMap, dupMap, item, tagData, kind, opts) {
        opts = opts || { warnings: [] };
        var warnings = opts.warnings || [];
        var label = item.label || item.productName || "";
        var frames = collectTextFramesFromItems(dupMap["txt"]);
        var anchorBounds = findTagAnchorBoundsFromFrames(frames);
        var nameBlock = findNameBlock(dupMap["txt"]);
        var priceGroup = addSelectedPriceGroupToArtboardFast(priceGroupArtCache, ctx.priceGroupCache.fallback, targetLayerMap["txt"], anchorBounds, item.priceGroup);

        // Feed sem grupo de preço próprio: usa o do Story reduzido na mesma proporção do nome.
        if (priceGroup && kind === "feed" && !priceGroupArtCache[item.priceGroup] && ctx.feedPriceScale && Math.abs(ctx.feedPriceScale - 1) > 0.01) {
            scaleItemFromTopLeft(priceGroup, ctx.feedPriceScale);
        }

        if (priceGroup && item.priceGroup === "oferta") {
            fillOfferFrames(priceGroup, item.manualValues ? item.manualValues.V_Oferta_TXT : "");
        }
        if (priceGroup && item.cents) applyCents(priceGroup, item.cents);
        if (item.todosTamanhos) setSizeFramesText(frames, SIZE_ALL_TEXT);
        else if (item.semTamanho) {
            frames = removeSizeBlock(frames);
            removeNamedItems(dupMap["txt"], SIZE_STRIP_NAME);
        }
        if (item.beneficios) {
            var slots = applyBenefits(frames, item.beneficios);
            if (slots === 0 && item.beneficios.length > 0 && kind === "story") {
                warnings.push(label + ": benefícios não aplicados (o CP base não tem marcadores \"" + BENEFIT_PLACEHOLDER + "\"): " + item.beneficios.join(" | "));
            }
        }

        frames = collectLiveFrames(frames);
        var fraseFrames = [];
        for (var ff = 0; ff < frames.length; ff++) if (isFraseFrame(frames[ff])) fraseFrames.push(frames[ff]);
        var fraseResult = fillFraseFrames(frames, item.frase);
        if (fraseResult.missing && kind === "story") warnings.push(label + ": sem frase de destaque - a caixa {{frase}} foi removida.");
        if (fraseResult.noBold && kind === "story") warnings.push(label + ": fonte Bold da frase não encontrada (" + fraseResult.noBold + "); destaque sem negrito.");
        frames = collectLiveFrames(frames);

        if (priceGroup) collectTextFramesRecursive(priceGroup, frames);
        applyTextTagsToFrames(uniqueTextFrames(frames), tagData);

        var seal = null;
        if (item.selo) {
            if (opts.sealLib) {
                seal = placeSealFromLibrary(opts.sealLib, item.selo, targetLayerMap["txt"]);
                if (!seal && kind === "story") warnings.push(label + ": selo \"" + item.selo + "\" não está na biblioteca de selos - inserir na revisão (e salvar o selo novo no arquivo de selos).");
            } else if (kind === "story") {
                warnings.push(label + ": selo \"" + item.selo + "\" sem biblioteca de selos configurada - inserir na revisão.");
            }
        }
        var hasBenefits = !!(item.beneficios && item.beneficios.length);
        var placed = applySlotLayout(dupMap, nameBlock, priceGroup, { fraseFrames: collectLiveFrames(fraseFrames), seal: seal, hasBenefits: hasBenefits, centerNameY: !!(item.semTamanho && !item.todosTamanhos) });
        if (seal && !placed.seal) {
            try { seal.remove(); } catch (eSR) {}
            if (kind === "story") warnings.push(label + ": o CP base não tem \"area_selo\" - selo \"" + item.selo + "\" não colocado.");
        }
    }

    // Bloco do nome: item de nível superior da camada txt que contém {{nome}}/{{Categoria}}.
    // Precisa ser encontrado antes de as tags serem trocadas.
    function findNameBlock(items) {
        if (!items) return null;
        for (var i = 0; i < items.length; i++) {
            var fr = [];
            collectTextFramesRecursive(items[i], fr);
            for (var f = 0; f < fr.length; f++) {
                if (isTagFrame(fr[f])) return items[i];
            }
        }
        return null;
    }

    function scaleItemFromTopLeft(item, factor) {
        var p = factor * 100;
        try { item.resize(p, p, true, true, true, true, p, Transformation.TOPLEFT); } catch (e) {}
    }

    // Razão entre o {{nome}} do Feed e o do Story no CP base (ex.: 37,4 / 49,9 = 0,75).
    function detectFeedPriceScale(layoutCache) {
        function nomeSize(cacheSide) {
            var items = cacheSide["txt"] || [];
            for (var i = 0; i < items.length; i++) {
                var fr = [];
                collectTextFramesRecursive(items[i].item, fr);
                for (var f = 0; f < fr.length; f++) {
                    if (frameHasTag(fr[f], "nome")) {
                        try { return fr[f].textRange.characterAttributes.size; } catch (e) {}
                    }
                }
            }
            return 0;
        }
        var s = nomeSize(layoutCache.story);
        var f = nomeSize(layoutCache.feed);
        if (!s || !f) return 1;
        return f / s;
    }

    // =========================
    // FRASE DE DESTAQUE
    // =========================
    function isFraseFrame(tf) {
        var content = "";
        try { content = tf.contents || ""; } catch (e) {}
        return /\{\{\s*frase\s*\}\}/i.test(content);
    }

    // Retorna { missing: bool, noBold: "nome da fonte" | "" }.
    function fillFraseFrames(frames, frase) {
        var result = { missing: false, noBold: "" };
        var targets = [];
        for (var i = 0; i < frames.length; i++) {
            if (isFraseFrame(frames[i])) targets.push(frames[i]);
        }
        if (targets.length === 0) return result;

        if (!trimText(frase)) {
            result.missing = true;
            for (var r = 0; r < targets.length; r++) {
                try { targets[r].remove(); } catch (eR) {}
            }
            return result;
        }

        var parsed = parseMarkedText(frase, true);
        for (var t = 0; t < targets.length; t++) {
            var miss = setMarkedText(targets[t], parsed);
            if (miss) result.noBold = miss;
        }
        return result;
    }

    // "Mais *espaço* para\nreceber bem." -> { text: "Mais espaço para<quebra>receber bem.", bold: [[5, 11]] }
    function parseMarkedText(raw, autoBreak) {
        var s = String(raw).replace(/\r\n?/g, "\n").replace(/^\s+|\s+$/g, "");
        var text = "";
        var bold = [];
        var open = -1;
        for (var i = 0; i < s.length; i++) {
            var ch = s.charAt(i);
            if (ch === "*") {
                if (open < 0) open = text.length;
                else { if (text.length > open) bold.push([open, text.length]); open = -1; }
                continue;
            }
            text += (ch === "\n") ? FORCED_BREAK : ch;
        }
        if (open >= 0 && text.length > open) bold.push([open, text.length]);

        if (autoBreak && text.indexOf(FORCED_BREAK) < 0 && text.length >= FRASE_AUTO_BREAK_MIN) {
            var cut = balancedBreakIndex(text);
            if (cut > 0) text = text.substring(0, cut) + FORCED_BREAK + text.substring(cut + 1);
        }
        return { text: text, bold: bold };
    }

    // Índice do espaço que deixa as duas linhas com tamanhos mais parecidos.
    function balancedBreakIndex(text) {
        var mid = text.length / 2;
        var best = -1;
        var bestDist = Infinity;
        for (var i = 1; i < text.length - 1; i++) {
            if (text.charAt(i) !== " ") continue;
            var d = Math.abs(i - mid);
            if (d < bestDist) { bestDist = d; best = i; }
        }
        return best;
    }

    // Troca o texto mantendo a formatação do CP base (fonte, corpo, tracking, cor)
    // e aplica a versão Bold da família nos trechos marcados. Retorna a fonte Bold
    // procurada quando ela não existe ("" quando deu certo).
    // preferExisting: usa como "bold" a outra fonte que já existe no texto (ex.: "Chama no *WhatsApp*").
    function setMarkedText(tf, parsed, preferExisting, weight) {
        var baseFont = null;
        var otherFont = null;
        try {
            var chars0 = tf.textRange.characters;
            baseFont = chars0[0].characterAttributes.textFont;
            if (preferExisting) {
                for (var q = 1; q < chars0.length; q++) {
                    var fq = chars0[q].characterAttributes.textFont;
                    if (fq.name !== baseFont.name) { otherFont = fq; break; }
                }
            }
        } catch (e) {}
        safeSetTextContents(tf, parsed.text);
        if (baseFont) { try { tf.textRange.characterAttributes.textFont = baseFont; } catch (eB) {} }
        if (!parsed.bold.length) return "";

        var boldFont = otherFont || (weight ? findBoldFont(baseFont, weight) : null) || findBoldFont(baseFont);
        if (!boldFont) return baseFont ? (baseFont.family + " Bold") : "Bold";

        var chars = null;
        try { chars = tf.textRange.characters; } catch (e2) {}
        if (!chars) return "";
        for (var b = 0; b < parsed.bold.length; b++) {
            for (var c = parsed.bold[b][0]; c < parsed.bold[b][1] && c < chars.length; c++) {
                try { chars[c].characterAttributes.textFont = boldFont; } catch (e3) {}
            }
        }
        return "";
    }

    // Cache guardado na própria função: "var" no corpo do script não chega a rodar no modo automático.
    function findBoldFont(baseFont, weight) {
        if (!baseFont) return null;
        weight = weight || "Bold";
        if (!findBoldFont.cache) findBoldFont.cache = {};
        var BOLD_FONT_CACHE = findBoldFont.cache;
        var family = "";
        var name = "";
        try { family = baseFont.family; name = baseFont.name; } catch (e) {}
        var cacheKey = name + "|" + weight;
        if (BOLD_FONT_CACHE.hasOwnProperty(cacheKey)) return BOLD_FONT_CACHE[cacheKey];

        var found = null;
        // 1) Mesmo nome PostScript com o estilo trocado (Humanist521BT-Light -> Humanist521BT-Bold)
        var dash = name.lastIndexOf("-");
        if (dash > 0) {
            try { found = app.textFonts.getByName(name.substring(0, dash) + "-" + weight); } catch (e2) { found = null; }
        }
        // 2) Qualquer "Bold" da mesma família (sem Italic)
        if (!found) {
            try {
                for (var i = 0; i < app.textFonts.length; i++) {
                    var f = app.textFonts[i];
                    if (f.family === family && f.style.toLowerCase() === weight.toLowerCase()) { found = f; break; }
                }
            } catch (e3) {}
        }
        BOLD_FONT_CACHE[cacheKey] = found;
        return found;
    }

    // =========================
    // TAMANHO "Todos"
    // =========================
    function setSizeFramesText(frames, text) {
        var target = null;
        var others = [];
        for (var i = 0; i < frames.length; i++) {
            if (!isSizeFrame(frames[i])) continue;
            var c = "";
            try { c = frames[i].contents || ""; } catch (e) {}
            if (!target && hasTagToken(c, "tamanho")) target = frames[i];
            else others.push(frames[i]);
        }
        if (!target && others.length) target = others.shift();
        if (!target) return;
        safeSetTextContents(target, text);
        for (var r = 0; r < others.length; r++) { try { others[r].remove(); } catch (e2) {} }
    }

    // =========================
    // ENQUADRAMENTO (memória)
    // =========================
    // "enquadramento": { "story": [x, y, largura], "feed": [x, y, largura] } em frações da prancheta.
    function parseFraming(raw, label, warnings) {
        if (!raw || typeof raw !== "object") return null;
        function arr(v) {
            if (!(v instanceof Array) || v.length < 3) return null;
            var out = [];
            for (var i = 0; i < 3; i++) {
                var n = parseFloat(v[i]);
                if (isNaN(n)) return null;
                out.push(n);
            }
            return out[2] > 0 ? out : null;
        }
        var f = { story: arr(raw.story), feed: arr(raw.feed) };
        if ((raw.story && !f.story) || (raw.feed && !f.feed)) warnings.push(label + ": enquadramento inválido (use [x, y, largura]); foto centralizada.");
        return f;
    }

    // =========================
    // SELOS (biblioteca .ai)
    // =========================
    function sealKey(v) {
        return normalizeKey(String(v || "").replace(/[\r\n\u0003]+/g, " ")).replace(/[^a-z0-9]+/g, "");
    }

    function openSealLibrary(file, secao) {
        var prevUI = app.userInteractionLevel;
        app.userInteractionLevel = UserInteractionLevel.DONTDISPLAYALERTS;
        var doc;
        try { doc = app.open(file); } finally { app.userInteractionLevel = prevUI; }
        var lib = { doc: doc, cands: [], headers: [], secao: sealKey(secao) };
        function center(it) { var b = it.geometricBounds; return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]; }
        for (var l = 0; l < doc.layers.length; l++) {
            var layer = doc.layers[l];
            for (var i = 0; i < layer.pageItems.length; i++) {
                var it = layer.pageItems[i];
                var keys = [];
                try { if (it.name) keys.push(sealKey(it.name)); } catch (e) {}
                if (it.typename === "TextFrame") {
                    lib.headers.push({ key: sealKey(it.contents), c: center(it) });
                    continue;
                }
                if (it.typename === "SymbolItem") { try { keys.push(sealKey(it.symbol.name)); } catch (e2) {} }
                if (it.typename === "GroupItem") {
                    var fr = [];
                    collectTextFramesRecursive(it, fr);
                    var all = [];
                    for (var f = 0; f < fr.length; f++) { try { all.push(fr[f].contents); } catch (e3) {} }
                    if (all.length) keys.push(sealKey(all.join(" ")));
                    for (var f2 = 0; f2 < fr.length; f2++) { try { keys.push(sealKey(fr[f2].contents)); } catch (e4) {} }
                }
                if (keys.length) lib.cands.push({ item: it, keys: keys, c: center(it) });
            }
        }
        return lib;
    }

    function findSeal(lib, name) {
        var k = sealKey(name);
        if (!k) return null;
        var exact = [], partial = [];
        for (var i = 0; i < lib.cands.length; i++) {
            var keys = lib.cands[i].keys, hitE = false, hitP = false;
            for (var j = 0; j < keys.length; j++) {
                if (!keys[j]) continue;
                if (keys[j] === k) hitE = true;
                else if (keys[j].indexOf(k) >= 0) hitP = true;
            }
            if (hitE) exact.push(lib.cands[i]); else if (hitP) partial.push(lib.cands[i]);
        }
        var list = exact.length ? exact : (partial.length === 1 ? partial : []);
        if (list.length <= 1) return list.length ? list[0].item : null;
        // Arquivo com selos de várias campanhas: fica com o mais perto do título da seção.
        if (lib.secao) {
            var h = null;
            for (var t = 0; t < lib.headers.length; t++) if (lib.headers[t].key.indexOf(lib.secao) >= 0 || lib.secao.indexOf(lib.headers[t].key) >= 0) { h = lib.headers[t]; break; }
            if (h) {
                var best = null, bd = Infinity;
                for (var m = 0; m < list.length; m++) {
                    var dx = list[m].c[0] - h.c[0], dy = list[m].c[1] - h.c[1];
                    var d = dx * dx + dy * dy;
                    if (d < bd) { bd = d; best = list[m]; }
                }
                return best.item;
            }
        }
        return list[0].item;
    }

    function placeSealFromLibrary(lib, name, layer) {
        var src = findSeal(lib, name);
        if (!src) return null;
        var dup = null;
        try { dup = src.duplicate(layer, ElementPlacement.PLACEATBEGINNING); } catch (e) { return null; }
        try { dup.name = "selo - " + name; } catch (e2) {}
        return dup;
    }

    function closeSealLibrary(lib) {
        if (!lib || !lib.doc) return;
        try { lib.doc.close(SaveOptions.DONOTSAVECHANGES); } catch (e) {}
        lib.doc = null;
    }

    // =========================
    // TEXTOS EM SÍMBOLOS (CTA, letras miúdas)
    // =========================
    // entries: [{ rect: artboardRect, text: "..." }]. Cada texto diferente vira uma
    // versão do símbolo; todas as instâncias continuam símbolo.
    function applySymbolTextVariants(doc, spec, entries) {
        var sym = null;
        for (var s = 0; s < doc.symbols.length && !sym; s++) {
            var sn = normalizeKey(doc.symbols[s].name);
            for (var n = 0; n < spec.names.length; n++) if (sn === normalizeKey(spec.names[n])) { sym = doc.symbols[s]; break; }
        }
        if (!sym) return "o CP base não tem o símbolo de " + (spec.field === "cta" ? "CTA (\"WhatsApp\")" : "letras miúdas") + " - texto não aplicado.";

        var insts = [];
        for (var i = 0; i < doc.symbolItems.length; i++) {
            try { if (doc.symbolItems[i].symbol === sym) insts.push(doc.symbolItems[i]); } catch (e) {}
        }
        if (!insts.length) return "";

        var values = [], byValue = {}, assigned = 0;
        for (var k = 0; k < insts.length; k++) {
            var b = insts[k].geometricBounds;
            var cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
            for (var e2 = 0; e2 < entries.length; e2++) {
                var r = entries[e2].rect;
                if (cx >= r[0] && cx <= r[2] && cy <= r[1] && cy >= r[3]) {
                    var v = entries[e2].text;
                    if (!byValue.hasOwnProperty(v)) { byValue[v] = []; values.push(v); }
                    byValue[v].push({ inst: insts[k], b: b });
                    assigned++;
                    break;
                }
            }
        }
        if (!values.length) return "";

        var warn = "";
        var oldName = sym.name;
        var made = [];
        for (var vi = 0; vi < values.length; vi++) {
            var res = buildSymbolTextVariant(doc, sym, values[vi], spec);
            if (res.error) return "não foi possível editar o símbolo \"" + oldName + "\": " + res.error;
            if (res.warning) warn = res.warning;
            made.push(res.symbol);
            var list = byValue[values[vi]];
            for (var li = 0; li < list.length; li++) {
                var it = list[li].inst, ob = list[li].b;
                it.symbol = res.symbol;
                var nb = it.geometricBounds;
                var dx = spec.anchor === "left" ? ob[0] - nb[0] : ((ob[0] + ob[2]) - (nb[0] + nb[2])) / 2;
                it.translate(dx, ((ob[1] + ob[3]) - (nb[1] + nb[3])) / 2);
            }
        }
        if (assigned === insts.length) {
            try { sym.remove(); made[0].name = oldName; } catch (eR) {}
            for (var m = 1; m < made.length; m++) { try { made[m].name = oldName + " " + (m + 1); } catch (eN) {} }
        } else {
            for (var m2 = 0; m2 < made.length; m2++) { try { made[m2].name = oldName + " " + (m2 + 2); } catch (eN2) {} }
        }
        return warn;
    }

    function buildSymbolTextVariant(doc, sym, value, spec) {
        var out = { symbol: null, error: "", warning: "" };
        var tmpLayer = doc.layers.add();
        tmpLayer.name = "__simbolo_tmp";
        try {
            var tmp = tmpLayer.symbolItems.add(sym);
            doc.selection = null;
            tmp.selected = true;
            tmp.breakLink();
            var sel = doc.selection;
            var group = tmpLayer.groupItems.add();
            for (var k = sel.length - 1; k >= 0; k--) sel[k].move(group, ElementPlacement.PLACEATBEGINNING);
            doc.selection = null;

            var frames = [];
            collectTextFramesRecursive(group, frames);
            var target = null, bestArea = -1;
            for (var f = 0; f < frames.length; f++) {
                var c = "";
                try { c = frames[f].contents || ""; } catch (e) {}
                if (!trimText(c)) continue;
                var fb = frames[f].geometricBounds;
                var area = (fb[2] - fb[0]) * (fb[1] - fb[3]);
                if (area > bestArea) { bestArea = area; target = frames[f]; }
            }
            if (!target) throw new Error("símbolo sem texto");

            var ob = target.geometricBounds;
            var pill = spec.pill ? findContainerPath(group, target) : null;
            var pb = pill ? pill.geometricBounds : null;
            var rightPad = pb ? pb[2] - ob[2] : 0;

            setMarkedText(target, parseMarkedText(value, false), true);

            if (pill) {
                var maxH = (pb[1] - pb[3]) * 0.92;
                var nb = target.geometricBounds;
                var th = nb[1] - nb[3];
                if (th > maxH && th > 0) scaleTextSize(target, maxH / th);
                nb = target.geometricBounds;
                target.translate(0, (pb[1] + pb[3]) / 2 - (nb[1] + nb[3]) / 2);
                nb = target.geometricBounds;
                var delta = (nb[2] + rightPad) - pb[2];
                if (Math.abs(delta) > 0.5) movePathRightSide(pill, delta);
            } else if (target.kind === TextType.AREATEXT) {
                var guard = 0;
                while (textOverflows(target) && guard < 40) {
                    var sz = target.textRange.characterAttributes.size;
                    if (sz - 0.5 < LEGAL_MIN_SIZE) break;
                    scaleTextSize(target, (sz - 0.5) / sz);
                    guard++;
                }
                if (textOverflows(target)) out.warning = "o texto das letras miúdas não coube na caixa - conferir na revisão.";
            }

            out.symbol = doc.symbols.add(group, SymbolRegistrationPoint.SYMBOLCENTERPOINT);
            group.remove();
        } catch (err) {
            out.error = err.message;
        }
        try { tmpLayer.remove(); } catch (e2) {}
        return out;
    }

    function scaleTextSize(tf, k) {
        try {
            var chars = tf.textRange.characters;
            for (var i = 0; i < chars.length; i++) chars[i].characterAttributes.size = chars[i].characterAttributes.size * k;
        } catch (e) {}
    }

    function textOverflows(tf) {
        try {
            var shown = 0;
            for (var i = 0; i < tf.lines.length; i++) shown += tf.lines[i].characters.length;
            return shown < tf.characters.length - 1;
        } catch (e) { return false; }
    }

    // Estica a pílula para a direita sem deformar os cantos arredondados.
    function movePathRightSide(path, delta) {
        var paths = path.typename === "CompoundPathItem" ? path.pathItems : [path];
        var b = path.geometricBounds;
        var mid = (b[0] + b[2]) / 2;
        for (var p = 0; p < paths.length; p++) {
            var pts = paths[p].pathPoints;
            for (var i = 0; i < pts.length; i++) {
                var pt = pts[i];
                if (pt.anchor[0] <= mid) continue;
                pt.anchor = [pt.anchor[0] + delta, pt.anchor[1]];
                pt.leftDirection = [pt.leftDirection[0] + delta, pt.leftDirection[1]];
                pt.rightDirection = [pt.rightDirection[0] + delta, pt.rightDirection[1]];
            }
        }
    }

    // =========================
    // CIDADE (símbolo)
    // =========================
    // Edita o texto do símbolo "city" uma vez; todas as instâncias continuam símbolo.
    // Retorna "" quando deu certo ou um aviso.
    function applyCitySymbol(doc, city) {
        var sym = null;
        for (var s = 0; s < doc.symbols.length && !sym; s++) {
            var sn = normalizeKey(doc.symbols[s].name);
            for (var n = 0; n < CITY_SYMBOL_NAMES.length; n++) {
                if (sn === CITY_SYMBOL_NAMES[n]) { sym = doc.symbols[s]; break; }
            }
        }
        if (!sym) return "";

        var insts = [];
        for (var i = 0; i < doc.symbolItems.length; i++) {
            try { if (doc.symbolItems[i].symbol === sym) insts.push(doc.symbolItems[i]); } catch (e) {}
        }
        if (insts.length === 0) return "";

        var centers = [];
        for (var c = 0; c < insts.length; c++) {
            var b = insts[c].geometricBounds;
            centers.push([(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]);
        }

        var tmpLayer = doc.layers.add();
        tmpLayer.name = "__cidade_tmp";
        var group = null;
        try {
            var tmp = tmpLayer.symbolItems.add(sym);
            doc.selection = null;
            tmp.selected = true;
            tmp.breakLink();
            var sel = doc.selection;
            group = tmpLayer.groupItems.add();
            for (var k = sel.length - 1; k >= 0; k--) sel[k].move(group, ElementPlacement.PLACEATBEGINNING);
            doc.selection = null;

            var frames = [];
            collectTextFramesRecursive(group, frames);
            var target = null;
            for (var f = 0; f < frames.length; f++) {
                var txt = normalizeKey(frames[f].contents).replace(/[{}\s]/g, "");
                if (txt === "cidade") { target = frames[f]; break; }
            }
            if (!target) {
                tmpLayer.remove();
                return "símbolo \"" + sym.name + "\" sem o texto \"Cidade\" - cidade não trocada.";
            }

            var pill = findContainerPath(group, target);
            safeSetTextContents(target, city);
            if (pill) {
                var tb = target.geometricBounds;
                var pb = pill.geometricBounds;
                var maxW = (pb[2] - pb[0]) * CITY_TEXT_FIT;
                var tw = tb[2] - tb[0];
                if (tw > maxW && tw > 0) {
                    var cx = (tb[0] + tb[2]) / 2, cy = (tb[1] + tb[3]) / 2;
                    try { target.textRange.characterAttributes.size = target.textRange.characterAttributes.size * maxW / tw; } catch (eS) {}
                    var nb = target.geometricBounds;
                    target.translate(cx - (nb[0] + nb[2]) / 2, cy - (nb[1] + nb[3]) / 2);
                }
            }

            var newSym = doc.symbols.add(group, SymbolRegistrationPoint.SYMBOLCENTERPOINT);
            group.remove();
            tmpLayer.remove();
            tmpLayer = null;

            for (var j = 0; j < insts.length; j++) {
                insts[j].symbol = newSym;
                var nb2 = insts[j].geometricBounds;
                insts[j].translate(centers[j][0] - (nb2[0] + nb2[2]) / 2, centers[j][1] - (nb2[1] + nb2[3]) / 2);
            }
            var oldName = sym.name;
            sym.remove();
            newSym.name = oldName;
        } catch (err) {
            try { if (tmpLayer) tmpLayer.remove(); } catch (e2) {}
            return "não foi possível trocar a cidade no símbolo \"" + sym.name + "\": " + err.message;
        }
        return "";
    }

    // Maior forma (pílula/contorno) que contém o centro do texto.
    function findContainerPath(group, tf) {
        var tb = tf.geometricBounds;
        var cx = (tb[0] + tb[2]) / 2, cy = (tb[1] + tb[3]) / 2;
        var best = null, bestArea = 0;
        var paths = [];
        (function walk(c) {
            for (var i = 0; i < c.pageItems.length; i++) {
                var it = c.pageItems[i];
                if (it.typename === "GroupItem") walk(it);
                else if (it.typename === "PathItem" || it.typename === "CompoundPathItem") paths.push(it);
            }
        })(group);
        for (var p = 0; p < paths.length; p++) {
            var b = paths[p].geometricBounds;
            if (cx < b[0] || cx > b[2] || cy > b[1] || cy < b[3]) continue;
            var area = (b[2] - b[0]) * (b[1] - b[3]);
            if (area > bestArea) { bestArea = area; best = paths[p]; }
        }
        return best;
    }

    // =========================
    // ÁREAS DE DIAGRAMAÇÃO (area_nome / area_preco / area_info)
    // =========================
    function collectSlots(dupMap) {
        var slots = {};
        var found = false;
        var layers = ["guides", "txt"];
        for (var l = 0; l < layers.length; l++) {
            var items = dupMap[layers[l]] || [];
            for (var i = 0; i < items.length; i++) {
                var nm = "";
                try { nm = items[i].name || ""; } catch (e) {}
                var m = SLOT_RE.exec(nm);
                if (!m) continue;
                var type = m[1].toLowerCase();
                var optText = normalizeKey(m[2] || "");
                var slot = {
                    item: items[i],
                    bounds: items[i].geometricBounds,
                    align: /esquerda/.test(optText) ? "left" : (/direita/.test(optText) ? "right" : "center"),
                    max: 1,
                    gap: PRICE_GROUP_GAP
                };
                var mm = /max\s*(\d+(?:[.,]\d+)?)\s*%?/.exec(optText);
                if (mm) slot.max = parseFloat(mm[1].replace(",", ".")) / 100;
                var gm = /espaco\s*(\d+(?:[.,]\d+)?)/.exec(optText);
                if (gm) slot.gap = parseFloat(gm[1].replace(",", "."));
                if (type === "selo" && /benef/.test(optText)) type = "selo_beneficios";
                slots[type] = slot;
                found = true;
            }
        }
        return found ? slots : null;
    }

    function alignX(item, area, align) {
        var b = getStableBounds(item);
        var w = b[2] - b[0];
        var left;
        if (align === "left") left = area[0];
        else if (align === "right") left = area[2] - w;
        else left = (area[0] + area[2]) / 2 - w / 2;
        item.translate(left - b[0], 0);
    }

    function centerYOn(item, refItem) {
        var b = getStableBounds(item);
        var r = getStableBounds(refItem);
        item.translate(0, (r[1] + r[3]) / 2 - (b[1] + b[3]) / 2);
    }

    function fitNameBlock(block, slot) {
        var b = getStableBounds(block);
        var w = b[2] - b[0], h = b[1] - b[3];
        var aw = slot.bounds[2] - slot.bounds[0], ah = slot.bounds[1] - slot.bounds[3];
        if (w <= 0 || h <= 0) return;
        var s = slot.max > 1 ? Math.pow(aw / w, NAME_FIT_EXPONENT) : 1;
        s = Math.min(s, slot.max, aw / w, ah / h);
        if (Math.abs(s - 1) < 0.005) return;
        var p = s * 100;
        try { block.resize(p, p, true, true, true, true, p, Transformation.TOP); } catch (e) {}
    }

    function wrapSingleOfferFrame(group) {
        var gName = "";
        try { gName = group.name || ""; } catch (e) {}
        if (gName !== "oferta") return;
        var frames = [];
        collectTextFramesRecursive(group, frames);
        if (frames.length !== 1) return;
        var text = "";
        try { text = frames[0].contents || ""; } catch (e2) {}
        if (/[\u0003\r]/.test(text) || text.indexOf(" ") < 0) return;
        var cut = balancedBreakIndex(text);
        if (cut > 0) safeSetTextContents(frames[0], text.substring(0, cut) + FORCED_BREAK + text.substring(cut + 1));
    }

    function applySlotLayout(dupMap, nameBlock, priceGroup, extra) {
        extra = extra || {};
        var result = { seal: false };
        var slots = collectSlots(dupMap);
        if (!slots) return result;

        try {
            if (slots.frase && extra.fraseFrames) {
                for (var fr = 0; fr < extra.fraseFrames.length; fr++) {
                    var tf = extra.fraseFrames[fr];
                    var fb = getStableBounds(tf);
                    var faw = slots.frase.bounds[2] - slots.frase.bounds[0];
                    var fw = fb[2] - fb[0];
                    if (fw > faw && fw > 0) {
                        try {
                            var chars = tf.textRange.characters;
                            var k0 = faw / fw;
                            for (var ci = 0; ci < chars.length; ci++) chars[ci].characterAttributes.size = chars[ci].characterAttributes.size * k0;
                        } catch (eFz) {}
                    }
                    alignX(tf, slots.frase.bounds, slots.frase.align);
                }
            }
            if (extra.seal) {
                var sSlot = (extra.hasBenefits && slots.selo_beneficios) ? slots.selo_beneficios : (slots.selo || slots.selo_beneficios);
                if (sSlot) {
                    fitInto(extra.seal, sSlot.bounds);
                    result.seal = true;
                }
            }

            if (nameBlock && slots.nome) {
                fitNameBlock(nameBlock, slots.nome);
                alignX(nameBlock, slots.nome.bounds, slots.nome.align);
                if (extra.centerNameY) {
                    var nbY = getStableBounds(nameBlock);
                    var arY = slots.nome.bounds;
                    nameBlock.translate(0, (arY[1] + arY[3]) / 2 - (nbY[1] + nbY[3]) / 2);
                }
            }
            if (priceGroup && slots.preco) {
                var aw = slots.preco.bounds[2] - slots.preco.bounds[0];
                // Oferta de uma caixa só que não cabe: quebra em 2 linhas antes de reduzir.
                if (getStableBounds(priceGroup)[2] - getStableBounds(priceGroup)[0] > aw) wrapSingleOfferFrame(priceGroup);
                var pb = getStableBounds(priceGroup);
                var pw = pb[2] - pb[0];
                if (pw > aw && pw > 0) scaleItemFromTopLeft(priceGroup, aw / pw);
                alignX(priceGroup, slots.preco.bounds, slots.preco.align);
                var pb1 = getStableBounds(priceGroup);
                var ab1 = slots.preco.bounds;
                priceGroup.translate(0, (ab1[1] + ab1[3]) / 2 - (pb1[1] + pb1[3]) / 2);
            }

            if (slots.info && nameBlock) {
                var area = slots.info.bounds;
                var nb = getStableBounds(nameBlock);
                var nw = nb[2] - nb[0];
                var rowW = nw;
                var pw2 = 0;
                if (priceGroup) {
                    var pb2 = getStableBounds(priceGroup);
                    pw2 = pb2[2] - pb2[0];
                    rowW += slots.info.gap + pw2;
                }
                var aW = area[2] - area[0];
                if (rowW > aW && rowW > 0) {
                    // Linha não cabe: reduz nome e preço juntos.
                    var k = aW / rowW;
                    scaleItemFromTopLeft(nameBlock, k);
                    if (priceGroup) scaleItemFromTopLeft(priceGroup, k);
                    nb = getStableBounds(nameBlock); nw = nb[2] - nb[0];
                    if (priceGroup) { pb2 = getStableBounds(priceGroup); pw2 = pb2[2] - pb2[0]; }
                    rowW = nw + (priceGroup ? slots.info.gap * k + pw2 : 0);
                }
                var left;
                if (slots.info.align === "left") left = area[0];
                else if (slots.info.align === "right") left = area[2] - rowW;
                else left = (area[0] + area[2]) / 2 - rowW / 2;
                nameBlock.translate(left - nb[0], 0);
                if (priceGroup) {
                    var nb3 = getStableBounds(nameBlock);
                    var pb3 = getStableBounds(priceGroup);
                    priceGroup.translate(nb3[2] + (rowW - nw - pw2) - pb3[0], 0);
                    centerYOn(priceGroup, nameBlock);
                }
            }
        } catch (layoutErr) {}

        for (var key in slots) {
            if (slots.hasOwnProperty(key)) { try { slots[key].item.remove(); } catch (e) {} }
        }
        return result;
    }

    function removeNamedItems(items, name) {
        if (!items) return;
        var doomed = [];
        (function walk(list) {
            for (var i = 0; i < list.length; i++) {
                var it = list[i];
                var nm = "";
                try { nm = it.name || ""; } catch (e) {}
                if (normalizeKey(nm) === normalizeKey(name)) { doomed.push(it); continue; }
                try { if (it.typename === "GroupItem") walk(it.pageItems); } catch (e2) {}
            }
        })(items);
        for (var d = 0; d < doomed.length; d++) { try { doomed[d].remove(); } catch (e3) {} }
    }

    // Escala o item para caber no retângulo (sem distorcer) e centraliza.
    function fitInto(item, rect) {
        var b = getStableBounds(item);
        var w = b[2] - b[0], h = b[1] - b[3];
        var aw = rect[2] - rect[0], ah = rect[1] - rect[3];
        if (w > 0 && h > 0) {
            var k = Math.min(aw / w, ah / h) * 100;
            if (Math.abs(k - 100) > 0.5) { try { item.resize(k, k, true, true, true, true, k, Transformation.CENTER); } catch (e) {} }
        }
        var nb = getStableBounds(item);
        item.translate((rect[0] + rect[2]) / 2 - (nb[0] + nb[2]) / 2, (rect[1] + rect[3]) / 2 - (nb[1] + nb[3]) / 2);
    }

    // Centavos: no CP base o ",00" de cada valor é um texto separado, logo à direita
    // da tag. Troca esse ",00" pelos centavos do card (",90").
    function applyCents(group, cents) {
        var frames = [];
        collectTextFramesRecursive(group, frames);
        for (var c = 0; c < CENTS_TAGS.length; c++) {
            var tag = CENTS_TAGS[c];
            if (!cents[tag]) continue;
            for (var i = 0; i < frames.length; i++) {
                var content = "";
                try { content = frames[i].contents || ""; } catch (e) {}
                if (!(normalizeTagValue(content) === normalizeTagValue(tag) || hasTagToken(content, tag))) continue;

                var tb = getStableBounds(frames[i]);
                var best = null;
                var bestDist = Infinity;
                for (var j = 0; j < frames.length; j++) {
                    if (j === i) continue;
                    var other = "";
                    try { other = frames[j].contents || ""; } catch (e2) {}
                    if (!/^\s*,00/.test(other)) continue;
                    var ob = getStableBounds(frames[j]);
                    var midY = (tb[1] + tb[3]) / 2;
                    if (midY > ob[1] + 2 || midY < ob[3] - 2) continue; // não está na mesma linha
                    var dist = ob[0] - tb[2];
                    if (dist < -10) continue; // está à esquerda
                    if (dist < bestDist) { bestDist = dist; best = frames[j]; }
                }
                if (best) {
                    try { best.contents = best.contents.replace(/,00/, "," + cents[tag]); } catch (e3) {}
                }
            }
        }
    }

    // Oferta: as 2 caixas {{V_Oferta_TXT}} viram linha 1 (de cima) e linha 2.
    // Sem segunda linha, a caixa de baixo é removida.
    function fillOfferFrames(group, text) {
        var frames = [];
        collectTextFramesRecursive(group, frames);
        var offerFrames = [];
        for (var i = 0; i < frames.length; i++) {
            var content = "";
            try { content = frames[i].contents || ""; } catch (e) {}
            if (normalizeTagValue(content) === normalizeTagValue("V_Oferta_TXT") || hasTagToken(content, "V_Oferta_TXT")) offerFrames.push(frames[i]);
        }
        if (offerFrames.length < 2) return; // CP base com 1 caixa: segue o preenchimento normal

        offerFrames.sort(function (a, b) { return getStableBounds(b)[1] - getStableBounds(a)[1]; });
        var lines = splitOfferText(text);
        safeSetTextContents(offerFrames[0], lines[0]);
        if (lines[1]) {
            safeSetTextContents(offerFrames[1], lines[1]);
        } else {
            try { offerFrames[1].remove(); } catch (e2) {}
        }
        for (var k = 2; k < offerFrames.length; k++) {
            try { offerFrames[k].remove(); } catch (e3) {}
        }
    }

    function isSizeFrame(tf) {
        var name = "", content = "";
        try { name = tf.name || ""; } catch (e) {}
        try { content = tf.contents || ""; } catch (e2) {}
        var tags = ["tamanho", "medida"];
        for (var i = 0; i < tags.length; i++) {
            var n = normalizeTagValue(tags[i]);
            if (normalizeTagValue(name) === n || normalizeTagValue(content) === n || hasTagToken(content, tags[i])) return true;
        }
        return /^\s*tamanho\s*:?\s*$/i.test(content);
    }

    // Remove o bloco "Tamanho: {{tamanho}} {{medida}}" e devolve os frames restantes.
    function removeSizeBlock(frames) {
        var doomed = [];
        var keep = [];
        for (var i = 0; i < frames.length; i++) {
            if (isSizeFrame(frames[i])) doomed.push(frames[i]);
            else keep.push(frames[i]);
        }
        var groupsToRemove = [];
        for (var d = 0; d < doomed.length; d++) {
            var parent = null;
            try { parent = doomed[d].parent; } catch (e) {}
            if (!parent || parent.typename !== "GroupItem") continue;
            var onlySize = true;
            for (var p = 0; p < parent.pageItems.length; p++) {
                var it = parent.pageItems[p];
                if (it.typename !== "TextFrame" || !isSizeFrame(it)) { onlySize = false; break; }
            }
            if (onlySize) {
                var seen = false;
                for (var g = 0; g < groupsToRemove.length; g++) if (groupsToRemove[g] === parent) seen = true;
                if (!seen) groupsToRemove.push(parent);
            }
        }
        for (var r = 0; r < doomed.length; r++) {
            try { doomed[r].remove(); } catch (e3) {}
        }
        for (var q = 0; q < groupsToRemove.length; q++) {
            try { if (groupsToRemove[q].pageItems.length === 0) groupsToRemove[q].remove(); } catch (e4) {}
        }
        return keep;
    }

    // Marcadores de benefício: preenche de cima para baixo e remove as linhas que sobram
    // (texto + ponto + pílula). Lista vazia remove todos.
    // Retorna quantos marcadores de benefício o CP base tem nesta prancheta.
    // Marcador com quebra de linha no CP base ("Para que busca<quebra>conforto"):
    // o benefício sem "\n" é quebrado em 2 linhas equilibradas.
    function applyBenefits(frames, list) {
        var placeholders = [];
        for (var i = 0; i < frames.length; i++) {
            var content = "";
            try { content = frames[i].contents || ""; } catch (e) {}
            var flat = String(content).replace(/[\u0003\r\n]+/g, " ").replace(/\s+/g, " ");
            if (trimText(flat) === BENEFIT_PLACEHOLDER) placeholders.push(frames[i]);
        }
        if (placeholders.length === 0) return 0;

        placeholders.sort(function (a, b) { return getStableBounds(b)[1] - getStableBounds(a)[1]; });

        var parentsToCheck = [];
        for (var k = 0; k < placeholders.length; k++) {
            var tf = placeholders[k];
            if (k < list.length) {
                var phContent = "";
                try { phContent = tf.contents || ""; } catch (eC) {}
                var twoLines = /[\u0003\r]/.test(phContent);
                setMarkedText(tf, parseMarkedText(list[k], twoLines), false, BENEFIT_BOLD_WEIGHT);
                continue;
            }
            var parent = null;
            try { parent = tf.parent; } catch (e2) {}
            var tb = getStableBounds(tf);
            var centerY = (tb[1] + tb[3]) / 2;
            try { tf.remove(); } catch (e3) {}
            if (!parent || parent.typename !== "GroupItem") continue;

            // Formas da mesma linha: pílula e ponto que cruzam a altura do texto.
            for (var p = parent.pageItems.length - 1; p >= 0; p--) {
                var it = parent.pageItems[p];
                if (it.typename === "TextFrame") continue;
                var b = null;
                try { b = getStableBounds(it); } catch (eb) {}
                if (b && centerY <= b[1] && centerY >= b[3]) {
                    try { it.remove(); } catch (e4) {}
                }
            }
            parentsToCheck.push(parent);
        }
        // Grupos que ficaram vazios (linha agrupada sozinha, ou todos removidos).
        for (var q = 0; q < parentsToCheck.length; q++) {
            var grp = parentsToCheck[q];
            while (grp) {
                var gType = "";
                try { gType = grp.typename; } catch (eT) { break; } // já removido
                if (gType !== "GroupItem") break;
                var next = null;
                try { next = grp.parent; } catch (e5) {}
                var empty = false;
                try { empty = grp.pageItems.length === 0; } catch (e6) { break; }
                if (!empty) break;
                try { grp.remove(); } catch (e7) {}
                grp = next;
            }
        }
        return placeholders.length;
    }

    // Descarta frames que foram removidos (acesso a item removido lança erro).
    function collectLiveFrames(frames) {
        var live = [];
        for (var i = 0; i < frames.length; i++) {
            try { var t = frames[i].typename; if (t) live.push(frames[i]); } catch (e) {}
        }
        return live;
    }

    // =========================
    // DOCUMENTO E PRANCHETAS
    // =========================
    function prepareSelectedItems(selectedItems) {
        for (var i = 0; i < selectedItems.length; i++) {
            selectedItems[i].productName = selectedItems[i].productNameOverride ||
                (selectedItems[i].fileRef ? stripVariantFromName(getBaseName(selectedItems[i].fileRef)) : "Produto " + (i + 1));
            selectedItems[i].storyRect = getTargetArtboardRect(i, "story");
            selectedItems[i].feedRect = getTargetArtboardRect(i, "feed");
        }
    }

    function createTargetDocument(selectedItems) {
        var doc = app.documents.add(DocumentColorSpace.RGB, STORY_W, STORY_H);
        doc.rulerUnits = RulerUnits.Pixels;

        var firstRectSet = false;

        for (var i = 0; i < selectedItems.length; i++) {
            var productName = selectedItems[i].productName;
            var storyRect = selectedItems[i].storyRect;
            var feedRect = selectedItems[i].feedRect;

            if (!firstRectSet) {
                try {
                    doc.artboards[0].artboardRect = storyRect;
                    setArtboardName(doc.artboards[0], productName + " - Story");
                    firstRectSet = true;
                } catch (eFirst) {
                    throw new Error(
                        "Falha ao ajustar a primeira prancheta: " + productName + " - Story\n" +
                        "Rect: " + storyRect.join(", ") + "\n" +
                        "Erro Illustrator: " + eFirst.message
                    );
                }
            } else {
                addArtboardOrThrow(doc, storyRect, productName + " - Story");
            }

            addArtboardOrThrow(doc, feedRect, productName + " - Feed");
        }

        return doc;
    }

    function addArtboardOrThrow(doc, rect, name) {
        try {
            var ab = doc.artboards.add(rect);
            setArtboardName(ab, name);
            return ab;
        } catch (e) {
            throw new Error(
                "Falha ao criar prancheta: " + name + "\n" +
                "Rect: " + rect.join(", ") + "\n" +
                "Erro Illustrator: " + e.message
            );
        }
    }

    function getProductBlockWidth() {
        return PRODUCT_BLOCK_W;
    }

    function getProductBlockHeight() {
        return PRODUCT_BLOCK_H;
    }

    function getMaxProductColumns() {
        return PRODUCT_COLUMNS;
    }

    function getMaxProductRows() {
        return MAX_PRODUCT_ROWS;
    }

    function getMaxProductsInOneDocument() {
        return MAX_PRODUCTS_PER_FILE;
    }

    function getTargetArtboardRect(productIndex, type) {
        var cols = getMaxProductColumns();
        var col = productIndex % cols;
        var row = Math.floor(productIndex / cols);

        var blockW = getProductBlockWidth();
        var blockH = getProductBlockHeight();

        var blockLeft = col * (blockW + PRODUCT_GAP_X);
        var blockTop = LAYOUT_START_TOP - (row * (blockH + GAP_Y));

        var storyLeft = blockLeft;
        var storyTop = blockTop;

        var feedLeft = blockLeft + STORY_W + GAP_X;
        var feedTop = blockTop;

        if (type === "story") {
            return [storyLeft, storyTop, storyLeft + STORY_W, storyTop - STORY_H];
        }

        return [feedLeft, feedTop, feedLeft + FEED_W, feedTop - FEED_H];
    }

    function setArtboardName(artboard, name) {
        try {
            artboard.name = limitText(name, 80);
        } catch (e) {}
    }

    function limitText(str, max) {
        if (str.length <= max) return str;
        return str.substring(0, max - 3) + "...";
    }

    function getSourceArtboardRect(doc, expectedW, expectedH, fallbackIndex) {
        var tolerance = 3;

        for (var i = 0; i < doc.artboards.length; i++) {
            var rect = doc.artboards[i].artboardRect;
            var w = Math.abs(rect[2] - rect[0]);
            var h = Math.abs(rect[1] - rect[3]);

            if (Math.abs(w - expectedW) <= tolerance && Math.abs(h - expectedH) <= tolerance) {
                return rect;
            }
        }

        if (doc.artboards.length > fallbackIndex) {
            return doc.artboards[fallbackIndex].artboardRect;
        }

        return doc.artboards[0].artboardRect;
    }

    // =========================
    // CAMADAS
    // =========================
    function createTargetLayers(doc, layerNames) {
        var map = {};

        for (var i = layerNames.length - 1; i >= 0; i--) {
            var layer = doc.layers.add();
            layer.name = layerNames[i];
            map[layer.name] = layer;
        }

        for (var j = doc.layers.length - 1; j >= 0; j--) {
            var l = doc.layers[j];
            if (!isRequiredLayer(l.name, layerNames)) {
                try {
                    l.locked = false;
                    l.visible = true;
                    l.remove();
                } catch (e) {}
            }
        }

        return map;
    }

    function getLayerMap(doc, layerNames) {
        var map = {};
        var missing = [];

        for (var i = 0; i < layerNames.length; i++) {
            var layer = findTopLayerByName(doc, layerNames[i]);
            if (!layer) {
                missing.push(layerNames[i]);
            } else {
                map[layerNames[i]] = layer;
            }
        }

        if (missing.length > 0) {
            throw new Error("O arquivo CP base não possui as camadas obrigatórias: " + missing.join(", "));
        }

        return map;
    }

    function findTopLayerByName(doc, name) {
        for (var i = 0; i < doc.layers.length; i++) {
            if (doc.layers[i].name === name) return doc.layers[i];
        }
        return null;
    }

    function isRequiredLayer(name) {
        return REQUIRED_LAYER_LOOKUP[name] === true;
    }

    function unlockLayersAndItems(doc) {
        for (var i = 0; i < doc.layers.length; i++) {
            unlockLayerRecursive(doc.layers[i]);
        }
    }

    function unlockLayerRecursive(layer) {
        try { layer.locked = false; } catch (e) {}
        try { layer.visible = true; } catch (e2) {}

        try {
            for (var i = 0; i < layer.pageItems.length; i++) {
                try { layer.pageItems[i].locked = false; } catch (itemErr) {}
                try { layer.pageItems[i].hidden = false; } catch (hiddenErr) {}
            }
        } catch (e3) {}

        try {
            for (var j = 0; j < layer.layers.length; j++) {
                unlockLayerRecursive(layer.layers[j]);
            }
        } catch (e4) {}
    }

    // =========================
    // CACHES DE PERFORMANCE
    // =========================
    function buildSourceLayoutCache(baseLayerMap, sourceStoryRect, sourceFeedRect) {
        var storyRectWithBleed = expandRect(sourceStoryRect, COPY_BLEED);
        var feedRectWithBleed = expandRect(sourceFeedRect, COPY_BLEED);

        var cache = {
            story: {},
            feed: {}
        };

        for (var i = 0; i < LAYER_NAMES.length; i++) {
            var layerName = LAYER_NAMES[i];
            var srcLayer = baseLayerMap[layerName];
            var items = collectTopLevelItems(srcLayer);

            cache.story[layerName] = [];
            cache.feed[layerName] = [];
            if (SKIP_BASE_LAYERS[layerName]) continue;

            for (var j = 0; j < items.length; j++) {
                var item = items[j];
                if (isPriceGroupItem(item)) continue;

                var visibleBounds = getOwnershipBoundsOrNull(item);
                if (!visibleBounds) continue;

                // Um item da base pertence a uma única prancheta. Isso evita que
                // fundos largos ou com sangria sejam copiados uma vez por cache.
                var owner = chooseSourceArtboard(visibleBounds, storyRectWithBleed, feedRectWithBleed);
                var anchorBounds = getPositionAnchorBoundsOrNull(item);
                if (!anchorBounds) continue;

                if (owner === "story") cache.story[layerName].push({ item: item, anchorBounds: anchorBounds });
                if (owner === "feed") cache.feed[layerName].push({ item: item, anchorBounds: anchorBounds });
            }
        }

        return cache;
    }

    function expandRect(rect, bleed) {
        return [
            rect[0] - bleed,
            rect[1] + bleed,
            rect[2] + bleed,
            rect[3] - bleed
        ];
    }

    function duplicateLayoutFromCache(layoutCache, targetLayerMap, sourceRect, targetRect) {
        var duplicatedByLayer = {};

        for (var i = 0; i < LAYER_NAMES.length; i++) {
            var layerName = LAYER_NAMES[i];
            var dstLayer = targetLayerMap[layerName];
            var records = layoutCache[layerName] || [];
            duplicatedByLayer[layerName] = [];

            for (var j = records.length - 1; j >= 0; j--) {
                try {
                    var dup = duplicateItemKeepingArtboardPositionCached(records[j].item, records[j].anchorBounds, dstLayer, sourceRect, targetRect);
                    duplicatedByLayer[layerName].push(dup);
                } catch (e) {}
            }
        }

        return duplicatedByLayer;
    }

    function duplicateItemKeepingArtboardPositionCached(item, sourceAnchorBounds, dstLayer, sourceRect, targetRect) {
        var offsetLeft = sourceAnchorBounds[0] - sourceRect[0];
        var offsetTop = sourceAnchorBounds[1] - sourceRect[1];
        var desiredLeft = targetRect[0] + offsetLeft;
        var desiredTop = targetRect[1] + offsetTop;

        var dup = item.duplicate(dstLayer, ElementPlacement.PLACEATBEGINNING);
        var duplicateAnchorBounds = getPositionAnchorBoundsOrNull(dup);
        if (!duplicateAnchorBounds) {
            try { dup.remove(); } catch (removeErr) {}
            throw new Error("Não foi possível posicionar um item duplicado do layout base.");
        }

        // A transferência entre documentos converte o sistema de coordenadas.
        // Em grupos recortados, a âncora é a própria máscara, nunca o conteúdo
        // oculto que pode ultrapassar muito os limites visíveis da prancheta.
        dup.translate(
            desiredLeft - duplicateAnchorBounds[0],
            desiredTop - duplicateAnchorBounds[1]
        );

        return dup;
    }

    function buildPriceGroupCache(baseDoc, sourceStoryRect, sourceFeedRect) {
        var allGroups = [];
        for (var i = 0; i < baseDoc.layers.length; i++) {
            collectAllPriceGroupsRecursive(baseDoc.layers[i], allGroups);
        }

        var cache = {
            story: {},
            feed: {},
            fallback: {}
        };

        for (var g = 0; g < allGroups.length; g++) {
            var group = allGroups[g];
            var groupName = "";
            try { groupName = group.name || ""; } catch (eName) {}
            if (!isPriceGroupName(groupName)) continue;

            if (!cache.fallback[groupName]) cache.fallback[groupName] = group;
            if (!cache.story[groupName] && itemIntersectsRect(group, sourceStoryRect)) cache.story[groupName] = group;
            if (!cache.feed[groupName] && itemIntersectsRect(group, sourceFeedRect)) cache.feed[groupName] = group;
        }

        return cache;
    }

    function collectAllPriceGroupsRecursive(container, arr) {
        try {
            if (container.groupItems && container.groupItems.length) {
                for (var i = 0; i < container.groupItems.length; i++) {
                    var g = container.groupItems[i];
                    try {
                        if (isPriceGroupName(g.name)) arr.push(g);
                    } catch (e1) {}
                    collectAllPriceGroupsRecursive(g, arr);
                }
            }
        } catch (e2) {}

        try {
            if (container.layers && container.layers.length) {
                for (var l = 0; l < container.layers.length; l++) {
                    collectAllPriceGroupsRecursive(container.layers[l], arr);
                }
            }
        } catch (e3) {}
    }

    function isPriceGroupName(name) {
        return PRICE_GROUP_LOOKUP[name] === true;
    }

    // =========================
    // CÓPIA DO LAYOUT BASE
    // =========================
    function getStableBounds(item) {
        try {
            var gb = item.geometricBounds;
            if (gb && gb.length >= 4) return gb;
        } catch (e) {}

        try {
            var vb = item.visibleBounds;
            if (vb && vb.length >= 4) return vb;
        } catch (e2) {}

        throw new Error("Não foi possível ler os limites de um item do layout base.");
    }

    function collectTopLevelItems(layer) {
        var arr = [];
        collectTopLevelItemsRecursive(layer, arr);
        return arr;
    }

    function collectTopLevelItemsRecursive(layer, arr) {
        try {
            for (var i = 0; i < layer.pageItems.length; i++) {
                var item = layer.pageItems[i];
                if (item.parent && item.parent.typename === "Layer" && item.parent.name === layer.name) {
                    arr.push(item);
                }
            }
        } catch (e) {}

        try {
            for (var j = 0; j < layer.layers.length; j++) {
                collectTopLevelItemsRecursive(layer.layers[j], arr);
            }
        } catch (e2) {}
    }

    function getVisibleBoundsOrNull(item) {
        try {
            var b = item.visibleBounds;
            if (b && b.length >= 4) return b;
        } catch (e) {}
        return null;
    }

    function getOwnershipBoundsOrNull(item) {
        var maskBounds = getClippingMaskBoundsOrNull(item);
        if (maskBounds) return maskBounds;
        return getVisibleBoundsOrNull(item);
    }

    function getPositionAnchorBoundsOrNull(item) {
        var maskBounds = getClippingMaskBoundsOrNull(item);
        if (maskBounds) return maskBounds;

        try {
            var geometricBounds = item.geometricBounds;
            if (geometricBounds && geometricBounds.length >= 4) return geometricBounds;
        } catch (geometricErr) {}

        return getVisibleBoundsOrNull(item);
    }

    function getClippingMaskBoundsOrNull(item) {
        if (!item) return null;

        try {
            if (item.typename === "GroupItem" && item.clipped === true) {
                for (var i = 0; i < item.pathItems.length; i++) {
                    try {
                        if (item.pathItems[i].clipping === true) {
                            return getStableBounds(item.pathItems[i]);
                        }
                    } catch (maskErr) {}
                }
            }
        } catch (groupErr) {}

        return null;
    }

    function chooseSourceArtboard(bounds, storyRect, feedRect) {
        var storyArea = getIntersectionArea(bounds, storyRect);
        var feedArea = getIntersectionArea(bounds, feedRect);

        if (storyArea <= 0 && feedArea <= 0) return null;
        if (storyArea > feedArea) return "story";
        if (feedArea > storyArea) return "feed";

        var centerX = (bounds[0] + bounds[2]) / 2;
        var centerY = (bounds[1] + bounds[3]) / 2;
        if (pointInsideRect(centerX, centerY, storyRect)) return "story";
        if (pointInsideRect(centerX, centerY, feedRect)) return "feed";
        return "story";
    }

    function getIntersectionArea(bounds, rect) {
        var left = Math.max(bounds[0], rect[0]);
        var top = Math.min(bounds[1], rect[1]);
        var right = Math.min(bounds[2], rect[2]);
        var bottom = Math.max(bounds[3], rect[3]);
        var width = right - left;
        var height = top - bottom;
        if (width <= 0 || height <= 0) return 0;
        return width * height;
    }

    function pointInsideRect(x, y, rect) {
        return x >= rect[0] && x <= rect[2] && y <= rect[1] && y >= rect[3];
    }

    function boundsIntersectRect(b, rect) {
        if (!b || b.length < 4) return false;

        var separated = (b[2] < rect[0] || b[0] > rect[2] || b[3] > rect[1] || b[1] < rect[3]);
        return !separated;
    }

    function itemIntersectsRect(item, rect) {
        return boundsIntersectRect(getVisibleBoundsOrNull(item), rect);
    }

    function isPriceGroupItem(item) {
        var name = "";
        try { name = item.name || ""; } catch (e) {}
        return isPriceGroupName(name);
    }

    // =========================
    // TAGS DE TEXTO
    // =========================
    function collectTextFramesRecursive(container, result) {
        if (!container) return;

        var typename = "";
        try { typename = container.typename; } catch (e) {}

        if (typename === "TextFrame") {
            result.push(container);
            return;
        }

        try {
            if (container.textFrames && container.textFrames.length) {
                for (var i = 0; i < container.textFrames.length; i++) {
                    result.push(container.textFrames[i]);
                }
            }
        } catch (e2) {}

        try {
            if (container.groupItems && container.groupItems.length) {
                for (var g = 0; g < container.groupItems.length; g++) {
                    collectTextFramesRecursive(container.groupItems[g], result);
                }
            }
        } catch (e3) {}

        try {
            if (container.layers && container.layers.length) {
                for (var l = 0; l < container.layers.length; l++) {
                    collectTextFramesRecursive(container.layers[l], result);
                }
            }
        } catch (e4) {}
    }

    function uniqueTextFrames(arr) {
        var unique = [];
        for (var i = 0; i < arr.length; i++) {
            var exists = false;
            for (var j = 0; j < unique.length; j++) {
                if (unique[j] === arr[i]) {
                    exists = true;
                    break;
                }
            }
            if (!exists) unique.push(arr[i]);
        }
        return unique;
    }

    function applyTagDataToTextFrame(tf, tagData) {
        var frameName = "";
        var content = "";

        try { frameName = tf.name || ""; } catch (e) {}
        try { content = tf.contents || ""; } catch (e2) {}

        var normalizedFrameName = normalizeTagValue(frameName);
        var normalizedContent = normalizeTagValue(content);

        for (var i = 0; i < TEXT_TAGS.length; i++) {
            var exactTag = TEXT_TAGS[i];
            var replacement = tagData[exactTag];
            if (replacement === undefined || replacement === null) continue;

            if (normalizedFrameName === TAG_NORMALIZED_CACHE[exactTag] || normalizedContent === TAG_NORMALIZED_CACHE[exactTag]) {
                safeSetTextContents(tf, replacement);
                return;
            }
        }

        var replacedContent = replaceAllTagTokens(content, tagData);
        if (replacedContent !== content) {
            safeSetTextContents(tf, replacedContent);
        }
    }

    function safeSetTextContents(tf, value) {
        try {
            tf.contents = value;
        } catch (e) {}
    }

    function normalizeTagValue(value) {
        var s = String(value || "").toLowerCase();
        s = s.replace(/^\s+|\s+$/g, "");
        s = s.replace(/^\{\{\s*/, "");
        s = s.replace(/\s*\}\}$/, "");
        s = s.replace(/^\{\s*/, "");
        s = s.replace(/\s*\}$/, "");
        s = s.replace(/^<\s*/, "");
        s = s.replace(/\s*>$/, "");
        s = s.replace(/^\[\s*/, "");
        s = s.replace(/\s*\]$/, "");
        s = s.replace(/\s+/g, "");
        return s;
    }

    function buildValueLookup(values) {
        var lookup = {};
        for (var i = 0; i < values.length; i++) {
            lookup[values[i]] = true;
        }
        return lookup;
    }

    function buildTagPatternCache(tags) {
        var cache = {};
        for (var i = 0; i < tags.length; i++) {
            var safeTag = escapeRegExp(String(tags[i]));
            cache[tags[i]] = [
                new RegExp("\\{\\{\\s*" + safeTag + "\\s*\\}\\}", "gi"),
                new RegExp("\\{\\s*" + safeTag + "\\s*\\}", "gi"),
                new RegExp("<\\s*" + safeTag + "\\s*>", "gi"),
                new RegExp("\\[\\s*" + safeTag + "\\s*\\]", "gi")
            ];
        }
        return cache;
    }

    function buildNormalizedTagCache(tags) {
        var cache = {};
        for (var i = 0; i < tags.length; i++) {
            cache[tags[i]] = normalizeTagValue(tags[i]);
        }
        return cache;
    }

    function replaceAllTagTokens(text, tagData) {
        if (text === undefined || text === null) return text;

        var out = String(text);

        for (var t = 0; t < TEXT_TAGS.length; t++) {
            var tag = TEXT_TAGS[t];
            var replacement = tagData[tag];
            if (replacement === undefined || replacement === null) continue;

            var patterns = TAG_PATTERN_CACHE[tag];
            var safeReplacement = escapeReplacementValue(replacement);

            for (var i = 0; i < patterns.length; i++) {
                try { patterns[i].lastIndex = 0; } catch (e) {}
                out = out.replace(patterns[i], safeReplacement);
            }
        }

        return out;
    }

    function applyTextTagsToFrames(frames, tagData) {
        if (!frames) return;
        for (var i = 0; i < frames.length; i++) {
            applyTagDataToTextFrame(frames[i], tagData);
        }
    }

    function collectTextFramesFromItems(items) {
        var result = [];
        if (!items) return result;

        for (var i = 0; i < items.length; i++) {
            collectTextFramesRecursive(items[i], result);
        }

        return uniqueTextFrames(result);
    }

    function addSelectedPriceGroupToArtboardFast(priceGroupArtCache, priceGroupFallbackCache, targetTxtLayer, anchorBounds, priceGroupName) {
        if (!priceGroupName) return null;

        var sourceGroup = null;
        try { sourceGroup = priceGroupArtCache[priceGroupName] || priceGroupFallbackCache[priceGroupName]; } catch (e) {}
        if (!sourceGroup || !anchorBounds) return null;

        try {
            var dup = sourceGroup.duplicate(targetTxtLayer, ElementPlacement.PLACEATBEGINNING);
            var dupBounds = getStableBounds(dup);

            var desiredLeft = anchorBounds[2] + PRICE_GROUP_GAP;
            var desiredTop = anchorBounds[1];

            dup.translate(desiredLeft - dupBounds[0], desiredTop - dupBounds[1]);
            return dup;
        } catch (e2) {}

        return null;
    }

    function findTagAnchorBoundsFromFrames(frames) {
        var tagFrames = [];
        if (!frames) return null;

        for (var i = 0; i < frames.length; i++) {
            if (isTagFrame(frames[i])) tagFrames.push(frames[i]);
        }

        if (tagFrames.length === 0) return null;
        return getUnionBounds(tagFrames);
    }

    function isTagFrame(tf) {
        var frameName = "";
        var content = "";

        try { frameName = tf.name || ""; } catch (e) {}
        try { content = tf.contents || ""; } catch (e2) {}

        var normalizedFrameName = normalizeTagValue(frameName);
        var normalizedContent = normalizeTagValue(content);

        for (var i = 0; i < PRICE_ANCHOR_TAGS.length; i++) {
            var tag = PRICE_ANCHOR_TAGS[i];
            if (normalizedFrameName === ANCHOR_TAG_NORMALIZED_CACHE[tag]) return true;
            if (normalizedContent === ANCHOR_TAG_NORMALIZED_CACHE[tag]) return true;
            if (hasTagToken(content, tag)) return true;
        }
        return false;
    }

    function hasTagToken(text, tag) {
        if (text === undefined || text === null) return false;

        var patterns = TAG_PATTERN_CACHE[tag];
        if (!patterns) return false;

        var value = String(text);
        for (var i = 0; i < patterns.length; i++) {
            try { patterns[i].lastIndex = 0; } catch (e) {}
            if (patterns[i].test(value)) return true;
        }
        return false;
    }

    function getUnionBounds(items) {
        if (!items || items.length === 0) return null;

        var first = getStableBounds(items[0]);
        var left = first[0];
        var top = first[1];
        var right = first[2];
        var bottom = first[3];

        for (var i = 1; i < items.length; i++) {
            var b = getStableBounds(items[i]);
            if (b[0] < left) left = b[0];
            if (b[1] > top) top = b[1];
            if (b[2] > right) right = b[2];
            if (b[3] < bottom) bottom = b[3];
        }

        return [left, top, right, bottom];
    }

    // =========================
    // IMAGEM DO PRODUTO + MÁSCARA
    // =========================
    // Quadro verde neon do tamanho da prancheta, no lugar da foto que falta.
    function placeMissingPhotoBox(doc, layer, artRect, groupName) {
        var left = artRect[0];
        var top = artRect[1];
        var width = Math.abs(artRect[2] - artRect[0]);
        var height = Math.abs(artRect[1] - artRect[3]);
        doc.activeLayer = layer;
        var box = layer.pathItems.rectangle(top, left, width, height);
        var color = new RGBColor();
        color.red = MISSING_PHOTO_RGB[0];
        color.green = MISSING_PHOTO_RGB[1];
        color.blue = MISSING_PHOTO_RGB[2];
        box.filled = true;
        box.fillColor = color;
        box.stroked = false;
        box.name = limitText("SEM FOTO - " + groupName, 90);
    }

    // framing (opcional): [x, y, largura] da foto em frações da prancheta (memória de enquadramento).
    function placeImageWithClipping(doc, layer, imageFile, artRect, groupName, framing) {
        var left = artRect[0];
        var top = artRect[1];
        var width = Math.abs(artRect[2] - artRect[0]);
        var height = Math.abs(artRect[1] - artRect[3]);

        doc.activeLayer = layer;

        var group = layer.groupItems.add();
        group.name = limitText("foto - " + groupName, 90);

        var placed = layer.placedItems.add();
        placed.file = imageFile;
        placed.name = limitText("produto - " + groupName, 90);

        if (FORCE_IMAGE_REDRAW) {
            try { app.redraw(); } catch (redrawErr) {}
        }

        var imgW = placed.width;
        var imgH = placed.height;

        if (imgW === 0 || imgH === 0) {
            try { app.redraw(); } catch (redrawFallbackErr) {}
            imgW = placed.width;
            imgH = placed.height;
        }

        if (imgW === 0 || imgH === 0) {
            throw new Error("Não foi possível ler as dimensões da imagem: " + safeDecode(imageFile.name));
        }

        var scale = Math.max(width / imgW, height / imgH) * 100;
        placed.resize(scale, scale);

        placed.left = left + ((width - placed.width) / 2);
        placed.top = top - ((height - placed.height) / 2);

        if (framing && framing.length >= 3 && framing[2] > 0) {
            var fk = (framing[2] * width) / placed.width * 100;
            // Nunca deixar a foto menor que a prancheta (sobraria fundo vazio).
            var minK = Math.max(width / placed.width, height / placed.height) * 100;
            if (fk < minK) fk = minK;
            placed.resize(fk, fk);
            placed.left = left + framing[0] * width;
            placed.top = top - framing[1] * height;
            if (placed.left > left) placed.left = left;
            if (placed.top < top) placed.top = top;
            if (placed.left + placed.width < left + width) placed.left = left + width - placed.width;
            if (placed.top - placed.height > top - height) placed.top = top - height + placed.height;
        }

        var mask = layer.pathItems.rectangle(top, left, width, height);
        mask.name = limitText("máscara - " + groupName, 90);
        mask.stroked = false;
        mask.filled = false;
        mask.clipping = true;

        placed.move(group, ElementPlacement.PLACEATEND);
        mask.move(group, ElementPlacement.PLACEATBEGINNING);

        group.clipped = true;

        if (EMBED_IMAGES) {
            try {
                placed.embed();
            } catch (embedErr) {}
        }
    }

})();
