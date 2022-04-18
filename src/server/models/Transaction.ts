import { Model, Table, Column, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { getUUID } from '../utils';
import { Currency } from './Currency';
import { Wallet } from './Wallet';
import { User } from './User';
import { Order } from './Order';

@Table({
  indexes: [{ fields: ['userId', 'walletId', 'currencyId'], using: 'BTREE' }],
})
export class Transaction extends Model<Transaction> {
  @Column({ type: DataType.STRING, defaultValue: () => getUUID(), primaryKey: true }) id!: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0 }) status: number; //-1 failed, 0 created, not confirmed, 1 confirmed

  @Column(DataType.BIGINT) amount: string;

  @Column(DataType.INTEGER) type: number; // 0 - deposit, 1 - withdraw

  @Column(DataType.STRING) to: string;

  @Column(DataType.STRING) description: string;

  @Column({ type: DataType.JSONB, defaultValue: {} }) meta: object;

  @ForeignKey(() => Currency) @Column(DataType.STRING) currencyId: string;

  @BelongsTo(() => Currency) currency: Currency;

  @ForeignKey(() => Wallet) @Column(DataType.STRING) walletId: string;

  @BelongsTo(() => Wallet) wallet: Wallet;

  @ForeignKey(() => User) @Column(DataType.STRING) userId: string;

  @BelongsTo(() => User) user: User;

  @ForeignKey(() => Order) @Column(DataType.STRING) orderId: string;

  @BelongsTo(() => Order) order: Order;

  static async createTransfer(cur1, cur2, data) {
    await this.bulkCreate([
      {
        amount: data.cur1Amount,
        status: 1,
        type: 0,
        to: data.to,
        currencyId: cur1,
        walletId: data.walletId,
        userId: data.userId,
        orderId: data.orderId,
      },
      {
        amount: data.cur2Amount,
        status: 1,
        type: 1,
        to: null,
        currencyId: cur2,
        walletId: data.walletId,
        userId: data.userId,
        orderId: data.orderId,
      },
    ]);
  }
}
