# 🧪 GitFlow Editor: Practical Testing Guide

This guide contains step-by-step instructions to manually verify every core feature we built into the GitFlow Editor, alongside practical real-world distress scenarios so you can practice recovering from terrifying production incidents safely.

---

# Part 1: Core Feature Verification

## 🟢 Use Case 1: The Basic Workflow (Stage & Commit)
**Goal:** Verify that modifying files, staging them, and committing them updates the graph accurately.

1. **Start Fresh**: Refresh the page or click `↺ reset` in the top right.
2. **Modify a File**: In the File Explorer (left pane), click `+ new` to create a mock file, or click `~ modify` on an existing file like `README.md`.
3. **Stage the File**: Hover over the newly modified file in the **Working Directory** list and click the `+ Stage` button. It should move down into the **Staging Area**.
4. **Write a Commit**: Click inside the **Terminal** (right pane). Type exactly:
   ```bash
   git commit -m "feat: my first test commit"
   ```
   Press **Enter**.
5. **Verify**: A new commit node should instantly appear in the center graph, connected to the initial commit.

---

## 🌿 Use Case 2: Branching & Navigation
**Goal:** Verify the system can create isolated branches and switch the `HEAD` pointer between them.

1. **Create Branch**: In the Terminal, type `git checkout -b feature/ui-update` and press Enter.
2. **Verify HEAD**: Look at the center graph. The yellow `HEAD` badge and the blue branch badge should now be pointing to `feature/ui-update`.
3. **Commit on Branch**: Add another file using `+ new`, click `+ Stage`, and type `git commit -m "ui: testing branch commit"`.
4. **Switch Branches**: Type `git checkout main` in the terminal (or double-click the `main` text label on the graph). 
5. **Verify Navigation**: The `HEAD` indicator should jump back to the main branch's commit, and the newly created file should disappear from the File Explorer.

---

## ⏪ Use Case 3: The Time Travel Debugger (Undo/Redo)
**Goal:** Verify the Command Engine snapshots our history and allows traversal.

1. **Undo**: In the Git Terminal pane, locate the `⟲ Undo` button right above the terminal input. Click it.
2. **Verify State Reversal**: The `HEAD` should jump back exactly one step. The terminal history should remove the last output line.
3. **Redo**: Click the `⟳ Redo` button next to Undo.
4. **Verify State Forwarding**: The action should be completely restored exactly as it was.

---

## 🔀 Use Case 4: Advanced Graph Operations (Merge & Rebase)
**Goal:** Verify complex topological graph interactions.

*Pre-requisite: Ensure you are on `main` and have a `feature/ui-update` branch diverging from it.*

### 4A: Fast-Forward Merge
1. While exactly on `main`, type `git merge feature/ui-update` in the terminal.
2. **Verify**: The `main` branch label should fast-forward and snap directly to the same commit as `feature/ui-update`.

### 4B: Rebase
1. Click `↺ reset` to start over.
2. Create and commit on a new branch: `git checkout -b feature/A`, create a file, stage, config, and `git commit -m "commit A"`.
3. Switch to main: `git checkout main`.
4. Create and commit on another branch: `git checkout -b feature/B`, create a file, stage, and `git commit -m "commit B"`.
5. Rebase B onto A: In the terminal, type `git rebase feature/A`.
6. **Verify**: The entire branch `feature/B` (and its commits) should be physically detached and moved to sit on top of `feature/A` in the visual graph.

---

## 🏗️ Use Case 5: The Interactive Context Menu
**Goal:** Verify that mouse interactions trigger engine commands.

1. Hover your mouse over any previous commit node in the center graph.
2. **Right-Click** the node. A context dropdown menu should appear.
3. Select **"Reset branch to here -> Hard"**.
4. **Verify**: The latest commits are immediately destroyed, the graph shrinks back, and the `HEAD` forcefully rewinds to your selected node.

---

## 🌐 Use Case 6: GitHub REST API Integration
**Goal:** Verify the "Killer Feature" successfully ingests external JSON logic.

