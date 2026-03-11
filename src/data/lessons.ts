import type { ScenarioState } from '../engine';

// ─── Objective Types ─────────────────────────────────────────────────────────

export type ObjectiveType =
    | 'file_staged'
    | 'branch_exists'
    | 'commit_count'
    | 'merge_exists'
    | 'tag_exists'
    | 'on_branch'
    | 'stash_exists'
    | 'remote_pushed'
    | 'commit_reverted'
    | 'head_detached'
    | 'file_committed'
    | 'branch_count';

export interface Objective {
    type: ObjectiveType;
    target: string; // e.g. file name, branch name, or count as string
    label: string;  // Human-readable description
    hint?: string;  // Optional hint to show if user is stuck
}

export interface Lesson {
    id: string;
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    xp: number;
    objectives: Objective[];
    startingState: ScenarioState;
}

// ─── Starting State Hashes ───────────────────────────────────────────────────

const h = (id: string) => `lesson-hash-${id}`;

// ─── Lesson Definitions ──────────────────────────────────────────────────────

export const LESSONS: Lesson[] = [
    // ─── BEGINNER ──────────────────────────────────────────────────────────────
    {
        id: 'first-commit',
        title: '1. Your First Commit',
        description:
            'Learn the basics: modify files, stage them, and create your first commit. This is the foundation of everything in Git!',
        difficulty: 'beginner',
        xp: 50,
        objectives: [
            {
                type: 'file_staged',
                target: 'style.css',
                label: 'Stage style.css',
                hint: 'Drag style.css into the Staging Area, or run: git add style.css',
            },
            {
                type: 'file_staged',
                target: 'app.js',
                label: 'Stage app.js',
                hint: 'Drag app.js into the Staging Area, or run: git add app.js',
            },
            {
                type: 'commit_count',
                target: '2',
                label: 'Create a commit',
                hint: 'Run: git commit -m "your message", or click the Commit button',
            },
        ],
        startingState: {
            id: 'lesson-first-commit',
            name: 'Lesson 1: Your First Commit',
            commits: [{ hash: h('1a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 10000, branch: 'main' }],
            branches: { main: h('1a') },
            tags: {},
            HEAD: h('1a'),
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
        title: '2. Branching Out',
        description:
            'Branches let you work on features in isolation. Create a branch, switch to it, and commit independently of main.',
        difficulty: 'beginner',
        xp: 50,
        objectives: [
            {
                type: 'branch_exists',
                target: 'feature',
                label: 'Create a branch called "feature"',
                hint: 'Run: git branch feature',
            },
            {
                type: 'on_branch',
                target: 'feature',
                label: 'Switch to the "feature" branch',
                hint: 'Run: git checkout feature',
            },
            {
                type: 'commit_count',
                target: '3',
                label: 'Make a commit on the feature branch',
                hint: 'Stage a file, then run: git commit -m "feature work"',
            },
        ],
        startingState: {
            id: 'lesson-branching-out',
            name: 'Lesson 2: Branching Out',
            commits: [
                { hash: h('2a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 20000, branch: 'main' },
                { hash: h('2b'), message: 'Add homepage', parentHashes: [h('2a')], timestamp: Date.now() - 10000, branch: 'main' },
            ],
            branches: { main: h('2b') },
            tags: {},
            HEAD: h('2b'),
            currentBranch: 'main',
            files: [
                { name: 'index.html', status: 'unmodified' },
                { name: 'style.css', status: 'modified' },
                { name: 'app.js', status: 'modified' },
            ],
        },
    },
    {
        id: 'tagging-releases',
        title: '3. Tagging Releases',
        description:
            'Tags mark important milestones like release versions. Learn to create a commit and tag it as a release.',
        difficulty: 'beginner',
        xp: 50,
        objectives: [
            {
                type: 'file_staged',
                target: 'CHANGELOG.md',
                label: 'Stage CHANGELOG.md',
                hint: 'Drag CHANGELOG.md to the Staging Area or run: git add CHANGELOG.md',
            },
            {
                type: 'commit_count',
                target: '2',
                label: 'Create a release commit',
                hint: 'Run: git commit -m "Release v1.0"',
            },
            {
                type: 'tag_exists',
                target: 'v1.0',
                label: 'Tag the commit as v1.0',
                hint: 'Run: git tag v1.0',
            },
        ],
        startingState: {
            id: 'lesson-tagging',
            name: 'Lesson 3: Tagging Releases',
            commits: [
                { hash: h('3a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 10000, branch: 'main' },
            ],
            branches: { main: h('3a') },
            tags: {},
            HEAD: h('3a'),
            currentBranch: 'main',
            files: [
                { name: 'index.html', status: 'unmodified' },
                { name: 'CHANGELOG.md', status: 'modified' },
            ],
        },
    },
    // ─── INTERMEDIATE ──────────────────────────────────────────────────────────
    {
        id: 'merge-time',
        title: '4. Merge Time',
        description:
            'Two branches have diverged. Merge the feature branch back into main to combine the work.',
        difficulty: 'intermediate',
        xp: 100,
        objectives: [
            {
                type: 'on_branch',
                target: 'main',
                label: 'Switch to main',
                hint: 'Run: git checkout main',
            },
            {
                type: 'merge_exists',
                target: '',
                label: 'Merge feature into main',
                hint: 'Run: git merge feature',
            },
            {
                type: 'tag_exists',
                target: 'v1.0',
                label: 'Tag the merge commit as v1.0',
                hint: 'Run: git tag v1.0',
            },
        ],
        startingState: {
            id: 'lesson-merge-time',
            name: 'Lesson 4: Merge Time',
            commits: [
                { hash: h('4a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 30000, branch: 'main' },
                { hash: h('4b'), message: 'Add header component', parentHashes: [h('4a')], timestamp: Date.now() - 20000, branch: 'main' },
                { hash: h('4c'), message: 'Add login page', parentHashes: [h('4a')], timestamp: Date.now() - 10000, branch: 'feature' },
            ],
            branches: { main: h('4b'), feature: h('4c') },
            tags: {},
            HEAD: h('4c'),
            currentBranch: 'feature',
            files: [
                { name: 'index.html', status: 'unmodified' },
                { name: 'login.html', status: 'unmodified' },
            ],
        },
    },
    {
        id: 'hotfix-workflow',
        title: '5. The Hotfix Workflow',
        description:
            'Production is broken! Create a hotfix branch from main, fix the bug, and merge it back — a critical real-world pattern.',
        difficulty: 'intermediate',
        xp: 100,
        objectives: [
            {
                type: 'branch_exists',
                target: 'hotfix',
                label: 'Create a "hotfix" branch',
                hint: 'Run: git branch hotfix  (or right-click a commit → Create branch here)',
            },
            {
                type: 'on_branch',
                target: 'hotfix',
                label: 'Switch to the hotfix branch',
                hint: 'Run: git checkout hotfix',
            },
            {
                type: 'commit_count',
                target: '3',
                label: 'Commit the fix on the hotfix branch',
                hint: 'Stage a file and run: git commit -m "fix: critical bug"',
            },
            {
                type: 'on_branch',
                target: 'main',
                label: 'Switch back to main',
                hint: 'Run: git checkout main',
            },
            {
                type: 'merge_exists',
                target: '',
                label: 'Merge hotfix into main',
                hint: 'Run: git merge hotfix',
            },
        ],
        startingState: {
            id: 'lesson-hotfix',
            name: 'Lesson 5: The Hotfix Workflow',
            commits: [
                { hash: h('5a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 30000, branch: 'main' },
                { hash: h('5b'), message: 'Release v1.0', parentHashes: [h('5a')], timestamp: Date.now() - 20000, branch: 'main' },
                { hash: h('5c'), message: 'Feature: dark mode', parentHashes: [h('5b')], timestamp: Date.now() - 10000, branch: 'develop' },
            ],
            branches: { main: h('5b'), develop: h('5c') },
            tags: { 'v1.0': h('5b') },
            HEAD: h('5b'),
            currentBranch: 'main',
            files: [
                { name: 'index.html', status: 'modified' },
                { name: 'app.js', status: 'unmodified' },
            ],
        },
    },
    {
        id: 'selective-staging',
        title: '6. Selective Staging',
        description:
            'You can stage only specific files, creating focused commits. Stage just the bug fix, not the incomplete feature.',
        difficulty: 'intermediate',
        xp: 100,
        objectives: [
            {
                type: 'file_staged',
                target: 'bugfix.js',
                label: 'Stage only bugfix.js (not the others)',
                hint: 'Drag bugfix.js to the Staging Area or run: git add bugfix.js',
            },
            {
                type: 'commit_count',
                target: '2',
                label: 'Create a focused commit with just the bugfix',
                hint: 'Run: git commit -m "fix: resolve null pointer"',
            },
        ],
        startingState: {
            id: 'lesson-selective-staging',
            name: 'Lesson 6: Selective Staging',
            commits: [
                { hash: h('6a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 10000, branch: 'main' },
            ],
            branches: { main: h('6a') },
            tags: {},
            HEAD: h('6a'),
            currentBranch: 'main',
            files: [
                { name: 'bugfix.js', status: 'modified' },
                { name: 'feature-wip.js', status: 'modified' },
                { name: 'experiment.js', status: 'modified' },
                { name: 'README.md', status: 'unmodified' },
            ],
        },
    },
    {
        id: 'remote-push-pull',
        title: '7. Remote: Push & Pull',
        description:
            'Collaborate by pushing your commits to a remote and pulling updates from teammates. This is the core of team-based Git.',
        difficulty: 'intermediate',
        xp: 100,
        objectives: [
            {
                type: 'commit_count',
                target: '2',
                label: 'Make a new local commit',
                hint: 'Stage a file and run: git commit -m "local change"',
            },
            {
                type: 'remote_pushed',
                target: 'main',
                label: 'Push your commits to origin/main',
                hint: 'Run: git push',
            },
        ],
        startingState: {
            id: 'lesson-remote',
            name: 'Lesson 7: Remote: Push & Pull',
            commits: [
                { hash: h('7a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 10000, branch: 'main' },
            ],
            branches: { main: h('7a') },
            tags: {},
            HEAD: h('7a'),
            currentBranch: 'main',
            files: [
                { name: 'index.html', status: 'modified' },
                { name: 'README.md', status: 'unmodified' },
            ],
        },
    },
    {
        id: 'stash-and-pop',
        title: '8. Stash & Pop',
        description:
            'You need to switch branches but you\'re not ready to commit. Git stash saves your changes temporarily so you can come back to them.',
        difficulty: 'intermediate',
        xp: 100,
        objectives: [
            {
                type: 'stash_exists',
                target: '',
                label: 'Stash your current changes',
                hint: 'Run: git stash',
            },
            {
                type: 'on_branch',
                target: 'hotfix',
                label: 'Switch to the hotfix branch',
                hint: 'Run: git checkout hotfix',
            },
            {
                type: 'commit_count',
                target: '2',
                label: 'Make a commit on hotfix',
                hint: 'Stage a file and commit on the hotfix branch',
            },
        ],
        startingState: {
            id: 'lesson-stash',
            name: 'Lesson 8: Stash & Pop',
            commits: [
                { hash: h('8a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 20000, branch: 'main' },
            ],
            branches: { main: h('8a'), hotfix: h('8a') },
            tags: {},
            HEAD: h('8a'),
            currentBranch: 'main',
            files: [
                { name: 'style.css', status: 'modified' },
                { name: 'app.js', status: 'modified' },
                { name: 'index.html', status: 'unmodified' },
            ],
        },
    },
    // ─── ADVANCED ──────────────────────────────────────────────────────────────
    {
        id: 'resolving-conflicts',
        title: '9. Resolving a Merge Conflict',
        description:
            'Two branches changed the same file. Git can\'t auto-merge, so you must manually resolve the conflict. A critical real-world skill.',
        difficulty: 'advanced',
        xp: 200,
        objectives: [
            {
                type: 'on_branch',
                target: 'main',
                label: 'Switch to main',
                hint: 'Run: git checkout main',
            },
            {
                type: 'merge_exists',
                target: '',
                label: 'Attempt to merge "feature" (a conflict will occur)',
                hint: 'Run: git merge feature — then resolve in the modal',
            },
            {
                type: 'commit_count',
                target: '4',
                label: 'Complete the merge by committing the resolution',
                hint: 'After resolving the conflict dialog, the merge will auto-commit',
            },
        ],
        startingState: {
            id: 'lesson-conflict',
            name: 'Lesson 9: Resolving a Merge Conflict',
            commits: [
                { hash: h('9a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 40000, branch: 'main' },
                { hash: h('9b'), message: 'Update styles on main', parentHashes: [h('9a')], timestamp: Date.now() - 30000, branch: 'main' },
                { hash: h('9c'), message: 'Update styles on feature', parentHashes: [h('9a')], timestamp: Date.now() - 20000, branch: 'feature' },
            ],
            branches: { main: h('9b'), feature: h('9c') },
            tags: {},
            HEAD: h('9c'),
            currentBranch: 'feature',
            files: [
                { name: 'styles.css', status: 'unmodified' },
                { name: 'index.html', status: 'unmodified' },
            ],
        },
    },
    {
        id: 'undo-with-reset',
        title: '10. Undoing with Reset',
        description:
            'Made a bad commit? git reset moves your branch pointer back in history. Learn the three modes: soft, mixed, and hard.',
        difficulty: 'advanced',
        xp: 200,
        objectives: [
            {
                type: 'commit_count',
                target: '2',
                label: 'The last commit was a mistake — reset it',
                hint: 'Right-click the previous commit → Reset HEAD (Mixed), or run: git reset HEAD~1',
            },
            {
                type: 'file_staged',
                target: 'fix.js',
                label: 'Re-stage fix.js as a clean, separate commit',
                hint: 'Run: git add fix.js',
            },
            {
                type: 'commit_count',
                target: '3',
                label: 'Commit the clean version',
                hint: 'Run: git commit -m "clean: separate concerns"',
            },
        ],
        startingState: {
            id: 'lesson-reset',
            name: 'Lesson 10: Undoing with Reset',
            commits: [
                { hash: h('10a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 20000, branch: 'main' },
                { hash: h('10b'), message: 'WIP: mixed changes (bad commit)', parentHashes: [h('10a')], timestamp: Date.now() - 10000, branch: 'main' },
            ],
            branches: { main: h('10b') },
            tags: {},
            HEAD: h('10b'),
            currentBranch: 'main',
            files: [
                { name: 'fix.js', status: 'unmodified' },
                { name: 'experiment.js', status: 'unmodified' },
                { name: 'index.html', status: 'unmodified' },
            ],
        },
    },
    {
        id: 'safe-undo-revert',
        title: '11. Safe Undo with Revert',
        description:
            'Unlike reset, revert creates a new commit that undoes a previous one — safe for shared/public branches where rewriting history is dangerous.',
        difficulty: 'advanced',
        xp: 200,
        objectives: [
            {
                type: 'commit_reverted',
                target: '',
                label: 'Revert the bad commit',
                hint: 'Right-click the bad commit → Revert this commit',
            },
            {
                type: 'commit_count',
                target: '4',
                label: 'Confirm: a new "Revert" commit appears in the graph',
                hint: 'The graph should now have 4 commits including the revert',
            },
        ],
        startingState: {
            id: 'lesson-revert',
            name: 'Lesson 11: Safe Undo with Revert',
            commits: [
                { hash: h('11a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 40000, branch: 'main' },
                { hash: h('11b'), message: 'Add feature A', parentHashes: [h('11a')], timestamp: Date.now() - 30000, branch: 'main' },
                { hash: h('11c'), message: 'MISTAKE: broke production', parentHashes: [h('11b')], timestamp: Date.now() - 20000, branch: 'main' },
            ],
            branches: { main: h('11c') },
            tags: {},
            HEAD: h('11c'),
            currentBranch: 'main',
            files: [
                { name: 'index.html', status: 'unmodified' },
                { name: 'app.js', status: 'unmodified' },
            ],
        },
    },
    {
        id: 'cherry-pick',
        title: '12. Cherry Pick',
        description:
            'Apply a specific commit from another branch to your current branch — without merging everything. Perfect for porting individual bug fixes.',
        difficulty: 'advanced',
        xp: 200,
        objectives: [
            {
                type: 'on_branch',
                target: 'main',
                label: 'Switch to main',
                hint: 'Run: git checkout main',
            },
            {
                type: 'commit_count',
                target: '4',
                label: 'Cherry-pick the hotfix commit onto main',
                hint: 'Right-click the hotfix commit in the graph → Cherry-pick this commit',
            },
        ],
        startingState: {
            id: 'lesson-cherry-pick',
            name: 'Lesson 12: Cherry Pick',
            commits: [
                { hash: h('12a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 50000, branch: 'main' },
                { hash: h('12b'), message: 'Ongoing feature work', parentHashes: [h('12a')], timestamp: Date.now() - 40000, branch: 'main' },
                { hash: h('12c'), message: 'Fix: critical security patch', parentHashes: [h('12a')], timestamp: Date.now() - 30000, branch: 'hotfix' },
            ],
            branches: { main: h('12b'), hotfix: h('12c') },
            tags: {},
            HEAD: h('12b'),
            currentBranch: 'main',
            files: [
                { name: 'security.js', status: 'unmodified' },
                { name: 'feature.js', status: 'unmodified' },
            ],
        },
    },
    {
        id: 'rebase-workflow',
        title: '13. Rebase for a Clean History',
        description:
            'Rebase replays your branch commits on top of another, creating a linear history. Great before merging feature branches.',
        difficulty: 'advanced',
        xp: 200,
        objectives: [
            {
                type: 'on_branch',
                target: 'feature',
                label: 'Switch to the feature branch',
                hint: 'Run: git checkout feature',
            },
            {
                type: 'commit_count',
                target: '5',
                label: 'Rebase feature onto main',
                hint: 'Right-click the tip of main → Rebase onto \'main\', or run: git rebase main',
            },
        ],
        startingState: {
            id: 'lesson-rebase',
            name: 'Lesson 13: Rebase for a Clean History',
            commits: [
                { hash: h('13a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 60000, branch: 'main' },
                { hash: h('13b'), message: 'Main: add auth system', parentHashes: [h('13a')], timestamp: Date.now() - 50000, branch: 'main' },
                { hash: h('13c'), message: 'Main: fix auth bug', parentHashes: [h('13b')], timestamp: Date.now() - 40000, branch: 'main' },
                { hash: h('13d'), message: 'Feature: add dashboard', parentHashes: [h('13a')], timestamp: Date.now() - 30000, branch: 'feature' },
            ],
            branches: { main: h('13c'), feature: h('13d') },
            tags: {},
            HEAD: h('13d'),
            currentBranch: 'feature',
            files: [
                { name: 'dashboard.js', status: 'unmodified' },
                { name: 'auth.js', status: 'unmodified' },
            ],
        },
    },
    {
        id: 'git-flow-workflow',
        title: '14. The GitFlow Workflow',
        description:
            'The real-world GitFlow model: develop → feature → release → main. A structured branching strategy used in production teams.',
        difficulty: 'advanced',
        xp: 200,
        objectives: [
            {
                type: 'branch_exists',
                target: 'release',
                label: 'Create a "release" branch from develop',
                hint: 'First checkout develop, then: git branch release',
            },
            {
                type: 'on_branch',
                target: 'main',
                label: 'Switch to main to receive the release',
                hint: 'Run: git checkout main',
            },
            {
                type: 'merge_exists',
                target: '',
                label: 'Merge the release branch into main',
                hint: 'Run: git merge release',
            },
            {
                type: 'tag_exists',
                target: 'v2.0',
                label: 'Tag the release as v2.0',
                hint: 'Run: git tag v2.0',
            },
        ],
        startingState: {
            id: 'lesson-gitflow',
            name: 'Lesson 14: The GitFlow Workflow',
            commits: [
                { hash: h('14a'), message: 'Initial commit', parentHashes: [], timestamp: Date.now() - 60000, branch: 'main' },
                { hash: h('14b'), message: 'Release v1.0', parentHashes: [h('14a')], timestamp: Date.now() - 50000, branch: 'main' },
                { hash: h('14c'), message: 'Develop: sprint 2', parentHashes: [h('14b')], timestamp: Date.now() - 40000, branch: 'develop' },
                { hash: h('14d'), message: 'Feature: user profiles', parentHashes: [h('14c')], timestamp: Date.now() - 30000, branch: 'feature' },
                { hash: h('14e'), message: 'Develop: merge feature/user-profiles', parentHashes: [h('14c'), h('14d')], timestamp: Date.now() - 20000, branch: 'develop' },
            ],
            branches: { main: h('14b'), develop: h('14e'), feature: h('14d') },
            tags: { 'v1.0': h('14b') },
            HEAD: h('14e'),
            currentBranch: 'develop',
            files: [
                { name: 'profiles.js', status: 'unmodified' },
                { name: 'auth.js', status: 'unmodified' },
            ],
        },
    },
    {
        id: 'bisect-bug-hunt',
        title: '15. Hunt the Bug with Bisect',
        description:
            'A bug appeared somewhere in your history. Use git bisect to binary-search through commits and find exactly which change broke things.',
        difficulty: 'advanced',
        xp: 200,
        objectives: [
            {
                type: 'branch_count',
                target: '2',
                label: 'Complete the bisect session (find the bad commit)',
                hint: 'Run: git bisect start → right-click commits to mark good/bad',
            },
        ],
        startingState: {
            id: 'lesson-bisect',
            name: 'Lesson 15: Hunt the Bug with Bisect',
            commits: [
                { hash: h('15a'), message: 'v1: All tests pass', parentHashes: [], timestamp: Date.now() - 80000, branch: 'main' },
                { hash: h('15b'), message: 'v2: Refactor auth', parentHashes: [h('15a')], timestamp: Date.now() - 70000, branch: 'main' },
                { hash: h('15c'), message: 'v3: Add payments', parentHashes: [h('15b')], timestamp: Date.now() - 60000, branch: 'main' },
                { hash: h('15d'), message: 'v4: Update deps', parentHashes: [h('15c')], timestamp: Date.now() - 50000, branch: 'main' },
                { hash: h('15e'), message: 'v5: Add dark mode (BUG HERE)', parentHashes: [h('15d')], timestamp: Date.now() - 40000, branch: 'main' },
                { hash: h('15f'), message: 'v6: Hotfix attempt', parentHashes: [h('15e')], timestamp: Date.now() - 30000, branch: 'main' },
                { hash: h('15g'), message: 'v7: More features', parentHashes: [h('15f')], timestamp: Date.now() - 20000, branch: 'main' },
            ],
            branches: { main: h('15g') },
            tags: {},
            HEAD: h('15g'),
            currentBranch: 'main',
            files: [
                { name: 'app.js', status: 'unmodified' },
                { name: 'auth.js', status: 'unmodified' },
            ],
        },
    },
];
