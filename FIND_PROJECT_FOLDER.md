# Find Your Project Directory

## Step 1: Check what's in G:\ drive
```powershell
dir
dir g:\
ls
```

## Step 2: Look for the My Drive folder
```powershell
dir "My Drive"
ls "My Drive"
```

## Step 3: If you find it, navigate to your project
```powershell
cd "My Drive"
dir "AI"
cd "AI"
dir
```

## Step 4: Look for your project folder
```powershell
dir
```

## Alternative - Search for your project files:
```powershell
dir /s package.json
dir /s *.md
```

## If you still can't find it, try:
```powershell
Get-ChildItem -Path G:\ -Recurse -Directory -Name "*Waterjet*" -ErrorAction SilentlyContinue
```

## Or search for specific files:
```powershell
Get-ChildItem -Path G:\ -Recurse -Filter "package.json" -ErrorAction SilentlyContinue