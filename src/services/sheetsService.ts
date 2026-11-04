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

export interface ConfigSettings {
  webhookUrl: string;
  spreadsheetId: string;
  spreadsheetTitle: string;
}

export function getSavedConfig(): ConfigSettings {
  return {
    webhookUrl: localStorage.getItem('f3_survey_webhook_url') || '',
    spreadsheetId: localStorage.getItem('f3_survey_spreadsheet_id') || '',
    spreadsheetTitle: localStorage.getItem('f3_survey_spreadsheet_title') || 'Hoja de Cálculo Sala F3',
  };
}

export function saveConfig(cfg: Partial<ConfigSettings>) {
  if (cfg.webhookUrl !== undefined) localStorage.setItem('f3_survey_webhook_url', cfg.webhookUrl.trim());
  if (cfg.spreadsheetId !== undefined) localStorage.setItem('f3_survey_spreadsheet_id', cfg.spreadsheetId.trim());
  if (cfg.spreadsheetTitle !== undefined) localStorage.setItem('f3_survey_spreadsheet_title', cfg.spreadsheetTitle.trim());
}

/**
 * Extracts spreadsheet ID from either a full Google Sheets URL or raw ID.
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Sends a survey response to the user's Google Sheet into "Encuesta IA".
 * Tries Webhook (Apps Script) first, then Google Sheets API if token is present.
 */
