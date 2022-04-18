import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { User } from './User';
import { getUUID } from '../utils';

@Table({ tableName: 'ActiveStakes' })
export class ActiveStake extends Model<ActiveStake> {
  public static STATUS_ACTIVE = 'active';

  public static STATUS_WITHDRAWN = 'withdrawn';

  public static STATUS_CLOSED = 'closed';

  @Column({ type: DataType.STRING, primaryKey: true, defaultValue: () => getUUID() })
  id: string;

  @Column(DataType.DOUBLE) deposit: number;

  @Column(DataType.DOUBLE) revenue: number;

  @Column(DataType.DOUBLE) receivable: number;

  @Column(DataType.DOUBLE) interest: number;

  @Column(DataType.DOUBLE) fee: number;

  @Column(DataType.DATE) endingDate: Date;

  @Column(DataType.STRING(16)) status: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.STRING })
  userId!: string;

  @BelongsTo(() => User, 'userId') stakeOwner: User[];
}
