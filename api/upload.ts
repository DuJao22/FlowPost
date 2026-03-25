import { VercelRequest, VercelResponse } from '@vercel/node';
import { Database } from 'better-sqlite3';
import sqlite3 from 'better-sqlite3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Inicialização do banco (padrão serverless)
const dbPath = path.join(process.cwd(), 'flowhost.db');
const db: Database = new sqlite3(dbPath);

// Garantir que a tabela existe
db.exec(`
  CREATE TABLE IF NOT EXISTS pages (
    id TEXT PRIMARY KEY,
    html TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    views INTEGER DEFAULT 0
  )
`);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuração de CORS para Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { html, expiresInDays } = req.body;

    if (!html) {
      return res.status(400).json({
        success: false,
        error: 'HTML não enviado'
      });
    }

    const id = uuidv4().substring(0, 8);
    let expiresAt = null;

    if (expiresInDays && parseInt(expiresInDays) > 0) {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(expiresInDays));
      expiresAt = date.toISOString();
    }

    const stmt = db.prepare('INSERT INTO pages (id, html, expires_at) VALUES (?, ?, ?)');
    stmt.run(id, html, expiresAt);

    console.log(`[Vercel Serverless] Page created: ${id}`);

    return res.status(200).json({
      success: true,
      id,
      url: `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/view/${id}`,
      message: 'HTML recebido com sucesso'
    });

  } catch (error: any) {
    console.error('Erro no upload serverless:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno',
      details: error.message
    });
  }
}
