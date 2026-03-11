import { describe, it, expect, beforeEach } from 'vitest';
import { 
    GitStateData, 
    CommandExecutor, 
    CommitCommand, 
    CreateBranchCommand, 
    AddFileCommand,
    StageFileCommand,
    generateHash
} from '../index.js';

describe('Git Engine', () => {
    let executor: CommandExecutor;
    let state: GitStateData;
    let initialHash: string;

    beforeEach(() => {
        executor = new CommandExecutor();
        initialHash = generateHash();
        state = {
            commits: [
                {
                    hash: initialHash,
                    message: 'Initial commit',
                    parentHashes: [],
                    timestamp: Date.now(),
                    branch: 'main',
                },
            ],
            branches: { main: initialHash },
            tags: {},
            remoteBranches: { 'origin/main': initialHash },
            simulatedRemote: { main: initialHash },
            HEAD: initialHash,
            currentBranch: 'main',
            files: [],
            terminalHistory: [],
            stashedFiles: [],
            selectedCommit: null,
            activeScenario: null,
            conflictState: false,
            mergingTarget: null,
            bisectState: null,
        };
    });

    it('creates a new branch and checks it out', () => {
        const createBranch = new CreateBranchCommand('feature');
        const update = executor.execute(createBranch, state);
        
        // Assert partial update logic
        expect(update.branches?.['feature']).toBe(initialHash);
    });

    it('commits a modified staged file', () => {
        // 1. Add file
        let update = executor.execute(new AddFileCommand('index.js'), state);
        state = { ...state, ...update };
        expect(state.files[0].status).toBe('modified');

        // 2. Stage file
        update = executor.execute(new StageFileCommand('index.js'), state);
        state = { ...state, ...update };
        expect(state.files[0].status).toBe('staged');

        // 3. Commit
        update = executor.execute(new CommitCommand('feat: add index.js'), state);
        state = { ...state, ...update };

        expect(state.commits.length).toBe(2);
        expect(state.commits[1].message).toBe('feat: add index.js');
        expect(state.commits[1].parentHashes[0]).toBe(initialHash);
        expect(state.branches['main']).toBe(state.HEAD);
        
        // Verify file is unmodified after commit
        expect(state.files[0].status).toBe('unmodified');
    });

    it('can time travel backwards and forwards (undo/redo)', () => {
        // Initial state -> Add file -> Stage file -> Commit
        let update = executor.execute(new AddFileCommand('index.js'), state);
        state = { ...state, ...update };
        update = executor.execute(new StageFileCommand('index.js'), state);
        state = { ...state, ...update };
        
        expect(state.files[0].status).toBe('staged');
        expect(executor.canUndo()).toBe(true);

        // Undo staging (should go back to modified)
        update = executor.undo(state) as Partial<GitStateData>;
        state = { ...state, ...update };
        expect(state.files[0].status).toBe('modified');
        expect(executor.canRedo()).toBe(true);

        // Undo adding file (should disappear)
        update = executor.undo(state) as Partial<GitStateData>;
        state = { ...state, ...update };
        expect(state.files.length).toBe(0);

        // Redo adding file (should reappear)
        update = executor.redo(state) as Partial<GitStateData>;
        state = { ...state, ...update };
        expect(state.files[0].status).toBe('modified');

        // Redo staging (should be staged again)
        update = executor.redo(state) as Partial<GitStateData>;
        state = { ...state, ...update };
        expect(state.files[0].status).toBe('staged');
        
        // No more redos left
        expect(executor.canRedo()).toBe(false);
    });
});
