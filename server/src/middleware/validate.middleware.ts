import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';
import { ApiError } from '../shared/errors';

export type ValidatorTarget = 'body' | 'query' | 'params';

export const validate =
  (schema: AnyZodObject, target: ValidatorTarget = 'body') =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[target]);
      req[target] = data; // replace with coerced/transformed values
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        next(ApiError.unprocessable('Validation failed', fieldErrors));
        return;
      }
      next(ApiError.internal('Unexpected validation error'));
    }
  };

export const validateBody = (schema: AnyZodObject) => validate(schema, 'body');
export const validateQuery = (schema: AnyZodObject) => validate(schema, 'query');
export const validateParams = (schema: AnyZodObject) => validate(schema, 'params');
