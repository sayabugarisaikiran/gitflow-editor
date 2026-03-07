import { useGitStore } from '../store/useGitStore';

const statusIcons: Record<string, string> = {
    modified: '●',
    staged: '✓',
    unmodified: '○',
};

const statusColors: Record<string, string> = {
    modified: 'text-red-400',
    staged: 'text-emerald-400',
    unmodified: 'text-slate-500',
};

export default function LeftPane() {
    const { files, commits, currentBranch, stageFile, unstageFile } = useGitStore();

    const modifiedFiles = files.filter((f) => f.status === 'modified');
    const stagedFiles = files.filter((f) => f.status === 'staged');
    const unmodifiedFiles = files.filter((f) => f.status === 'unmodified');

    return (
        <div className="h-full flex flex-col bg-[#0d1117] border-r border-slate-800/60 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800/60 bg-[#0d1117]/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Git State
                    </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-medium text-indigo-300">{currentBranch}</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Working Directory */}
                <section className="p-3">
                    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-red-400/80 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        Working Directory
                        {modifiedFiles.length > 0 && (
                            <span className="ml-auto text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full">
                                {modifiedFiles.length}
                            </span>
                        )}
                    </h3>
                    <div className="space-y-1">
                        {modifiedFiles.length === 0 ? (
                            <p className="text-xs text-slate-600 italic px-2 py-1">No modified files</p>
                        ) : (
                            modifiedFiles.map((file) => (
                                <div
                                    key={file.name}
                                    className="group flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-800/50 transition-colors cursor-pointer"
                                >
                                    <span className={`text-sm ${statusColors[file.status]}`}>
                                        {statusIcons[file.status]}
                                    </span>
                                    <span className="text-sm text-slate-300 flex-1 truncate font-mono text-xs">
                                        {file.name}
                                    </span>
                                    <button
                                        onClick={() => stageFile(file.name)}
                                        className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded transition-all"
                                    >
                                        Stage
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Divider */}
                <div className="mx-3 border-t border-slate-800/40" />

                {/* Staging Area */}
                <section className="p-3">
                    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-emerald-400/80 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Staging Area
                        {stagedFiles.length > 0 && (
                            <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full">
                                {stagedFiles.length}
                            </span>
                        )}
                    </h3>
                    <div className="space-y-1">
                        {stagedFiles.length === 0 ? (
                            <p className="text-xs text-slate-600 italic px-2 py-1">No staged files</p>
                        ) : (
                            stagedFiles.map((file) => (
                                <div
                                    key={file.name}
                                    className="group flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-800/50 transition-colors cursor-pointer animate-slide-in"
                                >
                                    <span className={`text-sm ${statusColors[file.status]}`}>
                                        {statusIcons[file.status]}
                                    </span>
                                    <span className="text-sm text-slate-300 flex-1 truncate font-mono text-xs">
                                        {file.name}
                                    </span>
                                    <button
                                        onClick={() => unstageFile(file.name)}
                                        className="opacity-0 group-hover:opacity-100 text-[10px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-0.5 rounded transition-all"
                                    >
                                        Unstage
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Divider */}
                <div className="mx-3 border-t border-slate-800/40" />

                {/* Repository (Commit log) */}
                <section className="p-3">
                    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-400/80 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        Repository
                        <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full">
                            {commits.length}
                        </span>
                    </h3>
                    <div className="space-y-1">
                        {[...commits].reverse().map((commit) => (
                            <div
                                key={commit.hash}
                                className="flex items-start gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="mt-1 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-300 truncate">{commit.message}</p>
                                    <p className="text-[10px] text-slate-600 font-mono">{commit.hash}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Divider */}
                <div className="mx-3 border-t border-slate-800/40" />

                {/* Unmodified files */}
                <section className="p-3">
                    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500/80 mb-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        Tracked Files
                    </h3>
                    <div className="space-y-1">
                        {unmodifiedFiles.map((file) => (
                            <div
                                key={file.name}
                                className="flex items-center gap-2 px-2.5 py-1 rounded-md"
                            >
                                <span className={`text-sm ${statusColors[file.status]}`}>
                                    {statusIcons[file.status]}
                                </span>
                                <span className="text-xs text-slate-500 truncate font-mono">
                                    {file.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
