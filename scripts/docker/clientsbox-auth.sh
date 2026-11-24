#!/usr/bin/env bash
# ==============================================================================
# clientsbox-auth.sh — Initialisation de l'authentification et approbation CLI
# ==============================================================================
# Ouvre un conteneur interactif avec montage miroir du dossier de travail actuel
# et du volume nommé 'clientsbox-cli-auth' pour authentifier et approuver
# manuellement les 4 CLI (Cursor, Claude, Antigravity, Codex) dans le workspace.
# ==============================================================================
set -euo pipefail

IMAGE_NAME="${CLIENTSBOX_IMAGE:-clientsbox:latest}"
AUTH_VOLUME="clientsbox-cli-auth"
CURRENT_DIR="$(pwd)"

echo "=============================================================================="
echo " ClientsBox — Authentification & Approbation de Workspace CLI"
echo "=============================================================================="
echo ""
echo "Ce conteneur interactif est ouvert directement dans votre dossier actuel :"
echo "  $CURRENT_DIR"
echo ""
echo "Le volume persistant '$AUTH_VOLUME' est monté sur /root."
echo "Vous pouvez vous connecter et approuver manuellement chaque CLI :"
echo ""
echo "  1. Cursor CLI      : cursor-agent          (validez pour approuver ce dossier)"
echo "                       cursor-agent login   (pour vous connecter avec votre compte)"
echo "  2. Claude CLI      : claude login"
echo "  3. Antigravity CLI : agy auth"
echo "  4. Codex CLI       : codex login"
echo ""
echo "Tapez 'exit' une fois terminé."
echo "Toutes les autorisations et jetons sont conservés dans '$AUTH_VOLUME'."
echo "=============================================================================="
echo ""

# Création du volume s'il n'existe pas
if ! docker volume inspect "$AUTH_VOLUME" >/dev/null 2>&1; then
  echo "[ClientsBox] Création du volume '$AUTH_VOLUME'..."
  docker volume create "$AUTH_VOLUME" >/dev/null
fi

DOCKER_ARGS=(
  --rm
  -it
  --entrypoint bash
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

exec docker run "${DOCKER_ARGS[@]}" "$IMAGE_NAME"
