import mongoose, { Document } from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../middlewares/logger';

export interface IImage {
  fileName: string;
  originalName: string;
}

export interface IProduct extends Document {
  title: string;
  image: IImage;
  category: string;
  description: string;
  price: number | null;
}

export interface IProductRequestBody {
  title?: string;
  image?: IImage;
  category?: string;
  description?: string;
  price?: number;
}

const imageSchema = new mongoose.Schema<IImage>({
  fileName: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
});

const productSchema = new mongoose.Schema<IProduct>({
  title: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 30,
    unique: true,
  },
  image: imageSchema,
  category: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    default: null,
  },
}, { versionKey: false });

// eslint-disable-next-line func-names
productSchema.post('deleteOne', async function (this: IProduct) {
  if (!this.image) return;

  const filePath = path.join(process.cwd(), 'public', this.image.fileName);

  try {
    await fs.rm(filePath, { force: true });
  } catch (err) {
    logger.info(`Ошибка удаления файла ${filePath}:`, err);
  }
});

export default mongoose.model<IProduct>('product', productSchema);
