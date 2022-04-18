import BigNumber from 'bignumber.js';
import { Op, Sequelize } from 'sequelize';
import { Currency } from '../models/Currency';
import { DistributionSessionPacks } from '../models/DistributionSessionPacks';
import { Log } from '../models/Log';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { Wallet } from '../models/Wallet';
import { user } from '../schemes';
import { error, output } from '../utils';
import { accessCheck } from '../utils/auth';
import { AdminRole, TypeLogs } from '../utils/types';
import { order } from './operations/order';
import { paginate } from './operations/paginate';
import config from '../config/config';
import { DistributionSession } from '../models/DistributionSession';
import { Rewards } from '../models/Rewards';
import { StakingPackage } from '../models/StakingPackage';

const banUser = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const { userId, banReason } = r.payload;
    const user: User = await User.scope('auth').findByPk(userId);
    if (!user) return error(404000, 'User with given userId was not found', null);
    if (user.banned) return error(400000, 'This user is already banned', null);
    await user.update({ banned: true, settings: { ...user.settings, banReason: banReason } });
    await Log.create({
      userId: user.id,
      type: TypeLogs.BAN,
      timestamp: new Date().valueOf(),
    });
    return output({ message: `User '${user.username}' was banned` });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to ban user', null);
  }
};
//
const holdUser = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const { userId, unbanTimestamp, banReason } = r.payload;
    const user: User = await User.scope('auth').findByPk(userId);
    if (!user) return error(404000, 'User with given userId was not found', null);
    if (user.banned) return error(400000, 'This user is already banned', null);
    await user.update({ banned: true, unbanTimestamp: unbanTimestamp, settings: { ...user.settings, banReason: banReason } });
    await Log.create({
      userId: user.id,
      type: TypeLogs.BAN,
      timestamp: new Date().valueOf(),
    });
    return output({ message: `User '${user.username}' was banned until ${new Date(unbanTimestamp).toISOString()}` });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to hold user', null);
  }
};

const unbanUser = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const { userId } = r.payload;
    const user: User = await User.findByPk(userId);
    if (!user) return error(404000, 'User with given userId was not found', null);
    if (!user.banned) return error(400000, 'This user is not banned', null);
    await user.update({ banned: false, unbanTimestamp: null });
    await Log.create({
      userId: user.id,
      type: TypeLogs.UNBAN,
      timestamp: new Date().valueOf(),
    });
    return output({ message: `User '${user.username}' was unbanned` });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to ban user', null);
  }
};

const deleteUser = async (r) => {
  try {
    await accessCheck(r, AdminRole.SUPERADMIN);

    const { userId } = r.query;

    const user: User = await User.findByPk(userId, {
      include: [
        {
          model: Wallet,
          as: 'wallets',
        },
      ],
    });

    for (let userWallet of user.wallets) {
      if (new BigNumber(userWallet.balance).isGreaterThan(0)) return error(400000, 'You cannot delete user with non-zero balances', null);
    }

    await user.destroy();
    return output({ message: `User ${user.email} was deleted!` });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to delete user', null);
  }
};

const getTransactionsByUser = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const { userId, from, to, status, symbol, search, type } = r.query;

    const where = {};

    if (from || to || type || status || status == 0 || symbol || search) {
      where[Op.and] = [];
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
      }
      if (symbol) {
        where[Op.and].push({
          currencyId: { [Op.iLike]: `%${symbol}%` },
        });
      }
    }

    const user: User = await User.findByPk(userId, {
      include: [
        {
          model: Transaction,
          as: 'txs',
          include: [
            {
              model: Currency,
              as: 'currency',
              attributes: ['decimals', 'meta', 'id'],
            },
          ],
          attributes: { exclude: ['walletId', 'orderId'] },
          where: where,
          required: false,
          ...order(r),
          ...paginate(r),
        },
      ],
    });
    if (!user) return error(404000, 'User with given userId was not found', null);

    return output({ count: user.txs.length, data: user.txs });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get transactions by user', null);
  }
};

const getUserLogs = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const { userId, type } = r.query;
    console.log(userId);
    const where = {};

    if (type) {
      where[Op.and] = [];
      where[Op.and].push({
        type: {
          [Op.eq]: type,
        },
      });
    }

    const logsCount = await Log.count({ where: { userId: userId } });
    const user: User = await User.findByPk(userId, {
      include: [
        {
          model: Log,
          as: 'logs',
          where: { ...where },
          required: false,
          ...order(r),
          ...paginate(r),
        },
      ],
    });

    if (!user) return error(404000, 'User with given userId was not found', null);

    return output({ count: logsCount, data: user.logs });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get transactions by user', null);
  }
};

