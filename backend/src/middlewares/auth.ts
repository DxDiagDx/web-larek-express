import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import HttpCodes from '../errors/codes';

const { JWT_SECRET } = process.env;

export interface AuthRequest extends Request {
  user?: { _id: string };
}

const handleAuthError = (res: Response) => {
  res
    .status(HttpCodes.UNAUTHORIZED)
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

  try {
    payload = jwt.verify(token, JWT_SECRET!) as { _id: string };
  } catch (err) {
    return handleAuthError(res);
  }

  req.user = { _id: payload._id };

  next();
};
