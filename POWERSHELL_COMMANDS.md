# Complete PowerShell Commands for Deployment

## PowerShell Commands (Copy & Paste):

```powershell
cd "g:/My Drive/AI/Waterjet nc file reader"
git config user.name "Suhail"
git config user.email "suhail.shah14@gmail.com"
git add -A
git commit -m "Initial commit: Waterjet Simulator ready for deployment"
git remote set-url origin https://github.com/suhailaser/waterjet-simulator.git
git push -u origin main
```

## Manual Step Required:
**After the commit, BEFORE the push:**
1. Go to: https://github.com/new
2. Create repository named: `waterjet-simulator`
3. Make it Public
4. Don't initialize with README
5. Click "Create repository"

## Then continue with the push command.

## What Each Command Does:
- `cd` - Change to your project directory
- `git config` - Set your git identity
- `git add -A` - Add all files to git
- `git commit` - Create commit with your changes
- `git remote set-url` - Set the GitHub repository URL
- `git push` - Push to GitHub (after creating repo)