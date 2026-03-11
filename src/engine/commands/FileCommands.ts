import { GitCommand, CommandContext } from './Command.js';
import { FileStatus, GitStateData } from '../types.js';
import { createTerminalLine } from '../utils.js';

export class ModifyFileCommand implements GitCommand {
    constructor(private fileName: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        const exists = state.files.find((f) => f.name === this.fileName);

        if (exists) {
            return {
                files: state.files.map((f) =>
                    f.name === this.fileName
                        ? { ...f, status: 'modified' as FileStatus }
                        : f
                ),
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('info', `~ modified: ${this.fileName}`),
                ],
            };
        }
        return {};
    }
}

export class AddFileCommand implements GitCommand {
    constructor(private fileName: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        const exists = state.files.find((f) => f.name === this.fileName);

        if (!exists) {
            return {
                files: [...state.files, { name: this.fileName, status: 'modified' as FileStatus }],
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('info', `+ new file: ${this.fileName}`),
                ],
            };
        }
        return {};
    }
}

export class StageFileCommand implements GitCommand {
    constructor(private fileName: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        return {
            files: state.files.map((f) =>
                f.name === this.fileName && (f.status === 'modified' || f.status === 'conflicted')
                    ? { ...f, status: 'staged' as FileStatus }
                    : f
            ),
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git add ${this.fileName}`),
                createTerminalLine('output', `  staged: ${this.fileName}`),
            ],
        };
    }
}

export class UnstageFileCommand implements GitCommand {
    constructor(private fileName: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        return {
            files: state.files.map((f) =>
                f.name === this.fileName && f.status === 'staged'
                    ? { ...f, status: 'modified' as FileStatus }
                    : f
            ),
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git reset HEAD ${this.fileName}`),
                createTerminalLine('output', `  unstaged: ${this.fileName}`),
            ],
        };
    }
}

export class ResolveConflictCommand implements GitCommand {
    constructor(private fileName: string, private resolution: 'current' | 'incoming' | 'both') {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        return {
            files: state.files.map(f => 
                f.name === this.fileName ? { ...f, status: 'staged' as FileStatus } : f
            ),
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('info', `Resolved conflict in ${this.fileName} using ${this.resolution} changes.`),
            ]
        };
    }
}
