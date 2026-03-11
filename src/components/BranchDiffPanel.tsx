import { useGitStore } from '../store/useGitStore';

interface BranchDiffPanelProps {
    branchA: string;
    branchB: string;
    onClose: () => void;
}

export default function BranchDiffPanel({ branchA, branchB, onClose }: BranchDiffPanelProps) {
    const { commits, branches } = useGitStore();

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

    function getOrderedAncestors(hash: string): string[] {
        const result: string[] = [];
        const visited = new Set<string>();
        const stack = [hash];
        while (stack.length) {
            const h = stack.pop()!;
            if (visited.has(h)) continue;
            visited.add(h);
            result.push(h);
            const commit = commits.find((c) => c.hash === h);
            if (commit) commit.parentHashes.forEach((p) => stack.push(p));
        }
        return result;
    }

    const hashA = branches[branchA] ?? '';
    const hashB = branches[branchB] ?? '';

    const ancestorsA = getAncestorSet(hashA);
    const ancestorsB = getAncestorSet(hashB);

    // Find common base
    let mergeBase: string | null = null;
    const orderedA = getOrderedAncestors(hashA);
    for (const h of orderedA) {
        if (ancestorsB.has(h)) { mergeBase = h; break; }
    }

    // Commits unique to A (in A but not in ancestorsB)
    const uniqueToA = commits.filter((c) => ancestorsA.has(c.hash) && !ancestorsB.has(c.hash));
    // Commits unique to B (in B but not in ancestorsA)
    const uniqueToB = commits.filter((c) => ancestorsB.has(c.hash) && !ancestorsA.has(c.hash));
    // Shared base commit
    const baseCommit = commits.find((c) => c.hash === mergeBase);

    const formatTime = (ts: number) => {
        const diff = Date.now() - ts;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ago`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#151b28] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 w-[680px] max-h-[80vh] flex flex-col overflow-hidden animate-context-menu">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-base">⚖️</span>
                        <div>
                            <h2 className="text-sm font-bold text-white">Branch Comparison</h2>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                <span className="text-indigo-300">{branchA}</span>
                                <span className="text-slate-600"> ↔ </span>
                                <span className="text-purple-300">{branchB}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Merge base */}
                {baseCommit && (
                    <div className="px-6 py-2.5 border-b border-slate-800/30 bg-slate-800/20 flex items-center gap-2 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                        <span className="text-[9px] text-slate-500 font-mono">Common ancestor:</span>
                        <span className="text-[9px] font-bold text-slate-400 font-mono">{baseCommit.hash.slice(0, 7)}</span>
                        <span className="text-[9px] text-slate-500">{baseCommit.message}</span>
                    </div>
                )}

                {/* Stats bar */}
                <div className="px-6 py-2 border-b border-slate-800/30 flex gap-6 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-400" />
                        <span className="text-[10px] text-slate-400">
                            <span className="font-bold text-indigo-300">{uniqueToA.length}</span> commits only on{' '}
                            <span className="font-mono text-indigo-300">{branchA}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-purple-400" />
                        <span className="text-[10px] text-slate-400">
                            <span className="font-bold text-purple-300">{uniqueToB.length}</span> commits only on{' '}
                            <span className="font-mono text-purple-300">{branchB}</span>
                        </span>
                    </div>
                </div>

                {/* Diff columns */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Branch A */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar border-r border-slate-800/40">
                        <div className="sticky top-0 px-4 py-2 bg-indigo-500/10 border-b border-indigo-500/20 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-400" />
                            <span className="text-[10px] font-bold text-indigo-300 font-mono">{branchA}</span>
                            <span className="text-[9px] text-slate-600 ml-auto">{uniqueToA.length} unique</span>
                        </div>
                        <div className="p-3 space-y-2">
                            {uniqueToA.length === 0 && (
                                <p className="text-[10px] text-slate-600 text-center py-4 italic">No unique commits</p>
                            )}
                            {uniqueToA.map((c) => (
                                <div key={c.hash} className="p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[8px] font-mono text-indigo-400/60">{c.hash.slice(0, 7)}</span>
                                        <span className="text-[8px] text-slate-600 ml-auto">{formatTime(c.timestamp)}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-300 leading-relaxed">{c.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Branch B */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="sticky top-0 px-4 py-2 bg-purple-500/10 border-b border-purple-500/20 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple-400" />
                            <span className="text-[10px] font-bold text-purple-300 font-mono">{branchB}</span>
                            <span className="text-[9px] text-slate-600 ml-auto">{uniqueToB.length} unique</span>
                        </div>
                        <div className="p-3 space-y-2">
                            {uniqueToB.length === 0 && (
                                <p className="text-[10px] text-slate-600 text-center py-4 italic">No unique commits</p>
                            )}
                            {uniqueToB.map((c) => (
                                <div key={c.hash} className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/15">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[8px] font-mono text-purple-400/60">{c.hash.slice(0, 7)}</span>
                                        <span className="text-[8px] text-slate-600 ml-auto">{formatTime(c.timestamp)}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-300 leading-relaxed">{c.message}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
