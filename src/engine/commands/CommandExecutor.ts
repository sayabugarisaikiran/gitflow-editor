import { GitCommand } from './Command.js';
import { GitStateData } from '../types.js';

export class CommandExecutor {
    private history: { commandName: string; snapshot: GitStateData }[] = [];
    private future: { commandName: string; snapshot: GitStateData }[] = [];

    /**
     * Executes a command and returns the partial state update.
     * Records a deep clone of the current state before execution for time-travel.
     */
    execute(command: GitCommand, currentState: GitStateData): Partial<GitStateData> {
        // Deep clone primitive dictionaries and arrays using built-in structuredClone
        const snapshot = structuredClone(currentState);
        
        const update = command.execute({ state: currentState });
        
        // Push the snapshot of the state perfectly preserved *prior* to this command executing
        this.history.push({ 
            commandName: command.constructor.name, 
            snapshot 
        });
        
        // Clear redo stack on any new timeline branch
        this.future = [];
        
        return update;
    }

    /**
     * Reverts the last command by popping the previous state snapshot.
     */
    undo(currentState: GitStateData): Partial<GitStateData> | null {
        const previousRecord = this.history.pop();
        if (!previousRecord) return null;

        // Save current state to the future (redo) stack before we travel back
        this.future.push({
            commandName: 'undo',
            snapshot: structuredClone(currentState)
        });

        // The snapshot IS the full state replacing the current one
        return previousRecord.snapshot;
    }

    /**
     * Travels forward in time if an undo was just performed.
     */
    redo(currentState: GitStateData): Partial<GitStateData> | null {
        const nextRecord = this.future.pop();
        if (!nextRecord) return null;

        // Save current state back into history before moving forward
        this.history.push({
            commandName: 'redo',
            snapshot: structuredClone(currentState)
        });

        return nextRecord.snapshot;
    }

    canUndo(): boolean {
        return this.history.length > 0;
    }

    canRedo(): boolean {
        return this.future.length > 0;
    }
}
