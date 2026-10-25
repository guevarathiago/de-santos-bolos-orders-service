import { In, type Repository } from 'typeorm';
import { z } from 'zod';
import { HttpError } from '../../errors/http-error.js';
import type { Product } from '../products/product.entity.js';
import { type Order, OrderStatus } from './order.entity.js';
import type { CreateOrderInput, ListOrdersQuery } from './order.schemas.js';

const STORE_TIME_ZONE = 'America/Sao_Paulo';

// The store's calendar day (YYYY-MM-DD), not the server's.
export const storeToday = (now = new Date()) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: STORE_TIME_ZONE }).format(now);

// Which status each status may move to; anything else is refused.
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    [OrderStatus.PREPARING]: [OrderStatus.READY],
    [OrderStatus.READY]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
};

const LIST_LIMIT = 50;

type OrderServiceDependencies = {
    orders: Repository<Order>;
    products: Repository<Product>;
    today?: () => string;
};

const isUuid = (value: string) => z.uuid().safeParse(value).success;

export const createOrderService = ({ orders, products, today = storeToday }: OrderServiceDependencies) => {
    const findOrFail = async (id: string, userId?: string) => {
        const order = isUuid(id) ? await orders.findOne({ where: { id }, relations: { items: true } }) : null;

        // Another user's order answers 404 too, so ids cannot be probed.
        if (!order || (userId && order.userId !== userId)) {
            throw new HttpError(404, 'Order not found');
        }

        return order;
    };

    return {
        async create({ userId, items, deliveryDate, notes }: CreateOrderInput) {
            // Cakes from the menu need 24 hours' notice, so delivery starts tomorrow.
            if (deliveryDate <= today()) {
                throw new HttpError(422, 'Delivery date must be after today');
            }

            const quantities = new Map<string, number>();
            for (const { productId, quantity } of items) {
                quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
            }

            const found = await products.findBy({ id: In([...quantities.keys()]) });

            const orderItems = [...quantities].map(([productId, quantity]) => {
                const product = found.find(({ id }) => id === productId);

                if (!product?.available) {
                    throw new HttpError(422, `Product unavailable: ${product?.name ?? productId}`);
                }

                return { productId, productName: product.name, unitPriceCents: product.priceCents, quantity };
            });

            const totalCents = orderItems.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

            return orders.save(orders.create({
                userId,
                deliveryDate,
                notes: notes ?? null,
                totalCents,
                status: OrderStatus.PENDING,
                items: orderItems,
            }));
        },

        list({ userId, status }: ListOrdersQuery = {}) {
            return orders.find({
                where: { ...(userId ? { userId } : {}), ...(status ? { status } : {}) },
                relations: { items: true },
                order: { createdAt: 'DESC' },
                take: LIST_LIMIT,
            });
        },

        get(id: string, userId?: string) {
            return findOrFail(id, userId);
        },

        async updateStatus(id: string, status: OrderStatus) {
            const order = await findOrFail(id);

            if (!NEXT_STATUSES[order.status].includes(status)) {
                throw new HttpError(409, `Cannot change an order from ${order.status} to ${status}`);
            }

            await orders.update(order.id, { status });

            return { ...order, status };
        },
    };
};

export type OrderService = ReturnType<typeof createOrderService>;
