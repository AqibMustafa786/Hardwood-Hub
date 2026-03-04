"use client";
import { useState, useEffect } from "react";
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    query,
    orderBy,
    getDocs,
    where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
    Shield,
    Plus,
    Search,
    Trash2,
    Edit2,
    Copy,
    ChevronRight,
    CheckSquare,
    Square,
    Save,
    X,
    Lock,
    Unlock,
    Info,
    CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { NavbarPortal } from "@/components/NavbarPortal";
import { createPortal } from "react-dom";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const PERMISSION_MANIFEST: Record<string, string[]> = {
    "Dashboard": ["dashboard.view", "dashboard.view_metrics"],
    "Personnel": ["employees.view", "employees.create", "employees.update", "employees.delete", "employees.export"],
    "Taxonomy": ["categories.view", "categories.create", "categories.update", "categories.delete", "skills.view", "skills.create", "skills.update", "skills.delete"],
    "Workflows": ["tasks.view", "tasks.create", "tasks.update", "tasks.delete", "tasks.comment"],
    "Reporting": ["performance.view", "performance.execute", "progress.view", "progress.update"],
    "Resources": ["knowledgebase.view", "knowledgebase.create", "knowledgebase.update"],
    "System": ["settings.view", "settings.roles.view", "settings.roles.manage", "settings.audit.view", "*.*.*"]
};

