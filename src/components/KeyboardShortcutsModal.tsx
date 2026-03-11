// ─── Keyboard Shortcuts Modal ────────────────────────────────────────────────

interface KeyboardShortcutsModalProps {
    onClose: () => void;
}

const SHORTCUTS = [
    {
        category: 'Navigation',
        items: [
            { keys: ['?'], description: 'Open this shortcuts panel' },
            { keys: ['Esc'], description: 'Close modal / exit lesson' },
        ],
    },
    {
        category: 'Graph',
        items: [
            { keys: ['Click'], description: 'Select a commit' },
            { keys: ['Double-click'], description: 'Checkout to that commit / branch' },
            { keys: ['Right-click'], description: 'Open context menu with all actions' },
            { keys: ['Scroll'], description: 'Zoom in / out on the graph' },
            { keys: ['Drag'], description: 'Pan the canvas' },
        ],
    },
    {
        category: 'Staging',
        items: [
            { keys: ['Drag'], description: 'Drag files from Working Dir to Staging Area' },
            { keys: ['Click →'], description: 'Stage a file using the stage button' },
        ],
    },
    {
        category: 'Terminal Commands',
        items: [
            { keys: ['git status'], description: 'Show current file states' },
            { keys: ['git add <file>'], description: 'Stage a specific file' },
            { keys: ['git commit -m "<msg>"'], description: 'Create a commit' },
            { keys: ['git branch <name>'], description: 'Create a new branch' },
            { keys: ['git checkout <name>'], description: 'Switch branch or commit' },
            { keys: ['git merge <branch>'], description: 'Merge a branch into current' },
            { keys: ['git rebase <branch>'], description: 'Rebase current onto target' },
            { keys: ['git reset --soft/--mixed/--hard HEAD~1'], description: 'Undo last commit' },
            { keys: ['git revert <hash>'], description: 'Create a revert commit' },
            { keys: ['git cherry-pick <hash>'], description: 'Apply a specific commit' },
            { keys: ['git stash'], description: 'Stash uncommitted changes' },
            { keys: ['git stash pop'], description: 'Restore stashed changes' },
            { keys: ['git tag <name>'], description: 'Tag the current commit' },
            { keys: ['git push'], description: 'Push to simulated origin' },
            { keys: ['git pull'], description: 'Fetch + merge from origin' },
            { keys: ['git bisect start'], description: 'Start a bisect session' },
            { keys: ['git log'], description: 'View commit history' },
            { keys: ['git branch -d <name>'], description: 'Delete a branch' },
            { keys: ['help'], description: 'Show all available commands' },
            { keys: ['clear'], description: 'Clear the terminal output' },
        ],
    },
];

export default function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#151b28] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 w-[600px] max-h-[80vh] flex flex-col overflow-hidden animate-context-menu">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-base">⌨️</span>
                        <h2 className="text-sm font-bold text-white">Keyboard Shortcuts & Commands</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-1 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
                    {SHORTCUTS.map((section) => (
                        <div key={section.category}>
                            <h3 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                {section.category}
                            </h3>
                            <div className="space-y-1">
                                {section.items.map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-800/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            {item.keys.map((k, ki) => (
                                                <kbd
                                                    key={ki}
                                                    className="text-[9px] font-mono font-bold text-slate-300 bg-slate-800 border border-slate-700/60 rounded px-1.5 py-0.5"
                                                >
                                                    {k}
                                                </kbd>
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-slate-500">{item.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-800/40 text-center shrink-0">
                    <p className="text-[9px] text-slate-700">Press <kbd className="text-[8px] font-mono text-slate-500 bg-slate-800 border border-slate-700 rounded px-1 py-0.5">Esc</kbd> or click outside to close</p>
                </div>
            </div>
        </div>
    );
}
