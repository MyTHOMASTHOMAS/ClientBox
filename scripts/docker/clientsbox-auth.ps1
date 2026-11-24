# ==============================================================================
# clientsbox-auth.ps1 — Initialisation de l'authentification et approbation CLI
# ==============================================================================
# Ouvre un conteneur interactif avec montage miroir du dossier de travail actuel
# et du volume nommé 'clientsbox-cli-auth' pour authentifier et approuver
# manuellement les 4 CLI (Cursor, Claude, Antigravity, Codex) dans le workspace.
# ==============================================================================
$ErrorActionPreference = "Stop"

$ImageName  = if ($env:CLIENTSBOX_IMAGE) { $env:CLIENTSBOX_IMAGE } else { "clientsbox:latest" }
$AuthVolume = "clientsbox-cli-auth"
$HostDir       = (Get-Location).Path
$HostDirDocker = $HostDir -replace '\\', '/'

# Conversion du chemin Windows (C:\dossier) en chemin POSIX pour le conteneur (/c/dossier)
if ($HostDir -match '^([A-Za-z]):(.*)$') {
    $ContainerDir = "/" + $Matches[1].ToLower() + ($Matches[2] -replace '\\', '/')
} else {
    $ContainerDir = "/" + ($HostDir.TrimStart('\') -replace '\\', '/')
}
$ContainerDir = $ContainerDir.TrimEnd('/')
if (-not $ContainerDir) { $ContainerDir = "/" }

Write-Host "=============================================================================="
Write-Host " ClientsBox — Authentification & Approbation de Workspace CLI"
Write-Host "=============================================================================="
Write-Host ""
Write-Host "Ce conteneur interactif est ouvert directement dans votre dossier actuel :"
Write-Host "  Hôte      : $HostDir"
Write-Host "  Conteneur : $ContainerDir"
Write-Host ""
Write-Host "Le volume persistant '$AuthVolume' est monté sur /root."
Write-Host "Vous pouvez vous connecter et approuver manuellement chaque CLI :"
Write-Host ""
Write-Host "  1. Cursor CLI      : cursor-agent          (validez pour approuver ce dossier)"
Write-Host "                       cursor-agent login   (pour vous connecter avec votre compte)"
Write-Host "  2. Claude CLI      : claude login"
Write-Host "  3. Antigravity CLI : agy auth"
Write-Host "  4. Codex CLI       : codex login"
Write-Host ""
Write-Host "Tapez 'exit' une fois terminé."
Write-Host "Toutes les autorisations et jetons sont conservés dans '$AuthVolume'."
Write-Host "=============================================================================="
Write-Host ""

# Création du volume s'il n'existe pas
$prevPref = $ErrorActionPreference
$ErrorActionPreference = "Continue"
docker volume inspect $AuthVolume *> $null
$volumeExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevPref

if (-not $volumeExists) {
    Write-Host "[ClientsBox] Création du volume '$AuthVolume'..."
    docker volume create $AuthVolume | Out-Null
}

$DockerArgs = @(
    "--rm"
    "-it"
    "--entrypoint", "bash"
    "-e", "IS_SANDBOX=1"
    "-v", "${AuthVolume}:/root"
    "-v", "${HostDirDocker}:${ContainerDir}"
    "-w", $ContainerDir
)

# Montage optionnel de la configuration Git et des clés SSH hôte en lecture seule
$GitConfig = Join-Path $env:USERPROFILE ".gitconfig"
if (Test-Path -LiteralPath $GitConfig -PathType Leaf) {
    $GitConfigDocker = $GitConfig -replace '\\', '/'
    $DockerArgs += "-v", "${GitConfigDocker}:/root/.gitconfig:ro"
}

$SshDir = Join-Path $env:USERPROFILE ".ssh"
if (Test-Path -LiteralPath $SshDir -PathType Container) {
    $SshDirDocker = $SshDir -replace '\\', '/'
    $DockerArgs += "-v", "${SshDirDocker}:/root/.ssh:ro"
}

# Masquage de env/.env hôte avec un fichier vide en lecture seule (équivalent /dev/null)
$HostEnvFile = Join-Path $HostDir "env\.env"
if (Test-Path -LiteralPath $HostEnvFile -PathType Leaf) {
    $EmptyEnvFile = Join-Path $env:TEMP "clientsbox-empty.env"
    if (-not (Test-Path -LiteralPath $EmptyEnvFile)) {
        New-Item -Path $EmptyEnvFile -ItemType File -Force | Out-Null
    } else {
        Clear-Content -LiteralPath $EmptyEnvFile
    }
    $EmptyEnvFileDocker = $EmptyEnvFile -replace '\\', '/'
    $DockerArgs += "-v", "${EmptyEnvFileDocker}:${ContainerDir}/env/.env:ro"
}

& docker run @DockerArgs $ImageName
exit $LASTEXITCODE