# CI initialization

The first feature-branch push triggers `.github/workflows/lockfile.yml` to resolve dependencies, commit a real `pnpm-lock.yaml` and format sources; **until this completes, the branch is not verifiably reproducible**. Then the PR triggers `.github/workflows/verify.yml` (static and full Docker+Chromium E2EE acceptance). Do not merge on missing/failed jobs. The lockfile workflow is branch-scoped for initial bootstrap and should be deleted or replaced by a maintainer-controlled dependency update process after stage 1.
