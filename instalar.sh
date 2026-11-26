#!/bin/bash
# Instala ou atualiza a skill campanha-lote-clickup no Claude Code (macOS).
# Uso: abrir o Terminal e colar:
#   curl -fsSL https://raw.githubusercontent.com/jprospirski/campanha-lote-clickup/main/instalar.sh | bash
set -e
REPO="https://github.com/jprospirski/campanha-lote-clickup.git"
DEST="$HOME/.claude/skills/campanha-lote-clickup"
ok(){ printf "  \033[32m✓\033[0m %s\n" "$1"; }
falta(){ printf "  \033[31m✗\033[0m %s\n" "$1"; PROBLEMAS=1; }
PROBLEMAS=0

echo "== Skill de campanhas em lote =="

if ! xcode-select -p >/dev/null 2>&1; then
  echo "O macOS vai pedir para instalar as 'Ferramentas de linha de comando'. Clique em Instalar,"
  echo "espere terminar e rode este comando de novo."
  xcode-select --install || true
  exit 1
fi

mkdir -p "$HOME/.claude/skills"
if [ -d "$DEST/.git" ]; then
  git -C "$DEST" pull --ff-only -q && ok "Skill atualizada"
elif [ -e "$DEST" ]; then
  echo "Já existe $DEST e não é uma instalação desta skill. Renomeie essa pasta e rode de novo."; exit 1
else
  git clone -q "$REPO" "$DEST" && ok "Skill instalada em $DEST"
fi

echo
echo "Conferindo o computador:"
ls -d /Applications/Adobe\ Illustrator*/ >/dev/null 2>&1 && ok "Adobe Illustrator" || falta "Adobe Illustrator não encontrado em Aplicativos"
command -v claude >/dev/null 2>&1 && ok "Claude Code" || falta "Claude Code não encontrado (instale em https://claude.com/claude-code)"
CB=$(find "$HOME/Library/CloudStorage" -maxdepth 6 -type d -name "campanhas base" -path "*_Materiais Gerais - Anjos*" 2>/dev/null | grep -v "(" | head -1)
if [ -n "$CB" ]; then ok "Google Drive: pasta campanhas base encontrada"
  [ -f "$CB/_Skill campanhas em lote/campanhas.md" ] && ok "Cadastro de campanhas (campanhas.md)" || falta "campanhas.md não encontrado em '_Skill campanhas em lote'"
else falta "Pasta '_Materiais Gerais - Anjos/campanhas base' não encontrada. Instale o Google Drive para desktop e entre na conta da Ampliar"; fi

echo
if [ "$PROBLEMAS" = 0 ]; then echo "Tudo pronto. Confira se as fontes Humanist 521 BT (Light e Bold) estão ativas no Illustrator."
  echo "Feche e abra o Claude Code e mande: /campanha-lote-clickup <IDs dos cards>"
else echo "Resolva os itens com ✗ e rode este comando de novo."; fi
