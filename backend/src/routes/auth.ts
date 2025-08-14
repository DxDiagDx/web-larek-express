import { Router } from 'express';
import {
  login,
  register,
  refreshAccessToken,
  logout,
  getCurrentUser,
} from '../controllers/auth';
import authenticate from '../middlewares/auth';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/token', refreshAccessToken);
router.get('/logout', logout);
router.get('/user', authenticate, getCurrentUser);

export default router;
