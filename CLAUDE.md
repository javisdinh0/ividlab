# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server, http://localhost:5173
npm run build     # Vite build → dist/ (also runs postbuild, see below)
npm run preview   # Preview the production build locally
npm run deploy    # Build + push dist/ to gh-pages via scripts/deploy.cjs
                   # (optional custom commit message: npm run deploy -- "message")
```

There is no test suite and no lint config in this repo.

### Deploy (`npm run deploy`)

Runs `scripts/deploy.cjs`: builds `dist/`, refuses to proceed if any `.rules`/`.gs`/`.md` leaked into it, replaces the content of a temp `gh-pages` worktree with the new `dist/`, and commits+pushes only if something actually changed.

The repo previously shipped the `gh-pages` npm package for this (`gh-pages -d dist`), which is **removed now** — it spawned `git` via `child_process.spawn()` with piped (non-inherited) stdio, which broke Git Credential Manager on this machine (`fatal: Cannot prompt because user interactivity has been disabled`) even though the exact same `git push` succeeds when run directly in a shell. `scripts/deploy.cjs` spawns git with `stdio: 'inherit'` instead, which fixes it — keep that when touching the script.

### Windows environment notes

- Node isn't on PATH in a fresh shell: `$env:Path = "C:\Program Files\nodejs;" + $env:Path` (PowerShell). npm/node are not visible from Git Bash on this machine — always run `npm`/`node` from PowerShell.
- Repo has `core.autocrlf=true`. When committing onto `gh-pages`, use `-c core.autocrlf=false` on the commit or every file shows as changed.

## Architecture

This is **two things sharing one Vite build**, deployed together to GitHub Pages (`gh-pages` branch, custom domain `ividlab.com` via `public/CNAME`):

1. **The main SPA** (`index.html` → `src/`) — a single-page React 19 site (Header/Hero/Tools/Guides/About/Footer in `src/components/`). No router: `App.jsx` holds `activeTab` state and conditionally renders sections. i18n is a plain lookup object (`src/i18n/translations.js`, `vi`/`en`) indexed by the `lang` state and passed down as a `t` prop — there's no i18n library. Theme (`light`/`dark`) is stored in `localStorage` and applied via `data-theme` on `<html>`. Tool/guide listing data lives in `src/data/tools.js` and `src/data/guides.js`.

2. **Static sub-apps under `public/`** — plain HTML/JS (no React, no build step), copied byte-for-byte into `dist/` by Vite. Each is effectively an independent mini-app:
   - `public/autocad/**` — static AutoCAD/AutoLISP tutorial pages.
   - `public/dinhtieuthuong/**` — a survey portal + admin dashboard + a grading tool (`congcuthongkediem`). Backend is **Google Apps Script** (not part of this repo's runtime), reached via a `SCRIPT_URL` `/exec` endpoint hardcoded into each page's JS.
   - `public/rficonsole/**` — multi-project RFI console using **Firebase** (Auth + Firestore) directly from client JS (`firebase.js`, `auth.js`, `admin/admin.js`).

   `vite.config.js` adds a second Rollup entry (`public/brand-guidelines.html`) beyond `index.html`; Vite emits it to `dist/public/brand-guidelines.html`, and the `postbuild` npm script copies it to `dist/brand-guidelines.html` too — both paths existing in `dist/` is expected, not a bug.

### Source vs. served split (important when touching backend/docs code)

Anything placed under `public/` is served publicly at `ividlab.com/<path>` — this repo's GitHub is **public**, so nothing sensitive belongs there. Non-web source lives in sibling top-level dirs instead, and is deployed *manually* to services outside this repo, not by the Vite build:

| Dir | What | How it reaches production |
|---|---|---|
| `backend/dinhtieuthuong/**/Code.gs` | Apps Script backend for the survey portal + grading tool | Pasted by hand into the Google Apps Script editor |
| `firebase/rficonsole/*.rules` | Firestore/Storage security rules for RFI Console | Pasted by hand into Firebase Console |
| `docs/**` | Deploy docs for each sub-app | Not deployed; reference only |

Because the repo is public, **do not hardcode secrets/IDs in `backend/**/Code.gs`** — read them from Apps Script `PropertiesService.getScriptProperties()` instead (see `docs/dinhtieuthuong/USER_ADMIN_SETUP.md` for the pattern already used: `USERS_SHEET_ID` script property, no default constant baked into the committed file).

### Local-only handoff notes

`docs/HANDOFF.md` is gitignored on purpose (`/docs/HANDOFF.md` in `.gitignore`) — it's a running local note of environment gotchas and session-to-session state that must never be pushed (repo is public). It exists only in whichever working copy last wrote it; check whether it's present before assuming it's out of date, and don't recreate it from scratch if it's just missing from your current worktree.
