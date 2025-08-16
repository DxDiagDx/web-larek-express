import { Request, Response } from 'express';
import { IImage } from '../models/product';
import HttpCodes from '../errors/codes';

const uploadFile = (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(HttpCodes.BAD_REQUEST).json({ error: 'Файл не загружен' });
    return;
  }

  const response: IImage = {
    fileName: `/temp/${req.file.filename}`,
    originalName: req.file.originalname,
  };

  res.json(response);
};

export default uploadFile;
