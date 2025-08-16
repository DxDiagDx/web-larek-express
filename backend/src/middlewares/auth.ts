import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import UnauthorizedError from '../errors/unauthorized-error';

const { JWT_SECRET } = process.env;

export interface AuthRequest extends Request {
  user?: { _id: string };
}

const extractBearerToken = (header: string) => header.replace('Bearer ', '');

export default (req: AuthRequest, _res: Response, next: NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Необходима авторизация'));
  }

  const token = extractBearerToken(authorization);

  let payload;

  try {
    payload = jwt.verify(token, JWT_SECRET!) as { _id: string };
  } catch (err) {
    return next(new UnauthorizedError('Необходима авторизация'));
  }

  req.user = { _id: payload._id };

  return next();
};
