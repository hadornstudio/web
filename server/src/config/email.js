import nodemailer from 'nodemailer';

let transporter;

// Lazily created so a missing GMAIL_APP_PASSWORD doesn't crash the whole server on boot —
// only matters at the moment an email actually needs to send.
export function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}
