import { create } from 'zustand';
import {
    GitState,
    GitStateData,
    engineExecutor,
    StageFileCommand,
    UnstageFileCommand,
    CommitCommand,
    CheckoutCommand,
    FetchCommand,
    PullCommand,
    PushCommand,
    ResolveConflictCommand,
    CreateBranchCommand,
    CreateBranchAtCommand,
    MergeCommand,
    RebaseCommand,
    ResetCommand,
    RevertCommand,
    DeleteBranchCommand,
    ModifyFileCommand,
    AddFileCommand,
    StashCommand,
    StashPopCommand,
    CherryPickCommand,
    CreateTagCommand,
    DeleteTagCommand,
    LoadScenarioCommand,
    ResetStateCommand,
    BisectStartCommand,
    BisectMarkCommand,
    BisectResetCommand,
    generateHash,
    createTerminalLine
} from '../engine/index.js';

const initialCommitHash = generateHash();

const initialState: GitStateData = {
    commits: [
        {
            hash: initialCommitHash,
            message: 'Initial commit',
            parentHashes: [],
            timestamp: Date.now(),
            branch: 'main',
        },
    ],
    branches: { main: initialCommitHash },
    tags: {},
    remoteBranches: { 'origin/main': initialCommitHash },
    simulatedRemote: { main: initialCommitHash },
    HEAD: initialCommitHash,
    currentBranch: 'main',
    files: [
        { name: 'index.html', status: 'unmodified' },
        { name: 'style.css', status: 'modified' },
        { name: 'app.js', status: 'modified' },
        { name: 'README.md', status: 'unmodified' },
    ],
    terminalHistory: [
        createTerminalLine('info', 'Welcome to GitFlow Editor 🚀'),
        createTerminalLine('info', 'Initialized repository with branch "main"'),
        createTerminalLine('output', `[main (root-commit) ${initialCommitHash}] Initial commit`),
    ],
    stashedFiles: [],
    selectedCommit: null,
    activeScenario: null,
    conflictState: false,
    mergingTarget: null,
    bisectState: null,
};

export const useGitStore = create<GitState>((set, get) => {
    // Helper to run a command against current state and apply the result
    const runCommand = (command: any) => {
        const currentState = get();
        const stateData: GitStateData = {
            commits: currentState.commits,
            branches: currentState.branches,
            tags: currentState.tags,
            remoteBranches: currentState.remoteBranches,
            simulatedRemote: currentState.simulatedRemote,
            HEAD: currentState.HEAD,
            currentBranch: currentState.currentBranch,
            files: currentState.files,
            terminalHistory: currentState.terminalHistory,
            stashedFiles: currentState.stashedFiles,
            selectedCommit: currentState.selectedCommit,
            activeScenario: currentState.activeScenario,
            conflictState: currentState.conflictState,
            mergingTarget: currentState.mergingTarget,
            bisectState: currentState.bisectState,
        };
        const update = engineExecutor.execute(command, stateData);
        set(update);
    };

    return {
        ...initialState,
        
        stageFile: (fileName) => runCommand(new StageFileCommand(fileName)),
        unstageFile: (fileName) => runCommand(new UnstageFileCommand(fileName)),
        commit: (message) => runCommand(new CommitCommand(message)),
        checkout: (branchOrHash) => runCommand(new CheckoutCommand(branchOrHash)),
        fetch: () => runCommand(new FetchCommand()),
        pull: () => runCommand(new PullCommand()),
        push: () => runCommand(new PushCommand()),
        resolveConflict: (fileName, resolution) => runCommand(new ResolveConflictCommand(fileName, resolution)),
        createBranch: (name) => runCommand(new CreateBranchCommand(name)),
        createBranchAt: (name, hash) => runCommand(new CreateBranchAtCommand(name, hash)),
        merge: (sourceBranch) => runCommand(new MergeCommand(sourceBranch)),
        rebase: (targetBranch) => runCommand(new RebaseCommand(targetBranch)),
        reset: (mode, hash) => runCommand(new ResetCommand(mode, hash)),
        revert: (hash) => runCommand(new RevertCommand(hash)),
        deleteBranch: (name) => runCommand(new DeleteBranchCommand(name)),
        modifyFile: (fileName) => runCommand(new ModifyFileCommand(fileName)),
        addFile: (fileName) => runCommand(new AddFileCommand(fileName)),
        stash: () => runCommand(new StashCommand()),
        stashPop: () => runCommand(new StashPopCommand()),
        cherryPick: (hash) => runCommand(new CherryPickCommand(hash)),
        createTag: (name, hash) => runCommand(new CreateTagCommand(name, hash)),
        deleteTag: (name) => runCommand(new DeleteTagCommand(name)),
        loadScenario: (scenario) => runCommand(new LoadScenarioCommand(scenario)),
        resetState: () => runCommand(new ResetStateCommand()),
        bisectStart: (good, bad) => runCommand(new BisectStartCommand(good, bad)),
        bisectMark: (hash, verdict) => runCommand(new BisectMarkCommand(hash, verdict)),
        bisectReset: () => runCommand(new BisectResetCommand()),
        
        // Time Travel
        undo: () => {
            const currentState = get();
            const stateData: GitStateData = {
                commits: currentState.commits,
                branches: currentState.branches,
                tags: currentState.tags,
                remoteBranches: currentState.remoteBranches,
                simulatedRemote: currentState.simulatedRemote,
                HEAD: currentState.HEAD,
                currentBranch: currentState.currentBranch,
                files: currentState.files,
                terminalHistory: currentState.terminalHistory,
                stashedFiles: currentState.stashedFiles,
                selectedCommit: currentState.selectedCommit,
                activeScenario: currentState.activeScenario,
                conflictState: currentState.conflictState,
                mergingTarget: currentState.mergingTarget,
                bisectState: currentState.bisectState,
            };
            const update = engineExecutor.undo(stateData);
            if (update) set(update);
        },
        redo: () => {
            const currentState = get();
            const stateData: GitStateData = {
                commits: currentState.commits,
                branches: currentState.branches,
                tags: currentState.tags,
                remoteBranches: currentState.remoteBranches,
                simulatedRemote: currentState.simulatedRemote,
                HEAD: currentState.HEAD,
                currentBranch: currentState.currentBranch,
                files: currentState.files,
                terminalHistory: currentState.terminalHistory,
                stashedFiles: currentState.stashedFiles,
                selectedCommit: currentState.selectedCommit,
                activeScenario: currentState.activeScenario,
                conflictState: currentState.conflictState,
                mergingTarget: currentState.mergingTarget,
                bisectState: currentState.bisectState,
            };
            const update = engineExecutor.redo(stateData);
            if (update) set(update);
        },
        canUndo: () => engineExecutor.canUndo(),
        canRedo: () => engineExecutor.canRedo(),

        // UI-only state methods
        selectCommit: (hash: string | null) => set({ selectedCommit: hash }),
    };
});
