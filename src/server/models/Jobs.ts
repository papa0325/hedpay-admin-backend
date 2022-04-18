import {
  BelongsTo, Column, DataType, ForeignKey, Model, Table
} from 'sequelize-typescript';
import { getUUID } from '../utils';
import { User } from './User';
import { Currency } from './Currency';

// interface INotificationMeta {
//   to: string;
//   from: string;
// }

@Table
export class Notification extends Model<Notification> {
    @Column({ type: DataType.STRING, defaultValue: () => getUUID(), primaryKey: true }) id!: string;

    @ForeignKey(() => Currency)
    @Column(DataType.STRING)
    currencyId: string;

    @Column({ type: DataType.STRING, allowNull: false }) name: string;

    @Column({ type: DataType.STRING, defaultValue: '0', allowNull: false }) amount: string;

    @BelongsTo(() => Currency, { onDelete: 'CASCADE' }) currency: Currency;

    static async createNotification(userId, payload) {
      await this.create({
        userId,
        meta: payload
      });
    }
}
