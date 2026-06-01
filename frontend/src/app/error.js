"use client";

import { useEffect, useRef, useState } from "react";

/** Detect a Render / gateway cold-start error */
function isBackendWaking(error) {
	return (
		error?.name === "BackendWakingError" ||
		error?.status === 502 ||
		/waking up|502|bad gateway/i.test(error?.message || "")
	);
}

/** Spinning dots animation */
function SpinningDots() {
	return (
		<div style={{ display: "flex", gap: 8, justifyContent: "center", margin: "24px 0" }}>
			{[0, 1, 2].map((i) => (
				<span
					key={i}
					style={{
						width: 12,
						height: 12,
						borderRadius: "50%",
						background: "#4f46e5",
						display: "inline-block",
						animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
					}}
				/>
			))}
			<style>{`
				@keyframes bounce {
					0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
					40% { transform: scale(1); opacity: 1; }
				}
			`}</style>
		</div>
	);
}

/** Progress bar that sweeps across over ~60 s */
function WarmUpBar({ elapsed }) {
	const pct = Math.min(100, (elapsed / 70) * 100);
	return (
		<div
			style={{
				width: "100%",
				height: 6,
				borderRadius: 99,
				background: "#e0e7ff",
				margin: "16px 0",
				overflow: "hidden",
			}}
		>
			<div
				style={{
					height: "100%",
					width: `${pct}%`,
					background: "linear-gradient(90deg, #6366f1, #818cf8)",
					borderRadius: 99,
					transition: "width 1s linear",
				}}
			/>
		</div>
	);
}

/** Backend-waking screen: polls /api-backend/health until alive, then calls reset() */
function WakingUpScreen({ reset }) {
	const [elapsed, setElapsed] = useState(0);
	const [dots, setDots] = useState(".");
	const intervalRef = useRef(null);
	const pollRef = useRef(null);
	const startedRef = useRef(Date.now());

	useEffect(() => {
		// Tick elapsed seconds
		intervalRef.current = setInterval(() => {
			setElapsed(Math.floor((Date.now() - startedRef.current) / 1000));
			setDots((d) => (d.length >= 3 ? "." : d + "."));
		}, 1000);

		// Poll health endpoint every 5 s
		async function poll() {
			try {
				const res = await fetch("/health-check", { cache: "no-store" });
				if (res.ok) {
					clearInterval(intervalRef.current);
					clearInterval(pollRef.current);
					reset(); // re-trigger the failed page render
					return;
				}
			} catch {
				// still sleeping
			}
		}

		poll(); // immediate first check
		pollRef.current = setInterval(poll, 5000);

		return () => {
			clearInterval(intervalRef.current);
			clearInterval(pollRef.current);
		};
	}, [reset]);

	const mins = Math.floor(elapsed / 60);
	const secs = elapsed % 60;
	const timeLabel =
		mins > 0
			? `${mins}m ${secs}s`
			: `${secs}s`;

	return (
		<main
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)",
				padding: "24px",
				fontFamily: "Inter, system-ui, sans-serif",
			}}
		>
			<div
				style={{
					background: "#fff",
					borderRadius: 20,
					boxShadow: "0 8px 40px rgba(99,102,241,0.12)",
					padding: "40px 36px",
					maxWidth: 480,
					width: "100%",
					textAlign: "center",
				}}
			>
				{/* Icon */}
				<div
					style={{
						width: 64,
						height: 64,
						borderRadius: "50%",
						background: "linear-gradient(135deg,#6366f1,#818cf8)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						margin: "0 auto 20px",
						fontSize: 28,
					}}
				>
					☁️
				</div>

				<h1
					style={{
						fontSize: 22,
						fontWeight: 700,
						color: "#3730a3",
						margin: "0 0 8px",
					}}
				>
					Server is waking up{dots}
				</h1>

				<p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 4px" }}>
					The backend is on a free-tier host and powers down after inactivity.
				</p>
				<p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
					It usually comes back online in <strong>30–60 seconds</strong>. This page
					will reload automatically — no action needed.
				</p>

				<SpinningDots />
				<WarmUpBar elapsed={elapsed} />

				<p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 24 }}>
					Waiting {timeLabel} · checking every 5 seconds
				</p>

				{/* Manual retry after 20 s */}
				{elapsed >= 20 && (
					<button
						onClick={reset}
						style={{
							background: "#6366f1",
							color: "#fff",
							border: "none",
							borderRadius: 10,
							padding: "10px 24px",
							fontSize: 14,
							fontWeight: 600,
							cursor: "pointer",
						}}
					>
						Try now
					</button>
				)}
			</div>
		</main>
	);
}

export default function ErrorPage({ error, reset }) {
	if (isBackendWaking(error)) {
		return <WakingUpScreen reset={reset} />;
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
			<div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
				<h1 className="text-2xl font-bold text-red-700">Something went wrong</h1>
				<p className="mt-3 text-sm text-red-600">
					{error?.message || "This page could not load correctly. Please try again."}
				</p>
				<button
					type="button"
					onClick={reset}
					className="mt-6 rounded-lg bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800"
				>
					Try again
				</button>
			</div>
		</main>
	);
}

