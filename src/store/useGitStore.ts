import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export type FileStatus = 'unmodified' | 'modified' | 'staged';

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
}

export interface TerminalLine {
    type: 'command' | 'output' | 'error' | 'info';
    text: string;
    timestamp: number;
}

export interface GitState {
    // Repository state
    commits: Commit[];
    branches: Record<string, string>; // branch name → commit hash
    tags: Record<string, string>; // tag name → commit hash
    HEAD: string;
    currentBranch: string;
    files: GitFile[];
    terminalHistory: TerminalLine[];
    stashedFiles: GitFile[];
    selectedCommit: string | null;
    activeScenario: string | null;

    // Actions
    stageFile: (fileName: string) => void;
    unstageFile: (fileName: string) => void;
    commit: (message: string) => void;
    checkout: (branchOrHash: string) => void;
    createBranch: (name: string) => void;
    createBranchAt: (name: string, commitHash: string) => void;
    merge: (sourceBranch: string) => void;
    rebase: (targetBranch: string) => void;
    resetHead: (commitHash: string) => void;
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
}

// ─── Scenario Types ──────────────────────────────────────────────────────────

export interface ScenarioState {
    id: string;
    name: string;
    commits: Commit[];
    branches: Record<string, string>;
    tags: Record<string, string>;
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
    activeScenario: null as string | null,
};

// ─── Store ───────────────────────────────────────────────────────────────────

export const useGitStore = create<GitState>((set, get) => ({
    ...initialState,

    stageFile: (fileName: string) => {
        set((state) => ({
            files: state.files.map((f) =>
                f.name === fileName && f.status === 'modified'
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
        const newCommit: Commit = {
            hash: newHash,
            message,
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
                        `HEAD is now at ${branchOrHash}... (detached HEAD state)`
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

        // Validate source branch exists
        const sourceHash = state.branches[sourceBranch];
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

        // Cannot merge branch into itself
        if (sourceBranch === state.currentBranch) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git merge ${sourceBranch}`),
                    createTerminalLine('output', `Already up to date.`),
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

        // Create merge commit with TWO parents
        const mergeHash = generateHash();
        const mergeCommit: Commit = {
            hash: mergeHash,
            message: `Merge branch '${sourceBranch}' into ${state.currentBranch}`,
            parentHashes: [state.HEAD, sourceHash],
            timestamp: Date.now(),
            branch: state.currentBranch,
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

    resetHead: (commitHash: string) => {
        const state = get();

        const targetCommit = state.commits.find((c) => c.hash === commitHash);
        if (!targetCommit) {
            set({
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git reset --hard ${commitHash}`),
                    createTerminalLine('error', `fatal: not a valid commit: ${commitHash}`),
                ],
            });
            return;
        }

        const updatedBranches = { ...state.branches };
        if (state.currentBranch !== 'HEAD (detached)') {
            updatedBranches[state.currentBranch] = commitHash;
        }

        set({
            HEAD: commitHash,
            branches: updatedBranches,
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git reset --hard ${commitHash}`),
                createTerminalLine('output', `HEAD is now at ${commitHash} ${targetCommit.message}`),
            ],
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
            HEAD: scenario.HEAD,
            currentBranch: scenario.currentBranch,
            files: scenario.files,
            stashedFiles: [],
            selectedCommit: null,
            activeScenario: scenario.id,
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
        });
    },
}));

