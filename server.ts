import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const RESPONSES_FILE = path.join(DATA_DIR, 'responses.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

export const SPREADSHEET_ID = '1eu4xZrOlAgwpfvvxy4aTxkLTyWI5LSgN7tSsDu7MvXk';
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

interface ServerConfig {
  googleAccessToken?: string;
  webhookUrl?: string;
}

function loadConfig(): ServerConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error loading config:', e);
  }
  return {};
}

function saveConfig(cfg: ServerConfig) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2));
  } catch (e) {
    console.error('Error saving config:', e);
  }
}

function loadResponses(): any[] {
  try {
    if (fs.existsSync(RESPONSES_FILE)) {
      return JSON.parse(fs.readFileSync(RESPONSES_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error loading responses:', e);
  }
  return [];
}

function saveResponses(list: any[]) {
  try {
    fs.writeFileSync(RESPONSES_FILE, JSON.stringify(list, null, 2));
  } catch (e) {
    console.error('Error saving responses:', e);
  }
}

/**
 * Attempts to append a row directly to Google Sheets using the stored access token
 */
async function appendToGoogleSheets(rowValues: any[], token: string): Promise<boolean> {
  try {
    // 1. Check if sheet tab exists or create if needed
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (metaRes.ok) {
      const meta = await metaRes.json();
      const sheets: any[] = meta.sheets || [];
      const hasTab = sheets.some(
        (s) => (s.properties?.title || '').trim().toLowerCase() === TARGET_SHEET_NAME.toLowerCase()
      );

      if (!hasTab) {
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`, {
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

        // Write header row
        await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
            TARGET_SHEET_NAME
          )}!A1:O1?valueInputOption=USER_ENTERED`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ values: [SHEET_COLUMNS] }),
          }
        );
      }
    }

    // 2. Append row
    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(
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

    return appendRes.ok;
  } catch (err) {
    console.error('Error appending to Google Sheets:', err);
    return false;
  }
}

/**
 * Attempts to forward to a Google Apps Script Webhook
 */
async function forwardToWebhook(payload: any, webhookUrl: string): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error('Error forwarding to Apps Script webhook:', err);
    return false;
  }
}

// ================= API ROUTES =================

/**
 * Public Survey Submission endpoint (callable by ANY device, ANY user, anonymous or with email)
 */
app.post('/api/survey-response', async (req, res) => {
  const data = req.body;
  const config = loadConfig();

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

  const email = data.email?.trim() || '';
  const identificacion = data.esAnonimo
    ? (email ? `Anónimo (${email})` : 'Anónimo')
    : (data.nombre?.trim()
        ? (email ? `${data.nombre.trim()} (${email})` : data.nombre.trim())
        : (email || 'Sin especificar'));

  const comentariosCombined = [data.aspectosMejorar?.trim(), data.comentarios?.trim()]
    .filter(Boolean)
    .join(' | ') || 'Sin observaciones adicionales';

  // Exactly 15 columns matching "Encuesta IA" tab
  const rowValues = [
    timestamp,
    identificacion,
    data.rol || 'Aprendiz',
    data.programaFicha?.trim() || 'No especificado',
    data.q1_equipos || 0,
    data.q2_internet || 0,
    data.q3_software || 0,
    data.q4_climatizacion || 0,
    data.q5_iluminacion || 0,
    data.q6_mobiliario || 0,
    data.q7_limpieza || 0,
    data.q8_ambiente || 0,
    data.q9_atencion || 0,
    data.q10_satisfaccion || 0,
    comentariosCombined,
  ];

  let synced = false;

  // 1. Try Google Sheets API with stored token
  if (config.googleAccessToken) {
    synced = await appendToGoogleSheets(rowValues, config.googleAccessToken);
  }

  // 2. Try Apps Script Webhook if token didn't sync or not available
  if (!synced && config.webhookUrl) {
    synced = await forwardToWebhook({ targetSheet: TARGET_SHEET_NAME, row: rowValues, data }, config.webhookUrl);
  }

  // 3. Save to server database
  const responses = loadResponses();
  const newRecord = {
    id: Date.now().toString(),
    timestamp,
    email: email || 'No especificado',
    nombre: data.esAnonimo ? 'Anónimo' : (data.nombre?.trim() || 'Sin especificar'),
    rol: data.rol || 'Aprendiz',
    programaFicha: data.programaFicha?.trim() || 'No especificado',
    ratings: [
      data.q1_equipos || 0,
      data.q2_internet || 0,
      data.q3_software || 0,
      data.q4_climatizacion || 0,
      data.q5_iluminacion || 0,
      data.q6_mobiliario || 0,
      data.q7_limpieza || 0,
      data.q8_ambiente || 0,
      data.q9_atencion || 0,
      data.q10_satisfaccion || 0,
    ],
    aspectosMejorar: data.aspectosMejorar?.trim() || '',
    comentarios: data.comentarios?.trim() || '',
    syncedToGoogle: synced,
    rowValues,
  };
  responses.push(newRecord);
  saveResponses(responses);

  res.json({
    success: true,
    syncedToGoogle: synced,
    totalRecords: responses.length,
    timestamp,
  });
});

