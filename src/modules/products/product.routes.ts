import { Router } from 'express';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import { createProductController } from './product.controller.js';
import { createProductSchema, listProductsQuerySchema } from './product.schemas.js';
import type { ProductService } from './product.service.js';

export const createProductRouter = (productService: ProductService) => {
    const controller = createProductController(productService);
    const router = Router();

    router.get('/', validateQuery(listProductsQuerySchema), controller.list);
    router.post('/', validateBody(createProductSchema), controller.create);

    return router;
};
