import { createTransport } from 'nodemailer';
import config from '../config/config';

interface ISendEmailJob {
  text: string;
  email: string;
  subject: string;
  html: string;
}

const transport = createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465, // true for 465, false for other ports
  auth: {
    user: config.email.user,
    pass: config.email.password
  },
  tls: { rejectUnauthorized: false }
});


export default async (payload: ISendEmailJob) => {
  const res = await transport.sendMail({
    from: config.email.user,
    to: payload.email,
    subject: payload.subject,
    text: payload.text,
    html: payload.html
  });
};
