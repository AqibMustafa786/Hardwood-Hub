"use client";
import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import {
    BookOpen,
    ExternalLink,
    FileText,
    Image as ImageIcon,
    PlayCircle,
    Search,
    Filter,
    Plus,
    X,
    Upload,
    MoreVertical,
    Edit2,
    Trash2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

export default function KnowledgebasePage() {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<any>(null);
    const [newArticle, setNewArticle] = useState({ topic: "", description: "", link: "" });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    const { user, loading: authLoading, role } = useAuth();

    useEffect(() => {
        if (!user || authLoading) return;
        const q = query(collection(db, "knowledgebase"), orderBy("number"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setArticles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (err) => console.error(err));
        return () => unsubscribe();
    }, []);

    const filtered = articles.filter(a =>
        a.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let imageUrl = editingArticle?.image || "";
            if (imageFile) {
                const imageRef = ref(storage, `knowledgebase/images/${Date.now()}_${imageFile.name}`);
                await uploadBytes(imageRef, imageFile);
                imageUrl = await getDownloadURL(imageRef);
            }

            let fileUrl = editingArticle?.file || "";
            if (documentFile) {
                const fileRef = ref(storage, `knowledgebase/files/${Date.now()}_${documentFile.name}`);
                await uploadBytes(fileRef, documentFile);
                fileUrl = await getDownloadURL(fileRef);
            }

            const docData: any = {
                topic: newArticle.topic,
                description: newArticle.description,
                link: newArticle.link,
                image: imageUrl,
                file: fileUrl,
            };

            if (editingArticle) {
                await updateDoc(doc(db, "knowledgebase", editingArticle.id), docData);
            } else {
                docData.number = String(articles.length + 1).padStart(2, '0');
                await addDoc(collection(db, "knowledgebase"), docData);
            }

            handleCloseModal();
        } catch (error) {
            console.error("Error saving article:", error);
            alert("Failed to save article. Please ensure your internet connection is stable and try again.");
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this knowledge base entry?")) return;
        try {
            await deleteDoc(doc(db, "knowledgebase", id));
        } catch (error) {
            console.error("Error deleting article:", error);
            alert("Failed to delete article. Please try again.");
        }
    };

    const handleEdit = (article: any) => {
        setEditingArticle(article);
        setNewArticle({
            topic: article.topic,
            description: article.description,
            link: article.link || ""
        });
        setIsAddModalOpen(true);
        setActiveMenu(null);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setEditingArticle(null);
        setNewArticle({ topic: "", description: "", link: "" });
        setImageFile(null);
        setDocumentFile(null);
    };

    return (
        <div className="space-y-4">
            {/* Top Actions */}
            <div className="flex justify-end mb-2">
                <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto">
                    <div className="relative group min-w-[250px] md:min-w-[300px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0A0]" />
                        <input
                            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search topics..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 outline-none focus:border-[var(--primary-hover)]/50 text-white text-[10px] transition-all shadow-xl shadow-black/20"
                        />
                    </div>
                    {role === "superAdmin" && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="glow-button px-3 py-1.5 flex items-center gap-1.5 active:scale-95 transition-all shadow-[0_15px_30px_rgba(0,0,0,0.3)] group overflow-hidden relative justify-center"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            <Plus size={14} strokeWidth={2.5} className="group-hover:rotate-180 transition-transform duration-700" />
                            <span className="uppercase tracking-[0.2em] font-black text-[9px]">Add Knowledge Base</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {loading ? (
                    [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="wood-card h-48 animate-pulse bg-white/[0.02] !p-3"></div>)
                ) : filtered.map((article) => (
                    <div key={article.id} className="wood-card !p-3 group flex flex-col h-full hover:border-[var(--primary-hover)]/30">
                        <div className="relative h-28 mb-3 rounded-lg overflow-hidden bg-[#1C1C1C] border border-white/5">
                            {article.image && article.image.startsWith('http') ? (
                                <img src={article.image} alt={article.topic} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#2D6A4F]/20"><ImageIcon size={48} /></div>
                            )}
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[8px] font-bold text-[var(--primary-hover)] border border-white/10 uppercase tracking-widest">
                                Topic {article.number}
                            </div>
                            <div className="absolute top-2 right-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenu(activeMenu === article.id ? null : article.id);
                                    }}
                                    className="p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-md text-white transition-all border border-white/10"
                                    title="More Options"
                                >
                                    <MoreVertical size={14} />
                                </button>
                                <AnimatePresence>
                                    {activeMenu === article.id && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                                className="absolute right-0 mt-1 w-32 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-2xl z-20 overflow-hidden"
                                            >
                                                <button
                                                    onClick={() => handleEdit(article)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-[#A0A0A0] hover:text-white hover:bg-white/5 transition-all text-left font-bold uppercase tracking-wider"
                                                >
                                                    <Edit2 size={12} /> Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(article.id)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all text-left font-bold uppercase tracking-wider"
                                                >
                                                    <Trash2 size={12} /> Delete
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-white mb-1 leading-tight tracking-tight">{article.topic}</h3>
                            <p className="text-[10px] text-[#A0A0A0] line-clamp-2 leading-relaxed">{article.description}</p>
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                            {article.link && (
                                <LinkButton href={article.link} icon={ExternalLink} label="Link" primary />
                            )}
                            {article.file && (
                                <LinkButton href={article.file} icon={FileText} label="PDF" />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isAddModalOpen && (
                        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                                onClick={() => setIsAddModalOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-md bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-[32px] overflow-hidden flex flex-col shadow-2xl z-10"
                            >
                                <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between bg-[var(--background)]/50">
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-black text-[var(--text-main)] tracking-tight">
                                            {editingArticle ? 'Edit Knowledge Base' : 'Add Knowledge Base'}
                                        </h2>
                                        <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest">
                                            {editingArticle ? 'Update this training record.' : 'Create a new training record.'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleCloseModal}
                                        className="w-8 h-8 flex items-center justify-center text-[#8E8E93] hover:text-[var(--text-main)] hover:bg-[var(--glass-border)] rounded-xl transition-colors"
                                        title="Close dialog"
                                        aria-label="Close modal"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <form onSubmit={handleAddSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Main Topic</label>
                                        <input
                                            required
                                            id="article-topic"
                                            title="Main Topic of Article"
                                            type="text"
                                            value={newArticle.topic}
                                            onChange={(e) => setNewArticle({ ...newArticle, topic: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 text-[var(--text-main)] text-sm outline-none focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-main)]/20"
                                            placeholder="e.g. Subfloor Prep Basics"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Description</label>
                                        <textarea
                                            required
                                            rows={3}
                                            value={newArticle.description}
                                            onChange={(e) => setNewArticle({ ...newArticle, description: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 text-[var(--text-main)] text-sm outline-none focus:border-[var(--primary)] transition-all resize-none placeholder:text-[var(--text-main)]/20"
                                            placeholder="Detailed explanation..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Cover Image</label>
                                            <div className="relative border border-dashed border-[var(--glass-border)] rounded-xl p-4 text-center hover:border-[var(--primary)]/50 transition-colors bg-[var(--background)]">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                                    title="Upload Cover Image"
                                                />
                                                <Upload className="mx-auto text-[#8E8E93] mb-2" size={16} />
                                                <p className="text-[10px] font-medium text-[var(--text-main)] truncate px-1">{imageFile ? imageFile.name : "Select Image"}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Document (PDF)</label>
                                            <div className="relative border border-dashed border-[var(--glass-border)] rounded-xl p-4 text-center hover:border-[var(--primary)]/50 transition-colors bg-[var(--background)]">
                                                <input
                                                    type="file"
                                                    accept=".pdf,.doc,.docx"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                                                    title="Upload Document File"
                                                />
                                                <Upload className="mx-auto text-[#8E8E93] mb-2" size={16} />
                                                <p className="text-[10px] font-medium text-[var(--text-main)] truncate px-1">{documentFile ? documentFile.name : "Select File"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-[#8E8E93] ml-1 uppercase tracking-wide">Reference Link</label>
                                        <input
                                            type="url"
                                            value={newArticle.link}
                                            onChange={(e) => setNewArticle({ ...newArticle, link: e.target.value })}
                                            className="w-full bg-[var(--background)] border border-[var(--glass-border)] rounded-xl py-3 px-3 text-[var(--text-main)] text-sm outline-none focus:border-[var(--primary)] transition-all placeholder:text-[var(--text-main)]/20"
                                            placeholder="https://..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="glow-button w-full py-3.5 flex items-center justify-center font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all mt-4"
                                    >
                                        {submitting ? "Processing..." : (editingArticle ? "Save Changes" : "Create Entry")}
                                    </button>
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

function LinkButton({ href, icon: Icon, label, primary }: any) {
    return (
        <a
            href={href} target="_blank" rel="noopener noreferrer"
            className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all",
                primary ? "bg-[var(--primary-hover)] text-white shadow-lg shadow-[var(--primary-hover)]/20" : "bg-white/5 text-[#A0A0A0] hover:bg-white/10 hover:text-white"
            )}
        >
            <Icon size={12} /> {label}
        </a>
    );
}

function cn(...inputs: any[]) { return inputs.filter(Boolean).join(' '); }
