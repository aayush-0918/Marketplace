import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// Validate required environment variables
const requiredEnvVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'SESSION_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error('Please copy .env.example to .env and fill in the values');
    process.exit(1);
  }
}

// Initialize Google OAuth2 Client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI || `http://localhost:${PORT}/auth/google/callback`
);

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

// In-memory store for PKCE code_verifier and state (use Redis in production)
const pkceStore = new Map();

// Helper: Generate PKCE code_verifier and code_challenge
function generatePKCE() {
  const code_verifier = crypto.randomBytes(32).toString('base64url');
  const code_challenge = crypto
    .createHash('sha256')
    .update(code_verifier)
    .digest('base64url');
  
  return { code_verifier, code_challenge };
}

// Helper: Generate random state
function generateState() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Route: GET /auth/google
 * Initiates the Google OAuth 2.0 flow with PKCE
 */
app.get('/auth/google', (req, res) => {
  try {
    // Generate PKCE values
    const { code_verifier, code_challenge } = generatePKCE();
    const state = generateState();
    
    // Store code_verifier and state temporarily (associated with state)
    pkceStore.set(state, { code_verifier, timestamp: Date.now() });
    
    // Clean up old entries (older than 10 minutes)
    for (const [key, value] of pkceStore.entries()) {
      if (Date.now() - value.timestamp > 10 * 60 * 1000) {
        pkceStore.delete(key);
      }
    }
    
    // Build authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Get refresh token
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state: state,
      code_challenge: code_challenge,
      code_challenge_method: 'S256',
      prompt: 'consent' // Force consent to get refresh token
    });
    
    console.log('🔐 Initiating OAuth flow with state:', state);
    
    // Redirect user to Google's consent page
    res.redirect(authUrl);
  } catch (error) {
    console.error('❌ Error initiating OAuth flow:', error);
    res.redirect(`${FRONTEND_URL}/auth?error=auth_init_failed`);
  }
});

/**
 * Route: GET /auth/google/callback
 * Handles the OAuth callback from Google
 */
app.get('/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  // Handle OAuth errors
  if (error) {
    console.error('❌ OAuth error:', error);
    return res.redirect(`${FRONTEND_URL}/auth?error=${error}`);
  }
  
  // Validate authorization code and state
  if (!code || !state) {
    console.error('❌ Missing code or state parameter');
    return res.redirect(`${FRONTEND_URL}/auth?error=invalid_callback`);
  }
  
  try {
    // Retrieve and validate state
    const pkceData = pkceStore.get(state);
    if (!pkceData) {
      console.error('❌ Invalid or expired state');
      return res.redirect(`${FRONTEND_URL}/auth?error=invalid_state`);
    }
    
    const { code_verifier } = pkceData;
    pkceStore.delete(state); // Clean up used state
    
    console.log('🔄 Exchanging authorization code for tokens...');
    
    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken({
      code,
      codeVerifier: code_verifier
    });
    
    oauth2Client.setCredentials(tokens);
    
    // Verify and decode ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    // Extract user information
    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      email_verified: payload.email_verified
    };
    
    console.log('✅ User authenticated:', user.email);
    
    // Store user session
    req.session.user = user;
    req.session.tokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date
    };
    
    // Save session before redirect
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.redirect(`${FRONTEND_URL}/auth?error=session_error`);
      }
      
      // Redirect to frontend with success - frontend will prompt for role selection
      res.redirect(`${FRONTEND_URL}/auth?google_auth=success`);
    });
    
  } catch (error) {
    console.error('❌ Token exchange error:', error);
    res.redirect(`${FRONTEND_URL}/auth?error=token_exchange_failed`);
  }
});

/**
 * Route: GET /auth/user
 * Returns current authenticated user information
 */
app.get('/auth/user', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({ user: req.session.user });
});

/**
 * Route: POST /auth/complete-profile
 * Completes user profile with role selection after Google OAuth
 */
app.post('/auth/complete-profile', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { role } = req.body;
  
  // Validate role
  const validRoles = ['customer', 'retailer', 'wholesaler'];
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  // Update user session with role
  req.session.user.role = role;
  
  req.session.save((err) => {
    if (err) {
      console.error('❌ Session save error:', err);
      return res.status(500).json({ error: 'Failed to save role' });
    }
    
    console.log('✅ User profile completed:', req.session.user.email, 'as', role);
    res.json({ user: req.session.user });
  });
});

/**
 * Route: POST /auth/refresh
 * Refreshes the access token using refresh token
 */
app.post('/auth/refresh', async (req, res) => {
  if (!req.session.tokens?.refresh_token) {
    return res.status(401).json({ error: 'No refresh token available' });
  }
  
  try {
    oauth2Client.setCredentials({
      refresh_token: req.session.tokens.refresh_token
    });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    // Update session with new tokens
    req.session.tokens = {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || req.session.tokens.refresh_token,
      expiry_date: credentials.expiry_date
    };
    
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to save tokens' });
      }
      res.json({ success: true });
    });
    
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(401).json({ error: 'Token refresh failed' });
  }
});

/**
 * Route: POST /auth/logout
 * Logs out the user and revokes tokens
 */
app.post('/auth/logout', async (req, res) => {
  try {
    // Revoke Google tokens if available
    if (req.session.tokens?.access_token) {
      try {
        await oauth2Client.revokeToken(req.session.tokens.access_token);
        console.log('✅ Google token revoked');
      } catch (error) {
        console.error('⚠️  Token revocation error (non-fatal):', error.message);
      }
    }
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('❌ Session destruction error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * Route: GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    authenticated: !!req.session.user
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Auth server running on http://localhost:' + PORT);
  console.log('📝 Make sure to configure these in Google Cloud Console:');
  console.log(`   Authorized JavaScript origins: ${FRONTEND_URL}`);
  console.log(`   Authorized redirect URIs: http://localhost:${PORT}/auth/google/callback`);
  console.log('\n💡 Test the flow:');
  console.log(`   1. Visit ${FRONTEND_URL}/auth`);
  console.log('   2. Click "Sign in with Google"');
  console.log('   3. Complete OAuth flow');
  console.log('\n🔍 Health check: http://localhost:' + PORT + '/health');
});
