import {
  BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { getUUID } from '../utils';
import { User } from './User';
import { Currency } from './Currency';
import { Transaction } from './Transaction';
import { groupByField } from '../utils/helpers';

export interface IGreetingBonus {
    amount: number;
    until: Date;
}

export interface IWalletSettings {
    greetingBonus?: IGreetingBonus
}

@Table({
  defaultScope: {
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'currencyId', 'userId']
    },
    include: [{
      model: Currency,
      as: 'currency'
    }]
  },
  indexes: [{ fields: ['address'] }]
})
export class Wallet extends Model<Wallet> {
    @Column({
      type: DataType.STRING, primaryKey: true, unique: true, defaultValue: () => getUUID()
    }) id!: string;

    @Column(DataType.STRING) balance!: string;

    @ForeignKey(() => User) @Column(DataType.STRING) userId: string;

    @BelongsTo(() => User) user!: User;

    @ForeignKey(() => Currency) @Column(DataType.STRING) currencyId: string;

    @BelongsTo(() => Currency) currency!: Currency;

    @Column({ type: DataType.JSONB, defaultValue: {} }) settings: IWalletSettings;

    @Column(DataType.STRING) address!: string;

    @HasMany(() => Transaction) transactions: Transaction[];

    static async getGroupedByCurrency(userId) {
      const wallets = await this.findAll({
        where: {
          userId
        },
        raw: true
      });
      return groupByField(wallets, 'currency.id');
    }

    static async getUserWallets(userId: string, currencies?: string[]) {
      const where: any = { userId };
      if (currencies) {
        where.currencyId = { [Op.in]: currencies };
      }

      const wallets = await this.findAll({ where, attributes: { include: ['currencyId'] } });
      return groupByField(wallets, 'currencyId', { keyValueMode: true });
    }
}
