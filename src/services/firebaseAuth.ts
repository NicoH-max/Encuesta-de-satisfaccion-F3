import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

let cachedAccessToken: string | null = null;
let currentUserInfo: { email?: string; name?: string; photoURL?: string } | null = null;

// Try to restore token from sessionStorage for convenience
try {
  const savedToken = sessionStorage.getItem('google_access_token');
  if (savedToken) cachedAccessToken = savedToken;
  const savedUser = sessionStorage.getItem('google_user_info');
  if (savedUser) currentUserInfo = JSON.parse(savedUser);
} catch {
  // Ignore storage errors
}

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Initiates Google OAuth using Google Identity Services (GIS) or Firebase Auth
 */
export const requestGoogleOAuth = async (): Promise<{ token: string; user?: any }> => {
  // Method A: If Google Identity Services is loaded on window
  if (window.google?.accounts?.oauth2 && firebaseConfig.oAuthClientId) {
    try {
      const token = await new Promise<string>((resolve, reject) => {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: firebaseConfig.oAuthClientId,
            scope: SCOPES.join(' '),
            prompt: 'select_account',
            callback: (response: any) => {
              if (response.error) {
                reject(new Error(response.error_description || response.error));
                return;
              }
              if (response.access_token) {
                resolve(response.access_token);
              } else {
                reject(new Error('No se recibió token de acceso de Google.'));
              }
            },
            error_callback: (err: any) => {
              reject(new Error(err?.message || 'Error en Google Identity Services.'));
            },
          });
          client.requestAccessToken();
        } catch (e) {
          reject(e);
        }
      });

      cachedAccessToken = token;
      try {
        sessionStorage.setItem('google_access_token', token);
      } catch {}

      // Fetch user profile info using the token
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userInfoRes.ok) {
          const info = await userInfoRes.json();
          currentUserInfo = {
            email: info.email,
            name: info.name,
            photoURL: info.picture,
          };
          try {
            sessionStorage.setItem('google_user_info', JSON.stringify(currentUserInfo));
          } catch {}
        }
      } catch (e) {
        console.warn('Could not fetch user info:', e);
      }

      return { token, user: currentUserInfo };
    } catch (gisError: any) {
      console.warn('Google Identity Services failed, attempting Firebase Auth fallback:', gisError);
    }
  }

  // Method B: Firebase Auth popup
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google.');
    }

    cachedAccessToken = credential.accessToken;
    currentUserInfo = {
      email: result.user.email || undefined,
      name: result.user.displayName || undefined,
      photoURL: result.user.photoURL || undefined,
    };
    try {
      sessionStorage.setItem('google_access_token', cachedAccessToken);
      sessionStorage.setItem('google_user_info', JSON.stringify(currentUserInfo));
    } catch {}

    return { token: cachedAccessToken, user: result.user };
  } catch (err: any) {
    console.error('Firebase Auth Sign-In Error:', err);
    let msg = err.message || 'Error al iniciar sesión con Google';
    if (err.code === 'auth/unauthorized-domain') {
      msg = 'El dominio actual no está en la lista de dominios autorizados de Firebase. Usa el método de Apps Script Webhook para sincronizar directamente.';
    } else if (err.code === 'auth/popup-blocked') {
      msg = 'El navegador bloqueó la ventana emergente de Google. Por favor permite ventanas emergentes e intenta de nuevo.';
    }
    throw new Error(msg);
  }
};

export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (cachedAccessToken && currentUserInfo && onAuthSuccess) {
    onAuthSuccess(currentUserInfo, cachedAccessToken);
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (!cachedAccessToken) {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem('google_access_token', token);
    } else {
      sessionStorage.removeItem('google_access_token');
    }
  } catch {}
};

export const getCurrentUser = () => currentUserInfo;

export const logout = async () => {
  try {
    await signOut(auth);
  } catch {}
  cachedAccessToken = null;
  currentUserInfo = null;
  try {
    sessionStorage.removeItem('google_access_token');
    sessionStorage.removeItem('google_user_info');
  } catch {}
};
