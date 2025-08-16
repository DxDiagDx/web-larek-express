import { CronJob } from 'cron';
import fs from 'fs';
import path from 'path';

const tempDir = path.join(process.cwd(), 'temp');

const cleanTempFolder = (): void => {
  const now = new Date().getTime();
  const oneHour = 60 * 60 * 1000; // 1 час в миллисекундах

  if (!fs.existsSync(tempDir)) {
    console.log('Папка temp не существует, создаём...');
    fs.mkdirSync(tempDir, { recursive: true });
    return;
  }

  fs.readdir(tempDir, (err, files) => {
    if (err) throw err;

    files.forEach((file) => {
      const filePath = path.join(tempDir, file);
      fs.stat(filePath, (err, stat) => {
        if (err) return;

        if (now - stat.mtime.getTime() > oneHour) {
          fs.unlink(filePath, (err) => {
            if (err) console.error(`Error deleting file ${filePath}:`, err);
          });
        }
      });
    });
  });
};

// Запускаем очистку каждый час
const job = new CronJob('0 * * * *', cleanTempFolder);
job.start();

export default cleanTempFolder;
