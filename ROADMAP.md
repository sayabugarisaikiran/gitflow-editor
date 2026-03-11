# 🛣️ GitFlow Editor Roadmap & Architecture Proposals

This document outlines the long-term vision, architectural improvements, and planned features for the GitFlow Editor project. It is based on a "senior developer" architectural review of the project as it reached v9.0.

## 🏗️ Architectural Refactoring (Phase 10)

If we want to make this a true senior-level, production-ready open-source powerhouse, our next immediate priority is tackling technical debt and decoupling our architecture.

### Improvement 1: Separate the Git Engine from the UI
**The Problem**: Currently, `useGitStore.ts` is a monolithic file (~1,300 lines) that mixes React UI state (like `activeScenario`, `terminalHistory`) with hardcore graph math (rebase commit replication, common ancestor resolution).
**The Solution**: Extract the Git simulation logic into pure, framework-agnostic TypeScript files.
- Move logic to `src/engine/operations/merge.ts`, `rebase.ts`, etc.
- **Benefits**:
  - Easier testing (run headless unit tests without React/Zustand).
  - Reusable engine (could potentially publish `@gitflow-editor/core` to NPM).

### Improvement 2: Introduce a Command Execution System
**The Problem**: Command parsing and history generation are tightly coupled in giant `switch` statements (e.g., `GitTerminal.tsx` and action handlers).
**The Solution**: Implement the **Command Design Pattern**.
- Create command objects like `CommitCommand.ts`, `RebaseCommand.ts` that implement `interface GitCommand { execute(repo), undo(repo) }`.
- **Benefits**:
  - Encapsulates parsing and execution.
  - "Undo" functionality (`git reflog` and time-travel debugging) becomes trivial to implement.

---

## 📚 Open Source Polish (Phase 11)

To encourage community contributions and make the project self-explanatory.

- **Git Architecture Docs** (`docs/git-engine.md`): Explain how we model commits, branch pointers, HEAD, and merge algorithms in JSON/TypeScript. This is core educational material.
- **Project Architecture Diagram**: Visual flow from User Actions → React → Zustand → Engine → React Flow (e.g., rendered in Mermaid.js in the README).
- **Contribution Guide** (`CONTRIBUTING.md`): A guide for running locally, coding standards, and most importantly, **how to add new lessons**.

---

## 🚀 "Killer Feature" R&D (Phase 12+)

Turning the project from an "Educational Game" into a "Daily Developer Tool".

### Feature 1: GitHub / Real Repo Integration
- **Concept**: Connect a GitHub repo to visualize PRs, branching structures, and release flows directly on the canvas.
- **Why**: Much more feasible than reading local `.git` binaries immediately (via GitHub REST API). Incredible value for DevOps teams analyzing CI/CD pipelines.

### Feature 2: Interactive Git Debugger
- **Concept**: Visual "Why did my rebase break?" time-traveling. 
- **Why**: We already built `git bisect`. If we implement the Command Pattern with `undo()`, we get a visual `git reflog` time-slider automatically. This is highly achievable.

### Feature 3: Team Workflow Simulation
- **Concept**: Simulate multiple developers (Alice commits, Bob merges) moving branches in real-time.
- **Why**: Great for teaching collaborative workflows.

### Feature 4: Classroom Mode
- **Concept**: Instructor dashboards for bootcamps where instructors create labs and students complete exercises.
- **Why**: The logical long-term business model ("Duolingo for Git") or enterprise tier. Requires a full backend (Node/Postgres/Auth).

---

## 📝 Near-term Feature Backlog

- [ ] Git stash simulation improvements (multiple stashes, visual stash list).
- [ ] Explicit remote repository simulation (vs just local branches tracking remote branches).
- [ ] Event-Based State System (Emit events like `BranchCreated` instead of directly mutating state, allowing the UI and Lesson Engine to listen for triggers).
