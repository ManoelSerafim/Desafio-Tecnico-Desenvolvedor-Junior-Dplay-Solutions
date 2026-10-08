#!/usr/bin/env node

import { TaskService } from './services/taskService.js';
import { TaskRepository } from './repositories/taskRepository.js';

const taskService = new TaskService();

function showHelp() {
  console.log(`
Gerenciador de Tarefas - Dplay Solutions

Uso: npm start -- <comando> [argumentos]

Comandos:
  add <descricao>       Adiciona uma nova tarefa
  list                  Lista todas as tarefas
  complete <id>         Marca uma tarefa como concluída
  remove <id>           Remove uma tarefa
  help                  Exibe esta mensagem de ajuda
  --help                Exibe esta mensagem de ajuda
  -h                    Exibe esta mensagem de ajuda

Exemplos:
  npm start -- add "Estudar Git"
  npm start -- list
  npm start -- complete 1
  npm start -- remove 1

Status das tarefas:
  [ ] Pendente
  [x] Concluída
`);
}

function formatDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatTask(task) {
  const status = task.status === 'completed' ? '[x]' : '[ ]';
  return `${status} #${task.id} ${task.description.padEnd(30)} ${formatDate(task.createdAt)}`;
}

function validateId(idStr) {
  if (!/^\d+$/.test(idStr)) {
    throw new Error('ID inválido: deve ser um número inteiro positivo');
  }
  const id = parseInt(idStr, 10);
  if (id <= 0) {
    throw new Error('ID inválido: deve ser um número inteiro positivo');
  }
  return id;
}

async function handleAdd(args) {
  const description = args.join(' ').trim();
  if (!description) {
    console.error('Erro: descrição da tarefa é obrigatória');
    console.error('Uso: npm start -- add "Descrição da tarefa"');
    process.exit(1);
  }
  try {
    const task = await taskService.add(description);
    console.log(`Tarefa criada com ID #${task.id}`);
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    process.exit(1);
  }
}

async function handleList() {
  try {
    const tasks = await taskService.list();
    if (tasks.length === 0) {
      console.log('Nenhuma tarefa encontrada.');
      return;
    }
    tasks.forEach(task => {
      console.log(formatTask(task));
    });
  } catch (error) {
    console.error(`Erro ao listar tarefas: ${error.message}`);
    process.exit(1);
  }
}

async function handleComplete(args) {
  if (args.length === 0) {
    console.error('Erro: ID da tarefa é obrigatório');
    console.error('Uso: npm start -- complete <id>');
    process.exit(1);
  }
  try {
    const id = validateId(args[0]);
    const task = await taskService.complete(id);
    console.log(`Tarefa #${task.id} marcada como concluída`);
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    process.exit(1);
  }
}

async function handleRemove(args) {
  if (args.length === 0) {
    console.error('Erro: ID da tarefa é obrigatório');
    console.error('Uso: npm start -- remove <id>');
    process.exit(1);
  }
  try {
    const id = validateId(args[0]);
    const task = await taskService.remove(id);
    console.log(`Tarefa #${task.id} removida`);
  } catch (error) {
    console.error(`Erro: ${error.message}`);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const command = args[0] || 'help';
const commandArgs = args.slice(1);

switch (command) {
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  case 'add':
    await handleAdd(commandArgs);
    break;
  case 'list':
    await handleList();
    break;
  case 'complete':
    await handleComplete(commandArgs);
    break;
  case 'remove':
    await handleRemove(commandArgs);
    break;
  default:
    console.error(`Comando desconhecido: ${command}`);
    showHelp();
    process.exit(1);
}

export { taskService };