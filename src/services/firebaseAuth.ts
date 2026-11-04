import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
// Force Google to show account selection AND permissions consent screen
provider.setCustomParameters({
  prompt: 'select_account consent',
});

export interface ConnectedUser {
  email: string;
  name?: string;
  photoURL?: string;
}

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let currentUserInfo: ConnectedUser | null = null;

// Restore saved token from storage if available
try {
  const savedToken = localStorage.getItem('f3_google_access_token') || sessionStorage.getItem('google_access_token');
  if (savedToken) cachedAccessToken = savedToken;
  const savedUser = localStorage.getItem('f3_google_user_info') || sessionStorage.getItem('google_user_info');
  if (savedUser) currentUserInfo = JSON.parse(savedUser);
} catch {
  // Ignore
}

/**
 * Initializes Firebase Auth state listener and keeps token in sync
 */
export const initAuth = (
  onAuthSuccess?: (user: ConnectedUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (cachedAccessToken && currentUserInfo && onAuthSuccess) {
    onAuthSuccess(currentUserInfo, cachedAccessToken);
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        const u: ConnectedUser = {
          email: user.email || '',
          name: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
        };
        currentUserInfo = u;
        if (onAuthSuccess) onAuthSuccess(u, cachedAccessToken);
      } else if (!isSigningIn) {
        // Try to get token from storage
        const savedToken = localStorage.getItem('f3_google_access_token');
        if (savedToken) {
          cachedAccessToken = savedToken;
          const u: ConnectedUser = {
            email: user.email || '',
            name: user.displayName || undefined,
            photoURL: user.photoURL || undefined,
          };
          currentUserInfo = u;
          if (onAuthSuccess) onAuthSuccess(u, cachedAccessToken);
        } else if (onAuthFailure) {
          onAuthFailure();
        }
      }
    } else {
      if (!cachedAccessToken && onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

/**
 * Signs in with Google using official Firebase Auth popup, requesting Google Sheets permissions.
 */
export const googleSignIn = async (): Promise<{ user: ConnectedUser; accessToken: string }> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google.');
    }

    cachedAccessToken = credential.accessToken;
    const profile: ConnectedUser = {
      email: result.user.email || '',
      name: result.user.displayName || result.user.email || 'Usuario',
      photoURL: result.user.photoURL || undefined,
    };

    currentUserInfo = profile;

    try {
      localStorage.setItem('f3_google_access_token', cachedAccessToken);
      localStorage.setItem('f3_google_user_info', JSON.stringify(profile));
      sessionStorage.setItem('google_access_token', cachedAccessToken);
      sessionStorage.setItem('google_user_info', JSON.stringify(profile));
    } catch {}

    return { user: profile, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    let msg = error?.message || 'Error al conectar con Google';
    if (error.code === 'auth/popup-closed-by-user') {
      msg = 'Se cerró la ventana de autorización antes de completar el inicio de sesión.';
    } else if (error.code === 'auth/popup-blocked') {
      msg = 'El navegador bloqueó la ventana emergente. Por favor permite las ventanas emergentes para continuar.';
    }
    throw new Error(msg);
  } finally {
    isSigningIn = false;
  }
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
