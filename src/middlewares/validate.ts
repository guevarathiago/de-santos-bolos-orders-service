import type { NextFunction, Request, Response } from 'express';
import { z, type ZodType } from 'zod';

// Form errors are rules about the whole object, like "send at least one field".
const invalid = (res: Response, message: string, error: z.ZodError) => {
    const { formErrors, fieldErrors } = z.flattenError(error);

    return res.status(400).json({ message, errors: fieldErrors, ...(formErrors.length ? { formErrors } : {}) });
};

export const validateBody = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
        return invalid(res, 'Invalid request body', result.error);
    }

    req.body = result.data;
    next();
};

// Express 5 makes req.query read-only, so the parsed query goes to res.locals.query.
export const validateQuery = (schema: ZodType) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
        return invalid(res, 'Invalid query string', result.error);
    }

    res.locals.query = result.data;
    next();
};
