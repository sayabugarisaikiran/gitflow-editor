import { GitCommand, CommandContext } from './Command.js';
import { Commit, GitStateData } from '../types.js';
import { generateHash, createTerminalLine, appendTerminalHistory } from '../utils.js';

export class RebaseCommand implements GitCommand {
    constructor(private targetBranch: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        if (state.currentBranch === 'HEAD (detached)') {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git rebase ${this.targetBranch}`),
                    createTerminalLine('error', 'Cannot rebase in detached HEAD state.'),
                ],
            };
        }

        const targetHash = state.branches[this.targetBranch];
        if (!targetHash) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git rebase ${this.targetBranch}`),
                    createTerminalLine('error', `fatal: invalid upstream '${this.targetBranch}'`),
                ],
            };
        }

        if (this.targetBranch === state.currentBranch) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git rebase ${this.targetBranch}`),
                    createTerminalLine('output', 'Current branch is up to date.'),
                ],
            };
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
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git rebase ${this.targetBranch}`),
                    createTerminalLine('output', 'Current branch is up to date.'),
                ],
            };
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

        return {
            commits: [
                ...state.commits,
                ...newCommits,
            ],
            HEAD: newHead,
            branches: {
                ...state.branches,
                [state.currentBranch]: newHead,
            },
            terminalHistory: appendTerminalHistory(state.terminalHistory, [
                createTerminalLine('command', `git rebase ${this.targetBranch}`),
                createTerminalLine(
                    'output',
                    `Successfully rebased ${branchCommits.length} commit(s) onto '${this.targetBranch}'`
                ),
            ]),
        };
    }
}
