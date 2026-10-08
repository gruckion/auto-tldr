# Changelog

Versions follow [Semantic Versioning](https://semver.org/).

## 1.1.0

- Add opt-in Jev decisions to skip summaries that would repeat a brief, self-contained answer.
- Read TypeSafe credentials from a private `.env` outside the plugin cache.
- Send only the completed answer to Jev; require a probability of at least 0.7.
- Skip summaries on unavailable/invalid decisions, a 15-second deadline, or newer input.
- Preserve the original behavior when Jev is not configured.
- Document external data handling, configuration, and failure behavior.

## 1.0.2

- Package Auto TLDR as a standalone Claude Code plugin and marketplace.
- Automatically request a self-contained summary in the same conversation.
- Prevent recursive summaries, duplicate completion handling, and summaries of subagent responses.
- Skip unsuccessful or empty answers and cancel stale summaries before submission.
- Include installation docs, lifecycle tests, and CI.

Earlier versions were local prototypes, not standalone repository releases.
