"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { UserCircle, Briefcase, Mail, Shield, CheckCircle2, Award, Zap } from "lucide-react";

export default function MyProfile() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        mastered: 0,
        proficient: 0,
        totalBonus: 0
    });

    useEffect(() => {
        const fetchPersonalStats = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // 1. Fetch Performance Records
                const q = query(collection(db, "performances"), where("employeeId", "==", user.uid));
                const perfSnap = await getDocs(q);

                let mCount = 0;
                let pCount = 0;

                // Group by skill to find highest score
                const highestScores = new Map<string, number>();
                perfSnap.forEach(doc => {
                    const data = doc.data();
                    const current = highestScores.get(data.skillId) || 0;
                    if (data.score > current) highestScores.set(data.skillId, data.score);
                });

                highestScores.forEach(score => {
                    if (score >= 5) mCount++;
                    else if (score >= 3) pCount++;
                });

                // 2. Fetch General Settings for Bonus Calculation
                const settingsRef = doc(db, "settings", "general");
                const settingsSnap = await getDoc(settingsRef);
                const settings = settingsSnap.data() || {};

                const pBonus = Number(settings.proficientBonusAmount) || 0;
                const mBonus = Number(settings.masteredBonusAmount) || 0;

                setStats({
                    mastered: mCount,
                    proficient: pCount,
                    totalBonus: (pCount * pBonus) + (mCount * mBonus)
                });

            } catch (error) {
                console.error("Error fetching profile stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPersonalStats();
    }, [user]);

    if (loading || !profile) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="w-8 h-8 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-2">
            <div className="wood-card p-4 flex flex-col md:flex-row items-center md:items-start gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--primary)]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="relative group">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] shadow-sm flex items-center justify-center text-2xl font-black text-[var(--text-main)] z-10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/20 to-transparent"></div>
                        {profile.name.charAt(0)}
                    </div>
                    <div className="absolute inset-x-2 -bottom-2 h-4 bg-[var(--primary)]/20 blur-xl rounded-full z-0"></div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <div>
                        <h1 className="text-xl font-black text-[var(--text-main)] tracking-tight">{profile.name}</h1>
                        <div className="flex items-center justify-center md:justify-start gap-2 mt-1 text-[#8E8E93] text-[10px] font-bold">
                            <span className="flex items-center gap-1.5"><Briefcase size={12} className="text-[var(--primary)]" /> {profile.position || profile.role}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1.5"><Mail size={12} /> {profile.email}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-2">
                        <div className="bg-[var(--background)] border border-[var(--glass-border)] shadow-sm rounded-xl p-3 flex flex-col justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#8E8E93] flex items-center gap-1.5">
                                <Award size={10} className="text-[#3B82F6]" /> Proficient
                            </span>
                            <span className="text-xl font-black text-[var(--text-main)] mt-1">{stats.proficient}</span>
                        </div>
                        <div className="bg-[var(--background)] border border-[var(--glass-border)] shadow-sm rounded-xl p-3 flex flex-col justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#8E8E93] flex items-center gap-1.5">
                                <Award size={10} className="text-[var(--primary)]" /> Mastered
                            </span>
                            <span className="text-xl font-black text-[var(--primary)] mt-1">{stats.mastered}</span>
                        </div>
                        <div className="bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-xl p-3 flex flex-col justify-between col-span-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)] flex items-center gap-1.5">
                                <Zap size={10} /> Total Earned Bonus
                            </span>
                            <span className="text-xl font-black text-[var(--text-main)] mt-1">${stats.totalBonus.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {/* Placeholder for future specific personal analytics or recent activity */}
                <div className="wood-card p-4">
                    <h2 className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-3">Recent Evaluations</h2>
                    <div className="text-[10px] text-[#8E8E93] italic py-4 text-center border border-dashed border-white/10 rounded-xl">
                        Activity history will appear here.
                    </div>
                </div>

                <div className="wood-card p-4">
                    <h2 className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-3">Account Settings</h2>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--background)] border border-[var(--glass-border)] shadow-sm">
                            <div className="flex items-center gap-2">
                                <Shield size={14} className="text-[#8E8E93]" />
                                <span className="text-[11px] font-bold text-[var(--text-main)]">Password & Security</span>
                            </div>
                            <button className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)] hover:text-[var(--text-main)] transition-colors">Manage</button>
                        </div>
                    </div>
                </div>

                <div className="wood-card p-4">
                    <h2 className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mb-3">Identification Badges</h2>
                    <div className="flex gap-2 flex-wrap">
                        {profile?.identification ? profile.identification.split(',').map((badge: string, i: number) => {
                            const trimmedBadge = badge.trim();
                            if (!trimmedBadge) return null;
                            return (
                                <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--primary)]/10 border border-[var(--primary)]/20 shadow-sm w-fit">
                                    <CheckCircle2 size={12} className="text-[var(--primary)]" />
                                    <span className="text-[9px] font-bold text-white tracking-wide uppercase">{trimmedBadge}</span>
                                </div>
                            );
                        }) : (
                            <div className="w-full text-[10px] text-[#8E8E93] italic py-4 text-center border border-dashed border-white/10 rounded-xl">
                                No identification designations currently on record.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
