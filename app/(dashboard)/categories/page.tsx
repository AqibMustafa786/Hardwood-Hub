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
    FolderGit2,
    MoreHorizontal,
    Box,
    Activity,
    Hexagon
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Upload } from "lucide-react";
import { NavbarPortal } from "@/components/NavbarPortal";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<any>(null);
    const { user, role, loading: authLoading } = useAuth();
    const searchParams = useSearchParams();
    const searchTerm = searchParams.get('q') || "";

    const [formData, setFormData] = useState({ name: "", icon: "", priority: 1 });

    const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, icon: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    useEffect(() => {
        if (!user || authLoading) return;
        const q = query(collection(db, "categories"), orderBy("priority", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentCategory) {
                await updateDoc(doc(db, "categories", currentCategory.id), formData);
            } else {
                await addDoc(collection(db, "categories"), { ...formData, priority: categories.length + 1 });
            }
            setIsModalOpen(false);
            setFormData({ name: "", icon: "", priority: 1 });
            setCurrentCategory(null);
        } catch (err) {
            console.error("Error saving category:", err);
            alert("Failed to save category. Please try again.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this category?")) return;
        try {
            await deleteDoc(doc(db, "categories", id));
        } catch (err) {
            console.error("Error deleting category:", err);
            alert("Failed to delete category.");
        }
    };

    const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-4 max-w-[1600px] mx-auto">
            {/* Top Actions */}
            <NavbarPortal>
                {role === "superAdmin" && (
                    <button
                        onClick={() => { setIsModalOpen(true); setCurrentCategory(null); }}
                        className="glow-button px-3 py-2 flex items-center gap-1.5 active:scale-95 transition-all group w-fit mr-2"
                        title="Add Category"
                    >
                        <Plus size={14} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span className="text-[10px] font-bold uppercase tracking-wide">Add Category</span>
                    </button>
                )}
            </NavbarPortal>

            {/* Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-[200px] bg-white/[0.02] border border-white/5 rounded-[20px] animate-pulse"></div>)
                ) : filteredCategories.map((cat, idx) => (
                    <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/0 to-[var(--primary)]/5 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                        <div className="relative h-full flex flex-col bg-[var(--glass-bg)] backdrop-blur-2xl border border-[var(--glass-border)] rounded-[20px] p-4 hover:border-[var(--primary)]/30 hover:shadow-lg transition-all duration-500 overflow-hidden shadow-sm">
                            {/* Decorative Top Gradient */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent group-hover:via-[var(--primary)] transition-all duration-700 opacity-50"></div>

                            <div className="flex items-start justify-between mb-4 relative z-10">
                                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 group-hover:bg-[var(--primary)]/10 group-hover:border-[var(--primary)]/30 transition-colors shadow-lg relative overflow-hidden flex items-center justify-center w-8 h-8">
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                    {cat.icon ? (
                                        <img src={cat.icon} alt={cat.name} className="w-full h-full object-contain relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                                    ) : null}
                                    <FolderGit2 size={16} className={cn("text-[#8E8E93] group-hover:text-[var(--primary)] transition-colors relative z-10", cat.icon ? "hidden" : "block")} strokeWidth={1.5} />
                                </div>

                                {role === "superAdmin" && (
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                                        <button onClick={(e) => { e.stopPropagation(); setCurrentCategory(cat); setFormData(cat); setIsModalOpen(true); }} className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/10 transition-colors shadow-sm" title="Edit Category">
                                            <Edit2 size={10} />
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }} className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-[#8E8E93] hover:text-red-400 hover:bg-red-400/10 transition-colors shadow-sm" title="Delete Category">
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5 flex-1 relative z-10 mb-4">
                                <h3 className="text-sm font-bold text-[var(--text-main)] tracking-tight group-hover:text-[var(--primary)] transition-colors">{cat.name}</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="bg-[var(--background)] border border-[var(--glass-border)] text-[#8E8E93] text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded flex items-center gap-1">
                                        <Layers size={8} /> Tier {cat.priority}
                                    </span>
                                    <span className="bg-[var(--text-main)]/5 text-[#8E8E93] text-[8px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded blur-[0.5px] group-hover:blur-0 transition-all">
                                        Active
                                    </span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-auto relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-1.5">
                                        {[1, 2].map(i => (
                                            <div key={i} className="w-5 h-5 rounded-full bg-[#1A1A1A] border-2 border-[#0D0D0D] flex items-center justify-center shadow-sm">
                                                <Hexagon size={8} className="text-[#8E8E93]" />
                                            </div>
                                        ))}
                                    </div>
                                    <span className="text-[9px] font-bold text-[#A0A0A0]">+12 Skills</span>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[var(--primary)] group-hover:text-black text-[#8E8E93] transition-colors shadow-sm cursor-pointer">
                                    <ChevronRight size={12} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#050505]/90 backdrop-blur-2xl"
                            onClick={() => setIsModalOpen(false)}
                        ></motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="w-full max-w-md relative z-10 bg-[#0D0D0D] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>

                            <div className="p-6 border-b border-white/5 flex items-center justify-between relative bg-white/[0.02]">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
                                            <Hexagon size={16} className="text-[var(--primary)]" />
                                        </div>
                                        {currentCategory ? 'Edit' : 'Add'} <span className="text-gradient">Category</span>
                                    </h2>
                                    <p className="text-[#8E8E93] text-[10px] font-bold uppercase tracking-widest">Configure parameters</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8E8E93] hover:text-white transition-colors"
                                    title="Close dialog"
                                    aria-label="Close modal"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="p-4 relative">
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wide ml-1">Category Name</label>
                                        <div className="relative group/input">
                                            <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within/input:text-[var(--primary)] transition-colors" />
                                            <input
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-[#1A1A1A]/50 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-[10px] outline-none focus:border-[var(--primary)] focus:bg-white/[0.02] text-white placeholder:text-[#8E8E93]/40 transition-all shadow-inner"
                                                title="Category Name"
                                                placeholder="e.g. Surface Prep"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wide ml-1">Icon / Image</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleIconUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                title="Upload Category Icon"
                                            />
                                            <div className="w-full bg-[#1A1A1A]/50 border border-white/10 rounded-lg py-2 pl-3 pr-8 flex items-center justify-between text-[#8E8E93]/40 text-[10px] overflow-hidden shadow-inner group/upload">
                                                <span className="truncate text-white">{formData.icon ? 'Icon Selected' : 'Choose File...'}</span>
                                                <Upload size={12} className="absolute right-3 top-1/2 -translate-y-1/2 group-hover/upload:text-[var(--primary)] transition-colors" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-end gap-2">
                                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 rounded-lg font-bold text-[9px] text-[#8E8E93] hover:text-white bg-white/5 hover:bg-white/10 transition-colors uppercase tracking-wider">
                                            Cancel
                                        </button>
                                        <button type="submit" className="glow-button px-4 py-1.5 text-[9px] font-bold flex items-center justify-center gap-1.5 w-fit h-fit uppercase tracking-wider">
                                            {currentCategory ? 'Update' : 'Add Category'}
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
