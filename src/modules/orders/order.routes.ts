import { Router } from 'express';
import { validateBody, validateQuery } from '../../middlewares/validate.js';
import { createOrderController } from './order.controller.js';
import { createOrderSchema, getOrderQuerySchema, listOrdersQuerySchema, updateOrderStatusSchema } from './order.schemas.js';
import type { OrderService } from './order.service.js';

export const createOrderRouter = (orderService: OrderService) => {
    const controller = createOrderController(orderService);
    const router = Router();

    router.post('/', validateBody(createOrderSchema), controller.create);
    router.get('/', validateQuery(listOrdersQuerySchema), controller.list);
    router.get('/:id', validateQuery(getOrderQuerySchema), controller.get);
    router.patch('/:id/status', validateBody(updateOrderStatusSchema), controller.updateStatus);

    return router;
};
