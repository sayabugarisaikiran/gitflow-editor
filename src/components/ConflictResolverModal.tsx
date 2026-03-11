import { useGitStore } from '../store/useGitStore';

interface ConflictResolverModalProps {
    fileName: string;
    onClose: () => void;
}

export default function ConflictResolverModal({ fileName, onClose }: ConflictResolverModalProps) {
    const { resolveConflict, mergingTarget, currentBranch } = useGitStore();

    // Mock content for the visual diff
    const currentCode = `// Content from ${currentBranch}\nexport function processData() {\n  return data.map(transformLogicA);\n}`;
    const incomingCode = `// Content from ${mergingTarget}\nexport function processData() {\n  return data.map(transformLogicB).filter(isValid);\n}`;

    const handleResolve = (resolution: 'current' | 'incoming' | 'both') => {
        resolveConflict(fileName, resolution);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div
                className="bg-[#0f1623] border border-red-500/40 rounded-xl shadow-2xl shadow-red-900/20 w-full max-w-2xl flex flex-col animate-slide-in overflow-hidden"
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-800 bg-red-500/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                            <span className="text-red-400 font-bold text-lg">!</span>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-200">
                                Merge Conflict: <span className="text-red-300 font-mono">{fileName}</span>
                            </h2>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Please resolve the conflicting changes before continuing the merge.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Diff View */}
                <div className="p-5 flex-1 overflow-y-auto bg-[#0a0e14]">
                    <div className="font-mono text-xs rounded border border-slate-700/50 overflow-hidden">
                        {/* Current Header */}
                        <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1.5 border-b border-indigo-500/30 font-bold">
                            {'<<<<<<< HEAD (Current Change)'}
                        </div>
                        {/* Current Content */}
                        <div className="bg-indigo-500/5 text-slate-300 p-3 whitespace-pre border-b border-slate-700/50">
                            {currentCode}
                        </div>

                        {/* Divider */}
                        <div className="bg-slate-800 text-slate-500 px-3 py-1 border-b border-slate-700/50 font-bold">
                            {'======='}
                        </div>

                        {/* Incoming Content */}
                        <div className="bg-emerald-500/5 text-slate-300 p-3 whitespace-pre border-b border-slate-700/50">
                            {incomingCode}
                        </div>
                        {/* Incoming Header */}
                        <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1.5 font-bold">
                            {`>>>>>>> ${mergingTarget} (Incoming Change)`}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-4 border-t border-slate-800/60 bg-[#0d1117] flex gap-3">
                    <button
                        onClick={() => handleResolve('current')}
                        className="flex-1 py-2 text-xs font-semibold rounded-md bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-colors"
                    >
                        Accept Current
                    </button>
                    <button
                        onClick={() => handleResolve('incoming')}
                        className="flex-1 py-2 text-xs font-semibold rounded-md bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors"
                    >
                        Accept Incoming
                    </button>
                    <button
                        onClick={() => handleResolve('both')}
                        className="flex-1 py-2 text-xs font-semibold rounded-md bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600 transition-colors"
                    >
                        Accept Both
                    </button>
                </div>
            </div>
        </div>
    );
}
