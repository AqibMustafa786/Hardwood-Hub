"use client";
import { useState, useEffect } from "react";
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, orderBy, where, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    PlusCircle,
    Trash2,
    Search,
    X,
    History,
    TrendingUp,
    User,
    Star,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export default function PerformancePage() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [skills, setSkills] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedSubCategory, setSelectedSubCategory] = useState("");
    const { user, profile, role, loading: authLoading } = useAuth();

    const [formData, setFormData] = useState({
        employeeId: "",
        skillId: "",
        level: "Needs Improvement",
        notes: ""
    });

    const levels = [
        { label: "Needs Improvement", color: "#EF4444", score: 1 },
        { label: "Proficient", color: "#3B82F6", score: 3 },
        { label: "Mastered", color: "var(--primary-hover)", score: 5 },
    ];

    useEffect(() => {
        if (!user || authLoading) return;
        const qR = query(collection(db, "performances"), orderBy("evaluatedAt", "asc"));
        const unsubscribeR = onSnapshot(qR, (snapshot) => {
            const allReviews = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));

            // Process the "Master Check" and "Proficient Check" logic historically
            let processedReviews: any[] = [];

            // We need settings to do the calculation correctly
            getDoc(doc(db, "settings", "general")).then(settingsSnap => {
                const currentSettings = settingsSnap.data() || {};
                setSettings(currentSettings);

                const pReq = Number(currentSettings.proficientReviewsReq) || 1;
                const mReq = Number(currentSettings.masteredReviewsReq) || 1;
                const mType = currentSettings.masteredSupervisorCheck || 'Standard';

                allReviews.forEach(rev => {
                    const empId = rev.employeeId;
                    const skillId = rev.skillId;
                    const evalDate = rev.evaluatedAt;

                    // Get all recorded history for this Employee + Skill UP TO this specific review's date
                    const historyToDate = allReviews.filter(r =>
                        r.employeeId === empId &&
                        r.skillId === skillId &&
                        r.evaluatedAt <= evalDate
                    );

                    const profChecks = historyToDate.filter(r => r.score >= 3).length;
                    const mastHistory = historyToDate.filter(r => r.score >= 5);
                    const mastChecks = mastHistory.length;
                    const uniqueSups = new Set(mastHistory.map(r => r.evaluatorId)).size;

                    // Proficient Check Logic
                    const isProficient = profChecks >= pReq;

                    // Master Check Logic
                    let isMastered = false;
                    if (mType === 'Unique') {
                        isMastered = mastChecks >= mReq && uniqueSups >= (mReq - 1);
                    } else {
                        isMastered = mastChecks >= mReq;
                    }

                    processedReviews.push({ ...rev, isProficient, isMastered });
                });

                // Sort back to desc for UI display
                processedReviews.sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
                setReviews(processedReviews);
            });
        }, (err) => console.error(err));

        const qE = query(collection(db, "users"), where("status", "==", "Active"));
        const unsubscribeE = onSnapshot(qE, (snapshot) => {
            setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => console.error(err));

        const qS = query(collection(db, "skills"));
        const unsubscribeS = onSnapshot(qS, (snapshot) => {
            setSkills(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (err) => console.error(err));

        const qC = query(collection(db, "categories"));
        const unsubscribeC = onSnapshot(qC, (snapshot) => setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));

        const qSC = query(collection(db, "subCategories"));
        const unsubscribeSC = onSnapshot(qSC, (snapshot) => setSubCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));

        return () => { unsubscribeR(); unsubscribeE(); unsubscribeS(); unsubscribeC(); unsubscribeSC(); };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const selectedLevel = levels.find(l => l.label === formData.level);
            const skill = skills.find(s => s.id === formData.skillId);
            const employee = employees.find(e => e.id === formData.employeeId);

            await addDoc(collection(db, "performances"), {
                ...formData,
                score: selectedLevel?.score || 0,
                color: selectedLevel?.color,
                skillName: skill?.name,
                employeeName: employee?.name,
                evaluatorId: user?.uid,
                evaluatorName: profile?.name,
                evaluatedAt: new Date().toISOString()
            });
            setIsModalOpen(false);
            setFormData({ employeeId: "", skillId: "", level: "Needs Improvement", notes: "" });
            setSelectedCategory("");
            setSelectedSubCategory("");
        } catch (err) {
            console.error("Error submitting evaluation:", err);
            alert("Failed to submit evaluation. Please try again.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this record?")) return;
        try {
            await deleteDoc(doc(db, "performances", id));
        } catch (err) {
            console.error("Error deleting evaluation:", err);
            alert("Failed to delete record.");
        }
    };

    return (
        <div className="space-y-4">
            {/* Top Actions */}
            <div className="flex justify-end mb-2">
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    {(role === "superAdmin" || role === "supervisor") && (
                        <button onClick={() => setIsModalOpen(true)} className="glow-button px-3 py-1.5 flex items-center gap-1.5 active:scale-95 transition-all text-[10px] font-bold uppercase tracking-wide">
                            <PlusCircle size={14} strokeWidth={2.5} />
                            <span>Perform Review</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="premium-card !p-3 flex items-center gap-3"
                >
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <TrendingUp size={14} className="text-blue-400" />
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-black tracking-widest text-[#8E8E93] mb-0.5">Total Records</p>
                        <p className="text-xl font-bold text-white tracking-tight">{reviews.length}</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="premium-card !p-3 flex items-center gap-3"
                >
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center">
                        <Star size={14} className="text-[var(--primary)]" />
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-black tracking-widest text-[#8E8E93] mb-0.5">Mastered %</p>
                        <p className="text-xl font-bold text-white tracking-tight">{((reviews.filter(r => r.level === 'Mastered').length / (reviews.length || 1)) * 100).toFixed(0)}%</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="premium-card !p-3 flex items-center gap-3"
                >
                    <div className="w-8 h-8 shrink-0 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <AlertCircle size={14} className="text-red-400" />
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-black tracking-widest text-[#8E8E93] mb-0.5">Needs Improvement</p>
                        <p className="text-xl font-bold text-white tracking-tight">{reviews.filter(r => r.level === 'Needs Improvement').length}</p>
                    </div>
                </motion.div>
            </div>

            <div className="w-full">
                <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History size={16} className="text-[var(--primary)]" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-white">Review History</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--primary)] w-3/4"></div>
                        </div>
                        <span className="text-[9px] font-bold text-[#8E8E93]">Live Updates</span>
                    </div>
                </div>

                <div className="p-3 space-y-2">
                    {reviews.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-[#8E8E93] text-sm italic">No performance records found.</p>
                        </div>
                    ) : reviews.map((rev, idx) => (
                        <motion.div
                            key={rev.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-[var(--primary)]/20 hover:bg-white/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 shrink-0 rounded-lg bg-[#1A1A1A] border border-white/10 flex items-center justify-center font-black text-[var(--primary)] group-hover:scale-110 transition-transform duration-500 text-[10px]">
                                    {rev.employeeName?.charAt(0)}
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="text-[11px] font-black text-white group-hover:text-[var(--primary)] transition-colors uppercase tracking-tight">{rev.employeeName}</h4>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#8E8E93]">{rev.skillName}</span>
                                        <span className="w-1 h-1 bg-white/10 rounded-full"></span>
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--primary)]/60">Evaluation</span>
                                        {rev.isMastered && (
                                            <span className="ml-1 flex items-center gap-0.5 text-[8px] font-black text-[var(--primary)] uppercase tracking-widest px-1.5 py-0.5 rounded border border-[var(--primary)]/30 bg-[var(--primary)]/10">
                                                <CheckCircle2 size={8} /> Mastered ✅
                                            </span>
                                        )}
                                        {rev.isProficient && !rev.isMastered && (
                                            <span className="ml-1 flex items-center gap-0.5 text-[8px] font-black text-[#3B82F6] uppercase tracking-widest px-1.5 py-0.5 rounded border border-[#3B82F6]/30 bg-[#3B82F6]/10">
                                                <CheckCircle2 size={8} /> Proficient ✅
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right space-y-1">
                                    <span
                                        style={{
                                            color: rev.color,
                                            backgroundColor: `${rev.color}15`,
                                            borderColor: `${rev.color}30`
                                        }}
                                        className="inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.1em] border shadow-sm"
                                    >
                                        {rev.level}
                                    </span>
                                    <p className="text-[8px] text-[#8E8E93] uppercase font-black opacity-40">By {rev.evaluatorName}</p>
                                </div>
                                <div className="hidden sm:block text-right border-l border-white/5 pl-4">
                                    <p className="text-[10px] font-black text-white">{new Date(rev.evaluatedAt).toLocaleDateString()}</p>
                                    <p className="text-[8px] font-bold text-[#8E8E93] uppercase tracking-tighter">{new Date(rev.evaluatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                {role === "superAdmin" && (
                                    <button
                                        onClick={() => handleDelete(rev.id)}
                                        className="p-2 bg-white/5 rounded-lg text-[#8E8E93] hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                        title="Delete Record"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setIsModalOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="w-full max-w-md bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[32px] relative z-10 !p-0 shadow-2xl overflow-hidden flex flex-col"
                            >
                                <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between bg-[var(--background)]/50">
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight">Performance <span className="text-[var(--primary)]">Evaluation</span></h2>
                                        <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">Log employee skill assessment</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsModalOpen(false);
                                            setFormData({ employeeId: "", skillId: "", level: "Needs Improvement", notes: "" });
                                            setSelectedCategory("");
                                            setSelectedSubCategory("");
                                        }}
                                        className="w-8 h-8 flex items-center justify-center text-[#8E8E93] hover:text-[var(--text-main)] hover:bg-[var(--glass-border)] rounded-xl transition-colors"
                                        title="Close Modal"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="flex flex-col max-h-[75vh]">
                                    <div className="p-6 overflow-y-auto no-scrollbar space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="space-y-1.5 md:col-span-2">
                                                <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Employee</label>
                                                <select required value={formData.employeeId} onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })} className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm transition-all appearance-none cursor-pointer" title="Select Employee">
                                                    <option value="" className="bg-[var(--background)]">Select Employee</option>
                                                    {employees.map(e => <option key={e.id} value={e.id} className="bg-[var(--background)]">{e.name}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Category</label>
                                                <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubCategory(""); setFormData({ ...formData, skillId: "" }); }} className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm transition-all appearance-none cursor-pointer" title="Filter by Category">
                                                    <option value="" className="bg-[var(--background)]">All Categories</option>
                                                    {categories.sort((a, b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id} className="bg-[var(--background)]">{c.name}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Sub Category</label>
                                                <select value={selectedSubCategory} disabled={!selectedCategory} onChange={(e) => { setSelectedSubCategory(e.target.value); setFormData({ ...formData, skillId: "" }); }} className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Filter by Sub Category">
                                                    <option value="" className="bg-[var(--background)]">All Sub Categories</option>
                                                    {subCategories.filter(sc => sc.categoryId === selectedCategory).sort((a, b) => a.name.localeCompare(b.name)).map(sc => <option key={sc.id} value={sc.id} className="bg-[var(--background)]">{sc.name}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-1.5 md:col-span-2">
                                                <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Skill Requirement</label>
                                                <select required value={formData.skillId} disabled={!selectedSubCategory} onChange={(e) => setFormData({ ...formData, skillId: e.target.value })} className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" title="Select Skill">
                                                    <option value="" className="bg-[var(--background)]">Select Skill</option>
                                                    {skills.filter(s => s.subCategoryId === selectedSubCategory).sort((a, b) => a.name.localeCompare(b.name)).map(s => <option key={s.id} value={s.id} className="bg-[var(--background)] flex break-words whitespace-normal">{s.name}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Observed Proficiency</label>
                                            <div className="flex gap-2">
                                                {levels.map(l => (
                                                    <button
                                                        key={l.label} type="button"
                                                        onClick={() => setFormData({ ...formData, level: l.label })}
                                                        className={cn(
                                                            "flex-1 py-2.5 px-3 rounded-xl border text-[11px] font-bold transition-all shadow-sm",
                                                            formData.level === l.label ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]" : "bg-[var(--background)] border-[var(--glass-border)] text-[#8E8E93] hover:border-[var(--primary)]/50 hover:text-[var(--text-main)]"
                                                        )}
                                                    >
                                                        {l.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Supervisor Notes</label>
                                            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm h-24 resize-none transition-all placeholder:text-[var(--text-main)]/20 shadow-inner" placeholder="Demonstrated excellent technique..." title="Evaluation Notes" />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-[var(--background)]/80 backdrop-blur-md border-t border-[var(--glass-border)] flex items-center justify-end gap-3 flex-col sm:flex-row mt-auto shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsModalOpen(false);
                                                setFormData({ employeeId: "", skillId: "", level: "Needs Improvement", notes: "" });
                                                setSelectedCategory("");
                                                setSelectedSubCategory("");
                                            }}
                                            className="w-full sm:w-auto px-6 py-3.5 text-xs font-bold text-[#8E8E93] hover:text-[var(--text-main)] transition-colors border border-transparent hover:border-[var(--glass-border)] rounded-xl"
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" className="glow-button w-full sm:w-auto px-8 py-3.5 flex items-center justify-center font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">Submit Evaluation</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
