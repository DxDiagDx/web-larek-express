import { Request, Response, NextFunction } from 'express';
import { faker } from '@faker-js/faker';
import { Error as MongooseError } from 'mongoose';
import Product from '../models/product';
import BadRequestError from '../errors/bad-request-error';
import HttpCodes from '../errors/codes';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  const { total, items } = req.body;
  const orderId = faker.string.uuid();

  try {
    const totalSum = await items.reduce(async (sum:number, item: string[]) => {
      let summa = sum;
      const product = await Product.findOne({ _id: item });
      if (product) {
        if (product.price === null) {
          return summa;
        }
        summa += product.price;
        return summa;
      }

      const error = new MongooseError('Товар не найден');
      return next(error);
    }, 0);

    if (total !== totalSum) {
      const error = new MongooseError('Неверная сумма заказа');
      return next(error);
    }

    return res.status(HttpCodes.OK).send({ orderId, total: totalSum });
  } catch (error) {
    if (error instanceof MongooseError.ValidationError) {
      return next(new BadRequestError('Нвозможно создать заказ'));
    }
    return next(error);
  }
};

export default createOrder;
