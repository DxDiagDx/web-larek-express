import HttpCodes from './codes';

class ConflictError extends Error {
  public statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = HttpCodes.CONFLICT;
  }
}

export default ConflictError;
