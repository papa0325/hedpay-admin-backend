import chalk = require('chalk');

// const prettifyRequest = (value) => {
//  return messageFormat: '{req.url} - {req.method} - code:{req.statusCode}';
// };

export const pinoConfig = (prettify?: boolean) => ({
  prettyPrint: prettify
    ? {
        colorize: chalk.supportsColor,
        crlf: false,
        jsonPretty: false,
        translateTime: 'yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname,v,tags,data',
        messageFormat: '{data}',
        customPrettifiers: {
          response: { messageFormat: '{req.url} - {req.method} - code:{req.statusCode}' },
        },
      }
    : false,
  redact: {
    paths: ['payload.password', 'req.headers.authorization', 'payload.data.files', 'payload.files', 'payload.oldPassword', 'payload.newPassword'],
    censor: '***',
  },
  serializers: {
    req: function customReqSerializer(req) {
      return {
        method: req.method,
        url: req.url,
        payload: req.payload,
      };
    },
    res: function customResSerializer(res) {
      return {
        code: res.statusCode,
        payload: res.result,
        data: res.data,
      };
    },
  },
  logPayload: true,
  logEvents: ['response', 'request'],
  logQueryParams: true,
  formatters: {
    level() {
      return {};
    },
    bindings() {
      return {};
    },
    tags() {
      return {};
    },
  },
  timestamp: () => `,"time":"${new Date(Date.now()).toLocaleString()}"`,
});
