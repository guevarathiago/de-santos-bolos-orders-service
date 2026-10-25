import type { NextFunction, Request, Response } from 'express';
import { z, type ZodType } from 'zod';

const invalid = (res: Response, message: string, error: z.ZodError) =>
    res.status(400).json({ message, errors: z.flattenError(error).fieldErrors });

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
