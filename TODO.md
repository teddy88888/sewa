# Workspace Diagnostics Fixes

## Progress

- [x] Create TODO.md
- [x] Fix 1: `.devcontainer/devcontainer.json` — deprecated `typescript.updateImportsOnFileMove.enabled` → `js/ts.updateImportsOnFileMove.enabled`
- [x] Fix 2: `artifacts/api-server/src/middlewares/serveStatic.ts` — add Express type annotations for `req`, `res`, `next`
- [x] Fix 3: `artifacts/api-server/src/app.ts` — add missing `return` in SPA fallback handler
- [x] Fix 4: `artifacts/sewa/index.html` — remove `maximum-scale=1` from viewport meta
- [x] Verify TypeScript compilation (running)

