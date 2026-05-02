import type { Metadata } from "next";
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
    title: "Next.js and Supabase Starter Kit",
    description: "The fastest way to build apps with Next.js and Supabase",
  }
  : {
    title: "Next.js and Supabase Starter Kit",
    description: "The fastest way to build apps with Next.js and Supabase",
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
        <QueryClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <div className="flex min-h-dvh w-full bg-background">
                <Sidebar />
                <div className="relative z-0 flex min-w-0 flex-1 flex-col">
                  <Navbar />
                  <div className="flex min-h-0 flex-1 flex-col">
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
