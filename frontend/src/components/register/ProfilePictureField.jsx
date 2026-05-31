export default function ProfilePictureField() {
	return (
		<div className="rounded-2xl border border-gray-200 bg-[#f7faf7] p-6">
			<label className="block text-sm font-bold text-[#0f3d32]">
				Profile picture <span className="text-red-500">*</span>
			</label>
			<p className="mt-1 text-xs text-gray-500">
				Upload a clear personal profile picture. It will appear in your account menu.
			</p>
			<input
				type="file"
				name="profile_picture"
				required
				accept=".jpg,.jpeg,.png,image/jpeg,image/png"
				data-file-kind="image"
				className="mt-4 w-full text-xs file:mr-4 file:rounded-lg file:border-0 file:bg-[#0f3d32] file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-[#0a2921]"
			/>
			<p className="mt-2 text-[10px] text-gray-400">Accepted formats: JPG or PNG</p>
		</div>
	);
}
