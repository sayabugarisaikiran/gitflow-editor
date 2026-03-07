import { useState } from 'react';
import { useGitStore } from '../store/useGitStore';
import { SCENARIOS } from '../data/scenarios';
import type { ScenarioDefinition } from '../data/scenarios';

// ─── Difficulty Badge ────────────────────────────────────────────────────────

function DifficultyBadge({ level }: { level: ScenarioDefinition['difficulty'] }) {
    const colors = {
        beginner: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        intermediate: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        advanced: 'text-red-400 bg-red-500/15 border-red-500/30',
    };

    return (
        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-px rounded-full border ${colors[level]}`}>
            {level}
        </span>
    );
}

// ─── Scenario Card ──────────────────────────────────────────────────────────

function ScenarioCard({
    scenario,
    isActive,
    onLoad,
}: {
    scenario: ScenarioDefinition;
    isActive: boolean;
    onLoad: () => void;
}) {
    const [showHints, setShowHints] = useState(false);

    return (
        <div className={`rounded-xl border transition-all ${isActive
            ? 'bg-indigo-500/10 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
            : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/50'
            }`}
        >
            <div className="px-3 py-2.5">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{scenario.scenario.name}</span>
                    <DifficultyBadge level={scenario.difficulty} />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                    {scenario.description}
                </p>

                {/* Objective */}
                <div className="text-[9px] text-slate-500 bg-slate-900/40 rounded-lg px-2.5 py-1.5 mb-2 border border-slate-700/20">
                    <span className="text-indigo-400 font-bold">OBJECTIVE: </span>
                    {scenario.objective}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onLoad}
                        className={`text-[10px] font-semibold px-3 py-1 rounded-lg transition-all ${isActive
                            ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 cursor-default'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-300 border border-slate-600/30'
                            }`}
                        disabled={isActive}
                    >
                        {isActive ? '✓ Active' : '▶ Load'}
                    </button>
                    <button
                        onClick={() => setShowHints(!showHints)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        {showHints ? 'Hide hints' : '💡 Hints'}
                    </button>
                </div>

                {/* Hints */}
                {showHints && (
                    <div className="mt-2 space-y-1 animate-fade-in">
                        {scenario.hints.map((hint, i) => (
                            <div key={i} className="text-[9px] text-slate-500 flex items-start gap-1.5">
                                <span className="text-indigo-400 shrink-0">{i + 1}.</span>
                                <span>{hint}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Panel ─────────────────────────────────────────────────────────────

export default function ScenarioPanel({ onClose }: { onClose: () => void }) {
    const { loadScenario, activeScenario } = useGitStore();

    return (
        <div className="fixed left-0 top-0 h-full w-80 bg-[#0d1117]/95 backdrop-blur-md border-r border-slate-700/50 z-40 flex flex-col animate-slide-in-left shadow-2xl shadow-black/40">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-base">🎯</span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Scenarios
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-500 hover:text-white transition-colors p-0.5"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Description */}
            <div className="px-4 py-3 border-b border-slate-800/30">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                    Pre-built exercises to practice Git operations.
                    Load a scenario and follow the objective.
                </p>
            </div>

            {/* Scenario List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5">
                {SCENARIOS.map((s) => (
                    <ScenarioCard
                        key={s.scenario.id}
                        scenario={s}
                        isActive={activeScenario === s.scenario.id}
                        onLoad={() => loadScenario(s.scenario)}
                    />
                ))}
            </div>
        </div>
    );
}
