import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "PAFEX",
  description: "Next Payment Follow-up App",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col">
        {children}

        <footer>
          <div className="mb-2 flex flex-col text-xs text-zinc-500 md:flex-row md:items-center md:justify-center">
            <p>
              © {new Date().getFullYear()} Prakash Airfreight India Pvt Ltd
              (Pafex)
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
