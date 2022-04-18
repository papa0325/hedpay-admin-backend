import { BelongsTo, Column, DataType, ForeignKey, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Col } from 'sequelize/types/lib/utils';
import { Chat } from './Chat';
import { ChatLine } from './ChatLine';

@Table({
  defaultScope: {
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
    },
  },
})
export class ChatLineAttachment extends Model<ChatLineAttachment> {
  @ForeignKey(() => ChatLine)
  @Column(DataType.INTEGER)
  chatLineId: number;

  @BelongsTo(() => ChatLine)
  chatLine: ChatLine;

  @Column(DataType.STRING)
  file!: string;

  @Column(DataType.JSONB)
  ext!: Object;
}
