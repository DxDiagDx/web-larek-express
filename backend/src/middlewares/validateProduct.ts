import { Request, Response, NextFunction } from 'express';
import HttpCodes from '../errors/codes';

const validateProduct = (req: Request, res: Response, next: NextFunction): void => {
  const { title } = req.body;

  if (!title) {
    res.status(HttpCodes.BAD_REQUEST).json({ error: 'Необходимо указать Title' });
    return;
  }

  next();
};

export default validateProduct;
