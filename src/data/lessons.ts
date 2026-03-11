import type { ScenarioState } from '../store/useGitStore';

// ─── Objective Types ─────────────────────────────────────────────────────────

export type ObjectiveType =
    | 'file_staged'
    | 'branch_exists'
    | 'commit_count'
    | 'merge_exists'
    | 'tag_exists'
    | 'on_branch';

export interface Objective {
    type: ObjectiveType;
    target: string; // e.g. file name, branch name, or count as string
    label: string;  // Human-readable description
}

export interface Lesson {
    id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    objectives: Objective[];
    startingState: ScenarioState;
}

// ─── Starting State Hashes ───────────────────────────────────────────────────

const L1_HASH = 'lesson-01a';
const L2_HASH = 'lesson-02a';
const L2_HASH2 = 'lesson-02b';
const L3_HASH = 'lesson-03a';
const L3_HASH2 = 'lesson-03b';
const L3_HASH3 = 'lesson-03c';

// ─── Lesson Definitions ──────────────────────────────────────────────────────

export const LESSONS: Lesson[] = [
    {
        id: 'first-commit',
        title: '📗 Lesson 1: Your First Commit',
        description:
            'Learn the basics of the Git workflow: modify files, stage them, and create your first commit. This is the foundation of everything in Git!',
        difficulty: 'beginner',
        objectives: [
            {
                type: 'file_staged',
                target: 'style.css',
                label: 'Stage style.css (drag it or run: git add style.css)',
            },
            {
                type: 'file_staged',
                target: 'app.js',
                label: 'Stage app.js',
            },
            {
                type: 'commit_count',
                target: '2',
                label: 'Create a commit (run: git commit -m "your message")',
            },
        ],
        startingState: {
            id: 'lesson-first-commit',
            name: '📗 Lesson 1: Your First Commit',
            commits: [
                {
                    hash: L1_HASH,
                    message: 'Initial commit',
                    parentHashes: [],
                    timestamp: Date.now(),
                    branch: 'main',
                },
            ],
            branches: { main: L1_HASH },
            tags: {},
            HEAD: L1_HASH,
            currentBranch: 'main',
            files: [
                { name: 'index.html', status: 'unmodified' },
                { name: 'style.css', status: 'modified' },
                { name: 'app.js', status: 'modified' },
                { name: 'README.md', status: 'unmodified' },
            ],
        },
    },
    {
        id: 'branching-out',
        title: '📘 Lesson 2: Branching Out',
        description:
            'Branches let you work on features in isolation. Learn to create a branch, switch to it, and make commits on it independently of main.',
        difficulty: 'beginner',
        objectives: [
            {
                type: 'branch_exists',
                target: 'feature',
                label: 'Create a branch called "feature" (run: git branch feature)',
            },
            {
                type: 'on_branch',
                target: 'feature',
                label: 'Switch to the "feature" branch (run: git checkout feature)',
            },
            {
                type: 'commit_count',
                target: '3',
                label: 'Make a commit on the feature branch',
            },
        ],
        startingState: {
            id: 'lesson-branching-out',
            name: '📘 Lesson 2: Branching Out',
            commits: [
                {
                    hash: L2_HASH,
                    message: 'Initial commit',
                    parentHashes: [],
                    timestamp: Date.now(),
                    branch: 'main',
                },
                {
                    hash: L2_HASH2,
                    message: 'Add homepage',
                    parentHashes: [L2_HASH],
                    timestamp: Date.now(),
                    branch: 'main',
                },
            ],
            branches: { main: L2_HASH2 },
            tags: {},
            HEAD: L2_HASH2,
            currentBranch: 'main',
            files: [
                { name: 'index.html', status: 'unmodified' },
                { name: 'style.css', status: 'modified' },
                { name: 'app.js', status: 'modified' },
            ],
        },
    },
    {
        id: 'merge-time',
        title: '📙 Lesson 3: Merge Time',
        description:
            'Two branches have diverged — the feature branch has new work. Your job is to merge it back into main to combine the changes.',
        difficulty: 'intermediate',
        objectives: [
            {
                type: 'on_branch',
                target: 'main',
                label: 'Switch to main (run: git checkout main)',
            },
            {
                type: 'merge_exists',
                target: '',
                label: 'Merge feature into main (run: git merge feature)',
            },
            {
                type: 'tag_exists',
                target: 'v1.0',
                label: 'Tag the merge as v1.0 (run: git tag v1.0)',
            },
        ],
        startingState: {
            id: 'lesson-merge-time',
            name: '📙 Lesson 3: Merge Time',
            commits: [
                {
                    hash: L3_HASH,
                    message: 'Initial commit',
                    parentHashes: [],
                    timestamp: Date.now(),
                    branch: 'main',
                },
                {
                    hash: L3_HASH2,
                    message: 'Add header component',
                    parentHashes: [L3_HASH],
                    timestamp: Date.now(),
                    branch: 'main',
                },
                {
                    hash: L3_HASH3,
                    message: 'Add login page',
                    parentHashes: [L3_HASH],
                    timestamp: Date.now(),
                    branch: 'feature',
                },
            ],
            branches: { main: L3_HASH2, feature: L3_HASH3 },
            tags: {},
            HEAD: L3_HASH3,
            currentBranch: 'feature',
            files: [
                { name: 'index.html', status: 'unmodified' },
                { name: 'login.html', status: 'unmodified' },
            ],
        },
    },
];
