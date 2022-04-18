import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'StakingPackages' })
export class StakingPackage extends Model<StakingPackage> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true }) id!: number;

  @Column(DataType.DOUBLE) minValue: number;

  @Column(DataType.DOUBLE) interest: number;

  @Column(DataType.DOUBLE) fee: number;
}
