"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    LayoutDashboard,
    Users,
    Tag,
    Settings,
    BookOpen,
    TrendingUp,
    ClipboardCheck,
    LogOut,
    UserCircle,
    Hexagon,
    PanelLeftClose,
    PanelRightClose,
    Layers,
    Shield,
    Wrench,
    Activity
} from "lucide-react";
import { auth } from "@/lib/firebase";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Sidebar = ({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: (val: boolean) => void }) => {
    const pathname = usePathname();
    const { profile, hasPermission } = useAuth();

    const menuItems = [
        { name: "Dashboard", icon: LayoutDashboard, path: "/", permission: "dashboard.view" },
        { name: "Employee Directory", icon: Users, path: "/directory", permission: "dashboard.view" },
        { name: "My Profile", icon: UserCircle, path: "/profile", permission: "dashboard.view" },
        { name: "Employee Administration", icon: Users, path: "/employees", permission: "employees.manage" },
        { name: "Categories", icon: Tag, path: "/categories", permission: "categories.view" },
        { name: "Sub Categories", icon: Layers, path: "/subcategories", permission: "categories.view" },
        { name: "Identifications", icon: Wrench, path: "/identifications", permission: "identifications.view" },
        { name: "Skills", icon: ClipboardCheck, path: "/skills", permission: "skills.view" },
        { name: "Performance", icon: TrendingUp, path: "/performance", permission: "performance.view" },
        { name: "Tasks", icon: BookOpen, path: "/tasks", permission: "tasks.view" },
        { name: "Progress Report", icon: ClipboardCheck, path: "/progress", permission: "progress.view" },
        { name: "Knowledgebase", icon: BookOpen, path: "/knowledgebase", permission: "knowledgebase.view" },
        { name: "Settings", icon: Settings, path: "/settings", permission: "settings.view" },
        { name: "Admin Dashboard", icon: Activity, path: "/admin", permission: "performance.view" },
        { name: "Roles & Permissions", icon: Shield, path: "/settings/roles", permission: "settings.roles.view" },
    ];

    const filteredMenu = menuItems.filter(item => hasPermission(item.permission));

    return (
        <motion.aside
            initial={false}
            animate={{ width: collapsed ? 60 : 210 }}
            className={cn(
                "fixed left-0 top-0 bottom-0 h-screen z-50 transition-all duration-500 ease-in-out bg-transparent",
                "hidden lg:flex flex-col whitespace-nowrap"
            )}
        >
            {/* Top Right Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[var(--background)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--primary)]/50 transition-all shadow-[0_0_15px_rgba(0,0,0,0.1)] z-50"
                title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {collapsed ? <PanelRightClose size={12} strokeWidth={2} /> : <PanelLeftClose size={12} strokeWidth={2} />}
            </button>

            {/* Logo Section */}
            <div className={cn("pt-4 pb-3 flex items-center", collapsed ? "justify-center" : "px-4")}>
                <AnimatePresence mode="wait">
                    {!collapsed ? (
                        <motion.div
                            key="logo-full"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-8 h-8 rounded-lg bg-black/20 border border-[var(--primary)]/30 flex items-center justify-center shadow-lg min-w-[32px]">
                                <Hexagon className="text-[var(--primary)]" size={16} strokeWidth={2} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-base font-black tracking-tight text-[var(--text-main)] leading-none uppercase">Hardwood</span>
                                <span className="text-[7px] font-bold text-[var(--primary)] tracking-[0.3em] uppercase mt-0.5">Matrix v4</span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="logo-small"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="w-8 h-8 rounded-lg bg-[#0D0D0D] border border-[#E5A54F]/30 flex items-center justify-center shadow-lg cursor-pointer"
                        >
                            <Hexagon className="text-[#E5A54F]" size={18} strokeWidth={2} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-2 overflow-y-auto no-scrollbar flex flex-col gap-1">
                {filteredMenu.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;
                    return (
                        <div key={item.path} className="relative group/nav px-0">
                            <Link
                                href={item.path}
                                className={cn(
                                    "flex items-center gap-2.5 py-1.5 transition-all duration-300 relative",
                                    isActive
                                        ? "bg-white/[0.04] text-white rounded-r-xl mr-2"
                                        : "text-[#8E8E93] hover:text-white hover:bg-white/[0.02] rounded-r-xl mr-2",
                                    collapsed ? "justify-center mx-1 rounded-lg px-0" : "px-4 mx-0"
                                )}
                            >
                                {isActive && !collapsed && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#E5A54F] rounded-r-full shadow-[1px_0_8px_rgba(229,165,79,0.5)]"
                                    />
                                )}
                                {isActive && collapsed && (
                                    <motion.div
                                        layoutId="active-pill-collapsed"
                                        className="absolute left-0 top-2 bottom-2 w-0.5 bg-[#E5A54F] rounded-full shadow-[0_0_8px_rgba(229,165,79,0.5)]"
                                    />
                                )}

                                <Icon
                                    size={14}
                                    strokeWidth={1.5}
                                    className={cn(
                                        "transition-colors duration-300 z-10 relative min-w-[14px]",
                                        isActive ? "text-[var(--primary)]" : "text-[var(--text-muted)] group-hover/nav:text-[var(--text-main)]"
                                    )}
                                />
                                {!collapsed && <span className="font-semibold text-[10px] tracking-wide relative z-10 text-[var(--text-main)]">{item.name}</span>}

                                {collapsed && (
                                    <div className="absolute left-[100%] ml-3 bg-[#1A1A1A] border border-white/10 text-white px-2.5 py-1 rounded-md opacity-0 translate-x-3 group-hover/nav:opacity-100 group-hover/nav:translate-x-0 transition-all duration-300 pointer-events-none text-[11px] font-medium z-[100] whitespace-nowrap shadow-lg">
                                        {item.name}
                                    </div>
                                )}
                            </Link>
                        </div>
                    );
                })}
            </nav>

            {/* System Diagnostics / Logout */}
            <div className={cn("pb-4 pt-2", collapsed ? "px-1" : "px-3")}>
                <button
                    onClick={() => auth.signOut()}
                    className={cn(
                        "flex items-center gap-2.5 w-full py-2 text-[#8E8E93] hover:text-white hover:bg-white/[0.02] transition-all duration-300 group relative",
                        collapsed ? "justify-center rounded-lg px-0" : "px-3 rounded-lg"
                    )}
                    title="Deactivate Session"
                >
                    <LogOut size={14} strokeWidth={1.5} className="group-hover:text-red-400 transition-colors min-w-[14px]" />
                    {!collapsed && <span className="font-semibold text-[10px] tracking-wide group-hover:text-red-400 transition-colors">Logout</span>}
                    {collapsed && (
                        <div className="absolute left-[100%] ml-3 bg-[#1A1A1A] border border-white/10 text-red-400 px-2.5 py-1 rounded-md opacity-0 translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none text-[11px] font-medium z-[100] whitespace-nowrap shadow-lg">
                            Logout
                        </div>
                    )}
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
