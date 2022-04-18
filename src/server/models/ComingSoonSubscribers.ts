import {
  Column, DataType, Model, Table
} from 'sequelize-typescript';

@Table({ tableName: 'ComingSoonSubscribers' })
export class ComingSoonSubscribers extends Model<ComingSoonSubscribers> {
    @Column({
      type: DataType.STRING, primaryKey: true, allowNull: false, autoIncrement: false
    }) email!: string;
}
