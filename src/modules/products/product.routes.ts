import { Router } from 'express';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import { createProductController } from './product.controller.js';
import { createProductSchema, listProductsQuerySchema, updateProductSchema } from './product.schemas.js';
import type { ProductService } from './product.service.js';

export const createProductRouter = (productService: ProductService) => {
    const controller = createProductController(productService);
    const router = Router();

    router.get('/', validateQuery(listProductsQuerySchema), controller.list);
    router.post('/', validateBody(createProductSchema), controller.create);
    router.patch('/:id', validateBody(updateProductSchema), controller.update);
    router.delete('/:id', controller.remove);

    return router;
};
