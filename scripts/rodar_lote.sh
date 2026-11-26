#!/bin/bash
# Gera as campanhas pendentes de um lote JSON no Illustrator (macOS, via AppleScript).
# Equivalente ao rodar_lote.ps1 do Windows.
# Uso:
#   bash ./rodar_lote.sh --json "./lote - Prorrogação Black.json"
#   bash ./rodar_lote.sh "./lote - Prorrogação Black.json"          (forma curta)
# Opcional: --script "/caminho/gerador_campanhas_v3.jsx" (padrão: ao lado deste arquivo)
set -euo pipefail

JSON=""
SCRIPT=""
while [ $# -gt 0 ]; do
    case "$1" in
        --json|-Json|-json) JSON="${2:-}"; shift 2 ;;
        --script|-Script|-script) SCRIPT="${2:-}"; shift 2 ;;
        *) if [ -z "$JSON" ]; then JSON="$1"; shift; else echo "Argumento desconhecido: $1" >&2; exit 2; fi ;;
    esac
done

if [ -z "$JSON" ]; then
    echo "Uso: bash rodar_lote.sh --json \"./lote - <Campanha>.json\"" >&2
    exit 2
fi

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[ -n "$SCRIPT" ] || SCRIPT="$here/gerador_campanhas_v3.jsx"

abspath() { (cd "$(dirname "$1")" && printf '%s/%s' "$(pwd)" "$(basename "$1")"); }

[ -f "$JSON" ]   || { echo "STATUS: BLOQUEADO"; echo "JSON não encontrado: $JSON"; exit 1; }
[ -f "$SCRIPT" ] || { echo "STATUS: BLOQUEADO"; echo "Script não encontrado: $SCRIPT"; exit 1; }

jsonPath="$(abspath "$JSON")"
scriptPath="$(abspath "$SCRIPT")"

# Escapa \ e ' para embutir os caminhos em strings JavaScript de aspas simples.
jsEscape() { printf '%s' "$1" | sed -e "s/\\\\/\\\\\\\\/g" -e "s/'/\\\\'/g"; }
jsJson="$(jsEscape "$jsonPath")"
jsScript="$(jsEscape "$scriptPath")"

code="\$.global.LOTE_AUTO = { json: '$jsJson' };
\$.global.LOTE_AUTO_RESULT = '';
\$.evalFile(new File('$jsScript'));
\$.global.LOTE_AUTO_RESULT;"

inicio=$(date +%s)

# O código vai como argumento (argv), sem passar por aspas do AppleScript.
# "with timeout" evita o limite padrão de 2 min dos Apple Events em lotes grandes.
resultado="$(osascript - "$code" <<'APPLESCRIPT'
on run argv
    set jsCode to item 1 of argv
    with timeout of 7200 seconds
        tell application id "com.adobe.illustrator"
            set r to do javascript jsCode
        end tell
    end timeout
    if r is missing value then return ""
    return r as text
end run
APPLESCRIPT
)"

echo "$resultado"
echo
echo "Tempo: $(( $(date +%s) - inicio ))s"
