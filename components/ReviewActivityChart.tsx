"use client";
import {
    AreaChart,
    Area,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ReviewActivityChart() {
    const [chartData, setChartData] = useState<{ name: string, reviews: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Generate last 6 months list
        const last6Months = Array.from({ length: 6 }).map((_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return {
                name: d.toLocaleString('default', { month: 'short' }),
                monthNum: d.getMonth(),
                yearNum: d.getFullYear(),
                reviews: 0
            };
        });

        const q = query(collection(db, "performances"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Reset counts
            const newData = last6Months.map(m => ({ ...m }));

            snapshot.forEach(doc => {
                const data = doc.data();
                if (!data.evaluatedAt) return;
                const date = new Date(data.evaluatedAt);
                const mIdx = newData.findIndex(m => m.monthNum === date.getMonth() && m.yearNum === date.getFullYear());
                if (mIdx !== -1) {
                    newData[mIdx].reviews++;
                }
            });

            setChartData(newData.map(d => ({ name: d.name, reviews: d.reviews })));
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#8E8E93] animate-pulse">Analyzing Data...</span>
            </div>
        );
    }
    return (
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8E8E93", fontSize: 10, fontWeight: 700 }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8E8E93", fontSize: 10, fontWeight: 700 }}
                    dx={-10}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: "#0D0D0D",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                        padding: "8px 12px"
                    }}
                    itemStyle={{ color: "var(--primary)", fontWeight: 900, fontSize: "14px" }}
                    labelStyle={{ color: "#8E8E93", fontWeight: 700, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}
                    cursor={{ stroke: "rgba(255,255,255,0.05)", strokeWidth: 2 }}
                />
                <Area
                    type="monotone"
                    dataKey="reviews"
                    stroke="var(--primary)"
                    fillOpacity={1}
                    fill="url(#colorReviews)"
                    strokeWidth={3}
                    animationDuration={1500}
                    animationEasing="ease-out"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
