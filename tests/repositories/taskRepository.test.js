import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'node:fs/promises';
import path from 'node:path';
import { TaskRepository } from '../../src/repositories/taskRepository.js';

const TEST_DATA_DIR = path.resolve('tests', 'temp');
const TEST_DATA_PATH = path.join(TEST_DATA_DIR, 'tasks-test.json');

describe('TaskRepository', () => {
  let repository;

  beforeEach(async () => {
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    repository = new TaskRepository(TEST_DATA_PATH);
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('read', () => {
    it('should return empty array when file does not exist', async () => {
      const tasks = await repository.read();
      expect(tasks).toEqual([]);
    });

    it('should return empty array when file is empty', async () => {
      await fs.writeFile(TEST_DATA_PATH, '', 'utf-8');
      const tasks = await repository.read();
      expect(tasks).toEqual([]);
    });

    it('should read existing tasks from file', async () => {
      const tasks = [
        { id: 1, description: 'Tarefa 1', status: 'pending', createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 2, description: 'Tarefa 2', status: 'completed', createdAt: '2024-01-02T00:00:00.000Z' }
      ];
      await fs.writeFile(TEST_DATA_PATH, JSON.stringify(tasks, null, 2), 'utf-8');
      const result = await repository.read();
      expect(result).toEqual(tasks);
    });

    it('should throw error for corrupted JSON', async () => {
      await fs.writeFile(TEST_DATA_PATH, '{ invalid json', 'utf-8');
      await expect(repository.read()).rejects.toThrow('Arquivo de dados corrompido: JSON inválido');
    });

    it('should throw error when root is not an array', async () => {
      await fs.writeFile(TEST_DATA_PATH, '{"tasks": []}', 'utf-8');
      await expect(repository.read()).rejects.toThrow('Arquivo de dados corrompido: raiz não é um array');
    });
  });

  describe('write', () => {
    it('should create file and directory when they do not exist', async () => {
      const tasks = [{ id: 1, description: 'Teste', status: 'pending', createdAt: '2024-01-01T00:00:00.000Z' }];
      await repository.write(tasks);
      const content = await fs.readFile(TEST_DATA_PATH, 'utf-8');
      expect(JSON.parse(content)).toEqual(tasks);
    });

    it('should persist tasks correctly', async () => {
      const tasks = [
        { id: 1, description: 'Tarefa 1', status: 'pending', createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 2, description: 'Tarefa 2', status: 'completed', createdAt: '2024-01-02T00:00:00.000Z' }
      ];
      await repository.write(tasks);
      const content = await fs.readFile(TEST_DATA_PATH, 'utf-8');
      expect(JSON.parse(content)).toEqual(tasks);
    });

    it('should overwrite existing file', async () => {
      await repository.write([{ id: 1, description: 'Antiga', status: 'pending', createdAt: '2024-01-01T00:00:00.000Z' }]);
      await repository.write([{ id: 2, description: 'Nova', status: 'completed', createdAt: '2024-01-02T00:00:00.000Z' }]);
      const content = await fs.readFile(TEST_DATA_PATH, 'utf-8');
      expect(JSON.parse(content)).toHaveLength(1);
      expect(JSON.parse(content)[0].description).toBe('Nova');
    });
  });
});