const getUserInfo = async (r) => {
  await accessCheck(r, AdminRole.ADMIN);

  const { userId } = r.query;

  const user: User = await User.scope('auth').findByPk(userId, {
    include: [
      {
        model: Wallet,
        as: 'wallets',
      },
      {
        model: Log,
        as: 'logs',
        ...paginate(r),
        order: [['createdAt', 'DESC']],
      },
    ],
  });

  let is2FA = user.settings.totpToken ? true : false;
  return output({
    id: user.id,
    email: user.email,
    phone: user.phone,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    createdAt: user.createdAt,
    wallets: user.wallets,
    logs: user.logs,
    banned: user.banned,
    //@ts-ignore
    info: user.settings.profileIdentifyData,
    is2FA: is2FA,
    status: user.status,
  });
};

const getUserSettings = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const { userId } = r.query;

    const user: User = await User.scope('auth').findByPk(userId);
    if (!user) return error(404000, 'User with given userId was not found', null);

    const has2FA = !!user.settings.totpToken;
    const hasKYC = user.status === 2;
    const hasPhone = user.status === 2;

    return output({ has2FA, hasKYC, hasPhone });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get user settings', null);
  }
};

const getUserBalances = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const { userId, currencyId } = r.query;
    const where = {};

    if (currencyId) {
      where[Op.and] = [];

      if (currencyId) {
        where[Op.and].push({
          currencyId: {
            [Op.iLike]: `%${currencyId}%`,
          },
        });
      }
    }

    const user: User = await User.findByPk(userId, {
      attributes: ['id', 'email'],
      include: [
        {
          model: Wallet,
          as: 'wallets',
          where: where,
          ...order(r),
          ...paginate(r),
          required: false,
          attributes: ['id', 'balance', 'currencyId', 'address'],

          include: [
            {
              model: Currency,
              as: 'currency',
              required: false,
              attributes: ['id', 'decimals', 'fiat'],
            },
          ],
        },
      ],
    });

    const count = await Wallet.count({ where: { userId: user.id } });

    return output({ count: count, data: user });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get user balances', null);
  }
};

const getCurrencies = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);
    const currencies = await Currency.findAll();
    return output({ data: currencies });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get currencies', null);
  }
};

const setCurrencyParams = async (r) => {
  try {
    let { currencyId, minSend, minWithdraw, withdrawCommissionFixed } = r.payload;
    const currency = await Currency.findByPk(currencyId);
    if (!currency) return error(404000, 'Currency with given id was not found', null);
    minSend = new BigNumber(minSend).shiftedBy(currency.decimals).toString();
    minWithdraw = new BigNumber(minWithdraw).shiftedBy(currency.decimals).toString();
    withdrawCommissionFixed = new BigNumber(withdrawCommissionFixed).shiftedBy(currency.decimals).toString();
    const params = { minSend: minSend, minWithdraw: minWithdraw, withdrawCommissionFixed: withdrawCommissionFixed };
    await currency.update({ txLimits: params });
    return output({ message: 'Currency params were updated' });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to set currency params', null);
  }
};

const getPackages = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);
    const { sessionId } = r.query;
    //const packs = await DistributionSessionPacks.findAndCountAll({ attributes: ['min', 'max', 'price', 'limit', 'currencyID', 'createdAt'], ...paginate(r), ...order(r) });
    const packs = await DistributionSessionPacks.getPacks(sessionId);
    if (!packs) return error(404000, 'Packs with given sessionId were not found', null);
    return output(packs);
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get packages', null);
  }
};

const getPackageSessions = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);
    const sessions = await DistributionSession.findAndCountAll({ ...paginate(r), ...order(r) });
    return output({ count: sessions.count, data: sessions.rows });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get package sessions', null);
  }
};

const switchPackageSession = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);
    const { sessionId, enabled } = r.payload;

    const session = await DistributionSession.findByPk(sessionId);
    if (!session) return error(404000, 'Session with given sessionId was not found', null);
    await session.update({ active: enabled });
    let status = enabled ? 'enabled' : 'disabled';
    return output({ message: `Package Session was ${status}` });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to switch package sessions', null);
  }
};

