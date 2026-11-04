import React, { useState } from 'react';
import { 
  FileCode, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Layers, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { TARGET_SHEET_NAME } from '../services/sheetsService.ts';

interface HtmlExporterProps {
  spreadsheetId: string;
}

export const HtmlExporter: React.FC<HtmlExporterProps> = ({ spreadsheetId }) => {
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'html' | 'script' | 'instructions'>('html');

  const appsScriptCode = `/**
 * Código para Google Apps Script (Extensiones -> Apps Script en tu Hoja de Cálculo)
 * Guarda las respuestas en la pestaña "${TARGET_SHEET_NAME}"
 */

const NOMBRE_PESTANA = "${TARGET_SHEET_NAME}";

function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(10000); // Esperar hasta 10 seg para evitar colisiones

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(NOMBRE_PESTANA);

    // Si la pestaña no existe, se crea automáticamente
    if (!sheet) {
      sheet = ss.insertSheet(NOMBRE_PESTANA);
    }

    // Encabezados si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      const headers = [
        "Marca temporal",
        "Nombre / Identificación",
        "Rol",
        "Programa / Ficha",
        "1. Estado Equipos",
        "2. Conexión Internet",
        "3. Software Instalado",
        "4. Climatización",
        "5. Iluminación",
        "6. Mobiliario",
        "7. Limpieza y Orden",
        "8. Nivel de Ruido",
        "9. Soporte Técnico",
        "10. Satisfacción Global",
        "Comentarios y Sugerencias"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#dcfce7");
      sheet.setFrozenRows(1);
    }

    // Parsear datos recibidos (acepta JSON o FormData)
    let data;
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter;
      }
    } else {
      data = e.parameter || {};
    }

    const timestamp = Utilities.formatDate(new Date(), "America/Bogota", "yyyy-MM-dd HH:mm:ss");

    const row = [
      timestamp,
      data.nombre || (data.esAnonimo ? "Anónimo" : "Sin especificar"),
      data.rol || "Aprendiz",
      data.programaFicha || "No especificado",
      data.q1_equipos || data["1"] || "",
      data.q2_internet || data["2"] || "",
      data.q3_software || data["3"] || "",
      data.q4_clima || data["4"] || "",
      data.q5_iluminacion || data["5"] || "",
      data.q6_mobiliario || data["6"] || "",
      data.q7_limpieza || data["7"] || "",
      data.q8_ruido || data["8"] || "",
      data.q9_soporte || data["9"] || "",
      data.q10_general || data["10"] || "",
      data.comentarios || ""
    ];

    sheet.appendRow(row);

    lock.releaseLock();

    return ContentService.createTextOutput(
      JSON.stringify({ result: "success", row: sheet.getLastRow() })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const standaloneHtmlCode = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Encuesta de Satisfacción Sala F3 - Centro Agropecuario de Buga</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root { --sena-green: #39A900; --sena-dark: #00324D; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen py-8 px-4">
  <div class="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
    <!-- Encabezado Institucional -->
    <div class="bg-[#00324D] text-white p-5 border-b-4 border-[#39A900]">
      <span class="inline-block bg-[#39A900] text-white text-xs px-2.5 py-0.5 rounded font-bold uppercase mb-2">
        SENA • Centro Agropecuario de Buga
      </span>
      <h1 class="text-xl sm:text-2xl font-black">Encuesta de Satisfacción Sala F3</h1>
      <p class="text-xs text-slate-300 mt-1">
        Califica de 1 (Muy Malo) a 5 (Excelente) el uso y servicio de la sala de cómputo F3.
      </p>
    </div>

    <!-- Formulario -->
    <form id="encuestaF3Form" class="p-6 space-y-6">
      <!-- Datos Usuario -->
      <div class="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wide">1. Información del Usuario</h2>
        <div>
          <label class="block text-xs font-semibold mb-1">Nombre Completo o Identificación:</label>
          <input type="text" id="nombre" class="w-full text-xs p-2.5 border rounded-lg bg-white" placeholder="Ej. Juan Pérez">
          <label class="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
            <input type="checkbox" id="anonimo" onchange="document.getElementById('nombre').disabled = this.checked;">
            Responder de forma anónima
          </label>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold mb-1">Rol en el Centro:</label>
            <select id="rol" class="w-full text-xs p-2.5 border rounded-lg bg-white">
              <option value="Aprendiz">Aprendiz</option>
              <option value="Instructor">Instructor</option>
              <option value="Administrativo">Administrativo</option>
              <option value="Egresado / Visitante">Egresado / Visitante</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold mb-1">Programa / Ficha (opcional):</label>
            <input type="text" id="programaFicha" class="w-full text-xs p-2.5 border rounded-lg bg-white" placeholder="Ej. ADSO 2712345">
          </div>
        </div>
      </div>

      <!-- 10 Preguntas de Satisfacción -->
      <div class="space-y-4">
        <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wide">2. Calificación de Aspectos (1 = Muy Malo | 5 = Excelente)</h2>

        <!-- Plantilla de pregunta -->
        <div id="preguntasContenedor" class="space-y-4">
          <!-- Las 10 preguntas se generan dinámicamente con JS -->
        </div>
      </div>

      <!-- Comentarios -->
      <div class="space-y-2">
        <label class="block text-xs font-semibold">3. Observaciones y Sugerencias de Mejora:</label>
        <textarea id="comentarios" rows="3" class="w-full text-xs p-2.5 border rounded-lg bg-slate-50" placeholder="¿Qué equipos o aspectos deberían mejorar?"></textarea>
      </div>

      <!-- Mensaje de estado -->
      <div id="statusMsg" class="hidden text-xs p-3 rounded-lg"></div>

      <!-- Botón de Envío -->
      <button type="submit" id="btnEnviar" class="w-full bg-[#39A900] hover:bg-[#2d8500] text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-sm">
        Enviar Respuestas a la Hoja "Encuesta IA"
      </button>
    </form>
  </div>

  <script>
    // URL de tu Web App desplegada en Google Apps Script
    // Reemplaza esta URL con la que obtienes al desplegar el script en tu hoja de cálculo
    const SCRIPT_URL = "PEGA_AQUI_LA_URL_DE_TU_APPS_SCRIPT";

    const preguntas = [
      { id: 1, key: "q1_equipos", label: "1. Estado y funcionamiento de los equipos de cómputo" },
      { id: 2, key: "q2_internet", label: "2. Velocidad y estabilidad de la conexión a Internet" },
      { id: 3, key: "q3_software", label: "3. Disponibilidad y actualización de software requerido" },
      { id: 4, key: "q4_clima", label: "4. Climatización, ventilación y confort térmico de la sala F3" },
      { id: 5, key: "q5_iluminacion", label: "5. Iluminación y visibilidad de las pantallas sin reflejos" },
      { id: 6, key: "q6_mobiliario", label: "6. Comodidad de sillas, escritorios y ergonomía" },
      { id: 7, key: "q7_limpieza", label: "7. Limpieza, orden y estado físico del ambiente" },
      { id: 8, key: "q8_ruido", label: "8. Ambiente propicio y control del nivel de ruido" },
      { id: 9, key: "q9_soporte", label: "9. Atención, amabilidad y soporte técnico del encargado" },
      { id: 10, key: "q10_general", label: "10. Satisfacción general con la Sala de Cómputo F3" }
    ];

    // Renderizar preguntas
    const container = document.getElementById("preguntasContenedor");
    preguntas.forEach(p => {
      const div = document.createElement("div");
      div.className = "p-3.5 bg-slate-50 rounded-xl border border-slate-200";
      div.innerHTML = \`
        <p class="text-xs font-bold text-slate-800 mb-2">\${p.label} *</p>
        <div class="grid grid-cols-5 gap-2 text-center text-xs">
          \${[1, 2, 3, 4, 5].map(v => \`
            <label class="cursor-pointer">
              <input type="radio" name="\${p.key}" value="\${v}" required class="peer sr-only">
              <div class="py-2 px-1 border border-slate-300 rounded-lg peer-checked:bg-[#39A900] peer-checked:text-white peer-checked:border-[#39A900] peer-checked:font-bold hover:bg-slate-100 transition-colors">
                <div class="font-extrabold text-sm">\${v}</div>
                <div class="text-[9px] text-slate-500 peer-checked:text-white">\${v===1?'Muy Malo':v===5?'Excelente':v===4?'Bueno':v===3?'Regular':'Malo'}</div>
              </div>
            </label>
          \`).join('')}
        </div>
      \`;
      container.appendChild(div);
    });

    // Manejar envío
    document.getElementById("encuestaF3Form").addEventListener("submit", async function(e) {
      e.preventDefault();
      const btn = document.getElementById("btnEnviar");
      const status = document.getElementById("statusMsg");

      const isAnon = document.getElementById("anonimo").checked;
      const nombre = isAnon ? "Anónimo" : document.getElementById("nombre").value.trim();
      if (!isAnon && !nombre) {
        alert("Por favor escribe tu nombre o marca anónimo.");
        return;
      }

      btn.disabled = true;
      btn.innerText = "Enviando respuestas...";
      status.className = "hidden";

      const payload = {
        nombre: nombre,
        esAnonimo: isAnon,
        rol: document.getElementById("rol").value,
        programaFicha: document.getElementById("programaFicha").value,
        comentarios: document.getElementById("comentarios").value,
      };

      preguntas.forEach(p => {
        const val = document.querySelector(\`input[name="\${p.key}"]:checked\`);
        payload[p.key] = val ? val.value : "";
      });

      try {
        await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        status.className = "block bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-lg text-xs font-semibold";
        status.innerText = "¡Muchas gracias! Tu respuesta ha sido enviada con éxito a la hoja 'Encuesta IA'.";
        document.getElementById("encuestaF3Form").reset();
      } catch (err) {
        status.className = "block bg-red-50 border border-red-300 text-red-800 p-3 rounded-lg text-xs font-semibold";
        status.innerText = "Error al enviar la respuesta: " + err.message;
      } finally {
        btn.disabled = false;
        btn.innerText = "Enviar Respuestas a la Hoja \\"Encuesta IA\\"";
      }
    });
  </script>
</body>
</html>`;

  const copyToClipboard = (text: string, type: 'html' | 'script') => {
    navigator.clipboard.writeText(text);
    if (type === 'html') {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    } else {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const downloadHtmlFile = () => {
    const blob = new Blob([standaloneHtmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formulario_satisfaccion_sala_f3_buga.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-2">
        <div className="flex items-center gap-2 text-purple-700">
          <FileCode className="w-5 h-5" />
          <h2 className="text-lg font-bold text-slate-900">
            Exportador de Código HTML y Google Apps Script
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Si además de esta aplicación web necesitas el archivo <strong>.html independiente</strong> para 
          alojarlo en una página externa, intranet del SENA o compartirlo por enlace directo con Apps Script, 
          aquí tienes el código listo para copiar y usar en 3 sencillos pasos.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveSubTab('html')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
            activeSubTab === 'html'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          1. Formulario HTML Completo
        </button>
        <button
          onClick={() => setActiveSubTab('script')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
            activeSubTab === 'script'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          2. Script de Google Sheets (Code.gs)
        </button>
        <button
          onClick={() => setActiveSubTab('instructions')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-colors ${
            activeSubTab === 'instructions'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          3. Guía Paso a Paso
        </button>
      </div>

      {/* View 1: HTML Code */}
      {activeSubTab === 'html' && (
        <div className="bg-slate-900 rounded-2xl p-4 text-slate-100 shadow-md space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium text-xs">
              <FileCode className="w-4 h-4 text-purple-400" />
              formulario_satisfaccion_sala_f3_buga.html
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadHtmlFile}
                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white font-sans text-xs px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Descargar .html</span>
              </button>
              <button
                onClick={() => copyToClipboard(standaloneHtmlCode, 'html')}
                className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white font-sans text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                {copiedHtml ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHtml ? '¡Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>
          </div>
          <pre className="overflow-x-auto max-h-96 p-2 text-slate-300 text-[11px] leading-relaxed select-all">
            {standaloneHtmlCode}
          </pre>
        </div>
      )}

      {/* View 2: Apps Script Code */}
      {activeSubTab === 'script' && (
        <div className="bg-slate-900 rounded-2xl p-4 text-slate-100 shadow-md space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5 font-sans font-medium text-xs">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Code.gs (Apps Script para hoja &quot;{TARGET_SHEET_NAME}&quot;)
            </span>
            <button
              onClick={() => copyToClipboard(appsScriptCode, 'script')}
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs px-3 py-1.5 rounded-lg transition-colors"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? '¡Copiado!' : 'Copiar Script'}</span>
            </button>
          </div>
          <pre className="overflow-x-auto max-h-96 p-2 text-emerald-300 text-[11px] leading-relaxed select-all">
            {appsScriptCode}
          </pre>
        </div>
      )}

      {/* View 3: Step-by-step instructions */}
      {activeSubTab === 'instructions' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 text-xs text-slate-700">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#39A900]" />
            Pasos para conectar el formulario HTML a tu Google Sheet
          </h3>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-[#00324D] text-xs">Paso 1: Abrir Apps Script</span>
              <p>
                Abre tu hoja de cálculo de Google. En el menú superior haz clic en{' '}
                <strong className="text-slate-900">Extensiones &gt; Apps Script</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-[#00324D] text-xs">Paso 2: Pegar el código Code.gs</span>
              <p>
                Borra el código que aparezca por defecto y pega el código de la pestaña{' '}
                <strong className="text-slate-900">2. Script de Google Sheets</strong>. Guarda con Ctrl+S o el icono de disco.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-[#00324D] text-xs">Paso 3: Implementar como Aplicación Web</span>
              <p>
                Haz clic en el botón azul <strong className="text-slate-900">Implementar &gt; Nueva implementación</strong>.
              </p>
              <ul className="list-disc list-inside text-slate-600 pl-2 space-y-0.5">
                <li>Selecciona el tipo: <strong>Aplicación web</strong> (icono de engranaje).</li>
                <li>Ejecutar como: <strong>Yo (tu correo)</strong>.</li>
                <li>Quién tiene acceso: <strong>Cualquier usuario</strong> (para que los aprendices respondan sin pedir cuenta).</li>
              </ul>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-[#00324D] text-xs">Paso 4: Copiar la URL generada</span>
              <p>
                Copia la URL de la aplicación web que te da Google y pégala en la variable{' '}
                <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold text-emerald-900">
                  SCRIPT_URL
                </code>{' '}
                dentro del archivo HTML. ¡Listo! Cada respuesta se enviará automáticamente a la pestaña{' '}
                <strong className="text-slate-900">&quot;{TARGET_SHEET_NAME}&quot;</strong>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
