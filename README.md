# DevRoadmap

**Learn consistently. Build real projects. Become job-ready.**

DevRoadmap is a developer learning operating system and growth platform designed to guide developers through a comprehensive 8-month curriculum from programming fundamentals through full-stack development and AI engineering.

---

## Features

- **Structured 8-Month Curriculum**: Python, CS basics, OOP & design patterns, DSA, FastAPI backend, React/Next.js frontend, System Design, and AI Engineering (LLMs, RAG, agents).
- **Three Project Slots Rule**: Exactly 3 independent project submission slots (*Practice*, *Intermediate*, *Portfolio*) for every topic and subtopic with repository, live demo, and tech stack tracking.
- **Developer Profile**: Complete profile with education, career goals, GitHub, LeetCode, LinkedIn, and personal portfolio handles.
- **Daily Tracker & Study Timer**: Real-time study session timer with categorized activity logging.
- **DSA / LeetCode Tracker**: Problem log with difficulty ratings, topic tags, time spent, complexity notes, mistake tracking, and revision queue.
- **8 Monthly Milestone Projects**: Full milestone project specifications with interactive acceptance criteria checklists.
- **Activity Heatmap**: 52-week GitHub-style contribution heatmap tracking daily study sessions and completed projects.
- **Persistent Cloud Storage**: Powered by PostgreSQL and Supabase with Row Level Security (RLS).
- **Data Export**: Complete JSON and CSV export of all personal learning data.

---

## Tech Stack

- **Framework**: TanStack Start / React 19 / TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Database**: PostgreSQL (Supabase) with Row Level Security (RLS)
- **Charts**: Recharts
- **Testing**: Vitest & React Testing Library

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/NikhilChakre310/Roadmap-With-Profile.git
cd Roadmap-With-Profile
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

*(If environment variables are omitted, DevRoadmap automatically operates in standalone local storage mode for testing).*

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### 4. Run Tests

```bash
npm test
```
