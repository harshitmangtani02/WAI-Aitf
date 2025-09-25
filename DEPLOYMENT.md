# Deployment Guide for Weather Fashion Chatbot

## Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- OpenAI API key

### Step 1: Push to GitHub
1. Make sure your code is committed to a GitHub repository
2. Push all changes to your main branch

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project
5. **Important**: Use the default build settings (no custom vercel.json needed)

### Step 3: Configure Environment Variables
In your Vercel project dashboard:
1. Go to Settings → Environment Variables
2. Add the following variable:
   - `OPENAI_API_KEY`: Your OpenAI API key

### Step 4: Deploy
1. Click "Deploy"
2. Vercel will build and deploy your app automatically
3. You'll get a live URL once deployment is complete

### Troubleshooting
If you encounter "Unexpected token '<'" errors:
1. Make sure no custom `vercel.json` routing is interfering with asset serving
2. Let Vercel auto-detect the Next.js configuration
3. Ensure the build command is `next build` (without --turbopack for production)

### Automatic Deployments
- Every push to your main branch will trigger a new deployment
- Pull requests will create preview deployments

### Custom Domain (Optional)
1. Go to Settings → Domains in your Vercel dashboard
2. Add your custom domain
3. Follow the DNS configuration instructions

## Environment Variables Required
- `OPENAI_API_KEY`: Required for AI-powered location identification and weather analysis

## Notes
- The app uses Open-Meteo API for weather data (no API key required)
- Make sure your OpenAI API key has sufficient credits
- Build uses standard Next.js compilation (turbopack disabled for production)
- No custom Vercel configuration needed - auto-detection works best