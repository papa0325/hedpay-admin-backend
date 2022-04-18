import { Column, DataType, ForeignKey, HasMany, Model, PrimaryKey, Table } from 'sequelize-typescript';
import { Col } from 'sequelize/types/lib/utils';
import { Chat } from './Chat';
import { ChatLineAttachment } from './ChatLineAttachment';

@Table({
  defaultScope: {
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
    },
  },
})
export class ChatLine extends Model<ChatLine> {
  @ForeignKey(() => Chat)
  @Column(DataType.INTEGER)
  chatID: number;

  @Column(DataType.JSONB)
  sender: Object;

  @Column(DataType.JSONB)
  receiver: Object;

  @Column(DataType.TEXT)
  message: string;

  @Column(DataType.BIGINT)
  timestamp: string;

  @HasMany(() => ChatLineAttachment)
  attachments: ChatLineAttachment[];
}
