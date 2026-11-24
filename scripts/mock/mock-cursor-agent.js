#!/usr/bin/env node

/**
 * Mock déterministe pour tests d'intégration et E2E ClientsBox.
 * Simule le contrat CLI de Cursor Agent sans dépendance externe.
 */

const args = process.argv.slice(2);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleRun() {
  const resumeIndex = args.indexOf('--resume');
  const sessionId = resumeIndex >= 0 ? args[resumeIndex + 1] : 'aucune';
  process.stdout.write(`[Mock Agent] Session ${sessionId}\n`);
  process.stdout.write('[Mock Agent] Initialisation du traitement...\n');
  await sleep(60);
  process.stdout.write('[Mock Agent] Analyse du prompt et des contraintes...\n');
  await sleep(60);
  process.stdout.write('[Mock Agent] Code généré et vérifié.\n');
  await sleep(40);
  process.stdout.write('TERMINE\n');
  process.exit(0);
}

async function main() {
  if (args[0] === 'create-chat') {
    const id = `mock-chat-${process.pid}-${Date.now().toString(36)}`;
    process.stdout.write(`${id}\n`);
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    process.stdout.write('mock-cursor-agent v1.0.0\n');
    process.exit(0);
  }

  await handleRun();
}

main().catch((err) => {
  process.stderr.write(`[Mock Agent Erreur] ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
