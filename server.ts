import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';

// Importando as funções serverless (simulando a Vercel)
import uploadHandler from './api/upload.js';
import viewHandler from './api/view.js';
import pagesHandler from './api/pages.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  }));
  
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Simulador de rotas da Vercel
  app.post('/api/upload', (req, res) => uploadHandler(req as any, res as any));
  app.get('/api/pages', (req, res) => pagesHandler(req as any, res as any));
  app.delete('/api/pages/:id', (req, res) => {
    req.query.id = req.params.id;
    return pagesHandler(req as any, res as any);
  });
  
  // Rota de visualização (Vercel usa query params ou caminhos dinâmicos)
  app.get('/view/:id', (req, res) => {
    req.query.id = req.params.id;
    return viewHandler(req as any, res as any);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FlowHost] Serverless-Ready Server running on http://localhost:${PORT}`);
  });
}

startServer();
