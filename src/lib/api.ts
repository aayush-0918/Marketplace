/**
 * API client for backend authentication server
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Initiates Google OAuth flow by redirecting to backend
 */
export function initiateGoogleLogin() {
  window.location.href = `${API_BASE_URL}/auth/google`;
}

/**
 * Get current authenticated user from backend
 */
export async function getCurrentUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/user`, {
      credentials: 'include' // Include cookies
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        return { user: null };
      }
      throw new Error('Failed to fetch user');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching current user:', error);
    return { user: null };
  }
}

/**
 * Complete user profile with role selection
 */
export async function completeProfile(role: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/complete-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ role })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete profile');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error completing profile:', error);
    throw error;
  }
}

/**
 * Logout user and revoke tokens
 */
export async function logout() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Logout failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
}

/**
 * Refresh access token
 */
export async function refreshToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}
