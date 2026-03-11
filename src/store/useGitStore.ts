import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FileStatus = 'unmodified' | 'modified' | 'staged' | 'conflicted';

export interface GitFile {
    name: string;
    status: FileStatus;
}

export interface Commit {
    hash: string;
    message: string;
    parentHashes: string[];
    timestamp: number;
    branch: string;
    filesChanged?: string[];
}

export interface TerminalLine {
    type: 'command' | 'output' | 'error' | 'info';
    text: string;
    timestamp: number;
}

export interface BisectState {
    goodHash: string;
    badHash: string;
    tested: Record<string, 'good' | 'bad'>;
    currentTest: string | null;
    foundHash: string | null;
}

export interface GitState {
    // Repository state
    commits: Commit[];
    branches: Record<string, string>; // branch name → commit hash
    tags: Record<string, string>; // tag name → commit hash
    remoteBranches: Record<string, string>; // e.g. 'origin/main' → commit hash
    simulatedRemote: Record<string, string>; // The "server's" branches
    HEAD: string;
    currentBranch: string;
    files: GitFile[];
    terminalHistory: TerminalLine[];
    stashedFiles: GitFile[];
    selectedCommit: string | null;
    activeScenario: string | null;
    
    // Merge Conflict State
    conflictState: boolean;
    mergingTarget: string | null;

    // Bisect State
    bisectState: BisectState | null;

    // Actions
    fetch: () => void;
    pull: () => void;
    push: () => void;
    resolveConflict: (fileName: string, resolution: 'current' | 'incoming' | 'both') => void;
    stageFile: (fileName: string) => void;
    unstageFile: (fileName: string) => void;
    commit: (message: string) => void;
    checkout: (branchOrHash: string) => void;
    createBranch: (name: string) => void;
    createBranchAt: (name: string, commitHash: string) => void;
    merge: (sourceBranch: string) => void;
    rebase: (targetBranch: string) => void;
    reset: (mode: '--soft' | '--mixed' | '--hard', commitHash: string) => void;
    revert: (commitHash: string) => void;
    deleteBranch: (name: string) => void;
    stash: () => void;
    stashPop: () => void;
    cherryPick: (commitHash: string) => void;
    createTag: (name: string, commitHash?: string) => void;
    deleteTag: (name: string) => void;
    selectCommit: (hash: string | null) => void;
    modifyFile: (fileName: string) => void;
    addFile: (fileName: string) => void;
    loadScenario: (scenario: ScenarioState) => void;
    resetState: () => void;
    bisectStart: (goodHash: string, badHash: string) => void;
    bisectMark: (hash: string, verdict: 'good' | 'bad') => void;
    bisectReset: () => void;
}

// ─── Scenario Types ──────────────────────────────────────────────────────────

