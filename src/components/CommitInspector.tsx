import { useGitStore } from '../store/useGitStore';

// ─── Commit Inspector Panel ─────────────────────────────────────────────────

export default function CommitInspector() {
    const { selectedCommit, commits, branches, HEAD, selectCommit } = useGitStore();

    if (!selectedCommit) return null;

    const commit = commits.find((c) => c.hash === selectedCommit);
    if (!commit) return null;

    // Find branches pointing to this commit
    const commitBranches = Object.entries(branches)
        .filter(([, hash]) => hash === commit.hash)
        .map(([name]) => name);

    // Find parent commit messages
    const parents = commit.parentHashes.map((ph) => {
        const parent = commits.find((c) => c.hash === ph);
        return { hash: ph, message: parent?.message || 'unknown' };
    });

    // Find children
    const children = commits
        .filter((c) => c.parentHashes.includes(commit.hash))
        .map((c) => ({ hash: c.hash, message: c.message }));

    const isHead = commit.hash === HEAD;
    const isMerge = commit.parentHashes.length > 1;
    const commitDate = new Date(commit.timestamp);
    const timeAgo = getTimeAgo(commitDate);

    return (
        <div className="fixed right-0 top-0 h-full w-80 bg-[#0d1117]/95 backdrop-blur-md border-l border-slate-700/50 z-40 flex flex-col animate-slide-in-right shadow-2xl shadow-black/40">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isHead ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : isMerge ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Commit Inspector
                    </span>
                </div>
                <button
                    onClick={() => selectCommit(null)}
                    className="text-slate-500 hover:text-white transition-colors p-0.5"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Hash */}
                <div className="px-4 py-3 border-b border-slate-800/30">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
                        Hash
                    </label>
                    <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-amber-400">{commit.hash}</code>
                        {isHead && (
                            <span className="text-[8px] font-bold text-yellow-400 bg-yellow-500/15 border border-yellow-500/30 px-1.5 py-px rounded-full">
                                HEAD
                            </span>
                        )}
                        {isMerge && (
                            <span className="text-[8px] font-bold text-pink-400 bg-pink-500/15 border border-pink-500/30 px-1.5 py-px rounded-full">
                                MERGE
                            </span>
                        )}
                    </div>
                </div>

                {/* Message */}
                <div className="px-4 py-3 border-b border-slate-800/30">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
                        Message
                    </label>
                    <p className="text-sm text-slate-200">{commit.message}</p>
                </div>

                {/* Branch */}
                <div className="px-4 py-3 border-b border-slate-800/30">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
                        Branch (created on)
                    </label>
                    <span className="text-xs text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                        {commit.branch}
                    </span>
                </div>

                {/* Branches pointing here */}
                {commitBranches.length > 0 && (
                    <div className="px-4 py-3 border-b border-slate-800/30">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                            Branch Tips
                        </label>
                        <div className="flex flex-wrap gap-1">
                            {commitBranches.map((b) => (
                                <span
                                    key={b}
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                >
                                    ⎇ {b}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timestamp */}
                <div className="px-4 py-3 border-b border-slate-800/30">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">
                        Timestamp
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-300">
                            {commitDate.toLocaleTimeString()}
                        </span>
                        <span className="text-[10px] text-slate-500">({timeAgo})</span>
                    </div>
                </div>

                {/* Parents */}
                <div className="px-4 py-3 border-b border-slate-800/30">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                        Parents ({parents.length})
                    </label>
                    {parents.length === 0 ? (
                        <span className="text-[10px] text-slate-600 italic">Root commit (no parents)</span>
                    ) : (
                        <div className="space-y-1">
                            {parents.map((p) => (
                                <button
                                    key={p.hash}
                                    onClick={() => selectCommit(p.hash)}
                                    className="flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-slate-800/50 transition-colors group"
                                >
                                    <code className="text-[10px] font-mono text-amber-400/80 group-hover:text-amber-400">
                                        {p.hash.slice(0, 8)}
                                    </code>
                                    <span className="text-[10px] text-slate-500 group-hover:text-slate-300 truncate">
                                        {p.message}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Children */}
                {children.length > 0 && (
                    <div className="px-4 py-3 border-b border-slate-800/30">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                            Children ({children.length})
                        </label>
                        <div className="space-y-1">
                            {children.map((c) => (
                                <button
                                    key={c.hash}
                                    onClick={() => selectCommit(c.hash)}
                                    className="flex items-center gap-2 w-full text-left px-2 py-1 rounded hover:bg-slate-800/50 transition-colors group"
                                >
                                    <code className="text-[10px] font-mono text-cyan-400/80 group-hover:text-cyan-400">
                                        {c.hash.slice(0, 8)}
                                    </code>
                                    <span className="text-[10px] text-slate-500 group-hover:text-slate-300 truncate">
                                        {c.message}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Git Explanation */}
                <div className="px-4 py-3">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                        💡 Learn
                    </label>
                    <div className="text-[10px] text-slate-500 leading-relaxed bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                        {parents.length === 0 && (
                            <p>This is the <strong className="text-slate-400">root commit</strong> — the very first commit in the repository. It has no parents.</p>
                        )}
                        {parents.length === 1 && !isMerge && (
                            <p>A standard commit with <strong className="text-slate-400">one parent</strong>. This represents a linear change in the branch's history.</p>
                        )}
                        {isMerge && (
                            <p>This is a <strong className="text-pink-400">merge commit</strong> — it has <strong className="text-slate-400">{parents.length} parents</strong>, joining two lines of development. The first parent is the branch you were on, the second is the branch you merged in.</p>
                        )}
                        {isHead && (
                            <p className="mt-1.5">🔵 <strong className="text-yellow-400">HEAD</strong> currently points here. New commits will be added after this one.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
