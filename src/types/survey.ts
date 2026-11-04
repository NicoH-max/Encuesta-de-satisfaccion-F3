export interface SurveyQuestion {
  id: number;
  title: string;
  category: 'equipos' | 'conectividad' | 'infraestructura' | 'ambiente' | 'atencion' | 'general';
  description: string;
}

export interface SurveyFormData {
  nombre: string;
  esAnonimo: boolean;
  rol: 'Aprendiz' | 'Instructor' | 'Administrativo' | 'Egresado / Visitante';
  programaFicha: string;
  // 10 satisfaction questions (1 = Muy malo, 2 = Malo, 3 = Regular, 4 = Bueno, 5 = Excelente)
  q1_equipos: number;
  q2_internet: number;
  q3_software: number;
  q4_clima: number;
  q5_iluminacion: number;
  q6_mobiliario: number;
  q7_limpieza: number;
  q8_ruido: number;
  q9_soporte: number;
  q10_general: number;
  comentarios: string;
}

export interface SurveyResponseRecord {
  timestamp: string;
  nombre: string;
  rol: string;
  programaFicha: string;
  ratings: number[]; // 10 ratings
  comentarios: string;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 1,
    title: '1. Estado y funcionamiento de los equipos de cómputo',
    category: 'equipos',
    description: 'Rendimiento general de las computadoras, periféricos (teclado, mouse, monitor) y rapidez al iniciar.',
  },
  {
    id: 2,
    title: '2. Velocidad y estabilidad de la conexión a Internet',
    category: 'conectividad',
    description: 'Fluidez al navegar, descargar archivos de formación y acceder a plataformas educativas.',
  },
  {
    id: 3,
    title: '3. Disponibilidad y actualización de software necesario',
    category: 'equipos',
    description: 'Programas ofimáticos, navegadores y software especializado requeridos para tu formación instalados y funcionales.',
  },
  {
    id: 4,
    title: '4. Climatización, ventilación y temperatura de la sala F3',
    category: 'infraestructura',
    description: 'Confort térmico durante las sesiones de clase o prácticas en el ambiente F3.',
  },
  {
    id: 5,
    title: '5. Iluminación y visibilidad de las pantallas',
    category: 'infraestructura',
    description: 'Nivel de iluminación natural y artificial, sin reflejos molestos en los monitores.',
  },
  {
    id: 6,
    title: '6. Comodidad del mobiliario y ergonomía',
    category: 'infraestructura',
    description: 'Confort de las sillas, altura y amplitud de los escritorios y espacio para trabajar adecuadamente.',
  },
  {
    id: 7,
    title: '7. Limpieza, orden y estado físico del ambiente',
    category: 'ambiente',
    description: 'Aseo de las mesas, pisos, organización del cableado y canecas de reciclaje.',
  },
  {
    id: 8,
    title: '8. Ambiente de trabajo y control del nivel de ruido',
    category: 'ambiente',
    description: 'Tranquilidad y condiciones acústicas adecuadas para la concentración y el aprendizaje.',
  },
  {
    id: 9,
    title: '9. Atención, acompañamiento y soporte técnico',
    category: 'atencion',
    description: 'Disponibilidad, amabilidad y resolución de problemas por parte del personal encargado o monitores.',
  },
  {
    id: 10,
    title: '10. Nivel de satisfacción general con la Sala de Computación F3',
    category: 'general',
    description: 'Calificación global de tu experiencia utilizando este ambiente del Centro Agropecuario de Buga.',
  },
];

export const RATING_LABELS: Record<number, { label: string; color: string; bg: string; icon: string }> = {
  1: { label: 'Muy Malo', color: 'text-red-600', bg: 'bg-red-50 border-red-300 hover:bg-red-100', icon: '😡' },
  2: { label: 'Malo', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-300 hover:bg-amber-100', icon: '🙁' },
  3: { label: 'Regular', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100', icon: '😐' },
  4: { label: 'Bueno', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100', icon: '🙂' },
  5: { label: 'Excelente', color: 'text-green-600', bg: 'bg-green-50 border-green-300 hover:bg-green-100', icon: '😄' },
};
