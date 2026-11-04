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

export interface ConnectedUser {
  email: string;
  name?: string;
  photoURL?: string;
}

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let currentUserInfo: ConnectedUser | null = null;

// Restore saved user info from storage if available
try {
  const savedToken = localStorage.getItem('f3_google_access_token') || sessionStorage.getItem('google_access_token');
  if (savedToken) cachedAccessToken = savedToken;
  const savedUser = localStorage.getItem('f3_google_user_info') || sessionStorage.getItem('google_user_info');
  if (savedUser) currentUserInfo = JSON.parse(savedUser);
} catch {
  // Ignore storage read errors
}

/**
 * Initializes Firebase Auth state listener
 */
export const initAuth = (
  onAuthSuccess?: (user: ConnectedUser, token?: string) => void,
  onAuthFailure?: () => void
) => {
  if (currentUserInfo && onAuthSuccess) {
    onAuthSuccess(currentUserInfo, cachedAccessToken || undefined);
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const u: ConnectedUser = {
        email: user.email || '',
        name: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
      };
      currentUserInfo = u;
      try {
        localStorage.setItem('f3_google_user_info', JSON.stringify(u));
      } catch {}

      if (onAuthSuccess) {
        onAuthSuccess(u, cachedAccessToken || undefined);
      }
    } else {
      if (!currentUserInfo && onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

/**
 * Signs in with Google.
 * @param forAdminSheets If true, requests sensitive Google Sheets read/write permissions (for administrator).
 *                       If false (default for respondents), uses standard Google profile & email scopes
 *                       which never trigger 'unverified app' or 403 access blocked errors on other devices.
 */
export const googleSignIn = async (forAdminSheets: boolean = false): Promise<{ user: ConnectedUser; accessToken?: string }> => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();

    if (forAdminSheets) {
      provider.addScope('https://www.googleapis.com/auth/spreadsheets');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      provider.setCustomParameters({
        prompt: 'select_account consent',
      });
    } else {
      provider.setCustomParameters({
        prompt: 'select_account',
      });
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || undefined;

    if (token) {
      cachedAccessToken = token;
      try {
        localStorage.setItem('f3_google_access_token', token);
        sessionStorage.setItem('google_access_token', token);
      } catch {}
    }

    const profile: ConnectedUser = {
      email: result.user.email || '',
      name: result.user.displayName || result.user.email?.split('@')[0] || 'Usuario',
      photoURL: result.user.photoURL || undefined,
    };

    currentUserInfo = profile;

    try {
      localStorage.setItem('f3_google_user_info', JSON.stringify(profile));
      sessionStorage.setItem('google_user_info', JSON.stringify(profile));
    } catch {}

    return { user: profile, accessToken: token };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    let msg = error?.message || 'Error al conectar con Google';
    if (error.code === 'auth/popup-closed-by-user') {
      msg = 'Se cerró la ventana de autorización antes de completar el inicio de sesión.';
    } else if (error.code === 'auth/popup-blocked') {
      msg = 'El navegador bloqueó la ventana emergente. Por favor habilita las ventanas emergentes o escribe tu correo manualmente.';
    } else if (error.code === 'auth/unauthorized-domain') {
      msg = 'Para este dispositivo, puedes escribir tu correo directamente en el formulario.';
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
