/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { SurveyForm } from './components/SurveyForm.tsx';
import { SuccessModal } from './components/SuccessModal.tsx';
import { AdminSettingsModal } from './components/AdminSettingsModal.tsx';
import { 
  sendSurveyToSheet, 
  getSavedConfig, 
  TARGET_SHEET_NAME 
} from './services/sheetsService.ts';
import { SurveyFormData } from './types/survey.ts';
import { AlertCircle, CheckCircle2, Settings } from 'lucide-react';

export default function App() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  const checkConfiguration = () => {
    const config = getSavedConfig();
    setIsConfigured(Boolean(config.webhookUrl || config.spreadsheetId));
  };

  useEffect(() => {
    checkConfiguration();
  }, []);

  const handleSubmitSurvey = async (formData: SurveyFormData) => {
    setIsSubmitting(true);
    try {
      const res = await sendSurveyToSheet(formData);

      if (res.method === 'local_saved') {
        setShowSuccessModal(true);
        setToastMessage({
          type: 'info',
          text: 'Respuesta guardada. Recuerda configurar el enlace de tu Google Sheet en el icono de configuración para sincronización directa.',
        });
      } else {
        setShowSuccessModal(true);
        setToastMessage({
          type: 'success',
          text: `¡Respuesta enviada exitosamente a la hoja "${TARGET_SHEET_NAME}"!`,
        });
      }
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err?.message || 'Error al enviar las respuestas. Por favor revisa la conexión.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-4 z-50 animate-in slide-in-from-top-3 duration-200 max-w-sm">
          <div
            className={`flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toastMessage.type === 'info'
                ? 'bg-blue-900 text-white border-blue-700'
                : 'bg-red-900 text-white border-red-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-tight">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Institutional Header */}
      <Header
        onOpenSettings={() => setShowSettingsModal(true)}
        isConfigured={isConfigured}
      />

      {/* Main Survey Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <SurveyForm
          onSubmit={handleSubmitSurvey}
          isSubmitting={isSubmitting}
        />
      </main>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />

      {/* Admin Settings Modal */}
      <AdminSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onConfigUpdated={checkConfiguration}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 px-4 text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#39A900]">SENA CAB</span>
            <span>• Centro Agropecuario de Buga — Sala de Cómputo F3</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Pestaña destino: <strong className="text-slate-700">{TARGET_SHEET_NAME}</strong></span>
            <span>•</span>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="text-slate-500 hover:text-emerald-700 underline font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>Configuración de Hoja</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
