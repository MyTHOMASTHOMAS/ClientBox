# ==============================================================================
# clientsbox-run.ps1 — Mode 2 : Wrapper d'exécution global conteneurisé ClientsBox
# ==============================================================================
# Lance ClientsBox dans un conteneur éphémère (--rm) en montant dynamiquement
# le workspace hôte avec miroir POSIX déterministe (-v "$Host:$Posix" -w "$Posix").
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

# Vérification de l'existence du volume d'authentification
$prevPref = $ErrorActionPreference
$ErrorActionPreference = "Continue"
docker volume inspect $AuthVolume *> $null
$volumeExists = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevPref

if (-not $volumeExists) {
    Write-Host "[ClientsBox] Création du volume Docker d'authentification partagée '$AuthVolume'..."
    docker volume create $AuthVolume | Out-Null
}

# Détection du mode d'exécution (Headless --exec-scene vs Mode Serveur HTTP)
$IsHeadless = $false
foreach ($arg in $args) {
    if ($arg -like "--exec-scene*") {
        $IsHeadless = $true
        break
    }
}

# Options de base du conteneur Docker
$DockerArgs = @(
    "--rm"
    "--init"
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

$HasStdinTty  = -not [Console]::IsInputRedirected
$HasStdoutTty = -not [Console]::IsOutputRedirected

if ($IsHeadless) {
    # Mode Headless : aucun port réseau mappé, allocation interactive conditionnelle
    if ($HasStdinTty -and $HasStdoutTty) {
        $DockerArgs += "-i"
    }
} else {
    # Mode Serveur HTTP : exposition locale 127.0.0.1:2974:2974 (ou port personnalisé)
    $Port = if ($env:PORT) { $env:PORT } else { "2974" }
    $DockerArgs += "-p", "127.0.0.1:${Port}:2974"
    if ($HasStdinTty) {
        $DockerArgs += "-it"
    }
}

& docker run @DockerArgs $ImageName @args
exit $LASTEXITCODE