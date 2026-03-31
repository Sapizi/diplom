import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.scss";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import PushNotificationsManager from "@/app/components/PushNotifications/PushNotificationsManager";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: {
    default: "Чипотл",
    template: "%s | Чипотл",
  },
  description: "Онлайн-меню и оформление заказов Чипотл.",
  applicationName: "Чипотл",
  appleWebApp: {
    capable: true,
    title: "Чипотл",
    statusBarStyle: "default",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={montserrat.variable}>
      <body>
        {children}
        <PushNotificationsManager />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
