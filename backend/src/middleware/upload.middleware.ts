import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from './auth.middleware';

const storage = (subfolder: string) =>
  multer.diskStorage({
    destination: (req, _file, cb) => {
      const authReq = req as AuthRequest;
      const userId = req.params.id || authReq.user?.id || 'unknown';
      const uploadPath = path.join('uploads', subfolder, userId);

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${timestamp}_${safeName}`);
    },
  });

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg', 'image/jpg', 'image/png',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'text/plain',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX, CSV, TXT'));
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024,
};

export const documentUpload = multer({
  storage: storage('documents'),
  fileFilter,
  limits,
}).single('document');

export const profileUpload = multer({
  storage: storage('profiles'),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
}).single('profilePicture');
