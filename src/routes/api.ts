import { Router } from 'express';
import multer from 'multer';
import { uploadPage, listPages, removePage } from '../controllers/pageController.js';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
});

// Upload HTML endpoint
router.post('/upload', upload.single('file'), uploadPage);

// Dashboard endpoints
router.get('/pages', listPages);
router.delete('/pages/:id', removePage);

export default router;
