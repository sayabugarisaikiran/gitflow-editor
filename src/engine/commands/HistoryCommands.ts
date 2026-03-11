import { GitCommand, CommandContext } from './Command.js';
import { Commit, FileStatus, GitStateData } from '../types.js';
import { generateHash, createTerminalLine } from '../utils.js';

export class ResetCommand implements GitCommand {
    constructor(private mode: '--soft' | '--mixed' | '--hard', private commitHash: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        const targetCommit = state.commits.find((c) => c.hash === this.commitHash);
        if (!targetCommit) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git reset ${this.mode} ${this.commitHash}`),
                    createTerminalLine('error', `fatal: not a valid commit: ${this.commitHash}`),
                ],
            };
        }

        const updatedBranches = { ...state.branches };
        if (state.currentBranch !== 'HEAD (detached)') {
            updatedBranches[state.currentBranch] = this.commitHash;
        }

        let newFiles = state.files;
        if (this.mode === '--hard') {
            newFiles = state.files.map((f) => ({ ...f, status: 'unmodified' as FileStatus }));
        } else if (this.mode === '--mixed') {
            newFiles = state.files.map((f) => 
                f.status === 'staged' ? { ...f, status: 'modified' as FileStatus } : f
            );
        }

        return {
            HEAD: this.commitHash,
            branches: updatedBranches,
            files: newFiles,
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git reset ${this.mode} ${this.commitHash}`),
                ...(this.mode !== '--soft' ? [createTerminalLine('output', `Unstaged changes after reset:`)] : []),
                createTerminalLine('output', `HEAD is now at ${this.commitHash} ${targetCommit.message}`),
            ],
        };
    }
}

export class RevertCommand implements GitCommand {
    constructor(private commitHash: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        const targetCommit = state.commits.find((c) => c.hash === this.commitHash);
        
        if (!targetCommit) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git revert ${this.commitHash}`),
                    createTerminalLine('error', `fatal: bad object ${this.commitHash}`),
                ],
            };
        }

        if (state.currentBranch === 'HEAD (detached)') {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git revert ${this.commitHash}`),
                    createTerminalLine('error', 'error: cannot revert in detached HEAD state.'),
                ],
            };
        }

        const newHash = generateHash();
        const newCommit: Commit = {
            hash: newHash,
            message: `Revert "${targetCommit.message}"`,
            parentHashes: [state.HEAD],
            timestamp: Date.now(),
            branch: state.currentBranch,
            filesChanged: targetCommit.filesChanged,
        };

        return {
            commits: [...state.commits, newCommit],
            HEAD: newHash,
            branches: {
                ...state.branches,
                [state.currentBranch]: newHash,
            },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git revert ${this.commitHash}`),
                createTerminalLine('output', `[${state.currentBranch} ${newHash}] Revert "${targetCommit.message}"`),
            ],
        };
    }
}

export class CherryPickCommand implements GitCommand {
    constructor(private commitHash: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        const targetCommit = state.commits.find((c) => c.hash === this.commitHash);
        if (!targetCommit) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git cherry-pick ${this.commitHash}`),
                    createTerminalLine('error', `fatal: bad object ${this.commitHash}`),
                ],
            };
        }

        if (this.commitHash === state.HEAD) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git cherry-pick ${this.commitHash}`),
                    createTerminalLine('output', 'The previous cherry-pick is now empty'),
                ],
            };
        }

        if (state.currentBranch === 'HEAD (detached)') {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git cherry-pick ${this.commitHash}`),
                    createTerminalLine('error', 'Cannot cherry-pick in detached HEAD state.'),
                ],
            };
        }

        const newHash = generateHash();
        const newCommit: Commit = {
            hash: newHash,
            message: targetCommit.message,
            parentHashes: [state.HEAD],
            timestamp: Date.now(),
            branch: state.currentBranch,
        };

        return {
            commits: [...state.commits, newCommit],
            HEAD: newHash,
            branches: {
                ...state.branches,
                [state.currentBranch]: newHash,
            },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git cherry-pick ${this.commitHash}`),
                createTerminalLine(
                    'output',
                    `[${state.currentBranch} ${newHash}] ${targetCommit.message}`
                ),
            ],
        };
    }
}
