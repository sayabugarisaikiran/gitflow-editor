import { create } from 'zustand';
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

    // Actions
    startLesson: (lessonId: string) => void;
    nextLesson: () => void;
    exitLesson: () => void;
    evaluateObjectives: () => void;
    dismissSuccess: () => void;
}

// ─── Win Condition Evaluator ─────────────────────────────────────────────────

function checkObjective(
    objective: Objective,
    gitState: {
        files: { name: string; status: string }[];
        branches: Record<string, string>;
        commits: { hash: string; parentHashes: string[] }[];
        tags: Record<string, string>;
        currentBranch: string;
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
    };

    return evaluators[type]?.() ?? false;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useLessonStore = create<LessonState>((set, get) => ({
    lessons: LESSONS,
    currentLessonId: null,
    objectiveResults: [],
    lessonCompleted: false,
    showSuccess: false,

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
        });
        useGitStore.getState().resetState();
    },

    dismissSuccess: () => {
        set({ showSuccess: false });
    },

    evaluateObjectives: () => {
        const { currentLessonId, lessonCompleted } = get();
        if (!currentLessonId || lessonCompleted) return;

        const lesson = LESSONS.find((l) => l.id === currentLessonId);
        if (!lesson) return;

        const gitState = useGitStore.getState();
        const results = lesson.objectives.map((obj) => checkObjective(obj, gitState));

        const allDone = results.every(Boolean);

        set({
            objectiveResults: results,
            lessonCompleted: allDone,
            showSuccess: allDone ? true : get().showSuccess,
        });
    },
}));

// ─── Auto-evaluate on git state changes ──────────────────────────────────────

useGitStore.subscribe(() => {
    const { currentLessonId } = useLessonStore.getState();
    if (currentLessonId) {
        useLessonStore.getState().evaluateObjectives();
    }
});
