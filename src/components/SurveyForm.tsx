import React, { useState, useEffect } from 'react';
import { 
  SURVEY_QUESTIONS, 
  RATING_LABELS, 
  SurveyFormData 
} from '../types/survey.ts';
import { ConnectedUser } from '../services/firebaseAuth.ts';
import { 
  CheckCircle2, 
  Send, 
  User as UserIcon, 
  GraduationCap, 
  Sparkles, 
  AlertCircle, 
  Check, 
  RefreshCw, 
  Mail 
} from 'lucide-react';

interface SurveyFormProps {
  onSubmit: (data: SurveyFormData, email: string) => Promise<void>;
  isSubmitting: boolean;
  connectedUser: ConnectedUser | null;
  onConnectGoogle: () => void;
  isConnecting: boolean;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({
  onSubmit,
  isSubmitting,
  connectedUser,
  onConnectGoogle,
  isConnecting,
}) => {
  const [emailInput, setEmailInput] = useState(connectedUser?.email || '');
  const [formData, setFormData] = useState<SurveyFormData>({
    nombre: connectedUser?.name || '',
    esAnonimo: false,
    rol: 'Aprendiz',
    programaFicha: '',
    q1_equipos: 0,
    q2_internet: 0,
    q3_software: 0,
    q4_clima: 0,
    q5_iluminacion: 0,
    q6_mobiliario: 0,
    q7_limpieza: 0,
    q8_ruido: 0,
    q9_soporte: 0,
    q10_general: 0,
    comentarios: '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Sync if connectedUser changes
  useEffect(() => {
    if (connectedUser?.email) {
      setEmailInput(connectedUser.email);
      if (connectedUser.name && !formData.nombre) {
        setFormData((prev) => ({ ...prev, nombre: connectedUser.name || '' }));
      }
    }
  }, [connectedUser]);

  const answeredCount = [
    formData.q1_equipos,
    formData.q2_internet,
    formData.q3_software,
    formData.q4_clima,
    formData.q5_iluminacion,
    formData.q6_mobiliario,
    formData.q7_limpieza,
    formData.q8_ruido,
    formData.q9_soporte,
    formData.q10_general,
  ].filter((v) => v > 0).length;

  const progressPercentage = Math.round((answeredCount / 10) * 100);

  const handleRatingChange = (key: keyof SurveyFormData, rating: number) => {
    setFormData((prev) => ({
      ...prev,
      [key]: rating,
    }));
    if (validationError) setValidationError(null);
  };

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.esAnonimo && !formData.nombre.trim()) {
      setValidationError('Por favor escribe tu nombre completo o marca la opción "Responder de forma anónima".');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    if (answeredCount < 10) {
      setValidationError(`Has respondido ${answeredCount} de 10 preguntas. Por favor califica todas las preguntas para enviar.`);
      return;
    }

    setValidationError(null);
    await onSubmit(formData, emailInput.trim());

    // Reset form after submission
    setFormData({
      nombre: connectedUser?.name || '',
      esAnonimo: false,
      rol: 'Aprendiz',
      programaFicha: '',
      q1_equipos: 0,
      q2_internet: 0,
      q3_software: 0,
      q4_clima: 0,
      q5_iluminacion: 0,
      q6_mobiliario: 0,
      q7_limpieza: 0,
      q8_ruido: 0,
      q9_soporte: 0,
      q10_general: 0,
      comentarios: '',
    });
  };

  const getQuestionKey = (index: number): keyof SurveyFormData => {
    const keys: (keyof SurveyFormData)[] = [
      'q1_equipos',
      'q2_internet',
      'q3_software',
      'q4_clima',
      'q5_iluminacion',
      'q6_mobiliario',
      'q7_limpieza',
      'q8_ruido',
      'q9_soporte',
      'q10_general',
    ];
    return keys[index];
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Intro hero banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Centro Agropecuario de Buga • Sala F3</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Encuesta de Satisfacción de la Sala de Computación F3
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Tu opinión es fundamental para el mejoramiento continuo de los equipos, el software,
            el servicio de internet y la comodidad en la <strong>Sala F3</strong>. Por favor califica cada uno
            de los siguientes 10 aspectos en una escala del 1 (Muy Malo) al 5 (Excelente).
          </p>
        </div>
      </div>

      {/* Sticky Progress Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 p-3.5 shadow-xs sticky top-20 z-30 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>Progreso de calificación</span>
            <span className="text-emerald-700 font-bold">
              {answeredCount} de 10 aspectos ({progressPercentage}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#39A900] to-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        {answeredCount === 10 && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-[#39A900]" />
            <span>Listo para enviar</span>
          </span>
        )}
      </div>

      <form onSubmit={validateAndSubmit} className="space-y-6">
        {/* Section 1: User info & Email */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <UserIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-800">1. Datos del Usuario</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email field with Google connect button */}
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Correo Electrónico
                </label>
                {!connectedUser && (
                  <button
                    type="button"
                    onClick={onConnectGoogle}
                    disabled={isConnecting}
                    className="text-xs text-[#00324D] hover:text-emerald-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#39A900]" />
                    <span>{isConnecting ? 'Conectando...' : 'Autocompletar con Google'}</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="email"
                  placeholder="ejemplo@misena.edu.co o tu correo personal"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39A900] transition-all"
                />
                {connectedUser && (
                  <span className="absolute right-3 top-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                    Google Vinculado
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Puedes ingresar tu correo manualmente o vincular tu cuenta de Google.
              </p>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Nombre Completo o Identificación
              </label>
              <input
                type="text"
                disabled={formData.esAnonimo}
                placeholder={formData.esAnonimo ? 'Respuesta anónima' : 'Ej. Juan Camilo Pérez'}
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39A900] disabled:bg-slate-100 disabled:text-slate-400 transition-all"
              />
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.esAnonimo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      esAnonimo: e.target.checked,
                      nombre: e.target.checked ? '' : formData.nombre,
                    })
                  }
                  className="rounded text-[#39A900] focus:ring-[#39A900] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-slate-600 select-none">
                  Prefiero responder de forma <strong>anónima</strong>
                </span>
              </label>
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Rol en el Centro Agropecuario
              </label>
              <select
                value={formData.rol}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rol: e.target.value as SurveyFormData['rol'],
                  })
                }
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39A900] transition-all cursor-pointer"
              >
                <option value="Aprendiz">Aprendiz SENA</option>
                <option value="Instructor">Instructor / Docente</option>
                <option value="Administrativo">Personal Administrativo</option>
                <option value="Egresado / Visitante">Egresado / Visitante externo</option>
              </select>
            </div>

            {/* Program / Ficha */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Programa de Formación / Número de Ficha (opcional)
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ej. Análisis y Desarrollo de Software - Ficha 2712345"
                  value={formData.programaFicha}
                  onChange={(e) => setFormData({ ...formData, programaFicha: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39A900] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: 10 Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              2. Preguntas de Satisfacción (1 al 5)
            </h3>
            <span className="text-xs text-slate-500 font-medium">1: Muy Malo ➔ 5: Excelente</span>
          </div>

          {SURVEY_QUESTIONS.map((q, idx) => {
            const key = getQuestionKey(idx);
            const currentRating = formData[key] as number;
            const isAnswered = currentRating > 0;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs ${
                  isAnswered
                    ? 'border-emerald-300 ring-1 ring-emerald-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1 mb-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center justify-between gap-2">
                    <span>{q.title}</span>
                    {isAnswered && (
                      <span className="inline-flex items-center text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        <Check className="w-3 h-3 mr-0.5 text-emerald-600" />
                        {currentRating}/5
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 leading-normal">{q.description}</p>
                </div>

                {/* 1 to 5 Buttons */}
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {[1, 2, 3, 4, 5].map((val) => {
                    const isSelected = currentRating === val;
                    const meta = RATING_LABELS[val];
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleRatingChange(key, val)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#39A900] text-white border-[#2e8800] ring-2 ring-emerald-300 shadow-xs scale-[1.02]'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="text-lg sm:text-xl mb-1">{meta.icon}</span>
                        <span className="font-extrabold text-sm sm:text-base leading-none mb-1">
                          {val}
                        </span>
                        <span
                          className={`text-[10px] leading-tight font-medium ${
                            isSelected ? 'text-white' : 'text-slate-500'
                          }`}
                        >
                          {meta.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section 3: Comments */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-800">
            3. Comentarios y Oportunidades de Mejora
          </h3>
          <p className="text-xs text-slate-500">
            ¿Tienes alguna observación sobre la Sala F3, equipos con fallas, software requerido o felicitación?
          </p>
          <textarea
            rows={3}
            placeholder="Escribe aquí tus observaciones para el Centro Agropecuario de Buga..."
            value={formData.comentarios}
            onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39A900] transition-all resize-none"
          ></textarea>
        </div>

        {/* Error notice */}
        {validationError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Atención antes de enviar:</p>
              <p>{validationError}</p>
            </div>
          </div>
        )}

        {/* Submit action */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span className="font-semibold text-slate-700">Centro Agropecuario de Buga</span>
            <span className="hidden sm:inline"> • </span>
            <span>Sala de Computación F3</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#39A900] hover:bg-[#2d8500] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold px-8 py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Enviando respuestas...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Enviar Encuesta de Satisfacción</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
