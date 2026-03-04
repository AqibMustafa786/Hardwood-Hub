"use client";
import { NavbarPortal } from "@/components/NavbarPortal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Users,
    Award,
    Star,
    Clock,
    TrendingUp,
    ArrowUpRight,
    ChevronRight,
    Plus,
    Calendar
} from "lucide-react";
import dynamic from "next/dynamic";

const ReviewActivityChart = dynamic(() => import("@/components/ReviewActivityChart"), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><div className="w-4 h-4 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div></div>
});

const SkillProficiencyChart = dynamic(() => import("@/components/SkillProficiencyChart"), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><div className="w-4 h-4 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div></div>
});

import RecentActivityFeed from "@/components/RecentActivityFeed";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Data moved to ReviewActivityChart component

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
    const { profile } = useAuth();
    const router = useRouter();
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [counts, setCounts] = useState({
        employees: 0,
        categories: 0,
        subCategories: 0,
        skills: 0
    });
    const [allCategories, setAllCategories] = useState<any[]>([]);
    const [allSubCategories, setAllSubCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        // Fetch counts and full data for explorer
        // Utilizing a single state object update where possible or just leaving simple snapshots
        const unsubUsers = onSnapshot(collection(db, "users"), snap => setCounts(prev => ({ ...prev, employees: snap.size })));

        const unsubCats = onSnapshot(collection(db, "categories"), snap => {
            const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllCategories(cats);
            setCounts(prev => ({ ...prev, categories: snap.size }));
            setSelectedCategoryId(prevId => prevId || (cats.length > 0 ? cats[0].id : null));
        });

        const unsubSubCats = onSnapshot(collection(db, "subCategories"), snap => {
            const subs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllSubCategories(subs);
            setCounts(prev => ({ ...prev, subCategories: snap.size }));
        });

        // We only really need performances, users, and skills for the leaderboards. 
        // We will store them in sessionStorage to avoid main thread react-state bloat if not needed for render
        const unsubPerformances = onSnapshot(collection(db, "performances"), snap => {
            // Unused locally, TopEmployeesLeaderboard will fetch its own
        });

        // Fetch Users for Leaderboards
        const unsubUsersComplete = onSnapshot(collection(db, "users"), snap => {
            const usrs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            window.sessionStorage.setItem('tempUsers', JSON.stringify(usrs));
        });

        const unsubSkillsComplete = onSnapshot(collection(db, "skills"), snap => {
            const skls = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            window.sessionStorage.setItem('tempSkills', JSON.stringify(skls));
            setCounts(prev => ({ ...prev, skills: snap.size }));
        });

        return () => {
            clearInterval(timer);
            unsubUsers();
            unsubCats();
            unsubSubCats();
            unsubPerformances();
            unsubUsersComplete();
            unsubSkillsComplete();
        };
    }, []);

    const formatTime = (date: Date | null) => {
        if (!date) return { time: "00:00", ampm: "AM" };
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const minutesStr = minutes < 10 ? '0' + minutes : minutes;
        const hoursStr = hours < 10 ? '0' + hours : hours;
        return { time: `${hoursStr}:${minutesStr}`, ampm };
    };

    const timeParts = formatTime(currentTime);

    const stats = [
        { label: "Total Employees", value: counts.employees.toString(), icon: Users, color: "var(--primary)", trend: "Live" },
        { label: "Total Categories", value: counts.categories.toString(), icon: Award, color: "#1B4332", trend: "Live" },
        { label: "Sub Categories", value: counts.subCategories.toString(), icon: Clock, color: "var(--primary)", trend: "Live" },
        { label: "Total Skills", value: counts.skills.toString(), icon: Star, color: "#FFB35C", trend: "Live" },
    ];

    return (
        <div className="space-y-4">
            <NavbarPortal>
                <button
                    onClick={() => router.push('/performance')}
                    className="glow-button px-5 py-2.5 flex items-center gap-2 active:scale-95 transition-all shadow-sm group overflow-hidden relative mr-2"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <Plus size={14} strokeWidth={2.5} className="group-hover:rotate-180 transition-transform duration-700" />
                    <span className="uppercase tracking-[0.2em] font-black text-[9px]">Execute Review</span>
                </button>
            </NavbarPortal>



            {/* KPI Metrics */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"
            >
                {stats.map((stat, i) => (
                    <motion.div key={stat.label} variants={itemVariants} className="premium-card group p-3 xl:p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-[12px] bg-[#0D0D0D] border-2 border-white/5 flex items-center justify-center text-[var(--primary)] group-hover:border-[var(--primary)]/40 group-hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] transition-all duration-700 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                                <stat.icon size={20} strokeWidth={1.5} className="relative z-10" />
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[var(--primary)] px-2.5 py-1 bg-[var(--primary)]/10 rounded-md">{stat.trend}</span>
                                <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: i % 2 === 0 ? "75%" : "45%" }}
                                        transition={{ duration: 1.5, delay: i * 0.2 }}
                                        className="h-full bg-[var(--primary)]"
                                    ></motion.div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-0.5 mt-1">
                            <h3 className="text-[#8E8E93] text-[8px] font-black uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 transition-opacity">{stat.label}</h3>
                            <p className="text-lg font-black text-[var(--text-main)] tracking-tighter uppercase">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* Visual Intelligence Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 premium-card flex flex-col p-4 xl:p-5 h-[350px]">
                    <div className="mb-3 flex items-start justify-between">
                        <div>
                            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] mb-2">
                                <TrendingUp size={16} />
                            </div>
                            <h3 className="text-base font-bold text-white tracking-tight">Review Activity</h3>
                            <p className="text-[9px] text-[#8E8E93] font-medium mt-0.5 uppercase tracking-wider">6-Month Rolling Performance</p>
                        </div>
                    </div>
                    <div className="flex-1 -mx-4 min-h-[150px]">
                        <ReviewActivityChart />
                    </div>
                </div>

                {/* Company Proficiency Donut */}
                <div className="premium-card flex flex-col p-4 xl:p-5 h-[350px]">
                    <div className="mb-3">
                        <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] mb-2">
                            <Star size={16} />
                        </div>
                        <h3 className="text-base font-bold text-white tracking-tight">Proficiency Matrix</h3>
                        <p className="text-[9px] text-[#8E8E93] font-medium mt-0.5 uppercase tracking-wider">Company Wide Skill Distribution</p>
                    </div>
                    <div className="flex-1 -mx-4 relative min-h-[150px]">
                        <SkillProficiencyChart />
                    </div>
                </div>
            </div>

            {/* Secondary Intel Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

                {/* Category Explorer */}
                <div className="lg:col-span-2 premium-card p-4 xl:p-5 overflow-hidden flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white tracking-tight">Category Explorer</h3>
                            <p className="text-[11px] text-[#8E8E93] font-medium mt-1 uppercase tracking-wider">Sub-category Breakdown per Parent Category</p>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar shrink-0">
                        {allCategories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    selectedCategoryId === cat.id
                                        ? "bg-[var(--primary)] text-[#050505] shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                                        : "bg-white/5 text-[#8E8E93] hover:text-white hover:bg-white/10"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence mode="popLayout">
                            {allSubCategories
                                .filter(sub => sub.categoryId === selectedCategoryId)
                                .map((sub) => (
                                    <motion.div
                                        key={sub.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col gap-1 hover:border-[var(--primary)]/20 transition-all shrink-0"
                                    >
                                        <span className="text-[10px] font-bold text-white uppercase tracking-tight line-clamp-1">{sub.name}</span>
                                        <span className="text-[8px] text-[#8E8E93] uppercase tracking-widest">Sub Category</span>
                                    </motion.div>
                                ))}
                        </AnimatePresence>
                        {allSubCategories.filter(sub => sub.categoryId === selectedCategoryId).length === 0 && (
                            <div className="col-span-full py-8 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10 shrink-0">
                                <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">No Sub-categories Configured</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="premium-card flex flex-col p-4 xl:p-5 h-[400px]">
                    <div className="mb-4">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-2">
                            <Clock size={16} />
                        </div>
                        <h3 className="text-base font-bold text-white tracking-tight">Recent Activity</h3>
                        <p className="text-[9px] text-[#8E8E93] font-medium mt-0.5 uppercase tracking-wider">Live Performance Feed</p>
                    </div>
                    <RecentActivityFeed />

                    <button onClick={() => router.push('/performance')} className="w-full mt-auto py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
                        View Full History <ChevronRight size={12} />
                    </button>
                </div>
            </div>

            {/* Top Employees Leaderboards */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                {allCategories.slice(0, 4).map(category => (
                    <div key={category.id} className="premium-card p-0 overflow-hidden">
                        <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <div className="flex items-center gap-3">
                                <Award className="text-[var(--primary)]" size={18} />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">{category.name} <span className="text-[#8E8E93] text-[9px] ml-2">Leaderboard</span></h3>
                            </div>
                            <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest px-2.5 py-1 bg-white/5 rounded-md">Top 3</span>
                        </div>
                        <div className="p-3">
                            <TopEmployeesLeaderboard categoryId={category.id} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Sub-component for calculating and displaying the leaderboard
function TopEmployeesLeaderboard({ categoryId }: { categoryId: string }) {
    const [leaders, setLeaders] = useState<any[]>([]);

    useEffect(() => {
        // In a real app, this aggregate calculation would happen via a Cloud Function or complex backend query.
        // Doing it client-side here for the prototype speed.
        try {
            const usersStr = window.sessionStorage.getItem('tempUsers');
            const skillsStr = window.sessionStorage.getItem('tempSkills');
            if (!usersStr || !skillsStr) return;

            const users = JSON.parse(usersStr);
            const skills = JSON.parse(skillsStr).filter((s: any) => s.categoryId === categoryId);
            const skillIds = skills.map((s: any) => s.id);

            // Fetch performances just for these skills
            getDocs(query(collection(db, "performances"))).then((snap: any) => {
                const perfs = snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() as any }));

                const scoresMap = new Map<string, number>(); // employeeId -> total mastered/proficient score

                users.forEach((user: any) => {
                    let mastered = 0;
                    let proficient = 0;

                    skillIds.forEach((skillId: string) => {
                        const userPerfs = perfs.filter((p: any) => p.employeeId === user.id && p.skillId === skillId);
                        if (userPerfs.length === 0) return;

                        const highestScore = Math.max(...userPerfs.map((p: any) => p.score));
                        if (highestScore >= 5) mastered++;
                        else if (highestScore >= 3) proficient++;
                    });

                    if (mastered > 0 || proficient > 0) {
                        scoresMap.set(user.id, { user, mastered, proficient, totalWeight: (mastered * 2) + proficient } as any);
                    }
                });

                const sortedLeaders = Array.from(scoresMap.values())
                    .sort((a: any, b: any) => b.totalWeight - a.totalWeight)
                    .slice(0, 3);

                setLeaders(sortedLeaders);
            });
        } catch (e) { }
    }, [categoryId]);

    if (leaders.length === 0) {
        return <div className="py-6 text-center text-[#8E8E93] text-[11px] font-bold uppercase tracking-widest">No achievements yet</div>;
    }

    return (
        <div className="space-y-3">
            {leaders.map((leader: any, idx: number) => (
                <div key={leader.user.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm relative",
                            idx === 0 ? "bg-[#FFB35C]/20 text-[#FFB35C] border border-[#FFB35C]/30 shadow-[0_0_15px_rgba(255,179,92,0.2)]" :
                                idx === 1 ? "bg-zinc-300/20 text-zinc-300 border border-zinc-300/30" :
                                    "bg-[#CD7F32]/20 text-[#CD7F32] border border-[#CD7F32]/30"
                        )}>
                            #{idx + 1}
                            {idx === 0 && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFB35C] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FFB35C]"></span>
                            </span>}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white tracking-tight leading-tight">{leader.user.name}</p>
                            <p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest mt-0.5">{leader.user.position || 'Employee'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20" title="Mastered Skills">
                            <span className="text-[10px] font-bold text-[var(--primary)]">{leader.mastered}</span>
                            <span className="text-[7px] font-black uppercase text-[var(--primary)]/70">MST</span>
                        </div>
                        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20" title="Proficient Skills">
                            <span className="text-[10px] font-bold text-[#3B82F6]">{leader.proficient}</span>
                            <span className="text-[7px] font-black uppercase text-[#3B82F6]/70">PRO</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
