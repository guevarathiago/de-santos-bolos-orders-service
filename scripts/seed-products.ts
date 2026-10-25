import { AppDataSource } from '../src/database/data-source.js';
import { Product } from '../src/modules/products/product.entity.js';

// Sample menu for development. Prices are placeholders; adjust them to the real menu.
const menu = [
    { name: 'Bolo de cenoura com chocolate', description: 'Massa de cenoura com cobertura de chocolate.', priceCents: 6500 },
    { name: 'Bolo de laranja sem glúten', description: 'Receita sem glúten, preparada em dia separado.', priceCents: 7000 },
    { name: 'Bolo de chocolate sem lactose', description: 'Massa e cobertura de chocolate sem lactose.', priceCents: 7500 },
    { name: 'Bolo de fubá com goiabada', description: 'Fubá cremoso com pedaços de goiabada.', priceCents: 5500 },
    { name: 'Brownie sem glúten e sem lactose', description: 'Caixa com 6 unidades.', priceCents: 4800 },
];

await AppDataSource.initialize();

const products = AppDataSource.getRepository(Product);

if (await products.count()) {
    console.log('Products already exist; nothing to seed.');
} else {
    await products.save(menu.map((item) => products.create(item)));
    console.log(`Seeded ${menu.length} products.`);
}

await AppDataSource.destroy();
