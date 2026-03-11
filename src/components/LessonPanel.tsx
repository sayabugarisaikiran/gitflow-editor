import { useState, useEffect } from 'react';
import { useLessonStore } from '../store/useLessonStore';
import type { Lesson } from '../data/lessons';

// ─── XP Toast ────────────────────────────────────────────────────────────────

function XPToast({ xp, onDone }: { xp: number; onDone: () => void }) {
    useEffect(() => {
        const timer = setTimeout(onDone, 2500);
        return () => clearTimeout(timer);
    }, [onDone]);

    return (
        <div className="fixed top-16 right-6 z-[200] animate-slide-in pointer-events-none">
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg shadow-amber-500/30">
                <span className="text-lg">⭐</span>
                +{xp} XP
            </div>
        </div>
    );
}

// ─── Difficulty Badge ────────────────────────────────────────────────────────

function DifficultyBadge({ level }: { level: Lesson['difficulty'] }) {
    const colors = {
        beginner: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        intermediate: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
        advanced: 'text-red-400 bg-red-500/15 border-red-500/30',
    };
    return (
        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-px rounded-full border ${colors[level]}`}>
            {level}
        </span>
    );
}

// ─── XP Bar ──────────────────────────────────────────────────────────────────

function XPBar({ completed, total, xp }: { completed: number; total: number; xp: number }) {
    const MAX_XP = 2050; // sum of all lesson XP
    const percent = Math.min((xp / MAX_XP) * 100, 100);

    return (
        <div className="px-6 py-3 border-b border-slate-800/30">
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-slate-400 font-semibold">
                    {completed}/{total} lessons complete
                </span>
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    ⭐ {xp} XP
                </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-700"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

// ─── Lesson Picker ───────────────────────────────────────────────────────────

type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

function LessonPicker({ onClose }: { onClose: () => void }) {
    const { lessons, startLesson, completedLessons, totalXP } = useLessonStore();
    const [filter, setFilter] = useState<DifficultyFilter>('all');

    const filtered = filter === 'all' ? lessons : lessons.filter((l) => l.difficulty === filter);
    const completedCount = completedLessons.length;

    const tabClass = (f: DifficultyFilter) =>
        `text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full transition-colors border ${
            filter === f
                ? {
                    all: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
                    beginner: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    intermediate: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                    advanced: 'bg-red-500/20 text-red-300 border-red-500/40',
                }[f]
                : 'bg-slate-800/40 text-slate-500 border-slate-700/30 hover:text-slate-300 hover:border-slate-600/40'
        }`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#151b28] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 w-[560px] max-h-[85vh] overflow-hidden animate-context-menu flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">📚</span>
                        <h2 className="text-sm font-bold text-white">Guided Lessons</h2>
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-px rounded-full font-bold">
                            {lessons.length} lessons
                        </span>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* XP Progress */}
                <XPBar completed={completedCount} total={lessons.length} xp={totalXP} />

                {/* Difficulty Filters */}
                <div className="px-6 py-2.5 border-b border-slate-800/30 flex gap-1.5 shrink-0">
                    {(['all', 'beginner', 'intermediate', 'advanced'] as DifficultyFilter[]).map((f) => (
                        <button key={f} onClick={() => setFilter(f)} className={tabClass(f)}>
                            {f}
                        </button>
                    ))}
                </div>

                {/* Lesson List */}
                <div className="p-4 space-y-2 overflow-y-auto custom-scrollbar flex-1">
                    {filtered.map((lesson) => {
                        const isDone = completedLessons.includes(lesson.id);
                        return (
                            <button
                                key={lesson.id}
                                onClick={() => startLesson(lesson.id)}
                                className={`w-full text-left rounded-xl border transition-all p-4 group ${
                                    isDone
                                        ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400/50 hover:bg-emerald-500/10'
                                        : 'border-slate-700/30 bg-slate-800/30 hover:border-indigo-500/40 hover:bg-indigo-500/5'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {isDone ? (
                                            <span className="text-emerald-400 text-sm shrink-0">✅</span>
                                        ) : (
                                            <span className="text-slate-600 text-sm shrink-0">○</span>
                                        )}
                                        <span className={`text-xs font-bold truncate ${isDone ? 'text-emerald-300' : 'text-white group-hover:text-indigo-300'} transition-colors`}>
                                            {lesson.title}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <DifficultyBadge level={lesson.difficulty} />
                                        <span className="text-[9px] text-amber-400 font-bold">+{lesson.xp} XP</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 leading-relaxed mb-2 ml-6">
                                    {lesson.description}
                                </p>
                                <div className="flex items-center justify-between ml-6">
                                    <span className="text-[9px] text-slate-600">
                                        {lesson.objectives.length} objectives
                                    </span>
                                    <span className={`text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ${isDone ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                        {isDone ? '↩ Replay' : 'Start'} →
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Success Modal ──────────────────────────────────────────────────────────

function SuccessModal() {
    const { currentLessonId, lessons, nextLesson, exitLesson, dismissSuccess, pendingXP } = useLessonStore();
    const currentIndex = lessons.findIndex((l) => l.id === currentLessonId);
    const isLastLesson = currentIndex >= lessons.length - 1;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#151b28] border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-500/10 w-[420px] overflow-hidden animate-context-menu">
                {/* Celebration header */}
                <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-8 pt-8 pb-6 text-center border-b border-emerald-500/20">
                    <div className="text-5xl mb-3 animate-bounce-slow">🎉</div>
                    <h2 className="text-xl font-bold text-white mb-1">Lesson Complete!</h2>
                    <p className="text-sm text-emerald-300/80">You nailed every objective!</p>
                    {pendingXP > 0 && (
                        <div className="mt-3 inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full px-3 py-1">
                            <span>⭐</span>
                            <span className="text-sm font-bold text-amber-300">+{pendingXP} XP earned!</span>
                        </div>
                    )}
                </div>

                {/* Next lesson preview */}
                {!isLastLesson && (
                    <div className="px-8 pt-4 pb-0">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Up Next</p>
                        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30">
                            <p className="text-xs font-semibold text-white">{lessons[currentIndex + 1]?.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{lessons[currentIndex + 1]?.description.slice(0, 80)}…</p>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="px-8 py-5 text-center">
                    <p className="text-xs text-slate-400 leading-relaxed mb-5">
                        {isLastLesson
                            ? "You've completed all lessons. You're a Git expert! 🏆"
                            : 'Ready for the next challenge?'}
                    </p>

                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={() => { dismissSuccess(); exitLesson(); }}
                            className="text-xs px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/40"
                        >
                            Exit to Sandbox
                        </button>
                        {!isLastLesson ? (
                            <button
                                onClick={nextLesson}
                                className="text-xs font-semibold px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white transition-all shadow-lg shadow-emerald-500/20"
                            >
                                Next Lesson →
                            </button>
                        ) : (
                            <button
                                onClick={() => { dismissSuccess(); exitLesson(); }}
                                className="text-xs font-semibold px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white transition-all shadow-lg shadow-amber-500/20"
                            >
                                🏆 Finish!
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Active Lesson Panel (floating card) ────────────────────────────────────

function ActiveLessonPanel() {
    const { currentLessonId, lessons, objectiveResults, exitLesson } = useLessonStore();
    const lesson = lessons.find((l) => l.id === currentLessonId);

    if (!lesson) return null;

    const completedCount = objectiveResults.filter(Boolean).length;
    const totalCount = lesson.objectives.length;
    const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[440px] animate-slide-in">
            <div className="bg-[#151b28]/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl shadow-black/40 overflow-hidden">
                {/* Progress bar */}
                <div className="h-1 bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 ease-out"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Header */}
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800/40">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs">📚</span>
                        <h3 className="text-[11px] font-bold text-white truncate">{lesson.title}</h3>
                        <DifficultyBadge level={lesson.difficulty} />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] text-amber-400 font-bold">+{lesson.xp} XP</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                            {completedCount}/{totalCount}
                        </span>
                        <button
                            onClick={exitLesson}
                            className="text-slate-600 hover:text-red-400 transition-colors p-0.5"
                            title="Exit lesson"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Description */}
                <div className="px-4 py-2">
                    <p className="text-[10px] text-slate-400 leading-relaxed">{lesson.description}</p>
                </div>

                {/* Objectives Checklist */}
                <div className="px-4 pb-3 space-y-1.5">
                    {lesson.objectives.map((obj, idx) => {
                        const done = objectiveResults[idx];
                        return (
                            <div
                                key={idx}
                                className={`flex items-start gap-2.5 px-3 py-2 rounded-lg transition-all duration-500 ${
                                    done
                                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                                        : 'bg-slate-800/30 border border-slate-700/20'
                                }`}
                            >
                                {/* Check indicator */}
                                <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                                    done
                                        ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/30'
                                        : 'border-2 border-slate-600'
                                }`}>
                                    {done && (
                                        <svg className="w-2.5 h-2.5 animate-check-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>

                                {/* Label + hint */}
                                <div className="flex-1 min-w-0">
                                    <span className={`text-[10px] leading-relaxed transition-all duration-500 block ${
                                        done ? 'text-emerald-300 line-through opacity-70' : 'text-slate-300'
                                    }`}>
                                        {obj.label}
                                    </span>
                                    {!done && obj.hint && (
                                        <span className="text-[9px] text-slate-600 mt-0.5 block">
                                            💡 {obj.hint}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function LessonPanel({ showPicker, onClosePicker }: { showPicker: boolean; onClosePicker: () => void }) {
    const { currentLessonId, showSuccess, pendingXP, clearPendingXP } = useLessonStore();

    return (
        <>
            {/* XP Toast */}
            {pendingXP > 0 && <XPToast xp={pendingXP} onDone={clearPendingXP} />}

            {/* Lesson Picker Modal */}
            {showPicker && !currentLessonId && <LessonPicker onClose={onClosePicker} />}

            {/* Active Lesson floating card */}
            {currentLessonId && <ActiveLessonPanel />}

            {/* Success Modal */}
            {showSuccess && <SuccessModal />}
        </>
    );
}
