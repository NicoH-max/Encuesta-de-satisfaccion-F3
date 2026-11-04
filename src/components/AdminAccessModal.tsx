import React, { useState } from 'react';
import { 
  Lock, 
  KeyRound, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  FileSpreadsheet, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { 
  DEFAULT_SPREADSHEET_ID, 
  TARGET_SHEET_NAME, 
  getLocalRecords, 
  syncPendingResponses 
} from '../services/sheetsService.ts';
import { googleSignIn, ConnectedUser } from '../services/firebaseAuth.ts';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedUser: ConnectedUser | null;
  onUserConnected: (user: ConnectedUser) => void;
}

const REQUIRED_PIN = '1305';

export const AdminAccessModal: React.FC<AdminAccessModalProps> = ({
  isOpen,
  onClose,
  connectedUser,
  onUserConnected,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === REQUIRED_PIN) {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncPendingResponses();
      if (res.syncedCount === 0) {
        setSyncMessage('Todos los datos ya están registrados en la pestaña "Encuesta IA".');
      } else {
        setSyncMessage(`¡Se han sincronizado ${res.syncedCount} respuestas directamente a tu hoja de cálculo!`);
      }
    } catch (err: any) {
      setSyncMessage(`Error: ${err.message || 'Verifica la conexión con Google'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAuthorizeGoogle = async () => {
    try {
      const res = await googleSignIn();
      onUserConnected(res.user);
      setSyncMessage(`Cuenta ${res.user.email} autorizada con permisos de Google Sheets.`);
      // Run auto sync
      const syncRes = await syncPendingResponses();
      if (syncRes.syncedCount > 0) {
        setSyncMessage(`¡Cuenta autorizada y ${syncRes.syncedCount} respuestas enviadas a la hoja "Encuesta IA"!`);
      }
    } catch (e: any) {
      setSyncMessage(e?.message || 'No se completó la autorización de Google.');
    }
  };

  const records = getLocalRecords();
  const unsyncedCount = records.filter((r) => !r.syncedToGoogle).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm sm:text-base">
            <Lock className="w-5 h-5 text-emerald-600" />
            <span>Acceso Administrativo al Excel</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isUnlocked ? (
          // PIN Entry View
          <form onSubmit={handleVerifyPin} className="space-y-4 py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#39A900] mx-auto flex items-center justify-center">
              <KeyRound className="w-7 h-7" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Ingresa la clave de acceso</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Para ver el enlace de la hoja de cálculo o sincronizar respuestas, ingresa la clave de administrador.
              </p>
            </div>

            <div className="max-w-xs mx-auto space-y-2">
              <input
                type="password"
                maxLength={8}
                autoFocus
                placeholder="Clave de 4 dígitos"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className={`w-full text-center tracking-widest text-lg font-bold p-3 bg-slate-50 border rounded-xl focus:bg-white focus:outline-none transition-all ${
                  pinError ? 'border-red-400 ring-2 ring-red-100 text-red-700' : 'border-slate-300 focus:ring-2 focus:ring-[#39A900]'
                }`}
              />

              {pinError && (
                <p className="text-xs text-red-600 font-semibold text-center flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Clave incorrecta. Solo el administrador tiene acceso.</span>
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-[#39A900] hover:bg-[#2d8500] text-white font-bold text-xs py-3 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Verificar Clave
              </button>
            </div>
          </form>
        ) : (
          // Unlocked Admin Panel View
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 space-y-0.5">
                <p className="font-bold">Acceso autorizado (Clave 1305 verificada)</p>
                <p className="text-emerald-700">
                  Eres el único con acceso para ver y sincronizar las respuestas de la Sala F3.
                </p>
              </div>
            </div>

            {/* Target Sheet Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">Hoja de cálculo vinculada:</span>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Pestaña: {TARGET_SHEET_NAME}
                </span>
              </div>
              <p className="font-mono text-slate-600 text-[11px] truncate">
                ID: {DEFAULT_SPREADSHEET_ID}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-2">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit#gid=0`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#00324D] hover:bg-[#002235] text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-xs"
                >
                  <span>Abrir Hoja en Google Sheets</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar ahora con Sheets'}</span>
                </button>
              </div>
            </div>

            {/* Google Permissions Status */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Autorización de Google Sheets</h4>
                  <p className="text-[11px] text-slate-500">
                    {connectedUser ? `Conectado como: ${connectedUser.email}` : 'No hay cuenta conectada para escritura directa'}
                  </p>
                </div>
                <button
                  onClick={handleAuthorizeGoogle}
                  className="inline-flex items-center gap-1.5 bg-[#39A900] hover:bg-[#2d8500] text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{connectedUser ? 'Renovar Permisos' : 'Autorizar con Google'}</span>
                </button>
              </div>
            </div>

            {syncMessage && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{syncMessage}</span>
              </div>
            )}

            {/* Recent records status */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Respuestas registradas en el sistema ({records.length})</span>
                {unsyncedCount > 0 ? (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                    {unsyncedCount} pendiente(s) de sincronizar
                  </span>
                ) : (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                    ✓ Todo sincronizado en Sheets
                  </span>
                )}
              </div>

              <div className="overflow-x-auto max-h-48 border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2">Fecha y Hora</th>
                      <th className="p-2">Correo / Usuario</th>
                      <th className="p-2">Rol</th>
                      <th className="p-2 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {records.slice().reverse().map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/70">
                        <td className="p-2 font-mono text-[10px] whitespace-nowrap">{r.timestamp}</td>
                        <td className="p-2 truncate max-w-[140px] font-medium">{r.email || r.nombre}</td>
                        <td className="p-2">{r.rol}</td>
                        <td className="p-2 text-center">
                          {r.syncedToGoogle ? (
                            <span className="text-emerald-700 font-bold text-[10px]">✓ En Sheets</span>
                          ) : (
                            <span className="text-amber-600 font-bold text-[10px]">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {records.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400">
                          Aún no hay respuestas registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setIsUnlocked(false);
                  setPinInput('');
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