export default function RolesPage() {
    const { hasPermission } = useAuth();
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        description: "",
        permissions: [] as string[],
        parentId: ""
    });

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "roles"), (snap) => {
            setRoles(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleSaveRole = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const roleId = formData.id || formData.name.toLowerCase().replace(/ /g, "-");
            const roleData = {
                name: formData.name,
                description: formData.description,
                permissions: formData.permissions,
                parentId: formData.parentId || null,
                updatedAt: new Date().toISOString()
            };

            await updateDoc(doc(db, "roles", roleId), roleData as any)
                .catch(() => addDoc(collection(db, "roles"), { ...roleData, id: roleId }));

            setIsModalOpen(false);
            setFormData({ id: "", name: "", description: "", permissions: [], parentId: "" });
        } catch (err) {
            console.error("Error saving role:", err);
            alert("Failed to save role.");
        }
    };

    const togglePermission = (perm: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm]
        }));
    };

    if (!hasPermission('settings.roles.view')) return <div>Access Denied</div>;

    return (
        <div className="space-y-4">
            <NavbarPortal>
                <button
                    onClick={() => {
                        setEditingRole(null);
                        setFormData({ id: "", name: "", description: "", permissions: [], parentId: "" });
                        setIsModalOpen(true);
                    }}
                    className="glow-button px-4 py-2 flex items-center gap-2 text-[9px] uppercase tracking-widest font-black mr-2"
                >
                    <Plus size={14} />
                    <span>Initialize Role</span>
                </button>
            </NavbarPortal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {roles.map((role) => (
                    <div
                        key={role.id}
                        className="premium-card group p-4 hover:border-[var(--primary)]/30 transition-all duration-300 shadow-sm"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center">
                                    <Shield size={16} className="text-[var(--primary)]" />
                                </div>
                                <div>
                                    <h3 className="text-sm text-[var(--text-main)] font-black uppercase tracking-tight">{role.name}</h3>
                                    <span className="text-[8px] text-[#8E8E93] font-bold uppercase tracking-widest">{role.id}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        setEditingRole(role);
                                        setFormData({
                                            id: role.id,
                                            name: role.name,
                                            description: role.description,
                                            permissions: role.permissions || [],
                                            parentId: role.parentId || ""
                                        });
                                        setIsModalOpen(true);
                                    }}
                                    className="p-2 hover:text-[var(--primary)] transition-colors"
                                    title="Edit Role"
                                    aria-label="Edit Role Configuration"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    className="p-2 hover:text-red-400 transition-colors"
                                    title="Delete Role"
                                    aria-label="Terminate Role Entry"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <p className="text-[#8E8E93] text-[10px] leading-relaxed mb-4 line-clamp-2">{role.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {role.permissions?.slice(0, 3).map((p: string) => (
                                <span key={p} className="text-[7.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-[var(--background)] border border-[var(--glass-border)] text-[var(--text-main)]/70">{p}</span>
                            ))}
                            {role.permissions?.length > 3 && (
                                <span className="text-[7.5px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm bg-[var(--primary)]/10 text-[var(--primary)]">+{role.permissions.length - 3} More</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Role Config Modal */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="relative w-full max-w-5xl h-[90vh] bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
                            >
                                <div className="p-8 border-b border-[var(--glass-border)] flex items-center justify-between bg-[var(--background)]/50">
                                    <div>
                                        <h2 className="text-2xl font-black text-[var(--text-main)] uppercase tracking-tighter">Operational <span className="text-[var(--primary)]">Directive</span></h2>
                                        <p className="text-[11px] text-[#8E8E93] font-bold uppercase tracking-[0.3em] mt-1 opacity-80">Configure Authorization Manifest</p>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="w-10 h-10 rounded-full border border-[var(--glass-border)] flex items-center justify-center text-[#8E8E93] hover:text-[var(--text-main)] hover:bg-[var(--glass-border)] transition-all"
                                        title="Close Portal"
                                        aria-label="Close Role Configuration Modal"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveRole} className="flex-1 overflow-y-auto no-scrollbar p-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* General Info */}
                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-1">Role Identifier</label>
                                                <input
                                                    required
                                                    disabled={!!editingRole}
                                                    value={formData.id}
                                                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                                    className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl p-5 text-[var(--text-main)] text-[14px] font-bold outline-none focus:border-[var(--primary)] focus:shadow-sm transition-all shadow-sm disabled:opacity-50"
                                                    placeholder="supervisor-alpha"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-1">Manifest Name</label>
                                                <input
                                                    required
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl p-5 text-[var(--text-main)] text-[14px] font-bold outline-none focus:border-[var(--primary)] focus:shadow-sm transition-all shadow-sm"
                                                    placeholder="Site Supervisor"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-1">Functional Brief</label>
                                                <textarea
                                                    rows={5}
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl p-5 text-[var(--text-main)] text-[14px] font-bold outline-none focus:border-[var(--primary)] focus:shadow-sm transition-all resize-none shadow-sm"
                                                    placeholder="Define functional scope..."
                                                />
                                            </div>
                                        </div>

                                        {/* Permission Tree */}
                                        <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
                                            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-[0.3em] text-[#8E8E93] mb-4 px-1">
                                                <span>Permission Matrix</span>
                                                <span className="opacity-80 bg-[var(--primary)]/10 text-[var(--primary)] px-3 py-1 rounded-full">Selected: {formData.permissions.length}</span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto no-scrollbar pr-2 pb-12 flex-1">
                                                {Object.entries(PERMISSION_MANIFEST).map(([group, perms]) => (
                                                    <div key={group} className="p-6 rounded-[24px] bg-[var(--background)] border border-[var(--glass-border)] shadow-sm space-y-5 hover:border-[var(--primary)]/30 transition-all group/card">
                                                        <h4 className="text-[12px] font-black text-[var(--text-main)] uppercase tracking-tight border-b border-[var(--glass-border)] pb-3 mb-2 opacity-80 group-hover/card:opacity-100 transition-opacity flex items-center gap-2">
                                                            <Shield size={14} className="text-[var(--primary)]" />
                                                            {group}
                                                        </h4>
                                                        <div className="space-y-4">
                                                            {perms.map(p => (
                                                                <div
                                                                    key={p}
                                                                    onClick={() => togglePermission(p)}
                                                                    className="flex items-center justify-between group/item cursor-pointer"
                                                                >
                                                                    <span className={cn(
                                                                        "text-[11px] font-bold tracking-tight transition-colors",
                                                                        formData.permissions.includes(p) ? "text-[var(--text-main)]" : "text-[#8E8E93] group-hover/item:text-[var(--text-main)]/70"
                                                                    )}>
                                                                        {p}
                                                                    </span>
                                                                    {formData.permissions.includes(p) ? (
                                                                        <div className="w-5 h-5 rounded-lg bg-[var(--primary)] shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)] flex items-center justify-center text-black">
                                                                            <CheckCircle2 size={12} strokeWidth={4} />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-5 h-5 rounded-lg border-2 border-[var(--glass-border)] group-hover/item:border-[var(--primary)]/50 transition-colors bg-[var(--background)] shadow-inner" />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </form>

                                <div className="p-6 border-t border-[var(--glass-border)] flex justify-end gap-3 bg-[var(--background)]/50">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 rounded-2xl font-bold text-xs text-[#8E8E93] bg-[var(--background)] border border-[var(--glass-border)] hover:bg-[var(--glass-border)] hover:text-[var(--text-main)] transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        onClick={handleSaveRole}
                                        className="glow-button px-8 py-3 flex items-center gap-2 active:scale-95 transition-all"
                                    >
                                        <Save size={14} />
                                        <span className="uppercase tracking-widest font-black text-[10px]">Commit Manifest</span>
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
