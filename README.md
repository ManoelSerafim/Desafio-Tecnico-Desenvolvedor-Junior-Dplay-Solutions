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

## Comandos da CLI

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `add <descricao>` | Adiciona uma nova tarefa | `npm start -- add "Estudar Git"` |
| `list` | Lista todas as tarefas | `npm start -- list` |
| `complete <id>` | Marca uma tarefa como concluída | `npm start -- complete 1` |
| `remove <id>` | Remove uma tarefa | `npm start -- remove 1` |
| `help` \| `--help` \| `-h` | Exibe a ajuda | `npm start -- help` |

### Exemplos de saída

**Listar tarefas:**
```text
[ ] #1 Estudar Git                    09/10/2026
[x] #2 Revisar JavaScript             09/10/2026
```

**Adicionar tarefa:**
```text
Tarefa criada com ID #1
```

**Concluir tarefa:**
```text
Tarefa #1 marcada como concluída
```

**Remover tarefa:**
```text
Tarefa #1 removida
```

**Erros:**
```text
Erro: descrição da tarefa é obrigatória
Erro: ID inválido: deve ser um número inteiro positivo
Erro: Tarefa com ID 999 não encontrada
Comando desconhecido: foo
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
│   ├── cli.test.js                # Testes de integração da CLI
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
- Permite injeção de caminho do arquivo para testes isolados via `TASK_DATA_PATH`

### Camada de Serviço (`src/services/taskService.js`)
Contém as regras de negócio do gerenciamento de tarefas.
- Validação de descrição (não vazia, trim de espaços)
- Geração de IDs únicos baseados no maior ID existente (persistentes entre execuções)
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

## Regras de Negócio

1. **IDs únicos e persistentes**: IDs são gerados baseados no maior ID existente no arquivo JSON, garantindo unicidade mesmo após reiniciar o programa
2. **Não reutilização de IDs**: Ao remover uma tarefa, seu ID não é reutilizado
3. **Validação de descrição**: Descrições vazias ou apenas espaços são rejeitadas; espaços extras são removidos
4. **Status inicial**: Novas tarefas sempre começam com status `pending`
5. **Tratamento de erros**: Mensagens claras sem expor stack traces
6. **Códigos de saída**: `0` para sucesso, `1` para erro

## Persistência
- Arquivo JSON localizado em `data/tasks.json` (relativo à raiz do projeto)
- Caminho independente do diretório de execução do comando
- Arquivo criado automaticamente na primeira execução
- JSON corrompido gera erro compreensível sem sobrescrever dados

## Testes
- **66 testes** cobrindo repositório, serviço e CLI
- Testes isolados usando arquivos temporários
- Cobertura: 98% statements, 96% branches, 100% functions, 98% lines
- Framework: Jest com suporte a ES Modules

## Status do Projeto
> **Completo:** Todas as funcionalidades obrigatórias implementadas e testadas.
> - Adicionar, listar, concluir, remover tarefas
> - Persistência JSON com tratamento de erros
> - CLI funcional com ajuda e validação
> - Testes automatizados com Jest

## Como foi o desenvolvimento
O projeto foi desenvolvido em 4 etapas:
1. **Etapa 1** — Estrutura inicial, package.json, Git, README
2. **Etapa 2** — Repositório JSON, Service com regras de negócio, configuração Jest, 30 testes
3. **Etapa 3** — CLI completa integrada ao Service, 36 testes de integração
4. **Etapa 4** — Auditoria, correção de bug de IDs, documentação final

## Próximos Passos (Opcionais)
- Implementar filtro por status (`list --status pending`)
- Implementar edição de descrição (`edit <id> "nova descricao"`)
- Empacotar como executável standalone
- Adicionar ordenação por data/ID