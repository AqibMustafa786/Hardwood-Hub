"use client";
import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export default function MatrixPage() {
    const [matrixRecords, setMatrixRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, profile, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!user || authLoading) return;

        const unsubscribe = onSnapshot(collection(db, "performances"), (snapshot) => {
            const rawPerformances = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

            // The "Matrix Mechanism": We group by Employee ID and Skill ID.
            const groupedMap = new Map<string, any>();

            rawPerformances.forEach(perf => {
                // Ignore records missing crucial links just in case
                if (!perf.employeeId || !perf.skillId) return;

                const key = `${perf.employeeId}_${perf.skillId}`;
                const existing = groupedMap.get(key);

                if (!existing) {
                    groupedMap.set(key, {
                        key: key,
                        employeeName: perf.employeeName,
                        skillName: perf.skillName,
                        // If we don't have cat/subCat mapped statically in performances, handle gracefully
                        // This logic mirrors the "Admin Dashboard" screenshot requirements
                        skillId: perf.skillId,
                        timesReviewed: perf.timesReviewed || 1, // Start with timesReviewed count from CSV, or 1 
                        latestDate: new Date(perf.evaluatedAt).getTime(),
                        supervisor: perf.evaluatorName,
                        level: perf.level,
                        color: perf.color
                    });
                } else {
                    // Update if this record is newer
                    const newDate = new Date(perf.evaluatedAt).getTime();

                    if (newDate > existing.latestDate) {
                        existing.latestDate = newDate;
                        existing.supervisor = perf.evaluatorName;
                        existing.level = perf.level;
                        existing.color = perf.color;
                    }

                    // Increment times reviewed
                    // If the previous record was migrated from CSV, it has a bulk 'timesReviewed' 
                    // Any newly added records via app count as +1
                    existing.timesReviewed += 1;
                }
            });

            const finalList = Array.from(groupedMap.values()).sort((a, b) => a.employeeName.localeCompare(b.employeeName) || a.skillName.localeCompare(b.skillName));
            setMatrixRecords(finalList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, authLoading]);

    if (loading) return null;

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight">Admin <span className="text-[var(--primary)]">Dashboard</span></h1>
                    <p className="text-sm font-bold text-[#8E8E93] mt-1.5 flex items-center gap-2 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"></span>
                        Performance Aggregation Matrix
                    </p>
                </div>
            </div>

            {/* Matrix Table */}
            <div className="premium-glass rounded-2xl border border-[var(--glass-border)] shadow-2xl overflow-hidden relative group">
                {/* Background glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--glass-border)] bg-[var(--background)]/50">
                                <th className="p-4 text-xs font-black text-[#8E8E93] uppercase tracking-widest">Employee</th>
                                <th className="p-4 text-xs font-black text-[#8E8E93] uppercase tracking-widest">Skill</th>
                                <th className="p-4 text-xs font-black text-[#8E8E93] uppercase tracking-widest w-[120px] text-center">Reviewed</th>
                                <th className="p-4 text-xs font-black text-[#8E8E93] uppercase tracking-widest">Supervisor</th>
                                <th className="p-4 text-xs font-black text-[#8E8E93] uppercase tracking-widest w-[180px]">Current Skill Level</th>
                                <th className="p-4 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--glass-border)]">
                            {matrixRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-[#8E8E93] font-bold text-sm tracking-widest uppercase">
                                        No Performance Matrices Available
                                    </td>
                                </tr>
                            ) : matrixRecords.map((row, idx) => (
                                <motion.tr
                                    key={row.key}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                                    className="hover:bg-white/[0.02] transition-colors relative"
                                >
                                    <td className="p-4">
                                        <div className="font-bold text-sm text-[var(--text-main)] tracking-wide">{row.employeeName}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-xs text-[#8E8E93] max-w-md line-clamp-2 leading-relaxed">{row.skillName}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="font-black text-sm text-[var(--primary)]">{row.timesReviewed}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-semibold text-xs text-[#8E8E93]">{row.supervisor}</div>
                                    </td>
                                    <td className="p-4">
                                        <span
                                            className="px-4 py-2 rounded font-black text-[10px] uppercase tracking-[0.15em] border shadow-sm w-full block text-center"
                                            style={{
                                                backgroundColor: row.level === 'Mastered' ? 'var(--primary)' : (row.level === 'Proficient' ? '#3B82F6' : '#EF4444'),
                                                color: '#FFFFFF',
                                                borderColor: 'transparent'
                                            }}
                                        >
                                            {row.level}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <svg className="w-4 h-4 text-[#8E8E93] inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
