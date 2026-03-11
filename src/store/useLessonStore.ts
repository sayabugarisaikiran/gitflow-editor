import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useGitStore } from './useGitStore';
import { LESSONS, type Lesson, type Objective, type ObjectiveType } from '../data/lessons';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LessonState {
    // State
    lessons: Lesson[];
    currentLessonId: string | null;
    objectiveResults: boolean[];
    lessonCompleted: boolean;
    showSuccess: boolean;

    // Progress tracking (persisted)
    completedLessons: string[];
    totalXP: number;
    pendingXP: number; // XP to display in the "+XP" toast

    // Actions
    startLesson: (lessonId: string) => void;
    nextLesson: () => void;
    exitLesson: () => void;
    evaluateObjectives: () => void;
    dismissSuccess: () => void;
    clearPendingXP: () => void;
}

// ─── Win Condition Evaluator ─────────────────────────────────────────────────

function checkObjective(
    objective: Objective,
    gitState: {
        files: { name: string; status: string }[];
        branches: Record<string, string>;
        remoteBranches: Record<string, string>;
        simulatedRemote: Record<string, string>;
        commits: { hash: string; parentHashes: string[]; message: string }[];
        tags: Record<string, string>;
        currentBranch: string;
        stashedFiles: { name: string; status: string }[];
        HEAD: string;
    }
): boolean {
    const { type, target } = objective;

    const evaluators: Record<ObjectiveType, () => boolean> = {
        file_staged: () =>
            gitState.files.some((f) => f.name === target && f.status === 'staged'),
        branch_exists: () =>
            gitState.branches[target] !== undefined,
        commit_count: () =>
            gitState.commits.length >= parseInt(target, 10),
        merge_exists: () =>
            gitState.commits.some((c) => c.parentHashes.length > 1),
        tag_exists: () =>
            gitState.tags[target] !== undefined,
        on_branch: () =>
            gitState.currentBranch === target,
        stash_exists: () =>
            gitState.stashedFiles.length > 0,
        remote_pushed: () => {
            // Remote pointer matches local branch
            const localHash = gitState.branches[target] ?? gitState.branches['main'];
            const remoteHash = gitState.remoteBranches[`origin/${target}`]
                ?? gitState.remoteBranches['origin/main'];
            return !!(localHash && remoteHash && localHash === remoteHash);
        },
        commit_reverted: () =>
            gitState.commits.some((c) => c.message.toLowerCase().startsWith('revert')),
        head_detached: () =>
            !Object.values(gitState.branches).includes(gitState.HEAD) === false
            ? false
            : !Object.entries(gitState.branches).some(([, hash]) => hash === gitState.HEAD),
        file_committed: () =>
            gitState.commits.some((c) => c.message.toLowerCase().includes(target.toLowerCase())),
        branch_count: () =>
            Object.keys(gitState.branches).length >= parseInt(target, 10),
    };

    return evaluators[type]?.() ?? false;
}

// ─── Persisted Progress Store ─────────────────────────────────────────────────

interface ProgressState {
    completedLessons: string[];
    totalXP: number;
}

const progressStore = (() => {
    const KEY = 'gitflow-lesson-progress';
    const load = (): ProgressState => {
        try {
            return JSON.parse(localStorage.getItem(KEY) ?? '{}');
        } catch {
            return { completedLessons: [], totalXP: 0 };
        }
    };
    const save = (state: ProgressState) => {
        localStorage.setItem(KEY, JSON.stringify(state));
    };
    return { load, save };
})();

// ─── Store ───────────────────────────────────────────────────────────────────

const initialProgress = (() => {
    try {
        const saved = progressStore.load();
        return {
            completedLessons: saved.completedLessons ?? [],
            totalXP: saved.totalXP ?? 0,
        };
    } catch {
        return { completedLessons: [] as string[], totalXP: 0 };
    }
})();

export const useLessonStore = create<LessonState>((set, get) => ({
    lessons: LESSONS,
    currentLessonId: null,
    objectiveResults: [],
    lessonCompleted: false,
    showSuccess: false,
    pendingXP: 0,

    // Persisted progress
    completedLessons: initialProgress.completedLessons,
    totalXP: initialProgress.totalXP,

    startLesson: (lessonId: string) => {
        const lesson = LESSONS.find((l) => l.id === lessonId);
        if (!lesson) return;

        // Load the lesson's starting state into the git store
        useGitStore.getState().loadScenario(lesson.startingState);

        set({
            currentLessonId: lessonId,
            objectiveResults: new Array(lesson.objectives.length).fill(false),
            lessonCompleted: false,
            showSuccess: false,
            pendingXP: 0,
        });
    },

    nextLesson: () => {
        const { currentLessonId } = get();
        const idx = LESSONS.findIndex((l) => l.id === currentLessonId);
        if (idx >= 0 && idx < LESSONS.length - 1) {
            get().startLesson(LESSONS[idx + 1].id);
        } else {
            // Last lesson completed — exit
            get().exitLesson();
        }
    },

    exitLesson: () => {
        set({
            currentLessonId: null,
            objectiveResults: [],
            lessonCompleted: false,
            showSuccess: false,
            pendingXP: 0,
        });
        useGitStore.getState().resetState();
    },

    dismissSuccess: () => {
        set({ showSuccess: false });
    },

    clearPendingXP: () => {
        set({ pendingXP: 0 });
    },

    evaluateObjectives: () => {
        const { currentLessonId, lessonCompleted, completedLessons } = get();
        if (!currentLessonId || lessonCompleted) return;

        const lesson = LESSONS.find((l) => l.id === currentLessonId);
        if (!lesson) return;

        const gitState = useGitStore.getState();
        const results = lesson.objectives.map((obj) => checkObjective(obj, gitState));

        const allDone = results.every(Boolean);

        if (allDone && !lessonCompleted) {
            // Award XP if it's a new completion
            const isNew = !completedLessons.includes(currentLessonId);
            const newXP = isNew ? lesson.xp : 0;
            const updatedCompleted = isNew
                ? [...completedLessons, currentLessonId]
                : completedLessons;
            const updatedTotalXP = isNew
                ? (get().totalXP + newXP)
                : get().totalXP;

            progressStore.save({ completedLessons: updatedCompleted, totalXP: updatedTotalXP });

            set({
                objectiveResults: results,
                lessonCompleted: true,
                showSuccess: true,
                completedLessons: updatedCompleted,
                totalXP: updatedTotalXP,
                pendingXP: isNew ? newXP : 0,
            });
        } else {
            set({ objectiveResults: results });
        }
    },
}));

// ─── Auto-evaluate on git state changes ──────────────────────────────────────

useGitStore.subscribe(() => {
    const { currentLessonId } = useLessonStore.getState();
    if (currentLessonId) {
        useLessonStore.getState().evaluateObjectives();
    }
});
