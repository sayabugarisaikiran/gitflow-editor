import { GitCommand, CommandContext } from './Command.js';
import { GitStateData } from '../types.js';
import { createTerminalLine } from '../utils.js';
import { MergeCommand } from './MergeCommand.js';

export class FetchCommand implements GitCommand {
    execute({ state }: CommandContext): Partial<GitStateData> {
        const newRemoteBranches: Record<string, string> = { ...state.remoteBranches };
        let fetchedAny = false;
        
        Object.entries(state.simulatedRemote).forEach(([branch, hash]) => {
            const remoteRef = `origin/${branch}`;
            if (newRemoteBranches[remoteRef] !== hash) {
                newRemoteBranches[remoteRef] = hash;
                fetchedAny = true;
            }
        });

        return {
            remoteBranches: newRemoteBranches,
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', 'git fetch'),
                ...(fetchedAny ? [createTerminalLine('output', 'From origin'), createTerminalLine('output', '   Fetched remote branches.')] : []),
            ]
        };
    }
}

export class PushCommand implements GitCommand {
    execute({ state }: CommandContext): Partial<GitStateData> {
        const currentRef = state.branches[state.currentBranch];
        
        if (!currentRef) {
            return {
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', 'git push'),
                    createTerminalLine('error', `fatal: The current branch ${state.currentBranch} has no upstream branch.`)
                ]
            };
        }

        const newSimulatedRemote = { ...state.simulatedRemote, [state.currentBranch]: currentRef };
        const remoteRef = `origin/${state.currentBranch}`;
        const newRemoteBranches = { ...state.remoteBranches, [remoteRef]: currentRef };

        return {
            simulatedRemote: newSimulatedRemote,
            remoteBranches: newRemoteBranches,
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', 'git push'),
                createTerminalLine('output', `To origin`),
                createTerminalLine('output', `   ${state.currentBranch} -> ${state.currentBranch}`),
            ]
        };
    }
}

export class PullCommand implements GitCommand {
    execute(context: CommandContext): Partial<GitStateData> {
        const { state } = context;
        
        // 1. Fetch
        const newRemoteBranches: Record<string, string> = { ...state.remoteBranches };
        Object.entries(state.simulatedRemote).forEach(([branch, hash]) => {
            const remoteRef = `origin/${branch}`;
            newRemoteBranches[remoteRef] = hash;
        });

        const remoteRefForCurrent = `origin/${state.currentBranch}`;
        const targetHashToMerge = newRemoteBranches[remoteRefForCurrent];

        if (!targetHashToMerge) {
            return {
                remoteBranches: newRemoteBranches,
                terminalHistory: [
                    ...state.terminalHistory,
                    createTerminalLine('command', 'git pull'),
                    createTerminalLine('error', `There is no tracking information for the current branch.`)
                ]
            };
        }

        // Apply fetch first (virtually) to state before merge
        const fetchedState = {
            ...state,
            remoteBranches: newRemoteBranches,
            terminalHistory: [
                ...state.terminalHistory,
                createTerminalLine('command', 'git pull'),
                createTerminalLine('info', 'Fetching from origin...'),
            ]
        };

        // 2. Merge (Using the fetched remote tracking branch)
        // Delegate to MergeCommand using our virtually fetched state
        const mergeResult = new MergeCommand(remoteRefForCurrent).execute({ state: fetchedState });
        
        return {
            ...mergeResult,
            remoteBranches: newRemoteBranches, // Ensure remoteBranches carries through if merge doesn't touch it
        };
    }
}
