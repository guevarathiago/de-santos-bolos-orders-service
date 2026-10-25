import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Product } from '../products/product.entity.js';

export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PREPARING = 'PREPARING',
    READY = 'READY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
}

@Entity({ name: 'Order' })
export class Order {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // The user lives in the De Santos Bolos database, so this is a plain id with no foreign key.
    @Index('Order_userId_idx')
    @Column('uuid')
    userId!: string;

    @Column({ type: 'enum', enum: OrderStatus, enumName: 'order_status', default: OrderStatus.PENDING })
    status!: OrderStatus;

    @Column('date')
    deliveryDate!: string;

    @Column('text', { nullable: true })
    notes!: string | null;

    @Column('integer')
    totalCents!: number;

    @OneToMany(() => OrderItem, (item) => item.order, { cascade: ['insert'] })
    items!: OrderItem[];

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}

@Entity({ name: 'OrderItem' })
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index('OrderItem_orderId_idx')
    @Column('uuid')
    orderId!: string;

    @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'orderId', foreignKeyConstraintName: 'OrderItem_orderId_fkey' })
    order!: Order;

    @Column('uuid')
    productId!: string;

    @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
    @JoinColumn({ name: 'productId', foreignKeyConstraintName: 'OrderItem_productId_fkey' })
    product!: Product;

    // Name and price are copied at order time, so later catalog changes do not rewrite past orders.
    @Column('text')
    productName!: string;

    @Column('integer')
    unitPriceCents!: number;

    @Column('integer')
    quantity!: number;
}
