import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta-sans" });

export const metadata: Metadata = {
    title: "Hardwood Hub | Skill Tracking System",
    description: "Advanced employee performance and skill tracking for Hardwood Hub",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${plusJakartaSans.variable} antialiased font-sans`}>
                <ThemeProvider>
                    <AuthProvider>
                        <div className="min-h-screen bg-[var(--background)] transition-colors duration-500">
                            {children}
                        </div>
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
