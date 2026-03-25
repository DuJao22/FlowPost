import { VercelRequest, VercelResponse } from '@vercel/node';
import sqlite3 from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'flowhost.db');
const db = new sqlite3(dbPath);

// Inicializar tabela se não existir (necessário pois /tmp é efêmero)
db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    name TEXT,
    html TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    views INTEGER DEFAULT 0
  )
`);

// Migração para adicionar a coluna 'name' caso o banco já exista
try {
  db.exec("ALTER TABLE pages ADD COLUMN name TEXT");
} catch (e) {
  // A coluna já existe ou outro erro (ignorar)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  if (!id) {
    return res.status(400).json({ error: 'ID não fornecido' });
  }

  try {
    const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(id) as any;

    if (!page) {
      return res.status(404).send('<h1>404: Página não encontrada</h1>');
    }

    // Verificar expiração
    if (page.expires_at && new Date(page.expires_at) < new Date()) {
      db.prepare('DELETE FROM pages WHERE id = ?').run(id);
      return res.status(410).send('<h1>410: Esta página expirou</h1>');
    }

    // Incrementar visualizações
    db.prepare('UPDATE pages SET views = views + 1 WHERE id = ?').run(id);

    // Renderizar o HTML
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(page.html);

  } catch (error: any) {
    console.error('Erro na visualização serverless:', error);
    return res.status(500).send('<h1>500: Erro interno do servidor</h1>');
  }
}
