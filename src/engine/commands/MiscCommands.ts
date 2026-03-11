import { GitCommand, CommandContext } from './Command.js';
import { FileStatus, GitStateData } from '../types.js';
import { createTerminalLine } from '../utils.js';

export class StashCommand implements GitCommand {
    execute({ state }: CommandContext): Partial<GitStateData> {
        const dirtyFiles = state.files.filter(
            (f) => f.status === 'modified' || f.status === 'staged'
        );

        if (dirtyFiles.length === 0) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', 'git stash'),
                    createTerminalLine('output', 'No local changes to save'),
                ],
            };
        }

        return {
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
                createTerminalLine('output', ` ${dirtyFiles.length} file(s) stashed`),
            ],
        };
    }
}

export class StashPopCommand implements GitCommand {
    execute({ state }: CommandContext): Partial<GitStateData> {
        if (state.stashedFiles.length === 0) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', 'git stash pop'),
                    createTerminalLine('error', 'No stash entries found.'),
                ],
            };
        }

        const restoredFileNames = new Set(state.stashedFiles.map((f) => f.name));
        return {
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
        };
    }
}

export class CreateTagCommand implements GitCommand {
    constructor(private name: string, private commitHash?: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        const hash = this.commitHash || state.HEAD;

        if (state.tags[this.name]) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git tag ${this.name}${this.commitHash ? ' ' + this.commitHash : ''}`),
                    createTerminalLine('error', `fatal: tag '${this.name}' already exists`),
                ],
            };
        }

        return {
            tags: { ...state.tags, [this.name]: hash },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git tag ${this.name}${this.commitHash ? ' ' + this.commitHash : ''}`),
                createTerminalLine('output', `Created tag '${this.name}' at ${hash}`),
            ],
        };
    }
}

export class DeleteTagCommand implements GitCommand {
    constructor(private name: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        if (!state.tags[this.name]) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git tag -d ${this.name}`),
                    createTerminalLine('error', `error: tag '${this.name}' not found.`),
                ],
            };
        }

        const newTags = { ...state.tags };
        delete newTags[this.name];

        return {
            tags: newTags,
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git tag -d ${this.name}`),
                createTerminalLine('output', `Deleted tag '${this.name}'`),
            ],
        };
    }
}
