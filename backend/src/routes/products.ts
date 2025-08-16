import { Router } from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/products';
import validateProduct from '../middlewares/validateProduct';
import authenticate from '../middlewares/auth';

const router = Router();
router.get('/', getProducts);
router.post('/', authenticate, validateProduct, createProduct);
router.patch('/:productId', authenticate, updateProduct);
router.delete('/:productId', authenticate, deleteProduct);

export default router;
