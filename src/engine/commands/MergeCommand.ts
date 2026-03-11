import { GitCommand, CommandContext } from './Command.js';
import { Commit, FileStatus, GitStateData } from '../types.js';
import { generateHash, createTerminalLine } from '../utils.js';

export class MergeCommand implements GitCommand {
    constructor(private sourceBranch: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        // Validate source branch exists (local or remote)
        const sourceHash = state.branches[this.sourceBranch] || state.remoteBranches[this.sourceBranch];
        if (!sourceHash) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git merge ${this.sourceBranch}`),
                    createTerminalLine('error', `merge: ${this.sourceBranch} - not something we can merge`),
                ],
            };
        }

        // Cannot merge into detached HEAD
        if (state.currentBranch === 'HEAD (detached)') {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git merge ${this.sourceBranch}`),
                    createTerminalLine('error', 'Cannot merge in detached HEAD state. Checkout a branch first.'),
                ],
            };
        }

        // Already merged? (source points to same commit or is ancestor)
        if (sourceHash === state.HEAD) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git merge ${this.sourceBranch}`),
                    createTerminalLine('output', `Already up to date.`),
                ],
            };
        }

        if (state.conflictState) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git merge ${this.sourceBranch}`),
                    createTerminalLine('error', 'error: Merging is not possible because you have unmerged files.'),
                ],
            };
        }

        // --- Conflict Detection Engine ---
        // Find common ancestor
        const headAncestors = new Set<string>();
        const collectAncestors = (hash: string) => {
            if (headAncestors.has(hash)) return;
            headAncestors.add(hash);
            const commit = state.commits.find((c) => c.hash === hash);
            if (commit) commit.parentHashes.forEach(collectAncestors);
        };
        collectAncestors(state.HEAD);

        // Walk back source branch to find first shared commit
        let commonAncestor: string | null = null;
        const sourcePath: string[] = [];
        const queue = [sourceHash];
        
        while (queue.length > 0) {
            const curr = queue.shift()!;
            if (headAncestors.has(curr)) {
                commonAncestor = curr;
                break;
            }
            sourcePath.push(curr);
            const commit = state.commits.find((c) => c.hash === curr);
            if (commit) queue.push(...commit.parentHashes);
        }

        if (commonAncestor === sourceHash) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git merge ${this.sourceBranch}`),
                    createTerminalLine('output', `Already up to date.`),
                ],
            };
        }

        // Collect changed files on HEAD vs Common Ancestor
        const headFilesChanged = new Set<string>();
        for (const commit of state.commits) {
            if (headAncestors.has(commit.hash) && commit.hash !== commonAncestor) {
                commit.filesChanged?.forEach(f => headFilesChanged.add(f));
            }
        }

        // Collect changed files on SOURCE vs Common Ancestor
        const sourceFilesChanged = new Set<string>();
        for (const hash of sourcePath) {
            const commit = state.commits.find(c => c.hash === hash);
            commit?.filesChanged?.forEach(f => sourceFilesChanged.add(f));
        }

        // Find overlaps
        const conflicts: string[] = [];
        sourceFilesChanged.forEach(f => {
            if (headFilesChanged.has(f)) conflicts.push(f);
        });

        if (conflicts.length > 0) {
            // Trigger merge conflict
            return {
                conflictState: true,
                mergingTarget: this.sourceBranch,
                files: state.files.map((f) => 
                    conflicts.includes(f.name) ? { ...f, status: 'conflicted' as FileStatus } : f
                ),
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', `git merge ${this.sourceBranch}`),
                    createTerminalLine('output', `Auto-merging ${conflicts.join(', ')}`),
                    createTerminalLine('error', `CONFLICT (content): Merge conflict in ${conflicts.join(', ')}`),
                    createTerminalLine('error', `Automatic merge failed; fix conflicts and then commit the result.`),
                ],
            };
        }

        // No conflicts - create merge commit directly
        const mergeHash = generateHash();
        const mergeCommit: Commit = {
            hash: mergeHash,
            message: `Merge branch '${this.sourceBranch}' into ${state.currentBranch}`,
            parentHashes: [state.HEAD, sourceHash],
            timestamp: Date.now(),
            branch: state.currentBranch,
            filesChanged: [],
        };

        return {
            commits: [...state.commits, mergeCommit],
            HEAD: mergeHash,
            branches: {
                ...state.branches,
                [state.currentBranch]: mergeHash,
            },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git merge ${this.sourceBranch}`),
                createTerminalLine('output', `Merge made by the 'recursive' strategy.`),
                createTerminalLine('output', `[${state.currentBranch} ${mergeHash}] Merge branch '${this.sourceBranch}' into ${state.currentBranch}`),
            ],
        };
    }
}
