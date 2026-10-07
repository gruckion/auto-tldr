# Auto TLDR

**A separate, self-contained summary after each Claude Code answer. In the same conversation.**

[![CI](https://github.com/gruckion/auto-tldr/actions/workflows/ci.yml/badge.svg)](https://github.com/gruckion/auto-tldr/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Claude gives you a detailed answer. Auto TLDR follows it with a new user message:

> TLDR in a self-contained way that doesn't require me to read the previous comments.

Claude then replies with a standalone summary. In clients with a **Read aloud** button per reply, you can choose the summary without listening to the entire original answer first.

```text
You       Explain what changed and what I need to do next.
Claude    [Detailed answer]
Auto TLDR [Sends the summary request as a new user message]
Claude    [Self-contained summary]
```

Auto TLDR is a small [Claude Code mod](https://code.claude.com/docs/en/plugins/mods/overview), packaged as a plugin. It is independent of any project or dashboard. It has no runtime dependencies, build step, API keys, or separate service.

## Requirements

- Claude Code **2.1.287+** in the terminal, or Claude Desktop with an embedded Claude Code **2.1.286+** in its **Code** tab.
- Mods must be allowed by your Claude Code settings and organization.
- A persistent conversation that can accept another prompt. A one-shot `claude -p` process that exits after its response is not the intended use.

Check `claude --version` in your shell, or `/status` in a Desktop Code session. These minimums come from [Anthropic's mods documentation](https://code.claude.com/docs/en/plugins/mods/overview#turn-mods-on-or-off). This plugin was exercised with the Desktop engine at 2.1.289.

This is for **Claude Code**, not ordinary Claude Chat or Cowork conversations. For Remote Control, install it on the machine running the Claude Code session. Installing it on your Mac does not install it on a separate SSH host or cloud environment.

## Install globally

Run in your terminal:

```sh
claude plugin marketplace add gruckion/auto-tldr
claude plugin install auto-tldr@auto-tldr --scope user
```

The first `auto-tldr` is the plugin name; the second is this repository's marketplace name. User scope enables it across your local projects.

Start a new Claude Code session. For a session already open, run:

```text
/reload-plugins
```

It takes effect from the next turn it observes starting. Reloading halfway through an answer does not retrospectively summarize that answer.

While this repository is private, installation requires repository access and authenticated Git. Once public, the same commands work for everyone.

### Try without installing

```sh
git clone https://github.com/gruckion/auto-tldr.git
claude --plugin-dir ./auto-tldr
```

Or download a source ZIP from GitHub, extract it, and pass the extracted directory to `--plugin-dir`. There is no dependency-install step for users.

Load only one copy of the plugin. If you already installed it globally, disable that installation before testing a clone. Disable older local installations before installing this distribution.

## Use it

Ask a question normally. After the answer finishes, the plugin submits its summary request automatically. Both answers stay in the same thread. There is no command to invoke for each response.

It will not request another summary for a turn whose prompt starts with `TLDR`, `TL;DR`, or `TL:DR`, including the plugin's own prompt. It also skips subagent replies, interrupted turns, errors, refusals, and answers with no visible text.

If newer input arrives before the plugin submits its request, it skips the stale summary. Once a request has entered Claude's queue, normal queue ordering applies; Auto TLDR does not cancel it or interrupt an active response.

**Each summary is an additional model turn.** It uses your existing Claude model, context, permissions, and usage allowance. The plugin requests a concise answer; the model decides its wording and length. It does not impose a word limit or disable the model's tools.

## Update, disable, or remove

```sh
# Refresh the catalog and install the latest plugin version.
claude plugin marketplace update auto-tldr
claude plugin update auto-tldr@auto-tldr --scope user

# Turn it off without uninstalling.
claude plugin disable auto-tldr@auto-tldr --scope user

# Turn it back on.
claude plugin enable auto-tldr@auto-tldr --scope user

# Remove it.
claude plugin uninstall auto-tldr@auto-tldr --scope user
```

After changing an installation, run `/reload-plugins` in existing sessions or start a new session.

## How it works

The implementation is [one JavaScript module](hooks/register.js):

1. `turn.start` records the main turn and whether it is already a TLDR request.
2. `turn.complete` checks for a successful, nonempty main-agent answer and consumes that completion once.
3. A deferred callback calls `$.prompt.submit({ text, asUser: true })`, which queues a new prompt for the same session once it is idle.
4. Input and session-end events invalidate summary work that has not been submitted yet.

This uses Claude's [documented mods API](https://code.claude.com/docs/en/plugins/mods/api#start-a-turn-from-a-background-job). It does not parse logs, poll a process, edit transcripts, automate the UI, or start another Claude process. Plugin provenance is retained even with `asUser: true`.

The plugin itself makes no network requests, writes no conversation files, reads no credentials, and adds no telemetry. Its in-memory state is limited to the current turn ID, an eligibility flag, and a generation counter. Claude still handles the conversation and model requests as usual. It does not rewrite your `CLAUDE.md` or replace existing hooks.

## Troubleshooting and verification

- **No automatic message:** check your version, run `/reload-plugins`, and inspect `/plugin` to confirm Auto TLDR is enabled. Safe mode, disabled hooks, or organization policy can prevent mods from loading.
- **Two summary requests:** check for two installed copies, especially an older local prototype or a simultaneous `--plugin-dir` load.
- **Summary appears inline as well:** review your own instructions that ask Claude to append a TLDR. The plugin leaves those instructions unchanged.
- **Other prompt hooks interfere:** Auto TLDR uses Claude's ordinary prompt submission path, so other hooks can reject or alter the request.
- **Phone playback:** separate messages and a separate Read aloud button were verified in Claude Desktop. Physical iPhone playback has not yet been verified. Remote Control rendering is handled by Claude's clients.

Before installing a downloaded copy, inspect its code or run:

```sh
claude plugin validate --strict ./auto-tldr
```

The automated tests cover lifecycle decisions and loop prevention. They do not prove a client's audio behavior. See [CONTRIBUTING.md](CONTRIBUTING.md) for development and live verification instructions.

## Contributing and license

[Report a bug](https://github.com/gruckion/auto-tldr/issues/new?template=bug_report.yml), suggest an improvement, or send a focused pull request. Please remove private conversation content from reports.

[MIT licensed](LICENSE). This is an independent community project, not an official Anthropic product.
