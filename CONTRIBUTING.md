# Contributing

Bug reports and focused pull requests are welcome. Be respectful, explain the user-visible problem, and avoid including private conversations or credentials.

## Development

You need [Bun](https://bun.sh/) and Node.js 22 or later for development. Users do not need either to run the plugin.

```sh
bun install --frozen-lockfile
bun run check
```

The tests invoke the real module's event handlers with a small host fixture. They verify the plugin's lifecycle decisions; they do not emulate Claude's model, rendering, or message queue. No Claude login or model usage is needed for these tests.

With a compatible Claude Code installation, also run:

```sh
bun run validate:plugin
bun run validate:marketplace
```

Try changes in a fresh, disposable session:

```sh
claude --plugin-dir .
```

Disable any other installation of Auto TLDR before trying a local copy. Ask two ordinary questions and verify that each answer produces exactly one summary. Ask for TLDR manually and verify that its answer does not produce another summary. This live check uses your Claude account and model allowance.

## Pull requests

Describe what changes for users, why it changes, and which checks you ran. Add a behavior test for a bug or lifecycle change. Keep unrelated refactors out of the same PR. Run `bun run format` before committing.

Do not copy Claude's bundled source or generated type declarations into the repository. Link to the public API documentation instead.

## Releases

Update the version in `package.json`, `.claude-plugin/plugin.json`, and `.claude-plugin/marketplace.json` together. Update the changelog, run the checks and live smoke test, then tag the tested commit as `vX.Y.Z`. GitHub's source archive is the plugin: it needs no compiled assets or dependency installation.
