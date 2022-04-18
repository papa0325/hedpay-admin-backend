import { error, getRealIp, getUUID, output, totpValidate } from '../utils';
import { accessCheck, generateJwt, generateSecret2FA, getAccessTokenInfo, randomString } from '../utils/auth';
import { AdminRole } from '../utils/types';

import * as btoa from 'btoa';
import { getRefreshTokenInfo } from '../utils/auth';

import { EmailType } from '../utils/types';

import config from '../config/config';
import { Admin } from '../models/Admin';
import { AdminSession } from '../models/AdminSession';
import { User } from '../models/User';
import { addJob } from '../utils/helpers';

//TODO DELETE
const createSuperadmin = async (r) => {
  try {
    const _created: Admin = await Admin.create({ ...r.payload, role: AdminRole.SUPERADMIN });
    _created.status = 0;
    await _created.save();

    const access_uuid = getUUID();
    const refresh_uuid = getUUID();
    const access_exp = Math.round(Date.now() / 1000) + config.auth.jwt.access.lifetime;
    const refresh_exp = Math.round(Date.now() / 1000) + config.auth.jwt.refresh.lifetime;
    const iat = Math.round(Date.now() / 1000);

    const token = generateJwt({ access_uuid, access_exp, refresh_uuid, refresh_exp });

    await AdminSession.create({
      adminId: _created.id,
      userId: null,
      lastUsedDate: new Date(),
      lastUsedIp: getRealIp(r),
      accessTokenUUID: access_uuid,
      refreshTokenUUID: refresh_uuid,
      access_exp: access_exp.toString(),
      refresh_exp: refresh_exp.toString(),
      iat: iat.toString(),
    });

    const QRCode = await generateSecret2FA(_created);

    return output({
      access: token.access,
      refresh: token.refresh,
      message: `New Superadmin "${_created.email}" was created!`,
      QRCode: QRCode,
    });
  } catch (err) {
    console.log(err);
    return error(500000, `Failed when trying to create new admin`, err);
  }
};

const createAdmin = async (r) => {
  try {
    await accessCheck(r, AdminRole.SUPERADMIN);

    const verifyToken: string = randomString(10);

    if (await Admin.findOne({ where: { email: r.payload.email } })) return error(400000, 'This email is already in use, please, pick another one', {});
    if (await User.findOne({ where: { email: r.payload.email } })) return error(400000, 'This email is already in use, please, pick another one', {});

    await addJob('sendEmail', {
      // text,
      email: r.payload.email,
      subject: 'HEdpAY | Admin',
      html: `<p>Hello!<br>You've assigned as an admin on HEdpAY Admin Service. To continue registration process, please proceed to  <a href="${config.server.baseURL}registration?token=${verifyToken}" target="_blank">Become admin</a>.<br>
                  <br> 
                   Thank you!
                    </p>`,
    });

    const _created = await Admin.create({ ...r.payload, status: 2 });

    const newSettings = { ..._created.settings, confirmationToken: verifyToken };
    await _created.update({ settings: newSettings });

    //Email sending

    return output({ message: `The invintation letter to join as Admin was sent to "${_created.email}"!` });
  } catch (err) {
    console.log(err);
    return error(500000, `Failed when trying to create new admin`, err);
  }
};

const checkAdminValidation = async (r) => {
  const { token } = r.query;
  const newAdmin: Admin | null = await Admin.scope('auth').findOne({
    where: {
      settings: {
        confirmationToken: token,
      },
    },
  });
  if (!newAdmin) return error(404000, 'Token does not match any admin', { verified: false });
  if (newAdmin.status !== 2) return error(400000, 'The invitation is not active', null);
  await newAdmin.update({ status: 3 });
  return output({ verified: true, email: newAdmin.email });
};

const adminRegisterBasic = async (r) => {
  try {
    const { password, firstName, lastName, email } = r.payload;
    const newAdmin: Admin | null = await Admin.scope('auth').findOne({ where: { email: email } });

    if (!newAdmin) return error(404000, 'Email not found', {});

    if (newAdmin.status !== 3) return error(401010, 'Confirm your email address', {});

    newAdmin.password = password;
    newAdmin.firstName = firstName;
    newAdmin.lastName = lastName;
    await newAdmin.save();

    const QRCode = await generateSecret2FA(newAdmin);

    return output({ QRCode: QRCode });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed when trying to register an admin (basic) ', { reason: err });
  }
};

