import {
  Model, Column, Table, DataType, ForeignKey
} from 'sequelize-typescript';
import { getUUID } from '../utils';
import { User } from './User';


@Table
export class UserPackage extends Model<UserPackage> {
  @Column({ type: DataType.STRING, primaryKey: true, defaultValue: () => getUUID() }) id: string;

  @ForeignKey(() => User) @Column(DataType.STRING) userId: string;

  @Column(DataType.INTEGER) amount: number;

  @Column(DataType.INTEGER) percentage: number;

  @Column(DataType.DATE) expireDate: Date;
}