const createPackageSessions = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);
    const { expiresAt, sessionName, leftAmount, boughtAmount } = r.payload;

    const hdp = await Currency.findByPk('hdp.ф');
    const session = await DistributionSession.create({
      leftAmount: new BigNumber(leftAmount).shiftedBy(hdp.decimals).toString(),
      boughtAmount: new BigNumber(boughtAmount).shiftedBy(hdp.decimals).toString(),
      active: true,
      sessionName: sessionName,
      expiresAt: expiresAt,
      startAt: new Date(),
    });
    return output({ message: `Package Session was created`, sessionId: session.id });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to switch package sessions', null);
  }
};

const editPackage = async (r) => {
  try {
    const { packageId } = r.params;
    const { min, max, price, limit } = r.payload;
    const pack = await DistributionSessionPacks.findByPk(packageId);
    if (!pack) return error(404000, 'Package with given packageId was not found', null);
    const currency: Currency = await Currency.findByPk(pack.currencyID, { attributes: ['decimals'] });
    await pack.update({
      min: new BigNumber(min).shiftedBy(currency.decimals).toString(),
      max: new BigNumber(max).shiftedBy(currency.decimals).toString(),
      price: new BigNumber(price).shiftedBy(currency.decimals).toString(),
      limit: new BigNumber(limit).shiftedBy(currency.decimals).toString(),
    });
    return output({ message: 'Package was updated' });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to edit the package', null);
  }
};

const createPackage = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);
    const { sessionId, min, max, price, limit, currencyId, counterInterval } = r.payload;

    const currency = await Currency.findByPk('hdp.ф', { attributes: ['id', 'decimals'] });
    if (!currency) return error(404000, 'Currency with given currencyId was not found', null);

    const pack = await DistributionSessionPacks.create({
      sessionID: sessionId,
      min: new BigNumber(min).shiftedBy(currency.decimals).toString(),
      max: new BigNumber(max).shiftedBy(currency.decimals).toString(),
      price: new BigNumber(price).shiftedBy(currency.decimals).toString(),
      limit: new BigNumber(limit).shiftedBy(currency.decimals).toString(),
      currencyID: currency.id,
      counterInterval: counterInterval,
    });

    return output({ message: 'New package was successfully created', packageId: pack.id });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to create a package', null);
  }
};

const getStakes = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);
    const stakes = await StakingPackage.findAndCountAll({ ...order(r), ...paginate(r) });

    return output({ count: stakes.count, data: stakes.rows });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get stakes', null);
  }
};
//
const editStake = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);
    const { stakeId } = r.params;
    const { min, fee, interest } = r.payload;

    const stake = await StakingPackage.findByPk(stakeId);
    if (!stake) return error(404000, 'Stake with given stakeId was not found', null);
    const hdp = await Currency.findByPk('hdp.ф');
    await stake.update({
      minValue: min,
      fee: fee,
      interest: interest,
    });
    return output({ message: 'Stake was successfully updated' });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get stakes', null);
  }
};

const createStake = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);
    const { min, interest, fee } = r.payload;
    const hdp = await Currency.findByPk('hdp.ф');
    const stake = await StakingPackage.create({
      minValue: min,
      interest: interest,
      fee: fee,
    });
    return output({ message: 'Stake was successfully created', stakeId: stake.id });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get stakes', null);
  }
};

const getRefSettings = async (r) => {
  try {
    await accessCheck(r, AdminRole.ADMIN);

    const reward = await Rewards.findOne();
    return output({ data: reward });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get ref system settings', null);
  }
};

const setRefSettings = async (r) => {
  try {
    await accessCheck(r, AdminRole.SUPERADMIN);

    const { payRewardFixed, payRewardForTransaction, percentRewardForTransaction, amount, currencyId } = r.payload;

    const currency = await Currency.findByPk(currencyId);
    const reward = await Rewards.findOne();

    if (!currency) return error(404000, 'Currency with given currencyId was not found', null);

    await reward.update({
      payRewardForTransaction: payRewardForTransaction,
      payRewardFixed: payRewardFixed,
      percentRewardForTransaction: new BigNumber(percentRewardForTransaction).shiftedBy(3),
      amount: new BigNumber(amount).shiftedBy(currency.decimals).toString(),
      currencyId: currencyId,
    });
    return output({ data: reward });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to get ref system settings', null);
  }
};

export {
  banUser,
  holdUser,
  unbanUser,
  deleteUser,
  getTransactionsByUser,
  getUserLogs,
  getCurrencies,
  setCurrencyParams,
  getPackages,
  editPackage,
  createPackage,
  getStakes,
  getUserInfo,
  editStake,
  createStake,
  switchPackageSession,
  createPackageSessions,
  getPackageSessions,
  getRefSettings,
  setRefSettings,
  getUserBalances,
  getUserSettings,
};
