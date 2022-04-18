import { config } from 'dotenv';
import * as path from 'path';
const appDir = path.dirname(require.main.filename);
config();
//
export default {
  consts: {
    percentagePrecision: 4,
  },
  db: {
    link: process.env.DB_LINK,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
  },
  chat: {
    BackendURL: process.env.BACKEND_URL,
    BackendUsername: process.env.BACKEND_USERNAME,
    BackendPassword: process.env.BACKEND_PASSWORD,
    thisBackendUsername: process.env.BACKEND_THIS_USERNAME,
    thisBackendPassword: process.env.BACKEND_THIS_PASSWORD,
  },
  auth: {
    jwt: {
      access: {
        secret: process.env.JWT_ACCESS_SECRET,
        lifetime: Number(process.env.JWT_ACCESS_LIFETIME),
      },
      refresh: {
        secret: process.env.JWT_REFRESH_SECRET,
        lifetime: Number(process.env.JWT_REFRESH_LIFETIME),
      },
    },
  },
  files: {
    maxFilesSize: 1024 * 1024 * 15, //in bytes
    maxFilesCount: 3,
    maxFileNameLength: 50,
    allowedExt: /(jpg|png|jpeg|pdf|docx)$/,
    filesDir: path.join(__dirname, '..', '..', '..', 'upload/'), //`${appDir}/../upload/`,
  },
  server: {
    port: process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 3000,
    host: process.env.SERVER_HOST ? process.env.SERVER_HOST : 'localhost',
    shutdownTimeout: process.env.SERVER_SHUTDOWN_TIMEOUT ? Number(process.env.SERVER_SHUTDOWN_TIMEOUT) : 15000,
    baseURL: process.env.BASE_URL,
  },
  security: {
    saltRounds: 10,
  },
  rates: {
    precision: 8,
  },
  cors: {
    origins: process.env.CORS_ORIGINS ? JSON.parse(process.env.CORS_ORIGINS) : ['*'],
    methods: process.env.CORS_METHODS ? JSON.parse(process.env.CORS_METHODS) : ['POST, GET, OPTIONS'],
    headers: process.env.CORS_HEADERS ? JSON.parse(process.env.CORS_HEADERS) : ['Accept', 'Content-Type', 'Authorization'],
    maxAge: process.env.CORS_MAX_AGE ? Number(process.env.CORS_MAX_AGE) : 600,
    allowCredentials: process.env.CORS_ALLOW_CREDENTIALS ? process.env.CORS_ALLOW_CREDENTIALS : 'true',
    exposeHeaders: process.env.CORS_EXPOSE_HEADERS ? JSON.parse(process.env.CORS_EXPOSE_HEADERS) : ['content-type', 'content-length'],
  },
  time: {
    hour: 1000 * 60 * 60,
    day: 1000 * 60 * 60 * 24,
    month: 1000 * 60 * 60 * 24 * 30,
    days_10: 1000 * 60 * 60 * 24 * 10,
  },
};
