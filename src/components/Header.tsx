import React from 'react';
import { Building2, LogOut, CheckCircle2 } from 'lucide-react';
import { ConnectedUser } from '../services/firebaseAuth.ts';

interface HeaderProps {
  connectedUser: ConnectedUser | null;
  onConnectGoogle: () => void;
  onDisconnectGoogle: () => void;
  isConnecting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connectedUser,
  onConnectGoogle,
  onDisconnectGoogle,
  isConnecting,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Institutional Top Strip */}
      <div className="bg-[#00324D] text-white text-xs py-2 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-[#39A900] text-white px-2 py-0.5 rounded font-bold text-[11px] tracking-wider uppercase">
              SENA
            </span>
            <span>Centro Agropecuario de Buga • Regional Valle</span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span className="hidden sm:inline text-emerald-300 font-semibold">Sala de Cómputo F3</span>
          </div>

          <div className="text-[11px] text-slate-300">
            Formulario Oficial de Evaluación
          </div>
        </div>
      </div>

      {/* Main Header with Branding & Google Account Link */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title & Logo */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#39A900] to-[#2d8500] flex items-center justify-center text-white shadow-sm shrink-0">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                Encuesta de Satisfacción Sala F3
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Centro Agropecuario de Buga — Evaluación de infraestructura, conectividad y servicio
            </p>
          </div>
        </div>

        {/* Google Email Connection */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          {connectedUser ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded-xl text-xs">
              {connectedUser.photoURL ? (
                <img
                  src={connectedUser.photoURL}
                  alt={connectedUser.name || 'Usuario'}
                  className="w-6 h-6 rounded-full border border-emerald-300"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#39A900] text-white flex items-center justify-center font-bold text-[11px]">
                  {connectedUser.email[0]?.toUpperCase() || 'G'}
                </div>
              )}
              <div className="text-left">
                <div className="flex items-center gap-1 font-bold text-emerald-950 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate max-w-[140px]">{connectedUser.email}</span>
                </div>
              </div>
              <button
                onClick={onDisconnectGoogle}
                title="Cambiar o desvincular correo"
                className="p-1 text-slate-400 hover:text-red-600 hover:bg-emerald-100/60 rounded-md transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onConnectGoogle}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold py-2 px-3 rounded-xl shadow-2xs transition-all hover:border-slate-400 cursor-pointer disabled:bg-slate-100"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isConnecting ? 'Conectando...' : 'Vincular correo'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
