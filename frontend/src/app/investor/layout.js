import AccountAccessGuard from "@/components/auth/AccountAccessGuard";
import { InvestorLocaleProvider } from "@/components/investor/InvestorLocaleProvider";

export const metadata = {
	title: "Investor Portal | StartupConnect",
};

export default function InvestorLayout({ children }) {
	return (
		<AccountAccessGuard requiredRole="Investor">
			<InvestorLocaleProvider>
				<div data-investor-locale-root>{children}</div>
			</InvestorLocaleProvider>
		</AccountAccessGuard>
	);
}
