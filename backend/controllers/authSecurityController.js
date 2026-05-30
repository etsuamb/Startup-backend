const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const authSecurity = require("../services/authSecurityService");
const securityMonitoringService = require("../services/securityMonitoringService");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

let speakeasy;
try {
	speakeasy = require("speakeasy");
} catch {
	speakeasy = null;
}

const hasStrongPassword = (password) =>
	typeof password === "string" && /(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{8,}/.test(password);

async function loadUserById(userId) {
	const r = await pool.query(`SELECT * FROM users WHERE user_id = $1`, [userId]);
	return r.rows[0] || null;
}

function publicUser(user) {
	return {
		user_id: user.user_id,
		email: user.email,
		role: user.role,
		first_name: user.first_name,
		last_name: user.last_name,
		is_approved: user.is_approved,
		email_verified: user.email_verified,
		two_factor_enabled: user.two_factor_enabled,
		provider_type: user.provider_type,
	};
}

async function hasRoleProfile(user) {
	if (!user?.user_id) return false;
	if (user.role === "Startup") {
		const r = await pool.query("SELECT 1 FROM startups WHERE user_id = $1 LIMIT 1", [
			user.user_id,
		]);
		return r.rowCount > 0;
	}
	if (user.role === "Investor") {
		const r = await pool.query("SELECT 1 FROM investors WHERE user_id = $1 LIMIT 1", [
			user.user_id,
		]);
		return r.rowCount > 0;
	}
	if (user.role === "Mentor") {
		const r = await pool.query("SELECT 1 FROM mentors WHERE user_id = $1 LIMIT 1", [
			user.user_id,
		]);
		return r.rowCount > 0;
	}
	return true;
}

function googleProfileToken(userId) {
	return jwt.sign({ userId, purpose: "google_profile" }, JWT_SECRET, { expiresIn: "7d" });
}

async function verifyGoogleCredential(credential) {
	if (!GOOGLE_CLIENT_ID) {
		throw new Error("GOOGLE_CLIENT_ID is not configured");
	}
	const { OAuth2Client } = require("google-auth-library");
	const client = new OAuth2Client(GOOGLE_CLIENT_ID);
	const ticket = await client.verifyIdToken({
		idToken: credential,
		audience: GOOGLE_CLIENT_ID,
	});
	return ticket.getPayload();
}

// POST /auth/validate-email { email }
exports.validateEmailInput = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) {
			return res.status(400).json({ valid: false, message: "Email is required" });
		}
		const result = await authSecurity.validateEmailDeliverability(email);
		if (!result.ok) {
			return res.status(400).json({
				valid: false,
				message: authSecurity.emailRejectMessage(result.reason),
				code: result.reason,
			});
		}
		return res.json({ valid: true, message: "Email looks valid" });
	} catch (err) {
		return res.status(500).json({ valid: false, message: "Could not validate email" });
	}
};

