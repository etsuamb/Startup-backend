const crypto = require("crypto");
const dns = require("dns");
const { promisify } = require("util");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const mail = require("../utils/mail");
const securityMonitoringService = require("./securityMonitoringService");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
const EMAIL_VERIFY_HOURS = Number(process.env.EMAIL_VERIFY_HOURS) || 24;
const RESET_PASSWORD_HOURS = Number(process.env.RESET_PASSWORD_HOURS) || 1;
const LOGIN_2FA_MINUTES = Number(process.env.LOGIN_2FA_MINUTES) || 10;
const OTP_EMAIL_MINUTES = Number(process.env.OTP_EMAIL_MINUTES) || 10;
const EMAIL_DNS_TIMEOUT_MS = Number(process.env.EMAIL_DNS_TIMEOUT_MS) || 6000;
const REGISTRATION_EMAIL_VERIFY_MINUTES = 1;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "10minutemail.net",
  "yopmail.com",
  "throwaway.email",
  "getnada.com",
  "maildrop.cc",
  "sharklasers.com",
  "trashmail.com",
  "fakeinbox.com",
  "dispostable.com",
  "mailnesia.com",
  "tempail.com",
  "emailondeck.com",
]);

const RESERVED_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "test.org",
  "localhost",
  "invalid",
  "local",
]);

const EMAIL_REJECT_MESSAGES = {
  invalid_format: "Please enter a valid email address",
  disposable_email: "Disposable or temporary email addresses are not allowed",
  reserved_domain: "This email domain cannot be used for registration",
  no_mx_records: "Email domain could not be verified. Use a real email address",
  domain_not_found: "Email domain does not exist or cannot receive mail",
  validation_error: "Could not validate email. Please try again",
};

function hashToken(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function isValidEmailFormat(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(normalized)) return false;
  const [, domain] = normalized.split("@");
  if (!domain || domain.length > 253) return false;
  const tld = domain.split(".").pop();
  if (!tld || tld.length < 2 || !/^[a-z]{2,63}$/i.test(tld)) return false;
  return true;
}

function shouldSkipMxCheck() {
  if (process.env.NODE_ENV === "production") return false;
  return process.env.SKIP_EMAIL_MX_CHECK === "true";
}

function withTimeout(promise, ms = EMAIL_DNS_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("DNS_TIMEOUT")), ms);
    }),
  ]);
}

async function resolveMxRecords(domain) {
  try {
    return await withTimeout(dns.promises.resolveMx(domain));
  } catch {
    const resolver = new dns.Resolver();
    resolver.setServers(["8.8.8.8", "1.1.1.1"]);
    const resolveMx = promisify(resolver.resolveMx.bind(resolver));
    return await withTimeout(resolveMx(domain));
  }
}

async function domainAcceptsMail(domain) {
  const mx = await resolveMxRecords(domain);
  return Array.isArray(mx) && mx.length > 0;
}

function emailRejectMessage(reason) {
  return EMAIL_REJECT_MESSAGES[reason] || EMAIL_REJECT_MESSAGES.invalid_format;
}

async function validateEmailDeliverability(email) {
  try {
    const normalized = String(email || "").trim().toLowerCase();
    if (!isValidEmailFormat(normalized)) {
      return { ok: false, reason: "invalid_format" };
    }

    const [localPart, domain] = normalized.split("@");

    if (DISPOSABLE_DOMAINS.has(domain)) {
      return { ok: false, reason: "disposable_email" };
    }

    if (RESERVED_DOMAINS.has(domain) || domain.endsWith(".invalid") || domain.endsWith(".test")) {
      return { ok: false, reason: "reserved_domain" };
    }


    // Block obvious placeholder locals only on non-production mail domains
    if (
      /^(fake|spam|temp|asdf|xxx)$/i.test(localPart) &&
      !/(gmail|yahoo|outlook|hotmail|icloud)\./i.test(domain)
    ) {
      return { ok: false, reason: "invalid_format" };
    }

    if (shouldSkipMxCheck()) {
      return { ok: true };
    }

    const accepts = await domainAcceptsMail(domain);
    if (!accepts) {
      return { ok: false, reason: "no_mx_records" };
    }

    return { ok: true };
  } catch (err) {
    if (shouldSkipMxCheck()) {
      return { ok: true };
    }
    return { ok: false, reason: "domain_not_found" };
  }
}

