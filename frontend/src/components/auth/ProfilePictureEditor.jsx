"use client";

import { useRef, useState } from "react";
import ProfilePictureAvatar from "@/components/auth/ProfilePictureAvatar";
import { updateProfilePicture } from "@/lib/authApi";

export default function ProfilePictureEditor({
	initials,
	label = "Profile picture",
	description = "This image appears anywhere your profile is shown.",
}) {
	const inputRef = useRef(null);
	const [refreshKey, setRefreshKey] = useState(0);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	async function handleFile(event) {
		const file = event.target.files?.[0];
		if (!file) return;
		setSaving(true);
		setError("");
		setMessage("");
		try {
			const result = await updateProfilePicture(file);
			setRefreshKey((value) => value + 1);
			setMessage(result.message || "Profile picture updated");
			window.dispatchEvent(new CustomEvent("profile-picture-updated"));
		} catch (ex) {
			setError(ex.message || "Unable to update profile picture");
		} finally {
			setSaving(false);
			event.target.value = "";
		}
	}

	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
			<ProfilePictureAvatar initials={initials} refreshKey={refreshKey} className="h-20 w-20 shrink-0 rounded-2xl" alt={label} />
			<div className="min-w-0">
				<p className="text-sm font-bold text-gray-900">{label}</p>
				<p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
				<input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFile} />
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					disabled={saving}
					className="mt-3 inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
				>
					{saving ? "Uploading..." : "Change picture"}
				</button>
				{message ? <p className="mt-2 text-xs font-semibold text-emerald-700">{message}</p> : null}
				{error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}
			</div>
		</div>
	);
}
