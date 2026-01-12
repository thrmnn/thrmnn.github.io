# Git Hooks

This directory contains shared git hooks for the project. These hooks are checked into version control so the entire team can benefit from consistent automation.

## Available Hooks

### pre-commit

**Purpose:** Automatically runs `sync_personal_info.py` whenever `PERSONAL_INFO.md` is staged for commit.

**What it does:**
- Detects if `PERSONAL_INFO.md` is in your staged changes
- Automatically runs the Python sync script to update all configuration files
- Auto-stages the modified config and content files
- Prevents commits if the sync script fails
- Provides clear feedback about what was synced

## Setup Instructions

### Option 1: Configure Git to Use This Hooks Directory (Recommended)

This is the easiest approach and requires no symlinks:

```bash
# Configure git to look for hooks in .githooks instead of .git/hooks
git config core.hooksPath .githooks

# Verify the configuration
git config core.hooksPath
```

After this configuration, all hooks in `.githooks/` are automatically used. New team members just need to run this one command after cloning.

### Option 2: Create Symlink (Manual)

If you prefer a traditional symlink approach:

```bash
# Make the hook executable
chmod +x .githooks/pre-commit

# Create a symlink in .git/hooks (from the repo root)
ln -sf ../../.githooks/pre-commit .git/hooks/pre-commit

# Verify the symlink
ls -la .git/hooks/pre-commit
```

### Option 3: Copy Hook (Not Recommended)

Less ideal because updates to the hook won't be shared:

```bash
chmod +x .githooks/pre-commit
cp .githooks/pre-commit .git/hooks/pre-commit
```

## For Team Members

To set up the hooks after cloning the repository:

```bash
# Clone the repository first
git clone https://github.com/thrmnn/thrmnn.github.io.git
cd thrmnn.github.io

# Configure git to use .githooks
git config core.hooksPath .githooks

# Test that the hook is working
echo "test" >> PERSONAL_INFO.md
git add PERSONAL_INFO.md
git commit -m "test"  # This will trigger the pre-commit hook
```

## Making Hooks Executable

If you see "Permission denied" errors when the hook runs, make it executable:

```bash
chmod +x .githooks/pre-commit
```

## Bypassing Hooks (When Necessary)

To bypass the pre-commit hook (use with caution):

```bash
git commit --no-verify
```

This should only be used in exceptional cases, such as:
- Emergency hotfixes where sync can be done manually later
- Temporarily undoing automated changes
- Debugging hook issues

## Troubleshooting

### Hook not running

1. Verify configuration: `git config core.hooksPath`
2. Check file permissions: `ls -la .githooks/pre-commit`
3. Make executable: `chmod +x .githooks/pre-commit`
4. Verify Python 3 is installed: `python3 --version`

### Python script not found

- Ensure `sync_personal_info.py` exists in the repository root
- Check that Python 3 is available: `python3 --version`
- Run the script manually to see detailed error messages:
  ```bash
  python3 sync_personal_info.py
  ```

### Hook runs but doesn't sync

1. Check that `PERSONAL_INFO.md` is actually staged: `git status`
2. Look at the hook output carefully for error messages
3. Test the script directly:
   ```bash
   python3 sync_personal_info.py
   ```

## Updating Hooks

When hooks are updated in the repository:

```bash
# Pull the latest changes
git pull

# Reapply the current configuration
git config core.hooksPath .githooks

# Verify the hook file permissions
chmod +x .githooks/pre-commit
```

## Creating New Hooks

To add a new hook:

1. Create the file in `.githooks/` with the appropriate name:
   - `pre-commit` - runs before commits
   - `pre-push` - runs before pushing
   - `post-checkout` - runs after checking out branches
   - etc.

2. Make it executable: `chmod +x .githooks/hook-name`

3. Add documentation to this README

4. Commit both the hook and this README

Example structure for a new hook:

```bash
#!/usr/bin/env bash
# Standard header with description
# Explain what the hook does and how to troubleshoot

set -e  # Exit on first error

# Your hook logic here
```

## Resources

- [Git Hooks Documentation](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [git config core.hooksPath](https://git-scm.com/docs/git-config#core.hooksPath)
- [Husky (Alternative Hook Manager for Node Projects)](https://typicode.github.io/husky/)
