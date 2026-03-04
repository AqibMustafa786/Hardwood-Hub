"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function NavbarPortal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const el = document.getElementById("navbar-actions-portal");
    if (!el) return null;

    return createPortal(children, el);
}
