# Contributing to GitFlow Editor

Welcome! GitFlow Editor is an open-source educational powerhouse designed to help developers visualize Git. By contributing, you're helping developers everywhere conquer version control anxiety.

## 🚀 Running Locally

The repository is built using React 18, Vite, and TypeScript.

1. **Clone the repo**
   ```bash
   git clone https://github.com/sayabugarisaikiran/gitflow-editor.git
   cd gitflow-editor
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Start the dev server**
   ```bash
   npm run dev
   ```

## 🏗️ Coding Standards (The Git Engine)

As of `v9.0` (Phase 10), the core Git algorithms have been completely decoupled from the React UI view layer.

**If you are adding new graphical elements / buttons:**
- Write React components in `src/components/`. 
- Bind UI actions to our central Zustand store (`src/store/useGitStore.ts`).

**If you are adding new `git` functionality (e.g. `git restore`):**
1. Do not put math/logic directly in the Zustand store.
2. Go to `src/engine/commands/`.
3. Create a new Command Class implementing `GitCommand` using the Command Design Pattern.
4. Define its `execute(context: CommandContext)` method to return the pure JSON properties that change (e.g., changes to `files` or `commits`).
5. Export your command in `src/engine/index.ts`.
6. Bind it to the UI in `useGitStore.ts` using the `engineExecutor`.

---

## 🎓 How to Add a New Educational Lesson

The heart of GitFlow Editor is the interactive sequence of lessons. You can quickly add a custom lesson scenario!

1. **Open the Lesson Database**
   Navigate to `src/data/lessons.ts`.

2. **Create a `Lesson` Object**
   Lessons are defined via the `Lesson` interface. Example:
   ```typescript
   export const newLesson: Lesson = {
       id: 'my-custom-lesson',
       title: 'Advanced Conflict Resolution',
       description: 'Learn how to handle massive 3-way merge conflicts.',
       
       // Define the exact Git state the user should start with
       initialState: customMergeScenarioData, 
       
       // Define the objectives they must complete
       objectives: [
           {
               id: 'merge-feature',
               description: 'Merge feature into main',
               checkId: 'check-merge' 
           }
       ],
   };
   ```

3. **Define Evaluation Logic**
   The `checkId` in your objective maps to a pure validation function in `src/utils/lessonChecks.ts`. Write a function there that inspects the `GitStateData` and returns `boolean` if the user successfully completed the objective.

4. **Register the Lesson**
   Import your lesson object and insert it into the `LESSONS` array at the bottom of `src/data/lessons.ts`. 

You're done! The UI will automatically render the new lesson in the Lesson Picker.
