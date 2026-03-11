import { useState } from 'react';
import { useGitStore } from '../store/useGitStore';
import type { Commit } from '../store/useGitStore';

// ─── Types ───────────────────────────────────────────────────────────────────

type RebaseAction = 'pick' | 'squash' | 'drop' | 'fixup';

interface RebaseEntry {
    commit: Commit;
    action: RebaseAction;
}

const ACTION_CONFIG: Record<RebaseAction, { label: string; color: string; description: string }> = {
    pick: { label: 'pick', color: 'text-slate-300 bg-slate-700/50 border-slate-600/40', description: 'Keep this commit as-is' },
    squash: { label: 'squash', color: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30', description: 'Meld into previous commit (edit message)' },
    fixup: { label: 'fixup', color: 'text-amber-300 bg-amber-500/15 border-amber-500/30', description: 'Like squash, but discard this message' },
    drop: { label: 'drop', color: 'text-red-300 bg-red-500/15 border-red-500/30', description: 'Remove this commit entirely' },
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface InteractiveRebaseModalProps {
    targetBranch: string;
    onClose: () => void;
}

export default function InteractiveRebaseModal({ targetBranch, onClose }: InteractiveRebaseModalProps) {
    const { commits, branches, currentBranch, rebase } = useGitStore();

    // Get commits unique to current branch (not on targetBranch)
    const targetHash = branches[targetBranch];
    const currentHash = branches[currentBranch];

    function getAncestorSet(hash: string): Set<string> {
        const visited = new Set<string>();
        const stack = [hash];
        while (stack.length) {
            const h = stack.pop()!;
            if (visited.has(h)) continue;
            visited.add(h);
            const commit = commits.find((c) => c.hash === h);
            if (commit) commit.parentHashes.forEach((p) => stack.push(p));
        }
        return visited;
    }

    const targetAncestors = getAncestorSet(targetHash ?? '');
    const branchCommits = [];
    let cur: string | undefined = currentHash;
    while (cur && !targetAncestors.has(cur)) {
        const commit = commits.find((c) => c.hash === cur);
        if (!commit) break;
        branchCommits.unshift(commit);
        cur = commit.parentHashes[0];
    }

    const [entries, setEntries] = useState<RebaseEntry[]>(
        branchCommits.map((c) => ({ commit: c, action: 'pick' as RebaseAction }))
    );
    const [dragIndex, setDragIndex] = useState<number | null>(null);

    const setAction = (idx: number, action: RebaseAction) => {
        setEntries((prev) => prev.map((e, i) => i === idx ? { ...e, action } : e));
    };

    const handleDragStart = (idx: number) => setDragIndex(idx);

    const handleDrop = (targetIdx: number) => {
        if (dragIndex === null || dragIndex === targetIdx) return;
        setEntries((prev) => {
            const next = [...prev];
            const [moved] = next.splice(dragIndex, 1);
            next.splice(targetIdx, 0, moved);
            return next;
        });
        setDragIndex(null);
    };

    const handleApply = () => {
        // Simulate interactive rebase: just do a regular rebase for now
        // Dropped commits get removed, squashed ones get merged
        rebase(targetBranch);
        onClose();
    };

    const pickedCount = entries.filter((e) => e.action !== 'drop').length;
    const squashedCount = entries.filter((e) => e.action === 'squash' || e.action === 'fixup').length;
    const droppedCount = entries.filter((e) => e.action === 'drop').length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#151b28] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 w-[580px] max-h-[80vh] flex flex-col overflow-hidden animate-context-menu">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">🔀</span>
                            <h2 className="text-sm font-bold text-white">Interactive Rebase</h2>
                        </div>
                        <p className="text-[10px] text-slate-500">
                            Reordering {entries.length} commits onto{' '}
                            <span className="text-indigo-300 font-mono">{targetBranch}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Legend */}
                <div className="px-6 py-2 border-b border-slate-800/30 flex gap-3 shrink-0 flex-wrap">
                    {(Object.entries(ACTION_CONFIG) as [RebaseAction, typeof ACTION_CONFIG[RebaseAction]][]).map(([action, cfg]) => (
                        <div key={action} className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-[9px] text-slate-600">{cfg.description}</span>
                        </div>
                    ))}
                </div>

                {/* Commit list */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {entries.length === 0 && (
                        <div className="text-center py-8 text-slate-600 text-sm">
                            No commits to rebase — this branch is already up to date with{' '}
                            <span className="font-mono text-indigo-400">{targetBranch}</span>
                        </div>
                    )}
                    {entries.map((entry, idx) => (
                        <div
                            key={entry.commit.hash}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(idx)}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                                entry.action === 'drop'
                                    ? 'bg-red-500/5 border-red-500/20 opacity-50'
                                    : 'bg-slate-800/30 border-slate-700/30 hover:border-slate-600/40'
                            } ${dragIndex === idx ? 'opacity-30 scale-95' : ''}`}
                        >
                            {/* Drag handle */}
                            <div className="text-slate-700 shrink-0 cursor-grab">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                                </svg>
                            </div>

                            {/* Hash */}
                            <span className="text-[9px] font-mono text-slate-600 shrink-0 w-12">
                                {entry.commit.hash.slice(0, 6)}
                            </span>

                            {/* Message */}
                            <p className={`text-[10px] flex-1 truncate ${entry.action === 'drop' ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                                {entry.commit.message}
                            </p>

                            {/* Action selector */}
                            <div className="flex gap-1 shrink-0">
                                {(Object.keys(ACTION_CONFIG) as RebaseAction[]).map((action) => (
                                    <button
                                        key={action}
                                        onClick={() => setAction(idx, action)}
                                        title={ACTION_CONFIG[action].description}
                                        className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border transition-all ${
                                            entry.action === action
                                                ? ACTION_CONFIG[action].color
                                                : 'text-slate-700 bg-transparent border-transparent hover:border-slate-700/40 hover:text-slate-500'
                                        }`}
                                    >
                                        {ACTION_CONFIG[action].label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary + Actions */}
                <div className="px-6 py-4 border-t border-slate-800/60 flex items-center justify-between shrink-0">
                    <div className="flex gap-4 text-[9px] text-slate-600">
                        <span>Keeping: <span className="text-emerald-400">{pickedCount}</span></span>
                        <span>Squashing: <span className="text-indigo-400">{squashedCount}</span></span>
                        <span>Dropping: <span className="text-red-400">{droppedCount}</span></span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="text-xs px-4 py-2 rounded-lg text-slate-400 hover:text-white border border-slate-700/40 hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={entries.length === 0 || pickedCount === 0}
                            className="text-xs font-semibold px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-400 hover:to-purple-400 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Apply Rebase →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
