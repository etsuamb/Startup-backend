"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/config";

export function actorAvatarUrl(role, profileId, refreshKey = "") {
	if (!role || !profileId) return "";
	const version = refreshKey ? `?v=${encodeURIComponent(refreshKey)}` : "";
	return `${API_BASE}/auth/profile-picture/${String(role).toLowerCase()}/${profileId}${version}`;
}

export default function ActorAvatar({
	role,
	profileId,
	initials,
	className = "",
	alt = "Profile picture",
	refreshKey = "",
}) {
	const [failedSrc, setFailedSrc] = useState("");
	const src = actorAvatarUrl(role, profileId, refreshKey);

	if (src && failedSrc !== src) {
		return <img src={src} alt={alt} className={`${className} object-cover`} onError={() => setFailedSrc(src)} />;
	}

	return (
		<div className={`${className} flex items-center justify-center bg-[#0f3d32] text-xs font-bold text-white`}>
			{initials}
		</div>
	);
}
