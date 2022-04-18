import {
  Model, Column, Table, DataType
} from 'sequelize-typescript';
import { getUUID } from '../utils';

@Table
export class Package extends Model<Package> {
  @Column({ type: DataType.STRING, defaultValue: () => getUUID(), primaryKey: true }) id!: string;

  @Column(DataType.INTEGER) amount: number;

  @Column(DataType.INTEGER) months: number;

  @Column(DataType.INTEGER) percentage: number;

  @Column(DataType.INTEGER) leftAmount: number;
}
