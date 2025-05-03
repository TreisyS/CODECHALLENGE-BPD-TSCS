export class ConflictError extends Error { status = 409; }
export class BadRequestError extends Error { status = 400; }
export class InternalError extends Error { status = 500; }
export class NotFoundError extends Error { status = 404; }
