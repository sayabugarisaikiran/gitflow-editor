# Git Engine Architecture

GitFlow Editor features a zero-dependency, pure TypeScript Git simulation engine located in `src/engine/`. This engine is completely framework-agnostic and decoupled from our React UI, making it highly testable and extensible.

## 🏗️ Core Concept: The Graph Math

At its heart, Git is a Directed Acyclic Graph (DAG) of commits. Our engine models this entirely via pure JSON state.

### State Representation (`GitStateData`)
The core repository state is represented by several key dictionaries and arrays in `src/engine/types.ts`:

- `commits: Commit[]`: An array of all commits in the repository. Each `Commit` object has an array of `parentHashes`.
- `branches: Record<string, string>`: A map of branch names to their respective commit hashes.
- `HEAD: string`: The commit hash that the user is currently checked out on.
- `currentBranch: string`: The name of the currently checked out branch (or `"HEAD (detached)"`).
- `files: GitFile[]`: The state of the working directory and staging area, modeled simply as a list of filenames with statuses (`unmodified`, `modified`, `staged`, `conflicted`).
- `remoteBranches` and `simulatedRemote`: Mock representations of tracking an origin server.

---

## 🏎️ The Command Design Pattern

All actions a user performs (e.g. `git commit`, `git rebase main`) are orchestrated by the **Command Design Pattern**. 

Instead of mutating state directly in a massive UI store, we instantiate isolated command classes.

### How it Works
1. **The Interface (`GitCommand`)**: Every operation must implement an `execute(context: CommandContext)` method that returns a partial update to the `GitStateData`.
2. **The Execution (`CommandExecutor`)**: The `engineExecutor` takes a command and the current state, runs `command.execute()`, and returns the next state.
3. **History Tracking**: The executor retains an array of all executed commands. This allows us to push/pop history for powerful "time travel" debugging and `git reflog` features.

### Example: A basic branch creation

When a user runs `git branch feature/auth`:

1. The UI creates `new CreateBranchCommand('feature/auth')`.
2. The Command reads the current `HEAD` hash from the state context.
3. The Command returns `{ branches: { ...state.branches, 'feature/auth': state.HEAD } }`.
4. The Executor applies this partial update to the application state.

---

## 🛠️ Modularity Breakdown

The `src/engine/commands/` module is broken down by operational domain:

- `CommitCommand.ts`: Calculates file trees to generate a new hash.
- `MergeCommand.ts`: Computes common ancestors and calculates fast-forward vs 3-way conflict merges.
- `RebaseCommand.ts`: Linearly reapplies commits sequentially on top of a target base branch.
- `HistoryCommands.ts`: Handles `reset`, `revert`, and `cherry-pick` graph manipulations.
- `BranchingCommands.ts`: Handles checking in and out of the graph vertices. 
- `RemoteCommands.ts`: Simulates fetch, push, and pull syncing loops.

## 🤝 UI Integration

To see how this engine is stitched into the visual frontend, view `src/store/useGitStore.ts`. 

The `useGitStore` is a thin Zustand wrapper. It solely maps UI interactable functions (like clicking "Commit") to passing the corresponding `CommitCommand` into the `engineExecutor`. This guarantees that the UI simply reads the engine's output and renders the React Flow nodes accordingly.
