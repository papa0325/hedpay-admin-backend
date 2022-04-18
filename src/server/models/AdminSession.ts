import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { getUUID } from '../utils';
import { Admin } from './Admin';

@Table
export class AdminSession extends Model<AdminSession> {
  @Column({
    type: DataType.STRING,
    primaryKey: true,
    defaultValue: () => getUUID(),
  })
  id!: string;

  @Column(DataType.STRING)
  accessTokenUUID: string;

  @Column(DataType.STRING)
  refreshTokenUUID: string;

  @ForeignKey(() => Admin)
  @Column(DataType.INTEGER)
  adminId: number;

  @BelongsTo(() => Admin)
  admin: Admin;

  @Column(DataType.DATE)
  lastUsedDate: Date;

  @Column(DataType.STRING)
  lastUsedIp: string;

  @Column(DataType.DOUBLE)
  access_exp: string;

  @Column(DataType.DOUBLE)
  refresh_exp: string;

  @Column(DataType.DOUBLE)
  iat: string;

  @Column(DataType.STRING)
  userAgent: string;
}
