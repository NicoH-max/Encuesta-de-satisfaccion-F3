import { getAccessToken } from './firebaseAuth.ts';
import { SurveyFormData, SurveyResponseRecord } from '../types/survey.ts';

export const DEFAULT_SPREADSHEET_ID = '1eu4xZrOlAgwpfvvxy4aTxkLTyWI5LSgN7tSsDu7MvXk';
export const TARGET_SHEET_NAME = 'Encuesta IA';

export const SHEET_COLUMNS = [
  'Marca temporal',
  'Correo electrónico',
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
                  tabColor: { red: 0.22, green: 0.66, blue: 0.0 },
                  gridProperties: { frozenRowCount: 1 },
                },
              },
            },
          ],
        }),
      });
    }

    // Check header row
    const headerRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        TARGET_SHEET_NAME
      )}!A1:P1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const headerData = await headerRes.json().catch(() => ({}));

    if (!headerData?.values || headerData.values.length === 0 || !headerData.values[0]?.length) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
          TARGET_SHEET_NAME
        )}!A1:P1?valueInputOption=USER_ENTERED`,
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
    console.warn('Silent check on sheet tab:', e);
  }
}

/**
 * Sends a survey response directly to the user's Google Sheet:
 * ID: 1eu4xZrOlAgwpfvvxy4aTxkLTyWI5LSgN7tSsDu7MvXk
 * Page: "Encuesta IA"
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
    userEmail?.trim() || 'No especificado',
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
    formData.comentarios.trim() || 'Sin observaciones',
  ];

  // Save in local storage vault so data is never lost
  saveLocalRecord({
    timestamp,
    nombre: String(rowValues[2]),
    rol: String(rowValues[3]),
    programaFicha: String(rowValues[4]),
    ratings: [
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
    ],
    comentarios: String(rowValues[15]),
  });

  // If token is present, send directly to Google Sheets API
  let synced = false;
  if (token) {
    try {
      await ensureTargetSheetExists(spreadsheetId, token);

      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
          TARGET_SHEET_NAME
        )}!A:P:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
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
      } else {
        console.warn('Sheets API returned non-ok status, stored locally');
      }
    } catch (e) {
      console.warn('Could not reach Google Sheets API directly:', e);
    }
  }

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
