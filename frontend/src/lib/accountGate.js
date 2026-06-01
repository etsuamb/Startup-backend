/** Parse Postgres / JSON booleans reliably in the browser. */
export function isTruthyDbFlag(value) {
	if (value === true || value === 1) return true;
	if (value === false || value === 0 || value === null || value === undefined) return false;
	if (typeof value === "string") {
		const s = value.trim().toLowerCase();
		if (s === "true" || s === "t" || s === "1" || s === "yes") return true;
		if (s === "false" || s === "f" || s === "0" || s === "no" || s === "") return false;
	}
	return Boolean(value);
}

/** Normalize user flags from API / login responses for routing and guards. */
export function normalizeAuthUser(user) {
	if (!user) return null;
	const role = user.role;
	const provider = String(user.provider_type || "").toLowerCase();

	const emailVerified =
		role === "Admin"
			? true
			: provider === "google"
				? user.email_verified !== false && user.email_verified !== 0
				: isTruthyDbFlag(user.email_verified);

	const isApproved = role === "Admin" ? true : isTruthyDbFlag(user.is_approved);

	return {
		...user,
		email_verified: emailVerified,
		is_approved: isApproved,
	};
}

/** Build user object from login / Google / 2FA API payload. */
export function userFromLoginResponse(data) {
	if (!data) return null;
	const base = data.user || {};
	return normalizeAuthUser({
		...base,
		email_verified:
			data.emailVerified !== undefined ? data.emailVerified : base.email_verified,
		is_approved: data.isApproved !== undefined ? data.isApproved : base.is_approved,
	});
}

export function isAccountGateError(error) {
	const code = error?.code || error?.data?.code;
	const message = String(error?.message || error?.data?.message || error?.data?.error || "");
	return (
		code === "EMAIL_NOT_VERIFIED" ||
		code === "ACCOUNT_PENDING_APPROVAL" ||
		/email must be verified|verify your email/i.test(message) ||
		/pending admin approval|waiting for admin approval|administrator approves/i.test(message)
	);
}

export function accountGateTitle(error) {
	const code = error?.code || error?.data?.code;
	const message = String(error?.message || error?.data?.message || error?.data?.error || "");
	if (code === "EMAIL_NOT_VERIFIED" || /verify your email|email must be verified/i.test(message)) {
		return "Verify your email to continue";
	}
	return "Waiting for admin approval";
}

export function accountGateMessage(error) {
	const code = error?.code || error?.data?.code;
	const message = String(error?.message || error?.data?.message || error?.data?.error || "");
	if (code === "EMAIL_NOT_VERIFIED" || /verify your email|email must be verified/i.test(message)) {
		return "Your email address must be verified before you can use this feature. Check your inbox for the verification link, then sign in again.";
	}
	return "Your account is registered, but the platform stays read-only until an administrator approves it. You can change your email in Settings.";
}

export function settingsPathForRole(role) {
	if (role === "Startup") return "/startup/settings";
	if (role === "Investor") return "/investor/settings";
	if (role === "Mentor") return "/mentor/settings";
	if (role === "Admin") return "/admin/settings";
	return "/login";
}

export function dashboardPathForRole(role) {
	if (role === "Startup") return "/startup/dashboard";
	if (role === "Investor") return "/investor/dashboard";
	if (role === "Mentor") return "/mentor/dashboard";
	if (role === "Admin") return "/admin/dashboard";
	return "/";
}

export function hasFullPlatformAccess(user) {
	const u = normalizeAuthUser(user);
	if (!u) return false;
	if (u.role === "Admin") return true;
	return Boolean(u.email_verified) && Boolean(u.is_approved);
}

export function isRestrictedAccount(user) {
	const u = normalizeAuthUser(user);
	return Boolean(u && u.role !== "Admin" && !hasFullPlatformAccess(u));
}

export function isSettingsPath(pathname, role) {
	const base = settingsPathForRole(role);
	if (!base || base === "/login") return false;
	return pathname === base || pathname.startsWith(`${base}/`);
}

export function routeAfterLogin(router, userOrLoginData) {
	const user = userOrLoginData?.user
		? userFromLoginResponse(userOrLoginData)
		: normalizeAuthUser(userOrLoginData);
	const role = user?.role;

	if (!role) {
		router.push("/login");
		return;
	}

	if (!hasFullPlatformAccess(user)) {
		const reason = user.email_verified ? "pending-admin-approval" : "email-verification-required";
		router.push(`${settingsPathForRole(role)}?access=${reason}`);
		return;
	}

	router.push(dashboardPathForRole(role));
}
