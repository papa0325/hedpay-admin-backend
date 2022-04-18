import * as jwt from 'jsonwebtoken';
import config from '../config/config';
import * as speakeasy from 'speakeasy';
import { error, output } from './index';
import * as QRCode from 'qrcode';
import * as util from 'util';
import { randomBytes } from 'crypto';
import * as Chalk from 'chalk';
import { Json } from 'sequelize/types/lib/utils';
import { user } from '../schemes';
import { AdminRole } from './types';
import { AdminSession } from '../models/AdminSession';
import { Admin } from '../models/Admin';

export const generateJwt = (data: object) => {
  let access = jwt.sign(data, config.auth.jwt.access.secret, {
    expiresIn: config.auth.jwt.access.lifetime,
  });
  let refresh = jwt.sign(data, config.auth.jwt.refresh.secret, {
    expiresIn: config.auth.jwt.refresh.lifetime,
  });

  return { access, refresh };
};

export const checkTokens = async (sessionId) => {
  const session: AdminSession = await AdminSession.findByPk(sessionId);

  const timestampNow = Math.round(new Date().getTime() / 1000.0);

  if (Number(session.access_exp) < timestampNow || Number(session.refresh_exp) < timestampNow) {
    return false;
  }

  return true;
};

export const chatValidate = async (request, username, password, h) => {
  if (username == config.chat.thisBackendUsername && password == config.chat.thisBackendPassword) {
    return { isValid: true, credentials: {} };
  }

  return { isValid: false, credentials: {} };
};

export const accessCheck = async (r, role: AdminRole) => {
  const checkToken = await checkTokens(r.auth.artifacts.session);
  const admin: Admin = r.auth.credentials;

  if (!checkToken) return error(401002, 'Token is expired (api)', {});
  if (!admin) return error(404000, 'Admin not found', {});
  if (admin.status !== 1) return error(401000, 'Your account was deactivated', {});
  if (admin.role < role) return error(403000, 'You are not permitted to do this operation', {});
};

export const decodeJwt = async (token: string, secret: string) => {
  try {
    return await jwt.verify(token, secret);
  } catch (e) {
    let code = e.name === 'TokenExpiredError' ? 401001 : 401002;
    let msg = e.name === 'TokenExpiredError' ? 'Token expired' : 'Token invalid';
    return error(code, msg, {});
  }
};

const createQRCode = util.promisify(QRCode.toDataURL);

export const randomString = (len: number): string => randomBytes(len).toString('hex').slice(0, len);
export const generateSecret2FA = async (admin: Admin) => {
  try {
    const secret = speakeasy.generateSecret({ name: 'HEdpAY | ADMIN' });
    const currentSettings = admin.settings;
    const updatedSettings = { ...currentSettings, Secret2FA: secret.base32, is2FA: true };
    await admin.update({ settings: updatedSettings });
    return await createQRCode(secret.otpauth_url);
  } catch (err) {
    return error(500000, 'Failed to generate secret2FA', err);
  }
};

export const accessValidate = async (r, token) => {
  let data = await decodeJwt(token, config.auth.jwt.access.secret);

  if (data.isBoom) {
    r.app.error = data;
    return data;
  }

  let session: AdminSession = await AdminSession.findOne({
    where: {
      accessTokenUUID: data.access_uuid,
    },
  });
  let timestampNow = Math.round(new Date().getTime() / 1000.0);

  if (!session) {
    r.app.error = error(401001, 'Session not found. Please login again.', {});
    return error(401001, 'Session not found. Please login again.', {});
  }
  if (Number(session.access_exp) < timestampNow) return error(401002, 'Token expired', null);
  let admin = await Admin.findByPk(session.adminId, { attributes: { include: ['settings'] } });
  if (admin.banned) {
    r.app.error = error(403000, 'Your account was deactivated by superadmin', null);
    return error(403000, 'Your account was deactivated by superadmin', null);
  }
  console.log('---- ' + JSON.stringify(admin));
  return {
    isValid: true,
    credentials: admin,
    artifacts: { token, type: 'access', session: session.id },
  };
};

export const refreshValidate = async (r, token) => {
  let data = await decodeJwt(token, config.auth.jwt.refresh.secret);

  if (data.isBoom) {
    r.app.error = data;
    return data;
  }

  let session = await AdminSession.findOne({
    where: {
      refreshTokenUUID: data.refresh_uuid,
    },
  });

  if (!session) {
    r.app.error = error(401001, 'Session not found. Please login again.', {});
    return error(401001, 'Session not found. Please login again.', {});
  }
  let timestampNow = Math.round(new Date().getTime() / 1000.0);
  if (Number(session.refresh_exp) < timestampNow) return error(401002, 'Token expired', null);
  let admin = await Admin.scope('auth').findByPk(session.adminId);
  console.log(JSON.stringify(admin));
  return {
    isValid: true,
    credentials: admin,
    artifacts: { token, type: 'refresh', session: session.id },
  };
};

export const getRealIp = (request) => (request.headers['cf-connecting-ip'] ? request.headers['cf-connecting-ip'] : request.info.remoteAddress);

export const getAccessTokenInfo = async (token: string) => {
  return await decodeJwt(token, config.auth.jwt.access.secret);
};
export const getRefreshTokenInfo = async (token: string) => {
  return await decodeJwt(token, config.auth.jwt.refresh.secret);
};
