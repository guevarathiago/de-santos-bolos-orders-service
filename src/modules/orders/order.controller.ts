import type { Request, Response } from 'express';
import type { CreateOrderInput, GetOrderQuery, ListOrdersQuery, UpdateOrderStatusInput } from './order.schemas.js';
import type { OrderService } from './order.service.js';

export const createOrderController = (orderService: OrderService) => ({
    async create(req: Request, res: Response) {
        return res.status(201).json(await orderService.create(req.body as CreateOrderInput));
    },

    async list(_req: Request, res: Response) {
        return res.status(200).json(await orderService.list(res.locals.query as ListOrdersQuery));
    },

    async get(req: Request<{ id: string }>, res: Response) {
        const { userId } = res.locals.query as GetOrderQuery;

        return res.status(200).json(await orderService.get(req.params.id, userId));
    },

    async updateStatus(req: Request<{ id: string }>, res: Response) {
        const { status } = req.body as UpdateOrderStatusInput;

        return res.status(200).json(await orderService.updateStatus(req.params.id, status));
    },
});
