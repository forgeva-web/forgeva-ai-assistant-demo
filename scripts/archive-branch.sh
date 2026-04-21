#!/usr/bin/env bash

set -e

echo "🔹 Starting branch archive workflow..."

# Ensure we're inside a git repo
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  echo "❌ Not inside a git repository."
  exit 1
}

# Prompt for commit/tag message
read -p "📝 Enter commit & tag message: " MESSAGE
if [ -z "$MESSAGE" ]; then
  echo "❌ Message cannot be empty."
  exit 1
fi

# Prompt for branch to archive
read -p "🌿 Enter branch name to archive: " BRANCH
if ! git show-ref --verify --quiet refs/heads/$BRANCH; then
  echo "❌ Branch '$BRANCH' does not exist locally."
  exit 1
fi

# Auto-generate tag
TAG="archive/$BRANCH"
echo "🏷️ Auto-generated tag: $TAG"

# Confirm staging
read -p "➡️ Stage all changes with 'git add .'? (y/n): " CONFIRM_ADD
if [[ "$CONFIRM_ADD" == "y" ]]; then
  git add .
else
  echo "❌ Aborted."
  exit 1
fi

# Confirm commit
read -p "➡️ Commit changes with message \"$MESSAGE\"? (y/n): " CONFIRM_COMMIT
if [[ "$CONFIRM_COMMIT" == "y" ]]; then
  git commit -m "$MESSAGE" || echo "⚠️ Nothing to commit."
else
  echo "❌ Aborted."
  exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Confirm push current branch
read -p "➡️ Push current branch '$CURRENT_BRANCH' to origin? (y/n): " CONFIRM_PUSH
if [[ "$CONFIRM_PUSH" == "y" ]]; then
  git push origin "$CURRENT_BRANCH"
else
  echo "❌ Aborted."
  exit 1
fi

# Confirm tag creation
read -p "➡️ Create tag '$TAG' from '$BRANCH'? (y/n): " CONFIRM_TAG
if [[ "$CONFIRM_TAG" == "y" ]]; then
  git tag -a "$TAG" "$BRANCH" -m "$MESSAGE"
else
  echo "❌ Aborted."
  exit 1
fi

# Confirm push tag
read -p "➡️ Push tag '$TAG' to origin? (y/n): " CONFIRM_PUSH_TAG
if [[ "$CONFIRM_PUSH_TAG" == "y" ]]; then
  git push origin "$TAG"
else
  echo "❌ Aborted."
  exit 1
fi

# Confirm delete local branch
read -p "⚠️ Delete LOCAL branch '$BRANCH'? (y/n): " CONFIRM_DELETE_LOCAL
if [[ "$CONFIRM_DELETE_LOCAL" == "y" ]]; then
  git branch -d "$BRANCH"
else
  echo "❌ Aborted."
  exit 1
fi

# Confirm delete remote branch
read -p "⚠️ Delete REMOTE branch '$BRANCH'? (y/n): " CONFIRM_DELETE_REMOTE
if [[ "$CONFIRM_DELETE_REMOTE" == "y" ]]; then
  git push origin --delete "$BRANCH"
else
  echo "❌ Aborted."
  exit 1
fi

# Confirm prune
read -p "🧹 Run 'git fetch --prune'? (y/n): " CONFIRM_PRUNE
if [[ "$CONFIRM_PRUNE" == "y" ]]; then
  git fetch --prune
else
  echo "⚠️ Skipped pruning."
fi

echo "✅ Archive complete for '$BRANCH' → '$TAG'"