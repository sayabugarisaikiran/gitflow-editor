import { GitStateData } from '../types.js';

export interface CommandContext {
    state: GitStateData;
}

export interface GitCommand {
    execute(context: CommandContext): Partial<GitStateData>;
    /**
     * Optional undo method. Returns the state required to revert the command's effects.
     * Note: A true robust undo often requires the command to store the previous state 
     * snapshot or inverse operations when execute() is called.
     */
    undo?(context: CommandContext): Partial<GitStateData>;
}
