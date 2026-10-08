import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATA_PATH = path.resolve(__dirname, '..', '..', 'data', 'tasks.json');

export class TaskRepository {
  constructor(dataPath = DEFAULT_DATA_PATH) {
    this.dataPath = dataPath;
  }

  async read() {
    try {
      const data = await fs.promises.readFile(this.dataPath, 'utf-8');
      if (!data.trim()) {
        return [];
      }
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        throw new Error('Arquivo de dados corrompido: raiz não é um array');
      }
      return parsed;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      if (error instanceof SyntaxError) {
        throw new Error(`Arquivo de dados corrompido: JSON inválido - ${error.message}`);
      }
      throw error;
    }
  }

  async write(tasks) {
    const dir = path.dirname(this.dataPath);
    await fs.promises.mkdir(dir, { recursive: true });
    const data = JSON.stringify(tasks, null, 2);
    await fs.promises.writeFile(this.dataPath, data, 'utf-8');
  }
}

export const taskRepository = new TaskRepository();