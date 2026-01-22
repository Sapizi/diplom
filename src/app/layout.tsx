import type { Metadata } from "next";
import "./globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import StyledComponentsRegistry from "../../lib/StyledComponentRegistry";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          {children}
        </StyledComponentsRegistry>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
