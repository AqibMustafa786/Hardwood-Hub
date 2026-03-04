"use client";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Settings, Shield, Bell, Database, Save, User as UserIcon, Palette, Monitor } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function SettingsPage() {
    const { role } = useAuth();
    const {
        theme, setTheme,
        accentColor, setAccentColor,
        dynamicAnimations, setDynamicAnimations,
        highContrast, setHighContrast
    } = useTheme();
    const [success, setSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState("system");

    const handleSave = () => {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
    };

    return (
        <div className="space-y-3 max-w-4xl">
            {/* Settings Content */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Navigation Tabs */}
                <div className="space-y-1">
                    <button
                        onClick={() => setActiveTab("system")}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${activeTab === "system" ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20" : "text-[#A0A0A0] hover:bg-white/5 border border-transparent font-medium"}`}
                    >
                        <Settings size={14} /> System Logic
                    </button>
                    <button
                        onClick={() => setActiveTab("appearance")}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${activeTab === "appearance" ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20" : "text-[#A0A0A0] hover:bg-white/5 border border-transparent font-medium"}`}
                    >
                        <Palette size={14} /> Appearance & Themes
                    </button>
                    <button
                        onClick={() => setActiveTab("permissions")}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${activeTab === "permissions" ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20" : "text-[#A0A0A0] hover:bg-white/5 border border-transparent font-medium"}`}
                    >
                        <Shield size={14} /> Permissions
                    </button>
                    <button
                        onClick={() => setActiveTab("notifications")}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${activeTab === "notifications" ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20" : "text-[#A0A0A0] hover:bg-white/5 border border-transparent font-medium"}`}
                    >
                        <Bell size={14} /> Notifications
                    </button>
                    <button
                        onClick={() => setActiveTab("backup")}
                        className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-lg font-bold text-[10px] transition-all ${activeTab === "backup" ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20" : "text-[#A0A0A0] hover:bg-white/5 border border-transparent font-medium"}`}
                    >
                        <Database size={18} /> Backup & Sync
                    </button>
                </div>

                {/* Settings Form */}
                <div className="md:col-span-2 space-y-3">
                    {activeTab === "system" && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight border-b border-[var(--glass-border)] pb-3">Evaluation Rules</h3>

                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest border-l-2 border-[#3B82F6] pl-3">Proficient Tier Rules</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-[#8E8E93] ml-1">Reviewed Times Required</label>
                                            <input type="number" defaultValue={1} className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-[var(--text-main)] text-[10px] outline-none focus:border-[#3B82F6] transition-all shadow-sm" title="Proficient Reviews Required" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-[#8E8E93] ml-1">Supervisor Check</label>
                                            <div className="flex bg-[var(--background)] rounded-xl border border-[var(--glass-border)] p-1 shadow-sm">
                                                <button className="flex-1 py-1.5 text-[9px] font-bold bg-[#3B82F6]/20 text-[#3B82F6] rounded-lg">Any</button>
                                                <button className="flex-1 py-1.5 text-[9px] font-bold text-[#8E8E93] hover:text-[var(--text-main)] transition-colors">Unique</button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-[#8E8E93] ml-1">Bonus Amount ($)</label>
                                            <input type="number" step="0.01" defaultValue={0.03} className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-[var(--text-main)] text-[10px] outline-none focus:border-[#3B82F6] transition-all shadow-sm" title="Proficient Bonus Amount" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-black text-[var(--primary)] uppercase tracking-widest border-l-2 border-[var(--primary)] pl-3">Mastered Tier Rules</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-[#8E8E93] ml-1">Reviewed Times Required</label>
                                            <input type="number" defaultValue={2} className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-[var(--text-main)] text-[10px] outline-none focus:border-[var(--primary)] transition-all shadow-sm" title="Mastered Reviews Required" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-[#8E8E93] ml-1">Supervisor Check</label>
                                            <div className="flex bg-[var(--background)] rounded-xl border border-[var(--glass-border)] p-1 shadow-sm">
                                                <button className="flex-1 py-1.5 text-[9px] font-bold text-[#8E8E93] hover:text-[var(--text-main)] transition-colors">Any</button>
                                                <button className="flex-1 py-1.5 text-[9px] font-bold bg-[var(--primary)] text-[#050505] rounded-lg shadow-sm">Unique</button>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-[#8E8E93] ml-1">Bonus Amount ($)</label>
                                            <input type="number" step="0.01" defaultValue={0.04} className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-2 px-3 text-[var(--text-main)] text-[10px] outline-none focus:border-[var(--primary)] transition-all shadow-sm" title="Mastered Bonus Amount" />
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div className="pt-4 border-t border-white/5 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2.5 bg-[var(--primary)] text-[#050505] text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-[#FFB35C] transition-colors flex items-center gap-2 group shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]"
                                >
                                    <Save size={18} className="group-hover:scale-110 transition-transform" />
                                    {success ? "Settings Saved!" : "Save Changes"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "appearance" && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                            <h3 className="text-xl font-bold text-[var(--text-main)] tracking-tight border-b border-[var(--glass-border)] pb-3">Appearance & Themes</h3>

                            <div className="space-y-4">
                                {/* Interface Theme */}
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-sm font-bold text-[var(--text-main)]">Interface Theme</label>
                                        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Select your preferred viewing experience.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setTheme("dark")}
                                            className={`p-3 rounded-xl border-2 text-left flex flex-col gap-2 relative overflow-hidden group transition-all ${theme === "dark" ? "border-[var(--primary)] bg-white/[0.05]" : "border-white/5 bg-white/[0.02]"}`}
                                        >
                                            <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 ${theme === "dark" ? "bg-[var(--primary)] border-[var(--background)]" : "border-[var(--text-muted)]"}`}></div>
                                            <Monitor size={20} className={theme === "dark" ? "text-[var(--primary)]" : "text-[var(--text-muted)]"} />
                                            <span className="font-bold text-[var(--text-main)] text-sm">Obsidian Dark</span>
                                            <span className="text-[10px] text-[var(--text-muted)]">Optimized for low-light environments.</span>
                                        </button>
                                        <button
                                            onClick={() => setTheme("light")}
                                            className={`p-3 rounded-xl border-2 text-left flex flex-col gap-2 relative overflow-hidden group transition-all ${theme === "light" ? "border-[var(--primary)] bg-white/[0.05]" : "border-white/5 bg-white/[0.02]"}`}
                                        >
                                            <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 ${theme === "light" ? "bg-[var(--primary)] border-[var(--background)]" : "border-[var(--text-muted)]"}`}></div>
                                            <Monitor size={20} className={theme === "light" ? "text-[var(--primary)]" : "text-[var(--text-muted)]"} />
                                            <span className="font-bold text-[var(--text-main)] text-sm">Industrial Light</span>
                                            <span className="text-[10px] text-[var(--text-muted)]">Clean, high-visibility interface.</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Accent Color */}
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-sm font-bold text-[var(--text-main)]">Brand Accent Color</label>
                                        <p className="text-[10px] text-[#A0A0A0] mt-0.5">Customize the primary highlight color across the platform.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={() => setAccentColor("#E5A54F")} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#E5A54F] transition-all ${accentColor === "#E5A54F" || accentColor === "var(--primary)" ? "border-white scale-110 shadow-[0_0_15px_rgba(229,165,79,0.5)]" : "border-transparent hover:border-white/50"}`} title="Hardwood Gold"></button>
                                        <button onClick={() => setAccentColor("#4F8BE5")} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#4F8BE5] transition-all ${accentColor === "#4F8BE5" ? "border-white scale-110 shadow-[0_0_15px_rgba(79,139,229,0.5)]" : "border-transparent hover:border-white/50"}`} title="Ocean Blue"></button>
                                        <button onClick={() => setAccentColor("#4FE59C")} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#4FE59C] transition-all ${accentColor === "#4FE59C" ? "border-white scale-110 shadow-[0_0_15px_rgba(79,229,156,0.5)]" : "border-transparent hover:border-white/50"}`} title="Emerald Green"></button>
                                        <button onClick={() => setAccentColor("#E54F4F")} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center bg-[#E54F4F] transition-all ${accentColor === "#E54F4F" ? "border-white scale-110 shadow-[0_0_15px_rgba(229,79,79,0.5)]" : "border-transparent hover:border-white/50"}`} title="Crimson Red"></button>
                                    </div>
                                </div>

                                {/* Typography / Animation */}
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-sm font-bold text-[var(--text-main)]">Motion & Effects</label>
                                        <p className="text-[10px] text-[#A0A0A0] mt-0.5">Toggle interface animations and glassmorphism effects.</p>
                                    </div>

                                    <div
                                        onClick={() => setDynamicAnimations(!dynamicAnimations)}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] cursor-pointer hover:border-[var(--primary)]/30 transition-colors shadow-sm"
                                    >
                                        <div>
                                            <h4 className="text-sm font-bold text-[var(--text-main)]">Dynamic Animations</h4>
                                            <p className="text-[10px] text-[#A0A0A0]">Enable hover effects, page transitions, and subtle scaling.</p>
                                        </div>
                                        <div className={`w-12 h-6 rounded-full relative transition-colors ${dynamicAnimations ? "bg-[var(--primary)]" : "bg-white/10"}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${dynamicAnimations ? "right-1 bg-black" : "left-1 bg-[#8E8E93]"}`}></div>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setHighContrast(!highContrast)}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] cursor-pointer hover:border-[var(--primary)]/30 transition-colors shadow-sm"
                                    >
                                        <div>
                                            <h4 className="text-sm font-bold text-[var(--text-main)]">High Contrast Text</h4>
                                            <p className="text-[10px] text-[#A0A0A0]">Increase text contrast for better readability.</p>
                                        </div>
                                        <div className={`w-12 h-6 rounded-full relative transition-colors ${highContrast ? "bg-[var(--primary)]" : "bg-white/10"}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${highContrast ? "right-1 bg-black" : "left-1 bg-[#8E8E93]"}`}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-[var(--glass-border)] flex justify-end">
                                <button
                                    onClick={handleSave}
                                    className="glow-button px-6 py-2.5 text-[10px] uppercase font-bold flex items-center gap-2 group tracking-widest"
                                >
                                    <Save size={14} className="group-hover:scale-110 transition-transform" />
                                    {success ? "Preferences Saved!" : "Save Preferences"}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {(activeTab === "permissions" || activeTab === "notifications" || activeTab === "backup") && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-3xl bg-[var(--glass-bg)] border border-[var(--glass-border)] space-y-4 flex flex-col items-center justify-center py-10 opacity-50 text-center">
                            <Settings size={32} className="text-[#A0A0A0] mb-2" />
                            <h3 className="text-xl font-bold text-[var(--text-main)]">Module Under Construction</h3>
                            <p className="text-sm text-[#A0A0A0] max-w-sm">This settings module is currently being developed and will be available in a future update.</p>
                        </motion.div>
                    )}

                    {/* User Profile Preview (Mock) */}
                    <div className="p-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] border-l-4 border-l-[var(--primary)] shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--primary)]/10 rounded-full"><UserIcon className="text-[var(--primary)]" size={20} /></div>
                            <div>
                                <h4 className="text-sm font-bold text-[var(--text-main)] tracking-tight">Account Administrator</h4>
                                <p className="text-[10px] text-[#A0A0A0] font-medium">You are currently logged in as <span className="uppercase text-[var(--primary)] font-black">{role}</span>.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
