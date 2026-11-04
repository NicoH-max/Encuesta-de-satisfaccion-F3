import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Send 
} from 'lucide-react';
import { 
  getSavedConfig, 
  saveConfig, 
  getAppsScriptTemplate, 
  TARGET_SHEET_NAME, 
  sendSurveyToSheet 
} from '../services/sheetsService.ts';
import { requestGoogleOAuth, getCurrentUser, logout } from '../services/firebaseAuth.ts';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated,
}) => {
  const [config, setConfig] = useState(getSavedConfig());
  const [copiedScript, setCopiedScript] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [testing, setTesting] = useState(false);
  const currentUser = getCurrentUser();

  if (!isOpen) return null;

  const handleSave = () => {
    saveConfig(config);
    onConfigUpdated();
    setStatusMsg({
      type: 'success',
      text: 'Configuración guardada exitosamente.',
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleAuthorizeGoogle = async () => {
    setIsAuthenticating(true);
    setStatusMsg(null);
    try {
      const res = await requestGoogleOAuth();
      setStatusMsg({
        type: 'success',
        text: `Autorización exitosa con Google${res.user?.email ? ` (${res.user.email})` : ''}.`,
      });
      onConfigUpdated();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Error al autorizar con Google.',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleTestDelivery = async () => {
    setTesting(true);
    setStatusMsg(null);
    try {
      const res = await sendSurveyToSheet({
        nombre: 'Prueba de Conexión',
        esAnonimo: false,
        rol: 'Administrativo',
        programaFicha: 'Prueba Sistema',
        q1_equipos: 5,
        q2_internet: 5,
        q3_software: 5,
        q4_clima: 5,
        q5_iluminacion: 5,
        q6_mobiliario: 5,
        q7_limpieza: 5,
        q8_ruido: 5,
        q9_soporte: 5,
        q10_general: 5,
        comentarios: 'Fila de prueba automática enviada a la pestaña Encuesta IA.',
      });

      setStatusMsg({
        type: 'success',
        text: `¡Fila de prueba enviada con éxito mediante ${res.method === 'webhook' ? 'Google Apps Script' : 'Google Sheets API'}!`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Error al enviar la prueba.',
      });
    } finally {
      setTesting(false);
    }
  };

  const copyScript = () => {
    navigator.clipboard.writeText(getAppsScriptTemplate());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>Configuración de Destino (Hoja &quot;{TARGET_SHEET_NAME}&quot;)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Section 1: Google Account Authorization */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                1. Autorización con Cuenta de Google
              </h4>
              <p className="text-[11px] text-slate-500">
                Autoriza para permitir que la aplicación se conecte con tus Hojas de Cálculo.
              </p>
            </div>
            {currentUser ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  Conectado: {currentUser.email || currentUser.name}
                </span>
                <button
                  onClick={async () => {
                    await logout();
                    onConfigUpdated();
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button
                onClick={handleAuthorizeGoogle}
                disabled={isAuthenticating}
                className="inline-flex items-center gap-2 bg-[#00324D] hover:bg-[#002235] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAuthenticating ? 'Conectando...' : 'Autorizar con Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 2: Destination Google Apps Script / Sheet */}
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              2. URL de Tu Hoja o Webhook de Apps Script
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pega aquí la URL de la Aplicación Web de Google Apps Script (recomendado para que los aprendices envíen sin iniciar sesión) o la URL de tu Hoja de Google:
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              URL de Apps Script Web App (Webhook Directo)
            </label>
            <input
              type="text"
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              value={config.webhookUrl}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39A900]"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              O URL / ID de la Hoja de Cálculo en Google Drive
            </label>
            <input
              type="text"
              placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFM.../edit"
              value={config.spreadsheetId}
              onChange={(e) => setConfig({ ...config, spreadsheetId: e.target.value })}
              className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39A900]"
            />
          </div>
        </div>

        {/* Section 3: Google Apps Script Code snippet */}
        <div className="bg-slate-900 rounded-xl p-4 text-slate-100 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-emerald-400">
              Código Apps Script para tu Hoja (Pestaña: {TARGET_SHEET_NAME})
            </span>
            <button
              onClick={copyScript}
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[11px] font-semibold transition-colors"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? '¡Copiado!' : 'Copiar Código'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            En tu hoja de cálculo ve a <strong>Extensiones &gt; Apps Script</strong>, pega este código e <strong>Implementa como Aplicación web</strong> (Acceso: Cualquier usuario).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleTestDelivery}
            disabled={testing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-emerald-600" />
            <span>{testing ? 'Enviando prueba...' : 'Enviar fila de prueba'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-[#39A900] hover:bg-[#2d8500] text-white text-xs font-bold px-5 py-2 rounded-xl transition-colors shadow-xs"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
