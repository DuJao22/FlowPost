import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { savePage, getAllPages, deletePage } from '../database/db.js';

export const uploadPage = (req: Request, res: Response) => {
  try {
    let htmlContent = '';

    // Check if HTML is sent via JSON
    if (req.body && req.body.html) {
      htmlContent = req.body.html;
    } 
    // Check if HTML is sent via file upload
    else if (req.file) {
      htmlContent = req.file.buffer.toString('utf-8');
    }

    if (!htmlContent) {
      return res.status(400).json({ success: false, error: 'No HTML content provided' });
    }

    // Basic sanitization (optional, but good practice)
    // We could use DOMPurify here, but since the goal is to render the exact HTML,
    // we might just limit the size or do basic checks.
    if (htmlContent.length > 1024 * 1024 * 5) { // 5MB limit
      return res.status(400).json({ success: false, error: 'HTML content too large (max 5MB)' });
    }

    const id = uuidv4().replace(/-/g, '').substring(0, 10); // Short ID
    
    // Handle expiration (optional)
    let expiresAt = null;
    if (req.body.expiresInDays) {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(req.body.expiresInDays));
      expiresAt = date.toISOString();
    }

    savePage({
      id,
      html_content: htmlContent,
      expires_at: expiresAt
    });

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const url = `${appUrl}/view/${id}`;

    res.status(201).json({
      success: true,
      id,
      url
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const listPages = (req: Request, res: Response) => {
  try {
    const pages = getAllPages();
    res.json({ success: true, pages });
  } catch (error) {
    console.error('List pages error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export const removePage = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    deletePage(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete page error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
