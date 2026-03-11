import Layout from './components/Layout';
import { useURLState } from './hooks/useURLState';
import { useSettingsStore } from './store/useSettingsStore';
import { useEffect } from 'react';
import './index.css';

export default function App() {
    const { theme } = useSettingsStore();

    // Load shared scenario from URL hash on mount
    useURLState();

    // Sync theme to document.documentElement for Tailwind dark mode
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    return <Layout />;
}
