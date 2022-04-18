import * as api from '../api';
import * as Joi from '@hapi/joi';
import { Op } from 'sequelize';
import config from '../config/config';
import { outputOkSchema } from '../schemes';

const routes = [
  {
    method: 'GET',
    path: '/dashboard',
    handler: api.dashboard.getDashboardInfo,
    options: {
      auth: 'jwt-access',
      description: 'Use this  endpoint to get basic dashboard info (upper cards)',
      notes: 'none',
      tags: ['DASHBOARD', 'api'],
    },
  },
  {
    method: 'GET',
    path: '/users',
    handler: api.dashboard.getUserList,
    options: {
      auth: 'jwt-access',
      description: 'Use this  endpoint to get list of users with completed registration',
      notes: 'none',
      tags: ['DASHBOARD', 'api'],
      validate: {
        query: Joi.object({
          search: Joi.string().min(0).max(40).alphanum().allow('@', '.'),
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
    path: '/admins',
    handler: api.dashboard.getAdminList,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to get list of admins',
      notes: 'SUPERADMIN only',
      tags: ['DASHBOARD', 'api'],
      validate: {
        query: Joi.object({
          search: Joi.string().min(0).max(40).alphanum().allow('@'),
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
    path: '/transactions',
    handler: api.dashboard.getTransactionsList,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to get list of transactions',
      notes: 'filter and ordering supported (send timestamp in sec/ type: 0 - deposit, 1 - withdraw )',
      tags: ['DASHBOARD', 'api'],
      validate: {
        query: Joi.object({
          order: Joi.object({}).pattern(Joi.string(), Joi.string().valid('ASC', 'DESC')),
          limit: Joi.number().default(10).integer().min(0).required(),
          offset: Joi.number().default(0).integer().min(0).required(),
          from: Joi.string().max(13).min(13),
          to: Joi.string().max(13).min(13),
          type: Joi.number().integer().valid(0, 1),
          search: Joi.string()
            .min(2)
            .max(60)
            .regex(/^[a-zA-Z0-9]*$/),
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
    path: '/transactions/graph',
    handler: api.dashboard.getTransactionsGraph,
    options: {
      auth: 'jwt-access',
      description: `Returns all transaction made by user (Graph view)`,
      notes: 'DAY - Last 8 hours, WEEK - Last 7 days, MONTH - Last 4 weeks, txType: 0 - deposit, 1 - withdraw ',
      tags: ['USER', 'api'],
      validate: {
        query: Joi.object({
          type: Joi.string().valid('DAY', 'WEEK', 'MONTH').required(),
          currencyId: Joi.string().min(3).max(10).required(),
          txType: Joi.number().min(0).max(1).integer().required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
      response: {
        schema: outputOkSchema({
          currency: Joi.string().example('BTC'),
          data: Joi.array().items(
            Joi.object({
              timestamp: Joi.string().example('1607677455124'),
              amount: Joi.number().example(0.001),
            })
          ),
        }),
      },
    },
  },
];

export default routes;
