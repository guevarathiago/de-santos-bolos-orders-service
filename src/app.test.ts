import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app.js';
import { HttpError } from './errors/http-error.js';
import { OrderStatus } from './modules/orders/order.entity.js';
import type { OrderService } from './modules/orders/order.service.js';
import type { ProductService } from './modules/products/product.service.js';

const apiKey = { 'x-api-key': 'test-internal-api-key' };

const userId = '99999999-9999-4999-8999-999999999999';
const productId = '11111111-1111-4111-8111-111111111111';
const orderId = '44444444-4444-4444-8444-444444444444';

const makeApp = (overrides: Partial<OrderService> = {}) => {
    const productService = {
        list: vi.fn().mockResolvedValue([]),
        create: vi.fn(async (data) => ({ id: productId, ...data })),
    } as ProductService;

    const orderService = {
        create: vi.fn(async (data) => ({ id: orderId, ...data })),
        list: vi.fn().mockResolvedValue([]),
        get: vi.fn().mockResolvedValue({ id: orderId }),
        updateStatus: vi.fn().mockResolvedValue({ id: orderId, status: OrderStatus.CONFIRMED }),
        ...overrides,
    } as OrderService;

    return { app: createApp({ productService, orderService }), productService, orderService };
};

describe('internal API key', () => {
    it('keeps /health open for health checks', async () => {
        const res = await request(makeApp().app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'ok' });
    });

    it.each([
        ['missing', {}],
        ['wrong', { 'x-api-key': 'not-the-key' }],
    ])('answers 401 when the key is %s', async (_label, headers) => {
        const { app, orderService } = makeApp();

        const res = await request(app).get('/orders').set(headers);

        expect(res.status).toBe(401);
        expect(orderService.list).not.toHaveBeenCalled();
    });
});

describe('products', () => {
    it('turns ?available=true into a boolean filter', async () => {
        const { app, productService } = makeApp();

        await request(app).get('/products?available=true').set(apiKey);

        expect(productService.list).toHaveBeenCalledWith({ available: true });
    });

    it('creates a product with 201 and rejects a price that is not in whole cents', async () => {
        const { app } = makeApp();

        const created = await request(app).post('/products').set(apiKey).send({ name: 'Bolo de milho', priceCents: 5000 });
        const invalid = await request(app).post('/products').set(apiKey).send({ name: 'Bolo de milho', priceCents: 50.5 });

        expect(created.status).toBe(201);
        expect(created.body).toMatchObject({ name: 'Bolo de milho', description: '', available: true });
        expect(invalid.status).toBe(400);
    });
});

describe('POST /orders', () => {
    const validOrder = { userId, deliveryDate: '2026-10-25', items: [{ productId, quantity: 2 }] };

    it('creates an order with 201', async () => {
        const { app, orderService } = makeApp();

        const res = await request(app).post('/orders').set(apiKey).send({ ...validOrder, notes: '  Escrever Parabéns  ' });

        expect(res.status).toBe(201);
        expect(orderService.create).toHaveBeenCalledWith({ ...validOrder, notes: 'Escrever Parabéns' });
    });

    it.each([
        ['no items', { ...validOrder, items: [] }],
        ['a quantity of zero', { ...validOrder, items: [{ productId, quantity: 0 }] }],
        ['a product id that is not a uuid', { ...validOrder, items: [{ productId: '1', quantity: 1 }] }],
        ['a date in another format', { ...validOrder, deliveryDate: '25/10/2026' }],
        ['no user', { ...validOrder, userId: undefined }],
    ])('rejects %s with 400', async (_label, body) => {
        const { app, orderService } = makeApp();

        const res = await request(app).post('/orders').set(apiKey).send(body);

        expect(res.status).toBe(400);
        expect(orderService.create).not.toHaveBeenCalled();
    });

    it('passes business errors from the service through', async () => {
        const { app } = makeApp({ create: vi.fn().mockRejectedValue(new HttpError(422, 'Delivery date must be after today')) });

        const res = await request(app).post('/orders').set(apiKey).send(validOrder);

        expect(res.status).toBe(422);
        expect(res.body).toEqual({ message: 'Delivery date must be after today' });
    });
});

describe('GET /orders', () => {
    it('filters by user and status from the query string', async () => {
        const { app, orderService } = makeApp();

        await request(app).get(`/orders?userId=${userId}&status=PENDING`).set(apiKey);

        expect(orderService.list).toHaveBeenCalledWith({ userId, status: OrderStatus.PENDING });
    });

    it('rejects an unknown status with 400', async () => {
        const { app } = makeApp();

        expect((await request(app).get('/orders?status=SHIPPED').set(apiKey)).status).toBe(400);
    });

    it('checks ownership when a user asks for one order', async () => {
        const { app, orderService } = makeApp();

        await request(app).get(`/orders/${orderId}?userId=${userId}`).set(apiKey);

        expect(orderService.get).toHaveBeenCalledWith(orderId, userId);
    });
});

describe('PATCH /orders/:id/status', () => {
    it('changes the status', async () => {
        const { app, orderService } = makeApp();

        const res = await request(app).patch(`/orders/${orderId}/status`).set(apiKey).send({ status: 'CONFIRMED' });

        expect(res.status).toBe(200);
        expect(orderService.updateStatus).toHaveBeenCalledWith(orderId, OrderStatus.CONFIRMED);
    });
});
