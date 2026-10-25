import { z } from 'zod';
import { OrderStatus } from './order.entity.js';

export const MAX_ORDER_ITEMS = 20;
export const MAX_ITEM_QUANTITY = 50;

export const createOrderSchema = z.object({
    userId: z.uuid(),
    items: z
        .array(z.object({
            productId: z.uuid(),
            quantity: z.number().int().min(1).max(MAX_ITEM_QUANTITY),
        }))
        .min(1)
        .max(MAX_ORDER_ITEMS),
    deliveryDate: z.iso.date(),
    notes: z.string().trim().max(500).optional(),
});

export const listOrdersQuerySchema = z.object({
    userId: z.uuid().optional(),
    status: z.enum(OrderStatus).optional(),
});

export const getOrderQuerySchema = z.object({
    userId: z.uuid().optional(),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(OrderStatus),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type GetOrderQuery = z.infer<typeof getOrderQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
