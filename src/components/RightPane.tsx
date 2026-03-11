import { useRef, useEffect, useState } from 'react';
import { useGitStore } from '../store/useGitStore';

const typeColors: Record<string, string> = {
    command: 'text-yellow-300',
    output: 'text-slate-300',
    error: 'text-red-400',
    info: 'text-indigo-400',
};

const typePrefix: Record<string, string> = {
    command: '$ ',
    output: '  ',
    error: '✗ ',
    info: 'ℹ ',
};

export default function RightPane() {
    const { terminalHistory, commit, stageFile, checkout, createBranch } = useGitStore();
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [terminalHistory]);

    const handleCommand = (cmd: string) => {
        const trimmed = cmd.trim();
        if (!trimmed) return;

        // Parse the command
        const parts = trimmed.split(/\s+/);

        if (parts[0] !== 'git') {
            useGitStore.setState((state) => ({
                terminalHistory: [
                    ...state.terminalHistory,
                    { type: 'command', text: trimmed, timestamp: Date.now() },
                    { type: 'error', text: `command not found: ${parts[0]}. Try a git command.`, timestamp: Date.now() },
                ],
            }));
            return;
        }

        const subcommand = parts[1];

        switch (subcommand) {
            case 'add':
                if (parts[2]) {
                    stageFile(parts[2]);
                }
                break;
            case 'commit':
                if (parts[2] === '-m' && parts[3]) {
                    // Join everything after -m as the message (handle quotes)
                    const messageMatch = trimmed.match(/git commit -m ["'](.+?)["']/);
                    const message = messageMatch ? messageMatch[1] : parts.slice(3).join(' ').replace(/['"]/g, '');
                    commit(message);
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
                    createBranch(parts[3]);
                    checkout(parts[3]);
                } else if (parts[2]) {
                    checkout(parts[2]);
                }
                break;
            case 'branch':
                if (parts[2]) {
                    createBranch(parts[2]);
                } else {
                    const state = useGitStore.getState();
                    useGitStore.setState({
                        terminalHistory: [
                            ...state.terminalHistory,
                            { type: 'command', text: trimmed, timestamp: Date.now() },
                            ...Object.keys(state.branches).map((b) => ({
                                type: 'output' as const,
                                text: `  ${b === state.currentBranch ? '* ' : '  '}${b}`,
                                timestamp: Date.now(),
                            })),
                        ],
                    });
                }
                break;
            case 'log':
                const state = useGitStore.getState();
                useGitStore.setState({
                    terminalHistory: [
                        ...state.terminalHistory,
                        { type: 'command', text: trimmed, timestamp: Date.now() },
                        ...state.commits.slice().reverse().map((c) => ({
                            type: 'output' as const,
                            text: `${c.hash} ${c.message} (${c.branch})`,
                            timestamp: Date.now(),
                        })),
                    ],
                });
                break;
            case 'status':
                const st = useGitStore.getState();
                const modified = st.files.filter((f) => f.status === 'modified');
                const staged = st.files.filter((f) => f.status === 'staged');
                useGitStore.setState({
                    terminalHistory: [
                        ...st.terminalHistory,
                        { type: 'command', text: trimmed, timestamp: Date.now() },
                        { type: 'output', text: `On branch ${st.currentBranch}`, timestamp: Date.now() },
                        ...(staged.length > 0
                            ? [
                                { type: 'output' as const, text: 'Changes to be committed:', timestamp: Date.now() },
                                ...staged.map((f) => ({
                                    type: 'output' as const,
                                    text: `  staged:   ${f.name}`,
                                    timestamp: Date.now(),
                                })),
                            ]
                            : []),
                        ...(modified.length > 0
                            ? [
                                { type: 'output' as const, text: 'Changes not staged for commit:', timestamp: Date.now() },
                                ...modified.map((f) => ({
                                    type: 'output' as const,
                                    text: `  modified: ${f.name}`,
                                    timestamp: Date.now(),
                                })),
                            ]
                            : []),
                        ...(staged.length === 0 && modified.length === 0
                            ? [{ type: 'output' as const, text: 'nothing to commit, working tree clean', timestamp: Date.now() }]
                            : []),
                    ],
                });
                break;
            default:
                useGitStore.setState((state) => ({
                    terminalHistory: [
                        ...state.terminalHistory,
                        { type: 'command', text: trimmed, timestamp: Date.now() },
                        { type: 'error', text: `git: '${subcommand}' is not a git command.`, timestamp: Date.now() },
                    ],
                }));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCommand(input);
            setInput('');
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#0a0e14] border-l border-slate-800/60">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800/60 bg-[#0d1117]/80 backdrop-blur-sm flex items-center gap-2">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 ml-2">
                    Terminal
                </span>
                <span className="ml-auto text-[10px] text-slate-600 font-mono">bash</span>
            </div>

            {/* Terminal output */}
            <div
                ref={scrollRef}
                onClick={() => inputRef.current?.focus()}
                className="flex-1 overflow-y-auto p-3 font-mono text-xs leading-relaxed cursor-text"
            >
                {terminalHistory.map((line, i) => (
                    <div key={i} className={`${typeColors[line.type]} whitespace-pre-wrap`}>
                        <span className="text-slate-600 select-none">{typePrefix[line.type]}</span>
                        {line.text}
                    </div>
                ))}

                {/* Input line */}
                <div className="flex items-center mt-1">
                    <span className="text-emerald-400 select-none">$ </span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent outline-none text-yellow-300 caret-yellow-300 ml-1"
                        placeholder="type a git command..."
                        spellCheck={false}
                        autoComplete="off"
                    />
                </div>
            </div>

            {/* Quick commands */}
            <div className="px-3 py-2 border-t border-slate-800/40 flex flex-wrap gap-1.5">
                {['git status', 'git log', 'git branch'].map((cmd) => (
                    <button
                        key={cmd}
                        onClick={() => handleCommand(cmd)}
                        className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800/60 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors border border-slate-700/40"
                    >
                        {cmd}
                    </button>
                ))}
            </div>
        </div>
    );
}
