import React from 'react';
import { CheckCircle2, ExternalLink, BarChart3, Plus, Sparkles } from 'lucide-react';
import { TARGET_SHEET_NAME } from '../services/sheetsService.ts';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  spreadsheetId: string;
  spreadsheetTitle: string;
  onViewStats: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  spreadsheetId,
  spreadsheetTitle,
  onViewStats,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-100 space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#39A900] mx-auto flex items-center justify-center shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Respuesta Registrada con Éxito</span>
          </div>
          <h3 className="text-xl font-black text-slate-900">
            ¡Gracias por tus comentarios!
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tu evaluación sobre la <strong>Sala de Cómputo F3</strong> ha sido guardada en la hoja de cálculo 
            en la pestaña <strong className="text-slate-900">&quot;{TARGET_SHEET_NAME}&quot;</strong>.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1">
          <p className="text-slate-500 font-medium">Hoja de cálculo:</p>
          <p className="font-bold text-slate-800 truncate">{spreadsheetTitle}</p>
          <p className="text-[11px] text-emerald-700 font-medium">Página: {TARGET_SHEET_NAME}</p>
        </div>

        <div className="flex flex-col gap-2.5 pt-2">
          {spreadsheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#39A900] hover:bg-[#2d8500] text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition-colors"
            >
              <span>Ver fila añadida en Google Sheets</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onViewStats}
              className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Ver Estadísticas</span>
            </button>

            <button
              onClick={onClose}
              className="inline-flex items-center justify-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2.5 px-3 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Nueva Respuesta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
