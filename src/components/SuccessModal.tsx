import React from 'react';
import { CheckCircle2, Plus, Sparkles } from 'lucide-react';
import { TARGET_SHEET_NAME } from '../services/sheetsService.ts';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
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
            <span>Encuesta Enviada con Éxito</span>
          </div>
          <h3 className="text-xl font-black text-slate-900">
            ¡Muchas gracias por tu respuesta!
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tu evaluación sobre la <strong>Sala de Cómputo F3</strong> ha sido registrada exitosamente en la hoja 
            de cálculo en la pestaña <strong className="text-slate-900">&quot;{TARGET_SHEET_NAME}&quot;</strong> del Centro Agropecuario de Buga.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#39A900] hover:bg-[#2d8500] text-white text-xs font-bold py-3.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Llenar otra encuesta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
