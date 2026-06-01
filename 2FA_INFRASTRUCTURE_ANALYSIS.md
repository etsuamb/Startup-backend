# 2FA Infrastructure Analysis - Startup Backend

**Date:** June 1, 2026  
**Project:** Startup-backend  
**Status:** Comprehensive 2FA system is ALREADY IMPLEMENTED

---

## 1. DATABASE SCHEMA - 2FA Tables & Columns

### Users Table (users)
Located in: [backend/001_init.sql](backend/001_init.sql#L20)

**2FA-related columns:**
```sql
two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE
```

### Auth Security Table (005_auth_security.sql)
Located in: [backend/005_auth_security.sql](backend/005_auth_security.sql)

**Additional 2FA columns:**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_type VARCHAR(20) NOT NULL DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(20);      -- Stores 'email' or 'totp'
ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_secret TEXT;                   -- Base32 encoded TOTP secret
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_backup_hashes JSONB;   -- Array of hashed backup codes
```

### Auth Email Tokens Table
```sql
CREATE TABLE IF NOT EXISTS auth_email_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    purpose VARCHAR(40) NOT NULL,  -- Can be: 'login_otp', 'enable_2fa', 'email_verify', 'password_reset'
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_email_tokens_lookup
    ON auth_email_tokens (token_hash, purpose)
    WHERE used_at IS NULL;
```

### Auth Pending Logins Table
```sql
CREATE TABLE IF NOT EXISTS auth_pending_logins (
    pending_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    ip_address VARCHAR(45),
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_pending_logins_lookup
    ON auth_pending_logins (token_hash)
    WHERE consumed_at IS NULL;
```

---

## 2. EXISTING 2FA CODE IMPLEMENTATION

### Main Controllers
- **[authSecurityController.js](backend/controllers/authSecurityController.js)** - Primary 2FA controller with all 2FA endpoints
- **[authController.js](backend/controllers/authController.js)** - Login flow that integrates 2FA

### Services
- **[authSecurityService.js](backend/services/authSecurityService.js)** - All 2FA business logic functions
- **[utils/mail.js](backend/utils/mail.js)** - Email sending infrastructure (Brevo, Resend, SMTP)

### Routes
- **[routes/authRoutes.js](backend/routes/authRoutes.js)** - All 2FA API endpoints

---

## 3. 2FA ENDPOINTS IMPLEMENTED

### In [authRoutes.js](backend/routes/authRoutes.js):

```javascript
// POST /auth/login/verify-2fa
// Verify 2FA code (TOTP or email OTP or backup code) after login
// Request: { pendingToken, code, backupCode }
router.post("/login/verify-2fa", authRateLimit({ scope: "verify-2fa", max: 15 }), authSecurityController.verifyLogin2FA);

// GET /auth/2fa/status
// Get current 2FA status for authenticated user
// Response: { enabled: boolean, method: 'email'|'totp'|null }
router.get("/2fa/status", authenticate, requireApproval, authSecurityController.get2FAStatus);

// GET /auth/2fa/setup
// Generate TOTP secret and QR code (requires speakeasy library)
// Response: { method: 'totp', secret: base32_string, otpauthUrl: qr_code_url }
router.get("/2fa/setup", authenticate, requireApproval, authSecurityController.setup2FA);

// POST /auth/2fa/send-enable-otp
// Send OTP email for email 2FA setup
// Response: { message: "Verification code sent to your email" }
router.post("/2fa/send-enable-otp", authenticate, requireApproval, authSecurityController.sendEnable2FAOtp);

// POST /auth/2fa/enable
// Enable 2FA (after verification code confirmed)
// Request: { method: 'email'|'totp', code }
// Response: { message: "Two-factor authentication enabled", backupCodes: [...] }
router.post("/2fa/enable", authenticate, requireApproval, authSecurityController.enable2FA);

// POST /auth/2fa/disable
// Disable 2FA (requires password or 2FA code)
// Request: { password?, code? }
router.post("/2fa/disable", authenticate, requireApproval, authSecurityController.disable2FA);
```

---

## 4. LOGIN FLOW WITH 2FA

### Current Implementation in [authSecurityController.js](backend/controllers/authSecurityController.js) & [authController.js](backend/controllers/authController.js)

```
1. User POSTs /auth/login { email, password }
   ↓
2. authController.login validates credentials
   ↓
3. If user.two_factor_enabled:
   - Create pending login token
   - Return: { 
       message: "2FA required",
       needsTwoFactor: true, 
       pendingToken: "..."
     }
   - Client stores pendingToken
   ↓
4. User receives 2FA prompt (client-side)
   ↓
5a. If 2FA method is TOTP:
   - User enters 6-digit code from authenticator app
   - User POSTs /auth/login/verify-2fa { pendingToken, code }
   - verifyLogin2FA uses speakeasy.totp.verify() to validate
   
5b. If 2FA method is EMAIL:
   - authSecurityService.sendEmailLoginOtp() sends 6-digit code to email
   - User receives email with code
   - User POSTs /auth/login/verify-2fa { pendingToken, code }
   - Code verified against auth_email_tokens table
   
5c. If user has BACKUP CODE:
   - User POSTs /auth/login/verify-2fa { pendingToken, backupCode }
   - verifyBackupCode() checks against two_factor_backup_hashes
   - Backup code is removed after use (one-time use)
   ↓
6. If verified successfully:
   - finishLoginOr2FA() creates JWT token + refresh token
   - Returns: { token, refreshToken, user }
   ↓
7. User logged in with full access
```

### Key Function: verifyLogin2FA (lines 452-505)
```javascript
exports.verifyLogin2FA = async (req, res) => {
    const { pendingToken, code, backupCode } = req.body;
    
    // Get pending login session
    const pending = await authSecurity.consumePendingLogin(pendingToken);
    const user = await loadUserById(pending.user_id);
    
    let verified = false;
    
    if (backupCode) {
        verified = await authSecurity.verifyBackupCode(user.user_id, String(backupCode).trim().toUpperCase());
    } else if (code) {
        if (user.two_factor_method === "totp" && user.otp_secret && speakeasy) {
            // TOTP verification using speakeasy library
            verified = speakeasy.totp.verify({
                secret: user.otp_secret,
                encoding: "base32",
                token: String(code).replace(/\s/g, ""),
                window: 1,
            });
        } else if (user.two_factor_method === "email") {
            // Email OTP verification
            const otpR = await pool.query(
                `SELECT token_hash FROM auth_email_tokens
                 WHERE user_id = $1 AND purpose = 'login_otp' AND used_at IS NULL AND expires_at > NOW()
                 ORDER BY created_at DESC LIMIT 1`,
                [user.user_id]
            );
            if (otpR.rowCount) {
                verified = await bcrypt.compare(String(code), otpR.rows[0].token_hash);
                // Mark token as used
            }
        }
    }
    
    if (verified) {
        return finishLoginOr2FA(req, res, user, user.email, ip, userAgent);
    }
};
```

---

## 5. 2FA SETUP FLOW

### Setup TOTP (lines 511-538)
```
1. GET /auth/2fa/setup (authenticated)
   ↓
2. setup2FA generates new TOTP secret using speakeasy
   - Stores base32-encoded secret in users.otp_secret
   ↓
3. Returns:
   {
     method: "totp",
     secret: "JBSWY3DPEBLW64TMMQ======",  // For manual entry
     otpauthUrl: "otpauth://totp/StartupConnect(user@email.com)..."  // QR code URL
   }
   ↓
4. Client displays QR code or allows manual secret entry
   ↓
5. User scans with authenticator app (Google Authenticator, Authy, etc.)
```

### Enable Email 2FA (lines 540-590)
```
1. To use email 2FA:
   a. POST /auth/2fa/send-enable-otp (authenticated)
      - Generates random 6-digit code
      - Hashes code with bcrypt
      - Stores in auth_email_tokens with purpose='enable_2fa'
      - Sends email with code
   
   b. User receives email and enters code
   
   c. POST /auth/2fa/enable { method: 'email', code }
      - Verifies code against stored hash
      - Sets two_factor_method = 'email'
      - Generates 8 backup codes
      - Hashes all backup codes
      - Stores in two_factor_backup_hashes JSONB array
      - Returns backup codes to user (one-time display)

2. For TOTP:
   a. GET /auth/2fa/setup - already called
   
   b. User enters 6-digit from authenticator app
   
   c. POST /auth/2fa/enable { method: 'totp', code }
      - Verifies code with speakeasy
      - Sets two_factor_method = 'totp'
      - Generates 8 backup codes
      - Returns backup codes to user
```

### Disable 2FA (lines 608-640)
```
1. POST /auth/2fa/disable { password?, code? }
   ↓
2. Requires either:
   - password (if user has password_hash), OR
   - 2FA code (from authenticator or email OTP)
   ↓
3. If verified:
   - Sets two_factor_enabled = false
   - Clears two_factor_method, otp_secret, two_factor_backup_hashes
```

---

## 6. EMAIL/OTP SENDING INFRASTRUCTURE

### Email Service: [utils/mail.js](backend/utils/mail.js)

**Supported Email Providers:**
1. **Brevo HTTP API** (Primary on Render)
   - Uses `BREVO_HTTP_API_KEY` (xkeysib-...)
   - Most reliable for serverless environments
   
2. **Brevo SMTP** (Fallback)
   - Uses `BREVO_SMTP_USER` + `BREVO_SMTP_KEY`
   
3. **Resend API** (Alternative)
   - Uses `RESEND_API_KEY`
   - Good for testing/sandboxed environments
   
4. **Generic SMTP** (Fallback)
   - Uses `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

**Current .env Configuration:**
```env
BREVO_SMTP_USER=ad1645001@smtp-brevo.com
BREVO_HTTP_API_KEY=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
BREVO_SMTP_KEY=xsmtpsib-497ed78795b776cb7de27c9338771db400c75a9e013b83785b53425b7dd1e402-r55FR9d15bRybBJY
BREVO_FROM_EMAIL=etsubgirma0312@gmail.com
BREVO_FROM_NAME=StartupConnect
FROM_EMAIL=blienmoges9@gmail.com
```

### OTP Email Functions in [authSecurityService.js](backend/services/authSecurityService.js)

```javascript
// Send login OTP email
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

// Send enable 2FA OTP
async function sendEnable2FAOtp(req, res) {
    const user = await loadUserById(req.user.user_id);
    const code = String(require("crypto").randomInt(100000, 999999));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + authSecurity.OTP_EMAIL_MINUTES * 60 * 1000);
    await pool.query(
        `INSERT INTO auth_email_tokens (user_id, purpose, token_hash, expires_at) VALUES ($1,'enable_2fa',$2,$3)`,
        [user.user_id, codeHash, expiresAt],
    );
    await authSecurity.sendLoginOtpEmail(user, code);
}
```

### Email Configuration Constants
From [authSecurityService.js](backend/services/authSecurityService.js):
```javascript
const EMAIL_VERIFY_HOURS = Number(process.env.EMAIL_VERIFY_HOURS) || 24;           // Email verification link TTL
const RESET_PASSWORD_HOURS = Number(process.env.RESET_PASSWORD_HOURS) || 1;       // Password reset link TTL
const LOGIN_2FA_MINUTES = Number(process.env.LOGIN_2FA_MINUTES) || 10;            // Pending login session TTL
const OTP_EMAIL_MINUTES = Number(process.env.OTP_EMAIL_MINUTES) || 10;            // OTP email code TTL
const EMAIL_DNS_TIMEOUT_MS = Number(process.env.EMAIL_DNS_TIMEOUT_MS) || 6000;    // DNS validation timeout
const REGISTRATION_EMAIL_VERIFY_MINUTES = 1;                                       // Registration email TTL (1 min)
```

---

## 7. BACKUP CODES IMPLEMENTATION

### Generation & Storage
From [authSecurityService.js](backend/services/authSecurityService.js):

```javascript
function generateBackupCodes(count = 8) {
    const codes = [];
    for (let i = 0; i < count; i++) {
        // Generate 8 random backup codes, each 8 hex characters (e.g., "A1B2C3D4")
        codes.push(crypto.randomBytes(4).toString("hex").toUpperCase());
    }
    return codes;
}

async function hashBackupCodes(codes) {
    const hashes = [];
    for (const code of codes) {
        // Hash each code with bcrypt for secure storage
        hashes.push(await bcrypt.hash(code, 10));
    }
    return hashes;  // Stored as JSONB array in users.two_factor_backup_hashes
}
```

### Backup Code Verification
```javascript
async function verifyBackupCode(userId, code) {
    const r = await pool.query(
        `SELECT two_factor_backup_hashes FROM users WHERE user_id = $1`,
        [userId],
    );
    if (!r.rowCount || !r.rows[0].two_factor_backup_hashes) return false;
    
    const hashes = r.rows[0].two_factor_backup_hashes;
    for (let i = 0; i < hashes.length; i++) {
        if (await bcrypt.compare(code, hashes[i])) {
            // Remove used backup code (one-time use)
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
```

---

## 8. TOTP IMPLEMENTATION

### Library Used
- **speakeasy** npm package (RFC 4226/4269 compliant TOTP)

### TOTP Setup & Verification
```javascript
// Setup generates QR code
const secret = speakeasy.generateSecret({
    name: `StartupConnect (${user.email})`,
    length: 20,  // 20 bytes = 160 bits for strong TOTP
});

// Verify code during login
const verified = speakeasy.totp.verify({
    secret: user.otp_secret,        // Base32-encoded secret from DB
    encoding: "base32",
    token: String(code).replace(/\s/g, ""),  // User's 6-digit code
    window: 1,  // Allow 30-second window tolerance (±30 seconds)
});
```

---

## 9. SECURITY CONSIDERATIONS IMPLEMENTED

✅ **Already Implemented:**
1. **Secure Storage**
   - Passwords hashed with bcrypt
   - OTP codes hashed with bcrypt
   - Backup codes hashed with bcrypt
   - TOTP secrets stored as base32
   - Email tokens hashed (SHA-256)

2. **Rate Limiting**
   - `/login` - max 20 requests
   - `/login/verify-2fa` - max 15 requests
   - `/2fa/send-enable-otp` - max 5 requests
   - Configured in [middleware/authRateLimit.js](backend/middleware/authRateLimit.js)

3. **Token Expiration**
   - Pending login: 10 minutes (configurable)
   - OTP codes: 10 minutes (configurable)
   - Email verification links: 24 hours (configurable)

4. **One-Time Use Enforcement**
   - Email tokens marked `used_at` after consumption
   - Backup codes removed from array after use
   - Pending login tokens consumed after verification

5. **IP Address Tracking**
   - Pending logins store IP address
   - Refresh tokens store IP address and location
   - Device tracking (Windows, Mac, Android, iOS)

6. **Email Validation**
   - MX record verification during signup
   - Disposable email blocking
   - Reserved domain blocking
   - DNS validation with timeout

---

## 10. WHAT'S ALREADY IMPLEMENTED VS. WHAT MIGHT BE NEEDED

### ✅ ALREADY FULLY IMPLEMENTED:
- [x] Database schema for 2FA
- [x] TOTP (Time-based One-Time Password) via authenticator apps
- [x] Email OTP delivery
- [x] Backup codes (8 per user, one-time use)
- [x] 2FA setup endpoint with QR code generation
- [x] 2FA enable/disable endpoints
- [x] Login flow integration with 2FA
- [x] Email infrastructure (Brevo, Resend, SMTP)
- [x] Rate limiting
- [x] Security monitoring & session tracking
- [x] Backup code generation and verification

### ⚠️ POTENTIAL ENHANCEMENTS (Not Currently Implemented):
- [ ] SMS-based OTP (currently only email)
- [ ] WebAuthn/FIDO2 authentication
- [ ] 2FA enforcement policies (admin can require 2FA)
- [ ] Recovery codes regeneration endpoint
- [ ] 2FA activity log/audit trail
- [ ] Device fingerprinting for suspicious logins
- [ ] Step-up authentication for sensitive operations
- [ ] Remember this device option (bypass 2FA for X days)
- [ ] QR code image generation (currently returns otpauth URL)

---

## 11. CONFIGURATION CHECKLIST

### Environment Variables Currently Set:
```env
✅ BREVO_HTTP_API_KEY=xkeysib-...       # Primary email provider
✅ BREVO_SMTP_USER & BREVO_SMTP_KEY    # Fallback email
✅ FROM_EMAIL=blienmoges9@gmail.com     # Sender address
✅ BREVO_FROM_EMAIL=etsubgirma0312@gmail.com
✅ JWT_SECRET=6e6f7ae9d1e4...          # Token signing
✅ FRONTEND_URL=https://startup-connect-ethiopia-frontend.onrender.com  # Email links
```

### Optional Environment Variables (with defaults):
```env
LOGIN_2FA_MINUTES=10           # How long pending 2FA session valid
OTP_EMAIL_MINUTES=10           # How long OTP code valid
EMAIL_VERIFY_HOURS=24          # How long email verification valid
RESET_PASSWORD_HOURS=1         # How long password reset valid
```

---

## 12. FILE LOCATION SUMMARY

| Component | File Path |
|-----------|-----------|
| Database Schema | [backend/001_init.sql](backend/001_init.sql), [backend/005_auth_security.sql](backend/005_auth_security.sql) |
| Controller | [backend/controllers/authSecurityController.js](backend/controllers/authSecurityController.js) |
| Service | [backend/services/authSecurityService.js](backend/services/authSecurityService.js) |
| Routes | [backend/routes/authRoutes.js](backend/routes/authRoutes.js) |
| Email Utility | [backend/utils/mail.js](backend/utils/mail.js) |
| Rate Limiting | [backend/middleware/authRateLimit.js](backend/middleware/authRateLimit.js) |
| Middleware | [backend/middleware/authMiddleware.js](backend/middleware/authMiddleware.js) |
| Main Controller | [backend/controllers/authController.js](backend/controllers/authController.js) |

---

## 13. KEY CONSTANTS IN CODE

**In authSecurityService.js:**
```javascript
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const FRONTEND_URL = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
const EMAIL_VERIFY_HOURS = Number(process.env.EMAIL_VERIFY_HOURS) || 24;
const RESET_PASSWORD_HOURS = Number(process.env.RESET_PASSWORD_HOURS) || 1;
const LOGIN_2FA_MINUTES = Number(process.env.LOGIN_2FA_MINUTES) || 10;
const OTP_EMAIL_MINUTES = Number(process.env.OTP_EMAIL_MINUTES) || 10;
const EMAIL_DNS_TIMEOUT_MS = Number(process.env.EMAIL_DNS_TIMEOUT_MS) || 6000;
const REGISTRATION_EMAIL_VERIFY_MINUTES = 1;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "tempmail.com", 
  "10minutemail.com", "yopmail.com", "throwaway.email",
  ... // 10+ more domains
]);
```

---

## 14. TESTING THE 2FA FLOW

### Test Endpoints:

**1. Check if 2FA is enabled:**
```bash
GET /auth/2fa/status
Headers: Authorization: Bearer <token>
```

**2. Setup TOTP:**
```bash
GET /auth/2fa/setup
Headers: Authorization: Bearer <token>
Response: { method: "totp", secret: "...", otpauthUrl: "..." }
```

**3. Enable TOTP 2FA:**
```bash
POST /auth/2fa/enable
Headers: Authorization: Bearer <token>
Body: { method: "totp", code: "123456" }
Response: { message: "Two-factor authentication enabled", backupCodes: [...] }
```

**4. Send Email OTP:**
```bash
POST /auth/2fa/send-enable-otp
Headers: Authorization: Bearer <token>
Response: { message: "Verification code sent to your email" }
```

**5. Enable Email 2FA:**
```bash
POST /auth/2fa/enable
Headers: Authorization: Bearer <token>
Body: { method: "email", code: "123456" }
Response: { message: "Two-factor authentication enabled", backupCodes: [...] }
```

**6. Login with 2FA:**
```bash
POST /auth/login
Body: { email: "user@example.com", password: "password" }
Response: { message: "2FA required", needsTwoFactor: true, pendingToken: "..." }

# Then verify 2FA:
POST /auth/login/verify-2fa
Body: { pendingToken: "...", code: "123456" }  # or backupCode: "A1B2C3D4"
Response: { token: "...", refreshToken: "...", user: {...} }
```

**7. Disable 2FA:**
```bash
POST /auth/2fa/disable
Headers: Authorization: Bearer <token>
Body: { password: "password" }  # or code: "123456"
Response: { message: "Two-factor authentication disabled" }
```

---

## Summary

The Startup-backend project has a **complete, production-ready 2FA system** with:
- ✅ TOTP support (authenticator apps)
- ✅ Email OTP support
- ✅ Backup codes
- ✅ Secure token management
- ✅ Email infrastructure with multiple providers
- ✅ Rate limiting and security monitoring
- ✅ Full database schema
- ✅ Complete API endpoints
- ✅ Integration with login flow

**No major gaps** - the infrastructure is already sophisticated and ready for use. Minor enhancements (SMS, WebAuthn, enforcement policies) could be added if needed.