1. Look in the Top Navigation Header. Find the text input placeholder that says `owner/repo (e.g. facebook/react)`.
2. Type `reduxjs/redux` into the input box.
3. Click the `Fetch` button.
4. Wait 3-5 seconds for the `⏳` spinner to finish.
5. **Verify**: The entire scenario resets. The graph explodes with 50 live commits mathematically structured exactly as the Redux architecture dictates. Click on any node, and check the "Repository" sidebar on the left to read genuine commit messages written by the React/Redux team!

---

## 🎓 Use Case 7: Educational Capabilities
**Goal:** Verify that the app serves its original purpose as an educational tool.

1. In the Top Navbar, click the **`📚 Lessons`** button.
2. A slide-out panel will appear on the right side.
3. Select **"Lesson 1: Introduction to Commits"**.
4. **Verify Verification Loop**: A banner will appear at the top of the screen asking you to commit a file. Follow the exact instructions (create a file, stage, commit).
5. **Verify**: The moment you perform the correct action, confetti will explode on the screen, XP will be awarded, and you will level up!

---
---

# Part 2: Real-World Distress Scenarios

This section translates terrifying, hair-on-fire production Git incidents into structured practicals. We evaluate the standard real-world recovery steps for each incident, and explain how you can simulate and practice that exact recovery inside GitFlow Editor.

## 🚨 Scenario 1: The Force Push
*A junior developer accidentally force-pushed to the main branch, overwriting a week's worth of production commits. The CI pipeline has already started deploying this broken state.*

### Real-World Recovery
1. **Stop the Bleeding**: Immediately cancel the CI/CD deployment pipeline in GitHub Actions/GitLab.
2. **Find the Lost History**: Run `git reflog` on a machine that had the latest `main` branch before the force push, or check the CI logs for the previous commit SHA.
3. **Restore**: `git checkout main` -> `git reset --hard <correct-sha>` -> `git push --force`.

### Practice in GitFlow Editor
You can simulate this using our Time Travel engine.
1. Create a `main` branch with 5 commits.
2. Do a destructive `git reset --hard HEAD~3` to simulate the accident.
3. Because our Git engine doesn't have a hidden `reflog` terminal command yet, use the **`⟲ Undo`** button in the UI above the terminal. This uses our snapshot architecture to perfectly restore the orphaned commits, mimicking a reflog recovery!

---

## 🔑 Scenario 2: The Leaked Secret
*You are alerted that an AWS access key was committed and pushed to a public GitHub repository 20 minutes ago.*

### Real-World Recovery
1. **Revoke the Key**: The absolute first step is to log into AWS and instantly revoke the exposed IAM key. Treat it as compromised, regardless of Git history.
2. **Scrub the History**: 
   - Option A: If it's the very last commit, `git reset --soft HEAD~1`, remove the key from the file, `git commit`, `git push --force`.
   - Option B: If it's deep in history, use `git filter-repo` or BFG Repo-Cleaner to completely purge the string from the DAG.

### Practice in GitFlow Editor
You can practice Option A safely.
1. Modify a file and commit it (simulating the secret).
2. Type `git reset --soft HEAD~1` in the terminal.
3. The file will pop back into the Staging area. You can Unstage it, "fix" it, and commit it again!

---

## 👻 Scenario 3: The Ghost Bug
*A memory leak was introduced into the codebase sometime in the last 3 months, but there have been over 500 commits since then. You cannot manually read the code to find it.*

### Real-World Recovery
Use Git's binary search functionality.
1. `git bisect start`
2. `git bisect bad` (Mark the current broken state).
3. `git bisect good <sha-from-3-months-ago>` (Mark the last known working state).
4. Git will check out a commit exactly in the middle. You compile the app. If it leaks: `git bisect bad`. If it doesn't: `git bisect good`.
5. Repeat 8-9 times until Git isolates the exact author and commit that introduced the bug.

### Practice in GitFlow Editor
We built a dedicated **Git Bisect Simulator** specifically for this!
1. Create ~10 commits in a line.
2. Type `git bisect start` in the terminal.
3. Type `git bisect bad`.
4. Check out an older commit and type `git bisect good`.
5. The UI will render a glorious visual binary search graph! Use the terminal to mark ongoing commits as `good` or `bad` until the engine mathematically hunts down the culprit.

---

## 🔗 Scenario 4: The Detached Submodule
*A critical CI build is failing because a Git submodule is pointing to a commit that doesn't exist on the remote. The developer who pushed the code is on vacation.*

