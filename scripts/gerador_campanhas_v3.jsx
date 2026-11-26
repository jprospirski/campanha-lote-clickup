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
    - Automático (PowerShell, sem janelas): rodar_lote.ps1 define $.global.LOTE_AUTO.
      Gera em sequência todas as campanhas pendentes (gera, salva, fecha, próxima)
      e devolve um resumo: STATUS, GERADAS, PENDÊNCIAS, ERROS e JÁ EXISTIAM.
      Cliente com pendência é pulado; os demais são gerados.

    FORMATO DO JSON (modo lote)
    {
      "campanha": "Prorrogação Black",
      "pasta_fotos": "Fotos - Fundo loja",          // relativo à pasta do JSON ou absoluto
      "arquivo_base": "Fotos - Fundo loja/CP base - X.ai", // opcional (padrão: "CP base*" da pasta_fotos)
      "pasta_saida": "Campanhas geradas",            // opcional (padrão: <pasta do JSON>/Campanhas geradas)
      "clientes": [
        {
          "cliente": "Anjos Caxias do Sul",
          "clickup_id": "17txe6ym9ap",               // opcional, só para o relatório
          "pasta_saida": "G:/Meu Drive/.../02 - Editáveis Campanhas/12 DEZ - Prorrogação Black",
                                                     // opcional; a pasta-mãe tem de existir, a última é criada
          "produtos": [
            {
              "foto": "Differenza Casal.png",        // nome do arquivo na pasta_fotos (extensão opcional)
              "nome": "Differenza",                  // opcional (padrão: nome do arquivo sem tamanho/AZUL)
              "categoria": "Conjunto Box",
              "tamanho": "Casal",                    // Solteiro | Solteirão | Casal | Queen | King | Neutro
                                                     // vazio/ausente = card sem tamanho: o bloco "Tamanho:" é removido
              "medida": "",                          // obrigatório só no tamanho Neutro
              "beneficios": ["Molas ensacadas", "Conforto na medida certa"],
                                                     // até 3 (lista ou "A | B"); vazio/ausente = remove os marcadores
              "preco": "parcelado",                  // a_vista | oferta | parcelado | desconto
              "V_DE": "3399",                        // só número inteiro, sem centavos
              "V_X": "18X",                          // número + X maiúsculo
              "V_parcela": "115",                    // só número inteiro
              "V_total": "2070",                     // só número inteiro
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

    // Marcadores de benefício do CP base: texto de exemplo de cada linha (pílula + ponto + texto).
    var BENEFIT_PLACEHOLDER = "Para que busca conforto";
    var MAX_BENEFITS = 3;

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

    // Modo automático (PowerShell / COM): defina antes de rodar
    //   $.global.LOTE_AUTO = { json: "C:/caminho/lote.json" };
    // O script pula janelas e confirmações, gera a próxima campanha pendente
    // e devolve o resultado em $.global.LOTE_AUTO_RESULT (texto).
    var AUTO = null;
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
                priceGroupTags: detectPriceGroupTags(priceGroupCache)
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
    function generateCampaignDocument(ctx, selectedItems) {
        prepareSelectedItems(selectedItems);

        var targetDoc = createTargetDocument(selectedItems);

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
                fillArtboardText(ctx, ctx.priceGroupCache.story, targetLayerMap, storyDupMap, selectedItem, productTagData);

                var feedDupMap = duplicateLayoutFromCache(ctx.sourceLayoutCache.feed, targetLayerMap, ctx.sourceFeedRect, feedRect);
                fillArtboardText(ctx, ctx.priceGroupCache.feed, targetLayerMap, feedDupMap, selectedItem, productTagData);

                placeImageWithClipping(targetDoc, targetLayerMap["fotos"], productFile, storyRect, productName + " - Story");
                placeImageWithClipping(targetDoc, targetLayerMap["fotos"], productFile, feedRect, productName + " - Feed");
            }
        } catch (genErr) {
            genErr.targetDoc = targetDoc;
            throw genErr;
        }

        return targetDoc;
    }

    // =========================
    // MODO LOTE (JSON)
    // =========================
    function runBatchMode() {
        var jsonFile = AUTO ? new File(AUTO.json) : File.openDialog("Selecione o arquivo JSON do lote", "JSON:*.json,Todos:*.*", false);
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
            "Campanha: " + plan.campanha + "\n" +
            "CP base: " + safeDecode(plan.baseFile.name) + "\n" +
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
            ctx = openBaseContext(plan.baseFile);
        } catch (baseErr) {
            restoreIllustratorAlerts(uiState);
            notify("Erro ao abrir o CP base:\n\n" + baseErr.message);
            return;
        }

        // Segunda validação: com o CP base aberto, confere se cada produto
        // preencheu todas as tags que existem no grupo de preço escolhido.
        var tagErrors = validatePriceTagsAgainstBase(job.items, ctx.priceGroupTags);
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
            targetDoc = generateCampaignDocument(ctx, job.items);
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

        if (toRun.length > 0) {
            var uiState = suppressIllustratorAlerts();
            var ctx = null;

            try {
                ctx = openBaseContext(plan.baseFile);
            } catch (baseErr) {
                for (var b = 0; b < toRun.length; b++) failed.push({ job: toRun[b], message: "Erro ao abrir o CP base: " + baseErr.message });
                toRun = [];
            }

            for (var r = 0; r < toRun.length; r++) {
                var job = toRun[r];

                var tagErrors = validatePriceTagsAgainstBase(job.items, ctx.priceGroupTags);
                if (tagErrors.length > 0) {
                    pending.push({ job: job, errors: tagErrors.concat([describePriceGroupTags(ctx.priceGroupTags)]) });
                    continue;
                }

                var targetDoc = null;
                var saved = false;
                try {
                    ensureOutputFolder(job.client.outFolder);
                    targetDoc = generateCampaignDocument(ctx, job.items);
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
        lines.push("Campanha: " + plan.campanha + " | CP base: " + safeDecode(plan.baseFile.name));

        if (generated.length) {
            lines.push("");
            lines.push("GERADAS (" + generated.length + "):");
            for (var g = 0; g < generated.length; g++) {
                lines.push("- " + generated[g].label + " (" + generated[g].items.length + " produtos) -> " + generated[g].outFile.fsName);
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
                var baseName = client.arquivo || (clientName + " - " + plan.campanha);
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

        plan.campanha = trimText(data.campanha) || "Campanha";
        checkPending("campanha", data.campanha, plan.errors);

        // Pasta das fotos
        var fotosPath = trimText(data.pasta_fotos);
        plan.fotosFolder = fotosPath ? resolveFolder(fotosPath, jsonFolder) : jsonFolder;
        if (!plan.fotosFolder || !plan.fotosFolder.exists) {
            plan.errors.push("pasta_fotos não encontrada: " + fotosPath);
            return plan;
        }

        // CP base
        var basePath = trimText(data.arquivo_base);
        if (basePath) {
            plan.baseFile = resolveFile(basePath, jsonFolder);
            if (!plan.baseFile || !plan.baseFile.exists) {
                plan.errors.push("arquivo_base não encontrado: " + basePath);
            }
        } else {
            plan.baseFile = findBaseFile(plan.fotosFolder);
            if (!plan.baseFile) plan.errors.push('Não encontrei nenhum arquivo "CP base" em ' + plan.fotosFolder.fsName + ' (ou informe "arquivo_base").');
        }

        // Saída
        // Padrão do lote; cada cliente pode ter a própria "pasta_saida" (ex.: pasta do Drive).
        var outPath = trimText(data.pasta_saida);
        plan.outFolder = outPath ? resolveFolder(outPath, jsonFolder) : new Folder(jsonFolder.fsName + "/Campanhas geradas");
        plan.logFile = new File(jsonFolder.fsName + "/relatorio_lote.txt");

        // Por padrão o lote incorpora as imagens ao salvar ("incorporar_imagens": false desliga).
        plan.embed = data.incorporar_imagens !== false;

        // Fotos disponíveis
        var imageFiles = getImageFiles(plan.fotosFolder);
        if (imageFiles.length === 0) plan.errors.push("Nenhuma imagem encontrada em " + plan.fotosFolder.fsName);

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
                outFolder: plan.outFolder,
                items: [],
                errors: []
            };

            // O nome do cliente é obrigatório: ele vai no nome do arquivo salvo.
            if (!clientName) plan.errors.push(clientLabel + ": campo \"cliente\" vazio (ele é usado no nome do arquivo).");
            checkPending(clientLabel + " > cliente", rawClient.cliente, plan.errors);
            checkPending(clientLabel + " > arquivo", rawClient.arquivo, client.errors);

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
        var fotoName = trimText(raw.foto);
        var fileRef = null;
        if (!fotoName) {
            errors.push(label + ": campo \"foto\" vazio.");
        } else {
            var match = findImageByName(imageFiles, fotoName);
            if (match.error) errors.push(label + ": " + match.error);
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
        var priceGroup = matchOption(String(priceRaw === undefined || priceRaw === null ? "" : priceRaw).replace(/\s+/g, "_"), PRICE_GROUP_OPTIONS);
        if (!priceGroup) errors.push(label + ": preço inválido \"" + trimText(priceRaw) + "\". Use: " + PRICE_GROUP_OPTIONS.join(", "));

        // Valores manuais no formato padronizado
        var values = createEmptyManualValues();
        values.V_DE = normalizeIntegerValue(raw.V_DE, label + " > V_DE", errors);
        values.V_X = normalizeInstallmentsValue(raw.V_X, label + " > V_X", errors);
        values.V_parcela = normalizeIntegerValue(raw.V_parcela, label + " > V_parcela", errors);
        values.V_total = normalizeIntegerValue(raw.V_total, label + " > V_total", errors);
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
            priceGroup: priceGroup,
            manualValues: values,
            label: label
        };
    }

    function validatePriceTagsAgainstBase(items, priceGroupTags) {
        var errors = [];

        for (var i = 0; i < items.length; i++) {
            var item = items[i];
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

            if (missing.length > 0) {
                errors.push(item.label + ": o grupo \"" + item.priceGroup + "\" usa " + missing.join(", ") + ", mas está vazio no JSON.");
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
        if (matches.length > 1) return { error: "foto \"" + wanted + "\" é ambígua (várias extensões); informe a extensão." };
        return { error: "foto \"" + wanted + "\" não encontrada na pasta_fotos." };
    }

    function matchOption(value, options) {
        var key = normalizeKey(value);
        if (!key) return null;
        for (var i = 0; i < options.length; i++) {
            if (normalizeKey(options[i]) === key) return options[i];
        }
        return null;
    }

    // Minúsculas, sem acentos e com espaços simples, para comparar nomes.
    function normalizeKey(value) {
        var s = trimText(value).toLowerCase();
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
            file.lineFeed = "Windows";
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
    function fillArtboardText(ctx, priceGroupArtCache, targetLayerMap, dupMap, item, tagData) {
        var frames = collectTextFramesFromItems(dupMap["txt"]);
        var anchorBounds = findTagAnchorBoundsFromFrames(frames);
        var priceGroup = addSelectedPriceGroupToArtboardFast(priceGroupArtCache, ctx.priceGroupCache.fallback, targetLayerMap["txt"], anchorBounds, item.priceGroup);

        if (priceGroup && item.priceGroup === "oferta") {
            fillOfferFrames(priceGroup, item.manualValues ? item.manualValues.V_Oferta_TXT : "");
        }
        if (item.semTamanho) frames = removeSizeBlock(frames);
        if (item.beneficios) applyBenefits(frames, item.beneficios);

        frames = collectLiveFrames(frames);
        if (priceGroup) collectTextFramesRecursive(priceGroup, frames);
        applyTextTagsToFrames(uniqueTextFrames(frames), tagData);
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
    function applyBenefits(frames, list) {
        var placeholders = [];
        for (var i = 0; i < frames.length; i++) {
            var content = "";
            try { content = frames[i].contents || ""; } catch (e) {}
            if (trimText(content) === BENEFIT_PLACEHOLDER) placeholders.push(frames[i]);
        }
        if (placeholders.length === 0) return;

        placeholders.sort(function (a, b) { return getStableBounds(b)[1] - getStableBounds(a)[1]; });

        var parentsToCheck = [];
        for (var k = 0; k < placeholders.length; k++) {
            var tf = placeholders[k];
            if (k < list.length) {
                safeSetTextContents(tf, list[k]);
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
            selectedItems[i].productName = selectedItems[i].productNameOverride || stripVariantFromName(getBaseName(selectedItems[i].fileRef));
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
    function placeImageWithClipping(doc, layer, imageFile, artRect, groupName) {
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
