import { GitCommand, CommandContext } from './Command.js';
import { Commit, FileStatus, GitStateData } from '../types.js';
import { generateHash, createTerminalLine, appendTerminalHistory } from '../utils.js';

export class CommitCommand implements GitCommand {
    constructor(private message: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        const stagedFiles = state.files.filter((f) => f.status === 'staged');
        const conflictedFiles = state.files.filter((f) => f.status === 'conflicted');

        if (state.conflictState && conflictedFiles.length > 0) {
            return {
                terminalHistory: appendTerminalHistory(state.terminalHistory, [
                    createTerminalLine('command', `git commit -m "${this.message}"`),
                    createTerminalLine('error', 'error: Committing is not possible because you have unmerged files.'),
                    createTerminalLine('info', "hint: Fix them up in the work tree, and then use 'git add/rm <file>'"),
                    createTerminalLine('info', 'hint: as appropriate to mark resolution and make a commit.'),
                ]),
            };
        }

        if (stagedFiles.length === 0) {
            return {
                terminalHistory: appendTerminalHistory(state.terminalHistory, [
                    createTerminalLine('command', `git commit -m "${this.message}"`),
                    createTerminalLine('error', 'nothing to commit (no staged files)'),
                ]),
            };
        }

        const newHash = generateHash();
        const isMergeCommit = state.conflictState && state.mergingTarget;
        
        const secondParent = state.mergingTarget 
            ? (state.branches[state.mergingTarget] || state.remoteBranches[state.mergingTarget]) 
            : undefined;

        const parentHashes = isMergeCommit && secondParent 
            ? [state.HEAD, secondParent] 
            : [state.HEAD];

        const newCommit: Commit = {
            hash: newHash,
            message: this.message,
            parentHashes,
            timestamp: Date.now(),
            branch: state.currentBranch,
            filesChanged: stagedFiles.map(f => f.name),
        };

        const isDetached = state.currentBranch === 'HEAD (detached)';

        return {
            commits: [...state.commits, newCommit],
            HEAD: newHash,
            branches: isDetached 
                ? state.branches 
                : { ...state.branches, [state.currentBranch]: newHash },
            conflictState: false,
            mergingTarget: null,
            files: state.files.map((f) =>
                f.status === 'staged' ? { ...f, status: 'unmodified' as FileStatus } : f
            ),
            terminalHistory: appendTerminalHistory(state.terminalHistory, [
                createTerminalLine('command', `git commit -m "${this.message}"`),
                createTerminalLine(
                    'output',
                    isDetached ? `[detached HEAD ${newHash}] ${this.message}` : `[${state.currentBranch} ${newHash}] ${this.message}`
                ),
                createTerminalLine('output', `  ${stagedFiles.length} file(s) changed`),
            ]),
        };
    }
}
