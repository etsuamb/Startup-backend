"use client";

import GoogleAuthProvider from "@/components/auth/GoogleAuthProvider";
import InlineFormValidation from "@/components/InlineFormValidation";
import { PublicLocaleProvider } from "@/components/locale/PublicLocaleProvider";

export default function Providers({ children }) {
	return (
		<PublicLocaleProvider>
			<GoogleAuthProvider>
				{children}
				<InlineFormValidation />
			</GoogleAuthProvider>
		</PublicLocaleProvider>
	);
}
