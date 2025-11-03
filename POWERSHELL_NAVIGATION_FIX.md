# PowerShell Navigation Fix

## Step 1: Check where you are
```powershell
pwd
ls
```

## Step 2: Navigate to your project directory
```powershell
cd g:\My Drive\AI\Waterjet nc file reader
```

## Step 3: Alternative if above doesn't work
```powershell
cd "g:\My Drive\AI\Waterjet nc file reader"
```

## Step 4: If still issues, try navigating step by step
```powershell
cd g:\
cd "My Drive\AI\Waterjet nc file reader"
```

## Alternative approach - Run commands directly in the project folder:
1. Open File Explorer
2. Navigate to your project folder: `g:\My Drive\AI\Waterjet nc file reader`
3. Right-click in the folder and select "Open PowerShell window here"
4. Then run the git commands directly

## Complete commands once in the right directory:
```powershell
git config user.name "Suhail"
git config user.email "suhail.shah14@gmail.com"
git add -A
git commit -m "Initial commit: Waterjet Simulator ready for deployment"
git remote set-url origin https://github.com/suhailaser/waterjet-simulator.git
git push -u origin main