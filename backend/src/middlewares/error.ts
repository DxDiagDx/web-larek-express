import {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from 'express';
import { CelebrateError, isCelebrateError } from 'celebrate';
import BadRequestError from '../errors/bad-request-error';
import HttpCodes from '../errors/codes';

function formatCelebrateError(error: CelebrateError) {
  const details = Array.from(error?.details?.values());
  return `${error.message}: ${details.map((err) => err.message).join('\n')}.`;
}

const errorHandler: ErrorRequestHandler = (
  err,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (isCelebrateError(err)) {
    const message = formatCelebrateError(err);
    const error = new BadRequestError(message);
    res.status(error.statusCode).send({ message: error.message });
    return next();
  }
  res.status(err.statusCode || HttpCodes.INTERNAL_SERVER_ERROR)
    .send({ message: err.message || 'На сервере произошла ошибка' });
  return next();
};

export default errorHandler;
