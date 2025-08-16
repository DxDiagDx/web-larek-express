import winston from 'winston';
import expressWinston from 'express-winston';

export const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.File({ filename: 'request.log' }),
  ],
  format: winston.format.json(),
});

// логгер ошибок
export const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.File({ filename: 'error.log' }),
  ],
  format: winston.format.json(),
});

// Основной логгер для приложения
export const logger = winston.createLogger({
  level: 'info', // Уровень логирования (info, error, debug и т.д.)
  transports: [
    new winston.transports.File({ filename: 'combined.log' }), // Все логи
    new winston.transports.File({ filename: 'error.log', level: 'error' }), // Только ошибки
    new winston.transports.Console(), // Вывод в консоль
  ],
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
});
