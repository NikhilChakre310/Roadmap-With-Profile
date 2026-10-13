# DevRoadmap Architecture Guidelines

- Curriculum, resources and milestones live as static seed data in `src/data` (parsed from the master curriculum); the database stores only per-user progress keyed by those stable IDs — keeps the catalog versioned with code and user data safe on reseed.
- Pure progress rules (streaks, milestone completion, URL safety) live in `src/lib/calc.ts` with tests in `calc.test.ts`.
