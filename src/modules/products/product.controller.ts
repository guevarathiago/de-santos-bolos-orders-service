import type { Request, Response } from 'express';
import type { CreateProductInput, ListProductsQuery } from './product.schemas.js';
import type { ProductService } from './product.service.js';

export const createProductController = (productService: ProductService) => ({
    async list(_req: Request, res: Response) {
        return res.status(200).json(await productService.list(res.locals.query as ListProductsQuery));
    },

    async create(req: Request, res: Response) {
        return res.status(201).json(await productService.create(req.body as CreateProductInput));
    },
});
