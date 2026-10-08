import { taskRepository } from '../repositories/taskRepository.js';

let idCounter = 0;

function generateId() {
  idCounter += 1;
  return idCounter;
}

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

function createTaskObject(description) {
  return {
    id: generateId(),
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
    const task = createTaskObject(description);
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

  resetIdCounter() {
    idCounter = 0;
  }
}

export const taskService = new TaskService();