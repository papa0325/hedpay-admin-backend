import {
  BelongsTo, Column, DataType, ForeignKey, Model, Table
} from 'sequelize-typescript';
import { getUUID } from '../utils';
import { User } from './User';

@Table
export class Session extends Model<Session> {
  @Column({ type: DataType.STRING, primaryKey: true, defaultValue: () => getUUID() }) id!: string;

  @ForeignKey(() => User) @Column(DataType.STRING) userId: number;

  @BelongsTo(() => User, { onDelete: 'CASCADE' }) user: User;

  @Column(DataType.DATE) lastUsedDate: Date;

  @Column(DataType.STRING) lastUsedIp: string;
}
