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
  prompt: 'select_account',
});

export interface ConnectedUser {
  email: string;
  name?: string;
  photoURL?: string;
}

let cachedAccessToken: string | null = null;
let currentUserInfo: ConnectedUser | null = null;

// Restore from storage if available
try {
  const savedToken = localStorage.getItem('f3_google_access_token') || sessionStorage.getItem('google_access_token');
  if (savedToken) cachedAccessToken = savedToken;
  const savedUser = localStorage.getItem('f3_google_user_info') || sessionStorage.getItem('google_user_info');
  if (savedUser) currentUserInfo = JSON.parse(savedUser);
} catch {
  // Ignore storage errors
}

declare global {
  interface Window {
    google?: any;
  }
}

function waitForGoogleIdentity(timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.google?.accounts?.oauth2) {
      resolve(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(interval);
        resolve(true);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      resolve(Boolean(window.google?.accounts?.oauth2));
    }, timeoutMs);
  });
}

/**
 * Initiates Google OAuth cleanly without throwing fatal errors.
 * Returns null if cancelled.
 */
export const requestGoogleOAuth = async (): Promise<ConnectedUser | null> => {
  const isGisReady = await waitForGoogleIdentity();

  // Try Google Identity Services (GIS)
  if (isGisReady && firebaseConfig.oAuthClientId) {
    try {
      const token = await new Promise<string>((resolve, reject) => {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: firebaseConfig.oAuthClientId,
            scope: SCOPES.join(' '),
            prompt: 'select_account',
            callback: (response: any) => {
              if (response.error) {
                if (response.error === 'popup_closed_by_user' || response.error === 'access_denied') {
                  resolve('');
                  return;
                }
                reject(new Error(response.error_description || response.error));
                return;
              }
              if (response.access_token) {
                resolve(response.access_token);
              } else {
                resolve('');
              }
            },
            error_callback: () => {
              resolve('');
            },
          });
          client.requestAccessToken();
        } catch (e) {
          reject(e);
        }
      });

      if (!token) return null;

      cachedAccessToken = token;
      try {
        localStorage.setItem('f3_google_access_token', token);
        sessionStorage.setItem('google_access_token', token);
      } catch {}

      // Fetch user profile
      let userProfile: ConnectedUser = { email: '' };
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userInfoRes.ok) {
          const info = await userInfoRes.json();
          userProfile = {
            email: info.email || '',
            name: info.name || info.email,
            photoURL: info.picture,
          };
        }
      } catch (e) {
        console.warn('Could not fetch user profile:', e);
      }

      currentUserInfo = userProfile;
      try {
        localStorage.setItem('f3_google_user_info', JSON.stringify(userProfile));
        sessionStorage.setItem('google_user_info', JSON.stringify(userProfile));
      } catch {}

      return userProfile;
    } catch (gisError) {
      console.warn('GIS attempt ended, trying Firebase fallback:', gisError);
    }
  }

  // Fallback: Firebase Auth
  try {
    const result = await signInWithPopup(auth, provider);
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
      sessionStorage.setItem('google_user_info', JSON.stringify(userProfile));
    } catch {}

    return userProfile;
  } catch (err: any) {
    console.warn('Firebase Auth popup ended:', err);
    return null;
  }
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
