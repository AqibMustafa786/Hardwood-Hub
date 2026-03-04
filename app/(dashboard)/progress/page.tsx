"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, getDoc, doc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Award, Filter, User, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";

interface Employee { id: string; name: string; email: string; }
interface Category { id: string; name: string; }
interface SubCategory { id: string; categoryId: string; name: string; }
interface Skill { id: string; categoryId: string; subCategoryId: string; name: string; }
interface Performance { id: string; skillId: string; employeeId: string; score: number; }
interface Settings {
    proficientBonusAmount: number;
    masteredBonusAmount: number;
}

export default function ProgressDashboard() {
    const { user, profile, hasPermission } = useAuth();

    // Raw Data State
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [skills, setSkills] = useState<Skill[]>([]);
    const [performances, setPerformances] = useState<Performance[]>([]);
    const [settings, setSettings] = useState<Settings>({ proficientBonusAmount: 0.03, masteredBonusAmount: 0.04 });
    const [loading, setLoading] = useState(true);

    // Filter State
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
    const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("");

    const isAdminOrSupervisor = hasPermission("employees.manage") || hasPermission("performance.manage");

    useEffect(() => {
        if (!user) return;

        // If regular employee, set their ID and lock it
        if (!isAdminOrSupervisor && profile) {
            setSelectedEmployeeId(user.uid);
        }

        const fetchAllData = async () => {
            setLoading(true);
            try {
                // Fetch Settings (Mocked from previous implementation plan, replace with actual fetch if available)
                // Assuming defaults for now, could be fetched from a central settings doc
                setSettings({ proficientBonusAmount: 0.03, masteredBonusAmount: 0.04 });

                const [empSnap, catSnap, subSnap, skillSnap, perfSnap] = await Promise.all([
                    getDocs(collection(db, "users")),
                    getDocs(collection(db, "categories")),
                    getDocs(collection(db, "subCategories")),
                    getDocs(collection(db, "skills")),
                    getDocs(collection(db, "performances"))
                ]);

                setEmployees(empSnap.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
                setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
                setSubCategories(subSnap.docs.map(d => ({ id: d.id, ...d.data() } as SubCategory)));
                setSkills(skillSnap.docs.map(d => ({ id: d.id, ...d.data() } as Skill)));
                setPerformances(perfSnap.docs.map(d => ({ id: d.id, ...d.data() } as Performance)));

            } catch (error) {
                console.error("Error fetching progress data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [user, profile, isAdminOrSupervisor]);

    // Cascading Dropdown Logic
    const availableCategories = useMemo(() => {
        // In the future, this could be filtered by the selected employee's actual accessed categories
        return categories;
    }, [categories]);

    const availableSubCategories = useMemo(() => {
        if (!selectedCategoryId) return subCategories;
        return subCategories.filter(sc => sc.categoryId === selectedCategoryId);
    }, [subCategories, selectedCategoryId]);

    // Matrix Calculation Logic
    const progressData = useMemo(() => {
        if (!selectedEmployeeId) return [];

        const employeePerformances = performances.filter(p => p.employeeId === selectedEmployeeId);

        // Calculate highest score per skill for this employee
        const skillScores = new Map<string, number>();
        employeePerformances.forEach(p => {
            const current = skillScores.get(p.skillId) || 0;
            if (p.score > current) {
                skillScores.set(p.skillId, p.score);
            }
        });

        // Group by Category
        const results = availableCategories.map(cat => {
            if (selectedCategoryId && cat.id !== selectedCategoryId) return null;

            const catSubCategories = availableSubCategories.filter(sc => sc.categoryId === cat.id);
            if (selectedSubCategoryId && !catSubCategories.find(sc => sc.id === selectedSubCategoryId)) return null;

            const catSkills = skills.filter(s => s.categoryId === cat.id);

            let proficientCount = 0;
            let masteredCount = 0;
            let remainingSkillsList: Skill[] = [];

            catSkills.forEach(skill => {
                // If subcategory is selected, filter skills
                if (selectedSubCategoryId && skill.subCategoryId !== selectedSubCategoryId) return;

                const score = skillScores.get(skill.id) || 0;

                // Assuming 3 = Proficient, 5 = Mastered based on Performance page logic
                if (score >= 5) {
                    masteredCount++;
                } else if (score >= 3) {
                    proficientCount++;
                    remainingSkillsList.push(skill);
                } else {
                    remainingSkillsList.push(skill);
                }
            });

            const bonusEarned = (proficientCount * settings.proficientBonusAmount) + (masteredCount * settings.masteredBonusAmount);

            return {
                category: cat,
                subCategoryCount: catSubCategories.length,
                totalSkills: catSkills.length,
                proficientCount,
                masteredCount,
                bonusEarned,
                remainingSkills: remainingSkillsList
            };
        }).filter(Boolean);

        return results;
    }, [selectedEmployeeId, selectedCategoryId, selectedSubCategoryId, availableCategories, availableSubCategories, skills, performances, settings]);

    // Aggregate Totals
    const totalBonus = progressData.reduce((sum, data) => sum + (data?.bonusEarned || 0), 0);
    const totalMastered = progressData.reduce((sum, data) => sum + (data?.masteredCount || 0), 0);
    const totalProficient = progressData.reduce((sum, data) => sum + (data?.proficientCount || 0), 0);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="w-8 h-8 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Progress Actions */}

            {/* Cascading Filters (PD_Filters) */}
            <div className="wood-card !p-4">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                    <Filter className="text-[var(--primary)]" size={14} />
                    <h2 className="text-xs font-bold text-white uppercase tracking-widest">Dashboard Filters</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2 relative">
                        <label className="text-xs font-bold text-[#8E8E93] ml-1 uppercase tracking-wider">Employee</label>
                        <div className="relative">
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                disabled={!isAdminOrSupervisor}
                                className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-lg py-2 px-3 text-[var(--text-main)] text-[10px] outline-none focus:border-[var(--primary)] focus:shadow-sm transition-all appearance-none disabled:opacity-50 cursor-pointer shadow-sm"
                                title="Select Employee"
                            >
                                <option value="" disabled>Select Employee</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2 relative">
                        <label className="text-xs font-bold text-[#8E8E93] ml-1 uppercase tracking-wider">Category</label>
                        <div className="relative">
                            <select
                                value={selectedCategoryId}
                                onChange={(e) => {
                                    setSelectedCategoryId(e.target.value);
                                    setSelectedSubCategoryId(""); // Reset sub-category on category change
                                }}
                                className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-lg py-2 px-3 text-[var(--text-main)] text-[10px] outline-none focus:border-[var(--primary)] focus:shadow-sm transition-all appearance-none cursor-pointer shadow-sm"
                                title="Select Category"
                            >
                                <option value="">All Categories</option>
                                {availableCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-2 relative">
                        <label className="text-xs font-bold text-[#8E8E93] ml-1 uppercase tracking-wider">Sub-Category</label>
                        <div className="relative">
                            <select
                                value={selectedSubCategoryId}
                                onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                                disabled={!selectedCategoryId}
                                className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-lg py-2 px-3 text-[var(--text-main)] text-[10px] outline-none focus:border-[var(--primary)] focus:shadow-sm transition-all appearance-none disabled:opacity-50 cursor-pointer shadow-sm"
                                title="Select Sub-Category"
                            >
                                <option value="">All Sub-Categories</option>
                                {availableSubCategories.map(sub => (
                                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {!selectedEmployeeId ? (
                <div className="wood-card flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mb-4">
                        <User className="text-[var(--primary)]" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white">Select an Employee</h3>
                    <p className="text-[#8E8E93] text-sm mt-1 max-w-sm">Please select an employee from the filters above to calculate their progress and bonus earnings.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Summary KPIs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="wood-card !p-3 flex items-center gap-3 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#2D6A4F]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="w-8 h-8 rounded-lg bg-[#2D6A4F]/20 flex items-center justify-center border border-[#2D6A4F]/30 relative z-10 shrink-0">
                                <span className="text-sm font-black text-[#2D6A4F]">$</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest hidden md:block">Total Bonus</p>
                                <div className="flex items-baseline gap-1 mt-0">
                                    <span className="text-xl font-black tracking-tight text-white">${totalBonus.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="wood-card !p-3 flex items-center gap-3 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="w-8 h-8 rounded-lg bg-black/30 border border-white/5 flex items-center justify-center relative z-10 shrink-0">
                                <Award className="text-[var(--primary)]" size={14} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest hidden md:block">Mastered Skills</p>
                                <div className="flex items-baseline gap-1 mt-0">
                                    <span className="text-xl font-black tracking-tight">{totalMastered}</span>
                                </div>
                            </div>
                        </div>

                        <div className="wood-card !p-3 flex items-center gap-3 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="w-8 h-8 rounded-lg bg-black/30 border border-white/5 flex items-center justify-center relative z-10 shrink-0">
                                <Target className="text-[#3B82F6]" size={14} />
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest hidden md:block">Proficient Skills</p>
                                <div className="flex items-baseline gap-1 mt-0">
                                    <span className="text-xl font-black tracking-tight text-white">{totalProficient}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Report Matrix */}
                    <div className="wood-card p-0 overflow-hidden">
                        <div className="p-3 border-b border-[var(--glass-border)] flex items-center justify-between">
                            <h3 className="text-xs font-black text-[var(--text-main)] uppercase tracking-widest border-l-2 border-[var(--primary)] pl-2">Progress Report Data</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-[var(--background)] text-[#8E8E93] text-[9px] uppercase font-bold tracking-widest border-b border-[var(--glass-border)]">
                                    <tr>
                                        <th className="px-3 py-2 font-bold">Category</th>
                                        <th className="px-3 py-2 font-bold text-center">Sub categories Count</th>
                                        <th className="px-3 py-2 font-bold text-center text-[#3B82F6]">Proficient</th>
                                        <th className="px-3 py-2 font-bold text-center text-[var(--primary)]">Mastered</th>
                                        <th className="px-3 py-2 font-bold text-right text-[#2D6A4F]">Bonus Earned</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 relative">
                                    {progressData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-4 text-center text-[#8E8E93]">No data found for these filters.</td>
                                        </tr>
                                    ) : (
                                        progressData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-3 py-2.5">
                                                    <span className="font-bold text-white tracking-tight">{row?.category.name}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="text-[#A0A0A0] text-[10px] font-medium bg-black/20 px-2 py-0.5 rounded border border-white/5">{row?.subCategoryCount}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#3B82F6]/10 border border-[#3B82F6]/20">
                                                        <span className="font-bold text-[#3B82F6]">{row?.proficientCount}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--primary)]/10 border border-[var(--primary)]/20">
                                                        <span className="font-bold text-[var(--primary)]">{row?.masteredCount}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <span className="font-black text-[#2D6A4F] text-sm">${row?.bonusEarned.toFixed(2)}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Remaining Skills List */}
                    <div className="wood-card p-0 overflow-hidden mt-4">
                        <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="text-[#E5A54F]" size={14} />
                                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Remaining Skills to Master</h3>
                            </div>
                        </div>
                        <div className="p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                {progressData.flatMap(d => d?.remainingSkills || []).length === 0 ? (
                                    <div className="col-span-full py-4 text-center flex flex-col items-center justify-center opacity-50">
                                        <CheckCircle2 size={24} className="text-[#2D6A4F] mb-2" />
                                        <p className="text-[10px] font-medium text-white">All matched skills have been mastered.</p>
                                    </div>
                                ) : (
                                    progressData.flatMap(d => d?.remainingSkills || []).map(skill => {
                                        const cat = categories.find(c => c.id === skill.categoryId);
                                        const sub = subCategories.find(s => s.id === skill.subCategoryId);

                                        return (
                                            <div key={skill.id} className="bg-black/20 border border-white/5 p-2.5 rounded-lg hover:border-white/10 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className="text-[8px] font-bold text-[#8E8E93] uppercase tracking-wider">{cat?.name}</span>
                                                            <span className="text-[7px] text-[#A0A0A0]">&bull;</span>
                                                            <span className="text-[8px] font-bold text-[#A0A0A0] uppercase tracking-wider">{sub?.name}</span>
                                                        </div>
                                                        <h4 className="text-[11px] font-bold text-white tracking-tight">{skill.name}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
