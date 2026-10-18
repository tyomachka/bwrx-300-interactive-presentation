# CODEX / SECOND CODE ACCOUNT PROMPT — WAIT, THEN PUBLISH FINAL PROJECT TO GITHUB + GITHUB PAGES

You are the **second code account** working on the BWRX-300 interactive presentation repository.

Another coding account (Claude Code) is currently implementing the presentation's next major stage. Your job is **not** to compete with it, edit the same files, or improve the presentation while it is working.

Your job is:

1. wait until the other account has genuinely finished its Stage 3 implementation and review package;
2. verify the resulting repository state without undoing its work;
3. create a clean final Git checkpoint if needed;
4. create a repository in the owner's GitHub account;
5. push the complete project;
6. configure GitHub Pages;
7. verify the deployed site works;
8. report the GitHub repo URL, Pages URL, commit hash, and any limitations.

Do not begin a new visual-design pass unless deployment itself requires a minimal technical change.

---

## 0. READ FIRST

Read:

- `DEVELOPMENT_RULES.md`
- `ARCHITECTURE.md`
- `CLAUDE_PRESENTATION_STAGE3_RHYTHM_SCALE_FISSION.md` if it exists in the repo
- `docs/presentation-stage2-review/STAGE2-REPORT.md`
- `docs/presentation-stage3-review/STAGE3-REPORT.md` **only after it exists**
- package scripts / Vite config / existing deploy or portable-build scripts
- `.gitignore`
- current Git status, branches and remotes

Do not assume the current branch or commit state.

---

# PHASE A — OBSERVER / WAIT MODE

The first account is allowed to finish Stage 3 without interference.

Until the Stage 3 completion gate below is satisfied, you must NOT:

- edit tracked project files;
- run formatters that rewrite files;
- commit anything;
- checkout/reset/rebase/merge branches;
- stash another account's work;
- kill its Vite/Chrome/Node processes;
- modify Git remotes;
- run destructive Git commands;
- create the GitHub repository yet.

Read-only inspection is allowed.

## Stage 3 completion gate

Treat Stage 3 as finished only when all of the following are true:

1. `docs/presentation-stage3-review/STAGE3-REPORT.md` exists.
2. The report explicitly says the Stage 3 implementation/review package is complete or ready for review.
3. The expected Stage 3 review artifacts named in the Stage 3 brief exist, or the report clearly documents why a specific artifact was omitted.
4. The working tree stops changing: compare `git status --short` plus a file/diff snapshot twice with at least 2 minutes between checks; there must be no new change between the two checks.
5. There is no obvious active coding process still writing the repository.

If these conditions are not true, wait and re-check. Do not take ownership of unfinished implementation.

If your execution environment cannot remain alive while waiting, stop cleanly and report exactly which completion-gate item is still missing rather than editing the repo prematurely.

---

# PHASE B — REVIEW THE FINISHED STATE, BUT DO NOT REDESIGN IT

Once Stage 3 is complete:

1. Read `docs/presentation-stage3-review/STAGE3-REPORT.md` in full.
2. Inspect `git diff`, `git status`, recent commits, and the current branch.
3. Confirm whether Claude already created the requested Stage 2 / Stage 3 checkpoint commits.
4. Do not revert intentional Stage 3 changes because they differ from Stage 2.
5. Do not start another motion/design stage.

The deployment target is the **latest completed Stage 3 state**.

## Required local checks before publishing

Run the repository's normal validation, at minimum:

- `npm run check`
- production build
- portable build if the project provides one

Also confirm:

- Lithuanian is still the default presentation language;
- English switching still works;
- no development-only design-study UI appears in the production route;
- no accidental localhost-only asset references exist;
- production build makes no required external runtime requests unless intentionally documented;
- the presentation opens in the normal browser route;
- the main presenter navigation starts successfully.

Do not redo hours of visual regression testing unless the Stage 3 report is missing evidence or a deployment change modifies rendering.

