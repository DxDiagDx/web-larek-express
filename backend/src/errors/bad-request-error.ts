import HttpCodes from './codes';

class BadRequestError extends Error {
  public statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = HttpCodes.BAD_REQUEST;
  }
}

export default BadRequestError;
