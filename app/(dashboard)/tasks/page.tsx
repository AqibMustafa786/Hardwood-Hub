"use client";
import { useState, useEffect } from "react";
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    deleteDoc,
    orderBy,
    Timestamp,
    where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Clock,
    CheckCircle2,
    AlertCircle,
    MessageSquare,
    User,
    Calendar,
    ChevronRight,
    X,
    Layout,
    Layers,
    Send,
    Trash2,
    Edit2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const COLUMNS = [
    { id: "todo", title: "To Do", color: "#8E8E93" },
    { id: "inprogress", title: "In Progress", color: "var(--primary)" },
    { id: "review", title: "Review", color: "#FFB35C" },
    { id: "done", title: "Completed", color: "#10B981" }
];

const STICKY_COLORS = [
    "bg-[#FFB35C]/10 border-[#FFB35C]/20 text-[#FFB35C]",
    "bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]",
    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    "bg-sky-500/10 border-sky-500/20 text-sky-400"
];

export default function TasksPage() {
    const { profile, role, hasPermission } = useAuth();
    const [tasks, setTasks] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [subCategories, setSubCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [newComment, setNewComment] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        status: "todo",
        assignedTo: "",
        categoryId: "",
        subCategoryId: "",
        priority: "medium",
        dueDate: ""
    });

    useEffect(() => {
        const unsubTasks = onSnapshot(query(collection(db, "tasks"), orderBy("createdAt", "desc")), (snap) => {
            setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
            setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubCats = onSnapshot(collection(db, "categories"), (snap) => {
            setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubSubCats = onSnapshot(collection(db, "subCategories"), (snap) => {
            setSubCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubTasks();
            unsubUsers();
            unsubCats();
            unsubSubCats();
        };
    }, []);

    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "tasks"), {
                ...formData,
                createdAt: Timestamp.now(),
                createdBy: profile?.id || "unknown",
                creatorName: profile?.name || "System"
            });
            setIsAddModalOpen(false);
            setFormData({
                title: "",
                description: "",
                status: "todo",
                assignedTo: "",
                categoryId: "",
                subCategoryId: "",
                priority: "medium",
                dueDate: ""
            });
        } catch (err) {
            console.error("Error adding task:", err);
            alert("Failed to add task.");
        }
    };

    const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
        try {
            await updateDoc(doc(db, "tasks", taskId), { status: newStatus });
        } catch (err) {
            console.error("Error updating task status:", err);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !selectedTask) return;

        try {
            const commentData = {
                text: newComment,
                userId: profile?.id || "unknown",
                userName: profile?.name || "System",
                createdAt: Timestamp.now()
            };

            const taskRef = doc(db, "tasks", selectedTask.id);
            const commentsRef = collection(taskRef, "comments");
            await addDoc(commentsRef, commentData);
            setNewComment("");
        } catch (err) {
            console.error("Error adding comment:", err);
        }
    };

    const [comments, setComments] = useState<any[]>([]);
    useEffect(() => {
        if (!selectedTask) {
            setComments([]);
            return;
        }

        const taskRef = doc(db, "tasks", selectedTask.id);
        const commentsRef = collection(taskRef, "comments");
        const q = query(commentsRef, orderBy("createdAt", "asc"));

        const unsubComments = onSnapshot(q, (snap) => {
            setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => unsubComments();
    }, [selectedTask]);

    const getAssignee = (userId: string) => employees.find(e => e.id === userId);
    const getSubCategory = (subId: string) => subCategories.find(s => s.id === subId);

    return (
        <div className="space-y-5">
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 w-fit mb-2"
                    >
                        <Layout size={12} className="text-[var(--primary)]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)]">Workflow Engine</span>
                    </motion.div>
                    <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                        <span className="text-gradient">Kanban Board</span>
                    </h1>
                    <p className="text-[#8E8E93] max-w-lg text-sm font-medium">
                        Coordinate deployments, monitor craft precision, and streamline communication.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="glow-button px-6 py-2.5 flex items-center gap-2 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                    >
                        <Plus size={16} strokeWidth={2.5} />
                        <span>Initialize Task</span>
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[600px]">
                {COLUMNS.map((column) => (
                    <div key={column.id} className="flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }}></div>
                                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-main)] opacity-80">{column.title}</h3>
                                <span className="text-[10px] font-bold text-[#8E8E93] ml-1">({tasks.filter(t => t.status === column.id).length})</span>
                            </div>
                        </div>

                        <div
                            className="flex-1 rounded-[16px] bg-[var(--background)] border border-[var(--glass-border)] shadow-inner p-2 space-y-2 min-h-[200px] transition-colors hover:bg-[var(--glass-border)]"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                const taskId = e.dataTransfer.getData("taskId");
                                handleUpdateTaskStatus(taskId, column.id);
                            }}
                        >
                            <AnimatePresence mode="popLayout">
                                {tasks
                                    .filter(task => task.status === column.id)
                                    .map((task, idx) => {
                                        const assignee = getAssignee(task.assignedTo);
                                        const subCat = getSubCategory(task.subCategoryId);
                                        return (
                                            <motion.div
                                                key={task.id}
                                                layoutId={task.id}
                                                draggable
                                                onDragStart={(e) => (e as any).dataTransfer?.setData("taskId", task.id)}
                                                onClick={() => {
                                                    setSelectedTask(task);
                                                    setIsDetailModalOpen(true);
                                                }}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="premium-card !p-3 group cursor-pointer hover:border-[var(--primary)]/30 transition-all active:scale-[0.98] relative overflow-hidden"
                                            >
                                                {/* Priority Indicator */}
                                                <div className={cn(
                                                    "absolute top-0 right-0 w-12 h-1 rounded-bl-lg opacity-50",
                                                    task.priority === 'high' ? "bg-red-500" : task.priority === 'medium' ? "bg-amber-500" : "bg-emerald-500"
                                                )} />

                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between">
                                                        <h4 className="text-[13px] font-bold text-[var(--text-main)] leading-snug group-hover:text-[var(--primary)] transition-colors">{task.title}</h4>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        {subCat && (
                                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--background)] border border-[var(--glass-border)]">
                                                                <Layers size={10} className="text-[#8E8E93]" />
                                                                <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-tight">{subCat.name}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--background)] border border-[var(--glass-border)]">
                                                            <Clock size={10} className="text-[#8E8E93]" />
                                                            <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-tight">
                                                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="pt-3 border-t border-[var(--glass-border)] flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 flex items-center justify-center">
                                                                <User size={12} className="text-[var(--primary)]" />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-[var(--text-main)]/70">{assignee?.name || "Unassigned"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[#8E8E93]">
                                                            <MessageSquare size={12} />
                                                            <span className="text-[9px] font-bold">4</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </div>

            {/* Initialization Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--background)]/95 backdrop-blur-xl">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-md bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]"
                        >
                            <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between bg-[var(--background)]/50">
                                <div>
                                    <h2 className="text-lg font-black text-[var(--text-main)] uppercase tracking-tight">Initialize <span className="text-[var(--primary)]">Task</span></h2>
                                    <p className="text-[9px] text-[var(--primary)] font-black uppercase tracking-[0.3em] mt-0.5 opacity-70">Operational Directive</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} title="Close Modal" className="w-8 h-8 rounded-full border border-[var(--glass-border)] flex items-center justify-center text-[#8E8E93] hover:text-[var(--text-main)] transition-all">
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleAddTask} className="p-5 space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-1">Task Identifier</label>
                                    <input
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl p-3.5 text-[var(--text-main)] text-[13px] font-bold outline-none focus:border-[var(--primary)]/50 focus:shadow-sm transition-all shadow-sm"
                                        placeholder="e.g. Master Sanding Phase 1"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-1">Execution Details</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl p-3.5 text-[var(--text-main)] text-[13px] font-bold outline-none focus:border-[var(--primary)]/50 focus:shadow-sm transition-all resize-none shadow-sm"
                                        placeholder="Specify technical scope..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-1">Personnel</label>
                                        <select
                                            title="Assignee"
                                            value={formData.assignedTo}
                                            onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl p-3 text-[var(--text-main)] text-[13px] font-bold outline-none focus:border-[var(--primary)]/50 focus:shadow-sm appearance-none cursor-pointer shadow-sm"
                                        >
                                            <option value="" className="bg-[var(--background)] text-[var(--text-main)]">Select Deployee</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id} className="bg-[var(--background)] text-[var(--text-main)]">{emp.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-1">Priority</label>
                                        <select
                                            title="Priority"
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl p-3 text-[var(--text-main)] text-[13px] font-bold outline-none focus:border-[var(--primary)]/50 focus:shadow-sm appearance-none cursor-pointer shadow-sm"
                                        >
                                            <option value="low" className="bg-[var(--background)] text-[var(--text-main)]">Standard</option>
                                            <option value="medium" className="bg-[var(--background)] text-[var(--text-main)]">Critical</option>
                                            <option value="high" className="bg-[var(--background)] text-[var(--text-main)]">Immediate</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-1">Protocol</label>
                                        <select
                                            title="Sub Category"
                                            value={formData.subCategoryId}
                                            onChange={(e) => setFormData({ ...formData, subCategoryId: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl p-3 text-[var(--text-main)] text-[13px] font-bold outline-none focus:border-[var(--primary)]/50 focus:shadow-sm appearance-none cursor-pointer shadow-sm"
                                        >
                                            <option value="" className="bg-[var(--background)] text-[var(--text-main)]">Select Sub-cat</option>
                                            {subCategories.map(sub => (
                                                <option key={sub.id} value={sub.id} className="bg-[var(--background)] text-[var(--text-main)]">{sub.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--primary)] ml-1">Deadline</label>
                                        <input
                                            title="Due Date"
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl p-3 text-[var(--text-main)] text-[13px] font-bold outline-none focus:border-[var(--primary)]/50 focus:shadow-sm shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end gap-3 border-t border-[var(--glass-border)]">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest text-[#8E8E93] hover:bg-[var(--glass-border)] transition-colors"
                                    >
                                        Abort
                                    </button>
                                    <button
                                        type="submit"
                                        className="glow-button px-6 py-2.5 flex items-center gap-2 active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest"
                                    >
                                        <Send size={14} />
                                        <span>Execute</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Task Detail Modal */}
            <AnimatePresence>
                {isDetailModalOpen && selectedTask && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-[#050505]/95 backdrop-blur-3xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="relative w-full max-w-4xl h-[85vh] premium-card !p-0 flex flex-col md:flex-row shadow-2xl overflow-hidden"
                        >
                            {/* Content Side */}
                            <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
                                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center",
                                            selectedTask.priority === 'high' ? "bg-red-500/10 text-red-400" : selectedTask.priority === 'medium' ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                                        )}>
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-white tracking-tight">{selectedTask.title}</h2>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest">
                                                    Deployer: <span className="text-[var(--primary)]">{selectedTask.creatorName}</span>
                                                </span>
                                                <div className="w-1 h-1 rounded-full bg-white/10" />
                                                <span className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-widest">
                                                    Status: <span className="text-white">{COLUMNS.find(c => c.id === selectedTask.status)?.title}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsDetailModalOpen(false)} title="Close Modal" className="md:hidden text-[#8E8E93] hover:text-white">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 p-5 overflow-y-auto no-scrollbar space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary)] opacity-80">Procedural Summary</h3>
                                        <p className="text-[#8E8E93] text-sm font-medium leading-relaxed tracking-tight">
                                            {selectedTask.description || "No technical description provided in deployment manifesto."}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#8E8E93]">Assigned Personnel</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <User size={14} className="text-[#F5F5F7]" />
                                                </div>
                                                <span className="text-xs font-bold text-white uppercase tracking-tight">{getAssignee(selectedTask.assignedTo)?.name || "Unassigned"}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#8E8E93]">System Protocol</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <Layers size={14} className="text-[#F5F5F7]" />
                                                </div>
                                                <span className="text-xs font-bold text-white uppercase tracking-tight">{getSubCategory(selectedTask.subCategoryId)?.name || "Not Specified"}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#8E8E93]">Deployment Window</span>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <Calendar size={14} className="text-[#F5F5F7]" />
                                                </div>
                                                <span className="text-xs font-bold text-white uppercase tracking-tight">{selectedTask.dueDate || "Indefinite"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Comment / Collaboration Side */}
                            <div className="w-full md:w-[380px] flex flex-col bg-white/[0.01]">
                                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MessageSquare size={18} className="text-[var(--primary)]" />
                                        <h3 className="text-sm font-black uppercase tracking-widest text-white">Collaboration Log</h3>
                                    </div>
                                    <button onClick={() => setIsDetailModalOpen(false)} title="Close Modal" className="hidden md:flex text-[#8E8E93] hover:text-white transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-3">
                                    {comments.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                            <MessageSquare size={32} className="mb-4" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">No log entries found</p>
                                        </div>
                                    ) : (
                                        comments.map((comment, i) => (
                                            <div key={comment.id} className="space-y-1.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-black text-[var(--primary)] tracking-wide">{comment.userName}</span>
                                                    <span className="text-[8px] text-[#8E8E93] font-bold uppercase tracking-widest">
                                                        {comment.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="p-4 rounded-[18px] bg-white/[0.03] border border-white/5 shadow-inner">
                                                    <p className="text-xs text-white/80 leading-relaxed tracking-tight">{comment.text}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                <div className="p-4 border-t border-white/5 bg-black/20">
                                    <form onSubmit={handleAddComment} className="flex gap-2">
                                        <input
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="flex-1 bg-[#0D0D0D] border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-[var(--primary)]/50 transition-all shadow-xl"
                                            placeholder="Transmit update..."
                                        />
                                        <button
                                            type="submit"
                                            title="Send Message"
                                            disabled={!newComment.trim()}
                                            className="w-10 h-10 flex items-center justify-center bg-[var(--primary)] text-[#050505] rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-[var(--primary)]/20 disabled:opacity-50 disabled:scale-100"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </form>
                                    <p className="text-[8px] text-[#8E8E93] font-bold uppercase tracking-widest text-center mt-3 opacity-40 italic">Secure Protocol Enabled</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
