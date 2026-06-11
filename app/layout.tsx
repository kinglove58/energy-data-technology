import type { Metadata } from "next";
import "./globals.css";
import ClerkProviderClient from "@/components/providers/ClerkProviderClient";
import QueryProvider from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Energy Data Network Assurance",
  description:
    "AI-powered revenue assurance and power theft detection platform for utility companies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <ClerkProviderClient>
          <QueryProvider>{children}</QueryProvider>
        </ClerkProviderClient>
      </body>
    </html>
  );
}
