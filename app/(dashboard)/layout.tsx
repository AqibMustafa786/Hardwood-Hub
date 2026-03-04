"use client";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PATH_PERMISSIONS: Record<string, string> = {
    '/': 'dashboard.view',
    '/employees': 'employees.view',
    '/categories': 'categories.view',
    '/subcategories': 'categories.view',
    '/skills': 'skills.view',
    '/performance': 'performance.view',
    '/tasks': 'tasks.view',
    '/progress': 'progress.view',
    '/knowledgebase': 'knowledgebase.view',
    '/identifications': 'identifications.view',
    '/settings': 'settings.view',
    '/settings/roles': 'settings.roles.view',
    '/directory': 'dashboard.view', // Everyone can view the directory, but the *contents* are filtered by role
    '/profile': 'dashboard.view' // Everyone can view their own profile
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop toggle

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else {
                // Find the required permission by checking path prefixes
                // Sort keys by length descending to match most specific route first
                const matchingPath = Object.keys(PATH_PERMISSIONS)
                    .sort((a, b) => b.length - a.length)
                    .find(path => {
                        if (path === '/') return pathname === '/';
                        return pathname === path || pathname.startsWith(path + '/');
                    });

                const requiredPermission = matchingPath ? PATH_PERMISSIONS[matchingPath] : null;

                if (requiredPermission && !hasPermission(requiredPermission)) {
                    if (pathname !== "/") {
                        router.replace("/");
                    }
                }
            }
        }
    }, [user, loading, router, pathname, hasPermission]);

    useEffect(() => {
        const updateMargin = () => {
            const isLarge = window.innerWidth >= 1024;
            const margin = isLarge ? (sidebarCollapsed ? '60px' : '210px') : '0px';
            document.documentElement.style.setProperty('--content-margin-left', margin);
        };
        updateMargin();
        window.addEventListener('resize', updateMargin);
        return () => window.removeEventListener('resize', updateMargin);
    }, [sidebarCollapsed]);

    if (loading) {
        return (
            <div className="h-screen w-screen bg-[var(--background)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-2 border-[var(--primary)]/10 border-t-[var(--primary)] rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-[var(--primary)] rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <span className="text-[#8E8E93] text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Hardwood Hub</span>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="flex h-screen bg-[var(--background)] text-[var(--text-main)] selection:bg-[var(--primary)]/30 relative overflow-hidden">
            {/* High-Tech Background Elements */}
            <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] grid-background" />
            <div className="fixed top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[var(--primary)]/5 to-transparent z-0 pointer-events-none opacity-20" />

            {/* Sidebar Shell */}
            <div className="hidden lg:block">
                <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
            </div>

            {/* Mobile Sidebar / Matrix Drawer */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSidebarOpen(false)}
                            className="fixed inset-0 bg-[#050505]/80 backdrop-blur-md z-[70] lg:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 w-[300px] z-[80] lg:hidden"
                        >
                            <Sidebar collapsed={false} setCollapsed={() => setIsSidebarOpen(false)} />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <div
                className="flex-1 flex flex-col min-w-0 h-screen transition-all duration-500 ease-in-out relative z-[40]"
                style={{
                    marginLeft: 'var(--content-margin-left, 0px)',
                    marginRight: '0px'
                }}
            >
                <Header />

                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto no-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={pathname}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full pb-16 lg:pb-4"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden fixed bottom-6 left-6 right-6 h-18 premium-glass rounded-3xl z-[60] flex items-center justify-around px-8 shadow-[0_30px_60px_rgba(0,0,0,0.8)] border border-white/10">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="flex flex-col items-center gap-1.5 text-[var(--primary)] group"
                >
                    <div className="w-6 h-1 bg-current rounded-full group-active:scale-95 transition-transform"></div>
                    <div className="w-4 h-1 bg-current rounded-full ml-auto group-active:scale-95 transition-transform"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest mt-1">Matrix</span>
                </button>
            </div>
        </div>
    );
}
