# Google OAuth 2.0 Backend Server

Complete Node.js + Express backend for Google Sign-In with OAuth 2.0 Authorization Code flow + PKCE.

## Features

- ✅ OAuth 2.0 Authorization Code flow with PKCE
- ✅ Secure session management with httpOnly cookies
- ✅ Token refresh logic
- ✅ Token revocation on logout
- ✅ ID token verification using google-auth-library
- ✅ Role selection after OAuth
- ✅ CORS support for React frontend

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure consent screen if not done:
   - User type: External
   - Add app name, support email
   - Add scopes: `userinfo.email`, `userinfo.profile`, `openid`
6. Create OAuth 2.0 Client ID:
   - Application type: **Web application**
   - Name: "E-commerce Demo Auth"
   - **Authorized JavaScript origins**:
     ```
     http://localhost:8080
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3001/auth/google/callback
     ```
7. Copy **Client ID** and **Client Secret**

### 2. Install Dependencies

```bash
cd server
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
GOOGLE_CLIENT_ID=your-actual-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-actual-client-secret
SESSION_SECRET=generate-random-32-char-string-here
PORT=3001
FRONTEND_URL=http://localhost:8080
REDIRECT_URI=http://localhost:3001/auth/google/callback
```

**Generate SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Run the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start on `http://localhost:3001`

## API Endpoints

### `GET /auth/google`
Initiates OAuth flow. Redirects to Google's consent page.

**Query Parameters:** None

**Response:** Redirects to Google OAuth consent page

**Example:**
```bash
curl -L "http://localhost:3001/auth/google"
```

---

### `GET /auth/google/callback`
Handles OAuth callback from Google. Exchanges code for tokens.

**Query Parameters:**
- `code` - Authorization code from Google
- `state` - CSRF protection state parameter

**Response:** Redirects to frontend with success/error

---

### `GET /auth/user`
Returns current authenticated user.

**Authentication:** Requires session cookie

**Response:**
```json
{
  "user": {
    "id": "google-user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://...",
    "email_verified": true,
    "role": "customer"
  }
}
```

**Example:**
```bash
curl -X GET http://localhost:3001/auth/user \
  --cookie "connect.sid=your-session-id"
```

---

### `POST /auth/complete-profile`
Completes user profile with role selection after Google OAuth.

**Authentication:** Requires session cookie

**Request Body:**
```json
{
  "role": "customer"
}
```

**Valid roles:** `customer`, `retailer`, `wholesaler`

**Response:**
```json
{
  "user": {
    "id": "google-user-id",
    "email": "user@example.com",
    "name": "John Doe",
    "picture": "https://...",
    "role": "customer"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/auth/complete-profile \
  -H "Content-Type: application/json" \
  -d '{"role":"customer"}' \
  --cookie "connect.sid=your-session-id"
```

---

### `POST /auth/refresh`
Refreshes access token using refresh token.

**Authentication:** Requires session cookie with refresh token

**Response:**
```json
{
  "success": true
}
```

---

### `POST /auth/logout`
Logs out user, revokes tokens, destroys session.

**Authentication:** Requires session cookie

**Response:**
```json
{
  "success": true
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/auth/logout \
  --cookie "connect.sid=your-session-id"
```

---

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "authenticated": false
}
```

## Testing Flow End-to-End

### Prerequisites
- Backend server running on `http://localhost:3001`
- Frontend running on `http://localhost:8080`
- Google OAuth credentials configured

### Test Steps

1. **Start backend server:**
   ```bash
   cd server
   npm run dev
   ```

2. **Start frontend (in another terminal):**
   ```bash
   cd ..
   npm run dev
   ```

3. **Open frontend in browser:**
   ```
   http://localhost:8080/auth
   ```

4. **Click "Sign in with Google" button**
   - Browser redirects to `http://localhost:3001/auth/google`
   - Server redirects to Google consent page
   - Login with your Google account
   - Grant permissions

5. **After consent:**
   - Google redirects to `http://localhost:3001/auth/google/callback`
   - Server exchanges code for tokens
   - Server verifies ID token
   - Server creates session
   - Redirects back to frontend: `http://localhost:8080/auth?google_auth=success`

6. **Select role (Customer/Retailer/Wholesaler)**
   - Frontend sends role to `/auth/complete-profile`
   - User profile is complete

7. **Test authenticated endpoints:**
   ```bash
   # Get current user (use browser's cookie)
   curl http://localhost:3001/auth/user -b cookies.txt
   
   # Logout
   curl -X POST http://localhost:3001/auth/logout -b cookies.txt
   ```

### Manual Testing with curl (for debugging)

1. **Initiate OAuth (will return redirect URL):**
   ```bash
   curl -v "http://localhost:3001/auth/google" 2>&1 | grep Location
   ```

2. **Copy the Location URL and open in browser**

3. **Complete OAuth in browser**

4. **Check session (replace with your cookie):**
   ```bash
   curl http://localhost:3001/auth/user \
     -H "Cookie: connect.sid=s%3A..." \
     -v
   ```

## Security Features

### 1. PKCE (Proof Key for Code Exchange)
- Protects against authorization code interception
- Uses SHA-256 hashed `code_challenge`
- `code_verifier` stored server-side, never exposed to client

### 2. State Parameter
- CSRF protection for OAuth flow
- Random 16-byte hex string
- Validated on callback

### 3. Secure Session Cookies
- `httpOnly`: Prevents JavaScript access
- `sameSite: 'lax'`: CSRF protection
- `secure`: HTTPS only (in production)
- `maxAge`: 24-hour expiration

### 4. Token Refresh
- Automatic access token refresh using refresh token
- Refresh token stored in secure session, never sent to client

### 5. Token Revocation
- Revokes tokens on logout
- Destroys server session

### 6. ID Token Verification
- Verifies token signature using Google's public keys
- Validates audience (client ID)
- Uses `google-auth-library` for secure verification

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `123-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | `GOCSPX-xyz123` |
| `SESSION_SECRET` | Secret for signing session cookies (min 32 chars) | `a1b2c3d4...` |
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:8080` |
| `REDIRECT_URI` | OAuth redirect URI | `http://localhost:3001/auth/google/callback` |

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Check that `REDIRECT_URI` in `.env` matches Google Console exactly
- Ensure redirect URI in Google Console is: `http://localhost:3001/auth/google/callback`

### Error: "invalid_client"
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Check that credentials are for a Web Application (not Android/iOS)

### Error: "Missing required environment variable"
- Ensure `.env` file exists in `server/` directory
- Verify all required variables are set

### Session not persisting
- Check that `SESSION_SECRET` is set (min 32 characters)
- Verify cookies are enabled in browser
- Check CORS configuration allows credentials

### Tokens not refreshing
- Ensure `access_type: 'offline'` in auth URL
- Google must return a refresh token (force with `prompt: 'consent'`)

## Production Deployment

### Environment Changes
```env
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
REDIRECT_URI=https://api.yourdomain.com/auth/google/callback
```

### Update Google Console
- Add production URLs to Authorized JavaScript origins
- Add production redirect URI to Authorized redirect URIs

### Security Recommendations
- Use Redis for PKCE store instead of in-memory Map
- Use PostgreSQL or MongoDB for session storage
- Enable HTTPS (required for production)
- Set `secure: true` for cookies
- Add rate limiting
- Add request validation/sanitization
- Use environment-specific credentials

## Dependencies

- `express` - Web framework
- `cookie-parser` - Parse cookies
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `google-auth-library` - Google OAuth & token verification
- `express-session` - Session management

## License

MIT
