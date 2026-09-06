export interface HelpContact {
  name: string;
  phone: string;
  availability: string;
  description: string;
  category: 'suicide_prevention' | 'mental_health' | 'adolescents';
}

export const EMERGENCY_CONTACTS: HelpContact[] = [
  {
    name: "Centro de Asistencia al Suicida (CAS)",
    phone: "135 (CABA/GBA) ó (011) 5275-1135",
    availability: "Gratuita, anónima, 24 horas todos los días",
    description: "Atención especializada ante crisis emocionales graves y prevención del suicidio.",
    category: "suicide_prevention",
  },
  {
    name: "Línea Nacional de Salud Mental (Argentina)",
    phone: "0800-999-0091",
    availability: "Atención 24/7 en todo el país",
    description: "Orientación y contención profesional en salud mental dependiente del Ministerio de Salud.",
    category: "mental_health",
  },
  {
    name: "Línea 102 - Derechos de Niñas, Niños y Adolescentes",
    phone: "102",
    availability: "Gratuito y confidencial, las 24 horas",
    description: "Espacio de escucha, asesoramiento y contención para jóvenes y adolescentes.",
    category: "adolescents",
  },
  {
    name: "Asistencia Internacional en Crisis (Befrienders Worldwide / IASP)",
    phone: "befrienders.org / iasp.info",
    availability: "Recursos globales",
    description: "Red global de centros de apoyo emocional confidencial y prevención del suicidio.",
    category: "suicide_prevention",
  },
];
