import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1792800000000 implements MigrationInterface {
    name = 'InitialSchema1792800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "Product" (
                "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "name" TEXT NOT NULL,
                "description" TEXT NOT NULL,
                "priceCents" INTEGER NOT NULL CHECK ("priceCents" > 0),
                "available" BOOLEAN NOT NULL DEFAULT true,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(
            `CREATE TYPE "order_status" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED')`,
        );
        await queryRunner.query(`
            CREATE TABLE "Order" (
                "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "userId" UUID NOT NULL,
                "status" "order_status" NOT NULL DEFAULT 'PENDING',
                "deliveryDate" DATE NOT NULL,
                "notes" TEXT,
                "totalCents" INTEGER NOT NULL,
                "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "Order_userId_idx" ON "Order" ("userId")`);

        await queryRunner.query(`
            CREATE TABLE "OrderItem" (
                "id" UUID NOT NULL DEFAULT gen_random_uuid(),
                "orderId" UUID NOT NULL,
                "productId" UUID NOT NULL,
                "productName" TEXT NOT NULL,
                "unitPriceCents" INTEGER NOT NULL,
                "quantity" INTEGER NOT NULL CHECK ("quantity" > 0),
                CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"),
                CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId")
                    REFERENCES "Order" ("id") ON DELETE CASCADE,
                CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId")
                    REFERENCES "Product" ("id") ON DELETE RESTRICT
            )
        `);
        await queryRunner.query(`CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem" ("orderId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "OrderItem"`);
        await queryRunner.query(`DROP TABLE "Order"`);
        await queryRunner.query(`DROP TYPE "order_status"`);
        await queryRunner.query(`DROP TABLE "Product"`);
    }
}
