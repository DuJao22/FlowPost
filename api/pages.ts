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
  if (req.method === 'GET') {
    try {
      const pages = db.prepare('SELECT id, name, created_at, expires_at, views FROM pages ORDER BY created_at DESC').all();
      return res.status(200).json({ success: true, pages });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'ID não fornecido' });

    try {
      db.prepare('DELETE FROM pages WHERE id = ?').run(id);
      return res.status(200).json({ success: true, message: 'Página deletada' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
