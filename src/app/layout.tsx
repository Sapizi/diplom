import type { Metadata } from "next";
import "./globals.scss";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import PushNotificationsManager from '@/app/components/PushNotifications/PushNotificationsManager';
export const metadata = {
  icons:{
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PushNotificationsManager />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
