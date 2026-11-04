/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { SurveyForm } from './components/SurveyForm.tsx';
import { SuccessModal } from './components/SuccessModal.tsx';
import { AdminAccessModal } from './components/AdminAccessModal.tsx';
import { sendSurveyToSheet, syncPendingResponses } from './services/sheetsService.ts';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  ConnectedUser, 
  getCurrentUser,
  setManualEmail 
} from './services/firebaseAuth.ts';
import { SurveyFormData } from './types/survey.ts';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';

export default function App() {
  const [connectedUser, setConnectedUser] = useState<ConnectedUser | null>(() => getCurrentUser());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [lastSubmittedEmail, setLastSubmittedEmail] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Initialize Firebase Auth listener on mount
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
      const res = await googleSignIn();
      setConnectedUser(res.user);
      setToastMessage({
        type: 'success',
        text: `¡Cuenta ${res.user.email} conectada con permisos de Google Sheets!`,
      });

      // Automatically sync any previously submitted responses
      try {
        const syncRes = await syncPendingResponses();
        if (syncRes.syncedCount > 0) {
          setTimeout(() => {
            setToastMessage({
              type: 'success',
              text: `¡Se enviaron automáticamente ${syncRes.syncedCount} respuesta(s) a la hoja "Encuesta IA"!`,
            });
          }, 1500);
        }
      } catch (syncErr) {
        console.warn('Sync pending notice:', syncErr);
      }
    } catch (err: any) {
      console.warn('Error connecting google:', err);
      setToastMessage({
        type: 'error',
        text: err?.message || 'Error al conectar con Google. Permite ventanas emergentes.',
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
        text: 'Cuenta desvinculada.',
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmitSurvey = async (formData: SurveyFormData, email: string) => {
    setIsSubmitting(true);
    const activeEmail = email || connectedUser?.email || '';
    setLastSubmittedEmail(activeEmail);
    if (email && !connectedUser) {
      setManualEmail(email);
    }

    try {
      const res = await sendSurveyToSheet(formData, activeEmail);
      setShowSuccessModal(true);
      if (res.syncedToGoogle) {
        setToastMessage({
          type: 'success',
          text: '¡Respuesta enviada inmediatamente a tu hoja de cálculo (Encuesta IA)!',
        });
      } else {
        setToastMessage({
          type: 'success',
          text: '¡Respuesta registrada con éxito en el sistema!',
        });
      }
    } catch (err: any) {
      console.error('Error submitting survey:', err);
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

      {/* Institutional Header */}
      <Header
        connectedUser={connectedUser}
        onConnectGoogle={handleConnectGoogle}
        onDisconnectGoogle={handleDisconnectGoogle}
        isConnecting={isConnecting}
        onOpenAdminModal={() => setShowAdminModal(true)}
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

      {/* Password Protected Admin Modal (PIN 1305) */}
      <AdminAccessModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        connectedUser={connectedUser}
        onUserConnected={(u) => setConnectedUser(u)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-5 px-4 text-xs text-slate-500">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#39A900]">SENA CAB</span>
            <span>• Centro Agropecuario de Buga — Sala de Cómputo F3</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Regional Valle del Cauca</span>
            <span>•</span>
            <button
              onClick={() => setShowAdminModal(true)}
              className="text-slate-400 hover:text-emerald-700 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Ver / Sincronizar Excel</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
