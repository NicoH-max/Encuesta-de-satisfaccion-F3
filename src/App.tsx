/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { SurveyForm } from './components/SurveyForm.tsx';
import { SuccessModal } from './components/SuccessModal.tsx';
import { sendSurveyToSheet } from './services/sheetsService.ts';
import { 
  initAuth, 
  requestGoogleOAuth, 
  logout, 
  ConnectedUser, 
  getCurrentUser,
  setManualEmail 
} from './services/firebaseAuth.ts';
import { SurveyFormData } from './types/survey.ts';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [connectedUser, setConnectedUser] = useState<ConnectedUser | null>(() => getCurrentUser());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setConnectedUser(user);
      },
      () => {
        const current = getCurrentUser();
        if (current) setConnectedUser(current);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    setToastMessage(null);
    try {
      const user = await requestGoogleOAuth();
      if (user) {
        setConnectedUser(user);
        setToastMessage({
          type: 'success',
          text: `Correo ${user.email} vinculado exitosamente.`,
        });
      }
    } catch (err: any) {
      console.warn(err);
      // No intrusive error; let user continue
      setToastMessage({
        type: 'info',
        text: 'Puedes escribir tu correo electrónico directamente en el formulario.',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await logout();
      setConnectedUser(null);
      setToastMessage({
        type: 'info',
        text: 'Correo desvinculado.',
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmitSurvey = async (formData: SurveyFormData, email: string) => {
    setIsSubmitting(true);
    setLastSubmittedEmail(email || connectedUser?.email || '');
    if (email && !connectedUser) {
      setManualEmail(email);
    }

    try {
      await sendSurveyToSheet(formData, email || connectedUser?.email);
      setShowSuccessModal(true);
      setToastMessage({
        type: 'success',
        text: '¡Respuesta registrada con éxito!',
      });
    } catch (err: any) {
      console.error(err);
      setShowSuccessModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
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
                ? 'bg-[#00324D] text-white border-cyan-700'
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

      {/* Header */}
      <Header
        connectedUser={connectedUser}
        onConnectGoogle={handleConnectGoogle}
        onDisconnectGoogle={handleDisconnectGoogle}
        isConnecting={isConnecting}
      />

      {/* Main Survey Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <SurveyForm
          onSubmit={handleSubmitSurvey}
          isSubmitting={isSubmitting}
          connectedUser={connectedUser}
          onConnectGoogle={handleConnectGoogle}
          isConnecting={isConnecting}
        />
      </main>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        userEmail={lastSubmittedEmail}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 px-4 text-xs text-slate-500">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#39A900]">SENA CAB</span>
            <span>• Centro Agropecuario de Buga — Sala de Cómputo F3</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Regional Valle del Cauca • Sistema de Gestión de Calidad
          </div>
        </div>
      </footer>
    </div>
  );
}
