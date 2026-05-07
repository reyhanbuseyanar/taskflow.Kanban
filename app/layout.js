import "./globals.css";

export const metadata = {
  title: "TaskFlow — Kanban Proje Yönetim Tahtası",
  description:
    "Sürükle-bırak ile görev yönetimi, takvim görünümü ve ekip iş birliği.",
};

import MobileBottomNav from "@/components/MobileBottomNav";

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}
