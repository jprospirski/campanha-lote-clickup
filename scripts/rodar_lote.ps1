# Gera a PRÓXIMA campanha pendente de um lote JSON no Illustrator (uma por execução).
# Uso:
#   powershell -ExecutionPolicy Bypass -File .\rodar_lote.ps1 -Json ".\lote - Prorrogação Black.json"
# Depois de revisar, salvar e fechar o arquivo no Illustrator, rode de novo para a próxima.
param(
    [Parameter(Mandatory = $true)][string]$Json,
    [string]$Script = ""
)

$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
if (-not $Script) { $Script = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "gerador_campanhas_v3.jsx" }
$jsonPath   = (Resolve-Path -LiteralPath $Json).Path -replace '\\', '/'
$scriptPath = (Resolve-Path -LiteralPath $Script).Path -replace '\\', '/'

# Escapa aspas simples para embutir os caminhos no JavaScript.
$jsJson   = $jsonPath -replace "'", "\'"
$jsScript = $scriptPath -replace "'", "\'"

$code = @"
`$.global.LOTE_AUTO = { json: '$jsJson' };
`$.global.LOTE_AUTO_RESULT = '';
`$.evalFile(new File('$jsScript'));
`$.global.LOTE_AUTO_RESULT;
"@

$inicio = Get-Date
$ai = New-Object -ComObject Illustrator.Application
$resultado = $ai.DoJavaScript($code)

Write-Output $resultado
Write-Output ("`nTempo: {0:n0}s" -f ((Get-Date) - $inicio).TotalSeconds)
