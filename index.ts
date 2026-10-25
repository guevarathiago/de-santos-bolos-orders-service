import { createApp } from './src/app.js';
import { env } from './src/config/env.js';
import { AppDataSource } from './src/database/data-source.js';
import { Order } from './src/modules/orders/order.entity.js';
import { createOrderService } from './src/modules/orders/order.service.js';
import { Product } from './src/modules/products/product.entity.js';
import { createProductService } from './src/modules/products/product.service.js';

try {
    await AppDataSource.initialize();
    console.log('Database connected successfully');
} catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
}

const products = AppDataSource.getRepository(Product);

const app = createApp({
    productService: createProductService(products),
    orderService: createOrderService({ orders: AppDataSource.getRepository(Order), products }),
});

app.listen(env.PORT, () => {
    console.log(`Orders service is running on port ${env.PORT}`);
});
