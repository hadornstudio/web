import { getTransporter } from '../config/email.js';

// Best-effort — a customer's inquiry must still succeed even if the notification
// email fails to send (bad credentials, Gmail hiccup, etc.), so this never throws.
export async function sendInquiryNotification(inquiry) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('Skipping inquiry notification email — GMAIL_USER/GMAIL_APP_PASSWORD not configured.');
    return;
  }

  const to = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.GMAIL_USER;

  const imagesHtml = inquiry.referenceImages?.length
    ? `<p><strong>Reference images:</strong></p>
       <div>${inquiry.referenceImages.map((url) => `<a href="${url}"><img src="${url}" alt="" width="120" style="margin:4px;border-radius:4px" /></a>`).join('')}</div>`
    : '';

  const html = `
    <div style="font-family: sans-serif; color: #2B2622; max-width: 480px;">
      <h2 style="font-weight: 400;">New Custom Order Inquiry</h2>
      <p><strong>Name:</strong> ${inquiry.name}</p>
      <p><strong>Email:</strong> ${inquiry.email}</p>
      ${inquiry.phone ? `<p><strong>Phone:</strong> ${inquiry.phone}</p>` : ''}
      ${inquiry.budgetRange ? `<p><strong>Budget:</strong> ${inquiry.budgetRange}</p>` : ''}
      <p><strong>Description:</strong></p>
      <p>${inquiry.description}</p>
      ${imagesHtml}
      <p style="margin-top: 24px; color: #6B6259; font-size: 13px;">View and manage this in the admin panel under Inquiries.</p>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: `"Hadorn" <${process.env.GMAIL_USER}>`,
      to,
      replyTo: inquiry.email,
      subject: `New Custom Order Inquiry from ${inquiry.name}`,
      html,
    });
  } catch (err) {
    console.error('Failed to send inquiry notification email:', err.message);
  }
}
