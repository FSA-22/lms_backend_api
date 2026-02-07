# Dev Team Cheat Sheet – [Project Name]

Quick reference for professional collaboration and workflow.

---

## Branching

- Never commit directly to `dev` or `main`.
- Create a new branch per feature/bugfix:  
  `feature/<name>`, `bugfix/<name>`, `hotfix/<name>`.
- Keep branches small and focused.

---

## Pull Requests

- Submit a PR for every feature/fix.
- Include description: what, why, dependencies.
- PR must be **reviewed and approved** before merging.
- Rebase or merge `dev` before submitting.

---

## Code Review & Stand-ups

- Attend stand-ups every 2 days.
- Discuss recent code, blockers, and project alignment.
- Review for correctness, readability, consistency, security.

---

## Commits

- Use clear commit messages: `<type>: <short description>`
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
- Commit **small, logical changes**.
- Avoid unnecessary files.

---

## Testing

- Run unit/integration tests locally before PR.
- Include test instructions in PR if manual steps required.

---

## Code Quality

- Follow ESLint, Prettier, and TS rules.
- Keep code modular and readable.
- Comment complex logic.

---

## Documentation

- Update README, API docs, and `.env.example`.
- Keep docs clear and up to date.

---

## Collaboration

- Communicate blockers/questions immediately.
- Respect PR feedback.
- Coordinate on large features; avoid overwriting teammates.

---

## Deployment

- Use separate dev, staging, production environments.
- Never commit secrets.
- Coordinate deployments with the team.

---

## Continuous Improvement

- Suggest workflow improvements.
- Apply best practices for collaboration and code quality.
