import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";
import { ConnectionBanner } from "@/components/ConnectionBanner";

export const metadata: Metadata = {
  title: { default: "JejakTouring — Tetap dekat di setiap perjalanan", template: "%s · JejakTouring" },
  description: "Pantau perjalanan mobil komunitas dan keluarga secara live, tanpa perlu membuat akun.",
  applicationName: "JejakTouring",
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
      </body>
    </html>
  );
}
