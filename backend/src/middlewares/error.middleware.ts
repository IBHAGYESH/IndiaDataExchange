import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;

  constructor(
    name: string,
    statusCode: number,
    description: string,
    isOperational: boolean,
    errorCode?: string
  ) {
    super(description);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    const errorCtor = Error as unknown as ErrorConstructor & {
      captureStackTrace?: (targetObject: object, constructorOpt?: Function) => void;
    };
    if (typeof errorCtor.captureStackTrace === "function") {
      errorCtor.captureStackTrace(this, AppError);
    }
  }
}

export const errorHandlerMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      errorCode: error.errorCode,
      message: error.message,
    });
  }

  if (error instanceof Error) {
    return res.status(500).json({ message: error.message || "Something went wrong" });
  }

  return res.status(500).json({ message: "Something went wrong" });
};
