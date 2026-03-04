"use client";
import { useState } from "react";
import { collection, addDoc, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Check, Loader2 } from "lucide-react";

const DATA = [
    {
        category: "Sanding",
        subcategories: [
            "Belt Sander skills", "Buffer skills", "Cabinet scraper skills", "Edger sanding skills",
            "Floor scrubber skills", "Hand sanding skills", "Orbital Sander skills", "Planetary Sander skills",
            "Power hook up skills", "Roller skills", "Site Cleanliness", "Site Protection", "Stain skills",
            "Standard scraper skills", "Steps skills", "Tack Stick skills", "Toe Kick Edger skills",
            "Toe kick edger skills", "Treads", "Trim Pad/ Brush skills", "Trim/ Door Removal & Installation skills",
            "Trowel skills", "Vacuum Skills", "Vent Installation skills"
        ]
    },
    {
        category: "Installation",
        subcategories: [
            "Acclimation and Environmental Readings", "Adhesive application", "Close outs", "Demo",
            "fastening", "General skills", "Herringbone floor installation", "Job site Protection",
            "Layout and starter row", "Leveling", "Moisture barriers", "Site Prep", "Subfloor",
            "Trim and Transitions"
        ]
    },
    {
        category: "Repairs",
        subcategories: [
            "Board replacement", "Hotmelt filler", "Sanding/ top coat repair", "Wax/ putty repairs"
        ]
    },
    {
        category: "Laser Everything",
        subcategories: []
    },
    {
        category: "Equipment",
        subcategories: [
            "15-Gauge Finish Nailer", "18-Gauge Brad Nailer", "23-Gauge Micro Pin Nailer", "4\" Grinder",
            "6-Inch Grinder with Diamond Cup Wheel", "Air Compressor", "Air Sled", "Backpack Vac",
            "Belt Sander", "Dehumidifier", "Dust Collection", "Flooring Cleat Nailer", "Flooring stapler",
            "Jig Saw", "Little giant ladder", "Medusaw \"demo saw\"", "Miter saw", "Oscillating Saw",
            "Powerdrive", "Quick Drive Screw Gun", "Rotex 150", "Router", "Safety and PPE", "Sausage gun",
            "Standard Edger", "Table Saw", "Toe kick edger", "Toe Kick saw", "Track Saw", "Under cut saw"
        ]
    },
    {
        category: "Stairs",
        subcategories: [
            "Demo/ Prep", "Finishing", "Installation", "Sanding"
        ]
    },
    {
        category: "Identification",
        subcategories: [
            "Buffer Pads", "Dust Collection", "Finishing tools", "Handtools", "Non Standard tools",
            "Power", "Sanders", "Sandpaper Grit", "Sandpaper type", "Trim & Vents", "Wood Species"
        ]
    },
    {
        category: "Administration",
        subcategories: [
            "ADP", "Apps", "Company cam", "Google calendar", "Invoices/ work orders"
        ]
    }
];

export default function SeedPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string>("Ready to initialize knowledgebase.");

    const handleSeed = async () => {
        setLoading(true);
        setStatus("Purging existing taxonomy...");

        try {
            const catSnapshot = await getDocs(collection(db, "categories"));
            const deletePromises = catSnapshot.docs.map(d => deleteDoc(d.ref));
            await Promise.all(deletePromises);

            setStatus("Injecting updated categorizations and subcategories...");
            let priority = 1;

            for (const item of DATA) {
                // Remove duplicates
                const uniqueSubs = Array.from(new Set(item.subcategories));

                await addDoc(collection(db, "categories"), {
                    name: item.category,
                    icon: "default",
                    priority: priority++,
                    subcategories: uniqueSubs
                });
            }

            setStatus("Deployment successful.");
        } catch (e: any) {
            console.error(e);
            setStatus(`Critical Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
            <div className="max-w-md w-full bg-[#0D0D0D] border border-white/10 p-8 rounded-[32px] text-center space-y-6 shadow-2xl">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Database Initialization</h1>
                    <p className="text-[#8E8E93] text-sm mt-2">{status}</p>
                </div>

                <button
                    onClick={handleSeed}
                    disabled={loading || status === "Deployment successful."}
                    className="w-full py-4 bg-[var(--primary)] hover:bg-[#FFB35C] text-[#050505] font-black rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><Loader2 size={18} className="animate-spin" /> EXECUTING...</>
                    ) : status === "Deployment successful." ? (
                        <><Check size={18} /> INITIALIZED</>
                    ) : (
                        "BEGIN OVERRIDE"
                    )}
                </button>
            </div>
        </div>
    );
}
