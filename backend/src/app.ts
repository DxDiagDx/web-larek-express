import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { errors } from 'celebrate';
import cors from 'cors';
import path from 'path';
import errorHandler from './middlewares/error';
import productsRouter from './routes/products';
import ordersRouter from './routes/orders';
import { requestLogger, errorLogger } from './middlewares/logger'

const { PORT = 3000, DB_ADDRESS = 'mongodb://127.0.0.1:27017/weblarek' } = process.env;

mongoose.connect(DB_ADDRESS);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.use(requestLogger);
app.use('/product', productsRouter);
app.use('/order', ordersRouter);
app.use(errorLogger);

app.use(errors());
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
