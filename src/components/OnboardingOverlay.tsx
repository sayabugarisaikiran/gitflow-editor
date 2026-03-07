import { useState, useEffect } from 'react';

// ─── Onboarding Tips ────────────────────────────────────────────────────────

const TIPS = [
    {
        title: 'Welcome to GitFlow Editor! 🚀',
        description: 'An interactive visual editor for learning Git. Drag files, type commands, and watch the graph grow in real-time.',
        icon: '🎓',
    },
    {
        title: 'Drag & Drop Staging',
        description: 'Drag files from Working Directory to Staging Area to stage them. This is equivalent to running "git add".',
        icon: '📂',
    },
    {
        title: 'Interactive Terminal',
        description: 'Type real Git commands in the terminal: git add, git commit, git merge, git stash, and more.',
        icon: '💻',
    },
    {
        title: 'Right-Click for Options',
        description: 'Right-click on commit nodes for a context menu with checkout, branching, merge, and cherry-pick options.',
        icon: '🖱️',
    },
    {
        title: 'Click to Inspect',
        description: 'Double-click any commit node to open the Commit Inspector panel with detailed information and educational content.',
        icon: '🔍',
    },
];

const STORAGE_KEY = 'gitflow-editor-onboarding-seen';

export default function OnboardingOverlay() {
    const [currentTip, setCurrentTip] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const seen = localStorage.getItem(STORAGE_KEY);
        if (!seen) {
            setVisible(true);
        }
    }, []);

    const handleNext = () => {
        if (currentTip < TIPS.length - 1) {
            setCurrentTip((prev) => prev + 1);
        } else {
            handleDismiss();
        }
    };

    const handleDismiss = () => {
        setVisible(false);
        localStorage.setItem(STORAGE_KEY, 'true');
    };

    if (!visible) return null;

    const tip = TIPS[currentTip];
    const progress = ((currentTip + 1) / TIPS.length) * 100;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#151b28] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 w-[420px] overflow-hidden animate-context-menu">
                {/* Progress bar */}
                <div className="h-1 bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Content */}
                <div className="px-8 pt-8 pb-6 text-center">
                    <div className="text-5xl mb-4">{tip.icon}</div>
                    <h2 className="text-lg font-bold text-white mb-2">{tip.title}</h2>
                    <p className="text-sm text-slate-400 leading-relaxed max-w-[320px] mx-auto">
                        {tip.description}
                    </p>
                </div>

                {/* Step indicator */}
                <div className="flex justify-center gap-1.5 pb-4">
                    {TIPS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentTip
                                ? 'bg-indigo-400 w-6'
                                : idx < currentTip
                                    ? 'bg-indigo-400/50'
                                    : 'bg-slate-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Actions */}
                <div className="px-8 pb-6 flex items-center justify-between">
                    <button
                        onClick={handleDismiss}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        Skip tour
                    </button>
                    <button
                        onClick={handleNext}
                        className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-semibold hover:from-indigo-400 hover:to-purple-400 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
                    >
                        {currentTip < TIPS.length - 1 ? 'Next →' : "Let's Go! 🚀"}
                    </button>
                </div>
            </div>
        </div>
    );
}
