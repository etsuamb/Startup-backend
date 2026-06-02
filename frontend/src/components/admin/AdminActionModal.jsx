"use client";

import { useEffect, useState } from "react";

/**
 * @param {{
 *   open: boolean;
 *   title: string;
 *   message?: string;
 *   confirmLabel?: string;
 *   cancelLabel?: string;
 *   variant?: "confirm" | "prompt";
 *   inputLabel?: string;
 *   defaultValue?: string;
 *   inputType?: "text" | "textarea" | "number";
 *   placeholder?: string;
 *   fields?: Array<{ key: string; label: string; type?: "text" | "textarea" | "number"; defaultValue?: string; placeholder?: string }>;
 *   isDangerous?: boolean;
 *   isLoading?: boolean;
 *   onConfirm: (value?: string | Record<string, string>) => void;
 *   onCancel: () => void;
 * }} props
 */
export default function AdminActionModal({
	open,
	title,
	message,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	variant = "confirm",
	inputLabel,
	defaultValue = "",
	inputType = "text",
	placeholder = "",
	fields,
	isDangerous = false,
	isLoading = false,
	onConfirm,
	onCancel,
}) {
	const [values, setValues] = useState({});

	useEffect(() => {
		if (!open) return;
		if (fields?.length) {
			const init = {};
			for (const field of fields) {
				init[field.key] = field.defaultValue ?? "";
			}
			setValues(init);
		} else if (variant === "prompt") {
			setValues({ input: defaultValue });
		}
	}, [open, defaultValue, fields, variant]);

	if (!open) return null;

	const hasInput = variant === "prompt" || (fields && fields.length > 0);

	function handleConfirm() {
		if (fields?.length) {
			onConfirm(values);
			return;
		}
		if (variant === "prompt") {
			onConfirm(values.input ?? "");
			return;
		}
		onConfirm();
	}

	function updateField(key, value) {
		setValues((prev) => ({ ...prev, [key]: value }));
	}

	const inputClassName =
		"w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#0a4d3c] focus:ring-4 focus:ring-[#0a4d3c]/10";

	return (
		<div
			className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="admin-action-modal-title"
			onClick={onCancel}
		>
			<div
				className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<h2 id="admin-action-modal-title" className="text-2xl font-bold text-slate-900">
					{title}
				</h2>
				{message ? <p className="mt-3 leading-relaxed text-slate-600">{message}</p> : null}

				{fields?.length ? (
					<div className={`space-y-4 ${message ? "mt-6" : "mt-5"}`}>
						{fields.map((field) => (
							<div key={field.key}>
								<label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
									{field.label}
								</label>
								{field.type === "textarea" ? (
									<textarea
										value={values[field.key] ?? ""}
										onChange={(e) => updateField(field.key, e.target.value)}
										placeholder={field.placeholder}
										rows={3}
										className={inputClassName}
									/>
								) : (
									<input
										type={field.type === "number" ? "number" : "text"}
										value={values[field.key] ?? ""}
										onChange={(e) => updateField(field.key, e.target.value)}
										placeholder={field.placeholder}
										className={inputClassName}
									/>
								)}
							</div>
						))}
					</div>
				) : variant === "prompt" ? (
					<div className={`${message ? "mt-6" : "mt-5"}`}>
						{inputLabel ? (
							<label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
								{inputLabel}
							</label>
						) : null}
						{inputType === "textarea" ? (
							<textarea
								value={values.input ?? ""}
								onChange={(e) => updateField("input", e.target.value)}
								placeholder={placeholder}
								rows={3}
								className={inputClassName}
								autoFocus
							/>
						) : (
							<input
								type={inputType === "number" ? "number" : "text"}
								value={values.input ?? ""}
								onChange={(e) => updateField("input", e.target.value)}
								placeholder={placeholder}
								className={inputClassName}
								autoFocus
							/>
						)}
					</div>
				) : null}

				<div className={`flex gap-3 ${hasInput ? "mt-8" : message ? "mt-8" : "mt-6"}`}>
					<button
						type="button"
						onClick={onCancel}
						disabled={isLoading}
						className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
					>
						{cancelLabel}
					</button>
					<button
						type="button"
						onClick={handleConfirm}
						disabled={isLoading}
						className={`flex-1 rounded-2xl px-4 py-3 font-semibold text-white transition disabled:opacity-50 ${
							isDangerous ? "bg-red-600 hover:bg-red-700" : "bg-[#0a4d3c] hover:bg-[#07382b]"
						}`}
					>
						{isLoading ? "Processing…" : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
