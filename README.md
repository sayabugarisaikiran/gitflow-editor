# 🌳 GitFlow Editor v9.0

**GitFlow Editor** is a powerful, interactive Git simulation and educational tool designed to help developers master Git workflows visually. Instead of just reading about branches and merges, users can manipulate a live DAG (Directed Acyclic Graph) and see exactly how Git works under the hood.

![Onboarding Tour](file:///home/laborant/.gemini/antigravity/brain/cdd9995e-aa08-409c-bfed-9ac268eb4a56/onboarding_step_1_1773237284524.png)

## 🚀 Key Features

### 🎓 Guided Lesson Engine
- **15 Interactive Lessons**: Ranging from "First Commit" to "Advanced Git Bisect".
- **Real-time Evaluation**: Objectives update instantly as you perform actions.
- **XP & Gamification**: Earn XP as you complete challenges and level up your Git skills.
- **Persistence**: Your progress is automatically saved to local storage.

### 🌳 Visual Git Graph
- **Interactive DAG**: Click nodes to inspect commits, double-click to checkout branches.
- **Rich Context Menus**: Perform complex operations like Rebase, Merge, Cherry-pick, and Reset directly from the graph.
- **Export to Image**: Download your visual Git history as a PNG.

### 💻 Integrated Terminal
- **Real Git Commands**: Supports `git commit`, `git merge`, `git rebase`, `git stash`, `git checkout`, and many more.
- **Auto-completion & History**: A developer-friendly terminal experience.
- **Quick Command Buttons**: One-click access to common Git operations.

### 🔍 Advanced Tooling
- **Git Bisect Simulation**: Interactive binary search to find problematic commits.
- **Interactive Rebase**: Visual interface to squash, edit, and reorder commits.
- **Branch Comparison**: Side-by-side diff view of two different branches.
- **Conflict Resolver**: Visual modal to resolve simulated merge conflicts.

## 🛠️ Tech Stack

- **Framework**: [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Graph Visualization**: [@xyflow/react (React Flow)](https://reactflow.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Persistence**: Zustand Persist (Local Storage)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install
```

### Development
```bash
# Start the dev server
npm run dev
```

### Build
```bash
# Create a production build
npm run build
```

---

## 📸 Screenshots

### Advanced Lesson Picker
![Lesson Picker](file:///home/laborant/.gemini/antigravity/brain/cdd9995e-aa08-409c-bfed-9ac268eb4a56/lesson_picker_1773237347621.png)

### Git Bisect Interface
![Git Bisect](file:///home/laborant/.gemini/antigravity/brain/cdd9995e-aa08-409c-bfed-9ac268eb4a56/git_bisect_panel_1773237642461.png)

### Keyboard Shortcuts
![Shortcuts](file:///home/laborant/.gemini/antigravity/brain/cdd9995e-aa08-409c-bfed-9ac268eb4a56/keyboard_shortcuts_1773237455292.png)

