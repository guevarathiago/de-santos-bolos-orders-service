import type { DeepPartial, Repository } from 'typeorm';
import { z } from 'zod';
import { HttpError } from '../../errors/http-error.js';
import type { Product } from './product.entity.js';
import type { CreateProductInput, ListProductsQuery, UpdateProductInput } from './product.schemas.js';

const isUuid = (value: string) => z.uuid().safeParse(value).success;

export const createProductService = (products: Repository<Product>) => ({
    list({ available, featured, category }: ListProductsQuery = {}) {
        return products.find({
            where: {
                ...(available === undefined ? {} : { available }),
                ...(featured === undefined ? {} : { featured }),
                ...(category ? { category } : {}),
            },
            // Featured first, then the order the admin chose, then by name.
            order: { featured: 'DESC', sortOrder: 'ASC', name: 'ASC' },
        });
    },

    create(data: CreateProductInput) {
        return products.save(products.create(data));
    },

    async update(id: string, data: UpdateProductInput) {
        const product = isUuid(id) ? await products.findOneBy({ id }) : null;

        if (!product) {
            throw new HttpError(404, 'Product not found');
        }

        // Past orders keep their own copy of name and price, so editing never rewrites them.
        // Zod leaves out the fields that were not sent, so nothing here is set to undefined.
        return products.save(products.merge(product, data as DeepPartial<Product>));
    },

    async remove(id: string) {
        const { affected } = isUuid(id) ? await products.softDelete({ id }) : { affected: 0 };

        if (!affected) {
            throw new HttpError(404, 'Product not found');
        }
    },
});

export type ProductService = ReturnType<typeof createProductService>;
