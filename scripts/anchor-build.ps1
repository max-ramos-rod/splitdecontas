$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$homeCandidates = @(
    [Environment]::GetEnvironmentVariable("HOME"),
    [Environment]::GetFolderPath("UserProfile")
) | Where-Object { $_ } | Select-Object -Unique

$userHome = $homeCandidates | Select-Object -First 1
$solanaBin = Join-Path $projectRoot ".tools\solana\solana-release\bin"

$anchorCandidates = @(
    $env:ANCHOR_EXE,
    ($homeCandidates | ForEach-Object { Join-Path $_ ".avm\bin\anchor-1.0.2.exe" }),
    ($homeCandidates | ForEach-Object { Join-Path $_ ".cargo\bin\anchor.exe" })
) | Where-Object { $_ }

$anchorExe = $anchorCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not (Test-Path $solanaBin)) {
    throw "Solana local nao encontrado em $solanaBin"
}

if (-not $anchorExe) {
    throw "Anchor nao encontrado. Defina ANCHOR_EXE ou instale o Anchor 1.0.2."
}

$env:PATH = "$solanaBin;$userHome\.cargo\bin;$env:PATH"
$env:HOME = $userHome
$env:USERPROFILE = $userHome
$env:RUSTUP_HOME = Join-Path $userHome ".rustup"
$env:CARGO_HOME = Join-Path $userHome ".cargo"

& $anchorExe build
