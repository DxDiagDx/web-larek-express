import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const { JWT_SECRET } = process.env;

export interface AuthRequest extends Request {
  user?: { _id: string };
}

const handleAuthError = (res: Response) => {
  res
    .status(401)
    .send({ message: 'Необходима авторизация' });
};

const extractBearerToken = (header: string) => header.replace('Bearer ', '');

export default (req: AuthRequest, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return handleAuthError(res);
  }

  const token = extractBearerToken(authorization);
  console.log('Current JWT_SECRET:', process.env.JWT_SECRET);
  console.log('Token:', token);

  let payload;

  // try {
  //   payload = jwt.verify(token, JWT_SECRET!) as { _id: string };
  // } catch (err) {
  //   return handleAuthError(res);
  // }

  try {
    payload = jwt.verify(token, JWT_SECRET!) as { _id: string };
    console.log('Decoded payload:', payload); // Добавьте эту строку
  } catch (err) {
    console.error('JWT verify error:', err); // Логируем ошибку
    return handleAuthError(res);
  }

  req.user = { _id: payload._id };

  next();
};
