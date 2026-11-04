import React from 'react';
import { CheckCircle2, Plus, Sparkles } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  userEmail,
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
            ¡Muchas gracias por tu evaluación!
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Tu opinión sobre la <strong>Sala de Cómputo F3</strong> ha sido registrada exitosamente.
            Agradecemos tu tiempo para ayudarnos a mejorar los servicios tecnológicos del Centro Agropecuario de Buga.
          </p>
          {userEmail && (
            <p className="text-[11px] text-slate-400 pt-1">
              Registrado con correo: <span className="font-semibold text-slate-600">{userEmail}</span>
            </p>
          )}
        </div>

        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#39A900] hover:bg-[#2d8500] text-white text-xs font-bold py-3.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Llenar otra respuesta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
