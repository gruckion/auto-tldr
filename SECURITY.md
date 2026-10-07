# Security

Auto TLDR runs as a Claude Code mod with the permissions of its host session. Its own code only observes turn events, queues the fixed summary prompt, and logs submission errors. It does not read credentials, access files, run shell commands, or make direct network requests.

The follow-up is a real model turn. It inherits the session's tools, permissions, instructions, and other hooks. This plugin is not a sandbox or a guard against prompt injection.

Do not include tokens, private conversation transcripts, or sensitive project data in public issues. Use GitHub's **Report a vulnerability** option in the repository's Security tab if available. If private reporting is unavailable, open an issue asking for a private reporting channel without including vulnerability details.

Security fixes target the latest released version. There is no guaranteed response time or support commitment.
