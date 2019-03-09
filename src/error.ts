export class APIError extends Error {
  constructor(public response: Response, body: string) {
    super(body)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class TokenNotFoundError extends Error {
  constructor() {
    super("GitHub token not found. Please configure option page")
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
