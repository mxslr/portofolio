import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { portfolio } from "@/lib/portfolio";
import "./globals.css";

export const metadata: Metadata = {
  title: portfolio.meta.siteTitle,
  description: portfolio.meta.siteDescription,
  metadataBase: new URL(portfolio.meta.website),
  openGraph: {
    title: portfolio.meta.siteTitle,
    description: portfolio.meta.siteDescription,
    type: "website",
  },
  icons: {
    icon: [
      { url: "/icon.png" },
      { url: "/icon.png", sizes: "32x32" },
      { url: "/icon.png", sizes: "192x192" },
    ],
    apple: { url: "/icon.png", sizes: "180x180" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
