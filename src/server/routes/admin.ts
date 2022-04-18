import * as api from '../api';
import * as Joi from '@hapi/joi';

const routes = [
  {
    method: 'POST',
    path: '/admin/add',
    handler: api.admin.createAdmin,
    options: {
      auth: 'jwt-access',
      description: 'Method for creating new admin',
      notes: 'Sends confirmation email to new admin. New admin has to finish registration.',
      tags: ['SUPERADMIN', 'api'],
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required(),
          role: Joi.number().required().valid(1, 2),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/admin/verify',
    handler: api.admin.checkAdminValidation,
    options: {
      auth: false,
      description: `Method for verifying new admin's email`,
      notes: 'Allows new adming to init a registration.',
      tags: ['ADMIN', 'api'],
      validate: {
        query: Joi.object({
          token: Joi.string().required().max(10),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/admin/register/basic',
    handler: api.admin.adminRegisterBasic,
    options: {
      auth: false,
      description: 'Basic admin registration',
      notes: `This method returns "true" and QRCode to scan in case of successful basic registration `,
      tags: ['ADMIN', 'api'],
      validate: {
        payload: Joi.object({
          firstName: Joi.string()
            .regex(/^[a-zA-Z]*$/)
            .required(),
          lastName: Joi.string()
            .regex(/^[a-zA-Z]*$/)
            .required(),
          password: Joi.string().required().min(7).max(40),
          email: Joi.string().email().required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/admin/register/final',
    handler: api.admin.adminRegisterFinal,
    options: {
      auth: false,
      description: 'Final registration for admin',
      notes: 'Send totp token from G-Auth app to finish registration',
      tags: ['ADMIN', 'api'],
      validate: {
        payload: Joi.object({
          token2FA: Joi.string().max(6).required(),
          email: Joi.string().email().required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/admin/role',
    handler: api.admin.getAdminRole,
    options: {
      auth: 'jwt-access',
      description: `Returns admin's role`,
      notes: 'returns number',
      tags: ['ADMIN', 'api'],
    },
  },
  {
    method: 'POST',
    path: '/superadmin/add',
    handler: api.admin.createSuperadmin,
    options: {
      auth: false,
      description: 'User registration',
      notes: 'User registration',
      tags: ['SUPERADMIN', 'api'],
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required(),
          password: Joi.string().min(7).required(),
          firstName: Joi.string(),
          lastName: Joi.string(),
          username: Joi.string(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/admin/login',
    handler: api.admin.adminAuth,
    options: {
      auth: false,
      description: 'Admin autorization',
      notes: 'User registration',
      tags: ['ADMIN', 'api'],
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required(),
          password: Joi.string().min(7).max(40).required(),
          token2FA: Joi.string().max(6).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/admin/activate',
    handler: api.admin.activateAdmin,
    options: {
      auth: 'jwt-access',
      description: 'User registration',
      notes: 'User registration',
      tags: ['ADMIN', 'api'],
      validate: {
        payload: Joi.object({
          adminId: Joi.number().min(0).integer().required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/admin/change-role',
    handler: api.admin.changeRole,
    options: {
      auth: 'jwt-access',
      description: `Changing admin's role`,
      notes: 'This method is avaliable for SUPERADMIN only. Roles: 1 - Operator \\ 2 - Admin \\',
      tags: ['ADMIN', 'api'],
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required(),
          newRole: Joi.number().valid(1, 2).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/refresh-token',
    handler: api.admin.refreshToken,
    options: {
      auth: 'jwt-refresh',
      id: 'auth.refresh-token',
      tags: ['REFRESH', 'api'],
      description: 'Refresh access and refresh tokens',
      notes: 'Refresh access and refresh tokens',
    },
  },
  {
    method: 'POST',
    path: '/admin/ban',
    handler: api.admin.banAdmin,
    options: {
      auth: 'jwt-access',
      tags: ['BAN', 'api'],
      description: 'Use this method to block selected admin',
      notes: 'none',
      validate: {
        payload: Joi.object({
          adminId: Joi.number().integer().min(0).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/admin/unban',
    handler: api.admin.unbanAdmin,
    options: {
      auth: 'jwt-access',
      tags: ['BAN', 'api'],
      description: 'Use this method to unblock selected admin',
      notes: 'none',
      validate: {
        payload: Joi.object({
          adminId: Joi.number().integer().min(0).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/admin/delete',
    handler: api.admin.deleteAdmin,
    options: {
      auth: 'jwt-access',
      tags: ['BAN', 'api'],
      description: 'Use this method to delete selected admin',
      notes: 'none',
      validate: {
        payload: Joi.object({
          adminId: Joi.number().integer().min(0).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/logout',
    handler: api.admin.logout,
    options: {
      auth: 'jwt-access',
      tags: ['AUTH', 'api'],
      description: 'Use this method to log out from your account',
      notes: 'none',
    },
  },
];

export default routes;