const adminRegisterFinal = async (r) => {
  try {
    const newAdmin: Admin | null = await Admin.scope('auth').findOne({
      where: { email: r.payload.email },
    });
    if (!newAdmin) return error(404000, `Admin was not found`, { notFound: true });
    if (!newAdmin.settings.is2FA) return error(403000, 'Complete basic registration first', {});
    if (!totpValidate(r.payload.token2FA, newAdmin.settings.Secret2FA)) {
      return error(401001, 'token2FA is invalid', {});
    }
    newAdmin.status = 0;
    await newAdmin.save();

    const access_uuid = getUUID();
    const refresh_uuid = getUUID();
    const access_exp = Math.round(Date.now() / 1000) + config.auth.jwt.access.lifetime;
    const refresh_exp = Math.round(Date.now() / 1000) + config.auth.jwt.refresh.lifetime;
    const iat = Math.round(Date.now() / 1000);

    const token = generateJwt({ access_uuid, access_exp, refresh_uuid, refresh_exp });

    await AdminSession.create({
      adminId: newAdmin.id,
      lastUsedDate: new Date(),
      lastUsedIp: getRealIp(r),
      accessTokenUUID: access_uuid,
      refreshTokenUUID: refresh_uuid,
      access_exp: access_exp.toString(),
      refresh_exp: refresh_exp.toString(),
      iat: iat.toString(),
    });

    return output({ access: token.access, refresh: token.refresh });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed when trying to register admin (final)', {});
  }
};

const getAdminRole = (r) => {
  try {
    return output({ role: r.auth.credentials.role });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to output admin role', {});
  }
};

const activateAdmin = async (r) => {
  try {
    await accessCheck(r, AdminRole.SUPERADMIN);

    const _tobeactivated: Admin = await Admin.findByPk(r.payload.adminId);
    if (!_tobeactivated) return error(404000, 'No admin was found', {});
    if (_tobeactivated.id === r.auth.credentials.id) {
      return error(408001, `You cannnot activate yourself`, {});
    }

    if (!_tobeactivated.banned) return error(408002, `This account is already activated`, {});

    await _tobeactivated.update({ banned: false });
    return output({ message: `Admin "${_tobeactivated.email}" was activated!` });
  } catch (err) {
    return error(500000, `Failed when trying to activate an admin`, err);
  }
};

const adminAuth = async (r) => {
  try {
    const admin: Admin = await Admin.scope('auth').findOne({ where: { email: r.payload.email } });

    if (!admin) return error(404000, 'Admin with given credentials was not found', null);
    if (admin.status !== 0) return error(403000, 'Your account is not activated', null);
    if (admin.banned) return error(403000, 'Your account was deactivated by superadmin', null);
    if (!admin.passwordCompare(r.payload.password) || !totpValidate(r.payload.token2FA, admin.settings.Secret2FA)) return error(400000, 'Incorrect credentials', null);

    const access_uuid = getUUID();
    const refresh_uuid = getUUID();
    const access_exp = Math.round(Date.now() / 1000) + config.auth.jwt.access.lifetime;
    const refresh_exp = Math.round(Date.now() / 1000) + config.auth.jwt.refresh.lifetime;
    const iat = Math.round(Date.now() / 1000);

    const token = generateJwt({ access_uuid, access_exp, refresh_uuid, refresh_exp });

    await AdminSession.create({
      adminId: admin.id,
      lastUsedDate: new Date(),
      lastUsedIp: getRealIp(r),
      accessTokenUUID: access_uuid,
      refreshTokenUUID: refresh_uuid,
      access_exp: access_exp.toString(),
      refresh_exp: refresh_exp.toString(),
      iat: iat.toString(),
    });
    return output({ access: token.access, refresh: token.refresh, role: admin.role });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed to auth as an admin', null);
  }
};

