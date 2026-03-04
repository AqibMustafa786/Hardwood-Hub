"use client";
import { useState, useEffect } from "react";
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Edit2,
    Trash2,
    UserPlus,
    Mail,
    Briefcase,
    ChevronLeft,
    X,
    ShieldCheck,
    Check,
    Save,
    Upload,
    Layers
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";
import { PermissionGuard } from "@/components/PermissionGuard";
import { AddMultipleSkillsModal } from "@/components/AddMultipleSkillsModal";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { useSort } from "@/hooks/useSort";

const AVAILABLE_PERMISSIONS = [
    { id: 'dashboard', label: 'View Dashboard', desc: 'Can access the main dashboard overview.' },
    { id: 'employees', label: 'Manage Personnel', desc: 'Can view and modify employee records.' },
    { id: 'categories', label: 'Manage Categories', desc: 'Can manage certification categories.' },
    { id: 'skills', label: 'Manage Skills', desc: 'Can update the skill registry.' },
    { id: 'performance', label: 'Performance Reviews', desc: 'Can conduct performance evaluations.' },
    { id: 'tasks', label: 'Task Management', desc: 'Can assign and manage Kanban tasks.' },
    { id: 'progress', label: 'Progress Tracking', desc: 'Can track employee skill progression.' },
    { id: 'knowledgebase', label: 'Knowledgebase Access', desc: 'Can access the operational knowledgebase.' },
    { id: 'settings', label: 'Super Admin Settings', desc: 'Can modify global system parameters.' },
];

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState<any>(null);
    const { user, role, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const searchTerm = searchParams.get('q')?.toLowerCase() || "";

    const [filterRole, setFilterRole] = useState<string>("All");
    const [filterStatus, setFilterStatus] = useState<string>("All");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        position: "Crew member",
        role: "crewMember",
        status: "Active",
        photoURL: "",
        identification: "",
        permissions: {} as Record<string, boolean>
    });

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (!user || authLoading) return;
        const q = query(collection(db, "users"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEmployees(data);
            setLoading(false);
        }, (err) => console.error(err));

        return () => unsubscribe();
    }, [user, authLoading]);

    const { sortedData: sortedEmployeesList, sortConfig, handleSort } = useSort(employees);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (currentEmployee) {
                await updateDoc(doc(db, "users", currentEmployee.id), formData);
            } else {
                await addDoc(collection(db, "users"), {
                    ...formData,
                    createdAt: new Date().toISOString()
                });
            }
            setIsModalOpen(false);
            resetForm();
        } catch (err) {
            console.error("Error saving employee:", err);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            position: "Crew member",
            role: "crewMember",
            status: "Active",
            photoURL: "",
            identification: "",
            permissions: {}
        });
        setCurrentEmployee(null);
    };

    const filteredEmployees = sortedEmployeesList.filter(emp => {
        const matchesSearch = emp.name?.toLowerCase().includes(searchTerm) || emp.email?.toLowerCase().includes(searchTerm);
        const matchesRole = filterRole === "All" || emp.role === filterRole;
        const matchesStatus = filterStatus === "All" || emp.status === filterStatus;

        return matchesSearch && matchesRole && matchesStatus;
    });

    const activeFiltersCount = (filterRole !== "All" ? 1 : 0) + (filterStatus !== "All" ? 1 : 0);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this employee?")) return;
        try {
            await deleteDoc(doc(db, "users", id));
        } catch (err) {
            console.error("Error deleting employee:", err);
            alert("Failed to delete employee.");
        }
    };


    return (
        <div className="space-y-4">
            {/* Top Actions */}
            <div className="flex flex-col gap-3 mb-2">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full gap-3">

                    {/* Active Filter Chips */}
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-h-[28px]">
                        {filterRole !== "All" && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 shadow-sm">
                                <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Role: {filterRole}</span>
                                <button onClick={() => setFilterRole("All")} className="text-[var(--primary)] hover:text-white transition-colors" title="Remove Filter"><X size={12} /></button>
                            </motion.div>
                        )}
                        {filterStatus !== "All" && (
                            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 shadow-sm">
                                <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Status: {filterStatus}</span>
                                <button onClick={() => setFilterStatus("All")} className="text-[var(--primary)] hover:text-white transition-colors" title="Remove Filter"><X size={12} /></button>
                            </motion.div>
                        )}
                        {activeFiltersCount > 0 && (
                            <button onClick={() => { setFilterRole("All"); setFilterStatus("All"); }} className="text-[9px] text-[#8E8E93] hover:text-white font-bold uppercase tracking-widest transition-colors ml-1">Clear All</button>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto z-20">
                        <div className="relative w-full sm:w-64 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within:text-[var(--primary)] transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Find personnel..."
                                defaultValue={searchTerm}
                                onChange={(e) => {
                                    const params = new URLSearchParams(searchParams);
                                    if (e.target.value) {
                                        params.set('q', e.target.value);
                                    } else {
                                        params.delete('q');
                                    }
                                    router.replace(`${window.location.pathname}?${params.toString()}`);
                                }}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-lg py-1.5 pl-10 pr-3 text-white text-[10px] outline-none focus:border-[var(--primary)]/50 focus:bg-white/[0.06] transition-all"
                            />
                        </div>

                        {/* Filter Button & Dropdown */}
                        <div className="relative w-full sm:w-auto flex-shrink-0">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={cn(
                                    "px-4 py-1.5 w-full sm:w-auto rounded-lg border flex items-center justify-center gap-2 transition-all h-[34px] text-[10px] font-bold uppercase tracking-wider",
                                    isFilterOpen || activeFiltersCount > 0 ? "bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]" : "bg-[var(--background)] border-[var(--glass-border)] text-[#8E8E93] hover:text-[var(--text-main)] hover:border-[var(--primary)]/30"
                                )}
                            >
                                <Filter size={12} />
                                <span>Filter</span>
                                {activeFiltersCount > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[9px] ml-1">{activeFiltersCount}</span>
                                )}
                            </button>

                            <AnimatePresence>
                                {isFilterOpen && (
                                    <>
                                        {/* Invisible backdrop to dismiss on click outside */}
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
                                                    <label className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider">Role Type</label>
                                                    <select
                                                        title="Filter by Role Type"
                                                        value={filterRole}
                                                        onChange={(e) => setFilterRole(e.target.value)}
                                                        className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-lg py-2 px-3 text-[10px] text-[var(--text-main)] outline-none focus:border-[var(--primary)] appearance-none cursor-pointer"
                                                    >
                                                        <option value="All" className="bg-[var(--background)]">All Roles</option>
                                                        <option value="crewMember" className="bg-[var(--background)]">Crew Member</option>
                                                        <option value="supervisor" className="bg-[var(--background)]">Supervisor</option>
                                                        <option value="finance" className="bg-[var(--background)]">Finance</option>
                                                        <option value="superAdmin" className="bg-[var(--background)]">Super Admin</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider">Employment Status</label>
                                                    <select
                                                        title="Filter by Employment Status"
                                                        value={filterStatus}
                                                        onChange={(e) => setFilterStatus(e.target.value)}
                                                        className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-lg py-2 px-3 text-[10px] text-[var(--text-main)] outline-none focus:border-[var(--primary)] appearance-none cursor-pointer"
                                                    >
                                                        <option value="All" className="bg-[var(--background)]">All Statuses</option>
                                                        <option value="Active" className="bg-[var(--background)]">Active</option>
                                                        <option value="Inactive" className="bg-[var(--background)]">Inactive</option>
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

                        {role === "superAdmin" && (
                            <button
                                onClick={() => { resetForm(); setIsModalOpen(true); }}
                                className="glow-button px-4 py-1.5 flex items-center justify-center gap-1.5 h-[34px] w-full sm:w-auto active:scale-95 transition-all text-[9px] uppercase tracking-widest ml-0 sm:ml-2"
                            >
                                <UserPlus size={12} strokeWidth={2.5} />
                                <span>Add Employee</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Personnel Manifest */}
            <div className="premium-card overflow-hidden !p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-separate border-spacing-0">
                        <thead>
                            <tr className="text-left bg-white/[0.02] border-b border-white/5">
                                <th className="py-2.5 px-4 text-[8px] font-black uppercase tracking-[0.3em] text-[#8E8E93] cursor-pointer hover:text-[var(--primary)] transition-colors" onClick={() => handleSort('name')}>
                                    Name / Email {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-2.5 px-4 text-[8px] font-black uppercase tracking-[0.3em] text-[#8E8E93] cursor-pointer hover:text-[var(--primary)] transition-colors" onClick={() => handleSort('position')}>
                                    Position {sortConfig?.key === 'position' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-2.5 px-4 text-[8px] font-black uppercase tracking-[0.3em] text-[#8E8E93] cursor-pointer hover:text-[var(--primary)] transition-colors" onClick={() => handleSort('status')}>
                                    Status {sortConfig?.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-2.5 px-4 text-[8px] font-black uppercase tracking-[0.3em] text-[#8E8E93] cursor-pointer hover:text-[var(--primary)] transition-colors" onClick={() => handleSort('role')}>
                                    Role {sortConfig?.key === 'role' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                                </th>
                                <th className="py-2.5 px-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                [1, 2, 3, 4].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="py-6 px-4">
                                            <div className="h-4 bg-white/5 rounded-full w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredEmployees.map((emp: any, idx: number) => (
                                <motion.tr
                                    key={emp.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group hover:bg-white/[0.03] transition-all duration-500 relative"
                                >
                                    <td className="py-2 px-4 border-b border-white/5 group-hover:border-[var(--primary)]/20 transition-colors">
                                        <div
                                            className="flex items-center gap-3 cursor-pointer"
                                            onClick={() => router.push(`/employees/${emp.id}`)}
                                        >
                                            <div className="relative">
                                                <div className="absolute -inset-2 bg-[var(--primary)]/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="relative w-6 h-6 rounded-full bg-[var(--background)] border border-[var(--glass-border)] flex items-center justify-center overflow-hidden shadow-sm group-hover:border-[var(--primary)]/30 transition-colors">
                                                    <span className="absolute inset-0 flex items-center justify-center font-black text-[var(--primary)] text-[10px] opacity-80 z-0">
                                                        {emp.email ? emp.email.charAt(0).toUpperCase() : emp.name?.charAt(0)}
                                                    </span>
                                                    {emp.photoURL && emp.photoURL.startsWith('http') && (
                                                        <img
                                                            src={emp.photoURL}
                                                            alt={emp.name}
                                                            className="absolute inset-0 w-full h-full object-cover z-10"
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[var(--text-main)] font-black text-[10px] uppercase tracking-tight group-hover:text-[var(--primary)] transition-colors">{emp.name}</span>
                                                <span className="text-[#8E8E93] text-[7px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-1.5">
                                                    <Mail size={8} className="text-[var(--primary)]/40" /> {emp.email}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-2 px-4 border-b border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[var(--text-main)] text-[9px] font-black uppercase tracking-[0.15em]">{emp.position}</span>
                                        </div>
                                    </td>
                                    <td className="py-2 px-4 border-b border-white/5">
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full relative",
                                                emp.status === "Active" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                                            )}>
                                                <div className={cn(
                                                    "absolute inset-0 rounded-full animate-ping opacity-25",
                                                    emp.status === "Active" ? "bg-emerald-400" : "bg-red-400"
                                                )}></div>
                                            </div>
                                            <span className={cn(
                                                "text-[8px] font-black uppercase tracking-[0.2em]",
                                                emp.status === "Active" ? "text-emerald-400" : "text-red-400"
                                            )}>
                                                {emp.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-2 px-4 border-b border-white/5">
                                        <span className="text-[var(--primary)] text-[7px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded bg-[var(--primary)]/10 border border-[var(--primary)]/20 shadow-[0_2px_5px_rgba(var(--primary-rgb),0.1)]">
                                            {emp.role}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4 border-b border-white/5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                            <button
                                                onClick={() => {
                                                    setCurrentEmployee(emp);
                                                    setFormData({
                                                        ...emp,
                                                        permissions: emp.permissions || {}
                                                    });
                                                    setIsModalOpen(true);
                                                }}
                                                className="w-6 h-6 flex items-center justify-center bg-[#0D0D0D] border border-white/10 text-[#8E8E93] hover:text-[var(--primary)] hover:border-[var(--primary)]/30 rounded shadow-sm transition-all"
                                                title="Edit Protocol"
                                            >
                                                <Edit2 size={10} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setCurrentEmployee(emp);
                                                    setIsBulkModalOpen(true);
                                                }}
                                                className="w-6 h-6 flex items-center justify-center bg-[#0D0D0D] border border-white/10 text-[#8E8E93] hover:text-[#3B82F6] hover:border-[#3B82F6]/30 rounded shadow-sm transition-all"
                                                title="Add Multiple Skills"
                                            >
                                                <Layers size={10} />
                                            </button>
                                            <PermissionGuard permission="employees.delete">
                                                <button
                                                    onClick={() => handleDelete(emp.id)}
                                                    className="w-6 h-6 flex items-center justify-center bg-[#0D0D0D] border border-white/10 text-[#8E8E93] hover:text-red-400 hover:border-red-500/30 rounded shadow-sm transition-all"
                                                    title="Terminate Entry"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </PermissionGuard>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddMultipleSkillsModal
                isOpen={isBulkModalOpen}
                onClose={() => {
                    setIsBulkModalOpen(false);
                    setCurrentEmployee(null);
                }}
                employee={currentEmployee}
            />

            {/* Modal Overlay */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 animate-fade-in">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl"
                            onClick={() => setIsModalOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-xl premium-card !p-0 rounded-[28px] overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-black text-white tracking-tight">
                                        {currentEmployee ? 'Modify' : 'Add'} <span className="text-[var(--primary)]">Employee</span>
                                    </h2>
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#8E8E93]">Operational Manifest</p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center text-[#8E8E93] hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                                    title="Close Dialog"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden max-h-[80vh]">
                                <div className="overflow-y-auto p-6 custom-scrollbar flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Employee Name</label>
                                            <input
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-4 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm transition-all placeholder:text-[var(--text-main)]/20 shadow-inner"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Email</label>
                                            <input
                                                required type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-4 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm transition-all placeholder:text-[var(--text-main)]/20 shadow-inner"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Position</label>
                                            <input
                                                value={formData.position}
                                                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                                className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-4 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm transition-all placeholder:text-[var(--text-main)]/20 shadow-inner"
                                                placeholder="Crew Member"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="role-select" className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Role</label>
                                            <select
                                                id="role-select"
                                                title="Select Employee Role"
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-4 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm transition-all appearance-none shadow-inner cursor-pointer"
                                            >
                                                <option value="crewMember" className="bg-[var(--background)]">Crew Member</option>
                                                <option value="supervisor" className="bg-[var(--background)]">Supervisor</option>
                                                <option value="superAdmin" className="bg-[var(--background)]">Super Admin</option>
                                                <option value="finance" className="bg-[var(--background)]">Finance</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5 focus-within:relative z-10">
                                            <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Identification Badges <span className="text-[9px] lowercase normal-case opacity-50">(comma-separated)</span></label>
                                            <input
                                                value={formData.identification || ""}
                                                onChange={(e) => setFormData({ ...formData, identification: e.target.value })}
                                                className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-4 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm transition-all placeholder:text-[var(--text-main)]/20 shadow-inner"
                                                placeholder="e.g. HH-001, Safety Rep, QA Lead"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="status-select" className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Status</label>
                                            <select
                                                id="status-select"
                                                title="Select Employee Status"
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-4 outline-none focus:border-[var(--primary)] text-[var(--text-main)] text-sm transition-all appearance-none shadow-inner cursor-pointer"
                                            >
                                                <option value="Active" className="bg-[var(--background)]">Active</option>
                                                <option value="Inactive" className="bg-[var(--background)]">Inactive</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Profile Image</label>
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        title="Upload Profile Image"
                                                    />
                                                    <div className="w-full bg-[var(--background)] border border-[var(--glass-border)] shadow-inner rounded-xl py-3 px-4 flex items-center justify-between text-[var(--text-main)] opacity-80 text-sm overflow-hidden transition-all hover:border-[var(--primary)]/50 group">
                                                        <span className="truncate group-hover:text-[var(--primary)] transition-colors">{formData.photoURL ? 'Image Selected' : 'Choose File...'}</span>
                                                        <Upload size={16} className="group-hover:text-[var(--primary)] transition-colors" />
                                                    </div>
                                                </div>
                                                {formData.photoURL && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, photoURL: "" })}
                                                        className="h-full px-3 bg-white/5 border border-white/10 text-red-400 hover:bg-red-400/10 hover:border-red-500/20 rounded-xl transition-colors shrink-0 flex items-center justify-center"
                                                        title="Remove Image"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck size={16} className="text-[var(--primary)]" />
                                                <h3 className="text-sm font-bold text-white tracking-tight">Granular Permissions</h3>
                                            </div>
                                            <button type="button" className="text-[9px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-lg bg-white/[0.03] text-[#8E8E93] hover:text-white transition-colors">
                                                Override Default Role Access
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {AVAILABLE_PERMISSIONS.map(permission => (
                                                <label key={permission.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-[var(--primary)]/20 transition-colors cursor-pointer group">
                                                    <div className="relative flex items-center justify-center w-5 h-5 mt-0.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={!!formData.permissions[permission.id]}
                                                            onChange={(e) => setFormData({
                                                                ...formData,
                                                                permissions: {
                                                                    ...formData.permissions,
                                                                    [permission.id]: e.target.checked
                                                                }
                                                            })}
                                                            className="peer appearance-none w-5 h-5 border border-white/20 rounded-md checked:bg-[var(--primary)] checked:border-[var(--primary)] transition-colors cursor-pointer"
                                                        />
                                                        <Check size={12} strokeWidth={4} className="absolute text-[#050505] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white group-hover:text-[var(--primary)] transition-colors">{permission.label}</p>
                                                        <p className="text-[10px] text-[#8E8E93] mt-0.5">{permission.desc}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-5 flex justify-end gap-3 bg-[var(--background)]/80 backdrop-blur-md border-t border-[var(--glass-border)] shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl font-bold text-xs text-[#8E8E93] hover:text-[var(--text-main)] hover:bg-[var(--glass-border)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2.5 rounded-xl font-bold text-xs text-[#050505] bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] transition-all flex items-center gap-2"
                                    >
                                        <Save size={14} />
                                        {currentEmployee ? 'Save Changes' : 'Confirm Personnel'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
