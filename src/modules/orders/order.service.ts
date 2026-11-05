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

// Calendar arithmetic on YYYY-MM-DD strings; UTC avoids daylight saving shifts.
export const addDays = (date: string, days: number) => {
    const day = new Date(`${date}T00:00:00Z`);
    day.setUTCDate(day.getUTCDate() + days);

    return day.toISOString().slice(0, 10);
};

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
            const quantities = new Map<string, number>();
            for (const { productId, quantity } of items) {
                quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
            }

            const found = await products.findBy({ id: In([...quantities.keys()]) });

            const ordered = [...quantities].map(([productId, quantity]) => {
                const product = found.find(({ id }) => id === productId);

                if (!product?.available) {
                    throw new HttpError(422, `Product unavailable: ${product?.name ?? productId}`);
                }

                return { product, quantity };
            });

            // The whole order is delivered together, so it waits for the product that needs the most notice.
            const earliestDelivery = addDays(today(), Math.max(...ordered.map(({ product }) => product.leadTimeDays)));

            if (deliveryDate < earliestDelivery) {
                throw new HttpError(422, `Earliest delivery date for these products is ${earliestDelivery}`);
            }

            const orderItems = ordered.map(({ product, quantity }) => ({
                productId: product.id,
                productName: product.name,
                unitPriceCents: product.priceCents,
                quantity,
            }));

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
