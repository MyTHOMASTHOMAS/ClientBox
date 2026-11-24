#!/usr/bin/env node

/**
 * Mock déterministe pour tests d'intégration et E2E ClientsBox.
 * Simule le contrat CLI de Claude Code sans dépendance externe ni token Anthropic.
 */

const args = process.argv.slice(2);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleChat() {
  const isStreamJson =
    args.includes('stream-json') ||
    args.includes('--json') ||
    (args.includes('--output-format') &&
      args[args.indexOf('--output-format') + 1] === 'stream-json');

  if (isStreamJson) {
    const fakeSessionId = '00000000-0000-4000-8000-000000000003';
    process.stdout.write(
      JSON.stringify({
        type: 'system',
        subtype: 'init',
        session_id: fakeSessionId,
        model: 'claude-3-5-sonnet',
      }) + '\n',
    );
    await sleep(20);
    process.stdout.write(
      JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'Mock response from claude-cli' },
        },
      }) + '\n',
    );
    process.stdout.write(
      JSON.stringify({
        type: 'assistant',
        message: {
          content: [{ type: 'text', text: 'Mock response from claude-cli' }],
        },
      }) + '\n',
    );
    process.stdout.write(
      JSON.stringify({
        type: 'result',
        subtype: 'success',
        result: 'Mock response from claude-cli',
      }) + '\n',
    );
    process.exit(0);
  }
  process.stdout.write('Mock response from claude-cli\n');
  process.exit(0);
}

async function main() {
  if (args.includes('--version') || args.includes('-v')) {
    process.stdout.write('2.1.330\n');
    process.exit(0);
  }

  await handleChat();
}

main().catch((err) => {
  process.stderr.write(
    `[Mock Claude Erreur] ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(1);
});
