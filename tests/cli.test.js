import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { TaskRepository } from '../src/repositories/taskRepository.js';
import { TaskService } from '../src/services/taskService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DATA_DIR = path.resolve(__dirname, 'temp-cli');
const TEST_DATA_PATH = path.join(TEST_DATA_DIR, 'tasks-cli-test.json');
const CLI_PATH = path.resolve(__dirname, '..', 'src', 'cli.js');

function runCli(args, dataPath = TEST_DATA_PATH) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, TASK_DATA_PATH: dataPath };
    const child = spawn('node', [CLI_PATH, ...args], { stdio: ['ignore', 'pipe', 'pipe'], env });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => stdout += data.toString());
    child.stderr.on('data', (data) => stderr += data.toString());
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.on('error', reject);
  });
}

describe('CLI Integration', () => {
  let repository;
  let service;

  beforeEach(async () => {
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    repository = new TaskRepository(TEST_DATA_PATH);
    service = new TaskService(repository);
    service.resetIdCounter();
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('help', () => {
    it('should show help with no arguments', async () => {
      const { code, stdout } = await runCli([]);
      expect(code).toBe(0);
      expect(stdout).toContain('Gerenciador de Tarefas');
      expect(stdout).toContain('add');
      expect(stdout).toContain('list');
      expect(stdout).toContain('complete');
      expect(stdout).toContain('remove');
    });

    it('should show help with help command', async () => {
      const { code, stdout } = await runCli(['help']);
      expect(code).toBe(0);
      expect(stdout).toContain('Gerenciador de Tarefas');
    });

    it('should show help with --help', async () => {
      const { code, stdout } = await runCli(['--help']);
      expect(code).toBe(0);
      expect(stdout).toContain('Gerenciador de Tarefas');
    });

    it('should show help with -h', async () => {
      const { code, stdout } = await runCli(['-h']);
      expect(code).toBe(0);
      expect(stdout).toContain('Gerenciador de Tarefas');
    });
  });

  describe('unknown command', () => {
    it('should show error and exit with code 1', async () => {
      const { code, stderr } = await runCli(['unknown']);
      expect(code).toBe(1);
      expect(stderr).toContain('Comando desconhecido: unknown');
    });
  });

  describe('add', () => {
    it('should add a valid task', async () => {
      const { code, stdout } = await runCli(['add', 'Nova tarefa']);
      expect(code).toBe(0);
      expect(stdout).toContain('Tarefa criada com ID #1');
    });

    it('should reject empty description', async () => {
      const { code, stderr } = await runCli(['add', '']);
      expect(code).toBe(1);
      expect(stderr).toContain('descrição da tarefa é obrigatória');
    });

    it('should reject missing description', async () => {
      const { code, stderr } = await runCli(['add']);
      expect(code).toBe(1);
      expect(stderr).toContain('descrição da tarefa é obrigatória');
    });

    it('should persist task to repository', async () => {
      await runCli(['add', 'Tarefa persistida']);
      const tasks = await repository.read();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].description).toBe('Tarefa persistida');
    });
  });

  describe('list', () => {
    it('should show empty message when no tasks', async () => {
      const { code, stdout } = await runCli(['list']);
      expect(code).toBe(0);
      expect(stdout).toContain('Nenhuma tarefa encontrada');
    });

    it('should list pending tasks', async () => {
      await service.add('Tarefa pendente');
      const { code, stdout } = await runCli(['list']);
      expect(code).toBe(0);
      expect(stdout).toContain('[ ]');
      expect(stdout).toContain('Tarefa pendente');
    });

    it('should list completed tasks', async () => {
      const task = await service.add('Tarefa concluída');
      await service.complete(task.id);
      const { code, stdout } = await runCli(['list']);
      expect(code).toBe(0);
      expect(stdout).toContain('[x]');
      expect(stdout).toContain('Tarefa concluída');
    });

    it('should show multiple tasks with mixed status', async () => {
      await service.add('Pendente 1');
      const t2 = await service.add('Pendente 2');
      await service.complete(t2.id);
      const { code, stdout } = await runCli(['list']);
      expect(code).toBe(0);
      expect(stdout).toContain('[ ] #1 Pendente 1');
      expect(stdout).toContain('[x] #2 Pendente 2');
    });
  });

  describe('complete', () => {
    it('should complete existing task', async () => {
      const task = await service.add('Para concluir');
      const { code, stdout } = await runCli(['complete', String(task.id)]);
      expect(code).toBe(0);
      expect(stdout).toContain(`Tarefa #${task.id} marcada como concluída`);
    });

    it('should persist completion', async () => {
      const task = await service.add('Para concluir');
      await runCli(['complete', String(task.id)]);
      const tasks = await repository.read();
      expect(tasks[0].status).toBe('completed');
    });

    it('should reject non-existent ID', async () => {
      const { code, stderr } = await runCli(['complete', '999']);
      expect(code).toBe(1);
      expect(stderr).toContain('Tarefa com ID 999 não encontrada');
    });

    it('should reject invalid ID (non-numeric)', async () => {
      const { code, stderr } = await runCli(['complete', 'abc']);
      expect(code).toBe(1);
      expect(stderr).toContain('ID inválido');
    });

    it('should reject invalid ID (negative)', async () => {
      const { code, stderr } = await runCli(['complete', '-1']);
      expect(code).toBe(1);
      expect(stderr).toContain('ID inválido');
    });

    it('should reject invalid ID (zero)', async () => {
      const { code, stderr } = await runCli(['complete', '0']);
      expect(code).toBe(1);
      expect(stderr).toContain('ID inválido');
    });

    it('should reject missing ID', async () => {
      const { code, stderr } = await runCli(['complete']);
      expect(code).toBe(1);
      expect(stderr).toContain('ID da tarefa é obrigatório');
    });
  });

  describe('remove', () => {
    it('should remove existing task', async () => {
      const task = await service.add('Para remover');
      const { code, stdout } = await runCli(['remove', String(task.id)]);
      expect(code).toBe(0);
      expect(stdout).toContain(`Tarefa #${task.id} removida`);
    });

    it('should persist removal', async () => {
      const task = await service.add('Para remover');
      await runCli(['remove', String(task.id)]);
      const tasks = await repository.read();
      expect(tasks).toHaveLength(0);
    });

    it('should reject non-existent ID', async () => {
      const { code, stderr } = await runCli(['remove', '999']);
      expect(code).toBe(1);
      expect(stderr).toContain('Tarefa com ID 999 não encontrada');
    });

    it('should reject invalid ID (non-numeric)', async () => {
      const { code, stderr } = await runCli(['remove', 'abc']);
      expect(code).toBe(1);
      expect(stderr).toContain('ID inválido');
    });

    it('should reject invalid ID (negative)', async () => {
      const { code, stderr } = await runCli(['remove', '-1']);
      expect(code).toBe(1);
      expect(stderr).toContain('ID inválido');
    });

    it('should reject invalid ID (decimal)', async () => {
      const { code, stderr } = await runCli(['remove', '1.5']);
      expect(code).toBe(1);
      expect(stderr).toContain('ID inválido');
    });

    it('should reject missing ID', async () => {
      const { code, stderr } = await runCli(['remove']);
      expect(code).toBe(1);
      expect(stderr).toContain('ID da tarefa é obrigatório');
    });
  });

  describe('exit codes', () => {
    it('should exit with 0 on successful add', async () => {
      const { code } = await runCli(['add', 'Tarefa']);
      expect(code).toBe(0);
    });

    it('should exit with 0 on successful list', async () => {
      const { code } = await runCli(['list']);
      expect(code).toBe(0);
    });

    it('should exit with 0 on successful complete', async () => {
      const task = await service.add('Tarefa');
      const { code } = await runCli(['complete', String(task.id)]);
      expect(code).toBe(0);
    });

    it('should exit with 0 on successful remove', async () => {
      const task = await service.add('Tarefa');
      const { code } = await runCli(['remove', String(task.id)]);
      expect(code).toBe(0);
    });

    it('should exit with 1 on invalid command', async () => {
      const { code } = await runCli(['invalid']);
      expect(code).toBe(1);
    });

    it('should exit with 1 on validation error', async () => {
      const { code } = await runCli(['add', '']);
      expect(code).toBe(1);
    });

    it('should exit with 1 on not found error', async () => {
      const { code } = await runCli(['complete', '999']);
      expect(code).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should not expose stack traces', async () => {
      const { stderr } = await runCli(['complete', '999']);
      expect(stderr).not.toContain('stack');
      expect(stderr).not.toContain('at ');
    });

    it('should handle corrupted JSON gracefully', async () => {
      await fs.writeFile(TEST_DATA_PATH, '{ invalid', 'utf-8');
      const { code, stderr } = await runCli(['list']);
      expect(code).toBe(1);
      expect(stderr).toContain('Erro ao listar tarefas');
    });
  });
});