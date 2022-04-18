import { v4 as uuidv4 } from 'uuid';
import { Boom } from '@hapi/boom';
import * as speakeasy from 'speakeasy';
import config from '../config/config';
import axios from 'axios';
import * as btoa from 'btoa';
import { randomBytes } from 'crypto';

export function getUUID(): string {
  return uuidv4();
}

export const toArrayBuffer = (buf) => {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; i += 1) {
    view[i] = buf[i];
  }

  return ab;
};

export const randomString = (len: number): string => randomBytes(len).toString('hex').slice(0, len);

export function getRealIp(request): string {
  return request.headers['cf-connecting-ip'] ? request.headers['cf-connecting-ip'] : request.info.remoteAddress;
}

export function output(res?: object | null): object {
  return {
    ok: true,
    result: res,
  };
}

export function error(code: number, msg: string, data): Boom {
  return new Boom(msg, {
    data: {
      code,
      data,
      custom: true,
    },
    statusCode: Math.floor(code / 1000),
  });
}

export const totpValidate = (totp: string, secret: string): boolean => {
  const result = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: totp,
  });
  console.log(`totp verify result (${totp}  ---   ${secret}): ` + result);
  return result;
};

export const transportAxios = async (payload) => {
  let res;
  if (payload.method === 'post') {
    res = await axios.post(payload.url + payload.path, payload.data, {
      headers: { 'content-type': 'application/json', Authorization: payload.auth },
    });
  }
  if (payload.method === 'get') {
    res = await axios.get(payload.url + payload.path, {
      headers: {
        'content-type': 'application/json',
        Authorization: payload.auth,
      },
    });
  }
  return res;
};

// export const sendNotificationMessage = async (payload) => {
//   await transportAxios({
//     url: config.notification.url,
//     path: payload.path,
//     method: 'post',
//     data: {
//       userId: payload.userId,
//       type: payload.type,
//       data: payload.data,
//     },
//     auth: 'Basic ' + btoa(config.email.server_id + ':' + config.email.server_password),
//   });
// };

export function responseHandler(r, h) {
  if (r.response.isBoom && r.response.data) {
    if (r.response.data.custom) {
      r.response = h
        .response({
          ok: false,
          code: r.response.data.code,
          data: r.response.data.data,
          msg: r.response.output.payload.message,
        })
        .code(Math.floor(r.response.data.code / 1000));
      return h.continue;
    } else {
      r.response = h.response({
        ok: false,
        code: Math.floor(r.response.output.statusCode * 1000),
        data: {},
        msg: r.response.message,
      });
      return h.continue;
    }
  } else {
    return h.continue;
  }
}

export async function handleValidationError(r, h, err) {
  return error(400000, 'Validation error', {
    errors: err.details.map((e) => {
      return { field: e.context.key, reason: e.type.replace('any.', '') };
    }),
  });
}
