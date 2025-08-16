import { Request, Response, NextFunction } from 'express';
import { IImage } from '../models/product';
import BadRequestError from '../errors/bad-request-error';

const uploadFile = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    next(new BadRequestError('Файл не загружен'));
    return;
  }

  const response: IImage = {
    fileName: `/temp/${req.file.filename}`,
    originalName: req.file.originalname,
  };

  res.json(response);
};

export default uploadFile;