async function createEmailToken(userId, purpose, ttlHours) {
  const raw = generateToken(24);
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  await pool.query(
    `INSERT INTO auth_email_tokens (user_id, purpose, token_hash, expires_at) VALUES ($1,$2,$3,$4)`,
    [userId, purpose, tokenHash, expiresAt],
  );
  return { raw, expiresAt };
}

async function consumeEmailToken(rawToken, purpose) {
  const tokenHash = hashToken(rawToken);
  const r = await pool.query(
    `UPDATE auth_email_tokens
     SET used_at = CURRENT_TIMESTAMP
     WHERE token_hash = $1 AND purpose = $2 AND used_at IS NULL AND expires_at > NOW()
     RETURNING user_id, token_id`,
    [tokenHash, purpose],
  );
  return r.rows[0] || null;
}

function buildEmailHtml(title, bodyHtml, ctaHref, ctaLabel) {
  const button = ctaHref
    ? `<p style="margin:24px 0"><a href="${ctaHref}" style="display:inline-block;padding:12px 24px;background:#0f3d32;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">${ctaLabel}</a></p>`
    : "";
  const fallbackLink = ctaHref
    ? `<p style="font-size:14px;color:#6b7280;margin-top:12px;word-break:break-word">If the button does not appear, copy and paste this URL into your browser:<br/><a href="${ctaHref}" style="color:#0f5c4a;word-break:break-word">${ctaHref}</a></p>`
    : "";
  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px">
      <div style="background:#0f3d32;color:#fff;padding:20px;border-radius:12px 12px 0 0">
        <h1 style="margin:0;font-size:20px">${title}</h1>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 12px 12px">
        ${bodyHtml}
        ${button}
        ${fallbackLink}
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">StartupConnect Ethiopia</p>
      </div>
    </div>`;
}

function assertMailDelivered(result) {
  if (!result?.delivered) {
    throw new Error(result?.error || "Email could not be delivered");
  }
}

async function sendVerificationEmail(user) {
  const { raw } = await createEmailToken(user.user_id, "email_verify", EMAIL_VERIFY_HOURS);
  const link = `${FRONTEND_URL}/verify-email?token=${encodeURIComponent(raw)}`;
  const html = buildEmailHtml(
    "Verify your email",
    `<p>Hello ${user.first_name || "there"},</p><p>Please verify your email to continue using StartupConnect.</p>`,
    link,
    "Verify email",
  );
  const result = await mail.sendMail(
    user.email,
    "Verify your StartupConnect email",
    `Verify your email: ${link}`,
    html,
  );
  assertMailDelivered(result);
  return link;
}

async function sendRegistrationVerificationEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const verificationId = generateToken(18);
  const raw = generateToken(24);
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + REGISTRATION_EMAIL_VERIFY_MINUTES * 60 * 1000);

  await pool.query(
    `UPDATE auth_registration_email_verifications
        SET consumed_at = CURRENT_TIMESTAMP
      WHERE email = $1 AND consumed_at IS NULL`,
    [normalizedEmail],
  );
  await pool.query(
    `INSERT INTO auth_registration_email_verifications
      (verification_id, email, token_hash, expires_at)
     VALUES ($1,$2,$3,$4)`,
    [verificationId, normalizedEmail, tokenHash, expiresAt],
  );

  const link = `${FRONTEND_URL}/verify-email?mode=registration&token=${encodeURIComponent(raw)}`;
  const html = buildEmailHtml(
    "Verify your registration email",
    `<p>Please verify ${normalizedEmail} within one minute to continue creating your StartupConnect account.</p>`,
    link,
    "Verify registration email",
  );

  try {
    const result = await mail.sendMail(
      normalizedEmail,
      "Verify your StartupConnect registration email",
      `Verify your registration email within one minute: ${link}`,
      html,
    );
    assertMailDelivered(result);
    return { verificationId, expiresAt };
  } catch (err) {
    await pool.query(
      `DELETE FROM auth_registration_email_verifications WHERE verification_id = $1`,
      [verificationId],
    );
    throw err;
  }
}

async function verifyRegistrationEmailToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const r = await pool.query(
    `UPDATE auth_registration_email_verifications
        SET verified_at = COALESCE(verified_at, CURRENT_TIMESTAMP)
      WHERE token_hash = $1
        AND consumed_at IS NULL
        AND expires_at > NOW()
      RETURNING verification_id, email, expires_at`,
    [tokenHash],
  );
  return r.rows[0] || null;
}

async function getRegistrationEmailVerificationStatus(verificationId, email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const r = await pool.query(
    `SELECT expires_at, verified_at, consumed_at
       FROM auth_registration_email_verifications
      WHERE verification_id = $1 AND email = $2`,
    [verificationId, normalizedEmail],
  );
  const row = r.rows[0];
  if (!row || row.consumed_at) return { status: "missing" };
  if (row.verified_at) return { status: "verified", expiresAt: row.expires_at };
  if (new Date(row.expires_at) <= new Date()) return { status: "expired" };
  return { status: "pending", expiresAt: row.expires_at };
}

async function consumeRegistrationEmailVerification(client, verificationId, email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const r = await client.query(
    `UPDATE auth_registration_email_verifications
        SET consumed_at = CURRENT_TIMESTAMP
      WHERE verification_id = $1
        AND email = $2
        AND verified_at IS NOT NULL
        AND consumed_at IS NULL
      RETURNING verification_id`,
    [verificationId, normalizedEmail],
  );
  return r.rowCount > 0;
}

async function sendPasswordResetEmail(user) {
  const { raw } = await createEmailToken(user.user_id, "password_reset", RESET_PASSWORD_HOURS);
  const link = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(raw)}`;
  const html = buildEmailHtml(
    "Reset your password",
    `<p>Hello ${user.first_name || "there"},</p><p>We received a request to reset your password. This link expires in ${RESET_PASSWORD_HOURS} hour(s).</p><p>If you did not request this password reset, you can safely ignore this email.</p>`,
    link,
    "Reset password",
  );
  const result = await mail.sendMail(
    user.email,
    "Reset your StartupConnect password",
    `Reset your password: ${link}`,
    html,
  );
  assertMailDelivered(result);
}

