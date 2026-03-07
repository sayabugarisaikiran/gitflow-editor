import { useGitStore } from '../store/useGitStore';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ContextMenuState {
    x: number;
    y: number;
    commitHash: string;
    commitMessage: string;
    branches: string[]; // branches at this commit
    isHead: boolean;
}

interface NodeContextMenuProps {
    menu: ContextMenuState;
    onClose: () => void;
}

// ─── Menu Item Component ────────────────────────────────────────────────────

function MenuItem({
    icon,
    label,
    shortcut,
    onClick,
    variant = 'default',
    disabled = false,
}: {
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    onClick: () => void;
    variant?: 'default' | 'danger';
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs
        transition-colors rounded-md
        ${disabled
                    ? 'text-slate-600 cursor-not-allowed'
                    : variant === 'danger'
                        ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }
      `}
        >
            <span className="w-4 h-4 flex items-center justify-center shrink-0 opacity-70">
                {icon}
            </span>
            <span className="flex-1">{label}</span>
            {shortcut && (
                <span className="text-[9px] text-slate-600 font-mono">{shortcut}</span>
            )}
        </button>
    );
}

// ─── Separator ──────────────────────────────────────────────────────────────

function Separator() {
    return <div className="my-1 border-t border-slate-700/40" />;
}

// ─── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
    return (
        <div className="px-3 pt-2 pb-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                {title}
            </span>
        </div>
    );
}

// ─── Icons ──────────────────────────────────────────────────────────────────

const Icons = {
    checkout: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    branch: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    reset: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
        </svg>
    ),
    merge: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
    ),
    delete: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    ),
    cherryPick: (
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function NodeContextMenu({ menu, onClose }: NodeContextMenuProps) {
    const { checkout, createBranchAt, merge, rebase, resetHead, deleteBranch, cherryPick, createTag, currentBranch } = useGitStore();

    const handleCheckout = () => {
        if (menu.branches.length > 0) {
            checkout(menu.branches[0]);
        } else {
            checkout(menu.commitHash);
        }
        onClose();
    };

    const handleCreateBranch = () => {
        const name = prompt('Enter new branch name:');
        if (name && name.trim()) {
            createBranchAt(name.trim(), menu.commitHash);
        }
        onClose();
    };

    const handleResetHead = () => {
        resetHead(menu.commitHash);
        onClose();
    };

    const handleMerge = (branchName: string) => {
        merge(branchName);
        onClose();
    };

    const handleDeleteBranch = (branchName: string) => {
        deleteBranch(branchName);
        onClose();
    };

    const handleCherryPick = () => {
        cherryPick(menu.commitHash);
        onClose();
    };

    const handleTag = () => {
        const name = prompt('Enter tag name:');
        if (name && name.trim()) {
            createTag(name.trim(), menu.commitHash);
        }
        onClose();
    };

    const handleRebase = (branchName: string) => {
        rebase(branchName);
        onClose();
    };

    // Branches at this commit that are NOT the current branch
    const otherBranches = menu.branches.filter((b) => b !== currentBranch);

    return (
        <div
            className="fixed inset-0 z-50"
            onClick={onClose}
            onContextMenu={(e) => { e.preventDefault(); onClose(); }}
        >
            <div
                className="absolute bg-[#151b28] border border-slate-700/60 rounded-xl shadow-2xl shadow-black/60 backdrop-blur-sm w-60 py-1.5 animate-context-menu"
                style={{ left: menu.x, top: menu.y }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-slate-700/30">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full shrink-0 ${menu.isHead ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-slate-600 to-slate-700'}`} />
                        <span className="text-[11px] font-mono text-slate-300 truncate">
                            {menu.commitHash.slice(0, 8)}
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 ml-5">
                        {menu.commitMessage}
                    </p>
                </div>

                {/* Commit Actions */}
                <SectionHeader title="Commit" />
                <div className="px-1.5">
                    <MenuItem
                        icon={Icons.checkout}
                        label="Checkout this commit"
                        onClick={handleCheckout}
                        disabled={menu.isHead}
                    />
                    <MenuItem
                        icon={Icons.branch}
                        label="Create branch here"
                        onClick={handleCreateBranch}
                    />
                    <MenuItem
                        icon={Icons.reset}
                        label="Reset HEAD to here"
                        onClick={handleResetHead}
                        disabled={menu.isHead}
                    />
                    <MenuItem
                        icon={Icons.cherryPick}
                        label="Cherry-pick this commit"
                        onClick={handleCherryPick}
                        disabled={menu.isHead}
                    />
                    <MenuItem
                        icon={<span className="text-[10px]">🏷️</span>}
                        label="Tag this commit"
                        onClick={handleTag}
                    />
                </div>

                {/* Branch Actions — only show if there are other branches at this commit */}
                {otherBranches.length > 0 && (
                    <>
                        <Separator />
                        <SectionHeader title="Branches" />
                        <div className="px-1.5">
                            {otherBranches.map((branch) => (
                                <div key={branch}>
                                    <MenuItem
                                        icon={Icons.merge}
                                        label={`Merge '${branch}' into ${currentBranch}`}
                                        onClick={() => handleMerge(branch)}
                                    />
                                    <MenuItem
                                        icon={Icons.reset}
                                        label={`Rebase onto '${branch}'`}
                                        onClick={() => handleRebase(branch)}
                                    />
                                    <MenuItem
                                        icon={Icons.delete}
                                        label={`Delete '${branch}'`}
                                        onClick={() => handleDeleteBranch(branch)}
                                        variant="danger"
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Merge option when clicking a branch that isn't the current one */}
                {otherBranches.length === 0 && menu.branches.length > 0 && menu.branches.includes(currentBranch) && (
                    <>
                        <Separator />
                        <div className="px-3 py-1.5">
                            <span className="text-[9px] text-slate-600 italic">
                                This is the current branch
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
