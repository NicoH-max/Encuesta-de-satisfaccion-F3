import React, { useState } from 'react';
import { 
  SURVEY_QUESTIONS, 
  RATING_LABELS, 
  SurveyFormData 
} from '../types/survey.ts';
import { 
  CheckCircle2, 
  Send, 
  User as UserIcon, 
  GraduationCap, 
  Sparkles, 
  FileSpreadsheet, 
  AlertCircle, 
  Check, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';

interface SurveyFormProps {
  onSubmitToSheet: (data: SurveyFormData) => Promise<void>;
  isSubmitting: boolean;
  hasSpreadsheet: boolean;
  spreadsheetTitle: string;
  onGoToConfig: () => void;
  isSignedIn: boolean;
  onSignIn: () => void;
}

export const SurveyForm: React.FC<SurveyFormProps> = ({
  onSubmitToSheet,
  isSubmitting,
  hasSpreadsheet,
  spreadsheetTitle,
  onGoToConfig,
  isSignedIn,
  onSignIn,
}) => {
  const [formData, setFormData] = useState<SurveyFormData>({
    nombre: '',
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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

  const validateForm = (): boolean => {
    if (!formData.esAnonimo && !formData.nombre.trim()) {
      setValidationError('Por favor ingresa tu nombre o marca la casilla de encuesta anónima.');
      window.scrollTo({ top: 150, behavior: 'smooth' });
      return false;
    }

    if (answeredCount < 10) {
      setValidationError(`Has respondido ${answeredCount} de 10 preguntas. Por favor califica todos los aspectos para continuar.`);
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (!isSignedIn) {
      setValidationError('Debes iniciar sesión con Google para enviar las respuestas directamente a la hoja de cálculo.');
      return;
    }

    if (!hasSpreadsheet) {
      setValidationError('No has vinculado una hoja de cálculo con la pestaña "Encuesta IA". Por favor configúrala primero.');
      return;
    }

    // Show confirmation dialog before modifying user Google Sheets data
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    await onSubmitToSheet(formData);
    // Reset form
    setFormData({
      nombre: '',
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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full pointer-events-none -z-0"></div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Centro Agropecuario de Buga • Sala F3</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Encuesta de Satisfacción de la Sala de Cómputo F3
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Estimado aprendiz, instructor o usuario: tu opinión es fundamental para mejorar la infraestructura
            tecnológica, el servicio y las condiciones de aprendizaje en la <strong>Sala de Computación F3</strong>.
            Esta encuesta consta de <strong>10 preguntas breves</strong> y toma menos de 2 minutos.
          </p>

          {/* Destination sheet indicator */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>
                Destino: Hoja <strong className="text-slate-800">Encuesta IA</strong>
                {hasSpreadsheet ? (
                  <span className="ml-1 text-emerald-700 font-medium">({spreadsheetTitle})</span>
                ) : (
                  <span className="ml-1 text-amber-600 font-medium">(Sin vincular aún)</span>
                )}
              </span>
            </div>
            {!hasSpreadsheet && (
              <button
                type="button"
                onClick={onGoToConfig}
                className="text-xs text-[#39A900] hover:text-[#2d8500] font-semibold underline underline-offset-2"
              >
                Vincular hoja de cálculo aquí →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Progress Bar */}
      <div className="bg-white/90 backdrop-blur-md rounded-xl border border-slate-200 p-3 shadow-xs sticky top-28 z-30 flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
            <span>Progreso de la encuesta</span>
            <span className="text-emerald-700 font-bold">{answeredCount} de 10 preguntas ({progressPercentage}%)</span>
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
            <span>Completo</span>
          </span>
        )}
      </div>

      <form onSubmit={handlePreSubmit} className="space-y-6">
        {/* Section 1: Respondent info */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <UserIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-800">1. Datos del Usuario</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  Prefiero enviar esta encuesta de forma <strong>anónima</strong>
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

        {/* Section 2: The 10 Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">
              2. Preguntas de Satisfacción (1 al 5)
            </h3>
            <span className="text-xs text-slate-500">1: Muy Malo ➔ 5: Excelente</span>
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
                    ? 'border-emerald-200 ring-1 ring-emerald-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span>{q.title}</span>
                      {isAnswered && (
                        <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Check className="w-3 h-3 mr-0.5" />
                          Calificado ({currentRating}/5)
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 leading-normal">{q.description}</p>
                  </div>
                </div>

                {/* Likert Scale 1 to 5 Buttons */}
                <div className="grid grid-cols-5 gap-2 mt-4">
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

        {/* Section 3: Comments & Suggestions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
          <h3 className="text-base font-bold text-slate-800">
            3. Comentarios y Oportunidades de Mejora
          </h3>
          <p className="text-xs text-slate-500">
            ¿Tienes alguna observación específica sobre la Sala F3, equipos dañados, software faltante o felicitación?
          </p>
          <textarea
            rows={3}
            placeholder="Escribe aquí tus sugerencias para el Centro Agropecuario de Buga..."
            value={formData.comentarios}
            onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#39A900] transition-all resize-none"
          ></textarea>
        </div>

        {/* Validation Errors */}
        {validationError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Verifica los datos antes de continuar:</p>
              <p>{validationError}</p>
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span className="font-medium text-slate-700 block sm:inline">
              Sala de Computación F3 • Buga
            </span>
            <span className="hidden sm:inline"> — </span>
            <span>Los datos se registrarán en la hoja &quot;Encuesta IA&quot;.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {!isSignedIn ? (
              <button
                type="button"
                onClick={onSignIn}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#00324D] hover:bg-[#002235] text-white text-xs font-bold px-6 py-3 rounded-xl transition-all shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Conectar Google para Enviar</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#39A900] hover:bg-[#2d8500] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold px-7 py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando en Google Sheets...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Respuestas a Google Sheets</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Explicit User Confirmation Modal before mutating Google Sheets (Mandatory Workspace pattern) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#39A900] flex items-center justify-center">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                ¿Confirmas el envío de tus respuestas?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Se agregará una nueva fila con tus 10 calificaciones y comentarios en la pestaña{' '}
                <strong className="text-slate-900">&quot;Encuesta IA&quot;</strong> de tu hoja de cálculo:
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-700">
                <span className="font-semibold">Documento:</span>
                <span className="truncate max-w-[200px] text-slate-900 font-medium">
                  {spreadsheetTitle}
                </span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-semibold">Pestaña:</span>
                <span className="text-emerald-800 font-bold">Encuesta IA</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-semibold">Usuario:</span>
                <span>{formData.esAnonimo ? 'Anónimo' : formData.nombre}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span className="font-semibold">Rol:</span>
                <span>{formData.rol}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="inline-flex items-center gap-2 bg-[#39A900] hover:bg-[#2d8500] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar y Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
