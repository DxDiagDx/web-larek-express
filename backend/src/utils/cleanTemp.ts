import { CronJob } from 'cron';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../middlewares/logger';

const tempDir = path.join(process.cwd(), 'temp');

const cleanTempFolder = async (): Promise<void> => {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 час в миллисекундах

  try {
    // Проверяем и создаем папку temp при необходимости
    try {
      await fs.access(tempDir);
    } catch (accessError) {
      logger.info('Папка temp не существует, создаём...');
      await fs.mkdir(tempDir, { recursive: true });
      return;
    }

    // Читаем содержимое папки
    const files = await fs.readdir(tempDir);

    // Обрабатываем каждый файл
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(tempDir, file);

        try {
          const stat = await fs.stat(filePath);

          if (now - stat.mtime.getTime() > oneHour) {
            try {
              await fs.unlink(filePath);
              logger.info(`Файл ${file} успешно удален`, { filePath });
            } catch (unlinkError) {
              logger.error('Ошибка удаления файла', {
                filePath,
                error: unlinkError instanceof Error ? unlinkError.message : String(unlinkError),
              });
            }
          }
        } catch (statError) {
          logger.warn('Ошибка проверки файла', {
            filePath,
            error: statError instanceof Error ? statError.message : String(statError),
          });
        }
      }),
    );
  } catch (error) {
    logger.error('Критическая ошибка при очистке папки temp', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Запускаем очистку каждый час
const job = new CronJob('0 * * * *', cleanTempFolder);
job.start();

export default cleanTempFolder;
