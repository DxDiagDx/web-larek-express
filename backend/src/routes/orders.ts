import { Router } from 'express';
import { createOrder } from '../controllers/orders';
import orderValidator from '../middlewares/validations';

const router = Router();
router.post('/', orderValidator, createOrder);

export default router;
