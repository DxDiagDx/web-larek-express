import { Express } from 'express';
import multer, {
  Multer,
  diskStorage,
  FileFilterCallback,
  MulterError,
} from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { mkdir, access } from 'fs/promises';
import { constants } from 'fs';
import type { Request } from 'express';
import { logger } from './logger';

// Config
const tempDir = path.join(process.cwd(), 'temp');
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE_MB
  ? parseInt(process.env.MAX_FILE_SIZE_MB, 10) * 1024 * 1024
  : 5 * 1024 * 1024; // 5MB по умолчанию
const ALLOWED_MIME_TYPES = JSON.parse(process.env.ALLOWED_MIME_TYPES!) || [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

// Ensure temp directory exists
async function ensureTempDirExists() {
  try {
    // eslint-disable-next-line no-bitwise
    await access(tempDir, constants.F_OK | constants.W_OK);
  } catch {
    try {
      await mkdir(tempDir, { recursive: true });
    } catch (err) {
      logger.info('Ошибка при создании временной директории:', err);
      throw new Error('Ошибка конфигурации сервера');
    }
  }
}

// Sanitize filename
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9\-._]/g, '');
}

// Storage configuration
const storage = diskStorage({
  destination: async (_req: Request, _file: Express.Multer.File, cb) => {
    try {
      await ensureTempDirExists();
      cb(null, tempDir);
    } catch (err) {
      cb(err as Error, tempDir);
    }
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedOriginal = sanitizeFilename(
      path.basename(file.originalname, ext),
    );
    const filename = `${sanitizedOriginal}-${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    !ALLOWED_MIME_TYPES.includes(file.mimetype)
    || !ALLOWED_EXTENSIONS.includes(ext)
  ) {
    return cb(new MulterError(
      'LIMIT_UNEXPECTED_FILE',
      `Разрешены файлы только следующих типов: ${ALLOWED_EXTENSIONS.join(', ')}`,
    ));
  }

  return cb(null, true);
};

// Multer instance
const upload: Multer = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Ограничение на количество файлов
  },
});

export default upload;
