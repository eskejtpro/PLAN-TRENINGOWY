$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
foreach ($folder in @('npm-cache','electron-cache','builder-cache','tmp')) {
    New-Item -ItemType Directory -Force -Path (Join-Path $projectRoot "build\$folder") | Out-Null
}
$env:npm_config_cache = Join-Path $projectRoot 'build\npm-cache'
$env:ELECTRON_CACHE = Join-Path $projectRoot 'build\electron-cache'
$env:ELECTRON_BUILDER_CACHE = Join-Path $projectRoot 'build\builder-cache'
$env:TEMP = Join-Path $projectRoot 'build\tmp'
$env:TMP = $env:TEMP
Push-Location $PSScriptRoot
try {
    npm ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
    node node_modules/electron/install.js
    if ($LASTEXITCODE -ne 0) { throw 'Electron download failed' }
    npm run dist
    if ($LASTEXITCODE -ne 0) { throw 'Desktop build failed' }
} finally { Pop-Location }
