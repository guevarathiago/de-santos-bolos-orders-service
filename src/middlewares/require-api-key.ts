import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

const digest = (value: string) => createHash('sha256').update(value).digest();

const expected = digest(env.INTERNAL_API_KEY);

// Only the De Santos Bolos back-end may call this service. Hashing both sides gives equal lengths,
// which timingSafeEqual needs, and the constant-time compare does not leak how much of the key matched.
export const requireApiKey = (req: Request, res: Response, next: NextFunction) => {
    const key = req.header('x-api-key');

    if (!key || !timingSafeEqual(digest(key), expected)) {
        return res.status(401).json({ message: 'Invalid API key' });
    }

    next();
};
