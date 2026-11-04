import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent',
});

export interface ConnectedUser {
  email: string;
  name?: string;
  photoURL?: string;
}

let cachedAccessToken: string | null = null;
let currentUserInfo: ConnectedUser | null = null;

// Restore from localStorage
try {
  const savedToken = localStorage.getItem('f3_google_access_token') || sessionStorage.getItem('google_access_token');
  if (savedToken) cachedAccessToken = savedToken;
  const savedUser = localStorage.getItem('f3_google_user_info') || sessionStorage.getItem('google_user_info');
  if (savedUser) currentUserInfo = JSON.parse(savedUser);
} catch {
  // Ignore
}

declare global {
  interface Window {
    google?: any;
  }
}

// Global reference to GIS TokenClient
let gisClient: any = null;

export function ensureGisClient(
  onTokenReceived: (token: string, user: ConnectedUser) => void,
  onError?: (err: any) => void
) {
  if (typeof window !== 'undefined' && window.google?.accounts?.oauth2 && firebaseConfig.oAuthClientId) {
    try {
      gisClient = window.google.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope: SCOPES.join(' '),
        prompt: 'consent', // Forces the permissions consent screen to appear
        callback: async (response: any) => {
          if (response.error) {
            console.warn('GIS error:', response);
            if (onError) onError(response);
            return;
          }
          if (response.access_token) {
            cachedAccessToken = response.access_token;
            try {
              localStorage.setItem('f3_google_access_token', response.access_token);
              sessionStorage.setItem('google_access_token', response.access_token);
            } catch {}

            // Fetch user info
            let userProfile: ConnectedUser = { email: '' };
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${response.access_token}` },
              });
              if (res.ok) {
                const info = await res.json();
                userProfile = {
                  email: info.email || '',
                  name: info.name || info.email,
                  photoURL: info.picture,
                };
              }
            } catch (e) {
              console.warn('Error fetching user info:', e);
            }

            currentUserInfo = userProfile;
            try {
              localStorage.setItem('f3_google_user_info', JSON.stringify(userProfile));
              sessionStorage.setItem('google_user_info', JSON.stringify(userProfile));
            } catch {}

            onTokenReceived(response.access_token, userProfile);
          }
        },
        error_callback: (err: any) => {
          console.warn('GIS error callback:', err);
          if (onError) onError(err);
        },
      });
    } catch (e) {
      console.warn('Error creating GIS client:', e);
    }
  }
}

/**
 * Initiates the Google OAuth authorization flow with explicit permissions tab
 */
export const requestGoogleOAuth = (): Promise<ConnectedUser | null> => {
  return new Promise((resolve) => {
    // 1. If GIS client is available, request access token with prompt consent
    if (window.google?.accounts?.oauth2 && firebaseConfig.oAuthClientId) {
      ensureGisClient(
        (token, user) => {
          resolve(user);
        },
        () => {
          // If GIS fails or cancelled, resolve gracefully
          resolve(null);
        }
      );

      if (gisClient) {
        gisClient.requestAccessToken({ prompt: 'consent' });
        return;
      }
    }

    // 2. Fallback to Firebase Auth popup
    signInWithPopup(auth, provider)
      .then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          try {
            localStorage.setItem('f3_google_access_token', cachedAccessToken);
            sessionStorage.setItem('google_access_token', cachedAccessToken);
          } catch {}
        }
        const userProfile: ConnectedUser = {
          email: result.user.email || '',
          name: result.user.displayName || result.user.email || 'Usuario',
          photoURL: result.user.photoURL || undefined,
        };
        currentUserInfo = userProfile;
        try {
          localStorage.setItem('f3_google_user_info', JSON.stringify(userProfile));
        } catch {}
        resolve(userProfile);
      })
      .catch((err) => {
        console.warn('Popup closed or error:', err);
        resolve(null);
      });
  });
};

export const initAuth = (
  onAuthSuccess?: (user: ConnectedUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (cachedAccessToken && currentUserInfo && onAuthSuccess) {
    onAuthSuccess(currentUserInfo, cachedAccessToken);
  }

  return onAuthStateChanged(auth, async (user) => {
    if (user && cachedAccessToken) {
      const u: ConnectedUser = {
        email: user.email || '',
        name: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
      };
      if (onAuthSuccess) onAuthSuccess(u, cachedAccessToken);
    } else if (!cachedAccessToken) {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    return localStorage.getItem('f3_google_access_token') || sessionStorage.getItem('google_access_token');
  } catch {
    return null;
  }
};

export const getCurrentUser = (): ConnectedUser | null => currentUserInfo;

export const setManualEmail = (email: string) => {
  if (!email.trim()) return;
  currentUserInfo = {
    email: email.trim(),
    name: email.split('@')[0],
  };
  try {
    localStorage.setItem('f3_google_user_info', JSON.stringify(currentUserInfo));
  } catch {}
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch {}
  cachedAccessToken = null;
  currentUserInfo = null;
  try {
    localStorage.removeItem('f3_google_access_token');
    localStorage.removeItem('f3_google_user_info');
    sessionStorage.removeItem('google_access_token');
    sessionStorage.removeItem('google_user_info');
  } catch {}
};
