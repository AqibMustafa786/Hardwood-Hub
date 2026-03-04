"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = {
    Mastered: "var(--primary-hover)",
    Proficient: "#3B82F6",
    Learning: "white",
    Untested: "transparent"
};

export default function SkillProficiencyChart() {
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "performances"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const counts = { Mastered: 0, Proficient: 0, Learning: 0, Untested: 0 };

            // To get accurate "current" company proficiency, we ideally only want the latest review per skill/employee combo.
            // For dashboard simplicity and speed, we will approximate by taking all records,
            // or we track a map of `employeeId_skillId` -> latest level.
            const latestPerfs = new Map<string, any>();

            snapshot.forEach(doc => {
                const data = doc.data();
                const key = `${data.employeeId}_${data.skillId}`;
                const current = latestPerfs.get(key);
                if (!current || new Date(data.evaluatedAt) > new Date(current.evaluatedAt)) {
                    latestPerfs.set(key, data);
                }
            });

            latestPerfs.forEach((data) => {
                if (data.level && counts[data.level as keyof typeof counts] !== undefined) {
                    counts[data.level as keyof typeof counts]++;
                }
            });

            const data = [
                { name: "Mastered", value: counts.Mastered, color: COLORS.Mastered },
                { name: "Proficient", value: counts.Proficient, color: COLORS.Proficient },
                { name: "Learning", value: counts.Learning, color: COLORS.Learning },
                // Only show untested if there's tracking for it, usually we only have records for tested.
            ].filter(item => item.value > 0);

            setChartData(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center text-[#8E8E93] text-[10px] uppercase font-bold tracking-widest">
                No Data Available
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-[#0D0D0D] border border-white/10 rounded-xl shadow-2xl p-3 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: payload[0].payload.color }}></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#8E8E93]">{payload[0].name}</p>
                        <p className="text-sm font-black text-white">{payload[0].value} Skills</p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    animationDuration={1500}
                    animationEasing="ease-out"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0 0 8px ${entry.color}80)` }} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value, entry: any) => <span className="text-[10px] font-bold text-white uppercase tracking-wider ml-1">{value}</span>}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
