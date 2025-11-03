# PowerShell Commands to Find Your Project

## Commands to copy and paste:

```powershell
dir
dir g:\
dir "My Drive"
cd "My Drive"
dir
dir "AI"
cd "AI"
dir
```

## If you see your project folder, navigate to it:
```powershell
cd "Waterjet nc file reader"
dir
```

## Alternative search commands:
```powershell
Get-ChildItem -Path G:\ -Recurse -Directory -Name "*Waterjet*" -ErrorAction SilentlyContinue
Get-ChildItem -Path G:\ -Recurse -Filter "package.json" -ErrorAction SilentlyContinue
```

## Once you find your project folder, run these git commands:
```powershell
git config user.name "Suhail"
git config user.email "suhail.shah14@gmail.com"
git add -A
git commit -m "Initial commit: Waterjet Simulator ready for deployment"
git remote set-url origin https://github.com/suhailaser/waterjet-simulator.git
git push -u origin main