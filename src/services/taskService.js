import { taskRepository } from '../repositories/taskRepository.js';

function validateDescription(description) {
  if (description === undefined || description === null) {
    throw new Error('Descrição é obrigatória');
  }
  const trimmed = String(description).trim();
  if (!trimmed) {
    throw new Error('Descrição não pode ser vazia ou conter apenas espaços');
  }
  return trimmed;
}

async function generateId(repository) {
  const tasks = await repository.read();
  const maxId = tasks.reduce((max, task) => Math.max(max, task.id), 0);
  return maxId + 1;
}

async function createTaskObject(description, repository) {
  return {
    id: await generateId(repository),
    description: validateDescription(description),
    status: 'pending',
    createdAt: new Date().toISOString()
  };
}

export class TaskService {
  constructor(repository = taskRepository) {
    this.repository = repository;
  }

  async add(description) {
    const tasks = await this.repository.read();
    const task = await createTaskObject(description, this.repository);
    tasks.push(task);
    await this.repository.write(tasks);
    return task;
  }

  async list() {
    return this.repository.read();
  }

  async findById(id) {
    const tasks = await this.repository.read();
    return tasks.find(task => task.id === id) || null;
  }

  async complete(id) {
    const tasks = await this.repository.read();
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) {
      throw new Error(`Tarefa com ID ${id} não encontrada`);
    }
    tasks[index] = { ...tasks[index], status: 'completed' };
    await this.repository.write(tasks);
    return tasks[index];
  }

  async remove(id) {
    const tasks = await this.repository.read();
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) {
      throw new Error(`Tarefa com ID ${id} não encontrada`);
    }
    const removed = tasks.splice(index, 1)[0];
    await this.repository.write(tasks);
    return removed;
  }
}

export const taskService = new TaskService();