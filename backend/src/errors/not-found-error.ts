import HttpCodes from './codes';

class NotFoundError extends Error {
  public statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = HttpCodes.NOT_FOUND;
  }
}

export default NotFoundError;
