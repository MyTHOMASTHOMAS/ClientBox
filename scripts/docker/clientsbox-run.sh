#!/usr/bin/env bash
# ==============================================================================
# clientsbox-run.sh — Mode 2 : Wrapper d'exécution global conteneurisé ClientsBox
# ==============================================================================
# Lance ClientsBox dans un conteneur éphémère (--rm) en montant dynamiquement
# le workspace hôte avec miroir exact du chemin absolu (-v "$WS:$WS" -w "$WS").
# ==============================================================================
set -euo pipefail

IMAGE_NAME="${CLIENTSBOX_IMAGE:-clientsbox:latest}"
AUTH_VOLUME="clientsbox-cli-auth"
CURRENT_DIR="$(pwd)"

# Vérification de l'existence du volume d'authentification
if ! docker volume inspect "$AUTH_VOLUME" >/dev/null 2>&1; then
  echo "[ClientsBox] Création du volume Docker d'authentification partagée '$AUTH_VOLUME'..."
  docker volume create "$AUTH_VOLUME" >/dev/null
fi

# Détection du mode d'exécution (Headless --exec-scene vs Mode Serveur HTTP)
IS_HEADLESS=false
for arg in "$@"; do
  if [[ "$arg" == "--exec-scene"* ]]; then
    IS_HEADLESS=true
    break
  fi
done

# Options de base du conteneur Docker
DOCKER_ARGS=(
  --rm
  --init
  -e IS_SANDBOX=1
  -v "$AUTH_VOLUME:/root"
  -v "$CURRENT_DIR:$CURRENT_DIR"
  -w "$CURRENT_DIR"
)

# Montage optionnel de la configuration Git et des clés SSH hôte en lecture seule
if [[ -f "${HOME}/.gitconfig" ]]; then
  DOCKER_ARGS+=(-v "${HOME}/.gitconfig:/root/.gitconfig:ro")
fi
if [[ -d "${HOME}/.ssh" ]]; then
  DOCKER_ARGS+=(-v "${HOME}/.ssh:/root/.ssh:ro")
fi

# Si un fichier env/.env hôte existe dans le workspace, le masquer avec /dev/null
# pour que ses chemins spécifiques à la machine hôte n'écrasent pas l'environnement du conteneur
if [[ -f "${CURRENT_DIR}/env/.env" ]]; then
  DOCKER_ARGS+=(-v "/dev/null:${CURRENT_DIR}/env/.env:ro")
fi

if [[ "$IS_HEADLESS" == "true" ]]; then
  # Mode Headless : aucun port réseau mappé, allocation TTY conditionnelle (non interactif en CI)
  if [ -t 0 ] && [ -t 1 ]; then
    DOCKER_ARGS+=(-i)
  fi
  exec docker run "${DOCKER_ARGS[@]}" "$IMAGE_NAME" "$@"
else
  # Mode Serveur HTTP : exposition locale 127.0.0.1:2974:2974 (ou port personnalisé)
  PORT="${PORT:-2974}"
  DOCKER_ARGS+=(-p "127.0.0.1:${PORT}:2974")
  if [ -t 0 ]; then
    DOCKER_ARGS+=(-it)
  fi
  exec docker run "${DOCKER_ARGS[@]}" "$IMAGE_NAME" "$@"
fi

