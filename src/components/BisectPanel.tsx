import { useGitStore } from '../store/useGitStore';
import type { BisectState } from '../store/useGitStore';

// ─── Bisect Panel ────────────────────────────────────────────────────────────

interface BisectPanelProps {
    bisectState: BisectState;
}

function getVerdict(hash: string, bisectState: BisectState): 'good' | 'bad' | 'testing' | null {
    if (bisectState.currentTest === hash) return 'testing';
    return bisectState.tested[hash] ?? null;
}

export default function BisectPanel({ bisectState }: BisectPanelProps) {
    const { commits, bisectMark, bisectReset } = useGitStore();
    const { currentTest, foundHash, tested } = bisectState;

    const testedCount = Object.keys(tested).length - 2; // exclude initial good/bad
    const totalBetween = commits.filter(
        (c) => !tested[c.hash] || (tested[c.hash] !== 'good' && tested[c.hash] !== 'bad')
    ).length;
    const progressPercent = totalBetween > 0
        ? Math.max(5, ((testedCount / (testedCount + totalBetween)) * 100))
        : 100;

    const currentCommit = commits.find((c) => c.hash === currentTest);
    const foundCommit = commits.find((c) => c.hash === foundHash);

    if (foundHash) {
        return (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 w-[420px]">
                <div className="bg-[#151b28]/95 backdrop-blur-md border border-red-500/40 rounded-xl shadow-2xl shadow-red-500/10 overflow-hidden animate-context-menu">
                    <div className="h-1 bg-red-500" />
                    <div className="px-5 py-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🎯</span>
                            <h3 className="text-sm font-bold text-white">Bug Found!</h3>
                        </div>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                            <p className="text-[10px] text-slate-400 mb-1.5 font-mono">First bad commit:</p>
                            <p className="text-xs font-bold text-red-300 font-mono">{foundHash.slice(0, 7)}</p>
                            {foundCommit && (
                                <p className="text-[10px] text-slate-300 mt-1">{foundCommit.message}</p>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
                            Git bisect identified this as the first commit that introduced the bug. You can inspect it, add a test, and revert or fix it.
                        </p>
                        <button
                            onClick={bisectReset}
                            className="w-full py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 transition-all"
                        >
                            git bisect reset ↩
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 w-[400px]">
            <div className="bg-[#151b28]/95 backdrop-blur-md border border-amber-500/40 rounded-xl shadow-2xl shadow-amber-500/10 overflow-hidden animate-context-menu">
                {/* Progress bar */}
                <div className="h-1 bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div className="px-5 py-3">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-base">🔍</span>
                            <h3 className="text-xs font-bold text-amber-300">git bisect</h3>
                            <span className="text-[9px] text-slate-500 font-mono">binary search</span>
                        </div>
                        <button
                            onClick={bisectReset}
                            className="text-[9px] text-slate-500 hover:text-red-400 px-2 py-0.5 rounded border border-slate-700/40 hover:border-red-500/40 transition-colors"
                        >
                            reset
                        </button>
                    </div>

                    {/* Current test */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-3">
                        <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider mb-1.5">Testing this commit</p>
                        {currentCommit ? (
                            <>
                                <p className="text-[11px] font-bold text-white font-mono">{currentTest?.slice(0, 7)}</p>
                                <p className="text-[10px] text-slate-300 mt-0.5">{currentCommit.message}</p>
                            </>
                        ) : (
                            <p className="text-[10px] text-slate-400 italic">No commit selected</p>
                        )}
                    </div>

                    {/* Verdict buttons */}
                    <p className="text-[9px] text-slate-500 mb-2 text-center">Does the bug exist in this commit?</p>
                    <div className="flex gap-2.5 mb-3">
                        <button
                            onClick={() => currentTest && bisectMark(currentTest, 'bad')}
                            disabled={!currentTest}
                            className="flex-1 py-2 text-xs font-bold rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 hover:border-red-400/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            🐛 Yes — Bug exists
                        </button>
                        <button
                            onClick={() => currentTest && bisectMark(currentTest, 'good')}
                            disabled={!currentTest}
                            className="flex-1 py-2 text-xs font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-400/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            ✅ No — Looks good
                        </button>
                    </div>

                    {/* Tested summary */}
                    <div className="flex items-center justify-between text-[9px] text-slate-600">
                        <span>Good: <span className="text-emerald-400">{Object.values(tested).filter((v) => v === 'good').length}</span></span>
                        <span>Bad: <span className="text-red-400">{Object.values(tested).filter((v) => v === 'bad').length}</span></span>
                        <span>Remaining: <span className="text-amber-400">{commits.filter((c) => !tested[c.hash]).length}</span></span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { getVerdict };