const changeRole = async (r) => {
  try {
    await accessCheck(r, AdminRole.SUPERADMIN);

    const _tobechanged: Admin = await Admin.findOne({ where: { email: r.payload.email } });
    if (!_tobechanged) return error(404000, `Admin with given email were not found`, {});
    _tobechanged.update({ role: r.payload.newRole });
    return output({ message: 'Role was changed', newRole: r.payload.newRole });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed when trying to change admin role', {});
  }
};

const refreshToken = async (r) => {
  try {
    const infoRefreshToken = await getRefreshTokenInfo(r.auth.artifacts.token);
    const session: AdminSession | null = await AdminSession.findOne({
      where: {
        refreshTokenUUID: infoRefreshToken.refresh_uuid,
      },
    });
    if (!session) {
      return error(404000, 'No session found', {});
    }
    const admin: Admin | null = await Admin.scope('auth').findByPk(session.adminId);
    if (!admin) return error(400000, 'Session with this userId was not found', {});

    const access_uuid = getUUID();
    const refresh_uuid = getUUID();
    const access_exp = Math.round(Date.now() / 1000) + config.auth.jwt.access.lifetime;
    const refresh_exp = Math.round(Date.now() / 1000) + config.auth.jwt.refresh.lifetime;
    const iat = Math.round(Date.now() / 1000);
    const token = generateJwt({ access_uuid, access_exp, refresh_uuid, refresh_exp });

    await AdminSession.create({
      adminId: admin.id,
      lastUsedDate: new Date(),
      lastUsedIp: getRealIp(r),
      accessTokenUUID: access_uuid,
      refreshTokenUUID: refresh_uuid,
      access_exp: access_exp.toString(),
      refresh_exp: refresh_exp.toString(),
      iat: iat.toString(),
    });
    return output({ access: token.access, refresh: token.refresh, role: admin.role });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed when trying to refresh token', { reason: err });
  }
};

const banAdmin = async (r) => {
  try {
    await accessCheck(r, AdminRole.SUPERADMIN);

    const admin: Admin = await Admin.findByPk(r.payload.adminId);
    if (!admin) return error(404000, 'No admin was found', {});
    if (admin.id === r.auth.credentials.id) {
      return error(400000, `You cannnot deactivate yourself`, {});
    }
    if (admin.banned) {
      return error(400000, `This account is already deactivated`, {});
    }

    await admin.update({ banned: true });
    return output({ message: `Admin "${admin.email}" was banned!` });
  } catch (err) {
    console.log(err);
    return error(500000, `Failed when trying to ban an admin`, err);
  }
};

const unbanAdmin = async (r) => {
  try {
    await accessCheck(r, AdminRole.SUPERADMIN);
    const { adminId } = r.payload;

    const admin = await Admin.findByPk(adminId);
    if (!admin) return error(404000, 'Admin with given adminId was not found', null);

    await admin.update({ banned: false });

    return output({ message: `Admin ${admin.email} has been pardoned` });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed when trying to unban an admin', null);
  }
};

const deleteAdmin = async (r) => {
  try {
    await accessCheck(r, AdminRole.SUPERADMIN);
    const { adminId } = r.payload;

    const admin = await Admin.findByPk(adminId);
    if (!admin) return error(404000, 'Admin with given adminId was not found', null);

    if (adminId == r.auth.credentials.id) return error(400000, 'You cannot delete yourself', null);
    await admin.destroy();

    return output({ message: `Admin ${admin.email} has been deleted` });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed when trying to delete an admin', null);
  }
};

const logout = async (r) => {
  try {
    const infoAccessToken = await getAccessTokenInfo(r.auth.artifacts.token);

    const session = await AdminSession.findOne({
      where: {
        accessTokenUUID: infoAccessToken.access_uuid,
      },
    });
    if (!session) return error(404000, 'Session was not found', null);

    await session.destroy();
    return output({ message: 'Logged out successfully' });
  } catch (err) {
    console.log(err);
    return error(500000, 'Failed when trying to log out', null);
  }
};

export {
  createAdmin,
  adminAuth,
  getAdminRole,
  createSuperadmin,
  activateAdmin,
  changeRole,
  checkAdminValidation,
  adminRegisterBasic,
  adminRegisterFinal,
  refreshToken,
  banAdmin,
  unbanAdmin,
  deleteAdmin,
  logout,
};
