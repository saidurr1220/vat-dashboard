# 🚀 Vercel Deployment Guide

## Prerequisites

1. **GitHub Account**: Your code should be in a GitHub repository
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Database**: PostgreSQL database (Neon recommended)

## Step-by-Step Deployment

### 1. Prepare Your Database

#### Option A: Neon Database (Recommended)

1. Go to [neon.tech](https://neon.tech)
2. Create a free account
3. Create a new database
4. Copy the connection string

#### Option B: Other PostgreSQL Providers

- **Supabase**: [supabase.com](https://supabase.com)
- **Railway**: [railway.app](https://railway.app)
- **PlanetScale**: [planetscale.com](https://planetscale.com)

### 2. Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Add your GitHub repository
git remote add origin https://github.com/yourusername/vat-dashboard.git
git branch -M main
git push -u origin main
```

### 3. Deploy to Vercel

#### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**

   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"

2. **Import Repository**

   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**

   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Add Environment Variables**
   Click "Environment Variables" and add:

   ```
   DATABASE_URL = your_database_connection_string
   DIRECT_URL = your_database_connection_string
   NODE_ENV = production
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-app-name.vercel.app`

#### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - What's your project's name? vat-dashboard
# - In which directory is your code located? ./
```

### 4. Configure Environment Variables

After deployment, add environment variables in Vercel dashboard:

1. Go to your project dashboard
2. Click "Settings" tab
3. Click "Environment Variables"
4. Add the following:

```env
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
DIRECT_URL=postgresql://username:password@hostname:port/database?sslmode=require
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
```

### 5. Set Up Database Schema

After deployment, you need to set up your database:

#### Option A: Run Migration Script

```bash
# If you have database access
npm run db:push
npm run seed:sample
```

#### Option B: Manual Setup

1. Connect to your database
2. Run the SQL schema from `src/db/schema.ts`
3. Insert sample data if needed

### 6. Test Your Deployment

1. **Visit your app**: `https://your-app-name.vercel.app`
2. **Test key features**:
   - Dashboard loads
   - Sales creation works
   - Customer management works
   - VAT calculations are correct

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error

```
Error: connect ECONNREFUSED
```

**Solution**: Check your DATABASE_URL environment variable

#### 2. Build Errors

```
Type error: Cannot find module
```

**Solution**: Ensure all dependencies are in package.json

#### 3. API Routes Not Working

```
404 - This page could not be found
```

**Solution**: Check API route file structure in `src/app/api/`

#### 4. Environment Variables Not Loading

```
undefined is not a function
```

**Solution**: Redeploy after adding environment variables

### Debug Steps

1. **Check Vercel Logs**

   - Go to your project dashboard
   - Click "Functions" tab
   - Check error logs

2. **Test Locally**

   ```bash
   npm run build
   npm run start
   ```

3. **Check Database**
   - Verify connection string
   - Test database connectivity
   - Check table structure

## 🎯 Production Checklist

- [ ] Code pushed to GitHub
- [ ] Database created and accessible
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Database schema deployed
- [ ] Sample data loaded (optional)
- [ ] All features tested
- [ ] Custom domain configured (optional)

## 🌟 Post-Deployment

### Custom Domain (Optional)

1. Go to project settings
2. Click "Domains"
3. Add your custom domain
4. Configure DNS records

### Performance Monitoring

- Monitor your app performance in Vercel dashboard
- Check function execution times
- Monitor database performance

### Updates

```bash
# To update your deployment
git add .
git commit -m "Update message"
git push origin main
# Vercel will automatically redeploy
```

## 🎉 Success!

Your VAT Dashboard is now live on Vercel!

**Next Steps:**

1. Share the URL with your team
2. Set up regular backups
3. Monitor performance
4. Add more features as needed

---

**Need help?** Check the [Vercel documentation](https://vercel.com/docs) or create an issue in the repository.
