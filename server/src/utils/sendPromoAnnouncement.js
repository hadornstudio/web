import { getTransporter } from '../config/email.js';
import User from '../models/User.js';

// Demo-scale bulk send over a personal Gmail App Password account — sequential with a
// small stagger between sends to stay well under Gmail's ~500/day cap and avoid reading
// as a spam burst. For real production volume, swap this for a proper ESP (SendGrid,
// Mailchimp, etc.) with unsubscribe handling built in; raw Gmail SMTP isn't meant for
// marketing-scale sends and risks the account getting flagged.
export async function sendPromoAnnouncement(promo) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Skipping promo announcement — GMAIL_USER/GMAIL_APP_PASSWORD not configured.');
    return { sent: 0, failed: 0, total: 0 };
  }

  const customers = await User.find({ role: 'customer', isActive: true }).select('email name');
  const transporter = getTransporter();

  const html = `
    <div style="font-family: sans-serif; color: #2B2622; max-width: 480px;">
      ${promo.bannerImage ? `<img src="${promo.bannerImage}" alt="" style="width:100%;border-radius:4px;margin-bottom:16px" />` : ''}
      <h2 style="font-weight: 400;">${promo.title}</h2>
      ${promo.description ? `<p>${promo.description}</p>` : ''}
      ${promo.coupon?.code ? `<p style="margin-top:16px;"><strong>Use code:</strong> <span style="letter-spacing:0.1em;">${promo.coupon.code}</span></p>` : ''}
      <p style="margin-top: 24px; color: #6B6259; font-size: 13px;">— The Hadorn Team</p>
    </div>
  `;

  let sent = 0;
  let failed = 0;

  for (const customer of customers) {
    try {
      await transporter.sendMail({
        from: `"Hadorn" <${process.env.GMAIL_USER}>`,
        to: customer.email,
        subject: promo.title,
        html,
      });
      sent += 1;
    } catch (err) {
      failed += 1;
      console.error(`Failed to send promo email to ${customer.email}:`, err.message);
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return { sent, failed, total: customers.length };
}
