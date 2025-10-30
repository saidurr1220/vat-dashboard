import ModernNavigation from "@/components/ModernNavigation";
import ClientWrapper from "@/components/ClientWrapper";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="min-h-screen bg-background" suppressHydrationWarning>
        <ClientWrapper>
          <ModernNavigation />
          <main className="lg:ml-64 min-h-screen bg-background">
            <div className="p-4 lg:p-6 pt-16 lg:pt-6">{children}</div>
          </main>
          <Toaster />
        </ClientWrapper>
      </body>
    </html>
  );
}
