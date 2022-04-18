import {
  Model, Column, Table, DataType, ForeignKey, BelongsTo
} from 'sequelize-typescript';
import { User } from './User';
import { Currency } from './Currency';
import { TOKEN } from '../store/constants/default-currencies';

@Table({
  tableName: 'ReferralStat',
  defaultScope: {
    include: [
      {
        model: Currency,
        as: 'currency'
      }
    ]
  }
})
export class ReferralStat extends Model<ReferralStat> {
  @ForeignKey(() => User) @Column({ type: DataType.STRING, primaryKey: true }) userId: string;

  @BelongsTo(() => User) user: User;

  @Column({ type: DataType.STRING, defaultValue: '0' }) bonusAmount: string;

  @ForeignKey(() => Currency)
  @Column({ type: DataType.STRING, defaultValue: TOKEN })
  currencyId: string;

  @BelongsTo(() => Currency) currency: Currency;

  @Column({ type: DataType.INTEGER, defaultValue: 0 }) refCount: number;

  @Column({ type: DataType.INTEGER, defaultValue: 0 }) invitationCount: number;
}
