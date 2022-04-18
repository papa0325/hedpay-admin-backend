import * as api from '../api';
import * as Joi from '@hapi/joi';

const routes = [
  {
    method: 'GET',
    path: '/stats/fees',
    handler: api.stats.getFeesByCurrency,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to get fee statistics for specified period and currency',
      notes: 'none',
      tags: ['STATS', 'api'],
      validate: {
        query: Joi.object({
          from: Joi.number().min(1000000000000).max(9900000000000).integer().required(),
          to: Joi.number().min(1000000000000).max(9900000000000).integer().required(),
          currencyId: Joi.string().min(3).max(10).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/stats/transactions',
    handler: api.stats.getTransactionsStats,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to receive transactions statistics for selected currency of time-period(ms)',
      notes: 'none',
      tags: ['STATS', 'api'],
      validate: {
        query: Joi.object({
          from: Joi.number().min(1000000000000).max(9900000000000).integer().required(),
          to: Joi.number().min(1000000000000).max(9900000000000).integer().required(),
          currencyId: Joi.string().min(3).max(10).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/stats/balances',
    handler: api.stats.getBalancesByCurrency,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to get balances statistics for each currency',
      notes: 'none',
      tags: ['STATS', 'api'],
    },
  },
];

export default routes;
