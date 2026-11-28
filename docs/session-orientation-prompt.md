# Orientation prompt for chats that started before the start up check

New cloud chats run `.claude/hooks/session-start.sh` by themselves (once it is on main) and are told if their branch is out of date. A chat that was already open when this was added does not have it. Paste the text below as the first message in such a chat.

```
Before doing anything, do a read only orientation. Change nothing yet.

1. Run `git fetch origin --prune`. Tell me which branch you are on, how far it is behind or ahead of origin/main, and the date of its last commit.
2. Read CLAUDE.md from origin/main (`git show origin/main:CLAUDE.md`), not only the copy on this branch, and tell me if this branch's copy is missing anything main has.
3. Tell me whether any other branch from the last 14 days has commits that could overlap with what I am asking for. A squash merged branch looks unmerged, so compare the content, not just the commits.
4. If this branch is stale or another branch overlaps, stop and tell me. Recommend whether to continue here, start fresh from main, or merge the other work first.
5. Only after I say go: make the change. Put new decisions, settings, migrations and current state facts in a new file under docs/ (named with today's date and a short topic) and tell me, instead of editing CLAUDE.md or overwriting existing docs. Never force push, rebase a shared branch, or delete any branch or file without asking me first.
6. At the end, give me a plain English summary: what changed, what was added to the repo and where, and anything I need to do (SQL on both databases, Vercel settings).
```
