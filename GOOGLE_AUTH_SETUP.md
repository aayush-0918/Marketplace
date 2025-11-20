# Google OAuth 2.0 Setup Guide

Complete setup instructions for running the e-commerce demo with real Google authentication.

## Architecture

- **Frontend**: React (Vite) on `http://localhost:8080`
- **Backend**: Node.js + Express on `http://localhost:3001`
- **Flow**: Authorization Code with PKCE

## Quick Start

### 1. Google Cloud Console Setup

#### Create OAuth 2.0 Credentials

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services** → **Credentials**

#### Configure OAuth Consent Screen

1. Click **OAuth consent screen** in sidebar
2. Choose **External** user type
3. Fill in app information:
   - App name: "ShopHub E-commerce"
   - User support email: your-email@example.com
   - Developer contact: your-email@example.com
4. Click **Save and Continue**
5. Add scopes:
   - `/auth/userinfo.email`
   - `/auth/userinfo.profile`
   - `openid`
6. Click **Save and Continue**
7. Add test users (optional for testing)
8. Click **Save and Continue**

#### Create OAuth Client ID

1. Go back to **Credentials** tab
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: "ShopHub Auth Client"
5. **Authorized JavaScript origins**:
   ```
   http://localhost:8080
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3001/auth/google/callback
   ```
