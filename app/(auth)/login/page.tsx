"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ArrowRight, Hexagon, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/");
        } catch (err: any) {
            console.error("Login Error:", err);
            setError(`Authentication Failed: ${err.code || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#050505] relative overflow-hidden font-sans">
            {/* Architectural Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--primary)]/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[var(--primary)]/5 blur-[150px] rounded-full"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-[0.03]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-[440px] relative z-10"
            >
                {/* Brand Identity */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ rotate: -10, scale: 0.8 }}
                        animate={{ rotate: 0, scale: 1 }}
                        className="inline-flex items-center justify-center w-20 h-20 relative mb-8"
                    >
                        <div className="absolute inset-0 bg-[var(--primary)] blur-2xl opacity-20 animate-pulse"></div>
                        <div className="relative w-full h-full bg-[#1A1A1A] border border-white/10 rounded-[28%] flex items-center justify-center shadow-2xl">
                            <Hexagon className="text-[var(--primary)]" size={36} fill="currentColor" fillOpacity={0.1} />
                            <span className="absolute text-white font-black text-xl">H</span>
                        </div>
                    </motion.div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Hardwood Hub</h1>
                    <div className="flex items-center justify-center gap-2">
                        <div className="h-[1px] w-4 bg-white/10"></div>
                        <p className="text-[#8E8E93] text-[10px] uppercase tracking-[0.4em] font-black">Personnel Gateway</p>
                        <div className="h-[1px] w-4 bg-white/10"></div>
                    </div>
                </div>

                {/* Secure Entry Form */}
                <div className="premium-glass p-10 rounded-[40px] border border-white/5 relative group">
                    <div className="absolute -inset-[1px] bg-gradient-to-tr from-[var(--primary)]/10 to-transparent rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                    <form onSubmit={handleLogin} className="space-y-8 relative z-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.2em] ml-1">Authentication ID</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within/input:text-[var(--primary)] transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Employee Email"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pl-14 pr-4 text-white placeholder:text-[#8E8E93]/30 outline-none focus:border-[var(--primary)]/30 focus:bg-white/[0.05] transition-all text-sm font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-[#8E8E93] uppercase tracking-[0.2em] ml-1">Secure Passkey</label>
                            <div className="relative group/input">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within/input:text-[var(--primary)] transition-colors" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 pl-14 pr-4 text-white placeholder:text-[#8E8E93]/30 outline-none focus:border-[var(--primary)]/30 focus:bg-white/[0.05] transition-all text-sm font-medium"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-[11px] font-bold text-center flex items-center justify-center gap-2"
                            >
                                <ShieldCheck size={14} />
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full glow-button py-5 flex items-center justify-center gap-3 group active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    <span>Establish Session</span>
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Logistics */}
                <div className="mt-12 text-center space-y-4">
                    <div className="flex items-center justify-center gap-6 opacity-30">
                        <div className="h-[1px] w-12 bg-white"></div>
                        <ShieldCheck size={20} className="text-white" />
                        <div className="h-[1px] w-12 bg-white"></div>
                    </div>
                    <p className="text-[#8E8E93] text-[9px] uppercase tracking-[0.5em] font-black opacity-40">
                        Secure Industrial Terminal &copy; 2026
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
