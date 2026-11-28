#!/bin/bash
# Kestrel start up check. Runs at the start of every cloud session.
# It changes nothing. It fetches, compares this session's branch with main, and
# prints a short note that Claude reads before doing any work. It always exits 0,
# so a network problem can never stop a session from starting.
set -uo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

timeout 25 git fetch -q origin main 2>/dev/null || {
  echo "KESTREL START CHECK: could not reach GitHub to compare this branch with main. Say so to Steve and treat this branch as possibly out of date."
  exit 0
}

branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
behind="$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)"
ahead="$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)"
main_date="$(git log -1 --format=%cs origin/main 2>/dev/null || echo unknown)"
main_sha="$(git log -1 --format=%h origin/main 2>/dev/null || echo unknown)"
claude_behind="no"
if [ "$behind" -gt 0 ] && ! git diff --quiet HEAD origin/main -- CLAUDE.md 2>/dev/null; then
  claude_behind="yes"
fi

echo "KESTREL START CHECK (automatic, read this before doing anything else)"
echo "Branch: $branch. Main is at $main_sha ($main_date). This branch is $behind commit(s) behind main and $ahead ahead."

if [ "$behind" -eq 0 ]; then
  echo "This branch is up to date with main. Carry on, and still read CLAUDE.md first."
else
  echo "THIS BRANCH IS OUT OF DATE. Before any work, tell Steve in 1 plain sentence, then:"
  echo "  1. Read CLAUDE.md from origin/main (git show origin/main:CLAUDE.md), because the copy on this branch is missing newer decisions (CLAUDE.md differs: $claude_behind)."
  if [ "$ahead" -eq 0 ]; then
    echo "  2. This branch has no work of its own, so bring it up to date with: git merge --ff-only origin/main"
  else
    echo "  2. This branch has $ahead commit(s) of its own. Check them with: git log origin/main..HEAD --oneline"
    echo "     If that work is already in main (a squash merge looks unmerged), restart the branch from origin/main. If it is not, merge origin/main in. Never force push over work that is not in main, and never rebase a shared branch."
  fi
fi

echo "Rules that stop work being lost: change nothing until you have read CLAUDE.md. Put new decisions and notes in a new file under docs/ and tell Steve, instead of overwriting existing docs. Never delete a branch or a file without Steve's yes. Before you finish, make sure everything you made is committed and pushed, and say where it ended up."
exit 0
