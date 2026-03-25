import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    html_content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    views INTEGER DEFAULT 0
  )
`);

export interface Page {
  id: string;
  html_content: string;
  created_at: string;
  expires_at: string | null;
  views: number;
}

export function savePage(page: Omit<Page, 'created_at' | 'views'>) {
  const stmt = db.prepare(`
    INSERT INTO pages (id, html_content, expires_at)
    VALUES (@id, @html_content, @expires_at)
  `);
  stmt.run(page);
}

export function getPageById(id: string): Page | undefined {
  const stmt = db.prepare('SELECT * FROM pages WHERE id = ?');
  return stmt.get(id) as Page | undefined;
}

export function getAllPages(): Page[] {
  const stmt = db.prepare('SELECT id, created_at, expires_at, views FROM pages ORDER BY created_at DESC');
  return stmt.all() as Page[];
}

export function incrementViews(id: string) {
  const stmt = db.prepare('UPDATE pages SET views = views + 1 WHERE id = ?');
  stmt.run(id);
}

export function deletePage(id: string) {
  const stmt = db.prepare('DELETE FROM pages WHERE id = ?');
  stmt.run(id);
}