export async function sendSurveyToSheet(formData: SurveyFormData): Promise<{ success: boolean; method: string }> {
  const config = getSavedConfig();
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

  const payload = {
    targetSheet: TARGET_SHEET_NAME,
    timestamp,
    nombre: formData.esAnonimo ? 'Anónimo' : (formData.nombre.trim() || 'Sin especificar'),
    rol: formData.rol,
    programaFicha: formData.programaFicha.trim() || 'No especificado',
    q1_equipos: formData.q1_equipos,
    q2_internet: formData.q2_internet,
    q3_software: formData.q3_software,
    q4_clima: formData.q4_clima,
    q5_iluminacion: formData.q5_iluminacion,
    q6_mobiliario: formData.q6_mobiliario,
    q7_limpieza: formData.q7_limpieza,
    q8_ruido: formData.q8_ruido,
    q9_soporte: formData.q9_soporte,
    q10_general: formData.q10_general,
    comentarios: formData.comentarios.trim() || 'Sin observaciones',
  };

  // 1. Try Google Apps Script Webhook (recommended for no-login respondent flow)
  if (config.webhookUrl) {
    try {
      await fetch(config.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // Save copy in local history
      saveLocalResponse({
        timestamp,
        nombre: payload.nombre,
        rol: payload.rol,
        programaFicha: payload.programaFicha,
        ratings: [
          payload.q1_equipos,
          payload.q2_internet,
          payload.q3_software,
          payload.q4_clima,
          payload.q5_iluminacion,
          payload.q6_mobiliario,
          payload.q7_limpieza,
          payload.q8_ruido,
          payload.q9_soporte,
          payload.q10_general,
        ],
        comentarios: payload.comentarios,
      });

      return { success: true, method: 'webhook' };
    } catch (e) {
      console.warn('Webhook delivery error:', e);
    }
  }

  // 2. Try Google Sheets API v4 with OAuth token
  const token = await getAccessToken();
  const cleanId = extractSpreadsheetId(config.spreadsheetId);

  if (cleanId && token) {
    await ensureTargetSheetExists(cleanId);

    const rowValues = [
      timestamp,
      payload.nombre,
      payload.rol,
      payload.programaFicha,
      payload.q1_equipos,
      payload.q2_internet,
      payload.q3_software,
      payload.q4_clima,
      payload.q5_iluminacion,
      payload.q6_mobiliario,
      payload.q7_limpieza,
      payload.q8_ruido,
      payload.q9_soporte,
      payload.q10_general,
      payload.comentarios,
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
      throw new Error(`Error de Google Sheets: ${err?.error?.message || appendRes.statusText}`);
    }

    saveLocalResponse({
      timestamp,
      nombre: payload.nombre,
      rol: payload.rol,
      programaFicha: payload.programaFicha,
      ratings: [
        payload.q1_equipos,
        payload.q2_internet,
        payload.q3_software,
        payload.q4_clima,
        payload.q5_iluminacion,
        payload.q6_mobiliario,
        payload.q7_limpieza,
        payload.q8_ruido,
        payload.q9_soporte,
        payload.q10_general,
      ],
      comentarios: payload.comentarios,
    });

    return { success: true, method: 'sheets_api' };
  }

  // 3. If neither is active, store locally and throw clear notification
  saveLocalResponse({
    timestamp,
    nombre: payload.nombre,
    rol: payload.rol,
    programaFicha: payload.programaFicha,
    ratings: [
      payload.q1_equipos,
      payload.q2_internet,
      payload.q3_software,
      payload.q4_clima,
      payload.q5_iluminacion,
      payload.q6_mobiliario,
      payload.q7_limpieza,
      payload.q8_ruido,
      payload.q9_soporte,
      payload.q10_general,
    ],
    comentarios: payload.comentarios,
  });

  return { success: true, method: 'local_saved' };
}

function saveLocalResponse(record: SurveyResponseRecord) {
  try {
    const raw = localStorage.getItem('f3_survey_responses_local') || '[]';
    const list: SurveyResponseRecord[] = JSON.parse(raw);
    list.push(record);
    localStorage.setItem('f3_survey_responses_local', JSON.stringify(list));
  } catch (e) {
    console.error('Error saving local response:', e);
  }
}

export function getLocalResponses(): SurveyResponseRecord[] {
  try {
    const raw = localStorage.getItem('f3_survey_responses_local') || '[]';
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Ensures the target sheet 'Encuesta IA' exists on the spreadsheet.
 */
export async function ensureTargetSheetExists(spreadsheetId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) return;

  const cleanId = extractSpreadsheetId(spreadsheetId);

  // Check existing sheets
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!metaRes.ok) return;

  const data = await metaRes.json();
  const sheets: any[] = data.sheets || [];
  const sheetNames = sheets.map((s) => s.properties?.title || '');
  const hasTarget = sheetNames.some((title) => title.trim().toLowerCase() === TARGET_SHEET_NAME.toLowerCase());

  if (!hasTarget) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`, {
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
              },
            },
          },
        ],
      }),
    });
  }

  // Check headers
  const headerCheckRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(TARGET_SHEET_NAME)}!A1:O1`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const headerData = await headerCheckRes.json().catch(() => ({}));
  if (!headerData?.values || headerData.values.length === 0) {
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
 * Generates the Google Apps Script code to paste into the user's Google Sheet
 */
export function getAppsScriptTemplate(): string {
  return `/**
 * Código para Google Apps Script
 * Pega esto en: Tu Hoja de Cálculo > Extensiones > Apps Script
 * Luego haz clic en Implementar > Nueva implementación > Aplicación Web
 * - Ejecutar como: Yo
 * - Quién tiene acceso: Cualquier usuario
 */
const NOMBRE_HOJA = "${TARGET_SHEET_NAME}";

function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(NOMBRE_HOJA);

    if (!sheet) {
      sheet = ss.insertSheet(NOMBRE_HOJA);
      sheet.setTabColor("#39A900");
    }

    if (sheet.getLastRow() === 0) {
      const headers = [
        "Marca temporal",
        "Nombre / Identificación",
        "Rol",
        "Programa / Ficha",
        "1. Estado Equipos",
        "2. Conexión Internet",
        "3. Software Instalado",
        "4. Climatización",
        "5. Iluminación",
        "6. Mobiliario",
        "7. Limpieza y Orden",
        "8. Nivel de Ruido",
        "9. Soporte Técnico",
        "10. Satisfacción Global",
        "Comentarios y Sugerencias"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dcfce7");
      sheet.setFrozenRows(1);
    }

    let data;
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else {
      data = (e && e.parameter) ? e.parameter : {};
    }

    const timestamp = data.timestamp || Utilities.formatDate(new Date(), "America/Bogota", "yyyy-MM-dd HH:mm:ss");

    const row = [
      timestamp,
      data.nombre || (data.esAnonimo ? "Anónimo" : "Sin especificar"),
      data.rol || "Aprendiz",
      data.programaFicha || "No especificado",
      data.q1_equipos || "",
      data.q2_internet || "",
      data.q3_software || "",
      data.q4_clima || "",
      data.q5_iluminacion || "",
      data.q6_mobiliario || "",
      data.q7_limpieza || "",
      data.q8_ruido || "",
      data.q9_soporte || "",
      data.q10_general || "",
      data.comentarios || ""
    ];

    sheet.appendRow(row);
    lock.releaseLock();

    return ContentService.createTextOutput(
      JSON.stringify({ status: "success", row: sheet.getLastRow() })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
}
