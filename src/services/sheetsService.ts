import { getAccessToken } from './firebaseAuth.ts';
import { SurveyFormData, SurveyResponseRecord } from '../types/survey.ts';

export const DEFAULT_SPREADSHEET_ID = '1eu4xZrOlAgwpfvvxy4aTxkLTyWI5LSgN7tSsDu7MvXk';
export const TARGET_SHEET_NAME = 'Encuesta IA';

export const SHEET_COLUMNS = [
  'Marca temporal',
  'Nombre / Identificación',
  'Rol',
  'Programa de Formación / Ficha',
  '1. Estado Equipos',
  '2. Conexión Internet',
  '3. Software Instalado',
  '4. Climatización / Temperatura',
  '5. Iluminación / Pantallas',
  '6. Mobiliario / Ergonomía',
  '7. Limpieza y Orden',
  '8. Ambiente / Nivel de Ruido',
  '9. Atención y Soporte',
  '10. Satisfacción Global',
  'Comentarios y Sugerencias',
];

/**
 * Sends a survey response to the server and Google Sheets
 */
export async function sendSurveyToSheet(
  formData: SurveyFormData,
  userEmail?: string
): Promise<{ success: boolean; syncedToGoogle: boolean }> {
  const timestamp = new Date().toLocaleString('es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const email = userEmail?.trim() || formData.email.trim() || '';
  const payload = {
    email,
    nombre: formData.nombre.trim(),
    esAnonimo: formData.esAnonimo,
    rol: formData.rol,
    programaFicha: formData.programaFicha.trim() || 'No especificado',
    q1_equipos: formData.q1_equipos,
    q2_internet: formData.q2_internet,
    q3_software: formData.q3_software,
    q4_climatizacion: formData.q4_climatizacion,
    q5_iluminacion: formData.q5_iluminacion,
    q6_mobiliario: formData.q6_mobiliario,
    q7_limpieza: formData.q7_limpieza,
    q8_ambiente: formData.q8_ambiente,
    q9_atencion: formData.q9_atencion,
    q10_satisfaccion: formData.q10_satisfaccion,
    aspectosMejorar: formData.aspectosMejorar.trim(),
    comentarios: formData.comentarios.trim(),
  };

  let syncedToGoogle = false;

  // 1. Submit to Server backend (handles server-side Google Sheets delivery for all devices)
  try {
    const serverRes = await fetch('/api/survey-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (serverRes.ok) {
      const json = await serverRes.json();
      if (json.syncedToGoogle) {
        syncedToGoogle = true;
      }
    }
  } catch (err) {
    console.warn('Server endpoint error:', err);
  }

  // 2. Direct client-side Google Sheets API call if user has local token
  const token = await getAccessToken();
  if (token && !syncedToGoogle) {
    try {
      const identificacion = payload.esAnonimo
        ? (payload.email ? `Anónimo (${payload.email})` : 'Anónimo')
        : (payload.nombre
            ? (payload.email ? `${payload.nombre} (${payload.email})` : payload.nombre)
            : (payload.email || 'Sin especificar'));

      const comentariosCombined = [payload.aspectosMejorar, payload.comentarios]
        .filter(Boolean)
        .join(' | ') || 'Sin observaciones adicionales';

      const rowValues = [
        timestamp,
        identificacion,
        payload.rol,
        payload.programaFicha,
        payload.q1_equipos,
        payload.q2_internet,
        payload.q3_software,
        payload.q4_climatizacion,
        payload.q5_iluminacion,
        payload.q6_mobiliario,
        payload.q7_limpieza,
        payload.q8_ambiente,
        payload.q9_atencion,
        payload.q10_satisfaccion,
        comentariosCombined,
      ];

      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${DEFAULT_SPREADSHEET_ID}/values/${encodeURIComponent(
          TARGET_SHEET_NAME
        )}!A:O:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [rowValues] }),
        }
      );

      if (appendRes.ok) {
        syncedToGoogle = true;
      }
    } catch (e) {
      console.warn('Client-side Sheets API direct append:', e);
    }
  }

  // 3. Save to localStorage backup vault
  saveLocalRecord({
    id: Date.now().toString(),
    timestamp,
    email: payload.email || 'No especificado',
    nombre: payload.esAnonimo ? 'Anónimo' : (payload.nombre || 'Sin especificar'),
    rol: payload.rol,
    programaFicha: payload.programaFicha,
    ratings: [
      payload.q1_equipos,
      payload.q2_internet,
      payload.q3_software,
      payload.q4_climatizacion,
      payload.q5_iluminacion,
      payload.q6_mobiliario,
      payload.q7_limpieza,
      payload.q8_ambiente,
      payload.q9_atencion,
      payload.q10_satisfaccion,
    ],
    aspectosMejorar: payload.aspectosMejorar,
    comentarios: payload.comentarios,
    syncedToGoogle,
  });

  return { success: true, syncedToGoogle };
}

function saveLocalRecord(record: SurveyResponseRecord) {
  try {
    const raw = localStorage.getItem('f3_survey_responses_vault') || '[]';
    const list: SurveyResponseRecord[] = JSON.parse(raw);
    list.push(record);
    localStorage.setItem('f3_survey_responses_vault', JSON.stringify(list));
  } catch (e) {
    console.error('Error saving local record:', e);
  }
}

export function getLocalRecords(): SurveyResponseRecord[] {
  try {
    const raw = localStorage.getItem('f3_survey_responses_vault') || '[]';
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Propagates token to backend server so any device can write to Google Sheets
 */
export async function registerTokenWithServer(token: string, email?: string): Promise<boolean> {
  try {
    const res = await fetch('/api/save-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email }),
    });
    return res.ok;
  } catch (e) {
    console.warn('Could not register token with server:', e);
    return false;
  }
}

/**
 * Triggers batch synchronization of all stored responses
 */
export async function syncPendingResponses(): Promise<{ syncedCount: number }> {
  // Try server sync first
  try {
    const res = await fetch('/api/sync-all', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return { syncedCount: data.syncedCount || 0 };
    }
  } catch (e) {
    console.warn('Server sync-all error:', e);
  }

  // Client-side fallback if browser has token
  const token = await getAccessToken();
  if (!token) return { syncedCount: 0 };

  const list = getLocalRecords();
  const unsynced = list.filter((r) => !r.syncedToGoogle);
  if (unsynced.length === 0) return { syncedCount: 0 };

  const rows = unsynced.map((r) => {
    const identificacion = r.email ? `${r.nombre} (${r.email})` : r.nombre;
    const comentariosCombined = [r.aspectosMejorar, r.comentarios].filter(Boolean).join(' | ') || 'Sin observaciones';
    return [
      r.timestamp,
      identificacion,
      r.rol,
      r.programaFicha,
      ...r.ratings,
      comentariosCombined,
    ];
  });

  try {
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${DEFAULT_SPREADSHEET_ID}/values/${encodeURIComponent(
        TARGET_SHEET_NAME
      )}!A:O:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: rows }),
      }
    );

    if (appendRes.ok) {
      const updated = list.map((r) => ({ ...r, syncedToGoogle: true }));
      localStorage.setItem('f3_survey_responses_vault', JSON.stringify(updated));
      return { syncedCount: unsynced.length };
    }
  } catch (err) {
    console.error('Error during client sync:', err);
  }

  return { syncedCount: 0 };
}
