"use client";
import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Search, Filter } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type GroupByOption = "Supervisor" | "Date Reviewed" | "Employee";

export default function AdminDashboardPage() {
    const { user, role, loading: authLoading } = useAuth();
    const [reviews, setReviews] = useState<any[]>([]);
    const [groupBy, setGroupBy] = useState<GroupByOption>("Supervisor");
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Required for the legacy columns matching
    const [skills, setSkills] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);

    useEffect(() => {
        if (!user || authLoading) return;

        // Fetch core data needed for the exact legacy table columns
        const unsubSkills = onSnapshot(collection(db, "skills"), snap => {
            setSkills(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubSubCats = onSnapshot(collection(db, "subCategories"), snap => {
            setSubCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubCats = onSnapshot(collection(db, "categories"), snap => {
            setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        // Fetch all performances
        const qR = query(collection(db, "performances"), orderBy("evaluatedAt", "desc"));
        const unsubscribeR = onSnapshot(qR, (snapshot) => {
            setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubSkills(); unsubSubCats(); unsubCats(); unsubscribeR(); };
    }, [user, authLoading]);

    if (role !== "superAdmin" && role !== "supervisor") {
        return <div className="p-8 text-center text-[#8E8E93] font-bold tracking-widest uppercase">Access Denied. Admins Only.</div>;
    }

    const toggleGroup = (groupKey: string) => {
        setExpandedGroups(prev =>
            prev.includes(groupKey) ? prev.filter(k => k !== groupKey) : [...prev, groupKey]
        );
    };

    // Enrich reviews with category/subcategory names for the table
    const enrichedReviews = reviews.map(rev => {
        const skill = skills.find(s => s.id === rev.skillId);
        const subCategory = subCategories.find(sc => sc.id === skill?.subCategoryId);
        const category = categories.find(c => c.id === subCategory?.categoryId);

        return {
            ...rev,
            categoryName: category?.name || "Unknown",
            subCategoryName: subCategory?.name || "Unknown",
            // Assuming 1 review = 1 for the 'Reviewed' column based on screenshot
            reviewedCount: 1
        };
    }).filter(rev => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (rev.employeeName || "").toLowerCase().includes(term) ||
            (rev.evaluatorName || "").toLowerCase().includes(term) ||
            (rev.skillName || "").toLowerCase().includes(term)
        );
    });

    // Grouping Logic
    const groupedData = enrichedReviews.reduce((acc, rev) => {
        let key = "Unknown";
        if (groupBy === "Supervisor") key = rev.evaluatorName || "Unknown Supervisor";
        if (groupBy === "Employee") key = rev.employeeName || "Unknown Employee";
        if (groupBy === "Date Reviewed") {
            key = rev.evaluatedAt ? new Date(rev.evaluatedAt).toLocaleDateString() : "Unknown Date";
        }

        if (!acc[key]) acc[key] = [];
        acc[key].push(rev);
        return acc;
    }, {} as Record<string, any[]>);

    const sortedGroupKeys = Object.keys(groupedData).sort((a, b) => {
        if (groupBy === "Date Reviewed") {
            return new Date(b).getTime() - new Date(a).getTime();
        }
        return a.localeCompare(b);
    });

    return (
        <div className="space-y-4 animate-fade-in">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 w-full md:w-auto overflow-x-auto no-scrollbar">
                    {(["Supervisor", "Date Reviewed", "Employee"] as GroupByOption[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setGroupBy(tab); setExpandedGroups([]); }}
                            className={cn(
                                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                groupBy === tab
                                    ? "bg-[var(--primary)] text-[#050505] shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                                    : "text-[#8E8E93] hover:text-white hover:bg-white/5"
                            )}
                        >
                            By {tab}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={14} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-9 pr-4 outline-none focus:border-[var(--primary)] text-white text-[11px] transition-all placeholder:text-[#8E8E93]"
                    />
                </div>
            </div>

            {/* Master Group List */}
            <div className="space-y-2">
                {sortedGroupKeys.length === 0 ? (
                    <div className="p-8 text-center text-[#8E8E93] text-[11px] font-bold uppercase tracking-widest banner-glow rounded-2xl border border-white/5">
                        No logs match your current filters.
                    </div>
                ) : (
                    sortedGroupKeys.map((groupKey) => {
                        const items = groupedData[groupKey];
                        const isExpanded = expandedGroups.includes(groupKey);

                        return (
                            <div key={groupKey} className="premium-card !p-0 overflow-hidden border border-white/5 transition-all">
                                {/* Group Header (Clickable) */}
                                <button
                                    onClick={() => toggleGroup(groupKey)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 bg-white/[0.01] hover:bg-white/[0.03] transition-colors",
                                        isExpanded && "bg-white/[0.04] border-b border-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn("text-[#8E8E93] transition-transform duration-300", isExpanded && "rotate-90 text-[var(--primary)]")}>
                                            <ChevronRight size={18} />
                                        </div>
                                        <h3 className="text-sm font-bold text-white tracking-tight">{groupKey}</h3>
                                        <span className="px-2 py-0.5 bg-white/10 rounded-md text-[10px] font-black text-[#8E8E93]">
                                            {items.length}
                                        </span>
                                    </div>
                                    <span className="text-[9px] uppercase tracking-widest font-bold text-[var(--primary)] opacity-0 group-hover:opacity-100 transition-opacity">View Logs</span>
                                </button>

                                {/* Expanded Inner Table */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-0 overflow-x-auto custom-scrollbar">
                                                <table className="w-full text-left border-collapse min-w-[800px]">
                                                    <thead>
                                                        <tr className="border-b border-white/5 bg-black/40">
                                                            <th className="p-3 text-[10px] font-black uppercase text-[#8E8E93] tracking-wider whitespace-nowrap pl-5">Employee</th>
                                                            <th className="p-3 text-[10px] font-black uppercase text-[#8E8E93] tracking-wider whitespace-nowrap">Category</th>
                                                            <th className="p-3 text-[10px] font-black uppercase text-[#8E8E93] tracking-wider whitespace-nowrap">Sub Category</th>
                                                            <th className="p-3 text-[10px] font-black uppercase text-[#8E8E93] tracking-wider">Skill</th>
                                                            <th className="p-3 text-[10px] font-black uppercase text-[#8E8E93] tracking-wider whitespace-nowrap text-center">Reviewed</th>
                                                            <th className="p-3 text-[10px] font-black uppercase text-[#8E8E93] tracking-wider whitespace-nowrap">Supervisor</th>
                                                            <th className="p-3 text-[10px] font-black uppercase text-[#8E8E93] tracking-wider whitespace-nowrap pr-5">Current Skill Level</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {items.map((log) => (
                                                            <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                                                                <td className="p-3 pl-5">
                                                                    <span className="text-xs font-bold text-white tracking-tight">{log.employeeName}</span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="text-[10px] text-[#8E8E93] uppercase tracking-widest font-bold">{log.categoryName}</span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="text-[10px] text-[#8E8E93] uppercase tracking-widest font-bold">{log.subCategoryName}</span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="text-[11px] text-white/80 font-medium leading-tight line-clamp-2" title={log.skillName}>{log.skillName}</span>
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    <span className="text-[10px] text-[#8E8E93] font-black">{log.reviewedCount}</span>
                                                                </td>
                                                                <td className="p-3">
                                                                    <span className="text-xs font-bold text-white/90">{log.evaluatorName}</span>
                                                                </td>
                                                                <td className="p-3 pr-5">
                                                                    <span
                                                                        className="inline-block px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-[0.1em] border shadow-sm whitespace-nowrap w-24 text-center"
                                                                        style={{
                                                                            color: log.color || "white",
                                                                            backgroundColor: `${log.color}15` || "rgba(255,255,255,0.1)",
                                                                            borderColor: `${log.color}30` || "rgba(255,255,255,0.2)"
                                                                        }}
                                                                    >
                                                                        {log.level}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
