import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font" });

export const metadata = {
  title: { default: "Detechpro Dashboard", template: "%s · Detechpro" },
  description: "Private dashboard for managing AI calling campaigns, leads and analytics.",
  applicationName: "Detechpro Dashboard",
  referrer: "strict-origin-when-cross-origin",
  formatDetection: { telephone: false, email: false, address: false },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff", colorScheme: "light" };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
