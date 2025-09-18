# Healthcare Notes App - Deployment Guide

## 🚀 Free Hosting Options

### Option 1: Railway (Recommended)
**Best for: Full-stack apps with SQLite**

1. **Sign up**: Go to [railway.app](https://railway.app) and sign up with GitHub
2. **Deploy**: 
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect the configuration from `railway.json`
3. **Environment Variables**: Set in Railway dashboard:
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secret-key`

**Features:**
- ✅ 500 hours/month free
- ✅ Persistent storage for SQLite
- ✅ Automatic deployments
- ✅ Custom domains

### Option 2: Render
**Good alternative with persistent storage**

1. **Sign up**: Go to [render.com](https://render.com) and connect GitHub
2. **Deploy**: 
   - Click "New" → "Web Service"
   - Connect your repository
   - Render will use the `render.yaml` configuration
3. **Database**: Render provides persistent disk for SQLite

**Features:**
- ✅ 750 hours/month free
- ✅ Persistent storage
- ✅ Auto-deploy from Git

### Option 3: Fly.io
**Great performance and features**

1. **Install Fly CLI**: `curl -L https://fly.io/install.sh | sh`
2. **Sign up**: `fly auth signup`
3. **Deploy**: 
   ```bash
   fly launch
   fly deploy
   ```

**Features:**
- ✅ Generous free tier
- ✅ Global edge deployment
- ✅ Persistent volumes

## 📋 Pre-Deployment Checklist

- ✅ Production build works (`npm run build`)
- ✅ Database migration runs (`npm run migrate`)
- ✅ Environment variables configured
- ✅ Static files served correctly
- ✅ API endpoints protected with authentication

## 🔧 Local Production Test

Test your production build locally:

```bash
# Build the app
npm run build

# Start in production mode
NODE_ENV=production npm start
```

Visit `http://localhost:3001` to test.

## 🌐 Environment Variables

Set these in your hosting platform:

- `NODE_ENV=production`
- `PORT=3001` (or let platform set it)
- `JWT_SECRET=your-secure-secret-key`

## 📊 Database

The app uses SQLite with Drizzle ORM:
- Database file: `server/db/healthcare.db`
- Automatic migration on startup
- Persistent storage required for production

## 🔐 Security Notes

- JWT tokens expire in 24 hours
- Passwords are hashed with bcrypt
- CORS configured for production
- Session cookies are HTTP-only

## 📱 Demo Credentials

- **Admin**: admin/password
- **Doctor**: doctor/password  
- **Nurse**: nurse/password

## 🆘 Troubleshooting

**Build fails?**
- Check Node.js version (18+ required)
- Ensure all dependencies are in `dependencies` not `devDependencies`

**Database issues?**
- Ensure persistent storage is enabled
- Check migration runs successfully
- Verify write permissions

**Authentication not working?**
- Check JWT_SECRET is set
- Verify CORS configuration
- Check token expiration
