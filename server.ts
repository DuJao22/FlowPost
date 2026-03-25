import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import apiRoutes from './src/routes/api.js';
import { getPageById, incrementViews } from './src/database/db.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  // API Routes
  app.use('/api', apiRoutes);

  // View endpoint (this is the core feature)
  app.get('/view/:id', async (req, res) => {
    try {
      const page = getPageById(req.params.id);
      
      if (!page) {
        return res.status(404).send('<h1>Page not found</h1>');
      }

      // Check expiration
      if (page.expires_at && new Date(page.expires_at) < new Date()) {
        return res.status(410).send('<h1>This page has expired</h1>');
      }

      // Increment views
      incrementViews(page.id);

      // Send HTML
      res.setHeader('Content-Type', 'text/html');
      res.send(page.html_content);
    } catch (error) {
      console.error('Error rendering page:', error);
      res.status(500).send('<h1>Internal Server Error</h1>');
    }
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
