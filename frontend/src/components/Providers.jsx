"use client";

import GoogleAuthProvider from "@/components/auth/GoogleAuthProvider";
import InlineFormValidation from "@/components/InlineFormValidation";

export default function Providers({ children }) {
	return (
		<GoogleAuthProvider>
			{children}
			<InlineFormValidation />
		</GoogleAuthProvider>
	);
}
