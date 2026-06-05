/**
 * Install git pre-push hook.
 * Run manually: node .hooks/install.js
 * Or auto-installed via root project's postinstall.
 */
const fs = require('fs');
const path = require('path');

function resolveGitDir(dir) {
  const dotGit = path.join(dir, '.git');
  try {
    const stat = fs.statSync(dotGit);
    if (stat.isDirectory()) return dotGit;
  } catch {
    return null;
  }
  const content = fs.readFileSync(dotGit, 'utf8').trim();
  const match = content.match(/^gitdir:\s*(.+)$/);
  if (match) {
    const resolved = path.resolve(dir, match[1]);
    return fs.existsSync(resolved) ? resolved : null;
  }
  return null;
}

const gitDir = resolveGitDir(process.cwd());
if (!gitDir) {
  console.log('[hooks] .git not found — skipping hook install');
  process.exit(0);
}

const hooksDir = path.join(gitDir, 'hooks');
fs.mkdirSync(hooksDir, {recursive: true});

const hookPath = path.join(hooksDir, 'pre-push');
const hookContent = `#!/bin/sh
# Auto-installed pre-push hook — uses root project's lint tools
# Re-install: node .hooks/install.js

# Find root project (parent of submodule)
ROOT=$(git rev-parse --show-superproject-working-tree 2>/dev/null)
if [ -z "$ROOT" ]; then
  echo "[pre-push] Not inside a superproject — skipping lint"
  exit 0
fi

SUBDIR=$(basename "$(pwd)")

# Check root project has node_modules
if [ ! -d "$ROOT/node_modules/.bin" ]; then
  echo "[pre-push] Root project node_modules not found. Run 'npm install' in $ROOT"
  exit 1
fi

echo "[pre-push] Running lint check via root project..."
"$ROOT/node_modules/.bin/eslint" "assets/$SUBDIR/**/*.ts" \\
  --ignore-pattern "**/node_modules/**" \\
  --no-error-on-unmatched-pattern 2>&1
LINT_EXIT=$?

if [ $LINT_EXIT -ne 0 ] && [ $LINT_EXIT -ne 2 ]; then
  # exit 2 = no files matched, that's ok
  echo ""
  echo "❌ Lint errors found. Push aborted."
  echo "   Run this to auto-fix:"
  echo "   cd $ROOT && npx eslint assets/$SUBDIR/**/*.ts --fix"
  echo ""
  exit 1
fi

echo "[pre-push] Running format check..."
"$ROOT/node_modules/.bin/prettier" --check "assets/$SUBDIR/**/*.ts" \\
  --ignore-path "assets/$SUBDIR/.gitignore" 2>&1
FORMAT_EXIT=$?

if [ $FORMAT_EXIT -ne 0 ]; then
  echo ""
  echo "❌ Formatting issues found. Push aborted."
  echo "   Run this to auto-fix:"
  echo "   cd $ROOT && npx prettier --write assets/$SUBDIR/**/*.ts"
  echo ""
  exit 1
fi

echo "[pre-push] ✅ All checks passed."
`;

fs.writeFileSync(hookPath, hookContent);
fs.chmodSync(hookPath, '755');
console.log(`[hooks] pre-push hook installed → ${hookPath}`);
