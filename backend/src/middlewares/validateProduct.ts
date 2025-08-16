import { Request, Response, NextFunction } from 'express';
import BadRequestError from '../errors/bad-request-error';

const validateProduct = (req: Request, _res: Response, next: NextFunction): void => {
  const { title } = req.body;

  if (!title) {
    next(new BadRequestError('Необходимо указать Title'));
    return;
  }

  next();
};

export default validateProduct;
