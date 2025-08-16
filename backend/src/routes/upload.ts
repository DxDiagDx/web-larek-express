import express from 'express';
import fileMiddleware from '../middlewares/file';
import uploadFile from '../controllers/upload';
import authenticate from '../middlewares/auth';

const uploadRouter = express.Router();

uploadRouter.post('/', authenticate, fileMiddleware.single('image'), uploadFile);

export default uploadRouter;
