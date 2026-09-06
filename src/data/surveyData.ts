export interface SurveyOption {
  id: string;
  text: string;
  isKeyPedagogical?: boolean; // Matches the prompt's targeted ESI reflection
  initialVotes: number;
}

export interface SurveyQuestion {
  id: number;
  question: string;
  topic: string;
  accentColor: 'indigo' | 'rose' | 'teal' | 'purple' | 'amber';
  reflectionQuote: string; // The exact quote provided by user
  pedagogicalNote: string; // ESI context on seeking professional help
  options: SurveyOption[];
}

export const INITIAL_PARTICIPANTS = 0;

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 1,
    question: "¿El suicidio es para débiles o valientes?",
    topic: "Desmitificación y Crisis Emocional",
    accentColor: "indigo",
    reflectionQuote: "Es de débiles por no querer seguir luchando y de valientes por tomar aquella decisión.",
    pedagogicalNote: "En el marco de la ESI y la salud mental comunitaria, el suicidio nunca debe catalogarse en términos de 'valentía' o 'cobardía'. Quien atraviesa una crisis suicida no busca morir, sino cesar un sufrimiento psíquico intolerable. Exige escucha empática sin juzgar y asistencia profesional inmediata.",
    options: [
      {
        id: "q1_opt1",
        text: "Es de débiles por no querer seguir luchando",
        initialVotes: 0,
      },
      {
        id: "q1_opt2",
        text: "Es de valientes por tomar aquella decisión tan extrema",
        initialVotes: 0,
      },
      {
        id: "q1_opt3",
        text: "Es de débiles por rendirse y a la vez de valientes por tomar la decisión",
        isKeyPedagogical: true,
        initialVotes: 0,
      },
      {
        id: "q1_opt4",
        text: "Ni débiles ni valientes: es el síntoma de un dolor abrumador que requiere contención profesional urgente",
        initialVotes: 0,
      },
    ],
  },
  {
    id: 2,
    question: "¿Es posible salir de una depresión sin ayuda?",
    topic: "Acompañamiento Terapéutico",
    accentColor: "rose",
    reflectionQuote: "En la depresión se NECESITA una compañía.",
    pedagogicalNote: "La depresión no es una simple tristeza pasajera ni falta de 'fuerza de voluntad'. Es un trastorno de salud que altera el funcionamiento neurobiológico y emocional. La compañía afectiva y la intervención psicológica/psiquiátrica son pilares fundamentales para la recuperación.",
    options: [
      {
        id: "q2_opt1",
        text: "Sí, solo con fuerza de voluntad y proponiéndose estar bien se puede salir",
        initialVotes: 0,
      },
      {
        id: "q2_opt2",
        text: "En la depresión se NECESITA una compañía y ayuda profesional especializada",
        isKeyPedagogical: true,
        initialVotes: 0,
      },
      {
        id: "q2_opt3",
        text: "Depende de cada quien, el paso del tiempo suele resolverlo sin necesidad de médicos",
        initialVotes: 0,
      },
    ],
  },
  {
    id: 3,
    question: "¿Las personas que sienten placer después del dolor están mal?",
    topic: "Neurobiología y Conductas de Riesgo",
    accentColor: "teal",
    reflectionQuote: "Es una reacción hormonal en respuesta de endorfinas y el estado de alerta del cuerpo ante el dolor.",
    pedagogicalNote: "Sentir alivio o calma tras un estímulo doloroso responde a una liberación biológica de endorfinas y dopamina generada por el sistema nervioso. Comprender la base fisiológica permite desestigmatizar, pero si una persona recurre a autolesiones para canalizar angustia, es un pedido de auxilio que necesita abordaje psicológico.",
    options: [
      {
        id: "q3_opt1",
        text: "Sí, tienen un problema moral o están mal de la cabeza",
        initialVotes: 0,
      },
      {
        id: "q3_opt2",
        text: "Es una reacción hormonal en respuesta de endorfinas y el estado de alerta del cuerpo ante el dolor",
        isKeyPedagogical: true,
        initialVotes: 0,
      },
      {
        id: "q3_opt3",
        text: "Es una respuesta fisiológica natural, pero si genera autolesión requiere atención clínica urgente",
        initialVotes: 0,
      },
    ],
  },
  {
    id: 4,
    question: "¿ChatGPT es un buen reemplazo para un psicólogo?",
    topic: "Inteligencia Artificial vs. Terapia Humana",
    accentColor: "purple",
    reflectionQuote: "ChatGPT solo te dirá lo que quieres escuchar, buscar ayuda de una persona real es mejor que hablar con una IA.",
    pedagogicalNote: "Los modelos de lenguaje artificial están programados para complacer y predecir texto según patrones estadísticos, sin juicio clínico, sin responsabilidad legal ni empatía genuina. La psicoterapia es un vínculo terapéutico humano seguro que confronta, acompaña y diagnostica.",
    options: [
      {
        id: "q4_opt1",
        text: "Sí, porque responde al instante, no juzga y da buenos consejos siempre",
        initialVotes: 0,
      },
      {
        id: "q4_opt2",
        text: "ChatGPT solo te dirá lo que quieres escuchar; buscar ayuda de una persona real es mejor que hablar con una IA",
        isKeyPedagogical: true,
        initialVotes: 0,
      },
      {
        id: "q4_opt3",
        text: "Puede servir para desahogo temporal o redactar ideas, pero jamás como terapia profesional",
        initialVotes: 0,
      },
    ],
  },
  {
    id: 5,
    question: "No es necesario hablar de todos los problemas que te hacen mal; hay algunos que son normales de la edad",
    topic: "Validación Emocional en la Adolescencia",
    accentColor: "amber",
    reflectionQuote: "Ante cualquier problema se habla, no hay que minimizar emociones que te hacen mal.",
    pedagogicalNote: "Minimizar el malestar bajo el rótulo de 'cosas de la edad' o 'caprichos adolescentes' genera aislamiento y soledad en quienes sufren. En ESI se promueve la libre expresión afectiva: lo que duele es importante y tiene derecho a ser escuchado en un entorno seguro.",
    options: [
      {
        id: "q5_opt1",
        text: "Totalmente de acuerdo, en la adolescencia casi todo pasa y es mejor no exagerar ni quejarse",
        initialVotes: 0,
      },
      {
        id: "q5_opt2",
        text: "Ante cualquier problema se habla; no hay que minimizar emociones que te hacen mal",
        isKeyPedagogical: true,
        initialVotes: 0,
      },
      {
        id: "q5_opt3",
        text: "Solo vale la pena hablar si es un problema extremo o que involucra peligro inmediato",
        initialVotes: 0,
      },
    ],
  },
];
