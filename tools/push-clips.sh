#!/bin/sh
# Commits what a job of .github/workflows/polly.yml recorded or checked and
# pushes it to the branch the workflow runs on. $1 is the commit message.
git config user.name 'github-actions[bot]'
git config user.email '41898299+github-actions[bot]@users.noreply.github.com'
git add -A audio
for f in tools/polly-clips.json tools/polly-variants.json tools/polly-voices.json tools/voice-check.json; do
  [ -e "$f" ] && git add "$f"
done
git diff --cached --quiet && exit 0
git commit -qm "$1"
for i in 1 2 3; do
  git pull -q --rebase origin "$GITHUB_REF_NAME" && git push -q origin "HEAD:$GITHUB_REF_NAME" && exit 0
  sleep 5
done
exit 1
