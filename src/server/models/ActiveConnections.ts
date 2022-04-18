import {
  Model, Column, Table, DataType, ForeignKey, HasMany
} from 'sequelize-typescript';
import { getUUID } from '../utils';

@Table({ tableName: 'ActiveConnections', timestamps: false })
export class ActiveConnections extends Model<ActiveConnections> {
    @Column({ type: DataType.STRING, defaultValue: () => getUUID(), primaryKey: true }) id!: string;

    @Column({ type: DataType.STRING, allowNull: false }) userId: string;

    @Column(DataType.DATE) connectionTime: string;
}
