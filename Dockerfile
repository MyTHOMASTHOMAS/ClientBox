# ==============================================================================
# Étape 1 : Build autonome de ClientsBox (livrable dist/clientsbox.js)
# ==============================================================================
FROM node:24-slim AS builder

WORKDIR /build

# Installation des dépendances et compilation
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==============================================================================
# Étape 2 : Image officielle d'exécution ClientsBox
# ==============================================================================
FROM node:24-slim

LABEL maintainer="Autrement" \
      description="ClientsBox — Wrapper d'orchestration nodiale multi-agents CLI" \
      version="0.1.0"

# Outils système indispensables (Command, Git, utilitaires réseau et certificats)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    jq \
    ca-certificates \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# Neutralisation globale de l'erreur Git dubious ownership sur les répertoires montés
RUN git config --system --add safe.directory '*'

# Installation des 4 CLI d'agents d'IA via leurs installeurs officiels curl
# Déplacement des binaires hors de /root pour ne jamais être masqués par le volume d'authentification
RUN curl https://cursor.com/install -fsS | bash || true \
    && curl -fsSL https://claude.ai/install.sh | bash || true \
    && curl -fsSL https://antigravity.google/cli/install.sh | bash || true \
    && curl -fsSL https://chatgpt.com/codex/install.sh | sh || true \
    && mkdir -p /opt/cursor-agent \
    && if [ -d /root/.local/share/cursor-agent/versions ]; then \
         cp -r /root/.local/share/cursor-agent/versions/*/* /opt/cursor-agent/ 2>/dev/null || true; \
         ln -sf /opt/cursor-agent/cursor-agent /usr/local/bin/cursor-agent; \
       fi \
    && if [ -d /root/.local/share/claude/versions ]; then \
         cp /root/.local/share/claude/versions/* /usr/local/bin/claude 2>/dev/null || true; \
         chmod +x /usr/local/bin/claude 2>/dev/null || true; \
       fi \
    && if [ -f /root/.codex/packages/standalone/current/bin/codex ]; then \
         cp /root/.codex/packages/standalone/current/bin/codex /usr/local/bin/codex; \
         chmod +x /usr/local/bin/codex; \
       fi \
    && if [ -f /root/.local/bin/agy ]; then \
         cp /root/.local/bin/agy /usr/local/bin/agy; \
         chmod +x /usr/local/bin/agy; \
       fi

# Déploiement du livrable standalone ClientsBox
WORKDIR /opt/clientsbox
COPY --from=builder /build/dist/clientsbox.js /opt/clientsbox/clientsbox.js

# Variables d'environnement standardisées de l'image
ENV HOST=0.0.0.0 \
    PORT=2974 \
    AGENTS_DIR=.agents \
    IS_SANDBOX=1 \
    CURSOR_CLI_BIN=/usr/local/bin/cursor-agent \
    CLAUDE_CLI_BIN=/usr/local/bin/claude \
    ANTIGRAVITY_CLI_BIN=/usr/local/bin/agy \
    CODEX_CLI_BIN=/usr/local/bin/codex

# Répertoire de travail par défaut (ancre workspacePath sur process.cwd())
WORKDIR /workspace

# Point d'entrée officiel
ENTRYPOINT ["node", "/opt/clientsbox/clientsbox.js"]

