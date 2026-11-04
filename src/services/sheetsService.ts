import { getAccessToken } from './firebaseAuth.ts';
import { SurveyFormData, SurveyResponseRecord } from '../types/survey.ts';

export const DEFAULT_SPREADSHEET_ID = '1eu4xZrOlAgwpfvvxy4aTxkLTyWI5LSgN7tSsDu7MvXk';
export const TARGET_SHEET_NAME = 'Encuesta IA';

export const SHEET_COLUMNS = [
  'Marca temporal',
  'Correo electrónico',
  'Nombre / Identificación',
  'Rol en el Centro Agropecuario',
  'Frecuencia de uso',
  'Programa de Formación / Ficha',
  '1. Estado general Ambiente F3 (1-5)',
  '2. Limpieza y orden (1-5)',
  '3. Iluminación y ventilación (1-5)',
  '4. Mobiliario y comodidad (1-5)',
  '5. Equipos de cómputo (1-5)',
  '6. Conectividad y tecnología (1-5)',
  '7. Seguridad y condiciones de uso (1-5)',
  '8. Atención y apoyo recibido (1-5)',
  '9. Disponibilidad del ambiente (1-5)',
  '10. Satisfacción general (1-5)',
  'Aspectos a mejorar',
  'Comentario adicional o sugerencias',
];

/**
 * Ensures 'Encuesta IA' page exists in spreadsheet 1eu4xZrOlAgwpfvvxy4aTxkLTyWI5LSgN7tSsDu7MvXk
 */
export async function ensureTargetSheetExists(
  spreadsheetId: string,
  token: string
): Promise<void> {
  try {
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!metaRes.ok) return;

    const metaData = await metaRes.json();
    const sheets: any[] = metaData.sheets || [];
    const hasTarget = sheets.some(
      (s) => (s.properties?.title || '').trim().toLowerCase() === TARGET_SHEET_NAME.toLowerCase()
    );

    if (!hasTarget) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
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
                  tabColor: { red: 0.22, green: 0.66, blue: 0.0 }, // SENA green accent
                  gridProperties: { frozenRowCount: 1 },
                },
              },
            },
          ],
        }),
      });
    }

    // Check header row in Encuesta IA
    const headerRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        TARGET_SHEET_NAME
      )}!A1:R1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const headerData = await headerRes.json().catch(() => ({}));

    if (!headerData?.values || headerData.values.length === 0 || !headerData.values[0]?.length) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
          TARGET_SHEET_NAME
        )}!A1:R1?valueInputOption=USER_ENTERED`,
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
  } catch (e) {
    console.warn('Check on sheet tab:', e);
  }
}

/**
 * Appends survey response to spreadsheet 1eu4xZrOlAgwpfvvxy4aTxkLTyWI5LSgN7tSsDu7MvXk in Encuesta IA
 */
export async function sendSurveyToSheet(
  formData: SurveyFormData,
  userEmail?: string
): Promise<{ success: boolean; syncedToGoogle: boolean }> {
  const spreadsheetId = DEFAULT_SPREADSHEET_ID;
  const token = await getAccessToken();

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
    userEmail?.trim() || formData.email.trim() || 'No especificado',
    formData.esAnonimo ? 'Anónimo' : (formData.nombre.trim() || 'Sin especificar'),
    formData.rol,
    formData.frecuenciaUso,
    formData.programaFicha.trim() || 'No especificado',
    formData.q1_estadoGeneral,
    formData.q2_limpieza,
    formData.q3_iluminacionVentilacion,
    formData.q4_mobiliario,
    formData.q5_equipos,
    formData.q6_conectividad,
    formData.q7_seguridad,
    formData.q8_atencionApoyo,
    formData.q9_disponibilidad,
    formData.q10_general,
    formData.aspectosMejorar.trim() || 'Ninguno especificado',
    formData.comentarios.trim() || 'Sin observaciones adicionales',
  ];

  let synced = false;

  if (token) {
    try {
      await ensureTargetSheetExists(spreadsheetId, token);

      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
          TARGET_SHEET_NAME
        )}!A:R:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
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

      if (appendRes.ok) {
        synced = true;
      }
    } catch (e) {
      console.warn('Sheets API append error, kept in local queue:', e);
    }
  }

  // Save to persistent storage vault
  saveLocalRecord({
    timestamp,
    email: String(rowValues[1]),
    nombre: String(rowValues[2]),
    rol: String(rowValues[3]),
    frecuenciaUso: String(rowValues[4]),
    programaFicha: String(rowValues[5]),
    ratings: [
      formData.q1_estadoGeneral,
      formData.q2_limpieza,
      formData.q3_iluminacionVentilacion,
      formData.q4_mobiliario,
      formData.q5_equipos,
      formData.q6_conectividad,
      formData.q7_seguridad,
      formData.q8_atencionApoyo,
      formData.q9_disponibilidad,
      formData.q10_general,
    ],
    aspectosMejorar: String(rowValues[16]),
    comentarios: String(rowValues[17]),
    syncedToGoogle: synced,
  });

  return { success: true, syncedToGoogle: synced };
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
 * Pushes all pending unsynced responses directly to Google Sheets
 */
export async function syncPendingResponses(): Promise<{ syncedCount: number }> {
  const token = await getAccessToken();
  if (!token) throw new Error('Se requiere autorizar con Google para sincronizar.');

  const list = getLocalRecords();
  const unsynced = list.filter((r) => !r.syncedToGoogle);

  if (unsynced.length === 0) return { syncedCount: 0 };

  await ensureTargetSheetExists(DEFAULT_SPREADSHEET_ID, token);

  const rows = unsynced.map((r) => [
    r.timestamp,
    r.email,
    r.nombre,
    r.rol,
    r.frecuenciaUso,
    r.programaFicha,
    ...r.ratings,
    r.aspectosMejorar,
    r.comentarios,
  ]);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${DEFAULT_SPREADSHEET_ID}/values/${encodeURIComponent(
      TARGET_SHEET_NAME
    )}!A:R:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al sincronizar con Google Sheets');
  }

  // Mark all as synced
  const updated = list.map((r) => ({ ...r, syncedToGoogle: true }));
  localStorage.setItem('f3_survey_responses_vault', JSON.stringify(updated));

  return { syncedCount: unsynced.length };
}
