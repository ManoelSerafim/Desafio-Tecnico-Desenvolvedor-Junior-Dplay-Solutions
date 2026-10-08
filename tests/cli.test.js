import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const cliPath = resolve(__dirname, '..', 'src', 'cli.js');

function runCli(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [cliPath, ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => stdout += data.toString());
    child.stderr.on('data', (data) => stderr += data.toString());
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.on('error', reject);
  });
}

test('CLI exibe ajuda sem argumentos', async () => {
  const { code, stdout } = await runCli([]);
  assert.strictEqual(code, 0);
  assert.match(stdout, /Gerenciador de Tarefas/);
});

test('CLI exibe ajuda com comando help', async () => {
  const { code, stdout } = await runCli(['help']);
  assert.strictEqual(code, 0);
  assert.match(stdout, /Gerenciador de Tarefas/);
});

test('CLI exibe ajuda com --help', async () => {
  const { code, stdout } = await runCli(['--help']);
  assert.strictEqual(code, 0);
  assert.match(stdout, /Gerenciador de Tarefas/);
});

test('CLI exibe ajuda com -h', async () => {
  const { code, stdout } = await runCli(['-h']);
  assert.strictEqual(code, 0);
  assert.match(stdout, /Gerenciador de Tarefas/);
});

test('CLI retorna erro para comando desconhecido', async () => {
  const { code, stderr } = await runCli(['comando-inexistente']);
  assert.strictEqual(code, 1);
  assert.match(stderr, /Comando desconhecido/);
});

test('CLI init exibe mensagem de desenvolvimento', async () => {
  const { code, stdout } = await runCli(['init']);
  assert.strictEqual(code, 0);
  assert.match(stdout, /Inicializando gerenciador de tarefas/);
});