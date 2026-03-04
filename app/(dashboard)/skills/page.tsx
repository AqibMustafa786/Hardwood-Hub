"use client";
import React, { useState, useEffect, useMemo } from "react";
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    ClipboardCheck,
    Trash2,
    Edit2,
    Search,
    PlusCircle,
    X,
    ShieldCheck,
    Hash,
    Plus,
    Layout,
    Check,
    ChevronDown,
    ChevronUp,
    Filter,
    ArrowDownUp,
    ListTree
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NavbarPortal } from "@/components/NavbarPortal";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { useSort } from "@/hooks/useSort";

type GroupBy = 'none' | 'category' | 'subcategory';

export default function SkillsPage() {
    const [skills, setSkills] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSkill, setCurrentSkill] = useState<any>(null);
    const { user, role, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const searchTerm = searchParams.get('q')?.toLowerCase() || "";

    const [groupBy, setGroupBy] = useState<GroupBy>('none');

    // Advanced Filter State
    const [filterCategory, setFilterCategory] = useState<string>("All");
    const [filterSubCategory, setFilterSubCategory] = useState<string>("All");
    const [filterRequired, setFilterRequired] = useState<string>("All");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        categoryId: "",
        subCategoryId: "",
        subcategory: "",
        isRequired: true,
    });

    useEffect(() => {
        if (!user || authLoading) return;
        const qS = query(collection(db, "skills"), orderBy("name"));
        const unsubscribeS = onSnapshot(qS, (snapshot) => {
            setSkills(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (err) => console.error(err));

        const qC = query(collection(db, "categories"), orderBy("name"));
        const unsubscribeC = onSnapshot(qC, (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => console.error(err));

        const qSC = query(collection(db, "subCategories"), orderBy("name"));
        const unsubscribeSC = onSnapshot(qSC, (snapshot) => {
            setSubCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => console.error(err));

        return () => { unsubscribeS(); unsubscribeC(); unsubscribeSC(); };
    }, [user, authLoading]);

    // O(1) Lookups for extreme performance during Sort & Filter
    const categoryMap = useMemo(() => {
        return categories.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
        }, {} as Record<string, string>);
    }, [categories]);

    const subCategoryMap = useMemo(() => {
        return subCategories.reduce((acc, sc) => {
            acc[sc.id] = sc.name;
            return acc;
        }, {} as Record<string, string>);
    }, [subCategories]);

    const { sortedData, sortConfig, handleSort } = useSort(skills, null, {
        category: (item) => categoryMap[item.categoryId] || '',
        subcategory: (item) => subCategoryMap[item.subCategoryId] || item.subcategory || '',
        required: (item) => item.isRequired
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentSkill) {
                await updateDoc(doc(db, "skills", currentSkill.id), formData);
            } else {
                await addDoc(collection(db, "skills"), formData);
            }
            setIsModalOpen(false);
            setFormData({ name: "", categoryId: "", subCategoryId: "", subcategory: "", isRequired: true });
            setCurrentSkill(null);
        } catch (err) {
            console.error("Error saving skill:", err);
            alert("Failed to save skill. Please try again.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this skill?")) return;
        try {
            await deleteDoc(doc(db, "skills", id));
        } catch (err) {
            console.error("Error deleting skill:", err);
            alert("Failed to delete skill.");
        }
    };

    const processedSkills = useMemo(() => {
        let result = [...sortedData]; // Inherit from Global Sort Hook

        // Filter using O(1) maps
        if (searchTerm) {
            result = result.filter(skill =>
                skill.name?.toLowerCase().includes(searchTerm) ||
                (categoryMap[skill.categoryId] || '').toLowerCase().includes(searchTerm) ||
                (subCategoryMap[skill.subCategoryId] || skill.subcategory || '').toLowerCase().includes(searchTerm)
            );
        }

        // Advanced Filters
        if (filterCategory !== "All") {
            result = result.filter(skill => skill.categoryId === filterCategory);
        }
        if (filterSubCategory !== "All") {
            result = result.filter(skill => skill.subCategoryId === filterSubCategory);
        }
        if (filterRequired !== "All") {
            const isReq = filterRequired === "Yes";
            result = result.filter(skill => !!skill.isRequired === isReq);
        }

        // Grouping logic remains unchanged but uses O(1) lookups
        if (groupBy === 'none') {
            return [{ isGroup: false, groupName: '', items: result }];
        } else if (groupBy === 'category') {
            const groups: Record<string, any[]> = {};
            result.forEach(skill => {
                const catName = categoryMap[skill.categoryId] || 'Unassigned Category';
                if (!groups[catName]) groups[catName] = [];
                groups[catName].push(skill);
            });
            return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])).map(([name, items]) => ({
                isGroup: true, groupName: name, groupType: 'category', items, count: items.length
            }));
        } else if (groupBy === 'subcategory') {
            const groups: Record<string, Record<string, any[]>> = {};
            result.forEach(skill => {
                const catName = categoryMap[skill.categoryId] || 'Unassigned Category';
                const subCatName = subCategoryMap[skill.subCategoryId] || skill.subcategory || 'Unassigned Sub Category';

                if (!groups[catName]) groups[catName] = {};
                if (!groups[catName][subCatName]) groups[catName][subCatName] = [];
                groups[catName][subCatName].push(skill);
            });

            const flatGroups: any[] = [];
            Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])).forEach(([catName, subCats]) => {
                flatGroups.push({ isGroup: true, groupName: catName, groupType: 'category', items: [], count: Object.values(subCats).reduce((acc: number, arr: any[]) => acc + arr.length, 0) });

                Object.entries(subCats).sort((a, b) => a[0].localeCompare(b[0])).forEach(([subCatName, items]) => {
                    flatGroups.push({ isGroup: true, groupName: subCatName, groupType: 'subcategory', parentCategory: catName, items, count: items.length });
                });
            });
            return flatGroups;
        }

        return [];
    }, [sortedData, categoryMap, subCategoryMap, searchTerm, groupBy, filterCategory, filterSubCategory, filterRequired]);

    const renderSortIcon = (key: string) => {
        if (sortConfig?.key === key) {
            return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-[var(--primary)]" /> : <ChevronDown size={12} className="text-[var(--primary)]" />;
        }
        return <ArrowDownUp size={10} className="text-[#8E8E93] opacity-0 group-hover:opacity-50" />;
    };

    return (
        <div className="space-y-4">
            {/* Top Actions */}
            <NavbarPortal>
                {role === "superAdmin" && (
                    <button onClick={() => { setIsModalOpen(true); setCurrentSkill(null); }} className="glow-button px-3 py-2 flex items-center gap-1.5 active:scale-95 transition-all text-[10px] uppercase font-bold tracking-wide mr-2">
                        <PlusCircle size={14} strokeWidth={2.5} />
                        <span>Add New Skill</span>
                    </button>
                )}
            </NavbarPortal>

            <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between mb-4 mt-2">
                <div className="flex items-center bg-[var(--background)] border border-[var(--glass-border)] rounded-xl p-1.5 w-full sm:w-auto shadow-sm">
                    <div className="flex items-center gap-1">
                        <div className="px-3 py-1 flex items-center gap-2 border-r border-[var(--glass-border)] mr-1 shrink-0">
                            <ListTree size={14} className="text-[#8E8E93]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#8E8E93] hidden md:inline">Group By:</span>
                        </div>
                        {(['none', 'category', 'subcategory'] as GroupBy[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setGroupBy(mode)}
                                className={cn(
                                    "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                    groupBy === mode ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20" : "text-[#8E8E93] hover:text-[var(--text-main)] hover:bg-[var(--glass-highlight)] border border-transparent"
                                )}
                            >
                                {mode === 'none' ? 'None' : mode === 'category' ? 'Category' : 'Sub Category'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full xl:w-auto justify-end">
                    {/* Active Filter Chips */}
                    <div className="flex items-center gap-2 flex-wrap min-h-[28px]">
                        {filterCategory !== "All" && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 shadow-sm shrink-0">
                                <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider max-w-[120px] truncate" title={categoryMap[filterCategory] || filterCategory}>Cat: {categoryMap[filterCategory] || filterCategory}</span>
                                <button onClick={() => { setFilterCategory("All"); setFilterSubCategory("All"); }} className="text-[var(--primary)] hover:text-[var(--text-main)] transition-colors" title="Remove Filter"><X size={12} /></button>
                            </motion.div>
                        )}
                        {filterSubCategory !== "All" && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 shadow-sm shrink-0">
                                <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider max-w-[120px] truncate" title={subCategoryMap[filterSubCategory] || filterSubCategory}>Sub: {subCategoryMap[filterSubCategory] || filterSubCategory}</span>
                                <button onClick={() => setFilterSubCategory("All")} className="text-[var(--primary)] hover:text-[var(--text-main)] transition-colors" title="Remove Filter"><X size={12} /></button>
                            </motion.div>
                        )}
                        {filterRequired !== "All" && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 shadow-sm shrink-0">
                                <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Req: {filterRequired}</span>
                                <button onClick={() => setFilterRequired("All")} className="text-[var(--primary)] hover:text-[var(--text-main)] transition-colors" title="Remove Filter"><X size={12} /></button>
                            </motion.div>
                        )}
                        {(filterCategory !== "All" || filterSubCategory !== "All" || filterRequired !== "All") && (
                            <button onClick={() => { setFilterCategory("All"); setFilterSubCategory("All"); setFilterRequired("All"); }} className="text-[9px] text-[#8E8E93] hover:text-[var(--text-main)] font-bold uppercase tracking-widest transition-colors shrink-0 mx-1">Clear All</button>
                        )}
                    </div>

                    {/* Filter Dropdown */}
                    <div className="relative w-full sm:w-auto shrink-0 z-20">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={cn(
                                "px-4 py-1.5 w-full sm:w-auto rounded-lg border flex items-center justify-center gap-2 transition-all h-[34px] text-[10px] font-bold uppercase tracking-wider",
                                isFilterOpen || (filterCategory !== "All" || filterSubCategory !== "All" || filterRequired !== "All") ? "bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]" : "bg-[var(--background)] border-[var(--glass-border)] text-[#8E8E93] hover:text-[var(--text-main)] hover:border-[var(--primary)]/30"
                            )}
                        >
                            <Filter size={12} />
                            <span>Filter</span>
                            {(filterCategory !== "All" || filterSubCategory !== "All" || filterRequired !== "All") && (
                                <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[9px] ml-1">
                                    {(filterCategory !== "All" ? 1 : 0) + (filterSubCategory !== "All" ? 1 : 0) + (filterRequired !== "All" ? 1 : 0)}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {isFilterOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)}></div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute right-0 top-[calc(100%+8px)] w-64 bg-[var(--background)] border border-[var(--glass-border)] rounded-xl shadow-2xl z-50 overflow-hidden"
                                    >
                                        <div className="px-4 py-3 border-b border-[var(--glass-border)]">
                                            <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-main)]">Advanced Filters</h3>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider">Category</label>
                                                <select
                                                    title="Filter by Category"
                                                    value={filterCategory}
                                                    onChange={(e) => {
                                                        setFilterCategory(e.target.value);
                                                        setFilterSubCategory("All");
                                                    }}
                                                    className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-lg py-2 px-3 text-[10px] text-[var(--text-main)] outline-none focus:border-[var(--primary)] appearance-none cursor-pointer"
                                                >
                                                    <option value="All" className="bg-[var(--background)]">All Categories</option>
                                                    {categories.map(c => <option key={c.id} value={c.id} className="bg-[var(--background)]">{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider">Sub Category</label>
                                                <select
                                                    title="Filter by Sub Category"
                                                    value={filterSubCategory}
                                                    onChange={(e) => setFilterSubCategory(e.target.value)}
                                                    className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-lg py-2 px-3 text-[10px] text-[var(--text-main)] outline-none focus:border-[var(--primary)] appearance-none cursor-pointer"
                                                >
                                                    <option value="All" className="bg-[var(--background)]">All Sub Categories</option>
                                                    {subCategories.filter(sc => filterCategory === "All" || sc.categoryId === filterCategory).map(sc => <option key={sc.id} value={sc.id} className="bg-[var(--background)]">{sc.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider">Requirement</label>
                                                <select
                                                    title="Filter by Requirement"
                                                    value={filterRequired}
                                                    onChange={(e) => setFilterRequired(e.target.value)}
                                                    className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-lg py-2 px-3 text-[10px] text-[var(--text-main)] outline-none focus:border-[var(--primary)] appearance-none cursor-pointer"
                                                >
                                                    <option value="All" className="bg-[var(--background)]">All</option>
                                                    <option value="Yes" className="bg-[var(--background)]">Required</option>
                                                    <option value="No" className="bg-[var(--background)]">Not Required</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="px-4 py-3 border-t border-[var(--glass-border)] flex justify-end">
                                            <button onClick={() => setIsFilterOpen(false)} className="text-[9px] font-bold bg-[var(--primary)] text-white px-4 py-1.5 rounded-md hover:opacity-80 transition-opacity">Apply</button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="w-full">
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="text-left bg-white/[0.02] border-b border-white/5">
                                <th onClick={() => handleSort('name')} className="cursor-pointer group py-2.5 px-4 text-[8px] font-black uppercase tracking-[0.3em] text-[#8E8E93] hover:text-white transition-colors">
                                    <div className="flex items-center gap-1.5">Skill Name {renderSortIcon('name')}</div>
                                </th>
                                <th onClick={() => handleSort('category')} className="cursor-pointer group py-2.5 px-4 text-[8px] font-black uppercase tracking-[0.3em] text-[#8E8E93] hover:text-white transition-colors">
                                    <div className="flex items-center gap-1.5">Category {renderSortIcon('category')}</div>
                                </th>
                                <th onClick={() => handleSort('subcategory')} className="cursor-pointer group py-2.5 px-4 text-[8px] font-black uppercase tracking-[0.3em] text-[#8E8E93] hover:text-white transition-colors">
                                    <div className="flex items-center gap-1.5">Sub Category {renderSortIcon('subcategory')}</div>
                                </th>
                                <th onClick={() => handleSort('required')} className="cursor-pointer group py-2.5 px-4 text-[8px] font-black uppercase tracking-[0.3em] text-[#8E8E93] hover:text-white transition-colors">
                                    <div className="flex items-center gap-1.5">Required? {renderSortIcon('required')}</div>
                                </th>
                                <th className="py-2.5 px-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {processedSkills.length === 0 || (processedSkills.length === 1 && processedSkills[0].items.length === 0) ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/10">
                                                <Layout size={32} />
                                            </div>
                                            <p className="text-[#8E8E93] text-xs font-black uppercase tracking-widest">No entries discovered</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                processedSkills.map((group, gIdx) => (
                                    <React.Fragment key={`group-${gIdx}`}>
                                        {group.isGroup && (
                                            <tr className={cn(
                                                "backdrop-blur-sm transition-colors relative",
                                                group.groupType === 'category'
                                                    ? "bg-[var(--primary)]/5 border-b border-[var(--primary)]/10"
                                                    : "bg-[var(--primary)]/2 border-b border-[var(--glass-border)]"
                                            )}>
                                                <td colSpan={5} className={cn("py-3 px-4 relative overflow-hidden", group.groupType === 'subcategory' ? "pl-10" : "")}>
                                                    {group.groupType === 'category' && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)] rounded-r-sm opacity-50"></div>
                                                    )}
                                                    <div className="flex items-center gap-3 relative z-10">
                                                        <div className={cn(
                                                            "w-6 h-6 rounded flex items-center justify-center transition-colors",
                                                            group.groupType === 'category' ? "bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20" : "bg-white/5 text-[#8E8E93] border border-white/5"
                                                        )}>
                                                            <Layout size={12} strokeWidth={2.5} />
                                                        </div>
                                                        <span className={cn(
                                                            "font-black uppercase tracking-widest",
                                                            group.groupType === 'category' ? "text-xs text-white" : "text-[10px] text-[#8E8E93]"
                                                        )}>{group.groupName}</span>
                                                        <span className="ml-auto text-[9px] font-black text-[#8E8E93] bg-white/5 px-2.5 py-1 rounded-full border border-white/5 uppercase tracking-widest">
                                                            {group.count} {group.count === 1 ? 'Skill' : 'Skills'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {group.items.map((skill: any, idx: number) => (
                                            <motion.tr
                                                key={skill.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="group hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className={cn("py-2 px-4", group.isGroup && group.groupType === 'subcategory' ? "pl-14" : group.isGroup && group.groupType === 'category' ? "pl-10" : "")}>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-6 h-6 rounded-md bg-[#1A1A1A] border border-white/10 flex items-center justify-center font-black text-[var(--primary)] group-hover:scale-110 transition-transform duration-500 text-[10px]">
                                                            {skill.name?.charAt(0)}
                                                        </div>
                                                        <span className="text-[10px] font-bold text-white group-hover:text-[var(--primary)] transition-colors tracking-tight max-w-[400px] truncate">{skill.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-2 px-4 whitespace-nowrap">
                                                    <span className="text-[8px] font-bold uppercase tracking-wider text-[#8E8E93] bg-white/[0.03] px-2 py-0.5 rounded border border-white/5 inline-block">
                                                        {categories.find(c => c.id === skill.categoryId)?.name || 'Unassigned'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-4 whitespace-nowrap">
                                                    <span className="text-[8px] font-bold uppercase tracking-wider text-[#8E8E93] bg-white/[0.03] px-2 py-0.5 rounded border border-white/5 inline-block">
                                                        {subCategories.find(c => c.id === skill.subCategoryId)?.name || skill.subcategory || 'Unassigned'}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-4">
                                                    {skill.isRequired ? (
                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--primary)]/5 border border-[var(--primary)]/20 w-fit">
                                                            <ShieldCheck size={8} className="text-[var(--primary)]" />
                                                            <span className="text-[7px] font-black uppercase tracking-widest text-[var(--primary)]">Yes</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[7px] font-black uppercase tracking-widest text-[#8E8E93] opacity-40">No</span>
                                                    )}
                                                </td>
                                                <td className="py-2 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                                                        <button onClick={() => { setCurrentSkill(skill); setFormData(skill); setIsModalOpen(true); }} className="p-1.5 bg-white/5 border border-white/5 text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-md transition-all" title="Edit Skill"><Edit2 size={12} /></button>
                                                        <button onClick={() => handleDelete(skill.id)} className="p-1.5 bg-white/5 border border-white/5 text-[#8E8E93] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all" title="Delete Skill"><Trash2 size={12} /></button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[var(--background)]/80 backdrop-blur-xl"
                            onClick={() => setIsModalOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md premium-card !p-0 rounded-[32px] overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight">
                                        {currentSkill ? 'Modify' : 'Add'} <span className="text-[var(--primary)]">Skill</span>
                                    </h2>
                                    <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Define parameters</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center text-[#8E8E93] hover:text-[var(--text-main)] hover:bg-[var(--glass-highlight)] rounded-xl transition-colors"
                                    title="Close dialog"
                                    aria-label="Close modal"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wide ml-1">Skill Name</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 outline-none focus:border-[var(--primary)] focus:bg-[var(--glass-highlight)] text-[var(--text-main)] text-sm transition-all placeholder:text-[var(--text-muted)]/50"
                                            placeholder="e.g. Master Edge Sanding"
                                            title="Skill Name"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wide ml-1">Category</label>
                                            <select
                                                required
                                                value={formData.categoryId}
                                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value, subCategoryId: "", subcategory: "" })}
                                                className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 outline-none focus:border-[var(--primary)] focus:bg-[var(--glass-highlight)] text-[var(--text-main)] text-sm transition-all appearance-none cursor-pointer"
                                                title="Category"
                                            >
                                                <option value="" className="bg-[var(--background)]">Select Category</option>
                                                {categories.map(c => <option key={c.id} value={c.id} className="bg-[var(--background)]">{c.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wide ml-1">Sub Category</label>
                                            <select
                                                required
                                                value={formData.subCategoryId || formData.subcategory}
                                                onChange={(e) => {
                                                    const selectedSc = subCategories.find(sc => sc.id === e.target.value || sc.name === e.target.value);
                                                    setFormData({ ...formData, subCategoryId: selectedSc?.id || e.target.value, subcategory: selectedSc?.name || e.target.value });
                                                }}
                                                className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 outline-none focus:border-[var(--primary)] focus:bg-[var(--glass-highlight)] text-[var(--text-main)] text-sm transition-all appearance-none cursor-pointer disabled:opacity-50"
                                                title="Sub Category"
                                                disabled={!formData.categoryId}
                                            >
                                                <option value="" className="bg-[var(--background)]">Select Sub Category</option>
                                                {subCategories.filter(sc => sc.categoryId === formData.categoryId).map((sc: any) => (
                                                    <option key={sc.id} value={sc.id} className="bg-[var(--background)]">{sc.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div
                                        onClick={() => setFormData({ ...formData, isRequired: !formData.isRequired })}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-[var(--glass-highlight)] border border-[var(--glass-border)] cursor-pointer group hover:bg-[var(--primary)]/5 hover:border-[var(--primary)]/20 transition-all"
                                    >
                                        <div className={cn(
                                            "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                                            formData.isRequired ? "bg-[var(--primary)] border-[var(--primary)]" : "bg-transparent border-[var(--glass-border)]"
                                        )}>
                                            {formData.isRequired && <ShieldCheck size={12} className="text-black font-black" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-[var(--text-main)] tracking-tight">Required Skill</span>
                                            <span className="text-[10px] font-medium text-[#8E8E93]">Must be completed by employees</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-4 border-t border-[var(--glass-border)] flex items-center justify-end gap-3 flex-wrap sm:flex-nowrap">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-[#8E8E93] hover:text-[var(--text-main)] bg-[var(--glass-highlight)] hover:bg-neutral-500/10 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs text-[#050505] bg-[var(--primary)] hover:brightness-110 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all flex items-center justify-center gap-2"
                                        >
                                            <Check size={14} />
                                            {currentSkill ? 'Update' : 'Add Skill'}
                                        </button>
                                    </div>

                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
