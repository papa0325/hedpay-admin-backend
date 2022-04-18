import { Op, Sequelize } from 'sequelize';
import { Referral } from '../models/Referral';
import { User } from '../models/User';
import { Rewards } from '../models/Rewards';
import { error, output } from '../utils';
import { accessCheck } from '../utils/auth';
import { AdminRole } from '../utils/types';
import { Admin } from '../models/Admin';
import { order } from './operations/order';
import { paginate } from './operations/paginate';
import { Transaction } from '../models/Transaction';
import { Currency } from '../models/Currency';
import { BigNumber } from 'bignumber.js';
import { ActiveStake } from '../models/ActiveStake';

export const getDashboardInfo = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);
    const usersCount = await User.count({ where: { status: { [Op.ne]: 0 } } });
    const referralsCount = await Referral.count({ where: { isApprove: true } });
    const stakeLocked = await ActiveStake.sum('deposit');
    const stakeReward = await ActiveStake.sum('receivable');
    const [referralReward] = await Rewards.findAll({ attributes: [[Sequelize.fn('SUM', Sequelize.cast(Sequelize.col('amount'), 'decimal')), 'amount']], where: { name: 'referral' } });

    return output({ usersCount, referralsCount, stakeReward, stakeLocked, referralReward });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get data for dashboard', null);
  }
};

export const getUserList = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const { search } = r.query;
    const where = {};
    if (search) {
      where[Op.or] = [];
      where[Op.and] = [];
      where[Op.or].push({
        username: {
          [Op.iLike]: `%${search}%`,
        },
      });
      where[Op.or].push({
        email: {
          [Op.iLike]: `%${search}%`,
        },
      });
    }

    const users = await User.findAndCountAll({ where: { ...where, status: { [Op.ne]: 0 } }, attributes: { include: ['createdAt'] }, ...order(r), ...paginate(r) });
    return output({ count: users.count, data: users.rows });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get users list', null);
  }
};

export const getAdminList = async (r) => {
  try {
    await accessCheck(r, AdminRole.SUPERADMIN);

    const { search } = r.query;
    const where = {};
    if (search) {
      where[Op.or] = [];
      where[Op.and] = [];
      where[Op.or].push({
        firstName: {
          [Op.iLike]: `%${search}%`,
        },
      });
      where[Op.or].push({
        lastName: {
          [Op.iLike]: `%${search}%`,
        },
      });
      where[Op.or].push({
        email: {
          [Op.iLike]: `%${search}%`,
        },
      });
    }

    const admins = await Admin.findAndCountAll({ where: { ...where, status: { [Op.ne]: 2 } }, ...order(r), ...paginate(r) });
    return output({ count: admins.count, data: admins.rows });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get users list', null);
  }
};

export const getTransactionsList = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const { from, to, status, symbol, search, type } = r.query;

    const where = {};

    if (from || to || type || status || status == 0 || symbol || search) {
      where[Op.and] = [];
      where[Op.or] = [];
      if (from) {
        where[Op.and].push({
          updatedAt: {
            [Op.gte]: new Date(Number.parseInt(from)),
          },
        });
      }
      if (to) {
        where[Op.and].push({
          updatedAt: {
            [Op.lte]: new Date(Number.parseInt(to)),
          },
        });
      }
      if (type) {
        where[Op.and].push({
          type: {
            [Op.eq]: type,
          },
        });
      }
      if (status || status == 0) {
        where[Op.and].push({
          status: {
            [Op.eq]: status,
          },
        });
      }
      if (search) {
        where[Op.or].push({
          to: {
            [Op.iLike]: `%${search}%`,
          },
        });
        where[Op.or].push({
          'meta.tx_id': {
            [Op.iLike]: `%${search}%`,
          },
        });
        where[Op.or].push({
          '$user.username$': {
            [Op.iLike]: `%${search}%`,
          },
        });
      }
      if (symbol) {
        where[Op.and].push({
          currencyId: { [Op.iLike]: `%${symbol}%` },
        });
      }
    }

    const tx = await Transaction.findAndCountAll({
      where: where,
      ...paginate(r),
      ...order(r),
      include: [
        {
          model: Currency,
          as: 'currency',
          required: false,
        },
        {
          model: User,
          as: 'user',
          attributes: ['username'],
        },
      ],
    });
    return output({ count: tx.count, data: tx.rows });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get transactions list', null);
  }
};

export const getTransactionsGraph = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const { txType, currencyId } = r.query;
    const startinterval = r.query.type;

    const currency: Currency = await Currency.findByPk(currencyId);
    if (!currency) return error(404000, 'Currency with given ID was not found', null);

    const timestampNow = new Date().valueOf();

    let intervalsAmount: number;
    let timeBetweenIntervals;

    switch (startinterval) {
      case 'DAY':
        intervalsAmount = 8;
        timeBetweenIntervals = 3600 * 1000;
        break;

      case 'WEEK':
        intervalsAmount = 7;
        timeBetweenIntervals = 3600 * 1000 * 24;
        break;

      case 'MONTH':
        intervalsAmount = 4;
        timeBetweenIntervals = 3600 * 1000 * 24 * 7;
        break;
    }

    const dataArray = [];

    for (let i = 1; i <= intervalsAmount; i++) {
      const dataObject: any = {};
      let boundraryTimestamp = timestampNow - (i - 1) * timeBetweenIntervals;
      dataObject.timestamp = timestampNow - i * timeBetweenIntervals;
      let rawAmount = await Transaction.sum('amount', {
        logging: true,
        where: {
          [Op.and]: [{ type: txType }, { currencyId: currencyId }, { createdAt: { [Op.gte]: new Date(dataObject.timestamp) } }, { createdAt: { [Op.lte]: new Date(boundraryTimestamp) } }],
        },
      });
      dataObject.amount = rawAmount ? new BigNumber(rawAmount).shiftedBy(-currency.decimals).toNumber() : 0;
      dataArray.push(dataObject);
    }
    return output({ currency: currency.symbol.toUpperCase(), data: dataArray.reverse() });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get transactions graph', null);
  }
};
