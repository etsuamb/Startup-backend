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
	return "Your startup account is registered, but this action is locked until an administrator approves your account.";
}
