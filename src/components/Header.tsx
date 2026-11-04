import React from 'react';
import { User } from 'firebase/auth';
import { 
  Building2, 
  FileSpreadsheet, 
  BarChart3, 
  FileCode, 
  ClipboardCheck, 
  LogOut, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  activeTab: 'survey' | 'dashboard' | 'config' | 'code';
  setActiveTab: (tab: 'survey' | 'dashboard' | 'config' | 'code') => void;
  hasSpreadsheet: boolean;
  spreadsheetTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogin,
  onLogout,
  activeTab,
  setActiveTab,
  hasSpreadsheet,
  spreadsheetTitle,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top institutional strip */}
      <div className="bg-[#00324D] text-white text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="bg-[#39A900] text-white px-2 py-0.5 rounded font-bold text-[11px] tracking-wider uppercase">
              SENA
            </span>
            <span>Centro Agropecuario de Buga • Regional Valle</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline text-emerald-300 font-semibold">Sala de Cómputo F3</span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {hasSpreadsheet ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hoja &quot;Encuesta IA&quot; conectada</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Google Sheet pendiente de vincular</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#39A900] to-[#2d8500] flex items-center justify-center text-white shadow-sm shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                Encuesta de Satisfacción Sala F3
              </h1>
              <span className="hidden md:inline-block text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                10 Preguntas
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Evaluación de calidad de servicio, equipos y ambiente — Centro Agropecuario de Buga
            </p>
          </div>
        </div>

        {/* User Auth Info & Login button */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {user ? (
            <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-lg text-xs">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Usuario'}
                  className="w-7 h-7 rounded-full border border-slate-300"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#39A900] text-white flex items-center justify-center font-bold text-xs">
                  {user.displayName?.[0] || user.email?.[0] || 'U'}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="font-semibold text-slate-800 truncate max-w-[140px]">
                  {user.displayName || 'Usuario'}
                </p>
                <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold py-2 px-3.5 rounded-lg shadow-xs transition-all hover:border-slate-400"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              <span>Conectar con Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex overflow-x-auto space-x-1 border-t border-slate-100">
        <button
          onClick={() => setActiveTab('survey')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'survey'
              ? 'border-[#39A900] text-[#00324D] bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ClipboardCheck className="w-4 h-4 text-[#39A900]" />
          <span>Formulario de Encuesta</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'config'
              ? 'border-[#39A900] text-[#00324D] bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Vincular Google Sheet</span>
          {hasSpreadsheet && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'border-[#39A900] text-[#00324D] bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span>Resultados y Estadísticas</span>
        </button>

        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'code'
              ? 'border-[#39A900] text-[#00324D] bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <FileCode className="w-4 h-4 text-purple-600" />
          <span>Código HTML &amp; Apps Script</span>
          <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-normal">
            Exportar
          </span>
        </button>
      </div>
    </header>
  );
};
