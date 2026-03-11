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

// Data-only representation of the Git state
export interface GitStateData {
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

    isFetchingGithub: boolean;
}

// Full store state including actions (used by Zustand)
export interface GitState extends GitStateData {
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
    loadGithubRepo: (owner: string, repo: string) => Promise<void>;
    resetState: () => void;
    bisectStart: (goodHash: string, badHash: string) => void;
    bisectMark: (hash: string, verdict: 'good' | 'bad') => void;
    bisectReset: () => void;
    
    // Time Travel
    undo: () => void;
    redo: () => void;
    canUndo: () => boolean;
    canRedo: () => boolean;
}

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
