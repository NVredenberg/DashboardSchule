export class AppError extends Error {
  public constructor(
    message: string,
    public readonly statusCode = 500,
    public override readonly cause?: unknown,
    public readonly responseBody?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
