import { GitCommand, CommandContext } from './Command.js';
import { GitStateData } from '../types.js';
import { createTerminalLine } from '../utils.js';

export class CheckoutCommand implements GitCommand {
    constructor(private branchOrHash: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        // Check if it's a branch name
        if (state.branches[this.branchOrHash]) {
            return {
                HEAD: state.branches[this.branchOrHash],
                currentBranch: this.branchOrHash,
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git checkout ${this.branchOrHash}`),
                    createTerminalLine('output', `Switched to branch '${this.branchOrHash}'`),
                ],
            };
        }

        // Check if it's a commit hash
        const targetCommit = state.commits.find((c) => c.hash === this.branchOrHash);
        if (targetCommit) {
            return {
                HEAD: this.branchOrHash,
                currentBranch: 'HEAD (detached)',
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git checkout ${this.branchOrHash}`),
                    createTerminalLine('output', `HEAD is now at ${this.branchOrHash}...`),
                    createTerminalLine('info', `You are in 'detached HEAD' state.`),
                ],
            };
        }

        return {
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git checkout ${this.branchOrHash}`),
                createTerminalLine('error', `error: pathspec '${this.branchOrHash}' did not match any branch or commit`),
            ],
        };
    }
}

export class CreateBranchCommand implements GitCommand {
    constructor(private name: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        if (state.branches[this.name]) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git branch ${this.name}`),
                    createTerminalLine('error', `fatal: a branch named '${this.name}' already exists`),
                ],
            };
        }

        return {
            branches: { ...state.branches, [this.name]: state.HEAD },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git branch ${this.name}`),
                createTerminalLine('output', `Created branch '${this.name}' at ${state.HEAD}`),
            ],
        };
    }
}

export class CreateBranchAtCommand implements GitCommand {
    constructor(private name: string, private commitHash: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        if (state.branches[this.name]) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git branch ${this.name} ${this.commitHash}`),
                    createTerminalLine('error', `fatal: a branch named '${this.name}' already exists`),
                ],
            };
        }

        const targetCommit = state.commits.find((c) => c.hash === this.commitHash);
        if (!targetCommit) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('error', `fatal: not a valid commit: ${this.commitHash}`),
                ],
            };
        }

        return {
            branches: { ...state.branches, [this.name]: this.commitHash },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git branch ${this.name} ${this.commitHash}`),
                createTerminalLine('output', `Created branch '${this.name}' at ${this.commitHash}`),
            ],
        };
    }
}

export class DeleteBranchCommand implements GitCommand {
    constructor(private name: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        if (!state.branches[this.name]) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git branch -d ${this.name}`),
                    createTerminalLine('error', `error: branch '${this.name}' not found`),
                ],
            };
        }

        if (this.name === state.currentBranch) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git branch -d ${this.name}`),
                    createTerminalLine('error', `error: cannot delete branch '${this.name}' checked out`),
                ],
            };
        }

        if (this.name === 'main' || this.name === 'master') {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git branch -d ${this.name}`),
                    createTerminalLine('error', `error: refusing to delete protected branch '${this.name}'`),
                ],
            };
        }

        const { [this.name]: _, ...remainingBranches } = state.branches;
        return {
            branches: remainingBranches,
        };
    }
}
