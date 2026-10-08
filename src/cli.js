#!/usr/bin/env node

function showHelp() {
  console.log(`
Gerenciador de Tarefas - Dplay Solutions

Uso: npm start <comando> [opções]

Comandos:
  help        Exibe esta mensagem de ajuda
  init        Inicializa o gerenciador (em desenvolvimento)

Em desenvolvimento: funcionalidades de adicionar, listar, concluir, remover, editar e filtrar tarefas serão implementadas nas próximas etapas.
`);
}

const args = process.argv.slice(2);
const command = args[0] || 'help';

switch (command) {
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  case 'init':
    console.log('Inicializando gerenciador de tarefas... (em desenvolvimento)');
    break;
  default:
    console.error(`Comando desconhecido: ${command}`);
    showHelp();
    process.exit(1);
}