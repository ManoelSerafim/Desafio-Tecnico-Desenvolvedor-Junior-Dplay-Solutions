import { describe, it, expect, beforeEach } from '@jest/globals';
import { TaskService } from '../../src/services/taskService.js';
import { TaskRepository } from '../../src/repositories/taskRepository.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const TEST_DATA_DIR = path.resolve('tests', 'temp-service');
const TEST_DATA_PATH = path.join(TEST_DATA_DIR, 'tasks-service-test.json');

describe('TaskService', () => {
  let service;
  let repository;

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

  describe('add', () => {
    it('should add a valid task', async () => {
      const task = await service.add('Nova tarefa');
      expect(task).toMatchObject({
        id: 1,
        description: 'Nova tarefa',
        status: 'pending',
        createdAt: expect.any(String)
      });
      expect(new Date(task.createdAt).toISOString()).toBe(task.createdAt);
    });

    it('should reject empty description', async () => {
      await expect(service.add('')).rejects.toThrow('Descrição não pode ser vazia ou conter apenas espaços');
    });

    it('should reject description with only whitespace', async () => {
      await expect(service.add('   ')).rejects.toThrow('Descrição não pode ser vazia ou conter apenas espaços');
    });

    it('should reject null description', async () => {
      await expect(service.add(null)).rejects.toThrow('Descrição é obrigatória');
    });

    it('should reject undefined description', async () => {
      await expect(service.add(undefined)).rejects.toThrow('Descrição é obrigatória');
    });

    it('should trim whitespace from description', async () => {
      const task = await service.add('  Tarefa com espaços  ');
      expect(task.description).toBe('Tarefa com espaços');
    });

    it('should create task with pending status', async () => {
      const task = await service.add('Tarefa pendente');
      expect(task.status).toBe('pending');
    });

    it('should generate unique IDs for different tasks', async () => {
      const task1 = await service.add('Tarefa 1');
      const task2 = await service.add('Tarefa 2');
      const task3 = await service.add('Tarefa 3');
      expect(task1.id).toBe(1);
      expect(task2.id).toBe(2);
      expect(task3.id).toBe(3);
      expect(new Set([task1.id, task2.id, task3.id]).size).toBe(3);
    });

    it('should persist tasks to repository', async () => {
      await service.add('Tarefa persistida');
      const tasks = await repository.read();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].description).toBe('Tarefa persistida');
    });
  });

  describe('list', () => {
    it('should return empty array when no tasks exist', async () => {
      const tasks = await service.list();
      expect(tasks).toEqual([]);
    });

    it('should return all existing tasks', async () => {
      await service.add('Tarefa 1');
      await service.add('Tarefa 2');
      const tasks = await service.list();
      expect(tasks).toHaveLength(2);
      expect(tasks.map(t => t.description)).toEqual(['Tarefa 1', 'Tarefa 2']);
    });
  });

  describe('findById', () => {
    it('should return task when ID exists', async () => {
      const created = await service.add('Tarefa para buscar');
      const found = await service.findById(created.id);
      expect(found).toEqual(created);
    });

    it('should return null when ID does not exist', async () => {
      const found = await service.findById(999);
      expect(found).toBeNull();
    });
  });

  describe('complete', () => {
    it('should mark task as completed', async () => {
      const created = await service.add('Tarefa para concluir');
      const completed = await service.complete(created.id);
      expect(completed.status).toBe('completed');
      expect(completed.id).toBe(created.id);
    });

    it('should persist completion status', async () => {
      const created = await service.add('Tarefa para concluir');
      await service.complete(created.id);
      const tasks = await repository.read();
      expect(tasks[0].status).toBe('completed');
    });

    it('should reject completing non-existent task', async () => {
      await expect(service.complete(999)).rejects.toThrow('Tarefa com ID 999 não encontrada');
    });
  });

  describe('remove', () => {
    it('should remove existing task', async () => {
      const created = await service.add('Tarefa para remover');
      const removed = await service.remove(created.id);
      expect(removed.id).toBe(created.id);
      expect(removed.description).toBe('Tarefa para remover');
    });

    it('should persist removal', async () => {
      await service.add('Tarefa 1');
      const created = await service.add('Tarefa 2');
      await service.remove(created.id);
      const tasks = await repository.read();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].description).toBe('Tarefa 1');
    });

    it('should reject removing non-existent task', async () => {
      await expect(service.remove(999)).rejects.toThrow('Tarefa com ID 999 não encontrada');
    });

    it('should not reuse IDs after deletion', async () => {
      const task1 = await service.add('Tarefa 1');
      const task2 = await service.add('Tarefa 2');
      await service.remove(task1.id);
      const task3 = await service.add('Tarefa 3');
      expect(task3.id).toBe(3);
      const tasks = await service.list();
      expect(tasks.map(t => t.id).sort()).toEqual([2, 3]);
    });
  });

  describe('integration: full workflow', () => {
    it('should handle complete task lifecycle', async () => {
      const task = await service.add('Tarefa completa');
      expect(task.status).toBe('pending');

      await service.complete(task.id);
      const completed = await service.findById(task.id);
      expect(completed.status).toBe('completed');

      await service.remove(task.id);
      const removed = await service.findById(task.id);
      expect(removed).toBeNull();
    });

    it('should handle multiple tasks independently', async () => {
      const task1 = await service.add('Tarefa 1');
      const task2 = await service.add('Tarefa 2');

      await service.complete(task1.id);
      await service.remove(task2.id);

      const tasks = await service.list();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(task1.id);
      expect(tasks[0].status).toBe('completed');
    });
  });
});