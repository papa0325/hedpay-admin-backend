import {
  BelongsTo, Column, DataType, ForeignKey, Model, Table
} from 'sequelize-typescript';
import { getUUID } from '../utils';
import { Currency } from './Currency';

@Table
export class RatesHistory extends Model<RatesHistory> {
  @Column({ type: DataType.STRING, defaultValue: () => getUUID(), primaryKey: true }) id: string;

  @ForeignKey(() => Currency) @Column(DataType.STRING) currencyId: string;

  @BelongsTo(() => Currency) currency: Currency;

  @Column(DataType.STRING) rate: string;

  @Column(DataType.STRING) volume: string;
}
