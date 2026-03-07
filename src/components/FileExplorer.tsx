import { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    type DragEndEvent,
    type DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { useGitStore } from '../store/useGitStore';

// ─── Draggable File Item ────────────────────────────────────────────────────

interface DraggableFileProps {
    fileName: string;
    status: 'modified' | 'staged';
    onAction: () => void;
    actionLabel: string;
    actionColor: string;
}

function DraggableFile({ fileName, status, onAction, actionLabel, actionColor }: DraggableFileProps) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `${status}-${fileName}`,
        data: { fileName, status },
    });

    const icon = status === 'modified' ? '●' : '✓';
    const iconColor = status === 'modified' ? 'text-red-400' : 'text-emerald-400';

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`
        group flex items-center gap-2 px-2.5 py-2 rounded-lg
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging
                    ? 'opacity-30 scale-95'
                    : 'hover:bg-slate-800/50 hover:shadow-md hover:shadow-black/20'
                }
        border border-transparent hover:border-slate-700/30
      `}
        >
            {/* File icon */}
            <div className="relative">
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <span className={`absolute -top-0.5 -right-0.5 text-[8px] ${iconColor}`}>{icon}</span>
            </div>

            {/* File name */}
            <span className="text-xs text-slate-300 flex-1 truncate font-mono">
                {fileName}
            </span>

            {/* Drag handle indicator */}
            <svg className="w-3 h-3 text-slate-700 group-hover:text-slate-500 transition-colors shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
                <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
            </svg>

            {/* Action button */}
            <button
                onClick={(e) => { e.stopPropagation(); onAction(); }}
                onPointerDown={(e) => e.stopPropagation()}
                className={`
          opacity-0 group-hover:opacity-100 text-[10px] font-semibold
          ${actionColor} px-2 py-0.5 rounded transition-all
        `}
            >
                {actionLabel}
            </button>
        </div>
    );
}

// ─── Droppable Zone ─────────────────────────────────────────────────────────

interface DroppableZoneProps {
    id: string;
    children: React.ReactNode;
    label: string;
    color: string;
    count: number;
    isEmpty: boolean;
    emptyText: string;
    isOver: boolean;
}

