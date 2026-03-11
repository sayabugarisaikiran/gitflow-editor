import { useLessonStore } from '../store/useLessonStore';
import type { Lesson } from '../data/lessons';

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

// ─── Lesson Picker (when no lesson is active) ───────────────────────────────

function LessonPicker({ onClose }: { onClose: () => void }) {
    const { lessons, startLesson } = useLessonStore();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#151b28] border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/60 w-[520px] max-h-[80vh] overflow-hidden animate-context-menu">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">📚</span>
                        <h2 className="text-sm font-bold text-white">Guided Lessons</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Description */}
                <div className="px-6 py-3 border-b border-slate-800/30">
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                        Step-by-step lessons to master Git. Complete objectives to progress. Your actions are checked in real-time!
                    </p>
                </div>

                {/* Lesson List */}
                <div className="p-4 space-y-3 overflow-y-auto max-h-[55vh] custom-scrollbar">
                    {lessons.map((lesson) => (
                        <button
                            key={lesson.id}
                            onClick={() => startLesson(lesson.id)}
                            className="w-full text-left rounded-xl border border-slate-700/30 bg-slate-800/30 
                                       hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all p-4 group"
                        >
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                                    {lesson.title}
                                </span>
                                <DifficultyBadge level={lesson.difficulty} />
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed mb-2.5">
                                {lesson.description}
                            </p>
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-slate-600">
                                    {lesson.objectives.length} objectives
                                </span>
                                <span className="text-[10px] font-semibold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    Start Lesson →
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Success Modal ──────────────────────────────────────────────────────────

function SuccessModal() {
    const { currentLessonId, lessons, nextLesson, exitLesson, dismissSuccess } = useLessonStore();
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
                </div>

                {/* Content */}
                <div className="px-8 py-5 text-center">
                    <p className="text-xs text-slate-400 leading-relaxed mb-5">
                        {isLastLesson
                            ? "You've completed all available lessons. You're a Git pro! 🏆"
                            : 'Ready for the next challenge? Keep building your Git mastery.'}
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
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 w-[420px] animate-slide-in">
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

                                {/* Label */}
                                <span className={`text-[10px] leading-relaxed transition-all duration-500 ${
                                    done ? 'text-emerald-300 line-through opacity-70' : 'text-slate-300'
                                }`}>
                                    {obj.label}
                                </span>
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
    const { currentLessonId, showSuccess } = useLessonStore();

    return (
        <>
            {/* Lesson Picker Modal */}
            {showPicker && !currentLessonId && <LessonPicker onClose={onClosePicker} />}

            {/* Active Lesson floating card */}
            {currentLessonId && <ActiveLessonPanel />}

            {/* Success Modal */}
            {showSuccess && <SuccessModal />}
        </>
    );
}
