import type { ScenarioState } from '../engine';

// ─── Pre-built Scenarios ─────────────────────────────────────────────────────

const h1 = 'sc-a1b2c3d4';
const h2 = 'sc-e5f6a7b8';
const h3 = 'sc-c9d0e1f2';
const h4 = 'sc-a3b4c5d6';
const h5 = 'sc-e7f8a9b0';

export interface ScenarioDefinition {
    scenario: ScenarioState;
    description: string;
    objective: string;
    hints: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const SCENARIOS: ScenarioDefinition[] = [
    {
        difficulty: 'beginner',
        description: 'Learn the basics of committing. Stage files and create your first commit.',
        objective: 'Stage both files and commit them with any message.',
        hints: [
            'Drag files from Working Directory to Staging Area',
            'Or type: git add style.css',
            'Then type: git commit -m "your message"',
        ],
        scenario: {
            id: 'first-commit',
            name: '🟢 First Commit',
            commits: [
                {
                    hash: h1,
                    message: 'Initial commit',
                    parentHashes: [],
                    timestamp: Date.now(),
                    branch: 'main',
                },
            ],
            branches: { main: h1 },
            tags: {},
            HEAD: h1,
            currentBranch: 'main',
            files: [
                { name: 'index.html', status: 'unmodified' },
                { name: 'style.css', status: 'modified' },
                { name: 'app.js', status: 'modified' },
            ],
        },
    },
    {
        difficulty: 'beginner',
        description: 'Create a new branch, switch to it, and make a commit on it.',
        objective: 'Create a branch called "feature", switch to it, and make a commit.',
        hints: [
            'Type: git checkout -b feature',
            'Stage and commit a file',
            'Check that the graph shows 2 branches',
        ],
        scenario: {
            id: 'branching-basics',
            name: '🟡 Branching Basics',
            commits: [
                {
                    hash: h1,
                    message: 'Initial commit',
                    parentHashes: [],
                    timestamp: Date.now(),
                    branch: 'main',
                },
                {
                    hash: h2,
                    message: 'Add homepage',
                    parentHashes: [h1],
                    timestamp: Date.now(),
                    branch: 'main',
                },
            ],
            branches: { main: h2 },
            tags: {},
            HEAD: h2,
            currentBranch: 'main',
            files: [
                { name: 'index.html', status: 'unmodified' },
                { name: 'style.css', status: 'modified' },
            ],
        },
    },
    {
        difficulty: 'intermediate',
        description: 'Two branches have diverged. Merge the feature branch into main.',
        objective: 'While on main, merge the "feature" branch to create a merge commit.',
        hints: [
            'Make sure you are on main: git checkout main',
            'Type: git merge feature',
            'Observe the merge commit in the graph',
        ],
        scenario: {
            id: 'merge-workflow',
            name: '🟠 Merge Workflow',
            commits: [
                {
                    hash: h1,
                    message: 'Initial commit',
                    parentHashes: [],
                    timestamp: Date.now(),
                    branch: 'main',
                },
                {
                    hash: h2,
                    message: 'Add header',
                    parentHashes: [h1],
                    timestamp: Date.now(),
                    branch: 'main',
                },
                {
                    hash: h3,
                    message: 'Add login page',
                    parentHashes: [h1],
                    timestamp: Date.now(),
                    branch: 'feature',
                },
            ],
            branches: { main: h2, feature: h3 },
            tags: {},
            HEAD: h2,
            currentBranch: 'main',
            files: [
                { name: 'index.html', status: 'unmodified' },
                { name: 'login.html', status: 'unmodified' },
            ],
        },
    },
    {
        difficulty: 'intermediate',
        description: 'Use rebase to replay your feature commits onto main for a linear history.',
        objective: 'While on "feature", rebase onto main to linearize the history.',
        hints: [
            'Switch to feature: git checkout feature',
            'Type: git rebase main',
            'Notice the commits get new hashes',
        ],
        scenario: {
            id: 'rebase-practice',
            name: '🔵 Rebase Practice',
            commits: [
                {
                    hash: h1,
                    message: 'Initial commit',
                    parentHashes: [],
                    timestamp: Date.now(),
                    branch: 'main',
                },
                {
                    hash: h2,
                    message: 'Setup config',
                    parentHashes: [h1],
                    timestamp: Date.now(),
                    branch: 'main',
                },
                {
                    hash: h3,
                    message: 'Add feature A',
                    parentHashes: [h1],
                    timestamp: Date.now(),
                    branch: 'feature',
                },
                {
                    hash: h4,
                    message: 'Add feature B',
                    parentHashes: [h3],
                    timestamp: Date.now(),
                    branch: 'feature',
                },
            ],
            branches: { main: h2, feature: h4 },
            tags: {},
            HEAD: h4,
            currentBranch: 'feature',
            files: [
                { name: 'config.json', status: 'unmodified' },
                { name: 'feature.ts', status: 'unmodified' },
            ],
        },
    },
    {
        difficulty: 'advanced',
        description: 'Cherry-pick a specific commit from one branch to another.',
        objective: 'While on main, cherry-pick the "hotfix" commit from the dev branch.',
        hints: [
            'Switch to main: git checkout main',
            'Find the hotfix commit hash in the graph',
            'Type: git cherry-pick <hash>',
        ],
        scenario: {
            id: 'cherry-pick-practice',
            name: '🔴 Cherry-Pick Challenge',
            commits: [
                {
                    hash: h1,
                    message: 'Initial commit',
                    parentHashes: [],
                    timestamp: Date.now(),
                    branch: 'main',
                },
                {
                    hash: h2,
                    message: 'Release v1.0',
                    parentHashes: [h1],
                    timestamp: Date.now(),
                    branch: 'main',
                },
                {
                    hash: h3,
                    message: 'Start dev work',
                    parentHashes: [h1],
                    timestamp: Date.now(),
                    branch: 'dev',
                },
                {
                    hash: h4,
                    message: 'Hotfix: critical bug',
                    parentHashes: [h3],
                    timestamp: Date.now(),
                    branch: 'dev',
                },
                {
                    hash: h5,
                    message: 'Continue dev work',
                    parentHashes: [h4],
                    timestamp: Date.now(),
                    branch: 'dev',
                },
            ],
            branches: { main: h2, dev: h5 },
            tags: { 'v1.0': h2 },
            HEAD: h2,
            currentBranch: 'main',
            files: [
                { name: 'app.ts', status: 'unmodified' },
                { name: 'README.md', status: 'unmodified' },
            ],
        },
    },
    {
        difficulty: 'advanced',
        description: 'DISTRESS SCENARIO 1: A developer accidentally force-pushed, orchestrating a massive loss of history. Restore it using the Undo mechanism.',
        objective: 'Restore the orphaned commits using the Undo time-travel button to mimic a reflog recovery.',
        hints: [
            'Notice your HEAD is heavily rewound.',
            'Click the Undo button to un-execute the force push.',
        ],
        scenario: {
            id: 'distress-force-push',
            name: '🚨 The Force Push',
            commits: [
                { hash: h1, message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 50000, branch: 'main' },
                { hash: h2, message: 'Setup Auth Service', parentHashes: [h1], timestamp: Date.now() - 40000, branch: 'main' },
            ],
            branches: { main: h2 },
            tags: {},
            HEAD: h2,
            currentBranch: 'main',
            files: [{ name: 'auth.ts', status: 'unmodified' }],
        },
    },
    {
        difficulty: 'advanced',
        description: 'DISTRESS SCENARIO 2: An AWS access key was just committed and pushed! Scrub it from history quickly.',
        objective: 'Soft reset the last commit, unstage the file to fix it, and re-commit safely.',
        hints: [
            'Type: git reset --soft HEAD~1',
            'Type: git commit -m "chore: remove secrets"',
        ],
        scenario: {
            id: 'distress-leaked-secret',
            name: '🔑 The Leaked Secret',
            commits: [
                { hash: h1, message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 10000, branch: 'main' },
                { hash: h2, message: 'feat: add AWS S3 upload service (with hardcoded keys)', parentHashes: [h1], timestamp: Date.now(), branch: 'main' },
            ],
            branches: { main: h2 },
            tags: {},
            HEAD: h2,
            currentBranch: 'main',
            files: [{ name: 's3.ts', status: 'unmodified' }],
        },
    },
    {
        difficulty: 'intermediate',
        description: 'DISTRESS SCENARIO 3: The CI Pipeline is building an old version of the app because a Tag is stuck in the past.',
        objective: 'Delete the stuck v1.0 tag and re-create it on the latest HEAD commit.',
        hints: [
            'Look at where the v1.0 tag is positioned in the graph.',
            'Type: git tag -d v1.0',
            'Type: git tag v1.0 HEAD',
        ],
        scenario: {
            id: 'distress-ci-stuck',
            name: '🏗️ CI Pipeline Stuck',
            commits: [
                { hash: h1, message: 'Release v1.0 initial', parentHashes: [], timestamp: Date.now() - 50000, branch: 'main' },
                { hash: h2, message: 'Hotfix: padding issue', parentHashes: [h1], timestamp: Date.now() - 30000, branch: 'main' },
                { hash: h3, message: 'Hotfix: null pointer crash', parentHashes: [h2], timestamp: Date.now() - 10000, branch: 'main' },
            ],
            branches: { main: h3 },
            tags: { 'v1.0': h1 },
            HEAD: h3,
            currentBranch: 'main',
            files: [{ name: 'app.ts', status: 'unmodified' }],
        },
    },
];
