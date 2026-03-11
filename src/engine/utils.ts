import { TerminalLine } from './types.js';

export function generateHash(): string {
    return Math.random().toString(16).substring(2, 10);
}

export function createTerminalLine(
    type: TerminalLine['type'],
    text: string
): TerminalLine {
    return { type, text, timestamp: Date.now() };
}

export function appendTerminalHistory(currentHistory: TerminalLine[], newLines: TerminalLine[]): TerminalLine[] {
    const combined = [...currentHistory, ...newLines];
    // Keep only the last 1000 lines to prevent memory bloat
    return combined.length > 1000 ? combined.slice(combined.length - 1000) : combined;
}
