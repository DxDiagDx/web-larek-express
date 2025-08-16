import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { errors } from 'celebrate';
import cors from 'cors';
import path from 'path';
import errorHandler from './middlewares/error';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import uploadRouter from './routes/upload';
import cleanTemp from './utils/cleanTemp';
import { requestLogger, errorLogger } from './middlewares/logger';
import authRouter from './routes/auth';

const { PORT = 3000, DB_ADDRESS = 'mongodb://127.0.0.1:27017/weblarek' } = process.env;

mongoose.connect(DB_ADDRESS);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'temp')));

app.use(requestLogger);
app.use('/upload', uploadRouter);
app.use('/product', productsRouter);
app.use('/order', ordersRouter);
app.use('/auth', authRouter);
app.use(errorLogger);

// Очистка временных файлов при старте
cleanTemp();

app.use(errors());
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
