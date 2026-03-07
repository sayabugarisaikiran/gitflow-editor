import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CommitNodeData {
    hash: string;
    message: string;
    isHead: boolean;
    branches: string[];
    tags: string[];
    timestamp: number;
    isMerge: boolean;
    [key: string]: unknown;
}

// ─── Branch color palette ───────────────────────────────────────────────────

const BRANCH_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    main: {
        bg: 'bg-indigo-500/20',
        text: 'text-indigo-300',
        border: 'border-indigo-500/40',
        glow: 'shadow-indigo-500/30',
    },
    master: {
        bg: 'bg-indigo-500/20',
        text: 'text-indigo-300',
        border: 'border-indigo-500/40',
        glow: 'shadow-indigo-500/30',
    },
    develop: {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-300',
        border: 'border-emerald-500/40',
        glow: 'shadow-emerald-500/30',
    },
    feature: {
        bg: 'bg-amber-500/20',
        text: 'text-amber-300',
        border: 'border-amber-500/40',
        glow: 'shadow-amber-500/30',
    },
};

const DEFAULT_BRANCH_COLOR = {
    bg: 'bg-purple-500/20',
    text: 'text-purple-300',
    border: 'border-purple-500/40',
    glow: 'shadow-purple-500/30',
};

function getBranchColor(branchName: string) {
    // Check exact match first, then prefix match
    if (BRANCH_COLORS[branchName]) return BRANCH_COLORS[branchName];
    for (const key of Object.keys(BRANCH_COLORS)) {
        if (branchName.startsWith(key)) return BRANCH_COLORS[key];
    }
    return DEFAULT_BRANCH_COLOR;
}

// ─── Custom Commit Node ─────────────────────────────────────────────────────

function CustomCommitNode({ data }: NodeProps) {
    const { hash, message, isHead, branches, tags, isMerge } = data as unknown as CommitNodeData;

    return (
        <div className="relative flex flex-col items-center group">
            {/* Branch labels — floating tags above the node */}
            {branches.length > 0 && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 whitespace-nowrap">
                    {branches.map((b: string) => {
                        const color = getBranchColor(b);
                        return (
                            <span
                                key={b}
                                className={`
                  text-[10px] font-bold px-2 py-0.5 rounded-full
                  ${color.bg} ${color.text} border ${color.border}
                  shadow-sm ${color.glow}
                  transition-transform duration-200 group-hover:scale-105
                `}
                            >
                                {b}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* HEAD indicator */}
            {isHead && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    {branches.length > 0 && <div className="w-px h-2 bg-yellow-400/50" />}
                    <span className="text-[9px] font-bold text-yellow-400 bg-yellow-500/15 border border-yellow-500/30 px-1.5 py-px rounded-full shadow-sm shadow-yellow-500/20">
                        HEAD
                    </span>
                    <div className="w-px h-1.5 bg-yellow-400/50" />
                </div>
            )}

            {/* Commit circle */}
            <div
                className={`
          relative w-12 h-12 rounded-full flex items-center justify-center
          text-[11px] font-mono font-bold cursor-pointer
          transition-all duration-300 ease-out
          group-hover:scale-110 group-hover:shadow-xl
          ${isHead
                        ? 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 text-slate-900 shadow-lg shadow-amber-500/30 ring-2 ring-yellow-400/40 animate-pulse-glow'
                        : isMerge
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20 border border-purple-400/30'
                            : 'bg-gradient-to-br from-slate-600 to-slate-700 text-slate-200 border border-slate-500/40 shadow-md shadow-black/30 hover:border-indigo-500/50 hover:shadow-indigo-500/20'
                    }
        `}
            >
                {(hash as string).slice(0, 4)}

                {/* Merge indicator dot */}
                {isMerge && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-pink-400 border-2 border-[#0f1623] flex items-center justify-center">
                        <span className="text-[6px] text-white">M</span>
                    </div>
                )}
            </div>

            {/* Commit message — below the node */}
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap max-w-[120px]">
                <span className="text-[10px] text-slate-500 truncate block text-center group-hover:text-slate-300 transition-colors">
                    {message as string}
                </span>
            </div>

            {/* Tag labels — below message */}
            {tags.length > 0 && (
                <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex gap-1 whitespace-nowrap">
                    {tags.map((t: string) => (
                        <span
                            key={t}
                            className="text-[8px] font-bold px-1.5 py-px rounded bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm shadow-teal-500/20"
                        >
                            🏷 {t}
                        </span>
                    ))}
                </div>
            )}

            {/* Connection handles */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-2 !h-2 !bg-slate-600 !border-slate-500 !-left-1"
            />
            <Handle
                type="source"
                position={Position.Right}
                className="!w-2 !h-2 !bg-slate-600 !border-slate-500 !-right-1"
            />
        </div>
    );
}

export default memo(CustomCommitNode);
