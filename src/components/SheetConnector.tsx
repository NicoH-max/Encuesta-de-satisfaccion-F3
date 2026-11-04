import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  Search, 
  RefreshCw, 
  Sparkles,
  Info
} from 'lucide-react';
import { 
  verifySpreadsheet, 
  ensureTargetSheetExists, 
  createNewSpreadsheet, 
  TARGET_SHEET_NAME,
  extractSpreadsheetId 
} from '../services/sheetsService.ts';

interface SheetConnectorProps {
  spreadsheetId: string;
  setSpreadsheetId: (id: string) => void;
  spreadsheetTitle: string;
  setSpreadsheetTitle: (title: string) => void;
  isVerified: boolean;
  setIsVerified: (v: boolean) => void;
  hasTargetSheet: boolean;
  setHasTargetSheet: (v: boolean) => void;
  isSignedIn: boolean;
  onSignIn: () => void;
}

export const SheetConnector: React.FC<SheetConnectorProps> = ({
  spreadsheetId,
  setSpreadsheetId,
  spreadsheetTitle,
  setSpreadsheetTitle,
  isVerified,
  setIsVerified,
  hasTargetSheet,
  setHasTargetSheet,
  isSignedIn,
  onSignIn,
}) => {
  const [inputVal, setInputVal] = useState(spreadsheetId);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleVerify = async (idToVerify?: string) => {
    const target = idToVerify || inputVal;
    if (!target.trim()) {
      setErrorMessage('Por favor ingresa el enlace o ID de tu hoja de cálculo.');
      return;
    }

    if (!isSignedIn) {
      setErrorMessage('Debes iniciar sesión con Google para verificar y vincular la hoja.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const cleanId = extractSpreadsheetId(target);
      const res = await verifySpreadsheet(cleanId);
      setSpreadsheetId(cleanId);
      localStorage.setItem('f3_survey_spreadsheet_id', cleanId);
      setSpreadsheetTitle(res.title);
      setHasTargetSheet(res.hasTargetSheet);
      setIsVerified(true);

      if (!res.hasTargetSheet) {
        setSuccessMessage(
          `Hoja "${res.title}" encontrada. Haz clic en "Crear pestaña '${TARGET_SHEET_NAME}'" para habilitar la recepción de respuestas.`
        );
      } else {
        setSuccessMessage(`¡Conexión exitosa! La pestaña "${TARGET_SHEET_NAME}" está lista.`);
      }
    } catch (err: any) {
      setIsVerified(false);
      setErrorMessage(err.message || 'No se pudo conectar con la hoja de Google');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTargetSheet = async () => {
    if (!spreadsheetId) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await ensureTargetSheetExists(spreadsheetId);
      setHasTargetSheet(true);
      setSuccessMessage(`¡Pestaña "${TARGET_SHEET_NAME}" creada con encabezados correctamente!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al preparar la pestaña.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewSpreadsheet = async () => {
    if (!isSignedIn) {
      setErrorMessage('Debes iniciar sesión con Google para crear una nueva hoja.');
      return;
    }

    setCreating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const newSheet = await createNewSpreadsheet();
      setInputVal(newSheet.id);
      setSpreadsheetId(newSheet.id);
      localStorage.setItem('f3_survey_spreadsheet_id', newSheet.id);
      setSpreadsheetTitle(newSheet.title);
      setHasTargetSheet(true);
      setIsVerified(true);
      setSuccessMessage(
        `¡Hoja de cálculo "${newSheet.title}" creada en tu Google Drive con la pestaña "${TARGET_SHEET_NAME}" y columnas listas!`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al crear la hoja en Google Drive.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-[#00324D] rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs">
            <FileSpreadsheet className="w-8 h-8 text-emerald-300" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Vincular Hoja de Cálculo de Google</h2>
            <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Las respuestas enviadas desde el formulario se guardan de forma instantánea en la hoja 
              llamada <strong className="text-white underline decoration-emerald-400 font-semibold">{TARGET_SHEET_NAME}</strong> dentro 
              del archivo de Google Sheets que elijas o crees a continuación.
            </p>
          </div>
        </div>
      </div>

      {!isSignedIn && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <p className="font-semibold text-sm">Se requiere autorización de Google</p>
              <p className="text-amber-700 mt-0.5">
                Para que la aplicación pueda escribir en tu hoja de cálculo o crear una nueva en tu Google Drive, inicia sesión con tu cuenta de Google.
              </p>
            </div>
          </div>
          <button
            onClick={onSignIn}
            className="w-full sm:w-auto shrink-0 bg-[#39A900] hover:bg-[#2e8800] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Iniciar Sesión con Google</span>
          </button>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Configuración de la Hoja Destino</h3>
            <p className="text-xs text-slate-500">
              Pega la URL de tu hoja existente o genera una nueva hoja en tu Google Drive con un clic.
            </p>
          </div>
          <button
            onClick={handleCreateNewSpreadsheet}
            disabled={creating || !isSignedIn}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{creating ? 'Creando en Drive...' : 'Crear nueva hoja en mi Drive'}</span>
          </button>
        </div>

        {/* Input form */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            URL o ID de la Hoja de Cálculo de Google
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFM.../edit o ID"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all font-mono"
              />
            </div>
            <button
              onClick={() => handleVerify()}
              disabled={loading || !isSignedIn}
              className="inline-flex items-center justify-center gap-2 bg-[#00324D] hover:bg-[#002235] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-xs"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Verificar y Conectar</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Puedes pegar la URL completa desde la barra de direcciones de tu navegador.
          </p>
        </div>

        {/* Status alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Atención:</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Operación exitosa</p>
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        {/* Current status display */}
        {isVerified && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                  Hoja activa vinculada
                </span>
                <h4 className="font-bold text-slate-900 text-sm">{spreadsheetTitle}</h4>
                <p className="text-[11px] font-mono text-slate-500 truncate max-w-md">
                  ID: {spreadsheetId}
                </p>
              </div>

              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors w-fit"
              >
                <span>Abrir en Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Target sheet status */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Pestaña destino:</span>
                <code className="text-xs font-bold bg-white px-2 py-0.5 rounded border border-slate-300 text-emerald-800">
                  {TARGET_SHEET_NAME}
                </code>
                {hasTargetSheet ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Detectada y lista
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" />
                    No encontrada aún
                  </span>
                )}
              </div>

              {!hasTargetSheet && (
                <button
                  onClick={handleCreateTargetSheet}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 bg-[#39A900] hover:bg-[#2d8500] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Crear pestaña &quot;{TARGET_SHEET_NAME}&quot; ahora</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Helpful Instructions Guide */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600" />
          ¿Cómo funciona la integración con Google Sheets?
        </h4>
        <ol className="text-xs text-slate-600 space-y-2 list-decimal list-inside leading-relaxed">
          <li>
            <strong>Autenticación segura:</strong> La app usa la API oficial de Google Sheets mediante la autorización que acabas de otorgar.
          </li>
          <li>
            <strong>Pestaña &quot;{TARGET_SHEET_NAME}&quot;:</strong> Cada vez que alguien responde la encuesta sobre la Sala F3, se inserta una nueva fila con la marca temporal, datos del usuario y los puntajes de las 10 preguntas.
          </li>
          <li>
            <strong>Sin sobrescrituras accidentales:</strong> Los datos se añaden en filas nuevas al final de la página sin alterar otras pestañas de tu documento.
          </li>
        </ol>
      </div>
    </div>
  );
};
