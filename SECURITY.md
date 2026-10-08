# Security

Auto TLDR runs as a Claude Code mod with the permissions of its host session. Its code observes turn events, queues the fixed summary prompt, and logs generic errors. Optional Jev filtering reads a local `.env` containing a TypeSafe API key and sends eligible completed assistant answers to `https://api.typesafe.ai/v1/systemone`. It does not send full chat history, run shell commands, or write conversation data. The model and API endpoint are not taken from a project file; the endpoint is fixed in source. Keep the configuration file private (mode 600) and out of version control.

The follow-up is a real model turn. It inherits the session's tools, permissions, instructions, and other hooks. This plugin is not a sandbox or a guard against prompt injection.

Do not include tokens, private conversation transcripts, or sensitive project data in public issues. Use GitHub's **Report a vulnerability** option in the repository's Security tab if available. If private reporting is unavailable, open an issue asking for a private reporting channel without including vulnerability details.

Security fixes target the latest released version. There is no guaranteed response time or support commitment.
