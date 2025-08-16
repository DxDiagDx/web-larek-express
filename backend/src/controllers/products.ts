import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import Product, { IProductRequestBody } from '../models/product';
import DuplicateTitleError from '../errors/duplicate-title-error';
import BadRequestError from '../errors/bad-request-error';
import HttpCodes from '../errors/codes';

const moveFile = async (tempPath: string, originalName: string): Promise<string> => {
  const ext = path.extname(originalName);
  const filename = `${uuidv4()}${ext}`;
  const newPath = path.join(process.cwd(), 'public', 'images', filename);

  await fs.rename(tempPath, newPath);
  return `/images/${filename}`;
};

export const getProducts = (_req: Request, res: Response, next: NextFunction) => Product.find({})
  .then((products) => res.send({
    items: products, total: products.length,
  }))
  .catch((err) => {
    next(err);
  });

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title, image, category, description, price,
    } = req.body;

    let imagePath: string | undefined;

    // Обработка изображения
    if (image?.fileName) {
      const tempPath = path.join(process.cwd(), 'public', image.fileName);
      if (existsSync(tempPath)) {
        imagePath = await moveFile(tempPath, image.originalName);
      }
    }

    const product = await Product.create({
      title,
      image: imagePath, // Используем обработанный путь к изображению
      category,
      description,
      price,
    });

    res.status(HttpCodes.CREATED).json({ product });
  } catch (err) {
    if (err instanceof Error && err.message.includes('E11000')) {
      return next(new DuplicateTitleError('Товар с таким названием уже существует'));
    }
    if (err instanceof MongooseError.ValidationError) {
      return next(new BadRequestError('Ошибка валидации данных при создании товара'));
    }
    return next(err);
  }
};

export const updateProduct = async (
  req: Request<{ productId: string }, {}, IProductRequestBody>,
  res: Response,
): Promise<void> => {
  try {
    const { productId } = req.params;
    const {
      title,
      description,
      category,
      price,
      image,
    } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(HttpCodes.NOT_FOUND).json({ error: 'Product not found' });
      return;
    }

    // Обработка обновления изображения
    if (image?.fileName) {
      const tempPath = path.join(process.cwd(), 'public', image.fileName);

      if (existsSync(tempPath)) {
        // Удаление старого изображения если оно существует
        if (product.image) {
          const oldImagePath = path.join(process.cwd(), 'public', product.image.fileName);
          try {
            if (await existsSync(oldImagePath)) {
              await fs.unlink(oldImagePath);
            }
          } catch (err) {
            console.error('Ошибка при удалении старого изображения:', err);
          }
        }

        // Перемещение нового изображения
        product.image.originalName = await moveFile(tempPath, image.originalName);
      }
    }

    // Обновление полей продукта
    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = price;

    const updatedProduct = await product.save();
    res.status(HttpCodes.OK).json(updatedProduct);
  } catch (err) {
    if (err instanceof MongooseError.ValidationError) {
      res.status(HttpCodes.BAD_REQUEST).json({ error: err.message });
    } else if (err instanceof Error && err.message.includes('E11000')) {
      res.status(HttpCodes.CONFLICT).json({ error: 'Товар с таким названием уже существует' });
    } else {
      res.status(HttpCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Внутренняя ошибка сервера',
        message: err instanceof Error ? err.message : 'Неизвестная ошибка',
      });
    }
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      res.status(HttpCodes.NOT_FOUND).json({ error: 'Товар не найден' });
      return;
    }

    res.status(HttpCodes.OK).json({
      message: 'Товар успешно удален',
      deletedProduct: product,
    });
  } catch (error) {
    if (error instanceof MongooseError.CastError) {
      res.status(HttpCodes.BAD_REQUEST).json({ error: 'Некорректный ID товара' });
    } else {
      res.status(HttpCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Внутренняя ошибка сервера',
        message: error instanceof Error ? error.message : 'Неизвестная ошибка',
      });
    }
  }
};
