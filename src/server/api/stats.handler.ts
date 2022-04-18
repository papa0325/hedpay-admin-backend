import { Op, Sequelize } from 'sequelize';
import { Currency } from '../models/Currency';
import { Order } from '../models/Order';
import { Transaction } from '../models/Transaction';
import { Wallet } from '../models/Wallet';
import { error, output } from '../utils';
import { accessCheck } from '../utils/auth';
import { AdminRole } from '../utils/types';

export const getBalancesByCurrency = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);
    const balances = await Wallet.findAll({
      attributes: ['currencyId', [Sequelize.fn('SUM', Sequelize.cast(Sequelize.col('balance'), 'numeric')), 'amount']],
      group: ['currencyId', 'currency.id'],
      include: [
        {
          model: Currency,
          as: 'currency',
          required: false,
          attributes: ['decimals'],
        },
      ],
    });
    return output({ balances });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get balances', null);
  }
};

export const getTransactionsStats = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const where = {};
    const { from, to, currencyId } = r.query;

    const currency: Currency = await Currency.findByPk(currencyId);
    if (!currency) return error(404000, 'Currency with given currencyId was not found', null);

    if (from || to) {
      where[Op.and] = [];
      if (from) {
        where[Op.and].push({
          createdAt: {
            [Op.gte]: new Date(from), //timestamp in msec
          },
        });
      }
      if (to) {
        where[Op.and].push({
          createdAt: {
            [Op.lte]: new Date(to),
          },
        });
      }
    }

    const hdpBought = await Order.sum('amount', { where: { rightSideSymbolId: currencyId, ...where } });

    const tx = await Transaction.findAll({
      where: { currencyId: currencyId, status: { [Op.ne]: -1 }, ...where },
      group: ['type'],
      attributes: [[Sequelize.fn('SUM', Sequelize.col('amount')), 'amount'], 'type'],
    });

    const sentTotal = await Transaction.sum('amount', { where: { to: { [Op.ne]: null } } });

    return output({ tx: tx, sent: sentTotal, hdpBought: hdpBought, decimals: currency.decimals });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get transactions stats', null);
  }
};

export const getFeesByCurrency = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const where = {};
    const { from, to, currencyId } = r.query;

    const currency: Currency = await Currency.findByPk(currencyId);
    if (!currency) return error(404000, 'Currency with given currencyId was not found', null);

    if (from || to) {
      where[Op.and] = [];
      if (from) {
        where[Op.and].push({
          createdAt: {
            [Op.gte]: new Date(from), //timestamp in msec
          },
        });
      }
      if (to) {
        where[Op.and].push({
          createdAt: {
            [Op.lte]: new Date(to),
          },
        });
      }
    }

    const fees = await Transaction.findAll({
      where: { currencyId: currencyId, ...where },
      attributes: [[Sequelize.fn('SUM', Sequelize.cast(Sequelize.fn('COALESCE', Sequelize.literal("meta->>'fee'"), '0'), 'numeric')), 'amount']],
    });
    return output({ currencyId: currencyId, amount: fees, decimals: currency.id === 'hdp.ф' ? 18 : currency.decimals });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get fee stats', null);
  }
};
