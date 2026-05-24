import { Inter } from "next/font/google";
import NotificationPopupHost from "@/components/NotificationPopupHost";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "StartupConnect Ethiopia",
  description: "Connecting Ethiopian Startups with Investors and Mentors",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <NotificationPopupHost />
        {children}
      </body>
    </html>
  );
}
