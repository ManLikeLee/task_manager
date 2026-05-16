const logger = require("../utils/logger");

const isProduction = (process.env.NODE_ENV || "development") === "production";
const isDevelopment = !isProduction;
const getEmailProvider = () =>
  String(process.env.EMAIL_PROVIDER || "smtp").trim().toLowerCase();

let transporter = null;
let transporterInitAttempted = false;
let resendClient = null;
let resendInitAttempted = false;

const isSmtpConfigured = () =>
  Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.EMAIL_FROM,
  );

const isResendConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

const getTransporter = () => {
  if (transporterInitAttempted) {
    return transporter;
  }

  transporterInitAttempted = true;

  if (!isSmtpConfigured()) {
    logger.warn("mail.smtp_not_configured", {
      environment: process.env.NODE_ENV || "development",
    });
    return null;
  }

  try {
    // Optional dependency for local environments where SMTP is not set up yet.
    // eslint-disable-next-line global-require
    const nodemailer = require("nodemailer");
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch (error) {
    logger.warn("mail.nodemailer_missing", {
      message: error.message,
    });
    transporter = null;
  }

  return transporter;
};

const getResendClient = () => {
  if (resendInitAttempted) {
    return resendClient;
  }

  resendInitAttempted = true;

  if (!isResendConfigured()) {
    logger.warn("mail.resend_not_configured", {
      environment: process.env.NODE_ENV || "development",
    });
    return null;
  }

  try {
    // Optional dependency in case provider is not set to resend.
    // eslint-disable-next-line global-require
    const { Resend } = require("resend");
    resendClient = new Resend(process.env.RESEND_API_KEY);
  } catch (error) {
    logger.warn("mail.resend_package_missing", {
      message: error.message,
    });
    resendClient = null;
  }

  return resendClient;
};

const missingEmailConfigKeys = () =>
  (getEmailProvider() === "resend"
    ? ["EMAIL_PROVIDER", "RESEND_API_KEY", "EMAIL_FROM"]
    : ["EMAIL_FROM", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"]
  ).filter((key) => !process.env[key]);

const logEmailProviderStatus = () => {
  const provider = getEmailProvider();
  const missing = missingEmailConfigKeys();
  if (!missing.length) {
    logger.info("mail.provider_configured", {
      provider,
      from: process.env.EMAIL_FROM,
    });
    return;
  }

  if (isDevelopment) {
    logger.warn("mail.provider_not_configured_dev_fallback", {
      missing,
      message:
        "Email provider not configured. Verification codes will be logged in development.",
    });
    return;
  }

  logger.error("mail.provider_not_configured_production", {
    missing,
    message:
      "Email provider is not configured in production. Verification delivery will fail.",
  });
};

const sendVerificationEmail = async ({ email, code, expiresInMinutes = 15 }) => {
  const provider = getEmailProvider();
  const smtpTransporter = provider === "smtp" ? getTransporter() : null;
  const resend = provider === "resend" ? getResendClient() : null;
  const runtimeProvider =
    provider === "resend"
      ? resend
        ? "resend"
        : "dev-fallback"
      : smtpTransporter
        ? "smtp"
        : "dev-fallback";

  logger.info("mail.verification_send_attempt", {
    email,
    provider: runtimeProvider,
  });

  const subject = "Verify your TaskForce email";
  const text = `Your TaskForce verification code is ${code}. It expires in ${expiresInMinutes} minutes.`;
  const html = `
    <div style="font-family: 'DM Sans', Arial, sans-serif; color: #1f1f1f;">
      <h2 style="margin: 0 0 12px;">Verify your TaskForce email</h2>
      <p style="margin: 0 0 12px;">Use the code below to verify your email address:</p>
      <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700; margin: 0 0 12px;">${code}</p>
      <p style="margin: 0;">This code expires in ${expiresInMinutes} minutes.</p>
    </div>
  `.trim();

  if (
    (provider === "resend" && !resend) ||
    (provider === "smtp" && !smtpTransporter)
  ) {
    if (isDevelopment) {
      logger.info("mail.dev_verification_code", {
        email,
        code,
      });
      return {
        delivered: false,
        reason: "mail_not_configured",
        mode: "dev_console",
        message:
          "Email not configured. Verification code logged in server console.",
      };
    }

    throw new Error("Email delivery is not configured.");
  }

  try {
    if (provider === "resend") {
      const response = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: email,
        subject,
        text,
        html,
      });

      if (response?.error) {
        throw new Error(response.error.message || "Resend delivery failed.");
      }
    } else {
      await smtpTransporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject,
        text,
        html,
      });
    }
  } catch (error) {
    logger.error("mail.verification_send_failed", {
      email,
      provider,
      message: error.message,
    });

    if (isDevelopment) {
      logger.info("mail.dev_verification_code", {
        email,
        code,
      });
      return {
        delivered: false,
        reason: "provider_send_failed",
        mode: "dev_console",
        message:
          "Email delivery failed locally. Verification code logged in server console.",
      };
    }

    throw error;
  }

  logger.info("mail.verification_sent", {
    email,
    provider,
  });

  return {
    delivered: true,
    mode: "provider",
    provider,
  };
};

module.exports = {
  logEmailProviderStatus,
  sendVerificationEmail,
};
