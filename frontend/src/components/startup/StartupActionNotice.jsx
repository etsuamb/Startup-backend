import Link from "next/link";
import { accountGateMessage, accountGateTitle } from "@/lib/accountGate";

export default function StartupActionNotice({
	error,
	title,
	message,
	className = "",
	actionHref,
	actionLabel,
}) {
	return (
		<div className={`rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 ${className}`}>
			<div className="flex items-start gap-3">
				<div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
					<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3.75m0 3.75h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
					</svg>
				</div>
				<div className="min-w-0">
					<p className="text-sm font-bold">{title || accountGateTitle(error)}</p>
					<p className="mt-1 text-sm text-amber-800">{message || accountGateMessage(error)}</p>
					{actionHref && actionLabel && (
						<Link href={actionHref} className="mt-3 inline-flex text-sm font-bold text-amber-950 underline">
							{actionLabel}
						</Link>
					)}
				</div>
			</div>
		</div>
	);
}
