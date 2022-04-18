import { HasMany, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { literal } from 'sequelize';
import { getUUID } from '../utils';
import { DistributionSessionPacks } from './DistributionSessionPacks';

@Table({ tableName: 'TokenDistributionSessions' })
export class DistributionSession extends Model<DistributionSession> {
  @Column({ type: DataType.STRING, defaultValue: () => getUUID(), primaryKey: true }) id!: string;

  @Column({ type: DataType.STRING, allowNull: true }) sessionName!: string;

  @Column({ type: DataType.DECIMAL(40, 20), allowNull: true }) boughtAmount: number;

  @Column({ type: DataType.DECIMAL(40, 20), allowNull: true }) leftAmount: number;

  @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: true }) active: boolean;

  @Column({ type: DataType.DATE, allowNull: true }) startAt: string;

  @Column({ type: DataType.DATE, allowNull: true }) expiresAt: string;

  @HasMany(() => DistributionSessionPacks, 'sessionID') packs: DistributionSessionPacks[];

  static async getDistributionSessionWithPacksById(sessionID: string) {
    return this.findByPk(sessionID, {
      attributes: { exclude: ['createdAt', 'updatedAt'] },
      order: [
        ['id', 'DESC'],
        [{ model: DistributionSessionPacks, as: 'packs' }, 'limit', 'ASC'],
      ],
      include: [
        {
          as: 'packs',
          attributes: ['id', 'min', 'max', 'limit', 'price', 'currencyID', 'lastCounterDropTime', 'counterInterval'],
          model: DistributionSessionPacks,
          required: false,
        },
      ],
    });
  }
}
