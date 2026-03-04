"use client";
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";

export default function RecentActivityFeed() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query the most recent 10 performances
        const q = query(collection(db, "performances"), orderBy("evaluatedAt", "desc"), limit(6));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setActivities(fetched);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const timeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 30) return `${diffInDays}d ago`;
        const diffInMonths = Math.floor(diffInDays / 30);
        return `${diffInMonths}mo ago`;
    };

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 py-8">
                <div className="w-5 h-5 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="py-8 text-center text-[#8E8E93] text-[11px] font-bold uppercase tracking-widest">
                No Recent Activity
            </div>
        );
    }

    return (
        <div className="space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            <AnimatePresence>
                {activities.map((activity, index) => {
                    const isMastered = activity.level === "Mastered";
                    const isProficient = activity.level === "Proficient";
                    const color = isMastered ? "var(--primary)" : isProficient ? "#3B82F6" : "white";

                    return (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-colors relative overflow-hidden group"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl opacity-50 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }}></div>

                            <div className="flex items-start justify-between gap-3 pl-2">
                                <div className="space-y-1">
                                    <p className="text-[11px] text-white font-medium leading-relaxed">
                                        <span className="font-black text-[var(--primary)]">{activity.evaluatorName || "A supervisor"}</span> marked{' '}
                                        <span className="font-bold">{activity.employeeName}</span> as{' '}
                                        <span className="font-black px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider" style={{ color, backgroundColor: `${color}15` }}>
                                            {activity.level}
                                        </span>{' '}
                                        in <span className="text-[#8E8E93] font-bold">"{activity.skillName}"</span>
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest mt-1">
                                        <Clock size={10} />
                                        <span>{timeAgo(activity.evaluatedAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