---

# PHASE C — CREATE A CLEAN LOCAL CHECKPOINT

If the finished Stage 3 work is not committed, create a checkpoint **only after all checks pass**.

Before committing:

- keep source, config, documentation and reasonable-size review images/reports;
- follow the repository's existing policy for generated videos and giant review files;
- do not accidentally commit `node_modules`, browser profiles, temp capture directories, local caches, secrets, API tokens, or machine-specific files;
- inspect `.gitignore` and improve it only if needed for safe publishing.

Suggested final implementation commit if needed:

`presentation: complete stage 3 cinematic choreography`

If deployment requires small technical files afterward, use a separate commit, e.g.:

`deploy: publish interactive presentation with GitHub Pages`

Record the exact commit hash(es).

Do **not** squash or rewrite existing history just to make it prettier.

---

# PHASE D — GITHUB AUTH + REPOSITORY SAFETY

Use the authenticated GitHub account already available in the environment.

First run:

- `gh auth status`
- determine the authenticated owner/login;
- inspect existing remotes with `git remote -v`;
- check whether the intended repository name already exists in that owner's account.

## Repository name

Preferred repository name:

`bwrx-300-interactive-presentation`

If that exact repository already exists:

- if it is clearly this same project and the existing remote/history is compatible, reuse it carefully;
- otherwise STOP and ask the owner instead of overwriting or deleting anything.

## Visibility — IMPORTANT

The owner previously indicated that they want people to be able to use the presentation/model through a link/QR, but they do **not** want to casually give away the entire project source.

Therefore:

1. Prefer creating the repository as **PRIVATE**.
2. Check whether the authenticated GitHub plan/account allows GitHub Pages deployment from that private repository in a way that produces the desired shareable site.
3. If it works, keep the repository private.
4. If GitHub requires making the repository public to enable the requested public Pages site, **STOP and ask the owner for explicit permission before changing visibility**.

Never silently make the repository public.

Never commit GitHub credentials, tokens, `.env` secrets, or local credential files.

---

# PHASE E — CREATE / CONNECT THE GITHUB REPOSITORY

If no compatible remote repository exists:

1. Create the repo in the authenticated owner's GitHub account using `gh`.
2. Use the current project as the source.
3. Set a concise repository description such as:

   `Interactive Lithuanian/English BWRX-300 SMR presentation built with React, Three.js and WebGL.`

4. Do not initialize the remote with a conflicting README/license/gitignore if the local repository already contains history.
5. Add `origin` only if there is no valid existing origin.
6. Do not overwrite an unrelated existing remote.

## Default branch

Preferred public/deployment branch is `main`.

Do not destroy the current branch structure.

If the finished work is on `presentation-v1`:

- preserve that branch;
- create/update `main` from the completed, validated Stage 3 commit using a normal fast-forward or clean branch creation;
- do not force-push over unrelated history.

Push the project and relevant branches/tags.

If the repo contains huge review videos that exceed GitHub limits, do not use Git LFS unless the project already intentionally uses it. Keep those local/review-only assets out of the repository if appropriate and document that decision.

---

# PHASE F — PREPARE GITHUB PAGES WITHOUT BREAKING THE OFFLINE BUILD

The project must continue supporting its existing offline/portable workflow.

Do not replace the portable build with a Pages-only build.

Audit the Vite/base-path behavior before deployment.

The GitHub Pages site will normally live at:

`https://<owner>.github.io/bwrx-300-interactive-presentation/`

Ensure production assets and routes work under that repository subpath.

Prefer a deployment-only configuration that does not alter rendering or the lecture experience.

## Preferred Pages method: GitHub Actions

Create a minimal workflow such as:

`.github/workflows/deploy-pages.yml`

Requirements:

- trigger on push to `main` and allow manual `workflow_dispatch`;
- `permissions`:
  - `contents: read`
  - `pages: write`
  - `id-token: write`
