#!/usr/bin/env node

/**
 * Mock déterministe pour tests d'intégration et E2E ClientsBox.
 * Simule le contrat CLI de Codex sans dépendance externe.
 */

const args = process.argv.slice(2);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleChat() {
  const isStreamJson = args.includes('stream-json') || args.includes('--json');
  if (isStreamJson) {
    const fakeSessionId = '00000000-0000-4000-8000-000000000002';
    process.stdout.write(JSON.stringify({ event: 'init', conversation_id: fakeSessionId }) + '\n');
    await sleep(20);
    process.stdout.write(JSON.stringify({ type: 'agent_message', text: 'pong' }) + '\n');
    process.exit(0);
  }
  process.stdout.write('pong\n');
  process.exit(0);
}

async function handleModels() {
  process.stdout.write('codex-mini\n');
  process.stdout.write('codex-standard\n');
  process.exit(0);
}

async function main() {
  if (args.includes('--version') || args.includes('-v')) {
    process.stdout.write('0.9.1\n');
    process.exit(0);
  }

  if (args.includes('models')) {
    await handleModels();
    return;
  }

  await handleChat();
}

main().catch((err) => {
  process.stderr.write(`[Mock Codex Erreur] ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
