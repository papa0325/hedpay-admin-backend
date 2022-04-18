import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { ChatLine } from "./ChatLine";
import { User } from "./User";

@Table({
  defaultScope: {
    attributes: {
      exclude: ["createdAt", "updatedAt"],
    },
  },
})
export class Chat extends Model<Chat> {
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: number;

  @Column(DataType.BOOLEAN)
  active: boolean;

  @HasMany(() => ChatLine)
  chatLines: ChatLine[];

  @BelongsTo(() => User)
  user!: User;
}
