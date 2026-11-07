import React, { useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './theme-context.js';

const THEME_STORAGE_KEY = 'medigo-theme';

const getPreferredTheme = () => {
    if (typeof window === 'undefined') return 'light';

    try {
        const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    } catch {
        // Local storage can be unavailable in private browsing contexts.
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getPreferredTheme);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', theme === 'dark');
        root.style.colorScheme = theme;

        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // The selected theme still applies when storage is unavailable.
        }
    }, [theme]);

    const value = useMemo(
        () => ({
            theme,
            toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
        }),
        [theme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
