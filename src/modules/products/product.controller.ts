import type { Request, Response } from 'express';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './product.schemas.js';
import type { ProductService } from './product.service.js';

export const createProductController = (productService: ProductService) => ({
    async list(_req: Request, res: Response) {
        return res.status(200).json(await productService.list(res.locals.query as ListProductsQuery));
    },

    async create(req: Request, res: Response) {
        return res.status(201).json(await productService.create(req.body as CreateProductInput));
    },

    async update(req: Request<{ id: string }>, res: Response) {
        return res.status(200).json(await productService.update(req.params.id, req.body as UpdateProductInput));
    },

    async remove(req: Request<{ id: string }>, res: Response) {
        await productService.remove(req.params.id);

        return res.status(204).send();
    },
});
