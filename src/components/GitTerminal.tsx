import { useRef, useEffect, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useGitStore, type TerminalLine } from '../store/useGitStore';
import { useSettingsStore } from '../store/useSettingsStore';

// ─── ANSI color helpers ──────────────────────────────────────────────────────

const COLORS = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    white: '\x1b[37m',
    gray: '\x1b[90m',
};

function colorize(type: TerminalLine['type'], text: string): string {
    switch (type) {
        case 'command':
            return `${COLORS.gray}$ ${COLORS.yellow}${COLORS.bold}${text}${COLORS.reset}`;
        case 'output':
            return `${COLORS.white}  ${text}${COLORS.reset}`;
        case 'error':
            return `${COLORS.red}✗ ${text}${COLORS.reset}`;
        case 'info':
            return `${COLORS.cyan}ℹ ${text}${COLORS.reset}`;
        default:
            return text;
    }
}

// ─── Command Parser ──────────────────────────────────────────────────────────

function parseCommand(input: string): void {
    const trimmed = input.trim();
    if (!trimmed) return;

    const parts = trimmed.split(/\s+/);
    const store = useGitStore.getState();

    if (parts[0] === 'clear') {
        useGitStore.setState({ terminalHistory: [] });
        return;
    }

    if (parts[0] === 'help') {
        useGitStore.setState((state) => ({
            terminalHistory: [
                ...state.terminalHistory,
                { type: 'info', text: 'Available commands:', timestamp: Date.now() },
                { type: 'output', text: '  git add <file>           Stage a file', timestamp: Date.now() },
                { type: 'output', text: '  git commit -m "msg"      Commit staged changes', timestamp: Date.now() },
                { type: 'output', text: '  git status               Show file statuses', timestamp: Date.now() },
                { type: 'output', text: '  git log                  Show commit history', timestamp: Date.now() },
                { type: 'output', text: '  git branch [name]        List or create branch', timestamp: Date.now() },
                { type: 'output', text: '  git branch -d <name>     Delete a branch', timestamp: Date.now() },
                { type: 'output', text: '  git checkout <branch>    Switch branches', timestamp: Date.now() },
                { type: 'output', text: '  git checkout -b <name>   Create & switch branch', timestamp: Date.now() },
                { type: 'output', text: '  git fetch                Download objects and refs from another repository', timestamp: Date.now() },
                { type: 'output', text: '  git pull                 Fetch from and integrate with another repository or a local branch', timestamp: Date.now() },
                { type: 'output', text: '  git push                 Update remote refs along with associated objects', timestamp: Date.now() },
                { type: 'output', text: '  git merge <branch>       Merge branch into HEAD', timestamp: Date.now() },
                { type: 'output', text: '  git rebase <branch>      Rebase onto branch', timestamp: Date.now() },
                { type: 'output', text: '  git cherry-pick <hash>   Copy commit to branch', timestamp: Date.now() },
                { type: 'output', text: '  git stash                Stash dirty files', timestamp: Date.now() },
                { type: 'output', text: '  git stash pop            Restore stashed files', timestamp: Date.now() },
                { type: 'output', text: '  git tag <name> [hash]    Create a tag', timestamp: Date.now() },
                { type: 'output', text: '  git tag -d <name>        Delete a tag', timestamp: Date.now() },
                { type: 'output', text: '  git reset <mode> <hash>  Reset HEAD to commit', timestamp: Date.now() },
                { type: 'output', text: '  git revert <hash>        Revert a commit', timestamp: Date.now() },
                { type: 'output', text: '  clear                    Clear terminal', timestamp: Date.now() },
                { type: 'output', text: '  help                     Show this help', timestamp: Date.now() },
            ],
        }));
        return;
    }

    if (parts[0] !== 'git') {
        useGitStore.setState((state) => ({
            terminalHistory: [
                ...state.terminalHistory,
                { type: 'command', text: trimmed, timestamp: Date.now() },
                { type: 'error', text: `command not found: ${parts[0]}. Type "help" for usage.`, timestamp: Date.now() },
            ],
        }));
        return;
    }

    const subcommand = parts[1];

    switch (subcommand) {
        case 'add':
            if (parts[2] === '.') {
                // git add . — stage all modified
                const modified = store.files.filter(f => f.status === 'modified');
                if (modified.length === 0) {
                    useGitStore.setState((state) => ({
                        terminalHistory: [
                            ...state.terminalHistory,
                            { type: 'command', text: trimmed, timestamp: Date.now() },
                            { type: 'output', text: 'nothing to add', timestamp: Date.now() },
                        ],
                    }));
                } else {
                    modified.forEach(f => store.stageFile(f.name));
                }
            } else if (parts[2]) {
                store.stageFile(parts[2]);
            }
            break;

        case 'reset':
            if ((parts[2] === '--hard' || parts[2] === '--soft' || parts[2] === '--mixed') && parts[3]) {
                store.reset(parts[2], parts[3]);
            } else if (parts[2] === 'HEAD' && parts[3]) {
                store.unstageFile(parts[3]);
            } else if (parts[2]) {
                store.unstageFile(parts[2]);
            }
            break;

        case 'revert':
            if (parts[2]) {
                store.revert(parts[2]);
            } else {
                useGitStore.setState((state) => ({
                    terminalHistory: [
                        ...state.terminalHistory,
                        { type: 'command', text: trimmed, timestamp: Date.now() },
                        { type: 'error', text: 'usage: git revert <commit-hash>', timestamp: Date.now() },
                    ],
                }));
            }
            break;

        case 'commit':
            if (parts[2] === '-m' && parts.length > 3) {
                const messageMatch = trimmed.match(/git commit -m\s+["'](.+?)["']/);
                const message = messageMatch
                    ? messageMatch[1]
                    : parts.slice(3).join(' ').replace(/['"]/g, '');
                store.commit(message);
            } else {
                useGitStore.setState((state) => ({
                    terminalHistory: [
                        ...state.terminalHistory,
                        { type: 'command', text: trimmed, timestamp: Date.now() },
                        { type: 'error', text: 'usage: git commit -m "message"', timestamp: Date.now() },
                    ],
                }));
            }
            break;

        case 'checkout':
            if (parts[2] === '-b' && parts[3]) {
                store.createBranch(parts[3]);
                store.checkout(parts[3]);
            } else if (parts[2]) {
                store.checkout(parts[2]);
            }
            break;

        case 'branch':
            if (parts[2] === '-d' && parts[3]) {
                store.deleteBranch(parts[3]);
            } else if (parts[2]) {
                store.createBranch(parts[2]);
            } else {
                useGitStore.setState((state) => ({
                    terminalHistory: [
                        ...state.terminalHistory,
                        { type: 'command', text: trimmed, timestamp: Date.now() },
                        ...Object.keys(store.branches).map((b) => ({
                            type: 'output' as const,
                            text: `  ${b === store.currentBranch ? '* ' : '  '}${b}`,
                            timestamp: Date.now(),
                        })),
                    ],
                }));
            }
            break;

        case 'merge':
            if (parts[2]) {
                store.merge(parts[2]);
            } else {
                useGitStore.setState((state) => ({
                    terminalHistory: [
                        ...state.terminalHistory,
                        { type: 'command', text: trimmed, timestamp: Date.now() },
                        { type: 'error', text: 'usage: git merge <branch>', timestamp: Date.now() },
                    ],
                }));
            }
            break;

        case 'cherry-pick':
            if (parts[2]) {
                store.cherryPick(parts[2]);
            } else {
                useGitStore.setState((state) => ({
                    terminalHistory: [
                        ...state.terminalHistory,
                        { type: 'command', text: trimmed, timestamp: Date.now() },
                        { type: 'error', text: 'usage: git cherry-pick <commit-hash>', timestamp: Date.now() },
                    ],
                }));
            }
            break;

        case 'stash':
            if (parts[2] === 'pop') {
                store.stashPop();
            } else if (!parts[2]) {
                store.stash();
            } else {
                useGitStore.setState((state) => ({
                    terminalHistory: [
                        ...state.terminalHistory,
                        { type: 'command', text: trimmed, timestamp: Date.now() },
                        { type: 'error', text: 'usage: git stash [pop]', timestamp: Date.now() },
                    ],
                }));
            }
            break;

        case 'rebase':
            if (parts[2]) {
                store.rebase(parts[2]);
            } else {
                useGitStore.setState((state) => ({
                    terminalHistory: [
                        ...state.terminalHistory,
                        { type: 'command', text: trimmed, timestamp: Date.now() },
                        { type: 'error', text: 'usage: git rebase <branch>', timestamp: Date.now() },
                    ],
                }));
            }
            break;

        case 'tag':
            if (parts[2] === '-d' && parts[3]) {
                store.deleteTag(parts[3]);
            } else if (parts[2]) {
                store.createTag(parts[2], parts[3]);
            } else {
                // List tags
                const tagEntries = Object.entries(store.tags);
                useGitStore.setState((state) => ({
                    terminalHistory: [
                        ...state.terminalHistory,
                        { type: 'command', text: trimmed, timestamp: Date.now() },
                        ...(tagEntries.length > 0
                            ? tagEntries.map(([name, hash]) => ({
                                type: 'output' as const,
                                text: `  ${name} → ${hash}`,
                                timestamp: Date.now(),
                            }))
                            : [{ type: 'output' as const, text: 'No tags found.', timestamp: Date.now() }]),
                    ],
                }));
            }
            break;

        case 'fetch':
            store.fetch();
            break;

        case 'pull':
            store.pull();
            break;

        case 'push':
            store.push();
            break;

        case 'log':
            useGitStore.setState((state) => ({
                terminalHistory: [
                    ...state.terminalHistory,
                    { type: 'command', text: trimmed, timestamp: Date.now() },
                    ...store.commits.slice().reverse().map((c) => ({
                        type: 'output' as const,
                        text: `${c.hash} ${c.message} (${c.branch})`,
                        timestamp: Date.now(),
                    })),
                ],
            }));
            break;

        case 'status': {
            const modified = store.files.filter((f) => f.status === 'modified');
            const staged = store.files.filter((f) => f.status === 'staged');
            useGitStore.setState((state) => ({
                terminalHistory: [
                    ...state.terminalHistory,
                    { type: 'command', text: trimmed, timestamp: Date.now() },
                    { type: 'output', text: `On branch ${store.currentBranch}`, timestamp: Date.now() },
                    ...(staged.length > 0
                        ? [
                            { type: 'output' as const, text: 'Changes to be committed:', timestamp: Date.now() },
                            ...staged.map((f) => ({
                                type: 'output' as const,
                                text: `    staged:   ${f.name}`,
                                timestamp: Date.now(),
                            })),
                        ]
                        : []),
                    ...(modified.length > 0
                        ? [
                            { type: 'output' as const, text: 'Changes not staged for commit:', timestamp: Date.now() },
                            ...modified.map((f) => ({
                                type: 'output' as const,
                                text: `    modified: ${f.name}`,
                                timestamp: Date.now(),
                            })),
                        ]
                        : []),
                    ...(staged.length === 0 && modified.length === 0
                        ? [{ type: 'output' as const, text: 'nothing to commit, working tree clean', timestamp: Date.now() }]
                        : []),
                ],
            }));
            break;
        }

        default:
            useGitStore.setState((state) => ({
                terminalHistory: [
                    ...state.terminalHistory,
                    { type: 'command', text: trimmed, timestamp: Date.now() },
                    { type: 'error', text: `git: '${subcommand}' is not a git command. Type "help" for usage.`, timestamp: Date.now() },
                ],
            }));
    }
}

// ─── GitTerminal Component ───────────────────────────────────────────────────

export default function GitTerminal() {
    const termRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const inputBufferRef = useRef('');
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef(-1);
    const lastRenderedCountRef = useRef(0);
    const { theme } = useSettingsStore();

    const prompt = useCallback(() => {
        xtermRef.current?.write(`\r\n${COLORS.green}${COLORS.bold}➜${COLORS.reset} `);
    }, []);

    // Initialize xterm
    useEffect(() => {
        if (!termRef.current) return;

        const term = new Terminal({
            theme: {
                background: '#0a0e14',
                foreground: '#e2e8f0',
                cursor: '#f59e0b',
                cursorAccent: '#0a0e14',
                selectionBackground: '#334155',
                selectionForeground: '#e2e8f0',
                black: '#0a0e14',
                red: '#f87171',
                green: '#34d399',
                yellow: '#fbbf24',
                blue: '#818cf8',
                magenta: '#c084fc',
                cyan: '#22d3ee',
                white: '#e2e8f0',
                brightBlack: '#475569',
                brightRed: '#fca5a5',
                brightGreen: '#6ee7b7',
                brightYellow: '#fde68a',
                brightBlue: '#a5b4fc',
                brightMagenta: '#d8b4fe',
                brightCyan: '#67e8f9',
                brightWhite: '#f8fafc',
            },
            fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
            fontSize: 13,
            lineHeight: 1.4,
            cursorBlink: true,
            cursorStyle: 'bar',
            scrollback: 1000,
            allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(termRef.current);

        // Delay fit to ensure container is measured
        requestAnimationFrame(() => {
            try { fitAddon.fit(); } catch (_) { /* ignore initial fit error */ }
        });

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Write initial content from store
        const initialHistory = useGitStore.getState().terminalHistory;
        initialHistory.forEach((line) => {
            term.writeln(colorize(line.type, line.text));
        });
        lastRenderedCountRef.current = initialHistory.length;
        prompt();

        // Handle keyboard input
        term.onData((data) => {
            const code = data.charCodeAt(0);

            if (data === '\r') {
                // Enter
                const cmd = inputBufferRef.current;
                if (cmd.trim()) {
                    historyRef.current.push(cmd);
                    historyIndexRef.current = historyRef.current.length;
                }

                if (cmd.trim() === 'clear') {
                    term.clear();
                    inputBufferRef.current = '';
                    useGitStore.setState({ terminalHistory: [] });
                    lastRenderedCountRef.current = 0;
                    prompt();
                    return;
                }

                term.write('\r\n');
                inputBufferRef.current = '';
                parseCommand(cmd);
            } else if (data === '\x7f') {
                // Backspace
                if (inputBufferRef.current.length > 0) {
                    inputBufferRef.current = inputBufferRef.current.slice(0, -1);
                    term.write('\b \b');
                }
            } else if (data === '\x1b[A') {
                // Arrow Up — history
                if (historyRef.current.length > 0 && historyIndexRef.current > 0) {
                    historyIndexRef.current--;
                    const prev = historyRef.current[historyIndexRef.current];
                    // Clear current input
                    term.write('\r' + ' '.repeat(inputBufferRef.current.length + 4) + '\r');
                    inputBufferRef.current = prev;
                    term.write(`${COLORS.green}${COLORS.bold}➜${COLORS.reset} ${prev}`);
                }
            } else if (data === '\x1b[B') {
                // Arrow Down — history
                if (historyIndexRef.current < historyRef.current.length - 1) {
                    historyIndexRef.current++;
                    const next = historyRef.current[historyIndexRef.current];
                    term.write('\r' + ' '.repeat(inputBufferRef.current.length + 4) + '\r');
                    inputBufferRef.current = next;
                    term.write(`${COLORS.green}${COLORS.bold}➜${COLORS.reset} ${next}`);
                } else {
                    historyIndexRef.current = historyRef.current.length;
                    term.write('\r' + ' '.repeat(inputBufferRef.current.length + 4) + '\r');
                    inputBufferRef.current = '';
                    term.write(`${COLORS.green}${COLORS.bold}➜${COLORS.reset} `);
                }
            } else if (code === 3) {
                // Ctrl+C
                term.write('^C');
                inputBufferRef.current = '';
                prompt();
            } else if (code >= 32) {
                // Printable character
                inputBufferRef.current += data;
                term.write(data);
            }
        });

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            try { fitAddon.fit(); } catch (_) { /* ignore */ }
        });
        resizeObserver.observe(termRef.current);

        return () => {
            resizeObserver.disconnect();
            term.dispose();
        };
    }, [prompt]); // We deliberately do not include 'theme' here to avoid re-mounting xterm

    // Subscribe to theme changes to dynamically update xterm
    useEffect(() => {
        if (xtermRef.current) {
            const isDark = theme === 'dark';
            xtermRef.current.options.theme = {
                background: isDark ? '#0a0e14' : '#f8fafc',
                foreground: isDark ? '#e2e8f0' : '#475569', // slate-200 : slate-600
                cursor: isDark ? '#818cf8' : '#6366f1', // indigo-400 : indigo-500
                selectionBackground: isDark ? 'rgba(129, 140, 248, 0.3)' : 'rgba(99, 102, 241, 0.2)',
            };
        }
    }, [theme]);

    // Subscribe to store changes — write new lines to terminal
    useEffect(() => {
        const unsubscribe = useGitStore.subscribe((state) => {
            const term = xtermRef.current;
            if (!term) return;

            const history = state.terminalHistory;
            const newStartIndex = lastRenderedCountRef.current;

            if (history.length > newStartIndex) {
                // There are new lines to render
                const newLines = history.slice(newStartIndex);

                // Clear current input line, write new output, then re-prompt
                // Move to beginning, clear line
                term.write('\r\x1b[K');

                newLines.forEach((line) => {
                    term.writeln(colorize(line.type, line.text));
                });

                lastRenderedCountRef.current = history.length;

                // Re-draw prompt + any current input
                term.write(`${COLORS.green}${COLORS.bold}➜${COLORS.reset} ${inputBufferRef.current}`);
            } else if (history.length < newStartIndex) {
                // History was cleared (e.g. by clear command or reset)
                lastRenderedCountRef.current = history.length;
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-[#0a0e14] border-l border-slate-200 dark:border-slate-800/60 transition-colors duration-300">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/60 bg-white/90 dark:bg-[#0d1117]/80 backdrop-blur-sm flex items-center gap-2 transition-colors duration-300">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400 dark:bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-400 dark:bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400 dark:bg-emerald-500/80" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 ml-2">
                    Terminal
                </span>
                <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-600 font-mono">git-shell</span>
            </div>

            {/* Xterm container */}
            <div ref={termRef} className="flex-1 overflow-hidden px-1 py-1 bg-slate-50 dark:bg-transparent" />

            {/* Quick commands */}
            <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800/40 bg-white/50 dark:bg-transparent flex flex-wrap gap-1.5 transition-colors duration-300">
                {['git status', 'git log', 'git branch', 'help', 'clear'].map((cmd) => (
                    <button
                        key={cmd}
                        onClick={() => {
                            if (xtermRef.current) {
                                // Simulate the command
                                xtermRef.current.write('\r\x1b[K');
                                inputBufferRef.current = '';
                                if (cmd === 'clear') {
                                    xtermRef.current.clear();
                                    useGitStore.setState({ terminalHistory: [] });
                                    lastRenderedCountRef.current = 0;
                                    xtermRef.current.write(`${COLORS.green}${COLORS.bold}➜${COLORS.reset} `);
                                } else {
                                    xtermRef.current.writeln(`${COLORS.green}${COLORS.bold}➜${COLORS.reset} ${COLORS.yellow}${COLORS.bold}${cmd}${COLORS.reset}`);
                                    parseCommand(cmd);
                                }
                            }
                        }}
                        className="text-[10px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors border border-slate-300 dark:border-slate-700/40"
                    >
                        {cmd}
                    </button>
                ))}
            </div>
        </div>
    );
}
