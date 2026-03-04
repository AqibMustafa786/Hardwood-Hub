"use client";
import { useState, useEffect } from "react";
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Plus,
    Trash2,
    Edit2,
    Search,
    ChevronRight,
    Tag,
    X,
    Layers,
    Wrench,
    Box,
    Hexagon,
    ChevronUp,
    ChevronDown,
    ArrowDownUp,
    Filter
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NavbarPortal } from "@/components/NavbarPortal";

import { useSort } from "@/hooks/useSort";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function IdentificationsPage() {
    const [identifications, setIdentifications] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [identificationCategoryId, setIdentificationCategoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentIdentification, setCurrentIdentification] = useState<any>(null);
    const { user, role, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const searchTerm = searchParams.get('q') || "";

    const [filterSubCategory, setFilterSubCategory] = useState<string>("All");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        subCategoryId: ""
    });

    useEffect(() => {
        if (!user || authLoading) return;

        // Fetch identifications (we'll sort them client-side by name since there's no priority field)
        const qID = query(collection(db, "identifications"));
        const unsubscribeID = onSnapshot(qID, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setIdentifications(data);
            setLoading(false);
        });

        // Fetch categories to find the "Identification" category ID
        const qC = query(collection(db, "categories"));
        const unsubscribeC = onSnapshot(qC, (snapshot) => {
            const idenCat = snapshot.docs.find(doc => doc.data().name === "Identification");
            if (idenCat) setIdentificationCategoryId(idenCat.id);
        });

        // Fetch subCategories for the dropdown
        const qSC = query(collection(db, "subCategories"), orderBy("priority", "asc"));
        const unsubscribeSC = onSnapshot(qSC, (snapshot) => {
            setSubCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubscribeID(); unsubscribeSC(); unsubscribeC(); };
    }, [user, authLoading]);

    const { sortedData, sortConfig, handleSort } = useSort(identifications, { key: 'name', direction: 'asc' }, {
        subCategory: (item) => subCategories.find(sc => sc.id === item.subCategoryId)?.name || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentIdentification) {
                await updateDoc(doc(db, "identifications", currentIdentification.id), formData);
            } else {
                await addDoc(collection(db, "identifications"), { ...formData });
            }
            setIsModalOpen(false);
            setFormData({ name: "", subCategoryId: "" });
            setCurrentIdentification(null);
        } catch (err) {
            console.error("Error saving identification:", err);
            alert("Failed to save identification. Please try again.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this identification?")) return;
        try {
            await deleteDoc(doc(db, "identifications", id));
        } catch (err) {
            console.error("Error deleting identification:", err);
            alert("Failed to delete identification.");
        }
    };

    const filteredIdentifications = sortedData.filter(id => {
        const matchesSearch = id.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSubCategory = filterSubCategory === "All" || id.subCategoryId === filterSubCategory;
        return matchesSearch && matchesSubCategory;
    });

    const renderSortIcon = (key: string) => {
        if (sortConfig?.key === key) {
            return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-[var(--primary)]" /> : <ChevronDown size={12} className="text-[var(--primary)]" />;
        }
        return <ArrowDownUp size={10} className="text-[#8E8E93] opacity-0 group-hover:opacity-50" />;
    };

    return (
        <div className="space-y-4 max-w-[1600px] mx-auto">
            {/* Top Actions */}
            <NavbarPortal>
                {role === "superAdmin" && (
                    <button
                        onClick={() => { setIsModalOpen(true); setCurrentIdentification(null); setFormData({ name: "", subCategoryId: "" }); }}
                        className="glow-button px-3 py-2 flex items-center gap-1.5 active:scale-95 transition-all group w-fit mr-2"
                        title="Add Identification"
                    >
                        <Plus size={14} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Add Identification</span>
                    </button>
                )}
            </NavbarPortal>

            {/* Filter UI */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-4 mt-2">
                <div></div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full xl:w-auto justify-end">
                    {/* Active Filter Chips */}
                    <div className="flex items-center gap-2 flex-wrap min-h-[28px]">
                        {filterSubCategory !== "All" && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 shadow-sm shrink-0">
                                <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider max-w-[120px] truncate" title={subCategories.find(sc => sc.id === filterSubCategory)?.name || filterSubCategory}>Sub: {subCategories.find(sc => sc.id === filterSubCategory)?.name || filterSubCategory}</span>
                                <button onClick={() => setFilterSubCategory("All")} className="text-[var(--primary)] hover:text-[var(--text-main)] transition-colors" title="Remove Filter"><X size={12} /></button>
                            </motion.div>
                        )}
                        {filterSubCategory !== "All" && (
                            <button onClick={() => setFilterSubCategory("All")} className="text-[9px] text-[#8E8E93] hover:text-[var(--text-main)] font-bold uppercase tracking-widest transition-colors shrink-0 mx-1">Clear All</button>
                        )}
                    </div>

                    {/* Filter Dropdown */}
                    <div className="relative w-full sm:w-auto shrink-0 z-20">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={cn(
                                "px-4 py-1.5 w-full sm:w-auto rounded-lg border flex items-center justify-center gap-2 transition-all h-[34px] text-[10px] font-bold uppercase tracking-wider",
                                isFilterOpen || filterSubCategory !== "All" ? "bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]" : "bg-[var(--background)] border-[var(--glass-border)] text-[#8E8E93] hover:text-[var(--text-main)] hover:border-[var(--primary)]/30"
                            )}
                        >
                            <Filter size={12} />
                            <span>Filter</span>
                            {filterSubCategory !== "All" && (
                                <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[9px] ml-1">1</span>
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
                                                <label className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider">Sub Category</label>
                                                <select
                                                    title="Filter by Sub Category"
                                                    value={filterSubCategory}
                                                    onChange={(e) => setFilterSubCategory(e.target.value)}
                                                    className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-lg py-2 px-3 text-[10px] text-[var(--text-main)] outline-none focus:border-[var(--primary)] appearance-none cursor-pointer"
                                                >
                                                    <option value="All" className="bg-[var(--background)]">All Sub Categories</option>
                                                    {subCategories
                                                        .filter(sc => identificationCategoryId ? sc.categoryId === identificationCategoryId : true)
                                                        .map(sc => <option key={sc.id} value={sc.id} className="bg-[var(--background)]">{sc.name}</option>)}
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

            {/* Matrix */}
            <div className="w-full">
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="text-left bg-white/[0.02] border-b border-white/5">
                                <th onClick={() => handleSort('name')} className="cursor-pointer group py-2 px-3 text-[8px] font-black uppercase tracking-[0.3em] text-[#8E8E93] hover:text-white transition-colors">
                                    <div className="flex items-center gap-1.5">Identification Name {renderSortIcon('name')}</div>
                                </th>
                                <th onClick={() => handleSort('subCategory')} className="cursor-pointer group py-2 px-3 text-[8px] font-black uppercase tracking-[0.3em] text-[#8E8E93] hover:text-white transition-colors">
                                    <div className="flex items-center gap-1.5">Assigned Sub Category {renderSortIcon('subCategory')}</div>
                                </th>
                                <th className="py-2 px-3 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [1, 2, 3, 4].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={3} className="py-6 px-4">
                                            <div className="h-3 bg-white/5 rounded-full w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredIdentifications.map((id: any, idx: number) => (
                                <motion.tr
                                    key={id.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="group hover:bg-white/[0.03] transition-all duration-300"
                                >
                                    <td className="py-1.5 px-3 border-b border-white/5 group-hover:border-[var(--primary)]/20 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[var(--primary)] group-hover:bg-[var(--primary)]/10 transition-colors">
                                                <Wrench size={10} strokeWidth={2} />
                                            </div>
                                            <span className="text-white font-black text-[10px] uppercase tracking-tight group-hover:text-[var(--primary)] transition-colors">{id.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-1.5 px-3 border-b border-white/5">
                                        <span className="text-[#8E8E93] text-[9px] font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                                            {subCategories.find(sc => sc.id === id.subCategoryId)?.name || 'Unassigned'}
                                        </span>
                                    </td>
                                    <td className="py-1.5 px-3 border-b border-white/5 text-right">
                                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                            {role === "superAdmin" && (
                                                <>
                                                    <button
                                                        onClick={() => { setCurrentIdentification(id); setFormData(id); setIsModalOpen(true); }}
                                                        className="p-1.5 hover:text-[var(--primary)] text-white/20 transition-colors"
                                                        title="Edit Identification"
                                                    >
                                                        <Edit2 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(id.id)}
                                                        className="p-1.5 hover:text-red-400 text-white/20 transition-colors"
                                                        title="Delete Identification"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {
                    isModalOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--background)]/80 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-[var(--background)]/60"
                                onClick={() => setIsModalOpen(false)}
                            ></motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="w-full max-w-md relative z-10 bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                            >
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

                                <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between relative bg-[var(--glass-highlight)]">
                                    <div className="space-y-0.5">
                                        <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center border border-[var(--primary)]/20">
                                                <Wrench size={16} className="text-[var(--primary)]" />
                                            </div>
                                            {currentIdentification ? 'Refine' : 'Initialize'} <span className="text-gradient">Identification</span>
                                        </h2>
                                        <p className="text-[var(--primary)] text-[9px] font-black uppercase tracking-[0.3em] opacity-70">Configure parameters</p>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-8 h-8 rounded-lg bg-[var(--glass-highlight)] hover:bg-neutral-500/10 flex items-center justify-center text-[#8E8E93] hover:text-[var(--text-main)] transition-colors"
                                        title="Close dialog"
                                        aria-label="Close modal"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                <div className="p-4 relative">
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wide ml-1">Identification Name</label>
                                            <div className="relative group/input">
                                                <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within/input:text-[var(--primary)] transition-colors" />
                                                <input
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-lg py-2 pl-8 pr-3 text-[10px] outline-none focus:border-[var(--primary)] focus:bg-[var(--glass-highlight)] text-[var(--text-main)] placeholder:text-[var(--text-muted)]/50 transition-all shadow-inner"
                                                    title="Identification Name"
                                                    placeholder="e.g. Cabinet scraper"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wide ml-1">Assigned Sub Category</label>
                                            <div className="relative group/input">
                                                <Layers size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within/input:text-[var(--primary)] transition-colors" />
                                                <select
                                                    required
                                                    value={formData.subCategoryId}
                                                    onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
                                                    className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-lg py-2 pl-8 pr-8 text-[10px] outline-none focus:border-[var(--primary)] focus:bg-[var(--glass-highlight)] text-[var(--text-main)] transition-all shadow-inner appearance-none cursor-pointer"
                                                    title="Assigned Sub Category"
                                                >
                                                    <option value="" className="bg-[var(--background)]">Select Sub Category</option>
                                                    {subCategories
                                                        .filter(sc => identificationCategoryId ? sc.categoryId === identificationCategoryId : true)
                                                        .map(sc => <option key={sc.id} value={sc.id} className="bg-[var(--background)]">{sc.name}</option>)}
                                                </select>
                                                <ChevronRight size={10} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E93] rotate-90 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="pt-3 mt-3 border-t border-[var(--glass-border)] flex items-center justify-end gap-2">
                                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 rounded-lg font-bold text-[9px] text-[#8E8E93] hover:text-[var(--text-main)] bg-[var(--glass-highlight)] hover:bg-neutral-500/10 transition-colors uppercase tracking-wider">
                                                Cancel
                                            </button>
                                            <button type="submit" className="glow-button px-4 py-1.5 text-[9px] font-bold flex items-center justify-center gap-1.5 w-fit h-fit uppercase tracking-wider">
                                                {currentIdentification ? 'Update' : 'Add Identification'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}
