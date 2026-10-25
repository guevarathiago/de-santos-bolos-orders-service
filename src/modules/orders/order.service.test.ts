import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import type { Product } from '../products/product.entity.js';
import { type Order, OrderStatus } from './order.entity.js';
import { createOrderService, storeToday } from './order.service.js';

const carrot = { id: '11111111-1111-4111-8111-111111111111', name: 'Bolo de cenoura', priceCents: 6500, available: true };
const orange = { id: '22222222-2222-4222-8222-222222222222', name: 'Bolo de laranja', priceCents: 7000, available: true };
const soldOut = { id: '33333333-3333-4333-8333-333333333333', name: 'Bolo de fubá', priceCents: 5500, available: false };

const userId = '99999999-9999-4999-8999-999999999999';
const orderId = '44444444-4444-4444-8444-444444444444';

const makeService = ({ stored = null as Partial<Order> | null, catalog = [carrot, orange, soldOut] } = {}) => {
    const orders = {
        create: vi.fn((data: Partial<Order>) => data),
        save: vi.fn(async (data: Partial<Order>) => ({ id: orderId, ...data })),
        find: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue(stored),
        update: vi.fn(),
    };
    const products = {
        findBy: vi.fn(async () => catalog),
    };

    const service = createOrderService({
        orders: orders as unknown as Repository<Order>,
        products: products as unknown as Repository<Product>,
        today: () => '2026-10-24',
    });

    return { service, orders, products };
};

describe('storeToday', () => {
    it('uses the store calendar day in São Paulo, not UTC', () => {
        // 01:30 UTC on the 25th is still 22:30 on the 24th in São Paulo.
        expect(storeToday(new Date('2026-10-25T01:30:00Z'))).toBe('2026-10-24');
    });
});

describe('orderService.create', () => {
    it('saves a PENDING order with the price and name of each product copied at order time', async () => {
        const { service, orders } = makeService();

        const order = await service.create({
            userId,
            deliveryDate: '2026-10-25',
            items: [{ productId: carrot.id, quantity: 2 }, { productId: orange.id, quantity: 1 }],
        });

        expect(orders.save).toHaveBeenCalledWith({
            userId,
            deliveryDate: '2026-10-25',
            notes: null,
            totalCents: 2 * 6500 + 7000,
            status: OrderStatus.PENDING,
            items: [
                { productId: carrot.id, productName: 'Bolo de cenoura', unitPriceCents: 6500, quantity: 2 },
                { productId: orange.id, productName: 'Bolo de laranja', unitPriceCents: 7000, quantity: 1 },
            ],
        });
        expect(order.id).toBe(orderId);
    });

    it('merges repeated products into one item', async () => {
        const { service, orders } = makeService();

        await service.create({
            userId,
            deliveryDate: '2026-10-25',
            items: [{ productId: carrot.id, quantity: 1 }, { productId: carrot.id, quantity: 2 }],
        });

        expect(orders.save.mock.calls[0]?.[0].items).toEqual([
            { productId: carrot.id, productName: 'Bolo de cenoura', unitPriceCents: 6500, quantity: 3 },
        ]);
    });

    it.each([
        ['today', '2026-10-24'],
        ['a past day', '2026-10-01'],
    ])('refuses delivery %s, since the menu needs 24 hours of notice', async (_label, deliveryDate) => {
        const { service, orders } = makeService();

        await expect(service.create({ userId, deliveryDate, items: [{ productId: carrot.id, quantity: 1 }] }))
            .rejects.toMatchObject({ status: 422 });
        expect(orders.save).not.toHaveBeenCalled();
    });

    it('refuses products that are not available', async () => {
        const { service, orders } = makeService();

        await expect(service.create({ userId, deliveryDate: '2026-10-25', items: [{ productId: soldOut.id, quantity: 1 }] }))
            .rejects.toMatchObject({ status: 422, message: 'Product unavailable: Bolo de fubá' });
        expect(orders.save).not.toHaveBeenCalled();
    });

    it('refuses products that do not exist', async () => {
        const { service } = makeService({ catalog: [carrot] });

        await expect(service.create({
            userId,
            deliveryDate: '2026-10-25',
            items: [{ productId: orange.id, quantity: 1 }],
        })).rejects.toMatchObject({ status: 422 });
    });
});

describe('orderService.list', () => {
    it('filters by user and status, newest first, with the items', async () => {
        const { service, orders } = makeService();

        await service.list({ userId, status: OrderStatus.PENDING });

        expect(orders.find).toHaveBeenCalledWith(expect.objectContaining({
            where: { userId, status: OrderStatus.PENDING },
            relations: { items: true },
            order: { createdAt: 'DESC' },
        }));
    });

    it('lists every order when no filter is given', async () => {
        const { service, orders } = makeService();

        await service.list();

        expect(orders.find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });
});

describe('orderService.get', () => {
    it('returns the order of its owner', async () => {
        const { service } = makeService({ stored: { id: orderId, userId } });

        expect(await service.get(orderId, userId)).toMatchObject({ id: orderId });
    });

    it.each([
        ['another user asks for it', orderId, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'],
        ['the id is not a uuid', 'abc', userId],
    ])('answers 404 when %s', async (_label, id, askingUser) => {
        const { service } = makeService({ stored: { id: orderId, userId } });

        await expect(service.get(id, askingUser)).rejects.toMatchObject({ status: 404 });
    });
});

describe('orderService.updateStatus', () => {
    it('moves an order forward along the allowed path', async () => {
        const { service, orders } = makeService({ stored: { id: orderId, userId, status: OrderStatus.PENDING } });

        const order = await service.updateStatus(orderId, OrderStatus.CONFIRMED);

        expect(orders.update).toHaveBeenCalledWith(orderId, { status: OrderStatus.CONFIRMED });
        expect(order.status).toBe(OrderStatus.CONFIRMED);
    });

    it.each([
        [OrderStatus.PENDING, OrderStatus.DELIVERED],
        [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
        [OrderStatus.CANCELLED, OrderStatus.CONFIRMED],
    ])('refuses %s → %s with 409', async (from, to) => {
        const { service, orders } = makeService({ stored: { id: orderId, userId, status: from } });

        await expect(service.updateStatus(orderId, to)).rejects.toMatchObject({ status: 409 });
        expect(orders.update).not.toHaveBeenCalled();
    });
});
