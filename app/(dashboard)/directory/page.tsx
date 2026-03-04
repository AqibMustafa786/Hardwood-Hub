"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Mail, Shield, Settings, Info, Briefcase, Award } from "lucide-react";

interface Employee {
    id: string;
    name: string;
    email: string;
    role: string;
    position?: string;
    createdAt: string;
    topSkills?: { name: string; level: 'Mastered' | 'Proficient' }[]; // derived from performance
}

export default function EmployeeDirectory() {
    const { user, profile, hasPermission } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Visibility Logic (Replicating AppSheet 'All Employee' slice)
    // IF(IN("Super Admin", ...), TRUE, OR(IN("Crew member", [Position]), [Email]=USEREMAIL()))
    const isSuperAdmin = profile?.position === "Super Admin";
    const isCrewMember = profile?.position === "Crew member";

    useEffect(() => {
        const fetchEmployees = async () => {
            if (!user || !profile) return;
            setLoading(true);
            try {
                // Fetch all users first
                const usersSnap = await getDocs(query(collection(db, "users"), orderBy("name")));
                let userList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));

                // Apply Visibility Rules Client-Side (In production, use Firestore Security Rules + Queries)
                if (!isSuperAdmin) {
                    if (isCrewMember) {
                        // Crew members see themselves and other crew members
                        userList = userList.filter(u => u.position === "Crew member" || u.email === user.email);
                    } else {
                        // Standard employees only see themselves
                        userList = userList.filter(u => u.email === user.email);
                    }
                }

                // Temporary mock enrichment for Top Skills
                const enrichedUsers = userList.map(u => ({
                    ...u,
                    topSkills: [
                        { name: "Sanding & Restoration", level: "Mastered" as const },
                        { name: "Final Finishing", level: "Proficient" as const }
                    ].slice(0, Math.floor(Math.random() * 2) + 1) // 1 or 2 mock skills
                }));

                setEmployees(enrichedUsers);
            } catch (error) {
                console.error("Error fetching directory:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [user, profile, isSuperAdmin, isCrewMember]);


    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <div className="w-8 h-8 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Directory Content */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                <AnimatePresence>
                    {employees.map((emp, i) => (
                        <motion.div
                            key={emp.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="wood-card overflow-hidden group hover:border-[var(--primary)]/30 transition-all cursor-default relative"
                        >
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="p-3 flex flex-col items-center text-center space-y-2.5">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--background)] border border-[var(--glass-border)] mx-auto flex items-center justify-center text-xl font-black text-[var(--text-main)] group-hover:scale-105 transition-transform duration-500 shadow-[0_0_15px_rgba(0,0,0,0.1)] overflow-hidden relative z-10">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 to-transparent"></div>
                                        {emp.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="absolute -inset-2 bg-[var(--primary)]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0"></div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-[var(--text-main)] tracking-tight">{emp.name}</h3>
                                    <div className="flex items-center justify-center gap-1.5 mt-0.5">
                                        <Briefcase size={10} className="text-[#8E8E93]" />
                                        <p className="text-[9px] font-bold text-[#A0A0A0] uppercase tracking-widest leading-none">
                                            {emp.position || emp.role}
                                        </p>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-white/5 relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                </div>

                                <div className="w-full flex items-center justify-center text-[9px] font-medium text-[#8E8E93]">
                                    <div className="flex items-center gap-1.5">
                                        <Mail size={12} />
                                        <span className="truncate max-w-[140px]">{emp.email}</span>
                                    </div>
                                </div>

                                <div className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-lg p-2.5 text-left shadow-sm">
                                    <div className="text-[8px] font-black uppercase tracking-widest text-[#8E8E93] mb-1.5 flex items-center gap-1.5">
                                        <Award size={9} className="text-[var(--primary)]" />
                                        Key Competencies
                                    </div>
                                    <div className="space-y-1">
                                        {emp.topSkills?.map((skill, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-[10px]">
                                                <span className="text-[var(--text-main)] font-medium truncate pr-2">{skill.name}</span>
                                                <span className={skill.level === 'Mastered' ? "text-[var(--primary)] font-bold tracking-wider text-[8px] uppercase" : "text-[#3B82F6] font-bold tracking-wider text-[8px] uppercase"}>
                                                    {skill.level === 'Mastered' ? 'MST' : 'PRO'}
                                                </span>
                                            </div>
                                        ))}
                                        {(!emp.topSkills || emp.topSkills.length === 0) && (
                                            <span className="text-[9px] text-[#A0A0A0] italic">Evaluations Pending</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {!loading && employees.length === 0 && (
                <div className="wood-card py-16 text-center flex flex-col items-center justify-center bg-transparent border-dashed">
                    <Users size={40} className="text-[#8E8E93] mb-4 opacity-50" />
                    <h3 className="text-lg font-bold text-white tracking-tight">No Employees Found</h3>
                    <p className="text-[#8E8E93] text-[11px] uppercase tracking-widest mt-1">Check your visibility permissions</p>
                </div>
            )}
        </div>
    );
}
