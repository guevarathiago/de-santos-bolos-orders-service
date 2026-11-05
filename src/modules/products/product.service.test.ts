import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';
import { type Product, ProductCategory } from './product.entity.js';
import { createProductService } from './product.service.js';

const productId = '11111111-1111-4111-8111-111111111111';

const makeService = (stored: Partial<Product> | null = null) => {
    const products = {
        find: vi.fn().mockResolvedValue([]),
        create: vi.fn((data: Partial<Product>) => data),
        save: vi.fn(async (data: Partial<Product>) => data),
        findOneBy: vi.fn().mockResolvedValue(stored),
        merge: vi.fn((target: Partial<Product>, data: Partial<Product>) => Object.assign(target, data)),
        softDelete: vi.fn().mockResolvedValue({ affected: stored ? 1 : 0 }),
    };

    return { service: createProductService(products as unknown as Repository<Product>), products };
};

describe('productService.list', () => {
    it('shows featured products first, then the chosen order, then by name', async () => {
        const { service, products } = makeService();

        await service.list();

        expect(products.find).toHaveBeenCalledWith({
            where: {},
            order: { featured: 'DESC', sortOrder: 'ASC', name: 'ASC' },
        });
    });

    it('combines the filters that were sent', async () => {
        const { service, products } = makeService();

        await service.list({ available: true, category: ProductCategory.BROWNIE });

        expect(products.find).toHaveBeenCalledWith(expect.objectContaining({
            where: { available: true, category: ProductCategory.BROWNIE },
        }));
    });
});

describe('productService.update', () => {
    it('changes only the fields that were sent', async () => {
        const { service, products } = makeService({ id: productId, name: 'Bolo de cenoura', priceCents: 6500, available: true });

        const product = await service.update(productId, { priceCents: 7000, available: false });

        expect(products.save).toHaveBeenCalled();
        expect(product).toEqual({ id: productId, name: 'Bolo de cenoura', priceCents: 7000, available: false });
    });

    it.each([
        ['the product does not exist', productId, null],
        ['the id is not a uuid', 'abc', { id: productId }],
    ])('answers 404 when %s', async (_label, id, stored) => {
        const { service, products } = makeService(stored);

        await expect(service.update(id, { available: false })).rejects.toMatchObject({ status: 404 });
        expect(products.save).not.toHaveBeenCalled();
    });
});

describe('productService.remove', () => {
    it('soft deletes the product, keeping the row for past orders', async () => {
        const { service, products } = makeService({ id: productId });

        await service.remove(productId);

        expect(products.softDelete).toHaveBeenCalledWith({ id: productId });
    });

    it.each([
        ['the product does not exist or was already deleted', productId],
        ['the id is not a uuid', 'abc'],
    ])('answers 404 when %s', async (_label, id) => {
        const { service } = makeService(null);

        await expect(service.remove(id)).rejects.toMatchObject({ status: 404 });
    });
});
