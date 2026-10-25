import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { DataSource } from 'typeorm';
import { env } from '../config/env.js';
import { Order, OrderItem } from '../modules/orders/order.entity.js';
import { Product } from '../modules/products/product.entity.js';

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: env.DATABASE_URL,
    entities: [Product, Order, OrderItem],
    migrations: [fileURLToPath(new URL('./migrations/*.{ts,js}', import.meta.url))],
    synchronize: false,
    logging: env.NODE_ENV === 'development' ? ['error', 'migration'] : ['error'],
});
