import { GitCommand, CommandContext } from './Command.js';
import { GitStateData, ScenarioState } from '../types.js';
import { generateHash, createTerminalLine } from '../utils.js';

export class LoadScenarioCommand implements GitCommand {
    constructor(private scenario: ScenarioState) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        return {
            commits: this.scenario.commits,
            branches: this.scenario.branches,
            tags: this.scenario.tags,
            remoteBranches: this.scenario.remoteBranches || { 'origin/main': this.scenario.HEAD },
            simulatedRemote: this.scenario.simulatedRemote || { main: this.scenario.HEAD },
            HEAD: this.scenario.HEAD,
            currentBranch: this.scenario.currentBranch,
            files: this.scenario.files,
            stashedFiles: [],
            selectedCommit: null,
            activeScenario: this.scenario.id,
            conflictState: false,
            mergingTarget: null,
            bisectState: null,
            terminalHistory: [
                createTerminalLine('info', `🎯 Scenario loaded: ${this.scenario.name}`),
                createTerminalLine('info', `On branch ${this.scenario.currentBranch}`),
            ],
        };
    }
}

export class ResetStateCommand implements GitCommand {
    execute(): Partial<GitStateData> {
        const freshHash = generateHash();
        return {
            commits: [
                {
                    hash: freshHash,
                    message: 'Initial commit',
                    parentHashes: [],
                    timestamp: Date.now(),
                    branch: 'main',
                },
            ],
            branches: { main: freshHash },
            tags: {},
            remoteBranches: { 'origin/main': freshHash },
            simulatedRemote: { main: freshHash },
            HEAD: freshHash,
            currentBranch: 'main',
            files: [
                { name: 'index.html', status: 'unmodified' },
                { name: 'style.css', status: 'modified' },
                { name: 'app.js', status: 'modified' },
                { name: 'README.md', status: 'unmodified' },
            ],
            terminalHistory: [
                createTerminalLine('info', 'Repository reset 🔄'),
                createTerminalLine('info', 'Initialized repository with branch "main"'),
                createTerminalLine('output', `[main (root-commit) ${freshHash}] Initial commit`),
            ],
            stashedFiles: [],
            selectedCommit: null,
            activeScenario: null,
            conflictState: false,
            mergingTarget: null,
            bisectState: null,
        };
    }
}

export class BisectStartCommand implements GitCommand {
    constructor(private goodHash: string, private badHash: string) {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        function getAncestors(hash: string): string[] {
            const visited = new Set<string>();
            const order: string[] = [];
            const stack = [hash];
            while (stack.length) {
                const h = stack.pop()!;
                if (visited.has(h)) continue;
                visited.add(h);
                order.push(h);
                const commit = state.commits.find((c) => c.hash === h);
                if (commit) commit.parentHashes.forEach((p) => stack.push(p));
            }
            return order.reverse();
        }

        const ancestors = getAncestors(this.badHash);
        const between = ancestors.filter((h) => h !== this.goodHash && h !== this.badHash);
        const midIdx = Math.floor(between.length / 2);
        const currentTest = between[midIdx] ?? this.badHash;

        return {
            bisectState: {
                goodHash: this.goodHash,
                badHash: this.badHash,
                tested: { [this.goodHash]: 'good', [this.badHash]: 'bad' },
                currentTest,
                foundHash: between.length === 0 ? this.badHash : null,
            },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git bisect start`),
                createTerminalLine('output', `Bisecting: ${between.length} commits left to test`),
                createTerminalLine('info', `Testing commit: ${currentTest.slice(0, 7)}`),
            ],
        };
    }
}

export class BisectMarkCommand implements GitCommand {
    constructor(private hash: string, private verdict: 'good' | 'bad') {}

    execute({ state }: CommandContext): Partial<GitStateData> {
        if (!state.bisectState) return {};

        const newTested = { ...state.bisectState.tested, [this.hash]: this.verdict };

        const latestGood = this.verdict === 'good' ? this.hash : state.bisectState.goodHash;
        const earliestBad = this.verdict === 'bad' ? this.hash : state.bisectState.badHash;

        function getAncestors(startHash: string): string[] {
            const visited = new Set<string>();
            const order: string[] = [];
            const stack = [startHash];
            while (stack.length) {
                const h = stack.pop()!;
                if (visited.has(h)) continue;
                visited.add(h);
                order.push(h);
                const commit = state.commits.find((c) => c.hash === h);
                if (commit) commit.parentHashes.forEach((p) => stack.push(p));
            }
            return order.reverse();
        }

        const ancestors = getAncestors(earliestBad);
        const untested = ancestors.filter(
            (h) => !newTested[h] && h !== latestGood && h !== earliestBad
        );

        const isFound = untested.length === 0;
        const midIdx = Math.floor(untested.length / 2);
        const nextTest = isFound ? null : untested[midIdx];

        return {
            bisectState: {
                goodHash: latestGood,
                badHash: earliestBad,
                tested: newTested,
                currentTest: nextTest,
                foundHash: isFound ? earliestBad : null,
            },
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', `git bisect ${this.verdict} ${this.hash.slice(0, 7)}`),
                isFound
                    ? createTerminalLine('info', `🎯 Found! First bad commit: ${earliestBad.slice(0, 7)}`)
                    : createTerminalLine('output', `${untested.length} commits left — testing: ${nextTest?.slice(0, 7) ?? '?'}`),
            ],
        };
    }
}

export class BisectResetCommand implements GitCommand {
    execute({ state }: CommandContext): Partial<GitStateData> {
        return {
            bisectState: null,
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', 'git bisect reset'),
                createTerminalLine('output', 'We are back to the original HEAD.'),
            ],
        };
    }
}
