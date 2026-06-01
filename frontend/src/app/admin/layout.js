import AdminLayoutClient from "@/components/admin/AdminLayoutClient";
import { AdminLocaleProvider } from "@/components/admin/AdminLocaleProvider";

export const metadata = {
	title: "Admin Dashboard | StartupConnect",
	description: "Platform management for StartupConnect",
};

export default function AdminLayout({ children }) {
	return (
		<AdminLocaleProvider>
			<AdminLayoutClient>{children}</AdminLayoutClient>
		</AdminLocaleProvider>
	);
}
