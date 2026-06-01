"use client";

import { useEffect, useState } from "react";
import { fetchProfilePictureBlob } from "@/lib/authApi";
import { getToken } from "@/lib/authStorage";

export default function ProfilePictureAvatar({
	initials,
	className = "",
	alt = "Profile picture",
	refreshKey = 0,
}) {
	const [src, setSrc] = useState("");
	const [localRefreshKey, setLocalRefreshKey] = useState(0);

	useEffect(() => {
		const refresh = () => setLocalRefreshKey((value) => value + 1);
		window.addEventListener("profile-picture-updated", refresh);
		return () => window.removeEventListener("profile-picture-updated", refresh);
	}, []);

	useEffect(() => {
		let objectUrl = "";
		let cancelled = false;
		let retryTimer;

		async function loadPicture(allowRetry) {
			if (!getToken()) {
				if (allowRetry) {
					retryTimer = setTimeout(() => {
						if (!cancelled) loadPicture(false);
					}, 400);
				}
				return;
			}

			try {
				const { blob } = await fetchProfilePictureBlob();
				if (cancelled) return;
				objectUrl = URL.createObjectURL(blob);
				setSrc(objectUrl);
			} catch {
				if (cancelled) return;
				setSrc("");
				if (allowRetry) {
					retryTimer = setTimeout(() => {
						if (!cancelled) loadPicture(false);
					}, 400);
				}
			}
		}

		loadPicture(true);

		return () => {
			cancelled = true;
			clearTimeout(retryTimer);
			if (objectUrl) URL.revokeObjectURL(objectUrl);
		};
	}, [refreshKey, localRefreshKey]);

	if (src) {
		return <img src={src} alt={alt} className={`${className} object-cover`} />;
	}

	return (
		<div className={`${className} flex items-center justify-center bg-[#0f3d32] text-xs font-bold text-white`}>
			{initials}
		</div>
	);
}