function DroppableZone({ id, children, label, color, count, isEmpty, emptyText, isOver }: DroppableZoneProps) {
    const { setNodeRef } = useDroppable({ id });

    const colorMap: Record<string, { dot: string; badge: string; ring: string; bg: string }> = {
        red: {
            dot: 'bg-red-400',
            badge: 'bg-red-500/20 text-red-300',
            ring: 'ring-red-500/40 border-red-500/30',
            bg: 'bg-red-500/5',
        },
        green: {
            dot: 'bg-emerald-400',
            badge: 'bg-emerald-500/20 text-emerald-300',
            ring: 'ring-emerald-500/40 border-emerald-500/30',
            bg: 'bg-emerald-500/5',
        },
    };
    const c = colorMap[color];

    return (
        <div
            ref={setNodeRef}
            className={`
        rounded-lg transition-all duration-300 min-h-[80px]
        ${isOver
                    ? `${c.bg} ring-2 ${c.ring} border-dashed scale-[1.01]`
                    : 'border border-transparent'
                }
      `}
        >
            {/* Section header */}
            <h3 className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest ${color === 'red' ? 'text-red-400/80' : 'text-emerald-400/80'} mb-2 px-1`}>
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                {label}
                {count > 0 && (
                    <span className={`ml-auto text-[10px] ${c.badge} px-1.5 py-0.5 rounded-full`}>
                        {count}
                    </span>
                )}
            </h3>

            {/* Drop zone hint */}
            {isOver && (
                <div className={`text-center text-[10px] ${color === 'red' ? 'text-red-400/60' : 'text-emerald-400/60'} py-1 animate-pulse`}>
                    ↓ Drop here ↓
                </div>
            )}

            {/* Content */}
            <div className="space-y-0.5">
                {isEmpty && !isOver ? (
                    <p className="text-xs text-slate-600 italic px-2 py-3 text-center">{emptyText}</p>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

// ─── Commit Modal ───────────────────────────────────────────────────────────

function CommitModal({ onClose, onCommit }: { onClose: () => void; onCommit: (msg: string) => void }) {
    const [message, setMessage] = useState('');

    const handleSubmit = () => {
        if (message.trim()) {
            onCommit(message.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-[#151b28] border border-slate-700/50 rounded-xl shadow-2xl shadow-black/40 w-96 animate-slide-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-800/60">
                    <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Create Commit
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-1">Write a descriptive message for your commit</p>
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="feat: add new feature..."
                        autoFocus
                        className="w-full text-sm bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2.5 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono"
                    />
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-800/40 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="text-xs px-3 py-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!message.trim()}
                        className="text-xs font-semibold px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Commit Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main FileExplorer Component ────────────────────────────────────────────

export default function FileExplorer() {
    const { files, commits, currentBranch, stageFile, unstageFile, commit, modifyFile, addFile } = useGitStore();
    const [draggedItem, setDraggedItem] = useState<{ fileName: string; status: string } | null>(null);
    const [overZone, setOverZone] = useState<string | null>(null);
    const [showCommitModal, setShowCommitModal] = useState(false);

    const modifiedFiles = files.filter((f) => f.status === 'modified');
    const stagedFiles = files.filter((f) => f.status === 'staged');
    const unmodifiedFiles = files.filter((f) => f.status === 'unmodified');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const data = event.active.data.current as { fileName: string; status: string };
        setDraggedItem(data);
    };

    const handleDragOver = (event: any) => {
        setOverZone(event.over?.id ?? null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { over, active } = event;
        setDraggedItem(null);
        setOverZone(null);

        if (!over) return;

        const data = active.data.current as { fileName: string; status: string };

        // Drag from Working Directory → Staging Area
        if (data.status === 'modified' && over.id === 'staging-zone') {
            stageFile(data.fileName);
        }
        // Drag from Staging Area → Working Directory
        else if (data.status === 'staged' && over.id === 'working-zone') {
            unstageFile(data.fileName);
        }
    };

    const handleCommit = (message: string) => {
        commit(message);
    };

    return (
        <div className="h-full flex flex-col bg-[#0d1117] border-r border-slate-800/60 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-800/60 bg-[#0d1117]/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        File Explorer
                    </span>
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-medium text-indigo-300">{currentBranch}</span>
                </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDragCancel={() => { setDraggedItem(null); setOverZone(null); }}
                >
                    {/* Working Directory */}
                    <DroppableZone
                        id="working-zone"
                        label="Working Directory"
                        color="red"
                        count={modifiedFiles.length}
                        isEmpty={modifiedFiles.length === 0}
                        emptyText="No modified files — all clean ✓"
                        isOver={overZone === 'working-zone'}
                    >
                        {modifiedFiles.map((file) => (
                            <DraggableFile
                                key={file.name}
                                fileName={file.name}
                                status="modified"
                                onAction={() => stageFile(file.name)}
                                actionLabel="Stage"
                                actionColor="text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
                            />
                        ))}
                    </DroppableZone>

                    {/* Arrow indicator */}
                    <div className="flex justify-center py-2">
                        <div className="flex flex-col items-center gap-0.5 text-slate-700">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            <span className="text-[9px] uppercase tracking-wider">drag</span>
                        </div>
                    </div>

                    {/* Staging Area */}
                    <DroppableZone
                        id="staging-zone"
                        label="Staging Area (Index)"
                        color="green"
                        count={stagedFiles.length}
                        isEmpty={stagedFiles.length === 0}
                        emptyText="Drop files here to stage"
                        isOver={overZone === 'staging-zone'}
                    >
                        {stagedFiles.map((file) => (
                            <DraggableFile
                                key={file.name}
                                fileName={file.name}
                                status="staged"
                                onAction={() => unstageFile(file.name)}
                                actionLabel="Unstage"
                                actionColor="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20"
                            />
                        ))}
                    </DroppableZone>

                    {/* Drag Overlay */}
                    <DragOverlay dropAnimation={null}>
                        {draggedItem ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/90 border border-indigo-500/40 shadow-xl shadow-indigo-500/10 backdrop-blur-sm">
                                <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                <span className="text-xs font-mono text-indigo-300">{draggedItem.fileName}</span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {/* Commit Button */}
                {stagedFiles.length > 0 && (
                    <div className="mt-3 animate-slide-in">
                        <button
                            onClick={() => setShowCommitModal(true)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98]"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Commit {stagedFiles.length} file{stagedFiles.length > 1 ? 's' : ''}
                        </button>
                    </div>
                )}

                {/* Divider */}
                <div className="my-3 border-t border-slate-800/40" />

                {/* Repository (Commit log) */}
                <section>
                    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-400/80 mb-2 px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        Repository
                        <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full">
                            {commits.length}
                        </span>
                    </h3>
                    <div className="space-y-0.5">
                        {[...commits].reverse().map((c) => (
                            <div
                                key={c.hash}
                                className="flex items-start gap-2 px-2.5 py-1.5 rounded-md hover:bg-slate-800/50 transition-colors"
                            >
                                <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs text-slate-300 truncate">{c.message}</p>
                                    <p className="text-[10px] text-slate-600 font-mono">{c.hash}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Divider */}
                <div className="my-3 border-t border-slate-800/40" />

                {/* Tracked Files */}
                <section>
                    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500/80 mb-2 px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        Tracked Files
                    </h3>
                    <div className="space-y-0.5">
                        {unmodifiedFiles.map((file) => (
                            <div key={file.name} className="flex items-center gap-2 px-2.5 py-1 rounded-md">
                                <span className="text-sm text-slate-500">○</span>
                                <span className="text-xs text-slate-500 truncate font-mono">{file.name}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Simulation toolbar */}
            <div className="px-3 py-2 border-t border-slate-800/40 flex gap-1.5">
                <button
                    onClick={() => modifyFile('index.html')}
                    className="flex-1 text-[10px] font-mono px-2 py-1.5 rounded bg-slate-800/50 text-slate-500 hover:text-yellow-300 hover:bg-slate-800 transition-colors border border-slate-700/30"
                >
                    ~ modify
                </button>
                <button
                    onClick={() => addFile(`file-${Date.now().toString(36)}.ts`)}
                    className="flex-1 text-[10px] font-mono px-2 py-1.5 rounded bg-slate-800/50 text-slate-500 hover:text-emerald-300 hover:bg-slate-800 transition-colors border border-slate-700/30"
                >
                    + new
                </button>
            </div>

            {/* Commit Modal */}
            {showCommitModal && (
                <CommitModal
                    onClose={() => setShowCommitModal(false)}
                    onCommit={handleCommit}
                />
            )}
        </div>
    );
}
