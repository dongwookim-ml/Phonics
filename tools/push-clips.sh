#!/bin/sh
# Commits what a job of .github/workflows/polly.yml recorded or checked and
# pushes it to the branch the workflow runs on. $1 is the commit message.
#   sh tools/push-clips.sh --stage DIR   copies the new and changed files to DIR
#                                        first, so the workflow can keep them as
#                                        an artifact even if the push fails.
FILES="tools/tts-phrases.json tools/polly-clips.json tools/polly-variants.json tools/polly-voices.json
tools/polly-gains.json tools/voice-check.json tools/clip-check.json"
if [ "$1" = "--stage" ]; then
  rm -rf "$2"
  mkdir -p "$2"
  { git ls-files --others --exclude-standard audio; git diff --name-only -- audio; } | sort -u | while read -r f; do
    if [ -f "$f" ]; then mkdir -p "$2/$(dirname "$f")" && cp "$f" "$2/$f"; fi
  done
  for f in $FILES; do
    if [ -e "$f" ]; then mkdir -p "$2/tools" && cp "$f" "$2/$f"; fi
  done
  echo "staged $(find "$2" -type f | wc -l) files in $2"
  exit 0
fi
git config user.name 'github-actions[bot]'
git config user.email '41898299+github-actions[bot]@users.noreply.github.com'
git add -A audio
for f in $FILES; do
  [ -e "$f" ] && git add "$f"
done
git diff --cached --quiet && exit 0
git commit -qm "$1"
for i in 1 2 3; do
  git pull -q --rebase origin "$GITHUB_REF_NAME" && git push -q origin "HEAD:$GITHUB_REF_NAME" && exit 0
  sleep 5
done
exit 1
