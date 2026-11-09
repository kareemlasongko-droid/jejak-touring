import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { VisitorTracker } from "@/components/VisitorTracker";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://jejak-touring.vercel.app"),
  title: { default: "JejakTouring — Tetap dekat di setiap perjalanan", template: "%s · JejakTouring" },
  description: "Pantau perjalanan mobil komunitas dan keluarga secara live, tanpa perlu membuat akun.",
  applicationName: "JejakTouring",
  openGraph: {
    title: "JejakTouring — Tetap dekat di setiap perjalanan",
    description: "Pantau perjalanan mobil komunitas dan keluarga secara live, tanpa perlu membuat akun.",
    type: "website",
    locale: "id_ID",
    siteName: "JejakTouring",
    images: [{ url: "/images/hero-banner.jpg", width: 500, height: 500, alt: "JejakTouring — perjalanan Jakarta menuju Bandung" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "JejakTouring — Tetap dekat di setiap perjalanan",
    description: "Pantau perjalanan mobil komunitas dan keluarga secara live, tanpa perlu membuat akun.",
    images: ["/images/hero-banner.jpg"],
  },
  appleWebApp: { capable: true, title: "JejakTouring", statusBarStyle: "black-translucent" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#11120f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        {children}
        <PwaRegister />
        <ConnectionBanner />
        <VisitorTracker />
      </body>
    </html>
  );
}
