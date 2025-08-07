import {
  Request,
  Response,
  NextFunction,
  ErrorRequestHandler,
} from 'express';
import { CelebrateError, isCelebrateError } from 'celebrate';
import BadRequestError from '../errors/bad-request-error';

function formatCelebrateError(error: CelebrateError) {
  const details = Array.from(error?.details?.values());
  return `${error.message}: ${details.map((err) => err.message).join('\n')}.`;
}

const errorHandler: ErrorRequestHandler = (
  err,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (isCelebrateError(err)) {
    const message = formatCelebrateError(err);
    const error = new BadRequestError(message);
    return res.status(error.statusCode).send({ message: error.message });
  }
  return res.status(err.statusCode || 500).send({ message: err.message || 'Internal Server Error' });
};

export default errorHandler;
