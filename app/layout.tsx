import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google"; // Font ala programmer
import { ThemeProvider } from "next-themes";
import "./globals.css";

// Menginisialisasi font
const jetBrains = JetBrains_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mxslr | Portfolio",
  description: "Marshall Rasendria Mahendra's Personal Portfolio",
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
    <html lang="id" suppressHydrationWarning>
      <body className={jetBrains.className}>
        {/* ThemeProvider untuk fitur Light/Dark Mode */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}