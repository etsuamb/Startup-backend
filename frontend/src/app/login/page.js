import Image from "next/image";
import Link from "next/link";
import LoginForm from "./LoginForm";

export default function Login() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7faf9] px-5 py-10 font-sans text-gray-900">
      <div className="pointer-events-none absolute -left-32 top-[-8rem] h-80 w-80 rounded-full bg-[#d8eee8]/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-36 right-[-7rem] h-96 w-96 rounded-full bg-[#e7f3ee] blur-3xl" />

      <main className="relative z-10 w-full max-w-md">
        <div className="mb-9">
          <Link href="/" className="mb-10 inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[0_8px_24px_rgba(15,92,74,0.1)]">
              <Image src="/logo.png" alt="StartupConnect" width={30} height={30} className="h-8 w-8 object-contain" />
            </span>
            <span>
              <span className="block text-sm font-extrabold tracking-tight text-[#0f3d32]">StartupConnect</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#588277]">Ethiopia</span>
            </span>
          </Link>

          <div className="mt-10">
            <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-[#167b66]">Welcome back</p>
            <h1 className="text-4xl font-bold tracking-tight text-gray-950">Sign in to your account</h1>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Access your dashboard and continue where you left off.
            </p>
          </div>
        </div>

        <LoginForm />

        <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-400">
          <svg className="h-4 w-4 text-[#167b66]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure account access
        </div>

        <footer className="mt-8 flex items-center justify-center gap-5 text-[11px] font-semibold text-gray-400">
          <span>&copy; {new Date().getFullYear()} StartupConnect</span>
          <Link href="/privacy-policy" className="transition hover:text-[#115b4c]">Privacy</Link>
          <Link href="/terms-of-service" className="transition hover:text-[#115b4c]">Terms</Link>
        </footer>
      </main>
    </div>
  );
}
