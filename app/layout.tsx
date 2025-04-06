import "./globals.css";
import { Inter } from "next/font/google";
import Navigation from "./components/Navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "LaTeX Converter",
  description: "Convert PDF documents to LaTeX format",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}