import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button.jsx';
import { useTheme } from '../context/theme-context.js';

function ThemeToggle({ className = '', showLabel = false }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const label = isDark ? 'Light mode' : 'Dark mode';
    const Icon = isDark ? Sun : Moon;

    return (
        <Button
            type="button"
            variant="outline"
            size={showLabel ? 'default' : 'icon'}
            onClick={toggleTheme}
            className={className}
            aria-label={`Switch to ${label.toLowerCase()}`}
            title={`Switch to ${label.toLowerCase()}`}
        >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {showLabel && <span>{label}</span>}
        </Button>
    );
}

export default ThemeToggle;