export interface ScenarioState {
    id: string;
    name: string;
    commits: Commit[];
    branches: Record<string, string>;
    tags: Record<string, string>;
    remoteBranches?: Record<string, string>;
    simulatedRemote?: Record<string, string>;
    HEAD: string;
    currentBranch: string;
    files: GitFile[];
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function generateHash(): string {
    return Math.random().toString(16).substring(2, 10);
}

function createTerminalLine(
    type: TerminalLine['type'],
    text: string
): TerminalLine {
    return { type, text, timestamp: Date.now() };
}

// ─── Initial state ──────────────────────────────────────────────────────────

const initialCommitHash = generateHash();

const initialState = {
    commits: [
        {
            hash: initialCommitHash,
            message: 'Initial commit',
            parentHashes: [],
            timestamp: Date.now(),
            branch: 'main',
        },
    ] as Commit[],
    branches: { main: initialCommitHash } as Record<string, string>,
    HEAD: initialCommitHash,
    currentBranch: 'main',
    files: [
        { name: 'index.html', status: 'unmodified' as FileStatus },
        { name: 'style.css', status: 'modified' as FileStatus },
        { name: 'app.js', status: 'modified' as FileStatus },
        { name: 'README.md', status: 'unmodified' as FileStatus },
    ] as GitFile[],
    terminalHistory: [
        createTerminalLine('info', 'Welcome to GitFlow Editor 🚀'),
        createTerminalLine('info', 'Initialized repository with branch "main"'),
        createTerminalLine('output', `[main (root-commit) ${initialCommitHash}] Initial commit`),
    ] as TerminalLine[],
    stashedFiles: [] as GitFile[],
    selectedCommit: null as string | null,
    tags: {} as Record<string, string>,
    remoteBranches: { 'origin/main': initialCommitHash } as Record<string, string>,
    simulatedRemote: { main: initialCommitHash } as Record<string, string>, // Our "remote server" state
    activeScenario: null as string | null,
    conflictState: false,
    mergingTarget: null as string | null,
    bisectState: null as BisectState | null,
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useGitStore = create<GitState>((set, get) => ({
    ...initialState,

    stageFile: (fileName: string) => {
        set((state) => ({
            files: state.files.map((f) =>
                f.name === fileName && (f.status === 'modified' || f.status === 'conflicted')
                    ? { ...f, status: 'staged' as FileStatus }
                    : f
            ),
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git add ${fileName}`),
                createTerminalLine('output', `  staged: ${fileName}`),
            ],
        }));
    },

    unstageFile: (fileName: string) => {
        set((state) => ({
            files: state.files.map((f) =>
                f.name === fileName && f.status === 'staged'
                    ? { ...f, status: 'modified' as FileStatus }
                    : f
            ),
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git reset HEAD ${fileName}`),
                createTerminalLine('output', `  unstaged: ${fileName}`),
            ],
        }));
    },

    commit: (message: string) => {
        const state = get();
        const stagedFiles = state.files.filter((f) => f.status === 'staged');
        const conflictedFiles = state.files.filter((f) => f.status === 'conflicted');

        if (state.conflictState && conflictedFiles.length > 0) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git commit -m "${message}"`),
                    createTerminalLine('error', 'error: Committing is not possible because you have unmerged files.'),
                    createTerminalLine('info', 'hint: Fix them up in the work tree, and then use \'git add/rm <file>\''),
                    createTerminalLine('info', 'hint: as appropriate to mark resolution and make a commit.'),
                ],
            });
            return;
        }

        if (stagedFiles.length === 0) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git commit -m "${message}"`),
                    createTerminalLine('error', 'nothing to commit (no staged files)'),
                ],
            });
            return;
        }

        const newHash = generateHash();
        const isMergeCommit = state.conflictState && state.mergingTarget;
        const parentHashes = isMergeCommit ? [state.HEAD, state.branches[state.mergingTarget!]] : [state.HEAD];

        const newCommit: Commit = {
            hash: newHash,
            message,
            parentHashes,
            timestamp: Date.now(),
            branch: state.currentBranch,
            filesChanged: stagedFiles.map(f => f.name),
        };

        set({
            commits: [...state.commits, newCommit],
            HEAD: newHash,
            branches: {
                ...state.branches,
                [state.currentBranch]: newHash,
            },
            conflictState: false,     // Reset conflict state on successful commit
            mergingTarget: null,      // Reset merge target
            files: state.files.map((f) =>
                f.status === 'staged' ? { ...f, status: 'unmodified' as FileStatus } : f
            ),
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git commit -m "${message}"`),
                createTerminalLine(
                    'output',
                    `[${state.currentBranch} ${newHash}] ${message}`
                ),
                createTerminalLine(
                    'output',
                    ` ${stagedFiles.length} file(s) changed`
                ),
            ],
        });
    },

    checkout: (branchOrHash: string) => {
        const state = get();

        // Check if it's a branch name
        if (state.branches[branchOrHash]) {
            set({
                HEAD: state.branches[branchOrHash],
                currentBranch: branchOrHash,
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git checkout ${branchOrHash}`),
                    createTerminalLine(
                        'output',
                        `Switched to branch '${branchOrHash}'`
                    ),
                ],
            });
            return;
        }

        // Check if it's a commit hash
        const targetCommit = state.commits.find((c) => c.hash === branchOrHash);
        if (targetCommit) {
            set({
                HEAD: branchOrHash,
                currentBranch: 'HEAD (detached)',
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git checkout ${branchOrHash}`),
                    createTerminalLine(
                        'output',
                        `HEAD is now at ${branchOrHash}...`
                    ),
                    createTerminalLine(
                        'info',
                        `You are in 'detached HEAD' state.`
                    ),
                ],
            });
            return;
        }

        set({
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git checkout ${branchOrHash}`),
                createTerminalLine(
                    'error',
                    `error: pathspec '${branchOrHash}' did not match any branch or commit`
                ),
            ],
        });
    },

    fetch: () => {
        const state = get();
        
        // Sync simulatedRemote to remoteBranches
        const newRemoteBranches: Record<string, string> = { ...state.remoteBranches };
        let fetchedAny = false;
        
        Object.entries(state.simulatedRemote).forEach(([branch, hash]) => {
            const remoteRef = `origin/${branch}`;
            if (newRemoteBranches[remoteRef] !== hash) {
                newRemoteBranches[remoteRef] = hash;
                fetchedAny = true;
            }
        });

        set({
            remoteBranches: newRemoteBranches,
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', 'git fetch'),
                ...(fetchedAny ? [createTerminalLine('output', 'From origin'), createTerminalLine('output', '   Fetched remote branches.')] : []),
            ]
        });
    },

    push: () => {
        const state = get();
        const currentRef = state.branches[state.currentBranch];
        
        if (!currentRef) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', 'git push'),
                    createTerminalLine('error', `fatal: The current branch ${state.currentBranch} has no upstream branch.`)
                ]
            });
            return;
        }

        // Simulating push to 'simulatedRemote' and updating our remote tracking branch
        const newSimulatedRemote = { ...state.simulatedRemote, [state.currentBranch]: currentRef };
        const remoteRef = `origin/${state.currentBranch}`;
        const newRemoteBranches = { ...state.remoteBranches, [remoteRef]: currentRef };

        set({
            simulatedRemote: newSimulatedRemote,
            remoteBranches: newRemoteBranches,
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', 'git push'),
                createTerminalLine('output', `To origin`),
                createTerminalLine('output', `   ${state.currentBranch} -> ${state.currentBranch}`),
            ]
        });
    },

    pull: () => {
        const state = get();
        
        // 1. Fetch
        const newRemoteBranches: Record<string, string> = { ...state.remoteBranches };
        Object.entries(state.simulatedRemote).forEach(([branch, hash]) => {
            const remoteRef = `origin/${branch}`;
            newRemoteBranches[remoteRef] = hash;
        });

        const remoteRefForCurrent = `origin/${state.currentBranch}`;
        const targetHashToMerge = newRemoteBranches[remoteRefForCurrent];

        if (!targetHashToMerge) {
            set({
                remoteBranches: newRemoteBranches,
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', 'git pull'),
                    createTerminalLine('error', `There is no tracking information for the current branch.`)
                ]
            });
            return;
        }

        // Apply fetch first
        set({
            remoteBranches: newRemoteBranches,
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', 'git pull'),
                createTerminalLine('info', 'Fetching from origin...'),
            ]
        });

        // 2. Merge (Using the fetched remote tracking branch)
        // We will call the standard `merge` function but pass the remote branch ref name.
        // Wait, `merge` expects a branch name to exist in `state.branches`.
        // Let's modify `merge` or handle it here. To keep things simple, we can temporarily alias it or let `merge` accept a hash or remote branch in the future.
        // For Phase 6 requirements, we need `merge` to handle conflicts correctly. We'll update `merge` next to accept remote branches as well.
        get().merge(remoteRefForCurrent);
    },

    resolveConflict: (fileName: string, resolution: 'current' | 'incoming' | 'both') => {
        const state = get();
        // Just mock changing the file state to staged
        set({
            files: state.files.map(f => 
                f.name === fileName ? { ...f, status: 'staged' as FileStatus } : f
            ),
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('info', `Resolved conflict in ${fileName} using ${resolution} changes.`),
            ]
        });
    },

    createBranch: (name: string) => {
        const state = get();

        if (state.branches[name]) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git branch ${name}`),
                    createTerminalLine(
                        'error',
                        `fatal: a branch named '${name}' already exists`
                    ),
                ],
            });
            return;
        }

        set({
            branches: { ...state.branches, [name]: state.HEAD },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git branch ${name}`),
                createTerminalLine('output', `Created branch '${name}' at ${state.HEAD}`),
            ],
        });
    },

    createBranchAt: (name: string, commitHash: string) => {
        const state = get();

        if (state.branches[name]) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git branch ${name} ${commitHash}`),
                    createTerminalLine(
                        'error',
                        `fatal: a branch named '${name}' already exists`
                    ),
                ],
            });
            return;
        }

        const targetCommit = state.commits.find((c) => c.hash === commitHash);
        if (!targetCommit) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('error', `fatal: not a valid commit: ${commitHash}`),
                ],
            });
            return;
        }

        set({
            branches: { ...state.branches, [name]: commitHash },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git branch ${name} ${commitHash}`),
                createTerminalLine('output', `Created branch '${name}' at ${commitHash}`),
            ],
        });
    },

    merge: (sourceBranch: string) => {
        const state = get();

        // Validate source branch exists (local or remote)
        const sourceHash = state.branches[sourceBranch] || state.remoteBranches[sourceBranch];
        if (!sourceHash) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git merge ${sourceBranch}`),
                    createTerminalLine('error', `merge: ${sourceBranch} - not something we can merge`),
                ],
            });
            return;
        }

        // Cannot merge into detached HEAD
        if (state.currentBranch === 'HEAD (detached)') {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git merge ${sourceBranch}`),
                    createTerminalLine('error', 'Cannot merge in detached HEAD state. Checkout a branch first.'),
                ],
            });
            return;
        }

        // Already merged? (source points to same commit or is ancestor)
        if (sourceHash === state.HEAD) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git merge ${sourceBranch}`),
                    createTerminalLine('output', `Already up to date.`),
                ],
            });
            return;
        }

        if (state.conflictState) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git merge ${sourceBranch}`),
                    createTerminalLine('error', 'error: Merging is not possible because you have unmerged files.'),
                ],
            });
            return;
        }

        // --- Conflict Detection Engine ---
        // Find common ancestor
        const headAncestors = new Set<string>();
        const collectAncestors = (hash: string) => {
            if (headAncestors.has(hash)) return;
            headAncestors.add(hash);
            const commit = state.commits.find((c) => c.hash === hash);
            if (commit) commit.parentHashes.forEach(collectAncestors);
        };
        collectAncestors(state.HEAD);

        // Walk back source branch to find first shared commit
        let commonAncestor: string | null = null;
        const sourcePath: string[] = [];
        
        // Simple BFS/DFS to find ancestor (assuming simplified graph)
        const queue = [sourceHash];
        while (queue.length > 0) {
            const curr = queue.shift()!;
            if (headAncestors.has(curr)) {
                commonAncestor = curr;
                break;
            }
            sourcePath.push(curr);
            const commit = state.commits.find(c => c.hash === curr);
            if (commit) queue.push(...commit.parentHashes);
        }

        if (commonAncestor === sourceHash) {
            // Fast-forward (source is ancestor, already up to date handled above, but just in case)
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git merge ${sourceBranch}`),
                    createTerminalLine('output', `Already up to date.`),
                ],
            });
            return;
        }

        // Collect changed files on HEAD vs Common Ancestor
        const headFilesChanged = new Set<string>();
        for (const commit of state.commits) {
            if (headAncestors.has(commit.hash) && commit.hash !== commonAncestor) {
                commit.filesChanged?.forEach(f => headFilesChanged.add(f));
            }
        }

        // Collect changed files on SOURCE vs Common Ancestor
        const sourceFilesChanged = new Set<string>();
        for (const hash of sourcePath) {
            const commit = state.commits.find(c => c.hash === hash);
            commit?.filesChanged?.forEach(f => sourceFilesChanged.add(f));
        }

        // Find overlaps
        const conflicts: string[] = [];
        sourceFilesChanged.forEach(f => {
            if (headFilesChanged.has(f)) conflicts.push(f);
        });

        if (conflicts.length > 0) {
            // Trigger merge conflict
            set({
                conflictState: true,
                mergingTarget: sourceBranch,
                files: state.files.map(f => 
                    conflicts.includes(f.name) ? { ...f, status: 'conflicted' as FileStatus } : f
                ),
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git merge ${sourceBranch}`),
                    createTerminalLine('output', `Auto-merging ${conflicts.join(', ')}`),
                    createTerminalLine('error', `CONFLICT (content): Merge conflict in ${conflicts.join(', ')}`),
                    createTerminalLine('error', `Automatic merge failed; fix conflicts and then commit the result.`),
                ],
            });
            return;
        }

        // No conflicts - create merge commit directly
        const mergeHash = generateHash();
        const mergeCommit: Commit = {
            hash: mergeHash,
            message: `Merge branch '${sourceBranch}' into ${state.currentBranch}`,
            parentHashes: [state.HEAD, sourceHash],
            timestamp: Date.now(),
            branch: state.currentBranch,
            filesChanged: [], // A pure merge commit usually brings in the source's changes, but practically it changes nothing new directly
        };

        set({
            commits: [...state.commits, mergeCommit],
            HEAD: mergeHash,
            branches: {
                ...state.branches,
                [state.currentBranch]: mergeHash,
            },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git merge ${sourceBranch}`),
                createTerminalLine('output', `Merge made by the 'recursive' strategy.`),
                createTerminalLine('output', `[${state.currentBranch} ${mergeHash}] Merge branch '${sourceBranch}' into ${state.currentBranch}`),
            ],
        });
    },

    reset: (mode: '--soft' | '--mixed' | '--hard', commitHash: string) => {
        const state = get();

        const targetCommit = state.commits.find((c) => c.hash === commitHash);
        if (!targetCommit) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git reset ${mode} ${commitHash}`),
                    createTerminalLine('error', `fatal: not a valid commit: ${commitHash}`),
                ],
            });
            return;
        }

        const updatedBranches = { ...state.branches };
        if (state.currentBranch !== 'HEAD (detached)') {
            updatedBranches[state.currentBranch] = commitHash;
        }

        let newFiles = state.files;
        if (mode === '--hard') {
            newFiles = state.files.map((f) => ({ ...f, status: 'unmodified' as FileStatus }));
        } else if (mode === '--mixed') {
            newFiles = state.files.map((f) => 
                f.status === 'staged' ? { ...f, status: 'modified' as FileStatus } : f
            );
        }

        set({
            HEAD: commitHash,
            branches: updatedBranches,
            files: newFiles,
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git reset ${mode} ${commitHash}`),
                ...(mode !== '--soft' ? [createTerminalLine('output', `Unstaged changes after reset:`)] : []),
                createTerminalLine('output', `HEAD is now at ${commitHash} ${targetCommit.message}`),
            ],
        });
    },

    revert: (commitHash: string) => {
        const state = get();
        const targetCommit = state.commits.find(c => c.hash === commitHash);
        
        if (!targetCommit) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git revert ${commitHash}`),
                    createTerminalLine('error', `fatal: bad object ${commitHash}`),
                ]
            });
            return;
        }

        if (state.currentBranch === 'HEAD (detached)') {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git revert ${commitHash}`),
                    createTerminalLine('error', 'error: cannot revert in detached HEAD state.'),
                ]
            });
            return;
        }

        const newHash = generateHash();
        const newCommit: Commit = {
            hash: newHash,
            message: `Revert "${targetCommit.message}"`,
            parentHashes: [state.HEAD],
            timestamp: Date.now(),
            branch: state.currentBranch,
            filesChanged: targetCommit.filesChanged
        };

        set({
            commits: [...state.commits, newCommit],
            HEAD: newHash,
            branches: {
                ...state.branches,
                [state.currentBranch]: newHash
            },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git revert ${commitHash}`),
                createTerminalLine('output', `[${state.currentBranch} ${newHash}] Revert "${targetCommit.message}"`)
            ]
        });
    },

    deleteBranch: (name: string) => {
        const state = get();

        if (!state.branches[name]) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git branch -d ${name}`),
                    createTerminalLine('error', `error: branch '${name}' not found`),
                ],
            });
            return;
        }

        if (name === state.currentBranch) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git branch -d ${name}`),
                    createTerminalLine('error', `error: cannot delete branch '${name}' checked out`),
                ],
            });
            return;
        }

        if (name === 'main' || name === 'master') {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git branch -d ${name}`),
                    createTerminalLine('error', `error: refusing to delete protected branch '${name}'`),
                ],
            });
            return;
        }

        const { [name]: _, ...remainingBranches } = state.branches;
        set({
            branches: remainingBranches,
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git branch -d ${name}`),
                createTerminalLine('output', `Deleted branch ${name}.`),
            ],
        });
    },

    modifyFile: (fileName: string) => {
        const state = get();
        const exists = state.files.find((f) => f.name === fileName);

        if (exists) {
            set({
                files: state.files.map((f) =>
                    f.name === fileName
                        ? { ...f, status: 'modified' as FileStatus }
                        : f
                ),
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('info', `~ modified: ${fileName}`),
                ],
            });
        }
    },

    addFile: (fileName: string) => {
        const state = get();
        const exists = state.files.find((f) => f.name === fileName);

        if (!exists) {
            set({
                files: [...state.files, { name: fileName, status: 'modified' as FileStatus }],
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('info', `+ new file: ${fileName}`),
                ],
            });
        }
    },

    stash: () => {
        const state = get();
        const dirtyFiles = state.files.filter(
            (f) => f.status === 'modified' || f.status === 'staged'
        );

        if (dirtyFiles.length === 0) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', 'git stash'),
                    createTerminalLine('output', 'No local changes to save'),
                ],
            });
            return;
        }

        set({
            stashedFiles: dirtyFiles.map((f) => ({ ...f })),
            files: state.files.map((f) =>
                f.status !== 'unmodified'
                    ? { ...f, status: 'unmodified' as FileStatus }
                    : f
            ),
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', 'git stash'),
                createTerminalLine(
                    'output',
                    `Saved working directory and index state WIP on ${state.currentBranch}: ${state.HEAD}`
                ),
                createTerminalLine(
                    'output',
                    ` ${dirtyFiles.length} file(s) stashed`
                ),
            ],
        });
    },

    stashPop: () => {
        const state = get();

        if (state.stashedFiles.length === 0) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', 'git stash pop'),
                    createTerminalLine('error', 'No stash entries found.'),
                ],
            });
            return;
        }

        // Restore stashed file statuses
        const restoredFileNames = new Set(state.stashedFiles.map((f) => f.name));
        set({
            files: state.files.map((f) => {
                if (restoredFileNames.has(f.name)) {
                    const stashedFile = state.stashedFiles.find((sf) => sf.name === f.name);
                    return stashedFile ? { ...stashedFile } : f;
                }
                return f;
            }),
            stashedFiles: [],
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', 'git stash pop'),
                createTerminalLine(
                    'output',
                    `Restored ${state.stashedFiles.length} file(s) from stash`
                ),
                createTerminalLine('output', 'Dropped refs/stash@{0}'),
            ],
        });
    },

    cherryPick: (commitHash: string) => {
        const state = get();

        const targetCommit = state.commits.find((c) => c.hash === commitHash);
        if (!targetCommit) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git cherry-pick ${commitHash}`),
                    createTerminalLine('error', `fatal: bad object ${commitHash}`),
                ],
            });
            return;
        }

        if (commitHash === state.HEAD) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git cherry-pick ${commitHash}`),
                    createTerminalLine('output', 'The previous cherry-pick is now empty'),
                ],
            });
            return;
        }

        if (state.currentBranch === 'HEAD (detached)') {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git cherry-pick ${commitHash}`),
                    createTerminalLine('error', 'Cannot cherry-pick in detached HEAD state.'),
                ],
            });
            return;
        }

        const newHash = generateHash();
        const newCommit: Commit = {
            hash: newHash,
            message: targetCommit.message,
            parentHashes: [state.HEAD],
            timestamp: Date.now(),
            branch: state.currentBranch,
        };

        set({
            commits: [...state.commits, newCommit],
            HEAD: newHash,
            branches: {
                ...state.branches,
                [state.currentBranch]: newHash,
            },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git cherry-pick ${commitHash}`),
                createTerminalLine(
                    'output',
                    `[${state.currentBranch} ${newHash}] ${targetCommit.message}`
                ),
            ],
        });
    },

    selectCommit: (hash: string | null) => {
        set({ selectedCommit: hash });
    },

    rebase: (targetBranch: string) => {
        const state = get();

        if (state.currentBranch === 'HEAD (detached)') {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git rebase ${targetBranch}`),
                    createTerminalLine('error', 'Cannot rebase in detached HEAD state.'),
                ],
            });
            return;
        }

        const targetHash = state.branches[targetBranch];
        if (!targetHash) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git rebase ${targetBranch}`),
                    createTerminalLine('error', `fatal: invalid upstream '${targetBranch}'`),
                ],
            });
            return;
        }

        if (targetBranch === state.currentBranch) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git rebase ${targetBranch}`),
                    createTerminalLine('output', 'Current branch is up to date.'),
                ],
            });
            return;
        }

        // Find commits unique to current branch (not on target)
        const targetAncestors = new Set<string>();
        const collectAncestors = (hash: string) => {
            if (targetAncestors.has(hash)) return;
            targetAncestors.add(hash);
            const commit = state.commits.find((c) => c.hash === hash);
            if (commit) commit.parentHashes.forEach(collectAncestors);
        };
        collectAncestors(targetHash);

        // Get current branch commits (in order) not in target
        const branchCommits: Commit[] = [];
        let cursor = state.HEAD;
        while (cursor && !targetAncestors.has(cursor)) {
            const commit = state.commits.find((c) => c.hash === cursor);
            if (!commit) break;
            branchCommits.unshift(commit); // oldest first
            cursor = commit.parentHashes[0] || '';
        }

        if (branchCommits.length === 0) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git rebase ${targetBranch}`),
                    createTerminalLine('output', 'Current branch is up to date.'),
                ],
            });
            return;
        }

        // Replay commits with new hashes onto target
        let newParent = targetHash;
        const newCommits: Commit[] = [];
        for (const commit of branchCommits) {
            const newHash = generateHash();
            newCommits.push({
                hash: newHash,
                message: commit.message,
                parentHashes: [newParent],
                timestamp: Date.now(),
                branch: state.currentBranch,
                filesChanged: commit.filesChanged,
            });
            newParent = newHash;
        }

        const newHead = newCommits[newCommits.length - 1].hash;

        set({
            commits: [
                ...state.commits.filter(
                    (c) => !branchCommits.some((bc) => bc.hash === c.hash)
                ),
                ...newCommits,
            ],
            HEAD: newHead,
            branches: {
                ...state.branches,
                [state.currentBranch]: newHead,
            },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git rebase ${targetBranch}`),
                createTerminalLine(
                    'output',
                    `Successfully rebased ${branchCommits.length} commit(s) onto '${targetBranch}'`
                ),
            ],
        });
    },

    createTag: (name: string, commitHash?: string) => {
        const state = get();
        const hash = commitHash || state.HEAD;

        if (state.tags[name]) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git tag ${name}${commitHash ? ' ' + commitHash : ''}`),
                    createTerminalLine('error', `fatal: tag '${name}' already exists`),
                ],
            });
            return;
        }

        set({
            tags: { ...state.tags, [name]: hash },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git tag ${name}${commitHash ? ' ' + commitHash : ''}`),
                createTerminalLine('output', `Created tag '${name}' at ${hash}`),
            ],
        });
    },

    deleteTag: (name: string) => {
        const state = get();

        if (!state.tags[name]) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git tag -d ${name}`),
                    createTerminalLine('error', `error: tag '${name}' not found.`),
                ],
            });
            return;
        }

        const newTags = { ...state.tags };
        delete newTags[name];

        set({
            tags: newTags,
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git tag -d ${name}`),
                createTerminalLine('output', `Deleted tag '${name}'`),
            ],
        });
    },

    loadScenario: (scenario) => {
        set({
            commits: scenario.commits,
            branches: scenario.branches,
            tags: scenario.tags,
            remoteBranches: scenario.remoteBranches || { 'origin/main': scenario.HEAD },
            simulatedRemote: scenario.simulatedRemote || { main: scenario.HEAD },
            HEAD: scenario.HEAD,
            currentBranch: scenario.currentBranch,
            files: scenario.files,
            stashedFiles: [],
            selectedCommit: null,
            activeScenario: scenario.id,
            conflictState: false,
            mergingTarget: null,
            terminalHistory: [
                createTerminalLine('info', `🎯 Scenario loaded: ${scenario.name}`),
                createTerminalLine('info', `On branch ${scenario.currentBranch}`),
            ],
        });
    },

    resetState: () => {
        const freshHash = generateHash();
        set({
            commits: [
                {
                    hash: freshHash,
                    message: 'Initial commit',
                    parentHashes: [],
                    timestamp: Date.now(),
                    branch: 'main',
                },
            ],
            branches: { main: freshHash },
            tags: {},
            remoteBranches: { 'origin/main': freshHash },
            simulatedRemote: { main: freshHash },
            HEAD: freshHash,
            currentBranch: 'main',
            files: [
                { name: 'index.html', status: 'unmodified' },
                { name: 'style.css', status: 'modified' },
                { name: 'app.js', status: 'modified' },
                { name: 'README.md', status: 'unmodified' },
            ],
            terminalHistory: [
                createTerminalLine('info', 'Repository reset 🔄'),
                createTerminalLine('info', 'Initialized repository with branch "main"'),
                createTerminalLine('output', `[main (root-commit) ${freshHash}] Initial commit`),
            ],
            stashedFiles: [],
            selectedCommit: null,
            activeScenario: null,
            conflictState: false,
            mergingTarget: null,
            bisectState: null,
        });
    },

    bisectStart: (goodHash: string, badHash: string) => {
        const { commits } = get();

        // Build ancestor chain from badHash (oldest to newest along the path)
        function getAncestors(hash: string): string[] {
            const visited = new Set<string>();
            const order: string[] = [];
            const stack = [hash];
            while (stack.length) {
                const h = stack.pop()!;
                if (visited.has(h)) continue;
                visited.add(h);
                order.push(h);
                const commit = commits.find((c) => c.hash === h);
                if (commit) commit.parentHashes.forEach((p) => stack.push(p));
            }
            return order.reverse();
        }

        const ancestors = getAncestors(badHash);
        const between = ancestors.filter((h) => h !== goodHash && h !== badHash);
        const midIdx = Math.floor(between.length / 2);
        const currentTest = between[midIdx] ?? badHash;

        set({
            bisectState: {
                goodHash,
                badHash,
                tested: { [goodHash]: 'good', [badHash]: 'bad' },
                currentTest,
                foundHash: between.length === 0 ? badHash : null,
            },
            terminalHistory: [
                ...get().terminalHistory,
                createTerminalLine('command', `git bisect start`),
                createTerminalLine('output', `Bisecting: ${between.length} commits left to test`),
                createTerminalLine('info', `Testing commit: ${currentTest.slice(0, 7)}`),
            ],
        });
    },

    bisectMark: (hash: string, verdict: 'good' | 'bad') => {
        const { bisectState, commits } = get();
        if (!bisectState) return;

        const newTested = { ...bisectState.tested, [hash]: verdict };

        // Find the latest 'good' and earliest 'bad'
        const latestGood = verdict === 'good' ? hash : bisectState.goodHash;
        const earliestBad = verdict === 'bad' ? hash : bisectState.badHash;

        // Get commits topologically between latestGood and earliestBad
        function getAncestors(startHash: string): string[] {
            const visited = new Set<string>();
            const order: string[] = [];
            const stack = [startHash];
            while (stack.length) {
                const h = stack.pop()!;
                if (visited.has(h)) continue;
                visited.add(h);
                order.push(h);
                const commit = commits.find((c) => c.hash === h);
                if (commit) commit.parentHashes.forEach((p) => stack.push(p));
            }
            return order.reverse();
        }

        const ancestors = getAncestors(earliestBad);
        const untested = ancestors.filter(
            (h) => !newTested[h] && h !== latestGood && h !== earliestBad
        );

        const isFound = untested.length === 0;
        const midIdx = Math.floor(untested.length / 2);
        const nextTest = isFound ? null : untested[midIdx];

        set({
            bisectState: {
                goodHash: latestGood,
                badHash: earliestBad,
                tested: newTested,
                currentTest: nextTest,
                foundHash: isFound ? earliestBad : null,
            },
            terminalHistory: [
                ...get().terminalHistory,
                createTerminalLine('command', `git bisect ${verdict} ${hash.slice(0, 7)}`),
                isFound
                    ? createTerminalLine('info', `🎯 Found! First bad commit: ${earliestBad.slice(0, 7)}`)
                    : createTerminalLine('output', `${untested.length} commits left — testing: ${nextTest?.slice(0, 7) ?? '?'}`),
            ],
        });
    },

    bisectReset: () => {
        set({
            bisectState: null,
            terminalHistory: [
                ...get().terminalHistory,
                createTerminalLine('command', 'git bisect reset'),
                createTerminalLine('output', 'We are back to the original HEAD.'),
            ],
        });
    },
}));

