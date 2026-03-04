"use client";
import { useAuth } from "@/context/AuthContext";
import { Bell, Search, UserCircle, Command, Sparkles, Zap, Shield, Target, History } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Header = () => {
    const { profile } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const [localQuery, setLocalQuery] = useState(searchParams.get('q') || '');

    useEffect(() => {
        setLocalQuery(searchParams.get('q') || '');
    }, [searchParams]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setLocalQuery(val);
        const params = new URLSearchParams(searchParams.toString());
        if (val.trim()) {
            params.set('q', val);
        } else {
            params.delete('q');
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <header className="h-14 px-6 flex items-center justify-between sticky top-0 z-[60] bg-[var(--background)]/90 backdrop-blur-md transition-colors">
            {/* Search Bar / Command Palette Style */}
            <div className="flex-1 max-w-lg pointer-events-auto">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative group pr-12"
                >
                    <div className={cn(
                        "absolute inset-0 bg-[#E5A54F]/5 rounded-3xl blur-2xl transition-opacity duration-700",
                        isSearchFocused ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                    )}></div>
                    <div className={cn(
                        "relative flex items-center bg-[var(--background)] backdrop-blur-3xl border rounded-xl px-3 py-2 transition-all duration-500 shadow-sm z-20",
                        isSearchFocused ? "border-[var(--primary)] shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] scale-[1.01]" : "border-[var(--glass-border)] group-hover:border-[var(--primary)]/30"
                    )}>
                        <Search size={16} className={cn("transition-colors duration-500", isSearchFocused ? "text-[var(--primary)]" : "text-[var(--text-muted)]")} strokeWidth={2} />
                        <input
                            type="text"
                            value={localQuery}
                            onChange={handleSearchChange}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                            placeholder="Search active view..."
                            className="bg-transparent border-none outline-none flex-1 px-3 text-sm font-medium text-[var(--text-main)] placeholder:text-[var(--text-muted)] tracking-tight"
                            title="Global Search"
                        />
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--text-main)]/5 border border-[var(--glass-border)] text-[9px] font-bold text-[var(--primary)] tracking-tighter">
                            <Command size={10} strokeWidth={2.5} />
                            <span className="opacity-80">K</span>
                        </div>
                    </div>

                    {/* Search Search / Command Palette Overlay */}
                    <AnimatePresence>
                        {isSearchFocused && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                className="absolute top-[calc(100%+12px)] left-0 w-full bg-[var(--glass-bg)] backdrop-blur-3xl border border-[var(--glass-border)] rounded-[32px] p-6 shadow-2xl z-10 overflow-hidden"
                            >
                                <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
                                <div className="relative z-10 space-y-8">
                                    <div>
                                        <div className="flex items-center gap-3 mb-4 px-2">
                                            <History size={12} className="text-[#E5A54F] opacity-50" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8E8E93]">Recent Identifications</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['Bobby Thornton', 'Sarah Jenkins'].map((name) => (
                                                <button key={name} className="flex items-center gap-4 p-3.5 rounded-2xl bg-[var(--text-main)]/5 border border-[var(--glass-border)] hover:bg-[#E5A54F]/10 hover:border-[#E5A54F]/30 transition-all group/item text-left">
                                                    <div className="w-10 h-10 rounded-xl bg-[var(--text-main)]/10 flex items-center justify-center text-xs font-black group-hover/item:text-[#E5A54F] text-[var(--text-main)]">
                                                        {name.split(' ').map(n => n[0]).join('')}
                                                    </div>
                                                    <span className="text-sm font-bold text-[var(--text-main)] group-hover/item:text-[#E5A54F]">{name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-4 px-2">
                                            <Zap size={12} className="text-[#E5A54F] opacity-50" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8E8E93]">Suggested Protocols</span>
                                        </div>
                                        <div className="space-y-2">
                                            {[
                                                { label: 'Execute Fleet Review', icon: Shield, desc: 'Trigger high-priority performance audit' },
                                                { label: 'Initialize Skill Profile', icon: Target, desc: 'Define new aptitude definition' }
                                            ].map((item) => (
                                                <button key={item.label} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group/protocol">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-11 h-11 rounded-xl bg-[#E5A54F]/10 flex items-center justify-center text-[#E5A54F]">
                                                            <item.icon size={20} />
                                                        </div>
                                                        <div className="flex flex-col text-left">
                                                            <span className="text-sm font-black text-white uppercase tracking-tight">{item.label}</span>
                                                            <span className="text-[10px] text-[#8E8E93] font-medium">{item.desc}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover/protocol:opacity-100 transition-opacity">
                                                        <Command size={14} className="text-[#8E8E93]" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Dynamic Page Actions Portal */}
            <div id="navbar-actions-portal" className="flex flex-1 items-center justify-end px-6 gap-3 pointer-events-auto" />

            {/* Right Side Actions */}
            <div className="flex items-center gap-6 pointer-events-auto">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative group"
                    title="Intelligence Updates"
                >
                    <div className="p-2.5 rounded-xl bg-[var(--background)] border border-[var(--glass-border)] group-hover:bg-[var(--primary)]/10 group-hover:border-[var(--primary)]/30 transition-all duration-500 shadow-sm">
                        <Bell size={18} className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" strokeWidth={1.5} />
                    </div>
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--primary)] rounded-full border-2 border-[var(--background)] shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)] animate-pulse"></span>
                </motion.button>

                <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                            <Sparkles size={10} className="text-[var(--primary)] opacity-50" />
                            <span className="text-sm font-bold text-[var(--text-main)] uppercase tracking-tight">{profile?.name || "Operative"}</span>
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--primary)] font-bold opacity-80 mt-0.5">{profile?.position || "Level 1 Access"}</span>
                    </div>
                    <motion.div
                        whileHover={{ rotate: 5, scale: 1.05 }}
                        className="relative group cursor-pointer"
                        onClick={() => {
                            if (profile?.id) {
                                router.push(`/employees/${profile.id}`);
                            }
                        }}
                    >
                        <div className="absolute -inset-1 bg-gradient-to-tr from-[var(--primary)] to-transparent rounded-full blur-sm opacity-0 group-hover:opacity-25 transition duration-500"></div>
                        <div className="relative w-8 h-8 rounded-full bg-[var(--background)] border border-[var(--glass-border)] overflow-hidden ring-2 ring-white/5 group-hover:ring-[var(--primary)]/20 transition-all duration-500 shadow-sm">
                            <span className="absolute inset-0 flex items-center justify-center font-black text-[var(--primary)] text-sm z-0">
                                {profile?.email ? profile.email.charAt(0).toUpperCase() : (profile?.name?.charAt(0) || 'U')}
                            </span>
                            {profile?.photoURL && (profile.photoURL.startsWith('http') || profile.photoURL.startsWith('data:')) && (
                                <img
                                    src={profile.photoURL}
                                    alt="Profile"
                                    className="absolute inset-0 w-full h-full object-cover z-10"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </header>
    );
};

export default Header;
