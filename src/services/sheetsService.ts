import { getAccessToken } from './firebaseAuth.ts';
import { SurveyFormData, SurveyResponseRecord } from '../types/survey.ts';

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

export interface SpreadsheetVerification {
  id: string;
  title: string;
  hasTargetSheet: boolean;
  sheetsList: string[];
  url: string;
}

/**
 * Extracts spreadsheet ID from either a full Google Sheets URL or raw ID.
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Example: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Verifies spreadsheet exists, lists its sheets, and checks if 'Encuesta IA' is present.
 */
export async function verifySpreadsheet(spreadsheetId: string): Promise<SpreadsheetVerification> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión activa de Google. Por favor inicia sesión primero.');
  }

  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) {
    throw new Error('ID o URL de hoja de cálculo no válido.');
  }

  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || response.statusText;
    if (response.status === 404) {
      throw new Error(`No se encontró la hoja de cálculo con ID "${cleanId}". Verifica que exista y tengas permiso para verla.`);
    }
    if (response.status === 403) {
      throw new Error('Permiso denegado. Asegúrate de tener permisos de edición sobre esta hoja de cálculo.');
    }
    throw new Error(`Error de Google Sheets (${response.status}): ${message}`);
  }

  const data = await response.json();
  const sheets: any[] = data.sheets || [];
  const sheetNames = sheets.map((s) => s.properties?.title || '').filter(Boolean);
  const hasTargetSheet = sheetNames.some((title) => title.trim().toLowerCase() === TARGET_SHEET_NAME.toLowerCase());

  return {
    id: cleanId,
    title: data.properties?.title || 'Hoja de Cálculo',
    hasTargetSheet,
    sheetsList: sheetNames,
    url: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
  };
}

/**
 * Ensures the target sheet 'Encuesta IA' exists. If not, creates it.
 */
export async function ensureTargetSheetExists(spreadsheetId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Token no disponible');

  const cleanId = extractSpreadsheetId(spreadsheetId);
  const verification = await verifySpreadsheet(cleanId);

  if (!verification.hasTargetSheet) {
    // Add the sheet 'Encuesta IA'
    const addSheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: TARGET_SHEET_NAME,
                tabColor: {
                  red: 0.22,
                  green: 0.66,
                  blue: 0.0,
                }, // SENA green accent
              },
            },
          },
        ],
      }),
    });

    if (!addSheetRes.ok) {
      const err = await addSheetRes.json().catch(() => ({}));
      throw new Error(`No se pudo crear la página "${TARGET_SHEET_NAME}": ${err?.error?.message || addSheetRes.statusText}`);
    }
  }

  // Check if header row exists
  const headerCheckRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(TARGET_SHEET_NAME)}!A1:O1`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const headerData = await headerCheckRes.json();
  const values = headerData?.values;

  if (!values || values.length === 0 || !values[0] || values[0].length === 0) {
    // Write header row
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(TARGET_SHEET_NAME)}!A1:O1?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [SHEET_COLUMNS],
        }),
      }
    );
  }
}

/**
 * Appends a new survey response row into 'Encuesta IA'.
 */
export async function appendSurveyResponse(
  spreadsheetId: string,
  formData: SurveyFormData
): Promise<{ success: boolean; updatedRange?: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión de Google activa para enviar la respuesta.');
  }

  const cleanId = extractSpreadsheetId(spreadsheetId);
  await ensureTargetSheetExists(cleanId);

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

  const rowValues = [
    timestamp,
    formData.esAnonimo ? 'Anónimo' : (formData.nombre.trim() || 'Sin especificar'),
    formData.rol,
    formData.programaFicha.trim() || 'No especificado',
    formData.q1_equipos,
    formData.q2_internet,
    formData.q3_software,
    formData.q4_clima,
    formData.q5_iluminacion,
    formData.q6_mobiliario,
    formData.q7_limpieza,
    formData.q8_ruido,
    formData.q9_soporte,
    formData.q10_general,
    formData.comentarios.trim() || 'Sin observaciones adicionales',
  ];

  const appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(TARGET_SHEET_NAME)}!A:O:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!appendRes.ok) {
    const err = await appendRes.json().catch(() => ({}));
    throw new Error(`Error al enviar datos a Google Sheets: ${err?.error?.message || appendRes.statusText}`);
  }

  const result = await appendRes.json();
  return {
    success: true,
    updatedRange: result?.updates?.updatedRange,
  };
}

/**
 * Reads existing responses from 'Encuesta IA' for dashboard stats.
 */
export async function fetchSurveyResponses(spreadsheetId: string): Promise<SurveyResponseRecord[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const cleanId = extractSpreadsheetId(spreadsheetId);
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(TARGET_SHEET_NAME)}!A2:O500`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const rows: any[][] = data.values || [];

    return rows.map((row) => {
      const ratings = [
        Number(row[4]) || 0,
        Number(row[5]) || 0,
        Number(row[6]) || 0,
        Number(row[7]) || 0,
        Number(row[8]) || 0,
        Number(row[9]) || 0,
        Number(row[10]) || 0,
        Number(row[11]) || 0,
        Number(row[12]) || 0,
        Number(row[13]) || 0,
      ];
      return {
        timestamp: row[0] || '',
        nombre: row[1] || 'Anónimo',
        rol: row[2] || '',
        programaFicha: row[3] || '',
        ratings,
        comentarios: row[14] || '',
      };
    });
  } catch (e) {
    console.error('Error fetching survey responses:', e);
    return [];
  }
}

/**
 * Creates a brand new Google Spreadsheet titled "Encuesta Sala F3 - Centro Agropecuario de Buga"
 * with the pre-configured sheet "Encuesta IA" and formatted headers.
 */
export async function createNewSpreadsheet(): Promise<{ id: string; url: string; title: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Inicia sesión con Google para crear una hoja de cálculo.');
  }

  const title = `Encuesta Sala F3 - Centro Agropecuario de Buga (${new Date().toLocaleDateString('es-CO')})`;

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: TARGET_SHEET_NAME,
            gridProperties: {
              frozenRowCount: 1,
            },
            tabColor: {
              red: 0.22,
              green: 0.66,
              blue: 0.0,
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`No se pudo crear la hoja en Google Drive: ${err?.error?.message || res.statusText}`);
  }

  const sheetObj = await res.json();
  const id = sheetObj.spreadsheetId;

  // Insert header columns
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(TARGET_SHEET_NAME)}!A1:O1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [SHEET_COLUMNS],
      }),
    }
  );

  return {
    id,
    url: `https://docs.google.com/spreadsheets/d/${id}/edit`,
    title,
  };
}
