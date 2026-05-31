"use client";

export default function GlobalError({ error, reset }) {
	return (
		<html lang="en">
			<body>
				<main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
					<div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
						<h1 className="text-2xl font-bold text-red-700">Unexpected application error</h1>
						<p className="mt-3 text-sm text-red-600">
							{error?.message || "The application could not continue. Please try again."}
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
			</body>
		</html>
	);
}
