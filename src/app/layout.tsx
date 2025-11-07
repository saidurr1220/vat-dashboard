import ModernNavigation from "@/components/ModernNavigation";
import ClientWrapper from "@/components/ClientWrapper";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="min-h-screen bg-background" suppressHydrationWarning>
        <ClientWrapper>
          <AuthProvider>
            <ModernNavigation />
            <main
              className="min-h-screen bg-background print:ml-0 print:w-full transition-all duration-300"
              style={{ marginLeft: "var(--sidebar-width, 0px)" }}
            >
              <div className="p-4 lg:p-6 pt-16 lg:pt-6 print:p-0 print:pt-0">
                {children}
              </div>
            </main>
            <Toaster />
          </AuthProvider>
        </ClientWrapper>
      </body>
    </html>
  );
}
