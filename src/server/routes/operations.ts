import * as api from '../api';
import * as Joi from '@hapi/joi';
import { outputOkSchema } from '../schemes';

const routes = [
  {
    method: 'POST',
    path: '/user/ban',
    handler: api.operations.banUser,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to ban specified user',
      notes: 'none',
      tags: ['USER', 'BAN', 'api'],
      validate: {
        payload: Joi.object({
          userId: Joi.string().max(120).required(),
          banReason: Joi.string().min(3).max(220).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/user/hold',
    handler: api.operations.holdUser,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to hold specified user',
      notes: 'pass unbanTimestamp in msec',
      tags: ['USER', 'BAN', 'api'],
      validate: {
        payload: Joi.object({
          unbanTimestamp: Joi.number().max(9900000000000).min(new Date().valueOf()),
          banReason: Joi.string().min(3).max(220).required(),
          userId: Joi.string().max(120).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/user/unban',
    handler: api.operations.unbanUser,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to unban specified user',
      notes: 'none',
      tags: ['USER', 'BAN', 'api'],
      validate: {
        payload: Joi.object({
          userId: Joi.string().max(120).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/user/delete',
    handler: api.operations.deleteUser,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to delete specified user',
      notes: `All user's transactions and wallets will also be deleted and cannot be recovered`,
      tags: ['api', 'REST', 'OPERATIONS', 'PRIVATE'],
      validate: {
        query: Joi.object({
          userId: Joi.string().max(120).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/user/transactions',
    handler: api.operations.getTransactionsByUser,
    options: {
      auth: 'jwt-access',
      description: `Use this endpoint to get list of user's transactions`,
      notes: 'filter and ordering supported (send timestamp in msec)',
      tags: ['USER', 'api'],
      validate: {
        query: Joi.object({
          userId: Joi.string().max(120).required(),
          order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
          limit: Joi.number().default(10).integer().min(0).required(),
          offset: Joi.number().default(0).integer().min(0).required(),
          from: Joi.string().max(13).min(13),
          to: Joi.string().max(13).min(13),
          type: Joi.number().integer().valid(0, 1),
          status: Joi.number().min(-1).max(1).integer(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/user/logs',
    handler: api.operations.getUserLogs,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to get list of user logs',
      notes: 'none',
      tags: ['USER', 'api'],
      validate: {
        query: Joi.object({
          userId: Joi.string().max(120).required(),
          type: Joi.string().valid('auth', 'ban', 'unban'),
          order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
          limit: Joi.number().default(10).integer().min(0).required(),
          offset: Joi.number().default(0).integer().min(0).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/user/info',
    handler: api.operations.getUserInfo,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to get info about specified user',
      notes: 'none',
      tags: ['USER', 'api'],
      validate: {
        query: Joi.object({
          userId: Joi.string().max(120).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/user/settings',
    handler: api.operations.getUserSettings,
    options: {
      auth: 'jwt-access',
      description: `Use this endpoint to get specified user's settings`,
      notes: 'none',
      tags: ['USER', 'api'],
      validate: {
        query: Joi.object({
          userId: Joi.string().max(120).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/user/balances',
    handler: api.operations.getUserBalances,
    options: {
      auth: 'jwt-access',
      description: `Use this endpoint to get info about user's balances`,
      notes: 'none',
      tags: ['USER', 'api'],
      validate: {
        query: Joi.object({
          userId: Joi.string().max(120).required(),
          currencyId: Joi.string().min(3).max(10),
          order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
          limit: Joi.number().default(10).integer().min(0).required(),
          offset: Joi.number().default(0).integer().min(0).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/packs/sessions',
    handler: api.operations.getPackageSessions,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to get list of package sessions',
      notes: 'none',
      tags: ['PACKS', 'api'],
      validate: {
        query: Joi.object({
          order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
          limit: Joi.number().default(10).integer().min(0).required(),
          offset: Joi.number().default(0).integer().min(0).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
      response: {
        schema: outputOkSchema({
          // @Column({ type: DataType.STRING, defaultValue: () => getUUID(), primaryKey: true }) id!: string;

          // @Column({ type: DataType.STRING, allowNull: true }) sessionName!: string;

          // @Column({ type: DataType.DECIMAL(40, 20), allowNull: true }) boughtAmount: number;

          // @Column({ type: DataType.DECIMAL(40, 20), allowNull: true }) leftAmount: number;

          // @Column({ type: DataType.BOOLEAN, allowNull: true, defaultValue: true }) active: boolean;

          // @Column({ type: DataType.DATE, allowNull: true }) startAt: string;

          // @Column({ type: DataType.DATE, allowNull: true }) expiresAt: string;
          count: Joi.number().example(10),
          data: Joi.object({
            id: Joi.string().example('b95cf20f-eaea-4465-bc9e-130c6878c437'),
            sessionName: Joi.string().example('Some name'),
            boughtAmount: Joi.number().example(1800),
            leftAmount: Joi.number().example(200),
            active: Joi.boolean().example(false),
            startAt: Joi.date(),
            expiresAt: Joi.date(),
          }),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/packs/sessions/switch',
    handler: api.operations.switchPackageSession,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to switch active state for selected package session',
      notes: 'none',
      tags: ['PACKS', 'api'],
      validate: {
        payload: Joi.object({
          sessionId: Joi.string().min(3).max(80),
          enabled: Joi.boolean(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/packs/sessions/add',
    handler: api.operations.createPackageSessions,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to get list of package sessions',
      notes: 'none',
      tags: ['PACKS', 'api'],
      validate: {
        payload: Joi.object({
          expiresAt: Joi.date().min(new Date()).required(),
          sessionName: Joi.string().min(3).max(40).required(),
          leftAmount: Joi.string().min(0).max(40).required(),
          boughtAmount: Joi.string().min(0).max(40).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/packs',
    handler: api.operations.getPackages,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to get list of disctribution packages',
      notes: 'none',
      tags: ['PACKS', 'api'],
      validate: {
        query: Joi.object({
          sessionId: Joi.string().max(120).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
      response: {
        schema: outputOkSchema({
          sessionName: Joi.string().example('Some name'),
          id: Joi.string().example('e2be9fda-e530-4006-8bf2-7dc23d0c745a'),
          amount: Joi.number().example(10000),
          price: Joi.number().example(123456),
          price_currency: Joi.string().example('ETH'),
          min: Joi.number().example(123456),
          max: Joi.number().example(123456),
          currency: Joi.string().example('HDP'),
          packagesQuantity: Joi.string().example(`100000 hdp left`),
          progressBar: Joi.number().example(0.4),
          isObtained: Joi.boolean().example(false),
          disabled: Joi.boolean().example(false),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/packs/edit/{packageId}',
    handler: api.operations.editPackage,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to get list of disctribution packages',
      notes: 'none',
      tags: ['PACKS', 'api'],
      validate: {
        params: Joi.object({
          packageId: Joi.string().max(120).required(),
        }),
        payload: Joi.object({
          min: Joi.string().min(0).max(18).required(),
          max: Joi.string().min(0).max(18).required(),
          limit: Joi.string().min(0).max(18).required(),
          price: Joi.string().min(0).max(18).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/packs/add',
    handler: api.operations.createPackage,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to create new disctribution package',
      notes: 'none',
      tags: ['PACKS', 'api'],
      validate: {
        payload: Joi.object({
          sessionId: Joi.string().min(0).max(80).required(),
          counterInterval: Joi.number().valid(24, 48, 72).required(),
          min: Joi.string().min(0).max(18).required(),
          max: Joi.string().min(0).max(18).required(),
          limit: Joi.string().min(0).max(18).required(),
          price: Joi.string().min(0).max(18).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/stakes',
    handler: api.operations.getStakes,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to get list of HDP stakes',
      notes: 'none',
      tags: ['STAKE', 'api'],
      validate: {
        query: Joi.object({
          order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
          limit: Joi.number().default(10).integer().min(0).required(),
          offset: Joi.number().default(0).integer().min(0).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
      // response: {
      //   schema: outputOkSchema({
      //     count: Joi.number().example(10),
      //     data: Joi.object({
      //       id: Joi.string().example('b95cf20f-eaea-4465-bc9e-130c6878c437'),
      //       min: Joi.number().example(1000),
      //       price: Joi.number().example(10000),
      //       percentage: Joi.number().example(40),
      //     }),
      //   }),
      // },
    },
  },
  {
    method: 'POST',
    path: '/stake/edit/{stakeId}',
    handler: api.operations.editStake,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to edit specified HDP stake',
      notes: 'none',
      tags: ['STAKE', 'api'],
      validate: {
        params: Joi.object({
          stakeId: Joi.number().min(0).max(10000).integer().required(),
        }),
        payload: Joi.object({
          min: Joi.number().min(0).max(9999999999).integer().required(),
          fee: Joi.number().min(0).max(1).example(0.07).precision(2).required(),
          interest: Joi.number().min(0).max(1).example(0.12).precision(2).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/stake/add',
    handler: api.operations.createStake,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to create a new HDP stake',
      notes: 'none',
      tags: ['STAKE', 'api'],
      validate: {
        payload: Joi.object({
          min: Joi.number().min(0).max(9999999999).integer().required(),
          fee: Joi.number().min(0).max(1).example(0.07).precision(2).required(),
          interest: Joi.number().min(0).max(1).example(0.12).precision(2).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/currencies',
    handler: api.operations.getCurrencies,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to receive active currencies',
      notes: 'none',
      tags: ['CURRENCIES', 'api'],
      response: {
        schema: outputOkSchema({
          data: Joi.object({
            id: Joi.string().example('eth'),
            fullTitle: Joi.string().example('Ethereum'),
            decimals: Joi.number().example(18),
            currentRate: Joi.string().example('1959029881'),
            symbol: Joi.string().example('ETH'),
            txLimits: Joi.object({
              minWithdraw: Joi.string().example(1000000000000),
              withdrawCommissionPercentage: Joi.string().example(3),
              withdrawCommissionFixed: Joi.string().example(1000000000000),
            }),
          }),
        }),
      },
    },
  },
  {
    method: 'GET',
    path: '/reward-settings',
    handler: api.operations.getRefSettings,
    options: {
      //auth: 'jwt-access',
      auth: false,
      description: 'Use this endpoint to receive current referral reward settings',
      notes: 'Percent has precision = 3 symbols',
      tags: ['REFERRAL', 'api'],
      response: {
        schema: outputOkSchema({
          data: Joi.object({
            id: Joi.string().example('0ded3414-ea02-4af8-a75f-f4801116d790'),
            name: Joi.string().example('referral'),
            amount: Joi.string().example('100000'),
            currencyId: Joi.string().example('hdp.ф'),
            percentRewardForTransaction: Joi.number().example(500),
            payRewardForTransaction: Joi.boolean().example(true),
            payRewardFixed: Joi.boolean().example(true),
          }),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/reward-settings/edit',
    handler: api.operations.setRefSettings,
    options: {
      //auth: 'jwt-access',
      auth: false,
      description: 'Use this endpoint to edit current referral reward settings',
      notes: 'Send all required params',
      tags: ['REFERRAL', 'api'],
      validate: {
        payload: Joi.object({
          currencyId: Joi.string().min(3).max(10).required(),
          amount: Joi.string().min(0).max(18).required(),
          percentRewardForTransaction: Joi.number().min(0).max(100).precision(2).required(),
          payRewardForTransaction: Joi.boolean().required(),
          payRewardFixed: Joi.boolean().required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
];

export default routes;
