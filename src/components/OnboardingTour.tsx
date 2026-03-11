import { useState, useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TourStep {
    title: string;
    description: string;
    emoji: string;
    highlight: string; // CSS selector or descriptive label for the spotlight
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center';
}

// ─── Tour Steps ───────────────────────────────────────────────────────────────

const TOUR_STEPS: TourStep[] = [
    {
        title: 'Welcome to GitFlow Editor 🚀',
        description:
            'This interactive tool simulates a real Git repository. You\'ll learn branching, merging, rebasing, and more — all visually. Let\'s take a quick tour!',
        emoji: '👋',
        highlight: 'center',
        position: 'center',
    },
    {
        title: 'Left Pane — File Explorer',
        description:
            'This is your working directory. Files are listed here with their status (modified, staged, unmodified). Drag files down into the Staging Area to prepare them for a commit.',
        emoji: '📁',
        highlight: 'left-pane',
        position: 'top-right',
    },
    {
        title: 'Staging Area',
        description:
            'Once files are staged here, they\'re ready to be committed. You can selectively stage only the files you want — keeping each commit focused and clean.',
        emoji: '📦',
        highlight: 'staging-area',
        position: 'top-right',
    },
    {
        title: 'Center — Commit Graph',
        description:
            'This is the heart of GitFlow Editor. Every commit appears as a node. Branches and tags float above. Right-click any node for actions like merge, reset, cherry-pick, and more.',
        emoji: '🌳',
        highlight: 'commit-graph',
        position: 'bottom-right',
    },
    {
        title: 'Right Pane — Terminal',
        description:
            'Type real Git commands here. Everything you type gets executed against the simulated repository. Use the quick buttons at the bottom for common commands.',
        emoji: '💻',
        highlight: 'terminal',
        position: 'top-left',
    },
    {
        title: '📚 Lessons & Scenarios',
        description:
            'Open Guided Lessons for step-by-step challenges that teach you Git concepts. Scenarios load pre-built situations. Earn XP as you complete each lesson!',
        emoji: '🎓',
        highlight: 'lessons-button',
        position: 'bottom-right',
    },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface OnboardingTourProps {
    onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
    const [step, setStep] = useState(0);
    const { setHasSeenOnboarding } = useSettingsStore();

    const current = TOUR_STEPS[step];
    const isLast = step === TOUR_STEPS.length - 1;
    const isFirst = step === 0;

    const finish = () => {
        setHasSeenOnboarding(true);
        onComplete();
    };

    const next = () => {
        if (isLast) finish();
        else setStep((s) => s + 1);
    };

    const prev = () => setStep((s) => Math.max(0, s - 1));

    // Allow keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
            if (e.key === 'Escape') finish();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });

    const positionClasses = {
        center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        'top-left': 'top-32 left-72',
        'top-right': 'top-32 right-8',
        'bottom-left': 'bottom-32 left-72',
        'bottom-right': 'bottom-24 right-8',
        'top-center': 'top-16 left-1/2 -translate-x-1/2',
    };

    return (
        <div className="fixed inset-0 z-[300] pointer-events-none">
            {/* Dimmed overlay */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] pointer-events-auto" onClick={finish} />

            {/* Tour card */}
            <div className={`absolute ${positionClasses[current.position]} pointer-events-auto`}>
                <div
                    className="w-[380px] bg-[#151b28] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
                    style={{ animation: 'context-menu-appear 0.2s ease-out' }}
                >
                    {/* Progress dots */}
                    <div className="px-6 pt-5 flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {TOUR_STEPS.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setStep(i)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        i === step
                                            ? 'w-5 bg-indigo-400'
                                            : i < step
                                            ? 'w-1.5 bg-indigo-400/40'
                                            : 'w-1.5 bg-slate-700'
                                    }`}
                                />
                            ))}
                        </div>
                        <button
                            onClick={finish}
                            className="text-[9px] text-slate-600 hover:text-slate-400 transition-colors"
                        >
                            Skip tour
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 pt-4 pb-5">
                        <div className="text-3xl mb-3">{current.emoji}</div>
                        <h3 className="text-sm font-bold text-white mb-2">{current.title}</h3>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{current.description}</p>
                    </div>

                    {/* Navigation */}
                    <div className="px-6 pb-5 flex items-center justify-between">
                        <button
                            onClick={prev}
                            disabled={isFirst}
                            className="text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-0"
                        >
                            ← Back
                        </button>
                        <span className="text-[9px] text-slate-700 font-mono">
                            {step + 1} / {TOUR_STEPS.length}
                        </span>
                        <button
                            onClick={next}
                            className="text-xs font-semibold px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 transition-all"
                        >
                            {isLast ? 'Get started! 🚀' : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
