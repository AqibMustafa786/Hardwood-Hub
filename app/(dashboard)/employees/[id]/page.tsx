"use client";
import { useState, useEffect, useMemo } from "react";
import { collection, doc, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import {
    Activity,
    ChevronLeft,
    Mail,
    User,
    ShieldCheck,
    FolderGit2,
    Calendar,
    Briefcase
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export default function EmployeeDashboard() {
    const params = useParams();
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const employeeId = params.id as string;

    // Data State
    const [employee, setEmployee] = useState<any>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch All Data
    useEffect(() => {
        if (!user || authLoading || !employeeId) return;

        // Fetch Employee
        const unsubscribeEmp = onSnapshot(doc(db, "users", employeeId), (doc) => {
            if (doc.exists()) {
                setEmployee({ id: doc.id, ...doc.data() });
            }
        }, (err) => {
            console.error("❌ USERS COLLECTION REJECTED:", err);
            setLoading(false);
        });

        // Fetch Categories
        const unsubscribeC = onSnapshot(query(collection(db, "categories"), orderBy("priority")), (snap) => {
            setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => console.error("❌ CATEGORIES COLLECTION REJECTED:", err));

        // Fetch SubCategories
        const unsubscribeSC = onSnapshot(collection(db, "subCategories"), (snap) => {
            setSubCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => console.error("❌ SUBCATEGORIES COLLECTION REJECTED:", err));

        // Fetch Skills
        const unsubscribeS = onSnapshot(collection(db, "skills"), (snap) => {
            setSkills(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => console.error("❌ SKILLS COLLECTION REJECTED:", err));

        // Fetch Performances for THIS employee only
        const qR = query(collection(db, "performances"), where("employeeId", "==", employeeId));
        const unsubscribeR = onSnapshot(qR, (snap) => {
            setReviews(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (err) => {
            console.error("❌ PERFORMANCES COLLECTION REJECTED:", err);
            setLoading(false);
        });

        return () => {
            unsubscribeEmp();
            unsubscribeC();
            unsubscribeSC();
            unsubscribeS();
            unsubscribeR();
        };
    }, [user, authLoading, employeeId]);

    // Derived Logic for Left Panel (Category Progress)
    const categoryProgress = useMemo(() => {
        return categories.map(cat => {
            const relatedSubCatIds = subCategories.filter(sc => sc.categoryId === cat.id).map(sc => sc.id);
            const relatedSkills = skills.filter(s => relatedSubCatIds.includes(s.subCategoryId));

            let totalSkillsCount = relatedSkills.length;
            let masteredOrProficientCount = 0;

            relatedSkills.forEach(skill => {
                const skillReviews = reviews.filter(r => r.skillId === skill.id)
                    .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());

                if (skillReviews.length > 0) {
                    const latest = skillReviews[0];
                    if (latest.level === 'Proficient' || latest.level === 'Mastered') {
                        masteredOrProficientCount++;
                    }
                }
            });

            const percentage = totalSkillsCount === 0 ? 0 : Math.round((masteredOrProficientCount / totalSkillsCount) * 100);

            return {
                id: cat.id,
                name: cat.name,
                percentage,
                totalSkills: totalSkillsCount
            };
        });
    }, [categories, subCategories, skills, reviews]);

    // Derived Logic for Right Panel (SubCategory Skill List)
    const organizedSkillData = useMemo(() => {
        // Only return subcategories that actually contain skills
        return subCategories.map(sc => {
            const relatedSkills = skills.filter(s => s.subCategoryId === sc.id);
            if (relatedSkills.length === 0) return null;

            const skillDetails = relatedSkills.map(skill => {
                const skillReviews = reviews.filter(r => r.skillId === skill.id)
                    .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());

                const latestReview = skillReviews.length > 0 ? skillReviews[0] : null;

                return {
                    id: skill.id,
                    name: skill.name,
                    level: latestReview ? latestReview.level : 'Untested',
                    reviewCount: skillReviews.length,
                    dateReviewed: latestReview ? new Date(latestReview.evaluatedAt).toLocaleDateString() : '--',
                    supervisor: latestReview ? latestReview.evaluatorName : '--'
                };
            });

            // Skip subcategory if no skills inside it have reviews to make it cleaner,
            // or just show all skills if preferred. We will show all skills under the subcategory.

            return {
                id: sc.id,
                name: sc.name,
                skills: skillDetails
            };
        }).filter(sc => sc !== null);
    }, [subCategories, skills, reviews]);


    if (loading || !employee) {
        return (
            <div className="h-[50vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 border-2 border-[var(--primary)]/10 border-t-[var(--primary)] rounded-full animate-spin"></div>
                    <span className="text-[#8E8E93] text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Loading Data...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-[1600px] mx-auto min-h-[calc(100vh-100px)]">
            {/* Header & Back Button */}
            {/* Header & Back Button */}
            <div className="flex items-center gap-3 relative z-10 mb-2">
                <button
                    onClick={() => router.push('/employees')}
                    title="Back to Employees"
                    className="h-8 px-3 flex items-center justify-center gap-1.5 rounded-lg bg-white/5 border border-white/10 text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors shadow-lg text-[10px] uppercase font-bold tracking-widest"
                >
                    <ChevronLeft size={14} /> Back
                </button>
            </div>

            <div className="flex flex-col xl:flex-row gap-4">
                {/* Left Panel - Details & Category Rings */}
                <div className="w-full xl:w-[320px] flex flex-col gap-4">
                    {/* Details Card */}
                    <div className="premium-card !p-0 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-[var(--primary)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>

                        <div className="p-3 border-b border-white/5 bg-white/[0.02]">
                            <h2 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8E8E93]">Details</h2>
                        </div>

                        <div className="relative w-full h-32 bg-[#050505] overflow-hidden border-b border-white/5">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 z-0"></div>
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] z-0">
                                <span className="font-black text-[var(--primary)] text-5xl opacity-20">
                                    {employee.email ? employee.email.charAt(0).toUpperCase() : employee.name?.charAt(0)}
                                </span>
                            </div>
                            {employee.photoURL && employee.photoURL.startsWith('http') && (
                                <img
                                    src={employee.photoURL}
                                    alt={employee.name}
                                    className="absolute inset-0 w-full h-full object-cover opacity-80 z-10"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            )}
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0D0D0D] to-transparent z-20"></div>
                        </div>

                        <div className="p-4 relative z-10 space-y-2">
                            <div>
                                <h2 className="text-lg font-black text-white tracking-tight">{employee.name}</h2>
                                <p className="text-[#8E8E93] text-[10px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                                    <Briefcase size={12} className="text-[var(--primary)]/60" /> {employee.position}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 pt-3 border-t border-white/5 text-[10px] text-[#8E8E93]">
                                <Mail size={12} className="text-[var(--primary)]" />
                                {employee.email}
                            </div>
                        </div>
                    </div>

                    {/* Category Rings */}
                    <div className="premium-card overflow-hidden !p-0 relative">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

                        <div className="grid grid-cols-2 gap-px bg-white/5">
                            {categoryProgress.map((cat, idx) => (
                                <div key={cat.id} className="bg-[#0D0D0D] p-3 flex flex-col items-center justify-center gap-2 group">
                                    <div className="relative w-16 h-16 flex items-center justify-center">
                                        {/* SVG Circle */}
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                            {/* Background Circle */}
                                            <circle
                                                cx="50" cy="50" r="40"
                                                fill="transparent"
                                                stroke="rgba(255,255,255,0.05)"
                                                strokeWidth="6"
                                            />
                                            {/* Progress Circle */}
                                            <motion.circle
                                                initial={{ strokeDashoffset: 251.2 }}
                                                animate={{ strokeDashoffset: 251.2 - (251.2 * cat.percentage) / 100 }}
                                                transition={{ duration: 1.5, ease: "easeOut", delay: idx * 0.1 }}
                                                cx="50" cy="50" r="40"
                                                fill="transparent"
                                                stroke="var(--primary)"
                                                strokeWidth="6"
                                                strokeLinecap="round"
                                                strokeDasharray="251.2"
                                                className="drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                                            <span className="text-sm font-black text-white">{cat.percentage}%</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest text-center group-hover:text-white transition-colors">
                                        {cat.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 min-w-0 w-full flex flex-col relative overflow-hidden h-fit max-h-[calc(100vh-140px)]">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02] sticky top-0 z-20 backdrop-blur-3xl flex items-center justify-between">
                        <h2 className="text-base font-black text-white tracking-tight">Employee <span className="text-[#8E8E93] text-[10px] ml-1 font-medium">Performance Matrix</span></h2>
                    </div>

                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <div className="min-w-max w-full">
                            {/* Header Row */}
                            <div className="grid grid-cols-[1fr_150px_100px_150px_200px] border-b border-white/5 bg-[#0D0D0D] sticky top-0 z-10 shadow-[0_4px_10px_-4px_rgba(0,0,0,0.5)]">
                                <div className="py-2 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#8E8E93]">Skill</div>
                                <div className="py-2 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#8E8E93]">Current Level</div>
                                <div className="py-2 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#8E8E93]">Reviewed</div>
                                <div className="py-2 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#8E8E93]">Date Reviewed</div>
                                <div className="py-2 px-3 text-[9px] font-black uppercase tracking-[0.2em] text-[#8E8E93]">Supervisor</div>
                            </div>

                            {/* Data Rows */}
                            <div className="divide-y divide-white/5">
                                {organizedSkillData.length === 0 ? (
                                    <div className="p-8 text-center text-[#8E8E93] text-[10px] uppercase tracking-widest font-black">
                                        No Training Data Found
                                    </div>
                                ) : organizedSkillData.map(group => (
                                    <div key={group?.id}>
                                        {/* SubCategory Header */}
                                        <div className="py-2 px-3 bg-white/[0.02] flex items-center gap-2 w-full border-b border-white/5">
                                            <FolderGit2 size={12} className="text-[var(--primary)]" />
                                            <span className="font-bold text-[var(--primary)] tracking-wide text-xs">{group?.name}</span>
                                            <span className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[9px] font-black text-white shadow-inner">{group?.skills.length}</span>
                                        </div>

                                        {/* Grouped Skills */}
                                        <div className="divide-y divide-white/[0.02]">
                                            {group?.skills.map((skill, idx) => (
                                                <div key={skill.id} className="grid grid-cols-[1fr_150px_100px_150px_200px] hover:bg-white/[0.02] transition-colors group/row items-center border-l-2 border-transparent hover:border-[var(--primary)]">
                                                    {/* Skill Name */}
                                                    <div className="py-2.5 px-3 text-[11px] font-medium text-white group-hover/row:text-[var(--primary)] transition-colors">
                                                        {skill.name}
                                                    </div>

                                                    {/* Current Skill Level */}
                                                    <div className="py-2.5 px-3">
                                                        <span className={`px-2 py-1 min-w-[70px] inline-flex items-center justify-center text-[9px] font-black uppercase tracking-widest rounded shadow-sm
                                                            ${skill.level === 'Mastered' ? 'bg-[var(--primary-hover)]/10 text-[var(--primary)] border border-[var(--primary-hover)]/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]' : ''}
                                                            ${skill.level === 'Proficient' ? 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20' : ''}
                                                            ${skill.level === 'Learning' ? 'bg-white/10 text-white border border-white/10' : ''}
                                                            ${skill.level === 'Untested' ? 'bg-transparent text-[#8E8E93] border border-transparent' : ''}
                                                        `}>
                                                            {skill.level}
                                                        </span>
                                                    </div>

                                                    {/* Reviewed Count */}
                                                    <div className="py-2.5 px-3 text-[11px] text-[#A0A0A0] font-bold">
                                                        {skill.reviewCount}
                                                    </div>

                                                    {/* Date Reviewed */}
                                                    <div className="py-2.5 px-3 text-[11px] text-[#A0A0A0] flex items-center gap-1.5">
                                                        {skill.dateReviewed !== '--' && <Calendar size={10} className="text-[#8E8E93]" />}
                                                        {skill.dateReviewed}
                                                    </div>

                                                    {/* Supervisor */}
                                                    <div className="py-2.5 px-3 text-[11px] text-[#A0A0A0]">
                                                        {skill.supervisor}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
