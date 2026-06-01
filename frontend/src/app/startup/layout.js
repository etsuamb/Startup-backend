import AccountAccessGuard from "@/components/auth/AccountAccessGuard";
import { StartupLocaleProvider } from "@/components/startup/StartupLocaleProvider";

export const metadata = {
	title: "Startup Portal | StartupConnect",
};

export default function StartupLayout({ children }) {
	return (
		<AccountAccessGuard requiredRole="Startup">
			<StartupLocaleProvider>
				<div data-startup-locale-root>{children}</div>
			</StartupLocaleProvider>
		</AccountAccessGuard>
	);
}
