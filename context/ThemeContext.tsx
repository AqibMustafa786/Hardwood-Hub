"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeContextType = {
    theme: string;
    setTheme: (theme: string) => void;
    accentColor: string;
    setAccentColor: (color: string) => void;
    dynamicAnimations: boolean;
    setDynamicAnimations: (dynamic: boolean) => void;
    highContrast: boolean;
    setHighContrast: (contrast: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState("dark");
    const [accentColor, setAccentColor] = useState("#E5A54F");
    const [dynamicAnimations, setDynamicAnimations] = useState(true);
    const [highContrast, setHighContrast] = useState(false);

    useEffect(() => {
        // Retrieve settings from local storage if available
        const savedTheme = localStorage.getItem('themeSettings');
        if (savedTheme) {
            try {
                const parsed = JSON.parse(savedTheme);
                if (parsed.theme) setTheme(parsed.theme);
                if (parsed.accentColor) {
                    setAccentColor(parsed.accentColor === "var(--primary)" ? "#E5A54F" : parsed.accentColor);
                }
                if (parsed.dynamicAnimations !== undefined) setDynamicAnimations(parsed.dynamicAnimations);
                if (parsed.highContrast !== undefined) setHighContrast(parsed.highContrast);
            } catch (e) {
                console.error("Failed to parse theme settings", e);
            }
        }
    }, []);

    useEffect(() => {
        // Save to local storage on change
        localStorage.setItem('themeSettings', JSON.stringify({
            theme, accentColor, dynamicAnimations, highContrast
        }));
    }, [theme, accentColor, dynamicAnimations, highContrast]);

    // Helper to calculate rgb from hex to set the translucent colors
    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '229, 165, 79';
    };

    const primaryRgb = hexToRgb(accentColor);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor, dynamicAnimations, setDynamicAnimations, highContrast, setHighContrast }}>
            <div
                className={`theme-wrapper ${theme} ${!dynamicAnimations ? 'disable-animations' : ''} ${highContrast ? 'high-contrast' : ''}`}
                style={{
                    '--primary': accentColor,
                    '--primary-hover': accentColor,
                    '--primary-rgb': primaryRgb,
                    '--primary-hover-rgb': primaryRgb
                } as any}
            >
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
