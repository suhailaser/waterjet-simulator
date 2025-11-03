# Detailed Render Deployment Steps

## Step 1: Access Render
1. Open your web browser
2. Go to: **https://render.com**
3. Click **"Get Started for Free"** or **"Sign Up"**
4. Choose **"Sign up with GitHub"** (recommended - it will see your repository automatically)

## Step 2: Create New Web Service
1. Once logged in, click the **"New +"** button (top right)
2. Select **"Web Service"** from the dropdown
3. Click **"Build and deploy from a Git repository"**

## Step 3: Connect Your Repository
1. You'll see a list of your GitHub repositories
2. Look for **"suhailaser/waterjet-simulator"** 
3. Click the **"Connect"** button next to it

## Step 4: Configure the Deployment
Fill out these settings exactly:

**Basic Settings:**
- **Name**: `waterjet-simulator` (or any name you prefer)
- **Region**: Select closest to you (e.g., "Oregon (US West)")
- **Branch**: `main` (should be pre-selected)

**Build and Deploy:**
- **Root Directory**: (leave this blank)
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Environment Variables** (leave these empty for now)

## Step 5: Create the Service
1. Click the **"Create Web Service"** button
2. Render will start building your application
3. You'll see logs showing the build process

## Step 6: Wait for Deployment
- Build process takes 2-5 minutes
- You'll see status updates in real-time
- Once complete, you'll get a URL like: `https://waterjet-simulator.onrender.com`

## Step 7: Test Your Application
1. Click the URL Render provides
2. Test the features:
   - Click "SHEET-3670" button
   - Click "TEST-1234" button
   - Try the cutting simulation
   - Test the cut time calculator

## Troubleshooting:
- If build fails, check the logs for errors
- If app doesn't load, wait a few more minutes for deployment to complete
- The free tier may take longer to cold start

**Your waterjet simulator will be live!** 🎉