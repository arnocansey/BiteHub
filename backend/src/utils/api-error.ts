export class ApiError extends Error {
  constructor(
    public readonly statusCode = 400,
    message = "Request failed"
  ) {
    super(message);
  }
}

