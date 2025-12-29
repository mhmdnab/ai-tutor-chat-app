'use client';

import { useEffect } from 'react';

export default function ThemeProvider() {
  useEffect(() => {
    // Apply theme immediately on mount
    const applyTheme = () => {
      const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | 'auto';
      const theme = savedTheme || 'dark'; // Default to dark

      document.documentElement.classList.remove('dark', 'light');

      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        // Auto mode - use system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.add('light');
        }
      }
    };

    // Apply theme on mount
    applyTheme();

    // Listen for storage events (when settings change)
    const handleStorageChange = () => {
      applyTheme();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return null;
}
