import * as api from '../api';
import * as Joi from '@hapi/joi';
import { Op } from 'sequelize';
import config from '../config/config';

const routes = [
  {
    method: 'POST',
    path: '/admin/chats/close',
    handler: api.chat.closeChat,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to close a chat with user',
      notes: 'Requires access token',
      tags: ['CHAT', 'api'],
      validate: {
        payload: Joi.object({
          id: Joi.number().min(1).integer().required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/admin/chats',
    handler: api.chat.getChatsPreview,
    options: {
      auth: 'jwt-access',
      description: 'Use this  endpoint to get list of last messages and senders',
      notes: 'Returns array of objects',
      tags: ['CHAT', 'api'],
    },
  },
  {
    method: 'GET',
    path: '/admin/chats/{id}',
    handler: async (r, h) => {
      return await api.chat.getMessages(r, 'admin');
    },
    options: {
      auth: 'jwt-access',
      description: 'Use this  endpoint to get a messages from chat',
      notes: 'Enter valid chat id',
      tags: ['CHAT', 'api'],
      validate: {
        params: Joi.object({
          id: Joi.number().min(1).integer().required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/admin/chats',
    handler: api.chat.sendMessage,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to send a message to specific chat',
      notes: 'Enter valid chat id',
      tags: ['CHAT', 'api'],
      payload: {
        maxBytes: config.files.maxFilesSize,
        output: 'data',
        allow: 'multipart/form-data',
        multipart: true,
        parse: true,
      },
      validate: {
        payload: Joi.object({
          id: Joi.number().integer().required(),
          message: Joi.string().allow('').optional().max(1500),
          file: Joi.any().meta({ swaggerType: 'file' }).optional().allow('').description('Message attachment file'),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/admin/chats/start',
    handler: api.chat.startChatByAdmin,
    options: {
      auth: 'jwt-access',
      description: 'Use this endpoint to send a message to specific chat',
      notes: 'Enter valid chat id',
      tags: ['CHAT', 'api'],
      validate: {
        payload: Joi.object({
          userId: Joi.string().min(0).max(70).required(),
        }),
        failAction: (req, h, err) => {
          return err.isJoi ? h.response(err.details[0]).takeover().code(400) : h.response(err).takeover();
        },
      },
    },
  },
  {
    method: 'POST',
    path: '/admin/chats/send-ws',
    handler: api.chat.sendWS,
    options: {
      auth: 'chat-access',
      description: 'Server method to send',
      notes: 'none',
      tags: ['SERVER'],
    },
  },
];

export default routes;
