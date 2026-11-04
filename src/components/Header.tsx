import React from 'react';
import { Building2, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  isConfigured: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings,
  isConfigured,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Institutional Top Strip */}
      <div className="bg-[#00324D] text-white text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-[#39A900] text-white px-2 py-0.5 rounded font-bold text-[11px] tracking-wider uppercase">
              SENA
            </span>
            <span>Centro Agropecuario de Buga • Regional Valle</span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-emerald-300 font-semibold">Sala de Cómputo F3</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-emerald-200 hidden md:inline">
              Hoja destino: <strong>Encuesta IA</strong>
            </span>
            <button
              onClick={onOpenSettings}
              title="Configuración de Destino (Solo Administrador)"
              className="text-slate-300 hover:text-white p-1 rounded hover:bg-white/10 transition-colors flex items-center gap-1 text-[11px]"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Configuración</span>
              {!isConfigured && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Header Branding */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#39A900] to-[#2d8500] flex items-center justify-center text-white shadow-sm shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                Encuesta de Satisfacción Sala F3
              </h1>
              <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full hidden sm:inline-block">
                10 Preguntas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Centro Agropecuario de Buga — Evaluación de infraestructura, conectividad y servicio
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
