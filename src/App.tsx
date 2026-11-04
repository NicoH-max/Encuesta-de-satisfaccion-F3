/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  setCachedAccessToken 
} from './services/firebaseAuth.ts';
import { 
  verifySpreadsheet, 
  appendSurveyResponse, 
  TARGET_SHEET_NAME 
} from './services/sheetsService.ts';
import { SurveyFormData } from './types/survey.ts';
import { Header } from './components/Header.tsx';
import { SurveyForm } from './components/SurveyForm.tsx';
import { SheetConnector } from './components/SheetConnector.tsx';
import { ResponsesDashboard } from './components/ResponsesDashboard.tsx';
import { HtmlExporter } from './components/HtmlExporter.tsx';
import { SuccessModal } from './components/SuccessModal.tsx';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'survey' | 'dashboard' | 'config' | 'code'>('survey');
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('f3_survey_spreadsheet_id') || '';
  });
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('Hoja de Cálculo');
  const [isVerified, setIsVerified] = useState(false);
  const [hasTargetSheet, setHasTargetSheet] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setCachedAccessToken(token);
        if (spreadsheetId) {
          checkSheet(spreadsheetId);
        }
      },
      () => {
        setUser(null);
        setCachedAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const checkSheet = async (id: string) => {
    try {
      const res = await verifySpreadsheet(id);
      setIsVerified(true);
      setSpreadsheetTitle(res.title);
      setHasTargetSheet(res.hasTargetSheet);
    } catch {
      setIsVerified(false);
    }
  };

  const handleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToastMessage({
          type: 'success',
          text: `Sesión iniciada como ${res.user.displayName || res.user.email}`,
        });
        if (spreadsheetId) {
          await checkSheet(spreadsheetId);
        }
      }
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err?.message || 'Error al iniciar sesión con Google.',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setIsVerified(false);
      setToastMessage({
        type: 'success',
        text: 'Sesión cerrada correctamente.',
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmitSurvey = async (formData: SurveyFormData) => {
    if (!spreadsheetId) {
      setToastMessage({
        type: 'error',
        text: 'Por favor vincula una hoja de cálculo antes de enviar la encuesta.',
      });
      setActiveTab('config');
      return;
    }

    setIsSubmitting(true);
    try {
      await appendSurveyResponse(spreadsheetId, formData);
      setShowSuccessModal(true);
      setToastMessage({
        type: 'success',
        text: `¡Respuesta agregada exitosamente a la página "${TARGET_SHEET_NAME}"!`,
      });
    } catch (err: any) {
      setToastMessage({
        type: 'error',
        text: err?.message || 'Error al enviar la respuesta a Google Sheets.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto dismiss toast
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
        <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-red-900 text-white border-red-700'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasSpreadsheet={Boolean(spreadsheetId && isVerified && hasTargetSheet)}
        spreadsheetTitle={spreadsheetTitle}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'survey' && (
          <SurveyForm
            onSubmitToSheet={handleSubmitSurvey}
            isSubmitting={isSubmitting}
            hasSpreadsheet={Boolean(spreadsheetId && isVerified && hasTargetSheet)}
            spreadsheetTitle={spreadsheetTitle}
            onGoToConfig={() => setActiveTab('config')}
            isSignedIn={Boolean(user)}
            onSignIn={handleLogin}
          />
        )}

        {activeTab === 'config' && (
          <SheetConnector
            spreadsheetId={spreadsheetId}
            setSpreadsheetId={setSpreadsheetId}
            spreadsheetTitle={spreadsheetTitle}
            setSpreadsheetTitle={setSpreadsheetTitle}
            isVerified={isVerified}
            setIsVerified={setIsVerified}
            hasTargetSheet={hasTargetSheet}
            setHasTargetSheet={setHasTargetSheet}
            isSignedIn={Boolean(user)}
            onSignIn={handleLogin}
          />
        )}

        {activeTab === 'dashboard' && (
          <ResponsesDashboard
            spreadsheetId={spreadsheetId}
            spreadsheetTitle={spreadsheetTitle}
            hasSpreadsheet={Boolean(spreadsheetId && isVerified && hasTargetSheet)}
            isSignedIn={Boolean(user)}
            onGoToConfig={() => setActiveTab('config')}
          />
        )}

        {activeTab === 'code' && (
          <HtmlExporter spreadsheetId={spreadsheetId} />
        )}
      </main>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        spreadsheetId={spreadsheetId}
        spreadsheetTitle={spreadsheetTitle}
        onViewStats={() => {
          setShowSuccessModal(false);
          setActiveTab('dashboard');
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6 px-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#39A900]">SENA CAB</span>
            <span>• Centro Agropecuario de Buga — Sala de Cómputo F3</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Pestaña destino: <strong className="text-slate-700">{TARGET_SHEET_NAME}</strong></span>
            <span>•</span>
            <span>Google Sheets API v4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
