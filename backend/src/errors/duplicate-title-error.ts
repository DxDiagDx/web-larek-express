import HttpCodes from './codes';

class DuplicateTitleError extends Error {
  public statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = HttpCodes.CONFLICT;
  }
}

export default DuplicateTitleError;
