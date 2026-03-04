"use client";
import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface AddMultipleSkillsModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: any;
}

export function AddMultipleSkillsModal({ isOpen, onClose, employee }: AddMultipleSkillsModalProps) {
    const [categories, setCategories] = useState<any[]>([]);
    const [supervisors, setSupervisors] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        categoryId: "",
        level: "Learning",
        supervisorId: ""
    });

    const levels = [
        { label: "Untested", color: "transparent", score: 0 },
        { label: "Learning", color: "white", score: 0 },
        { label: "Proficient", color: "#3B82F6", score: 3 },
        { label: "Mastered", color: "var(--primary-hover)", score: 5 },
    ];

    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            try {
                // Fetch categories
                const catSnap = await getDocs(collection(db, "categories"));
                setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                // Fetch supervisors
                const supSnap = await getDocs(query(collection(db, "users"), where("role", "in", ["supervisor", "superAdmin"])));
                setSupervisors(supSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Error fetching data for modal:", err);
            }
        };

        fetchData();
        setFormData({ categoryId: "", level: "Learning", supervisorId: "" });
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.categoryId || !formData.level || !formData.supervisorId) {
            alert("Please fill out all fields.");
            return;
        }

        setLoading(true);
        try {
            // Find selected supervisor info
            const supervisor = supervisors.find(s => s.id === formData.supervisorId);
            const selectedLevel = levels.find(l => l.label === formData.level);

            // Fetch ALL skills that belong to the selected category
            // Since skills are associated via subCategoryId, we need to get subcategories first
            const subCatQuery = query(collection(db, "subCategories"), where("categoryId", "==", formData.categoryId));
            const subCatSnap = await getDocs(subCatQuery);
            const subCatIds = subCatSnap.docs.map(doc => doc.id);

            if (subCatIds.length === 0) {
                alert("No subcategories found for this category.");
                setLoading(false);
                return;
            }

            // FireStore "in" queries are limited to 10 items. We might need to split chunks or fetch all skills.
            // For safety and correctness, we will fetch all skills and filter in memory since skill count isn't millions.
            const skillsSnap = await getDocs(collection(db, "skills"));
            const skillsToUpdate = skillsSnap.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as any))
                .filter(skill => subCatIds.includes(skill.subCategoryId));

            if (skillsToUpdate.length === 0) {
                alert("No skills found for this category.");
                setLoading(false);
                return;
            }

            // Add performances for all matched skills
            const promises = skillsToUpdate.map(skill => {
                return addDoc(collection(db, "performances"), {
                    employeeId: employee.id,
                    skillId: skill.id,
                    level: formData.level,
                    notes: "Bulk assigned via Add Multiple Skills tool",
                    score: selectedLevel?.score || 0,
                    color: selectedLevel?.color,
                    skillName: skill.name,
                    employeeName: employee.name,
                    evaluatorId: supervisor?.id,
                    evaluatorName: supervisor?.name,
                    evaluatedAt: new Date().toISOString()
                });
            });

            await Promise.all(promises);
            setLoading(false);
            onClose();
        } catch (err) {
            console.error("Error batch assigning skills:", err);
            alert("An error occurred while saving. Please try again.");
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 animate-fade-in">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md"
                    onClick={!loading ? onClose : undefined}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg premium-card !p-0 rounded-[24px] overflow-hidden shadow-2xl bg-[var(--background)]"
                >
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                        <div className="space-y-1">
                            <h2 className="text-lg font-black text-white tracking-tight">Add Multiple <span className="text-[var(--primary)]">Skills</span></h2>
                            <p className="text-[10px] uppercase tracking-widest font-bold text-[#8E8E93]">Bulk Assignment for {employee?.name}</p>
                        </div>
                        {!loading && (
                            <button
                                onClick={onClose}
                                title="Close dialog"
                                className="w-8 h-8 flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    <div className="p-6 bg-[var(--background)]">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Category<span className="text-[var(--primary)] ml-1">*</span></label>
                                <select
                                    required
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm transition-all appearance-none cursor-pointer"
                                    disabled={loading}
                                    title="Select Category"
                                >
                                    <option value="" className="bg-[var(--background)]">Select Category</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id} className="bg-[var(--background)]">{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Current Skill Level<span className="text-[var(--primary)] ml-1">*</span></label>
                                <select
                                    required
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm transition-all appearance-none cursor-pointer"
                                    disabled={loading}
                                    title="Select Current Skill Level"
                                >
                                    {levels.map((l) => (
                                        <option key={l.label} value={l.label} className="bg-[var(--background)]">{l.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Reviewing Supervisor<span className="text-[var(--primary)] ml-1">*</span></label>
                                <select
                                    required
                                    value={formData.supervisorId}
                                    onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                                    className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm transition-all appearance-none cursor-pointer"
                                    disabled={loading}
                                    title="Select Reviewing Supervisor"
                                >
                                    <option value="" className="bg-[var(--background)]">Select Supervisor</option>
                                    {supervisors.map((s) => (
                                        <option key={s.id} value={s.id} className="bg-[var(--background)]">{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex items-center justify-between gap-3 border-t border-[var(--glass-border)] mt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="px-5 py-2.5 rounded-xl font-bold text-[11px] text-[#8E8E93] hover:text-[var(--text-main)] transition-colors tracking-wide disabled:opacity-50 uppercase"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2.5 rounded-xl font-black text-[11px] text-[#050505] bg-[var(--primary)] hover:brightness-110 transition-all flex items-center justify-center gap-2 tracking-widest uppercase shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-[#050505]/20 border-t-[#050505] rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <Check size={14} />
                                            <span>Save</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
