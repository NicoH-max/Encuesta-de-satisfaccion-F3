import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  RefreshCw, 
  ExternalLink, 
  Download, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Star 
} from 'lucide-react';
import { 
  fetchSurveyResponses, 
  TARGET_SHEET_NAME 
} from '../services/sheetsService.ts';
import { 
  SURVEY_QUESTIONS, 
  SurveyResponseRecord 
} from '../types/survey.ts';

interface ResponsesDashboardProps {
  spreadsheetId: string;
  spreadsheetTitle: string;
  hasSpreadsheet: boolean;
  isSignedIn: boolean;
  onGoToConfig: () => void;
}

export const ResponsesDashboard: React.FC<ResponsesDashboardProps> = ({
  spreadsheetId,
  spreadsheetTitle,
  hasSpreadsheet,
  isSignedIn,
  onGoToConfig,
}) => {
  const [responses, setResponses] = useState<SurveyResponseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!spreadsheetId || !isSignedIn) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSurveyResponses(spreadsheetId);
      setResponses(data);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar las respuestas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (spreadsheetId && isSignedIn) {
      loadData();
    }
  }, [spreadsheetId, isSignedIn]);

  // Calculate stats
  const totalCount = responses.length;

  const averagesPerQuestion = SURVEY_QUESTIONS.map((_, qIdx) => {
    const validRatings = responses
      .map((r) => r.ratings[qIdx])
      .filter((v) => typeof v === 'number' && v > 0);
    if (!validRatings.length) return 0;
    const sum = validRatings.reduce((acc, curr) => acc + curr, 0);
    return Number((sum / validRatings.length).toFixed(1));
  });

  const overallAvg =
    totalCount > 0
      ? Number(
          (
            averagesPerQuestion.reduce((acc, curr) => acc + curr, 0) /
            averagesPerQuestion.length
          ).toFixed(1)
        )
      : 0;

  // Best and worst rated questions
  let bestIdx = 0;
  let worstIdx = 0;
  if (totalCount > 0) {
    averagesPerQuestion.forEach((avg, idx) => {
      if (avg > averagesPerQuestion[bestIdx]) bestIdx = idx;
      if (avg < averagesPerQuestion[worstIdx]) worstIdx = idx;
    });
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (!responses.length) return;
    const headers = [
      'Marca Temporal',
      'Nombre',
      'Rol',
      'Programa / Ficha',
      ...SURVEY_QUESTIONS.map((q) => q.title),
      'Comentarios',
    ];

    const rows = responses.map((r) => [
      `"${r.timestamp}"`,
      `"${r.nombre.replace(/"/g, '""')}"`,
      `"${r.rol}"`,
      `"${r.programaFicha.replace(/"/g, '""')}"`,
      ...r.ratings,
      `"${r.comentarios.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Encuesta_Sala_F3_Buga_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isSignedIn) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Inicia sesión con Google</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Para consultar en tiempo real las respuestas almacenadas en la hoja &quot;{TARGET_SHEET_NAME}&quot;, conecta tu cuenta de Google.
        </p>
        <button
          onClick={onGoToConfig}
          className="bg-[#00324D] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#002235] transition-colors"
        >
          Ir a configuración de conexión
        </button>
      </div>
    );
  }

  if (!hasSpreadsheet) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl mx-auto flex items-center justify-center">
          <BarChart3 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">No hay una hoja vinculada todavía</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Vincula una hoja de cálculo con la pestaña &quot;{TARGET_SHEET_NAME}&quot; para ver las métricas y respuestas en directo.
        </p>
        <button
          onClick={onGoToConfig}
          className="bg-[#39A900] text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-[#2d8500] transition-colors"
        >
          Configurar hoja de Google Sheets
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Pestaña en vivo
            </span>
            <code className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {TARGET_SHEET_NAME}
            </code>
          </div>
          <h2 className="text-lg font-bold text-slate-900">{spreadsheetTitle}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          {responses.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar CSV</span>
            </button>
          )}

          <a
            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#39A900] hover:bg-[#2d8500] text-white rounded-xl shadow-xs transition-colors"
          >
            <span>Ver en Sheets</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total responses */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Respuestas</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">{totalCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Registradas en &quot;{TARGET_SHEET_NAME}&quot;</p>
        </div>

        {/* Global satisfaction average */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Promedio General</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900">{overallAvg.toFixed(1)}</p>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[11px] text-emerald-700 font-semibold">
              {overallAvg >= 4 ? 'Satisfactorio (Nivel óptimo)' : overallAvg >= 3 ? 'Aceptable' : 'Requiere atención'}
            </span>
          </div>
        </div>

        {/* Highest and lowest highlight */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Punto Fuerte y Mejora</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          {totalCount > 0 ? (
            <div className="text-xs space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-emerald-700 font-semibold truncate max-w-[170px]">
                  ▲ {SURVEY_QUESTIONS[bestIdx].title.split('.')[1] || SURVEY_QUESTIONS[bestIdx].title}
                </span>
                <span className="font-bold text-slate-800">{averagesPerQuestion[bestIdx]}/5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-700 font-semibold truncate max-w-[170px]">
                  ▼ {SURVEY_QUESTIONS[worstIdx].title.split('.')[1] || SURVEY_QUESTIONS[worstIdx].title}
                </span>
                <span className="font-bold text-slate-800">{averagesPerQuestion[worstIdx]}/5</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 pt-2">Aún no hay calificaciones registradas.</p>
          )}
        </div>
      </div>

      {/* Questions breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">
          Promedios por Pregunta en la Sala F3 (Escala 1 al 5)
        </h3>

        <div className="space-y-3">
          {SURVEY_QUESTIONS.map((q, idx) => {
            const avg = averagesPerQuestion[idx];
            const pct = (avg / 5) * 100;
            return (
              <div key={q.id} className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="truncate pr-2">{q.title}</span>
                  <span className="font-bold shrink-0 text-slate-900">
                    {totalCount > 0 ? `${avg} / 5.0` : '—'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      avg >= 4
                        ? 'bg-[#39A900]'
                        : avg >= 3
                        ? 'bg-amber-500'
                        : avg > 0
                        ? 'bg-red-500'
                        : 'bg-slate-300'
                    }`}
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent submissions table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">
            Últimas Respuestas Registradas ({responses.length})
          </h3>
        </div>

        {responses.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No hay respuestas registradas todavía en la hoja &quot;{TARGET_SHEET_NAME}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Fecha y Hora</th>
                  <th className="py-2.5 px-3">Usuario</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3">Ficha / Programa</th>
                  <th className="py-2.5 px-3 text-center">Promedio</th>
                  <th className="py-2.5 px-3">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {responses
                  .slice()
                  .reverse()
                  .map((r, i) => {
                    const rowAvg = (
                      r.ratings.reduce((a, b) => a + b, 0) / (r.ratings.length || 1)
                    ).toFixed(1);
                    return (
                      <tr key={i} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {r.timestamp}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{r.nombre}</td>
                        <td className="py-2.5 px-3">{r.rol}</td>
                        <td className="py-2.5 px-3 text-slate-500">{r.programaFicha || '—'}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ★ {rowAvg}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={r.comentarios}>
                          {r.comentarios || '—'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
