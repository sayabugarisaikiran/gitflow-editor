import { GitCommand } from './Command.js';
import { GitStateData } from '../types.js';

export class CommandExecutor {
    private history: GitCommand[] = [];
    private undoStack: GitCommand[] = [];

    /**
     * Executes a command and returns the partial state update.
     * Records the command in history for potential undo.
     */
    execute(command: GitCommand, currentState: GitStateData): Partial<GitStateData> {
        const update = command.execute({ state: currentState });
        
        // If the command actually mutates state (has an update) and supports undo natively, 
        // we keep it. Alternatively, to support generic time-travel, we could snapshot 
        // the state before execution. We'll store the command itself for now.
        this.history.push(command);
        // Clear redo stack on new action
        this.undoStack = [];
        
        return update;
    }

    /**
     * Reverts the last command. Requires the command to implement `undo()`.
     * Returns the partial state update to apply the undo, or null if nothing to undo.
     */
    undo(currentState: GitStateData): Partial<GitStateData> | null {
        const command = this.history.pop();
        if (!command) return null;

        if (command.undo) {
            const update = command.undo({ state: currentState });
            this.undoStack.push(command);
            return update;
        }

        // If command doesn't support undo, put it back and return null
        this.history.push(command);
        console.warn('Command does not support undo');
        return null;
    }
}
