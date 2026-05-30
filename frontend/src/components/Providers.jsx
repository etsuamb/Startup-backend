"use client";

import GoogleAuthProvider from "@/components/auth/GoogleAuthProvider";

export default function Providers({ children }) {
	return <GoogleAuthProvider>{children}</GoogleAuthProvider>;
}
