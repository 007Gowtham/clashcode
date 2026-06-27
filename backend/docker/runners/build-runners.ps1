# PowerShell script to build all Docker runner images for the ClashCode sandbox judge.
# Run this once before starting the backend (or when runners change).
#
# Usage:
#   cd backend
#   powershell -File docker/runners/build-runners.ps1

$ErrorActionPreference = "Stop"
$Prefix = "clashcode"
$RunnersDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "==> Building ClashCode sandbox runner images..."

$languages = @("python", "javascript", "java", "cpp")

foreach ($lang in $languages) {
    $dir = Join-Path $RunnersDir $lang
    $image = "${Prefix}/${lang}:runner"
    Write-Host ""
    Write-Host "--- Building $image from $dir ---"
    docker build -t $image $dir
    Write-Host "--- Done: $image ---"
}

Write-Host ""
Write-Host "All runner images built successfully!"
Write-Host "Images:"
docker images | Select-String "^clashcode/"
