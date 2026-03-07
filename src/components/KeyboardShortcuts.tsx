import { useEffect } from 'react';

// ─── Keyboard Shortcuts Help Panel ──────────────────────────────────────────

const SHORTCUTS = [
    { keys: ['?'], description: 'Toggle this help panel' },
    { keys: ['Esc'], description: 'Close panels / dismiss menus' },
    { keys: ['S'], description: 'Toggle Scenario panel' },
    { keys: ['I'], description: 'Close Commit Inspector' },
] as const;

interface KeyboardShortcutsProps {
    onClose: () => void;
}

export default function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-[#151b28] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 w-[360px] animate-context-menu"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-base">⌨️</span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Keyboard Shortcuts
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Shortcuts list */}
                <div className="px-5 py-3 space-y-2">
                    {SHORTCUTS.map((s, i) => (
                        <div key={i} className="flex items-center justify-between py-1">
                            <span className="text-xs text-slate-400">{s.description}</span>
                            <div className="flex gap-1">
                                {s.keys.map((key) => (
                                    <kbd key={key} className="text-[10px] font-mono text-slate-300 bg-slate-800 border border-slate-700/60 rounded px-2 py-0.5 shadow-sm">
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-800/30">
                    <p className="text-[9px] text-slate-600 text-center">
                        Press <kbd className="text-[9px] font-mono text-slate-400 bg-slate-800 border border-slate-700/60 rounded px-1">?</kbd> to toggle this panel
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Hook for keyboard shortcuts ────────────────────────────────────────────

export function useKeyboardShortcuts({
    onToggleHelp,
    onToggleScenarios,
    onCloseInspector,
    onEscape,
}: {
    onToggleHelp: () => void;
    onToggleScenarios: () => void;
    onCloseInspector: () => void;
    onEscape: () => void;
}) {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Ignore if typing in an input/textarea or terminal
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('.xterm')) return;

            switch (e.key) {
                case '?':
                    e.preventDefault();
                    onToggleHelp();
                    break;
                case 'Escape':
                    e.preventDefault();
                    onEscape();
                    break;
                case 's':
                case 'S':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onToggleScenarios();
                    }
                    break;
                case 'i':
                case 'I':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        onCloseInspector();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onToggleHelp, onToggleScenarios, onCloseInspector, onEscape]);
}
