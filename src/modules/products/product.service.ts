import type { Repository } from 'typeorm';
import type { Product } from './product.entity.js';
import type { CreateProductInput, ListProductsQuery } from './product.schemas.js';

export const createProductService = (products: Repository<Product>) => ({
    list({ available }: ListProductsQuery = {}) {
        return products.find({
            where: available === undefined ? {} : { available },
            order: { name: 'ASC' },
        });
    },

    create(data: CreateProductInput) {
        return products.save(products.create(data));
    },
});

export type ProductService = ReturnType<typeof createProductService>;
