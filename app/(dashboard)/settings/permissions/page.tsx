"use client";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Shield, Check, X, Search, Loader2 } from "lucide-react";

export default function PermissionsPage() {
    const { profile, hasPermission } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [updatingUid, setUpdatingUid] = useState<string | null>(null);

    const permissionKeys = [
        { id: "dashboard", label: "Dashboard" },
        { id: "employees", label: "Employees" },
        { id: "categories", label: "Categories" },
        { id: "skills", label: "Skills" },
        { id: "performance", label: "Reviews" },
        { id: "progress", label: "Reports" },
        { id: "knowledgebase", label: "Training" },
        { id: "settings", label: "Settings" }
    ];

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const userData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsers(userData);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const togglePermission = async (userId: string, permId: string, currentValue: boolean) => {
        setUpdatingUid(`${userId}-${permId}`);
        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                [`permissions.${permId}`]: !currentValue
            });

            setUsers(prev => prev.map(u =>
                u.id === userId
                    ? { ...u, permissions: { ...u.permissions, [permId]: !currentValue } }
                    : u
            ));
        } catch (error) {
            console.error("Error updating permission:", error);
        } finally {
            setUpdatingUid(null);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!hasPermission("settings")) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <Shield size={48} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
                <p className="text-[#A0A0A0]">You do not have permission to manage user access.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Security & Permissions</h1>
                    <p className="text-[#A0A0A0] mt-1">Manage screen-level access control for organization personnel.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-white outline-none focus:border-[var(--primary-hover)]/50 w-full md:w-64 transition-all"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-[var(--primary-hover)]" size={40} />
                </div>
            ) : (
                <div className="glass rounded-3xl overflow-hidden border border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/5">
                                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-[#A0A0A0]">Personnel</th>
                                    {permissionKeys.map(pk => (
                                        <th key={pk.id} className="px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-[#A0A0A0] text-center whitespace-nowrap">
                                            {pk.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-white">{user.name}</span>
                                                <span className="text-[10px] text-[#A0A0A0] mt-0.5">{user.position}</span>
                                            </div>
                                        </td>
                                        {permissionKeys.map(pk => {
                                            const isChecked = user.permissions?.[pk.id];
                                            const isUpdating = updatingUid === `${user.id}-${pk.id}`;
                                            const isRoot = user.permissions?.isAdmin;

                                            return (
                                                <td key={pk.id} className="px-4 py-4 text-center">
                                                    <button
                                                        disabled={isUpdating || isRoot}
                                                        onClick={() => togglePermission(user.id, pk.id, !!isChecked)}
                                                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isRoot ? 'bg-amber-500/20 text-amber-500 cursor-not-allowed' :
                                                                isChecked ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' :
                                                                    'bg-red-500/10 text-red-500/50 hover:bg-red-500/20'
                                                            }`}
                                                        title={isRoot ? "Root Admin (All Access)" : isChecked ? "Revoke Access" : "Grant Access"}
                                                    >
                                                        {isUpdating ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : isRoot || isChecked ? (
                                                            <Check size={16} strokeWidth={3} />
                                                        ) : (
                                                            <X size={16} strokeWidth={3} />
                                                        )}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
