import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductCatalogDetails1792886400000 implements MigrationInterface {
    name = 'ProductCatalogDetails1792886400000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "product_category" AS ENUM ('CAKE', 'PIE', 'BROWNIE', 'SWEETS', 'OTHER')`);
        await queryRunner.query(`CREATE TYPE "dietary_tag" AS ENUM ('GLUTEN_FREE', 'LACTOSE_FREE', 'VEGAN')`);

        await queryRunner.query(`
            ALTER TABLE "Product"
                ADD COLUMN "category" "product_category" NOT NULL DEFAULT 'CAKE',
                ADD COLUMN "imageUrl" TEXT,
                ADD COLUMN "dietaryTags" "dietary_tag"[] NOT NULL DEFAULT '{}',
                ADD COLUMN "servings" INTEGER CHECK ("servings" > 0),
                ADD COLUMN "weightGrams" INTEGER CHECK ("weightGrams" > 0),
                ADD COLUMN "leadTimeDays" INTEGER NOT NULL DEFAULT 1 CHECK ("leadTimeDays" >= 1),
                ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false,
                ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "Product"
                DROP COLUMN "sortOrder",
                DROP COLUMN "featured",
                DROP COLUMN "leadTimeDays",
                DROP COLUMN "weightGrams",
                DROP COLUMN "servings",
                DROP COLUMN "dietaryTags",
                DROP COLUMN "imageUrl",
                DROP COLUMN "category"
        `);
        await queryRunner.query(`DROP TYPE "dietary_tag"`);
        await queryRunner.query(`DROP TYPE "product_category"`);
    }
}
