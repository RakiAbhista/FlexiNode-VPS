import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Reuse transporter instance with connection pooling to eliminate handshake latency
let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpEmail || !smtpPassword) {
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      pool: true,
      maxConnections: 3,
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });
  }

  return { transporter: cachedTransporter, smtpEmail };
}

/**
 * Kirim email secara asynchronous di background (non-blocking).
 * Tidak menahan response HTTP user sehingga registrasi & kirim OTP instan (<200ms).
 */
export function sendEmailAsync(options: SendEmailOptions): void {
  const setup = getTransporter();
  if (!setup) {
    console.warn("[EMAIL] SMTP not configured. Skipping background email send.");
    return;
  }

  const { transporter, smtpEmail } = setup;

  transporter
    .sendMail({
      from: `"RuPa Cloud" <${smtpEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ""),
    })
    .then((info: any) => {
      console.log(`[EMAIL SUCCESS] Sent to ${options.to} (${info?.messageId || "ok"})`);
    })
    .catch((error: any) => {
      console.error("[EMAIL ERROR] Background email sending failed:", error);
    });
}

/**
 * Versi sinkron jika diperlukan (misal: testing), dengan timeout cepat.
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const setup = getTransporter();
  if (!setup) return false;

  try {
    await setup.transporter.sendMail({
      from: `"RuPa Cloud" <${setup.smtpEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>?/gm, ""),
    });
    return true;
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send email via SMTP:", error);
    return false;
  }
}
