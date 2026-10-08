# Gerenciador de Tarefas - Dplay Solutions

## Objetivo
Projeto de desafio técnico para a vaga de Desenvolvedor Júnior na Dplay Solutions.  
Aplicação CLI (Command Line Interface) para gerenciamento de tarefas com persistência local em arquivo JSON.

## Tecnologias Utilizadas
- **JavaScript (Node.js)** — Runtime principal
- **ES Modules** — Sistema de módulos nativo (`"type": "module"`)
- **npm** — Gerenciador de pacotes e scripts
- **JSON** — Persistência local de dados
- **Jest** — Framework de testes automatizados

## Pré-requisitos
- **Node.js >= 18.0.0** (versão LTS recomendada)
- **npm** (incluído no Node.js)

## Instalação
```bash
npm install
```

## Execução
```bash
# Exibe a ajuda
npm start

# Ou diretamente
node src/cli.js help
```

## Testes
```bash
# Executa todos os testes
npm test

# Executa testes com cobertura
npm test -- --coverage
```

## Estrutura de Diretórios
```
dplay-task-manager/
├── src/
│   ├── cli.js                     # Ponto de entrada da aplicação
│   ├── services/
│   │   └── taskService.js         # Regras de negócio das tarefas
│   ├── repositories/
│   │   └── taskRepository.js      # Leitura/escrita do arquivo JSON
│   └── utils/                     # Utilitários compartilhados (futuro)
├── tests/
│   ├── repositories/
│   │   └── taskRepository.test.js # Testes do repositório
│   └── services/
│       └── taskService.test.js    # Testes do serviço
├── data/                          # Arquivo de persistência local (criado automaticamente)
│   └── .gitkeep
├── .gitignore
├── jest.config.js                 # Configuração do Jest
├── package.json
├── package-lock.json
└── README.md
```

## Arquitetura

### Camada de Repositório (`src/repositories/taskRepository.js`)
Responsável pela persistência dos dados em arquivo JSON.
- Cria o arquivo automaticamente na primeira execução
- Retorna lista vazia quando arquivo não existe
- Trata JSON corrompido sem destruir dados originais
- Permite injeção de caminho do arquivo para testes isolados

### Camada de Serviço (`src/services/taskService.js`)
Contém as regras de negócio do gerenciamento de tarefas.
- Validação de descrição (não vazia, trim de espaços)
- Geração de IDs únicos sequenciais (não reutilizados após exclusão)
- Criação de tarefas com status `pending` e `createdAt` em ISO 8601
- Operações: adicionar, listar, buscar por ID, concluir, remover

### Modelo de Tarefa
```json
{
  "id": 1,
  "description": "Descrição da tarefa",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

## Status do Projeto
> **Aviso:** Este projeto está na **Etapa 2 — Persistência JSON, regras de negócio e testes com Jest**.  
> A interface de comandos da CLI (adicionar, listar, concluir, remover via terminal) será implementada na próxima etapa.  
> Atualmente, a lógica de negócio e persistência estão completas e testadas.

## Próximas Etapas
1. **Etapa 3** — Implementar comandos da CLI para adicionar, listar, concluir, remover e exibir ajuda
2. **Etapa 4** — Testes de integração da CLI e refinamentos