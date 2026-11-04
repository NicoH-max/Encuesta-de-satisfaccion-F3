export interface SurveyQuestion {
  id: number;
  title: string;
  category: 'infraestructura' | 'equipos' | 'conectividad' | 'ambiente' | 'atencion' | 'general';
  description: string;
}

export interface SurveyFormData {
  email: string;
  nombre: string;
  esAnonimo: boolean;
  rol: 'Aprendiz' | 'Instructor' | 'Administrativo' | 'Egresado / Visitante';
  frecuenciaUso: 'Diariamente' | 'Varias veces por semana' | 'Una vez por semana' | 'Ocasionalmente';
  programaFicha: string;
  // 10 satisfaction questions (1 = Muy Malo, 2 = Malo, 3 = Regular, 4 = Bueno, 5 = Excelente)
  q1_estadoGeneral: number;
  q2_limpieza: number;
  q3_iluminacionVentilacion: number;
  q4_mobiliario: number;
  q5_equipos: number;
  q6_conectividad: number;
  q7_seguridad: number;
  q8_atencionApoyo: number;
  q9_disponibilidad: number;
  q10_general: number;
  aspectosMejorar: string;
  comentarios: string;
}

export interface SurveyResponseRecord {
  timestamp: string;
  email: string;
  nombre: string;
  rol: string;
  frecuenciaUso: string;
  programaFicha: string;
  ratings: number[]; // 10 ratings
  aspectosMejorar: string;
  comentarios: string;
  syncedToGoogle?: boolean;
}

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 1,
    title: '1. ¿Qué tan satisfecho(a) está con el estado general del Ambiente F3?',
    category: 'infraestructura',
    description: 'Condición física integral de la sala de computación del Centro Agropecuario de Buga.',
  },
  {
    id: 2,
    title: '2. ¿Qué tan satisfecho(a) está con la limpieza y el orden?',
    category: 'ambiente',
    description: 'Aseo de pisos, escritorios, pantallas, canecas y organización de cables.',
  },
  {
    id: 3,
    title: '3. ¿Qué tan satisfecho(a) está con la iluminación y la ventilación / climatización?',
    category: 'ambiente',
    description: 'Luz adecuada sin reflejos molestos y temperatura agradable para la formación.',
  },
  {
    id: 4,
    title: '4. ¿Qué tan satisfecho(a) está con el mobiliario y la comodidad?',
    category: 'infraestructura',
    description: 'Ergonomía de las sillas, espacio de los escritorios y distribución.',
  },
  {
    id: 5,
    title: '5. ¿Qué tan satisfecho(a) está con la disponibilidad y el estado de los equipos de cómputo?',
    category: 'equipos',
    description: 'Funcionamiento del hardware, teclado, mouse, monitor y rapidez al iniciar.',
  },
  {
    id: 6,
    title: '6. ¿Qué tan satisfecho(a) está con la conectividad y recursos tecnológicos?',
    category: 'conectividad',
    description: 'Velocidad y estabilidad de la conexión a Internet y software requerido.',
  },
  {
    id: 7,
    title: '7. ¿Qué tan satisfecho(a) está con la seguridad y condiciones de uso?',
    category: 'infraestructura',
    description: 'Protección de pertenencias, instalaciones eléctricas seguras y señalización.',
  },
  {
    id: 8,
    title: '8. ¿Qué tan satisfecho(a) está con la atención y el apoyo recibido para utilizar el ambiente?',
    category: 'atencion',
    description: 'Amabilidad, disponibilidad y resolución de dudas por parte del personal o monitor.',
  },
  {
    id: 9,
    title: '9. ¿Qué tan satisfecho(a) está con la disponibilidad del ambiente cuando lo necesita?',
    category: 'general',
    description: 'Facilidad de acceso y horarios disponibles para tus clases o prácticas.',
  },
  {
    id: 10,
    title: '10. En general, ¿qué tan satisfecho(a) está con el Ambiente F3?',
    category: 'general',
    description: 'Calificación global de tu experiencia en la sala de computación F3.',
  },
];

export const RATING_LABELS: Record<number, { label: string; color: string; bg: string; icon: string }> = {
  1: { label: 'Muy Malo', color: 'text-red-600', bg: 'bg-red-50 border-red-300 hover:bg-red-100', icon: '😡' },
  2: { label: 'Malo', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-300 hover:bg-amber-100', icon: '🙁' },
  3: { label: 'Regular', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100', icon: '😐' },
  4: { label: 'Bueno', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100', icon: '🙂' },
  5: { label: 'Excelente', color: 'text-green-600', bg: 'bg-green-50 border-green-300 hover:bg-green-100', icon: '😄' },
};