// GET /auth/verify-email?token=
exports.verifyEmail = async (req, res) => {
	try {
		const raw = req.query.token || req.body?.token;
		if (!raw) return res.status(400).json({ message: "Verification token is required" });
		const row = await authSecurity.consumeEmailToken(raw, "email_verify");
		if (!row) {
			return res.status(400).json({ message: "Invalid or expired verification link" });
		}
		await pool.query(
			`UPDATE users SET email_verified = true, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
			[row.user_id],
		);
		return res.json({ message: "Email verified successfully. You can now sign in." });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /auth/resend-verification { email }
exports.resendVerification = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) return res.status(400).json({ message: "Email is required" });
		const r = await pool.query(`SELECT * FROM users WHERE email = $1`, [email.trim().toLowerCase()]);
		if (!r.rowCount) {
			return res.json({ message: "If that account exists, a verification email has been sent." });
		}
		const user = r.rows[0];
		if (user.email_verified) {
			return res.json({ message: "Email is already verified." });
		}
		if (user.provider_type === "google") {
			return res.json({ message: "Google accounts are already email-verified." });
		}
		await authSecurity.sendVerificationEmail(user);
		return res.json({ message: "If that account exists, a verification email has been sent." });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /auth/me
exports.getCurrentAccount = async (req, res) => {
	try {
		const r = await pool.query(
			`SELECT user_id, first_name, last_name, email, phone_number, role,
			        is_active, is_approved, email_verified, provider_type
			   FROM users
			  WHERE user_id = $1`,
			[req.user.user_id],
		);
		if (!r.rowCount) return res.status(404).json({ message: "User not found" });
		return res.json({ user: r.rows[0] });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// PUT /auth/me { first_name, last_name, phone_number, email }
exports.updateCurrentAccount = async (req, res) => {
	try {
		const userId = req.user.user_id;
		const currentR = await pool.query(`SELECT * FROM users WHERE user_id = $1`, [userId]);
		if (!currentR.rowCount) return res.status(404).json({ message: "User not found" });

		const current = currentR.rows[0];
		if (!current.is_active) return res.status(403).json({ message: "Account disabled" });

		const firstName = String(req.body.first_name ?? current.first_name ?? "").trim();
		const lastName = String(req.body.last_name ?? current.last_name ?? "").trim();
		const phoneNumberRaw = req.body.phone_number;
		const phoneNumber =
			phoneNumberRaw === undefined
				? current.phone_number
				: String(phoneNumberRaw || "").trim() || null;
		const emailRaw = req.body.email;
		const email =
			emailRaw === undefined
				? current.email
				: String(emailRaw || "").trim().toLowerCase();

		if (!firstName || !lastName) {
			return res.status(400).json({ message: "First name and last name are required" });
		}
		if (!email) return res.status(400).json({ message: "Email is required" });
		if (current.provider_type === "google" && email !== current.email) {
			return res.status(400).json({ message: "Google account email cannot be changed here." });
		}

		const emailChanged = email !== current.email;
		if (emailChanged) {
			const validation = await authSecurity.validateEmailDeliverability(email);
			if (!validation.ok) {
				return res.status(400).json({
					message: authSecurity.emailRejectMessage(validation.reason),
					code: validation.reason,
				});
			}
			const emailTaken = await pool.query(
				`SELECT user_id FROM users WHERE email = $1 AND user_id <> $2`,
				[email, userId],
			);
			if (emailTaken.rowCount) {
				return res.status(409).json({ message: "An account with this email already exists" });
			}
		}

		if (phoneNumber) {
			const phoneTaken = await pool.query(
				`SELECT user_id FROM users WHERE phone_number = $1 AND user_id <> $2`,
				[phoneNumber, userId],
			);
			if (phoneTaken.rowCount) {
				return res.status(409).json({ message: "This phone number is already registered" });
			}
		}

		const updatedR = await pool.query(
			`UPDATE users
			    SET first_name = $1,
			        last_name = $2,
			        phone_number = $3,
			        email = $4,
			        email_verified = CASE WHEN $5 THEN false ELSE email_verified END,
			        updated_at = CURRENT_TIMESTAMP
			  WHERE user_id = $6
			  RETURNING user_id, first_name, last_name, email, phone_number, role,
			            is_active, is_approved, email_verified, provider_type`,
			[firstName, lastName, phoneNumber, email, emailChanged, userId],
		);
		const user = updatedR.rows[0];

		if (emailChanged) {
			await pool.query(
				`UPDATE auth_email_tokens
				    SET used_at = CURRENT_TIMESTAMP
				  WHERE user_id = $1 AND purpose = 'email_verify' AND used_at IS NULL`,
				[userId],
			);
			await authSecurity.sendVerificationEmail(user);
		}

		return res.json({
			message: emailChanged
				? "Email updated. Check your new inbox for the verification link."
				: "Account information updated.",
			user,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /auth/forgot-password { email }
exports.forgotPassword = async (req, res) => {
	try {
		const { email } = req.body;
		if (!email) return res.status(400).json({ message: "Email is required" });
		const r = await pool.query(`SELECT * FROM users WHERE email = $1`, [email.trim().toLowerCase()]);
		if (!r.rowCount) {
			return res.json({
				message: "If an account exists for that email, password reset instructions have been sent.",
			});
		}
		const user = r.rows[0];
		if (!user.password_hash) {
			return res.json({
				message: "If an account exists for that email, password reset instructions have been sent.",
			});
		}
		await authSecurity.sendPasswordResetEmail(user);
		return res.json({
			message: "If an account exists for that email, password reset instructions have been sent.",
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /auth/reset-password { token, newPassword, confirmPassword }
exports.resetPassword = async (req, res) => {
	try {
		const { token, newPassword, confirmPassword } = req.body;
		if (!token || !newPassword) {
			return res.status(400).json({ message: "Token and new password are required" });
		}
		if (newPassword !== confirmPassword) {
			return res.status(400).json({ message: "Passwords do not match" });
		}
		if (!hasStrongPassword(newPassword)) {
			return res.status(400).json({
				message:
					"Password must be at least 8 characters and include 1 capital letter, 1 special character, and 1 number",
			});
		}
		const row = await authSecurity.consumeEmailToken(token, "password_reset");
		if (!row) {
			return res.status(400).json({ message: "Invalid or expired reset link" });
		}
		const hashed = await bcrypt.hash(newPassword, 10);
		await pool.query(
			`UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
			[hashed, row.user_id],
		);
		await pool.query(`UPDATE refresh_tokens SET revoked = true WHERE user_id = $1`, [row.user_id]);
		return res.json({ message: "Password reset successfully. Please sign in with your new password." });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /auth/login/verify-2fa { pendingToken, code, backupCode }
exports.verifyLogin2FA = async (req, res) => {
	try {
		const { pendingToken, code, backupCode } = req.body;
		if (!pendingToken) return res.status(400).json({ message: "pendingToken is required" });

		const pending = await authSecurity.consumePendingLogin(pendingToken);
		if (!pending) {
			return res.status(401).json({ message: "Invalid or expired login session" });
		}

		const user = await loadUserById(pending.user_id);
		if (!user || !user.is_active) {
			return res.status(403).json({ message: "Account disabled" });
		}

		let verified = false;
		if (backupCode) {
			verified = await authSecurity.verifyBackupCode(user.user_id, String(backupCode).trim().toUpperCase());
		} else if (code) {
			if (user.two_factor_method === "totp" && user.otp_secret && speakeasy) {
				verified = speakeasy.totp.verify({
					secret: user.otp_secret,
					encoding: "base32",
					token: String(code).replace(/\s/g, ""),
					window: 1,
				});
			} else if (user.two_factor_method === "email") {
				const otpR = await pool.query(
					`SELECT token_hash FROM auth_email_tokens
           WHERE user_id = $1 AND purpose = 'login_otp' AND used_at IS NULL AND expires_at > NOW()
           ORDER BY created_at DESC LIMIT 1`,
					[user.user_id],
				);
				if (otpR.rowCount) {
					verified = await bcrypt.compare(String(code), otpR.rows[0].token_hash);
					if (verified) {
						await pool.query(
							`UPDATE auth_email_tokens SET used_at = CURRENT_TIMESTAMP
               WHERE user_id = $1 AND purpose = 'login_otp' AND used_at IS NULL`,
							[user.user_id],
						);
					}
				}
			}
		}

		if (!verified) {
			return res.status(401).json({ message: "Invalid verification code" });
		}

		const tokens = await authSecurity.issueAuthTokens(user, req);
		return res.json({
			message: "Login successful",
			...tokens,
			user: publicUser(user),
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /auth/2fa/setup (authenticated)
exports.setup2FA = async (req, res) => {
	try {
		if (!speakeasy) {
			return res.status(503).json({ message: "Authenticator setup is not available on this server" });
		}
		const user = await loadUserById(req.user.user_id);
		if (!user) return res.status(404).json({ message: "User not found" });

		const secret = speakeasy.generateSecret({
			name: `StartupConnect (${user.email})`,
			length: 20,
		});

		await pool.query(`UPDATE users SET otp_secret = $1 WHERE user_id = $2`, [
			secret.base32,
			user.user_id,
		]);

		return res.json({
			method: "totp",
			secret: secret.base32,
			otpauthUrl: secret.otpauth_url,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /auth/2fa/enable { method: 'email'|'totp', code }
exports.enable2FA = async (req, res) => {
	try {
		const { method, code } = req.body;
		if (!["email", "totp"].includes(method)) {
			return res.status(400).json({ message: "method must be email or totp" });
		}
		const user = await loadUserById(req.user.user_id);
		if (!user) return res.status(404).json({ message: "User not found" });

		if (method === "totp") {
			if (!speakeasy || !user.otp_secret) {
				return res.status(400).json({ message: "Run 2FA setup first" });
			}
			const ok = speakeasy.totp.verify({
				secret: user.otp_secret,
				encoding: "base32",
				token: String(code || "").replace(/\s/g, ""),
				window: 1,
			});
			if (!ok) return res.status(400).json({ message: "Invalid authenticator code" });
		} else {
			// email method: send OTP and require code on enable — client should call send-email-otp first
			const otpR = await pool.query(
				`SELECT token_hash FROM auth_email_tokens
         WHERE user_id = $1 AND purpose = 'enable_2fa' AND used_at IS NULL AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
				[user.user_id],
			);
			if (!otpR.rowCount || !(await bcrypt.compare(String(code), otpR.rows[0].token_hash))) {
				return res.status(400).json({ message: "Invalid email verification code" });
			}
			await pool.query(
				`UPDATE auth_email_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND purpose = 'enable_2fa' AND used_at IS NULL`,
				[user.user_id],
			);
		}

		const backupCodes = authSecurity.generateBackupCodes();
		const backupHashes = await authSecurity.hashBackupCodes(backupCodes);

		await pool.query(
			`UPDATE users SET two_factor_enabled = true, two_factor_method = $1,
       two_factor_backup_hashes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3`,
			[method, JSON.stringify(backupHashes), user.user_id],
		);

		return res.json({
			message: "Two-factor authentication enabled",
			backupCodes,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /auth/2fa/send-enable-otp (authenticated) — for email 2FA setup
exports.sendEnable2FAOtp = async (req, res) => {
	try {
		const user = await loadUserById(req.user.user_id);
		if (!user) return res.status(404).json({ message: "User not found" });
		const code = String(require("crypto").randomInt(100000, 999999));
		const codeHash = await bcrypt.hash(code, 10);
		const expiresAt = new Date(Date.now() + authSecurity.OTP_EMAIL_MINUTES * 60 * 1000);
		await pool.query(
			`INSERT INTO auth_email_tokens (user_id, purpose, token_hash, expires_at) VALUES ($1,'enable_2fa',$2,$3)`,
			[user.user_id, codeHash, expiresAt],
		);
		await authSecurity.sendLoginOtpEmail(user, code);
		return res.json({ message: "Verification code sent to your email" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /auth/2fa/disable { password, code }
exports.disable2FA = async (req, res) => {
	try {
		const { password, code } = req.body;
		const user = await loadUserById(req.user.user_id);
		if (!user) return res.status(404).json({ message: "User not found" });
		if (!user.two_factor_enabled) {
			return res.json({ message: "Two-factor authentication is already disabled" });
		}
		if (user.password_hash && password) {
			const ok = await bcrypt.compare(password, user.password_hash);
			if (!ok) return res.status(401).json({ message: "Incorrect password" });
		}
		let verified = false;
		if (user.two_factor_method === "totp" && user.otp_secret && speakeasy && code) {
			verified = speakeasy.totp.verify({
				secret: user.otp_secret,
				encoding: "base32",
				token: String(code).replace(/\s/g, ""),
				window: 1,
			});
		}
		if (!verified && code) {
			const otpR = await pool.query(
				`SELECT token_hash FROM auth_email_tokens
         WHERE user_id = $1 AND purpose = 'login_otp' AND used_at IS NULL AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
				[user.user_id],
			);
			if (otpR.rowCount) {
				verified = await bcrypt.compare(String(code), otpR.rows[0].token_hash);
			}
		}
		if (!verified && !password) {
			return res.status(400).json({ message: "Password or 2FA code required to disable" });
		}

		await pool.query(
			`UPDATE users SET two_factor_enabled = false, two_factor_method = NULL,
       otp_secret = NULL, two_factor_backup_hashes = NULL WHERE user_id = $1`,
			[user.user_id],
		);
		return res.json({ message: "Two-factor authentication disabled" });
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// GET /auth/2fa/status
exports.get2FAStatus = async (req, res) => {
	try {
		const user = await loadUserById(req.user.user_id);
		if (!user) return res.status(404).json({ message: "User not found" });
		return res.json({
			enabled: !!user.two_factor_enabled,
			method: user.two_factor_method || null,
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

// POST /auth/google { credential, role? }
exports.googleAuth = async (req, res) => {
	try {
		const { credential, role } = req.body;
		if (!credential) return res.status(400).json({ message: "Google credential is required" });

		const payload = await verifyGoogleCredential(credential);
		const googleId = payload.sub;
		const email = (payload.email || "").toLowerCase();
		const firstName = payload.given_name || payload.name?.split(" ")[0] || "User";
		const lastName = payload.family_name || payload.name?.split(" ").slice(1).join(" ") || "";

		if (!email) {
			return res.status(400).json({ message: "Google account must have an email" });
		}

		const ip = securityMonitoringService.readIpAddress(req);
		const userAgent = req.headers["user-agent"] || "";

		let userR = await pool.query(`SELECT * FROM users WHERE google_id = $1 OR email = $2`, [
			googleId,
			email,
		]);

		if (userR.rowCount) {
			const user = userR.rows[0];
			if (user.provider_type === "local" && !user.google_id) {
				return res.status(409).json({
					message:
						"An account with this email already exists. Sign in with your password or reset your password.",
					code: "ACCOUNT_EXISTS_LOCAL",
				});
			}
			if (!user.google_id) {
				await pool.query(`UPDATE users SET google_id = $1, provider_type = 'google' WHERE user_id = $2`, [
					googleId,
					user.user_id,
				]);
			}
			if (!user.is_active) {
				return res.status(403).json({ message: "Account disabled" });
			}
			if (!(await hasRoleProfile(user))) {
				return res.json({
					needsProfileCompletion: true,
					role: user.role,
					user: publicUser(user),
					googleSignupToken: googleProfileToken(user.user_id),
					message: "Complete your profile registration before accessing the dashboard.",
				});
			}
			return finishLoginOr2FA(req, res, user, email, ip, userAgent);
		}

		// New user — need role
		const allowedRoles = ["Startup", "Investor", "Mentor"];
		const normalizedRole = role ? String(role).trim() : null;
		if (!normalizedRole || !allowedRoles.includes(normalizedRole)) {
			const signupToken = jwt.sign(
				{ googleId, email, firstName, lastName, purpose: "google_signup" },
				JWT_SECRET,
				{ expiresIn: "15m" },
			);
			return res.json({
				needsRoleSelection: true,
				googleSignupToken: signupToken,
				profile: { email, firstName, lastName },
			});
		}

		const randomPassword = await bcrypt.hash(require("crypto").randomBytes(32).toString("hex"), 10);
		const insertR = await pool.query(
			`INSERT INTO users (first_name, last_name, email, password_hash, role, provider_type, google_id, email_verified, is_approved)
       VALUES ($1,$2,$3,$4,$5,'google',$6,true,false)
       RETURNING *`,
			[firstName, lastName, email, randomPassword, normalizedRole, googleId],
		);
		const newUser = insertR.rows[0];

		const adminsRes = await pool.query(`SELECT user_id FROM users WHERE role = 'Admin'`);
		for (const admin of adminsRes.rows) {
			await pool.query(
				`INSERT INTO notifications (user_id, notification_type, title, message, reference_type, reference_id)
         VALUES ($1,'registration',$2,$3,'user',$4)`,
				[
					admin.user_id,
					`New ${normalizedRole} (Google)`,
					`${firstName} ${lastName} signed up with Google and is pending approval.`,
					newUser.user_id,
				],
			);
		}

		return res.status(201).json({
			message: "Account created. Complete your profile registration and await admin approval.",
			needsProfileCompletion: true,
			role: normalizedRole,
			user: publicUser(newUser),
			googleSignupToken: googleProfileToken(newUser.user_id),
		});
	} catch (err) {
		console.error("googleAuth", err);
		return res.status(500).json({ error: err.message });
	}
};

// POST /auth/google/complete-role { googleSignupToken, role }
exports.googleCompleteRole = async (req, res) => {
	try {
		const { googleSignupToken, role } = req.body;
		if (!googleSignupToken || !role) {
			return res.status(400).json({ message: "googleSignupToken and role are required" });
		}
		let decoded;
		try {
			decoded = jwt.verify(googleSignupToken, JWT_SECRET);
		} catch {
			return res.status(400).json({ message: "Invalid or expired signup session" });
		}
		if (decoded.purpose !== "google_signup") {
			return res.status(400).json({ message: "Invalid signup token" });
		}
		req.body = {
			credential: null,
			role,
			...decoded,
		};
		// Re-use google flow by simulating credential path — create user directly
		const allowedRoles = ["Startup", "Investor", "Mentor"];
		if (!allowedRoles.includes(String(role).trim())) {
			return res.status(400).json({ message: "Invalid role" });
		}
		const existing = await pool.query(`SELECT user_id FROM users WHERE email = $1`, [decoded.email]);
		if (existing.rowCount) {
			return res.status(409).json({ message: "Account already exists" });
		}
		const randomPassword = await bcrypt.hash(require("crypto").randomBytes(32).toString("hex"), 10);
		const insertR = await pool.query(
			`INSERT INTO users (first_name, last_name, email, password_hash, role, provider_type, google_id, email_verified, is_approved)
       VALUES ($1,$2,$3,$4,$5,'google',$6,true,false)
       RETURNING *`,
			[
				decoded.firstName,
				decoded.lastName,
				decoded.email,
				randomPassword,
				String(role).trim(),
				decoded.googleId,
			],
		);
		const newUser = insertR.rows[0];
		return res.status(201).json({
			message: "Account created. Complete your profile registration.",
			needsProfileCompletion: true,
			role: newUser.role,
			user: publicUser(newUser),
			googleSignupToken: googleProfileToken(newUser.user_id),
		});
	} catch (err) {
		return res.status(500).json({ error: err.message });
	}
};

async function finishLoginOr2FA(req, res, user, email, ip, userAgent) {
	if (user.two_factor_enabled) {
		const pendingToken = await authSecurity.createPendingLogin(user.user_id, req);
		if (user.two_factor_method === "email") {
			await authSecurity.sendEmailLoginOtp(user.user_id);
		}
		await securityMonitoringService.logLoginAttempt({
			email,
			userId: user.user_id,
			success: true,
			failureReason: "pending_2fa",
			ipAddress: ip,
			userAgent,
		});
		return res.json({
			requires2FA: true,
			pendingToken,
			twoFactorMethod: user.two_factor_method,
			message: "Two-factor authentication required",
		});
	}

	const tokens = await authSecurity.issueAuthTokens(user, req);
	await securityMonitoringService.logLoginAttempt({
		email,
		userId: user.user_id,
		success: true,
		failureReason: null,
		ipAddress: ip,
		userAgent,
	});
	return res.json({
		message: "Login successful",
		...tokens,
		user: publicUser(user),
	});
}

module.exports.finishLoginOr2FA = finishLoginOr2FA;
module.exports.publicUser = publicUser;