7. Click **Create**
8. **Copy the Client ID and Client Secret** (you'll need these!)

### 2. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `server/.env`:
```env
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
SESSION_SECRET=your_random_32_char_session_secret_here
PORT=3001
FRONTEND_URL=http://localhost:8080
REDIRECT_URI=http://localhost:3001/auth/google/callback
```

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Frontend Setup

```bash
# From root directory
cp .env.example .env
```

The `.env` file should contain:
```env
VITE_API_URL=http://localhost:3001
```

### 4. Run Both Servers

#### Terminal 1 - Backend:
```bash
cd server
npm run dev
```

You should see:
```
🚀 Auth server running on http://localhost:3001
📝 Make sure to configure these in Google Cloud Console:
   Authorized JavaScript origins: http://localhost:8080
   Authorized redirect URIs: http://localhost:3001/auth/google/callback
```

#### Terminal 2 - Frontend:
```bash
# From root directory
npm run dev
```

Frontend runs on: `http://localhost:8080`

### 5. Test the Flow

1. Open browser: `http://localhost:8080/auth`
2. Click **"Sign in with Google"** button
3. You'll be redirected to Google's consent page
4. Login with your Google account
5. Grant permissions (email, profile)
6. You'll be redirected back to the app
7. Select your role: Customer / Retailer / Wholesaler
8. Grant location access (optional)
9. You're logged in! 🎉

## Testing with curl

### Health Check
```bash
curl http://localhost:3001/health
```

### Initiate OAuth (will return redirect URL)
```bash
curl -v "http://localhost:3001/auth/google" 2>&1 | grep Location
```

### Check Current User (after logging in via browser)
```bash
# First, login via browser to get session cookie
# Then in browser console:
document.cookie

# Use the connect.sid cookie value:
curl http://localhost:3001/auth/user \
  -H "Cookie: connect.sid=s%3A..."
```

### Logout
```bash
curl -X POST http://localhost:3001/auth/logout \
  -H "Cookie: connect.sid=s%3A..."
```

## Flow Diagram

```
User Browser          Frontend (React)          Backend (Express)          Google OAuth
     |                       |                          |                        |
     |------ Visit /auth ---->|                          |                        |
     |                       |                          |                        |
     |<---- Show Login UI ----|                          |                        |
     |                       |                          |                        |
     |-- Click "Google" ----->|                          |                        |
     |                       |                          |                        |
     |                       |--- GET /auth/google ---->|                        |
     |                       |                          |                        |
     |                       |                          |-- Generate PKCE ------>|
     |                       |                          |    code_challenge      |
     |                       |                          |    state               |
     |                       |                          |                        |
     |<----------------------|<------- Redirect --------|<----- Auth URL --------|
     |                       |                          |                        |
     |                                                   |                        |
     |---------------------------- Consent Page --------------------------->|
     |                                                   |                        |
     |<--------------------------- Login & Consent ------------------------|
     |                                                   |                        |
     |                                                   |<----- code, state -----|
     |                       |                          |                        |
     |                       |<- Redirect with params --|                        |
     |                       |   ?google_auth=success   |                        |
     |                       |                          |                        |
     |                       |--- GET /auth/user ------>|                        |
     |                       |                          |                        |
     |                       |<--- User data (no role) -|                        |
     |                       |                          |                        |
     |<--- Show Role Select --|                          |                        |
     |                       |                          |                        |
     |-- Select Role -------->|                          |                        |
     |                       |                          |                        |
     |                       |-- POST /complete-profile>|                        |
     |                       |    { role: "customer" }  |                        |
     |                       |                          |                        |
     |                       |<--- User with role ------|                        |
     |                       |    + Session Cookie      |                        |
     |                       |                          |                        |
     |<--- Navigate Home -----|                          |                        |
     |                       |                          |                        |
```

## Troubleshooting

### "redirect_uri_mismatch"
**Problem**: Google shows error about redirect URI mismatch

**Solution**:
1. Check Google Console → Credentials → Your OAuth Client
2. Ensure this EXACT URL is in Authorized redirect URIs:
   ```
   http://localhost:3001/auth/google/callback
   ```
3. No trailing slash, exact port, exact path
4. Wait 5 minutes for Google to propagate changes

### "origin_mismatch"
**Problem**: Google shows error about origin mismatch

**Solution**:
1. Check Google Console → Credentials → Your OAuth Client
2. Ensure this EXACT URL is in Authorized JavaScript origins:
   ```
   http://localhost:8080
   ```
3. No trailing slash, exact port

### Backend doesn't start
**Problem**: Error about missing environment variables

**Solution**:
1. Ensure `server/.env` exists
2. Check all required variables are set:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SESSION_SECRET`

### "Not authenticated" error
**Problem**: `/auth/user` returns 401

**Solution**:
1. Clear browser cookies
2. Make sure you completed Google OAuth flow
3. Check browser console for errors
4. Verify backend is running on port 3001

### Session not persisting
**Problem**: User logged out after refresh

**Solution**:
1. Check that cookies are enabled in browser
2. Verify `SESSION_SECRET` is set in backend `.env`
3. Clear browser cache and cookies
4. Try incognito mode

### CORS errors
**Problem**: Browser shows CORS policy errors

**Solution**:
1. Ensure backend `FRONTEND_URL` matches frontend URL exactly
2. Check frontend is running on `http://localhost:8080`
3. Restart backend server after changing `.env`

## Security Notes

### Development vs Production

**Development** (current setup):
- HTTP allowed
- Cookies: `secure: false`
- localhost URLs

**Production** (required changes):
1. Use HTTPS everywhere
2. Update `.env`:
   ```env
   NODE_ENV=production
   FRONTEND_URL=https://yourdomain.com
   REDIRECT_URI=https://api.yourdomain.com/auth/google/callback
   ```
3. Set cookies: `secure: true`
4. Update Google Console with production URLs
5. Use Redis for PKCE store
6. Use PostgreSQL for sessions
7. Add rate limiting

### Never Commit Secrets
- `.env` files are in `.gitignore`
- Never commit Client Secret
- Rotate secrets if exposed

## API Reference

See `server/README.md` for complete API documentation.

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [PKCE Explained](https://oauth.net/2/pkce/)
- [Express Session Docs](https://github.com/expressjs/session)
- [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs)

## Support

If you encounter issues:
1. Check browser console for errors
2. Check backend terminal for logs
3. Verify all URLs match exactly in Google Console
4. Try clearing cookies and cache
5. Test with incognito mode