- use concurrency for Pages deployments;
- checkout repo;
- set up the Node version appropriate for the project;
- install with `npm ci` (or the repo's documented equivalent);
- run the proper production web build;
- configure Pages;
- upload the `dist/` directory as the Pages artifact;
- deploy with the official Pages deploy action.

Do not deploy `node_modules` or the whole repository as the site artifact.

If the existing project already has a working deployment method, reuse it instead of adding duplicate infrastructure.

## Pages source

Configure the repository to use **GitHub Actions** for Pages if not already configured.

Use `gh api` or the GitHub UI/API available to you, but do not change unrelated repo settings.

---

# PHASE G — PUBLIC-SITE BEHAVIOR

The deployed site should open directly into a useful landing/presentation state.

Verify at minimum:

- page loads without 404 asset failures;
- WebGL scene initializes;
- LT is the default;
- EN can be selected;
- Start presentation works;
- keyboard navigation works;
- Explore mode works if part of the current production UI;
- QR/public-site route does not point to localhost;
- no debug/study query mode is shown by default;
- no console/page errors beyond known documented warnings;
- no required assets are blocked by Pages subpath handling.

Do not change the final QR destination inside the presentation unless the owner has explicitly approved using this GitHub Pages URL as the public destination.

If the presentation still contains a placeholder QR, leave it unless the owner has already asked to replace it.

---

# PHASE H — DEPLOY AND VERIFY

After pushing:

1. confirm the GitHub Actions Pages workflow starts;
2. wait for it to finish;
3. inspect the workflow result;
4. open the final Pages URL;
5. test it in a browser at desktop size;
6. reload it directly from the Pages URL to catch base-path / routing errors;
7. test the opening presentation and several representative chapters;
8. test the language switch;
9. inspect browser console/network for missing assets or errors.

If Pages fails:

- diagnose the actual build/deploy/base-path problem;
- make the smallest deployment-only fix;
- rerun local checks;
- commit that fix separately;
- push and verify again.

Do not make visual/design changes while debugging deployment.

---

# PHASE I — OPTIONAL README POLISH

Only if the existing README is absent or clearly insufficient, add a concise README containing:

- project name;
- one-sentence purpose;
- tech stack;
- `npm install` / `npm run dev` instructions;
- production build command;
- portable/offline build command if present;
- keyboard/presentation basics;
- note that Lithuanian is the default and English is available;
- deployed site link after it exists.

Do not publish private emails in the README unless they are already intentionally public in the presentation itself.

Do not add marketing fluff or rewrite technical documentation.

---

# FINAL REPORT

At completion report exactly:

1. Stage 3 completion evidence used.
2. Final local branch.
3. Final implementation commit hash.
4. Deployment commit hash if separate.
5. GitHub owner/repository.
6. Repository visibility.
7. GitHub repository URL.
8. GitHub Pages URL.
9. Pages workflow run result.
10. Local validation results.
11. Live-site validation results.
12. Any files intentionally excluded from Git because of size.
13. Any remaining TODOs, especially:
    - final QR destination;
    - presenter images/likenesses;
    - final narration/rehearsal;
    - any known performance limitation.

Do not claim success until the deployed Pages URL has actually loaded and been tested.

---

# STOP CONDITIONS

STOP and ask the owner rather than guessing if:

- the other code account is still modifying the repository;
- the Stage 3 report says implementation is incomplete;
- an existing GitHub repository with the preferred name appears unrelated;
- an existing `origin` points to an unrelated repo;
- enabling public GitHub Pages would require making a private repository public;
- `gh auth status` is not authenticated to the intended owner;
- a push would require force-pushing unrelated history;
- deployment would require exposing a secret;
- Stage 3 validation fails in a way that suggests the implementation itself is broken rather than merely the deployment configuration.

Do not start Stage 4 or another visual redesign.
