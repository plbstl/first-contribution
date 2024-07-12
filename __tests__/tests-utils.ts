/**
 * There might be a need to flesh this out even more. But this is enough for now.
 * @see https://docs.github.com/en/rest/guides/scripting-with-the-rest-api-and-javascript?apiVersion=2022-11-28#catching-errors
 */
export class ResponseErrorMock extends Error {
  private _response: unknown

  constructor(status: number, message: string) {
    super(message)
    this._response = { status, data: { message } }
  }

  get response(): unknown {
    return this._response
  }
}
