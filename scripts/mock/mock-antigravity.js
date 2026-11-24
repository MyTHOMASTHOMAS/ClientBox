#!/usr/bin/env node

/**
 * Mock déterministe pour tests d'intégration et E2E ClientsBox.
 * Simule le contrat CLI d'Antigravity (agy) sans dépendance externe.
 */

const args = process.argv.slice(2);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleChat() {
  const isStreamJson = args.includes('stream-json');
  if (isStreamJson) {
    const fakeSessionId = '00000000-0000-4000-8000-000000000001';
    process.stdout.write(JSON.stringify({ event: 'init', conversation_id: fakeSessionId }) + '\n');
    await sleep(20);
    process.stdout.write(JSON.stringify({ event: 'result', result: { response: 'pong' } }) + '\n');
    process.exit(0);
  }
  process.stdout.write('pong\n');
  process.exit(0);
}

async function handleModels() {
  process.stdout.write('Fetching available models...\n');
  process.stdout.write('gemini-2.5-pro\n');
  process.stdout.write('claude-3-5-sonnet\n');
  process.exit(0);
}

async function handlePrint() {
  const convIndex = args.indexOf('--conversation');
  const sessionId = convIndex >= 0 ? args[convIndex + 1] : 'aucune';
  process.stdout.write(`[Mock Antigravity] Session ${sessionId}\n`);
  process.stdout.write('[Mock Antigravity] Initialisation du traitement...\n');
  await sleep(40);
  process.stdout.write('TERMINE\n');
  process.exit(0);
}

async function main() {
  if (args.includes('--version') || args.includes('-v')) {
    process.stdout.write('1.5.3\n');
    process.exit(0);
  }

  if (args[0] === 'models') {
    await handleModels();
    return;
  }

  if (args[0] === 'chat') {
    await handleChat();
    return;
  }

  await handlePrint();
}

main().catch((err) => {
  process.stderr.write(
    `[Mock Antigravity Erreur] ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
