import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { groupByField } from '../utils/helpers';
import { NumConverter } from '../utils/NumConverter/index';
import { MAIN_CURRENCY, TOKEN } from '../store/constants/default-currencies';

interface IGreetingBonus {
  amount: number;
  dateOffset: number;
}

interface ICurrencyMeta {
  greetingBonus?: IGreetingBonus;
}

interface ITXLimits {
  minWithdraw: string;
  withdrawCommissionPercentage: string;
  withdrawCommissionFixed: string;
}

@Table({
  defaultScope: {
    attributes: {
      exclude: ['createdAt', 'updatedAt', 'parentId', 'meta'],
    },
  },
})
export class Currency extends Model<Currency> {
  @Column({ type: DataType.STRING, primaryKey: true }) id!: string;

  @Column(DataType.STRING) symbol: string;

  @Column(DataType.STRING) fullTitle: string;

  @Column(DataType.INTEGER) decimals: number;

  @Column(DataType.STRING) currentRate: string;

  @Column({ type: DataType.JSONB, defaultValue: {} }) txLimits: ITXLimits;

  @Column({ type: DataType.BOOLEAN, defaultValue: false }) fiat: boolean;

  @ForeignKey(() => Currency) @Column({ type: DataType.STRING, allowNull: true }) parentId: Currency;

  @Column({ type: DataType.JSONB, defaultValue: {} }) meta: ICurrencyMeta;

  @Column({ type: DataType.STRING, defaultValue: null }) change: string;

  static async getGroupedById(ids: string[] | null = [TOKEN, MAIN_CURRENCY]) {
    const options: any = { raw: true };
    if (ids) {
      options.where = { id: { [Op.in]: ids } };
    }

    return groupByField(await this.findAll(options), 'id');
  }

  static async getConverter(ids?: string[]) {
    const mappedResult = await this.getGroupedById(null);
    const resObj: any = {};
    for (const currency in mappedResult) {
      resObj[currency] = {
        decimals: parseInt(mappedResult[currency][0].decimals),
        rate: parseInt(mappedResult[currency][0].currentRate),
      };
    }

    return new NumConverter({ currencies: resObj });
  }
}
