import type { Request, Response } from 'express';
import multer from 'multer';
import { uploadToR2, deleteFromR2 } from '../services/r2.js';

// Multer config — store in memory, then upload to R2
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, SVG, and PDF files are allowed'));
    }
  },
});

// Upload a single image (hospital logo, avatar, etc.)
export const uploadImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const folder = req.body.folder || 'images';
    const result = await uploadToR2(req.file.buffer, req.file.originalname, req.file.mimetype, folder);

    res.json({
      success: true,
      url: result.url,
      key: result.key,
      size: result.size,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
};

// Upload multiple files (patient documents, reports, etc.)
export const uploadDocuments = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const folder = req.body.folder || 'documents';
    const results = await Promise.all(
      files.map((file) => uploadToR2(file.buffer, file.originalname, file.mimetype, folder))
    );

    res.json({ success: true, files: results });
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
};

// Delete a file
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const { key } = req.body;
    if (!key) return res.status(400).json({ error: 'File key required' });

    await deleteFromR2(key);
    res.json({ success: true, message: 'File deleted' });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({ error: error.message || 'Delete failed' });
  }
};
