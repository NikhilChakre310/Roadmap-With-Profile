<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Curriculum, resources and milestones live as static seed data in src/data (parsed from the user's master prompt); the database stores only per-user progress keyed by those stable ids — keeps the catalog versioned with code and user data safe on reseed.
- Pure progress rules (streaks, milestone completion, URL safety) live in src/lib/calc.ts with tests in calc.test.ts.