### Real-World Recovery
1. Look at the `.gitmodules` file and the submodule directory hash.
2. The developer likely committed a submodule pointer to their local laptop's commit, but forgot to `git push` inside the submodule directory itself.
3. You must step into the submodule directory, `git fetch`, find a valid branch/tag, `git checkout` to a stable state, step back to the root repo, `git add <submodule-dir>`, and `git commit`.

### Practice in GitFlow Editor
*Not yet feasible.* Our engine simulates the Directed Acyclic Graph (DAG) for a single repository. It does not currently support nested `.git` initialized directories (submodules) or reading `.gitmodules`. This would require a recursive instance of our `useGitStore` engine (a great idea for a future phase!).

---

## 💥 Scenario 5: The Massive Conflict
*During a Sev-1 incident, you need to merge a hotfix into production, but there is a massive merge conflict spanning dozens of files due to a long-running feature branch. Time is of the essence.*

### Real-World Recovery
1. Do not panic. Abort the merge if necessary (`git merge --abort`) to assess the situation.
2. Instead of merging the entire feature branch, consider `git cherry-pick <hotfix-sha>` directly into `main` to bypass the massive conflict entirely if the hotfix is isolated.
3. If you must merge, set up a proper visual diff tool (`git mergetool`) like VSCode or Beyond Compare. Carefully accept Current vs Incoming changes.

### Practice in GitFlow Editor
We have a Conflict resolution engine built-in.
1. Create a commit on `main` that modifies `index.html`.
2. Branch out to `feature`, modify `index.html` again, and commit.
3. Switch to `main`, modify `index.html` differently, and commit.
4. Attempt to `git merge feature`.
5. The Terminal will lock up, the file will turn red (`conflicted` status), and a **Conflict Resolver Modal** will appear in the UI, forcing you to choose "Keep Current", "Keep Incoming", or "Keep Both"!
6. Finally, `git commit` to seal the resolution.

---

## 🏗️ Scenario 6: CI Pipeline Builds Wrong Code
*Your CI/CD pipeline is building an older version of the code even though new commits exist on your remote repository.*

### Real-World Recovery
1. **Check the Triggers**: Did the CI trigger on the right branch?
2. **Check the Commit SHA**: Look at the CI runner logs. Is it building from a specific detached SHA or a tag instead of the branch `HEAD`?
3. **Check for Force Pushes**: Did someone force push to the branch *after* the pipeline started, causing it to build an orphaned commit?
4. **Identify Tags**: Often, pipelines build based on Tags. Someone might have moved the branch forward but forgot to push the updated tag (e.g., `git push origin v1.2.0`). The CI is building the old tag.

### Practice in GitFlow Editor
You can simulate the Tag confusion perfectly.
1. Create a `main` branch with 3 commits.
2. In the terminal, type `git tag v1.0`. 
3. Create 2 more commits. 
4. The CI is looking for `v1.0`. Notice how in the visual graph, the tag remains stuck on the older commit while the `main` branch moves forward!
5. To fix it, you move the tag: `git tag -d v1.0` then `git tag v1.0 HEAD`!

---

## 🐘 Scenario 7: Git Repository Suddenly Huge
*The repository size jumps from 200MB to 4GB, slowing down CI builds and local clones.*

### Real-World Recovery
1. **Identify the Culprit**: Someone probably committed a massive binary file (like an `.mp4`, `.iso`, or `.sqlite` database) or an enormous `node_modules` folder.
2. **Find Large Objects**: Use `git rev-list --objects --all | grep "$(git verify-pack -v .git/objects/pack/*.idx | sort -k 3 -n | tail -5 | awk '{print$1}')"` to find the exact large files in history.
3. **Rewrite History**: Use the BFG Repo-Cleaner (`bfg --strip-blobs-bigger-than 100M`) or `git filter-repo` to permanently erase the binary blobs from the entire Git history.
4. **Force Push**: `git push --force --all`. Note: everyone else on the team will need to re-clone the repository from scratch.

### Practice in GitFlow Editor
*Not yet feasible.* Our visual graph focuses on tree topology, branches, and merges. We don't currently track or display raw blob byte-sizes in the UI. Rewriting history with `filter-branch` or `filter-repo` is an advanced feature we haven't built into our terminal parser yet.
