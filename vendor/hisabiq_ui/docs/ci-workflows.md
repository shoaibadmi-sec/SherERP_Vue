# HisabIQ GitHub Actions: fast PR workflow

## PR checks

`.github/workflows/pr-ci.yml` is the single automatically triggered pull-request
quality gate for application changes. It cancels superseded revisions of a PR,
installs dependencies once with npm download caching, runs TypeScript, ESLint,
the UI contract, the complete TypeScript unit suite, and a Vite production build.

For changes under `src/`, impacted module patterns select light Playwright smoke
checks. Chromium is installed only when one of those checks is relevant.
A generic page-navigation smoke check runs on source changes; targeted tests cover
POS, purchases, party, finance, shared dialogs, and compact mobile carts. PRs that change Markdown
documentation alone do not automatically run CI.

## Thorough regression testing

`ui-check.yml` is the original complete regression check with its testing
commands preserved. Run it from **Actions > UI Check > Run workflow** before
significant releases. It also runs nightly at 19:00 UTC (01:00 Asia/Dhaka).
Individual specialized workflows are retained as **workflow_dispatch** actions;
select a workflow from Actions and click **Run workflow** for focused deep
investigations. Their test commands have not been removed.

**Important:** Some specialized browser tests are not in the fast PR smoke gate.
Run the relevant focused manual check for risky module changes, especially
installments, bundle versioning, serials, finance, and responsive overlays.

## Troubleshooting

- A new PR commit cancels its prior fast CI run using GitHub Actions concurrency.
- `setup-node` caches npm download artifacts; it does not cache `node_modules`.
- A test failure should be fixed rather than bypassing the gate.
- Source files and package scripts are unchanged; Vite/ESLint replacement is not
  part of this CI-only optimization.
- Reevaluate PR smoke selection after modules are moved or renamed.
