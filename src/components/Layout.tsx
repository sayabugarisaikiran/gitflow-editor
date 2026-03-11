import { useState, useCallback } from 'react';
import FileExplorer from './FileExplorer';
import CommitGraph from './CommitGraph';
import GitTerminal from './GitTerminal';
import CommitInspector from './CommitInspector';
import OnboardingOverlay from './OnboardingOverlay';
import ScenarioPanel from './ScenarioPanel';
import LessonPanel from './LessonPanel';
import KeyboardShortcuts, { useKeyboardShortcuts } from './KeyboardShortcuts';
import { useGitStore } from '../store/useGitStore';
import { useLessonStore } from '../store/useLessonStore';
import { exportStateToURL } from '../hooks/useURLState';

export default function Layout() {
    const { resetState, terminalHistory, stashedFiles, selectCommit, activeScenario } = useGitStore();
    const { currentLessonId } = useLessonStore();
    const [copied, setCopied] = useState(false);
    const [showScenarios, setShowScenarios] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showLessons, setShowLessons] = useState(false);
    const [shareCopied, setShareCopied] = useState(false);

    const handleShareURL = () => {
        const url = exportStateToURL();
        navigator.clipboard.writeText(url).then(() => {
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2000);
        });
    };

    const handleExportCommands = () => {
        const commands = terminalHistory
            .filter((l) => l.type === 'command')
            .map((l) => l.text)
            .join('\n');
        navigator.clipboard.writeText(commands).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onToggleHelp: useCallback(() => setShowShortcuts((v) => !v), []),
        onToggleScenarios: useCallback(() => setShowScenarios((v) => !v), []),
        onCloseInspector: useCallback(() => selectCommit(null), [selectCommit]),
        onEscape: useCallback(() => {
            setShowShortcuts(false);
            setShowScenarios(false);
            selectCommit(null);
        }, [selectCommit]),
    });

    return (
        <div className="h-screen w-screen flex flex-col bg-[#0a0e17] overflow-hidden">
            {/* Onboarding */}
            <OnboardingOverlay />

            {/* Keyboard Shortcuts */}
            {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}

            {/* Scenario Panel */}
            {showScenarios && <ScenarioPanel onClose={() => setShowScenarios(false)} />}

            {/* Lesson Panel */}
            <LessonPanel showPicker={showLessons} onClosePicker={() => setShowLessons(false)} />

            {/* Top bar */}
            <header className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800/60 bg-[#0d1117]/90 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.035 5.257c0 1.02-.504 1.907-1.26 2.467a2.922 2.922 0 01-2.665 3.036l-.068.005v.462c0 .636-.264 1.21-.688 1.62a7.455 7.455 0 01-2.422 1.567c-.67.302-1.378.532-2.074.69v1.226a2.923 2.923 0 011.257 5.132 2.922 2.922 0 01-4.527-1.576 2.922 2.922 0 011.258-3.148L9.9 15.604l-.044-.005a10.91 10.91 0 01-2.074-.69 7.455 7.455 0 01-2.422-1.567 2.317 2.317 0 01-.687-1.62v-.462l-.068-.005a2.922 2.922 0 01-1.404-5.503A2.922 2.922 0 016.462 5.27V5c0-.278.226-.504.504-.504s.504.226.504.504v.783a2.922 2.922 0 01-1.465 5.056l-.068.005v.462c0 .37.155.724.424.976.571.54 1.308.96 2.099 1.261.629.24 1.29.413 1.921.514V7.744a2.922 2.922 0 01-1.258-5.133 2.922 2.922 0 014.527 1.576 2.922 2.922 0 01-1.258 3.149l.055 6.312c.63-.101 1.291-.274 1.92-.514.791-.301 1.528-.72 2.1-1.261.268-.252.423-.606.423-.976v-.462l-.068-.005a2.922 2.922 0 01-.26-5.568A2.922 2.922 0 0121.035 5.257z" />
                        </svg>
                        <h1 className="text-sm font-bold tracking-tight">
                            <span className="text-slate-300">GitFlow</span>
                            <span className="text-indigo-400">Editor</span>
                        </h1>
                    </div>
                    <span className="text-[10px] text-slate-600 bg-slate-800/60 px-1.5 py-0.5 rounded font-mono">
                        v6.0
                    </span>
                    {activeScenario && (
                        <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                            🎯 Scenario
                        </span>
                    )}
                    {stashedFiles.length > 0 && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
                            📦 {stashedFiles.length} stashed
                        </span>
                    )}
                    {currentLessonId && (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-pulse">
                            📚 Lesson Active
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 hidden xl:block">
                        Click • Double-click • Right-click  |  Press <kbd className="text-[9px] font-mono text-slate-400 bg-slate-800 border border-slate-700/60 rounded px-1">?</kbd> for shortcuts
                    </span>
                    <button
                        onClick={() => setShowLessons(!showLessons)}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors border ${showLessons
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800/50 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 border-slate-700/40'
                            }`}
                        title="Open guided lessons"
                    >
                        📚 Lessons
                    </button>
                    <button
                        onClick={() => setShowScenarios(!showScenarios)}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors border ${showScenarios
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-slate-800/50 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 border-slate-700/40'
                            }`}
                        title="Toggle scenarios"
                    >
                        🎯 Scenarios
                    </button>
                    <button
                        onClick={handleShareURL}
                        className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-800/50 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors border border-slate-700/40"
                        title="Copy shareable URL to clipboard"
                    >
                        {shareCopied ? '✓ Link Copied!' : '🔗 Share'}
                    </button>
                    <button
                        onClick={handleExportCommands}
                        className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-800/50 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 transition-colors border border-slate-700/40"
                        title="Copy all commands to clipboard"
                    >
                        {copied ? '✓ Copied!' : '📋 Export'}
                    </button>
                    <button
                        onClick={resetState}
                        className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-800/50 text-slate-400 hover:text-red-300 hover:bg-slate-800 transition-colors border border-slate-700/40"
                        title="Reset everything"
                    >
                        ↺ reset
                    </button>
                </div>
            </header>

            {/* 3-Pane Layout */}
            <div className="flex-1 grid grid-cols-[280px_1fr_380px] overflow-hidden">
                <FileExplorer />
                <CommitGraph />
                <GitTerminal />
            </div>

            {/* Commit Inspector (slide-out) */}
            <CommitInspector />
        </div>
    );
}
