import * as Hapi from '@hapi/hapi';
import * as Nes from '@hapi/nes';
import * as Inert from '@hapi/inert';
import * as Vision from '@hapi/vision';
import * as Pino from 'hapi-pino';
import * as Basic from '@hapi/basic';
import * as HapiCors from 'hapi-cors';
import * as HapiBearer from 'hapi-auth-bearer-token';
import sequelize from './models';
import routes from './routes';
import config from './config/config';
import { run } from 'graphile-worker/dist';

import { accessValidate, chatValidate, refreshValidate } from './utils/auth';
import * as fs from 'fs';
const HapiSwagger = require('hapi-swagger');
import SwaggerOptions from './config/swagger';
import { pinoConfig } from './config/pino';

const Package = require('../../package.json');
const Qs = require('qs');

SwaggerOptions.info.version = Package.version;

const init = async () => {
  const server = await new Hapi.Server({
    port: config.server.port,
    host: config.server.host,
    query: {
      parser: (query) => Qs.parse(query),
    },
    routes: {
      response: {
        failAction: 'log',
      },
    },
  });
  server.realm.modifiers.route.prefix = '/api';
  // Регистрируем расширения
  await server.register([Basic, Nes, Inert, Vision, HapiBearer, { plugin: Pino, options: pinoConfig(false) }, { plugin: HapiSwagger, options: SwaggerOptions }]);
  process.umask(0);

  server.app.scheduler = await run({
    connectionString: config.db.link,
    taskDirectory: `${__dirname}/jobs`,
  });

  // JWT Auth
  server.auth.strategy('jwt-access', 'bearer-access-token', {
    validate: accessValidate,
  });
  server.auth.strategy('jwt-refresh', 'bearer-access-token', {
    validate: refreshValidate,
  });

  server.auth.strategy('chat-access', 'basic', {
    validate: chatValidate,
  });

  server.auth.default({ strategy: 'jwt-access', mode: 'optional' });

  // Загружаем маршруты
  server.route(routes);

  server.app.db = sequelize;
  // Error handler
  server.ext('onPreResponse', (r, h) => {
    if (r.app.error) {
      r.response = h
        .response({
          ok: false,
          code: r.app.error.data.code,
          data: r.app.error.data.data,
          message: r.app.error.output.payload.message,
        })
        .code(Math.floor(r.app.error.data.code / 1000));
      return h.continue;
    } else if (r.response.isBoom && r.response.data) {
      if (r.response.data.custom) {
        r.response = h
          .response({
            ok: false,
            code: r.response.data.code,
            data: r.response.data.data,
            message: r.response.output.payload.message,
          })
          .code(Math.floor(r.response.data.code / 1000));

        return h.continue;
      } else {
        return h.continue;
      }
    } else {
      return h.continue;
    }
  });

  // Запускаем сервер
  try {
    await server.register({
      plugin: HapiCors,
      options: config.cors,
    });
    await server.start();
    await server.subscription('/admin/chats', {
      filter: async function (path, message, options): Promise<boolean> {
        if (!options.credentials || !options.credentials.role) return false;
        else return true;
      },
    });

    server.log('info', `Server running at: ${server.info.uri}`);
  } catch (err) {
    server.log('error', JSON.stringify(err));
  }

  return server;
};

export { init };
