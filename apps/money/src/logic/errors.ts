/**
 * Thrown when the information given to the calculator cannot be used,
 * for example an amount that is not a whole number of pence, or a date
 * that does not exist. The screens check input before it gets here, so
 * seeing this error means there is a bug to fix, not a person to blame.
 */
export class InvalidInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidInputError";
  }
}