async function sendLoginOtpEmail(user, code) {
  const html = buildEmailHtml(
    "Login verification code",
    `<p>Your one-time login code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p><p>This code expires in ${OTP_EMAIL_MINUTES} minutes.</p>`,
    null,
    null,
  );
  const result = await mail.sendMail(
    user.email,
    "Your StartupConnect login code",
    `Your login code is ${code}`,
    html,
  );
  assertMailDelivered(result);
}


async function issueAuthTokens(user, req) {
  const refreshToken = generateToken(24);
  const expiresAt = new Date(
    Date.now() + (Number(process.env.REFRESH_TOKEN_DAYS) || 30) * 24 * 60 * 60 * 1000,
  );
  const ip = securityMonitoringService.readIpAddress(req);
  const userAgent = req.headers["user-agent"] || "";
  let device = "Unknown Device";
  if (/windows/i.test(userAgent)) device = "Windows PC";
  else if (/macintosh/i.test(userAgent)) device = "Mac PC";
  else if (/android/i.test(userAgent)) device = "Android Device";
  else if (/iphone|ipad/i.test(userAgent)) device = "iOS Device";

  let location = "Addis Ababa, Ethiopia";
  if (ip === "127.0.0.1" || ip === "::1" || (ip && ip.startsWith("192.168."))) {
    location = "Local Network";
  }

  await pool.query(
    `INSERT INTO refresh_tokens (token, user_id, expires_at, revoked, device, ip_address, location)
     VALUES ($1,$2,$3,false,$4,$5,$6)`,
    [refreshToken, user.user_id, expiresAt, device, ip, location],
  );

  await pool.query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = $1`, [
    user.user_id,
  ]);

  const token = jwt.sign(
    { user_id: user.user_id, role: user.role },
    JWT_SECRET,
    { expiresIn: "1d" },
  );

  return { token, refreshToken };
}

async function createPendingLogin(userId, req) {
  const raw = generateToken(16);
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + LOGIN_2FA_MINUTES * 60 * 1000);
  const ip = securityMonitoringService.readIpAddress(req);
  await pool.query(
    `INSERT INTO auth_pending_logins (user_id, token_hash, expires_at, ip_address) VALUES ($1,$2,$3,$4)`,
    [userId, tokenHash, expiresAt, ip],
  );
  return raw;
}

async function consumePendingLogin(rawToken) {
  const tokenHash = hashToken(rawToken);
  const r = await pool.query(
    `UPDATE auth_pending_logins
     SET consumed_at = CURRENT_TIMESTAMP
     WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()
     RETURNING pending_id, user_id`,
    [tokenHash],
  );
  return r.rows[0] || null;
}

async function getPendingLogin(rawToken) {
  const tokenHash = hashToken(rawToken);
  const r = await pool.query(
    `SELECT pending_id, user_id
     FROM auth_pending_logins
     WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > NOW()`,
    [tokenHash],
  );
  return r.rows[0] || null;
}

async function sendEmailLoginOtp(userId) {
  const userR = await pool.query(
    `SELECT user_id, email, first_name FROM users WHERE user_id = $1`,
    [userId],
  );
  if (!userR.rowCount) return;
  const user = userR.rows[0];
  const code = String(crypto.randomInt(100000, 999999));
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_EMAIL_MINUTES * 60 * 1000);
  await pool.query(
    `INSERT INTO auth_email_tokens (user_id, purpose, token_hash, expires_at)
     VALUES ($1, 'login_otp', $2, $3)`,
    [userId, codeHash, expiresAt],
  );
  await sendLoginOtpEmail(user, code);
}

function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return codes;
}

async function hashBackupCodes(codes) {
  const hashes = [];
  for (const code of codes) {
    hashes.push(await bcrypt.hash(code, 10));
  }
  return hashes;
}

async function verifyBackupCode(userId, code) {
  const r = await pool.query(
    `SELECT two_factor_backup_hashes FROM users WHERE user_id = $1`,
    [userId],
  );
  if (!r.rowCount || !r.rows[0].two_factor_backup_hashes) return false;
  const hashes = r.rows[0].two_factor_backup_hashes;
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(code, hashes[i])) {
      hashes.splice(i, 1);
      await pool.query(`UPDATE users SET two_factor_backup_hashes = $1 WHERE user_id = $2`, [
        JSON.stringify(hashes),
        userId,
      ]);
      return true;
    }
  }
  return false;
}

module.exports = {
  hashToken,
  generateToken,
  isValidEmailFormat,
  validateEmailDeliverability,
  emailRejectMessage,
  createEmailToken,
  consumeEmailToken,
  sendVerificationEmail,
  sendRegistrationVerificationEmail,
  verifyRegistrationEmailToken,
  getRegistrationEmailVerificationStatus,
  consumeRegistrationEmailVerification,
  sendPasswordResetEmail,
  sendLoginOtpEmail,
  issueAuthTokens,
  createPendingLogin,
  getPendingLogin,
  consumePendingLogin,
  sendEmailLoginOtp,
  generateBackupCodes,
  hashBackupCodes,
  verifyBackupCode,
  FRONTEND_URL,
  OTP_EMAIL_MINUTES,
};
