import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { TypeLogs } from '../utils/types';
import { User } from './User';

@Table({
  defaultScope: {
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
    },
  },
})
export class Log extends Model<Log> {
  @ForeignKey(() => User)
  @Column(DataType.STRING)
  userId: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column(DataType.STRING)
  type: TypeLogs;

  @Column(DataType.STRING)
  usedIP: string;

  @Column(DataType.DECIMAL)
  timestamp: string;
}
