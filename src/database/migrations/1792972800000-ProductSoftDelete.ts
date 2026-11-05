import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ProductSoftDelete1792972800000 implements MigrationInterface {
    name = 'ProductSoftDelete1792972800000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Product" ADD COLUMN "deletedAt" TIMESTAMPTZ`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "Product" DROP COLUMN "deletedAt"`);
    }
}
