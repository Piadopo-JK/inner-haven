import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/nav/Navbar";
import { SidebarProvider } from "@/lib/context/sidebar-context";
import QueryClientProvider from "@/components/providers/QueryClientProvider";
import "./globals.css";

const defaultUrl = process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const metadata: Metadata = defaultUrl
  ? {
    metadataBase: new URL(defaultUrl),
    title: "GuidanceGo",
    description: "Your secure guidance counseling platform",
    icons: {
      icon: "/assets/IconRet.png",
    },
  }
  : {
    title: "GuidanceGo",
    description: "Your secure guidance counseling platform",
    icons: {
      icon: "/assets/IconRet.png",
    },
  };

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffbfe" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1b1f" },
  ],
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:no-underline"
        >
          Skip to content
        </a>
        <QueryClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            disableTransitionOnChange
          >
            <SidebarProvider>
              <div className="flex min-h-dvh w-full bg-background">
                <Sidebar />
                <div className="relative z-0 flex min-w-0 flex-1 flex-col">
                  <Navbar />
                  <div className="flex min-h-0 flex-1 flex-col" id="main-content">
                    {children}
                  </div>
                </div>
              </div>
            </SidebarProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
