import {
  BelongsTo, Column, DataType, ForeignKey, Model, Table
} from 'sequelize-typescript';
import { getUUID } from '../utils';
import { User } from './User';


@Table
export class Contacts extends Model<Contacts> {
    @Column({
      type: DataType.STRING, primaryKey: true, unique: true, defaultValue: () => getUUID()
    }) id!: string;

    @ForeignKey(() => User) @Column(DataType.STRING) userId: string;

    @BelongsTo(() => User) user!: User;

    @ForeignKey(() => User) @Column(DataType.STRING) contactId: string;

    @BelongsTo(() => User) contact!: User;
}
