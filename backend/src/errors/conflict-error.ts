import HttpCodes from './codes';

class ConflictError extends Error {
  public statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = HttpCodes.INTERNAL_SERVER_ERROR;
  }
}

export default ConflictError;
