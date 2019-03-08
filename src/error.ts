export default class APIError extends Error {
  constructor(public response: Response, body: string) {
    super(body)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
