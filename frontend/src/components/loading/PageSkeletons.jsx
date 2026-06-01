function SkeletonBlock({ className = "" }) {
	return <div className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`} />;
}

function ScreenReaderStatus() {
	return <span className="sr-only">Loading page content...</span>;
}

function SidebarSkeleton() {
	return (
		<aside className="hidden min-h-screen w-64 shrink-0 border-r border-slate-200 bg-white p-5 md:block">
			<div className="flex items-center gap-3 border-b border-slate-100 pb-6">
				<SkeletonBlock className="h-10 w-10 rounded-xl" />
				<SkeletonBlock className="h-5 w-32" />
			</div>
			<div className="mt-7 space-y-3">
				{Array.from({ length: 7 }, (_, index) => (
					<div key={index} className="flex items-center gap-3 rounded-xl px-2 py-2">
						<SkeletonBlock className="h-5 w-5 rounded-md" />
						<SkeletonBlock className={`h-4 ${index % 3 === 0 ? "w-28" : "w-36"}`} />
					</div>
				))}
			</div>
		</aside>
	);
}

function TopbarSkeleton() {
	return (
		<header className="flex h-[72px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
			<SkeletonBlock className="h-10 w-full max-w-sm rounded-full" />
			<div className="ml-5 flex items-center gap-3">
				<SkeletonBlock className="h-9 w-9 rounded-full" />
				<SkeletonBlock className="hidden h-9 w-32 sm:block" />
				<SkeletonBlock className="h-10 w-10 rounded-full" />
			</div>
		</header>
	);
}

export function PortalContentSkeleton({ compact = false }) {
	return (
		<div
			className={`mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 ${compact ? "" : "pb-20"}`}
			aria-busy="true"
			role="status"
		>
			<ScreenReaderStatus />
			<div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
				<div className="space-y-3">
					<SkeletonBlock className="h-3 w-28" />
					<SkeletonBlock className="h-8 w-72 max-w-full" />
					<SkeletonBlock className="h-4 w-[28rem] max-w-full" />
				</div>
				<SkeletonBlock className="h-11 w-32 rounded-xl" />
			</div>

			<div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
				{Array.from({ length: 4 }, (_, index) => (
					<div key={index} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
						<div className="flex items-start justify-between">
							<SkeletonBlock className="h-3 w-20" />
							<SkeletonBlock className="h-9 w-9 rounded-xl" />
						</div>
						<SkeletonBlock className="mt-5 h-8 w-16" />
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
				<section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
					<div className="flex items-center justify-between border-b border-slate-100 pb-4">
						<div className="space-y-2">
							<SkeletonBlock className="h-5 w-44" />
							<SkeletonBlock className="h-3 w-64 max-w-full" />
						</div>
						<SkeletonBlock className="h-8 w-20 rounded-full" />
					</div>
					<div className="mt-2 divide-y divide-slate-100">
						{Array.from({ length: 5 }, (_, index) => (
							<div key={index} className="flex items-center gap-4 py-4">
								<SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
								<div className="flex-1 space-y-2">
									<SkeletonBlock className="h-4 w-2/5" />
									<SkeletonBlock className="h-3 w-4/5" />
								</div>
								<SkeletonBlock className="h-7 w-16 rounded-full" />
							</div>
						))}
					</div>
				</section>

				<section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
					<SkeletonBlock className="h-5 w-36" />
					<SkeletonBlock className="mt-3 h-3 w-52 max-w-full" />
					<div className="mt-6 space-y-4">
						{Array.from({ length: 4 }, (_, index) => (
							<div key={index} className="rounded-xl bg-slate-50 p-4">
								<SkeletonBlock className="h-4 w-3/5" />
								<SkeletonBlock className="mt-3 h-3 w-full" />
								<SkeletonBlock className="mt-2 h-3 w-4/5" />
							</div>
						))}
					</div>
				</section>
			</div>
		</div>
	);
}

export function PortalPageSkeleton({ includeShell = false }) {
	const content = <PortalContentSkeleton compact={includeShell} />;

	if (!includeShell) return content;

	return (
		<div className="flex min-h-screen bg-[#f6f8f9] text-slate-900">
			<SidebarSkeleton />
			<div className="flex min-w-0 flex-1 flex-col">
				<TopbarSkeleton />
				<main className="flex-1 overflow-hidden">{content}</main>
			</div>
		</div>
	);
}

export function PublicPageSkeleton() {
	return (
		<div className="min-h-screen bg-white" aria-busy="true" role="status">
			<ScreenReaderStatus />
			<header className="border-b border-slate-100 px-5 py-4 sm:px-8">
				<div className="mx-auto flex max-w-7xl items-center justify-between">
					<SkeletonBlock className="h-9 w-44" />
					<div className="hidden items-center gap-5 sm:flex">
						{Array.from({ length: 4 }, (_, index) => (
							<SkeletonBlock key={index} className="h-4 w-16" />
						))}
						<SkeletonBlock className="h-10 w-24 rounded-xl" />
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
				<div className="mx-auto max-w-3xl space-y-5 text-center">
					<SkeletonBlock className="mx-auto h-4 w-36" />
					<SkeletonBlock className="mx-auto h-12 w-full max-w-2xl" />
					<SkeletonBlock className="mx-auto h-5 w-full max-w-xl" />
					<SkeletonBlock className="mx-auto h-5 w-full max-w-lg" />
					<div className="flex justify-center gap-3 pt-3">
						<SkeletonBlock className="h-12 w-32 rounded-xl" />
						<SkeletonBlock className="h-12 w-32 rounded-xl" />
					</div>
				</div>
				<div className="mt-16 grid gap-6 md:grid-cols-3">
					{Array.from({ length: 3 }, (_, index) => (
						<div key={index} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
							<SkeletonBlock className="h-40 rounded-none" />
							<div className="space-y-3 p-5">
								<SkeletonBlock className="h-4 w-20" />
								<SkeletonBlock className="h-6 w-3/5" />
								<SkeletonBlock className="h-4 w-full" />
								<SkeletonBlock className="h-4 w-4/5" />
							</div>
						</div>
					))}
				</div>
			</main>
		</div>
	);
}

export function CardGridSkeleton({ count = 3 }) {
	return (
		<div className="grid gap-8 md:grid-cols-3" aria-busy="true" role="status">
			<ScreenReaderStatus />
			{Array.from({ length: count }, (_, index) => (
				<div key={index} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
					<SkeletonBlock className="h-48 rounded-none" />
					<div className="space-y-3 p-6">
						<SkeletonBlock className="h-4 w-24" />
						<SkeletonBlock className="h-6 w-3/5" />
						<SkeletonBlock className="h-4 w-full" />
						<SkeletonBlock className="h-4 w-4/5" />
						<SkeletonBlock className="mt-5 h-10 w-28 rounded-lg" />
					</div>
				</div>
			))}
		</div>
	);
}
