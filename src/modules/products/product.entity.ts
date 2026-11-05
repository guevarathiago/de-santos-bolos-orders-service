import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum ProductCategory {
    CAKE = 'CAKE',
    PIE = 'PIE',
    BROWNIE = 'BROWNIE',
    SWEETS = 'SWEETS',
    OTHER = 'OTHER',
}

export enum DietaryTag {
    GLUTEN_FREE = 'GLUTEN_FREE',
    LACTOSE_FREE = 'LACTOSE_FREE',
    VEGAN = 'VEGAN',
}

@Entity({ name: 'Product' })
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column('text')
    name!: string;

    @Column('text')
    description!: string;

    @Column({ type: 'enum', enum: ProductCategory, enumName: 'product_category', default: ProductCategory.CAKE })
    category!: ProductCategory;

    // Money is kept in cents to avoid floating point rounding.
    @Column('integer')
    priceCents!: number;

    // Public URL of the photo in object storage; the file itself never passes through this service.
    @Column('text', { nullable: true })
    imageUrl!: string | null;

    @Column({ type: 'enum', enum: DietaryTag, enumName: 'dietary_tag', array: true, default: [] })
    dietaryTags!: DietaryTag[];

    @Column('integer', { nullable: true })
    servings!: number | null;

    @Column('integer', { nullable: true })
    weightGrams!: number | null;

    // Days of notice the kitchen needs; an order waits for its slowest product.
    @Column('integer', { default: 1 })
    leadTimeDays!: number;

    @Column('boolean', { default: true })
    available!: boolean;

    @Column('boolean', { default: false })
    featured!: boolean;

    @Column('integer', { default: 0 })
    sortOrder!: number;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;

    // Soft delete: past orders still point at the product, so the row stays and TypeORM hides it from every query.
    @DeleteDateColumn({ type: 'timestamptz', nullable: true })
    deletedAt!: Date | null;
}
