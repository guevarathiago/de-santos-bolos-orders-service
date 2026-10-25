import express from 'express';
import { errorHandler } from './middlewares/error-handler.js';
import { requireApiKey } from './middlewares/require-api-key.js';
import { createOrderRouter } from './modules/orders/order.routes.js';
import type { OrderService } from './modules/orders/order.service.js';
import { createProductRouter } from './modules/products/product.routes.js';
import type { ProductService } from './modules/products/product.service.js';

type AppDependencies = {
    productService: ProductService;
    orderService: OrderService;
};

export const createApp = ({ productService, orderService }: AppDependencies) => {
    const app = express();

    app.use(express.json());

    // Open on purpose, for health checks from Docker or a load balancer.
    app.get('/health', (_req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    app.use(requireApiKey);
    app.use('/products', createProductRouter(productService));
    app.use('/orders', createOrderRouter(orderService));

    app.use(errorHandler);

    return app;
};
