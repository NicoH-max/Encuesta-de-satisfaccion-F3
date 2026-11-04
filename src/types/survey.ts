export interface SurveyQuestion {
  id: number;
  title: string;
  category: 'equipos' | 'conectividad' | 'software' | 'ambiente' | 'mobiliario' | 'atencion' | 'general';
  description: string;
}

export interface SurveyFormData {
  email: string;
  nombre: string;
  esAnonimo: boolean;
  rol: 'Aprendiz' | 'Instructor' | 'Administrativo' | 'Egresado / Visitante';
  programaFicha: string;
  // 10 satisfaction questions (1 al 5)
  q1_equipos: number;
  q2_internet: number;
  q3_software: number;
  q4_climatizacion: number;
  q5_iluminacion: number;
  q6_mobiliario: number;
  q7_limpieza: number;
  q8_ambiente: number;
  q9_atencion: number;
  q10_satisfaccion: number;
  aspectosMejorar: string;
  comentarios: string;
}

export interface SurveyResponseRecord {
  id: string;
  timestamp: string;
  email: string;
  nombre: string;
  rol: string;
  programaFicha: string;
  ratings: number[]; // 10 ratings
  aspectosMejorar: string;
  comentarios: string;
  syncedToGoogle?: boolean;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 1,
    title: '1. Estado y funcionamiento de los equipos de cómputo',
    category: 'equipos',
    description: 'Hardware, teclado, mouse, monitor y velocidad al iniciar y trabajar en el Ambiente F3.',
  },
  {
    id: 2,
    title: '2. Conectividad y velocidad de la conexión a Internet',
    category: 'conectividad',
    description: 'Estabilidad de la red, velocidad de navegación y acceso a plataformas educativas.',
  },
  {
    id: 3,
    title: '3. Software y programas requeridos para la formación',
    category: 'software',
    description: 'Disponibilidad de herramientas, sistemas operativos y software técnico actualizado.',
  },
  {
    id: 4,
    title: '4. Climatización, temperatura y ventilación',
    category: 'ambiente',
    description: 'Aire acondicionado, frescura y ventilación adecuada durante la jornada en el ambiente.',
  },
  {
    id: 5,
    title: '5. Iluminación y visibilidad de las pantallas',
    category: 'ambiente',
    description: 'Luz adecuada en la sala sin reflejos molestos en los monitores.',
  },
  {
    id: 6,
    title: '6. Mobiliario, ergonomía y comodidad',
    category: 'mobiliario',
    description: 'Comodidad de las sillas, espacio en los escritorios y distribución del aula.',
  },
  {
    id: 7,
    title: '7. Limpieza, aseo y orden general',
    category: 'ambiente',
    description: 'Pisos, mesas limpias, canecas disponibles y adecuada organización de cables.',
  },
  {
    id: 8,
    title: '8. Ambiente de trabajo y nivel de ruido',
    category: 'ambiente',
    description: 'Tranquilidad y condiciones acústicas propicias para la concentración y el aprendizaje.',
  },
  {
    id: 9,
    title: '9. Atención, acompañamiento y soporte técnico',
    category: 'atencion',
    description: 'Disposición, amabilidad y rapidez en la solución de inconvenientes por parte del personal.',
  },
  {
    id: 10,
    title: '10. Nivel de satisfacción global con la Sala F3',
    category: 'general',
    description: 'Evaluación general de tu experiencia y aprovechamiento de la Sala de Cómputo F3.',
  },
];

export const RATING_LABELS: Record<number, { label: string; color: string; bg: string; icon: string }> = {
  1: { label: 'Muy Malo', color: 'text-red-600', bg: 'bg-red-50 border-red-300 hover:bg-red-100', icon: '😡' },
  2: { label: 'Malo', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-300 hover:bg-amber-100', icon: '🙁' },
  3: { label: 'Regular', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100', icon: '😐' },
  4: { label: 'Bueno', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100', icon: '🙂' },
  5: { label: 'Excelente', color: 'text-green-600', bg: 'bg-green-50 border-green-300 hover:bg-green-100', icon: '😄' },
};