/**
 * Get survey responses (Protected by PIN 1305)
 */
app.get('/api/survey-responses', (req, res) => {
  const pin = req.query.pin;
  const responses = loadResponses();

  if (pin !== '1305') {
    return res.json({
      count: responses.length,
      unsynced: responses.filter((r) => !r.syncedToGoogle).length,
    });
  }

  res.json({
    count: responses.length,
    unsynced: responses.filter((r) => !r.syncedToGoogle).length,
    records: responses,
  });
});

/**
 * Export responses as CSV for Excel (Protected by PIN 1305)
 */
app.get('/api/export-csv', (req, res) => {
  const pin = req.query.pin;
  if (pin !== '1305') {
    return res.status(401).send('Clave de acceso incorrecta');
  }

  const responses = loadResponses();
  const csvRows = [SHEET_COLUMNS.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')];

  for (const r of responses) {
    if (r.rowValues && Array.isArray(r.rowValues)) {
      csvRows.push(r.rowValues.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    } else {
      const row = [
        r.timestamp,
        r.email ? `${r.nombre} (${r.email})` : r.nombre,
        r.rol,
        r.programaFicha,
        ...(r.ratings || []),
        [r.aspectosMejorar, r.comentarios].filter(Boolean).join(' | '),
      ];
      csvRows.push(row.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(','));
    }
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="Encuesta_Sala_F3_Respuestas.csv"');
  res.send('\uFEFF' + csvRows.join('\r\n'));
});

/**
 * Store Google OAuth access token on the server so ANY device can submit directly to Google Sheets
 */
app.post('/api/save-token', async (req, res) => {
  const { token, email } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const config = loadConfig();
  config.googleAccessToken = token;
  saveConfig(config);

  // Sync any pending stored responses
  const responses = loadResponses();
  const unsynced = responses.filter((r) => !r.syncedToGoogle);
  let syncedCount = 0;

  for (const r of unsynced) {
    const row = r.rowValues || [
      r.timestamp,
      r.email ? `${r.nombre} (${r.email})` : r.nombre,
      r.rol,
      r.programaFicha,
      ...(r.ratings || []),
      [r.aspectosMejorar, r.comentarios].filter(Boolean).join(' | '),
    ];
    const ok = await appendToGoogleSheets(row, token);
    if (ok) {
      r.syncedToGoogle = true;
      syncedCount++;
    }
  }

  if (syncedCount > 0) {
    saveResponses(responses);
  }

  res.json({
    success: true,
    message: `Token guardado. Se sincronizaron ${syncedCount} respuestas pendientes a Google Sheets ("${TARGET_SHEET_NAME}").`,
    syncedCount,
    email,
  });
});

/**
 * Save Google Apps Script Webhook URL
 */
app.post('/api/save-webhook', (req, res) => {
  const { webhookUrl } = req.body;
  const config = loadConfig();
  config.webhookUrl = webhookUrl ? webhookUrl.trim() : '';
  saveConfig(config);
  res.json({ success: true, webhookUrl: config.webhookUrl });
});

/**
 * Check server configuration status
 */
app.get('/api/config', (req, res) => {
  const config = loadConfig();
  const responses = loadResponses();
  res.json({
    hasToken: Boolean(config.googleAccessToken),
    hasWebhook: Boolean(config.webhookUrl),
    totalCount: responses.length,
    unsyncedCount: responses.filter((r) => !r.syncedToGoogle).length,
    spreadsheetId: SPREADSHEET_ID,
    sheetName: TARGET_SHEET_NAME,
  });
});

/**
 * Sync all unsynced responses to Google Sheets
 */
app.post('/api/sync-all', async (req, res) => {
  const config = loadConfig();
  const responses = loadResponses();
  const unsynced = responses.filter((r) => !r.syncedToGoogle);

  if (unsynced.length === 0) {
    return res.json({ success: true, syncedCount: 0, message: 'Todos los datos ya están en Google Sheets.' });
  }

  if (!config.googleAccessToken && !config.webhookUrl) {
    return res.status(400).json({
      error: 'No hay token de Google ni Webhook de Apps Script configurado en el servidor para sincronizar.',
    });
  }

  let count = 0;
  for (const r of unsynced) {
    const row = r.rowValues || [
      r.timestamp,
      r.email ? `${r.nombre} (${r.email})` : r.nombre,
      r.rol,
      r.programaFicha,
      ...(r.ratings || []),
      [r.aspectosMejorar, r.comentarios].filter(Boolean).join(' | '),
    ];

    let ok = false;
    if (config.googleAccessToken) {
      ok = await appendToGoogleSheets(row, config.googleAccessToken);
    }
    if (!ok && config.webhookUrl) {
      ok = await forwardToWebhook({ targetSheet: TARGET_SHEET_NAME, row, data: r }, config.webhookUrl);
    }
    if (ok) {
      r.syncedToGoogle = true;
      count++;
    }
  }

  saveResponses(responses);
  res.json({ success: true, syncedCount: count });
});

// ================= VITE DEV MIDDLEWARE / STATIC FILES =================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
