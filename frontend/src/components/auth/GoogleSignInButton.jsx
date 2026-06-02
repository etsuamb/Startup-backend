"use client";

import { GoogleLogin } from "@react-oauth/google";
import { googleAuth } from "@/lib/authApi";
import { setSession } from "@/lib/authStorage";
import { isGoogleAuthConfigured } from "@/lib/googleAuthConfig";
import {
	clearRegistrationAccountInfo,
	saveRegistrationAccountInfo,
} from "@/lib/registerAccountStorage";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { routeAfterLogin, userFromLoginResponse } from "@/lib/accountGate";
import { userFacingError } from "@/lib/userFacingErrors";

export default function GoogleSignInButton({ onError, role, mode = "login" }) {
	const router = useRouter();
	const buttonWrapRef = useRef(null);
	const [buttonWidth, setButtonWidth] = useState(400);

	useEffect(() => {
		const node = buttonWrapRef.current;
		if (!node) return;

		function updateWidth() {
			const measuredWidth = Math.floor(node.getBoundingClientRect().width);
			if (measuredWidth > 0) {
				setButtonWidth(Math.min(400, Math.max(200, measuredWidth)));
			}
		}

		updateWidth();
		const resizeObserver = new ResizeObserver(updateWidth);
		resizeObserver.observe(node);

		return () => resizeObserver.disconnect();
	}, []);

	if (!isGoogleAuthConfigured()) {
		return (
			<p className="text-center text-xs text-gray-400 font-medium">
				Google sign-in is unavailable. Set{" "}
				<code className="text-[10px] bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> in{" "}
				<code className="text-[10px] bg-gray-100 px-1 rounded">frontend/.env</code>.
			</p>
		);
	}

	async function handleSuccess(credentialResponse) {
		try {
			const credential = credentialResponse?.credential;
			if (!credential) throw new Error("Google sign-in failed");

			clearRegistrationAccountInfo();
			const data = await googleAuth(credential, role, mode);

			if (data.needsRoleSelection) {
				clearRegistrationAccountInfo();
				sessionStorage.setItem(
					"google_signup",
					JSON.stringify({
						googleSignupToken: data.googleSignupToken,
						profile: data.profile,
					}),
				);
				router.push("/login/google-role");
				return;
			}

			if (data.needsProfileCompletion) {
				if (data.token) {
					setSession({
						token: data.token,
						refreshToken: data.refreshToken,
						role: data.user?.role,
						userName: `${data.user?.first_name || ""} ${data.user?.last_name || ""}`.trim(),
					});
				} else if (data.googleSignupToken) {
					sessionStorage.setItem("google_profile_token", data.googleSignupToken);
				}
				saveRegistrationAccountInfo({
					first_name: data.user?.first_name || "",
					last_name: data.user?.last_name || "",
					full_name: `${data.user?.first_name || ""} ${data.user?.last_name || ""}`.trim(),
					email: data.user?.email || "",
					phone_number: data.user?.phone_number || "",
				});
				const reg =
					data.role === "Investor"
						? "/register/investor"
						: data.role === "Mentor"
							? "/register/mentor"
							: "/register/startup";
				router.push(reg);
				return;
			}

			if (data.requires2FA) {
				sessionStorage.setItem(
					"pending_2fa",
					JSON.stringify({
						pendingToken: data.pendingToken,
						twoFactorMethod: data.twoFactorMethod,
					}),
				);
				router.push("/login/verify-2fa");
				return;
			}

			if (data.token) {
				setSession({
					token: data.token,
					refreshToken: data.refreshToken,
					role: data.user?.role,
					userName: `${data.user?.first_name || ""} ${data.user?.last_name || ""}`.trim(),
				});
				const user = userFromLoginResponse(data);
				const twoFactorEnabled =
					data.twoFactorEnabled === true || user?.two_factor_enabled === true;
				if (!twoFactorEnabled && user?.role !== "Admin") {
					sessionStorage.setItem("prompt_2fa_setup", "true");
					router.push("/login/setup-2fa-optional");
					return;
				}

				routeAfterLogin(router, user);
			}
		} catch (ex) {
			onError?.(userFacingError(ex, "Google sign-in failed. Please try again."));
		}
	}

	return (
		<div ref={buttonWrapRef} className="w-full min-w-[200px]">
			<div className="flex justify-center [&>div]:mx-auto">
				<GoogleLogin
					onSuccess={handleSuccess}
					onError={() => onError?.("Google sign-in was cancelled or failed")}
					theme="outline"
					size="large"
					text="continue_with"
					shape="rectangular"
					width={buttonWidth}
				/>
			</div>
		</div>
	);
}
