import type { DeepPartial } from 'typeorm';
import { AppDataSource } from '../src/database/data-source.js';
import { DietaryTag, Product, ProductCategory } from '../src/modules/products/product.entity.js';

// Sample menu for development, based on the store FAQ. Prices are placeholders; adjust them to the real menu.
const menu: DeepPartial<Product>[] = [
    {
        name: 'Bolo de cenoura com chocolate',
        description: 'Massa de cenoura com cobertura de chocolate.',
        category: ProductCategory.CAKE,
        priceCents: 6500,
        servings: 12,
        weightGrams: 1500,
        featured: true,
        sortOrder: 1,
    },
    {
        name: 'Bolo de laranja sem glúten',
        description: 'Receita sem glúten, preparada em dia separado.',
        category: ProductCategory.CAKE,
        priceCents: 7000,
        dietaryTags: [DietaryTag.GLUTEN_FREE],
        servings: 10,
        weightGrams: 1200,
        sortOrder: 2,
    },
    {
        name: 'Bolo de chocolate sem lactose',
        description: 'Massa e cobertura de chocolate sem lactose.',
        category: ProductCategory.CAKE,
        priceCents: 7500,
        dietaryTags: [DietaryTag.LACTOSE_FREE],
        servings: 12,
        weightGrams: 1500,
        sortOrder: 3,
    },
    {
        name: 'Bolo de fubá com goiabada',
        description: 'Fubá cremoso com pedaços de goiabada.',
        category: ProductCategory.CAKE,
        priceCents: 5500,
        servings: 10,
        weightGrams: 1200,
        sortOrder: 4,
    },
    {
        name: 'Bolo de chocolate vegano',
        description: 'Sob encomenda, com 3 dias de antecedência.',
        category: ProductCategory.CAKE,
        priceCents: 8500,
        dietaryTags: [DietaryTag.VEGAN, DietaryTag.LACTOSE_FREE],
        servings: 12,
        weightGrams: 1500,
        leadTimeDays: 3,
        sortOrder: 5,
    },
    {
        name: 'Brownie sem glúten e sem lactose',
        description: 'Caixa com 6 unidades.',
        category: ProductCategory.BROWNIE,
        priceCents: 4800,
        dietaryTags: [DietaryTag.GLUTEN_FREE, DietaryTag.LACTOSE_FREE],
        servings: 6,
        sortOrder: 6,
    },
];

await AppDataSource.initialize();

const products = AppDataSource.getRepository(Product);
let created = 0;
let updated = 0;

// Matches by name, so running it again fills new fields on existing products instead of duplicating them.
for (const item of menu) {
    const existing = await products.findOneBy({ name: item.name! });

    if (existing) {
        await products.save(products.merge(existing, item));
        updated++;
    } else {
        await products.save(products.create(item));
        created++;
    }
}

console.log(`Products seeded: ${created} created, ${updated} updated.`);

await AppDataSource.destroy();
