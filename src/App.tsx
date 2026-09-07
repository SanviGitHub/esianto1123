import { useState, useEffect } from 'react';
import { 
  HeartHandshake, 
  BarChart3, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  PhoneCall, 
  Share2, 
  RotateCcw, 
  Sparkles, 
  X, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Database,
  Loader2,
  Sun,
  Activity,
  BotOff,
  Volume2,
  MessageCircleHeart,
  AlertCircle
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase.ts';
import { 
  SURVEY_QUESTIONS, 
  SurveyQuestion 
} from './data/surveyData.ts';
import { EMERGENCY_CONTACTS } from './data/helpResources.ts';
import { 
  MinimalistSunrise, 
  CareSymbol, 
  HealingPathLine, 
  SupportNetworkDots 
} from './components/VisualMetaphors.tsx';

const STORAGE_KEY_USER_ANSWERS = 'esi_mental_health_user_answers_v4';

function getOrCreateVoterToken(): string {
  try {
    let token = localStorage.getItem('esi_anon_voter_token');
    if (!token) {
      token = 'voter_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('esi_anon_voter_token', token);
    }
    return token;
  } catch {
    return 'voter_fallback_' + Math.random().toString(36).substring(2, 10);
  }
}

export default function App() {
  // Real-time vote counts from Firestore
  const [votes, setVotes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    SURVEY_QUESTIONS.forEach(q => {
      q.options.forEach(opt => {
        initial[opt.id] = 0;
      });
    });
    return initial;
  });

  // Real participant count from Firestore documents
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [isLoadingDb, setIsLoadingDb] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Local answers selected in the current session
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER_ANSWERS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });

  const [activeView, setActiveView] = useState<'survey' | 'results'>('survey');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedReflections, setExpandedReflections] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
  });

  // Connect to Firestore real-time listener
  useEffect(() => {
    const responsesCollection = collection(db, 'survey_responses');
    
    const unsubscribe = onSnapshot(
      responsesCollection,
      (snapshot) => {
        const counts: Record<string, number> = {};
        SURVEY_QUESTIONS.forEach(q => {
          q.options.forEach(opt => {
            counts[opt.id] = 0;
          });
        });

        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.q1 && counts[data.q1] !== undefined) counts[data.q1]++;
          if (data.q2 && counts[data.q2] !== undefined) counts[data.q2]++;
          if (data.q3 && counts[data.q3] !== undefined) counts[data.q3]++;
          if (data.q4 && counts[data.q4] !== undefined) counts[data.q4]++;
          if (data.q5 && counts[data.q5] !== undefined) counts[data.q5]++;
        });

        setVotes(counts);
        setTotalParticipants(snapshot.size);
        setIsDbConnected(true);
        setIsLoadingDb(false);
      },
      (error) => {
        console.error('Error listening to survey_responses:', error);
        setIsDbConnected(false);
        setIsLoadingDb(false);
        handleFirestoreError(error, OperationType.LIST, 'survey_responses');
      }
    );

    return () => unsubscribe();
  }, []);

  // Save user's current session answers locally
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER_ANSWERS, JSON.stringify(userAnswers));
    } catch {
      // ignore
    }
  }, [userAnswers]);

  const answeredCount = Object.keys(userAnswers).length;
  const isFullyAnswered = answeredCount === SURVEY_QUESTIONS.length;
  const currentQ: SurveyQuestion = SURVEY_QUESTIONS[currentQuestionIndex];

  const handleSelectOption = (questionId: number, optionId: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleFinishSurvey = async () => {
    if (!isFullyAnswered) {
      showToast("Por favor responde todas las preguntas antes de finalizar");
      return;
    }

    setIsSubmitting(true);
    try {
      const voterToken = getOrCreateVoterToken();
      const docId = `resp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Save response to Firestore
      await setDoc(doc(db, 'survey_responses', docId), {
        q1: userAnswers[1],
        q2: userAnswers[2],
        q3: userAnswers[3],
        q4: userAnswers[4],
        q5: userAnswers[5],
        voterToken,
        createdAt: serverTimestamp(),
      });

      setActiveView('results');
      showToast("¡Tu respuesta anónima ha sido guardada en la base de datos en tiempo real!");
    } catch (error) {
      console.error("Error saving response to Firestore:", error);
      showToast("Error al guardar en la base de datos.");
      handleFirestoreError(error, OperationType.CREATE, 'survey_responses');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSurvey = () => {
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setActiveView('survey');
    showToast("Formulario listo para registrar otra respuesta anónima real");
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const copyResultsLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Enlace copiado al portapapeles");
    } else {
      showToast("Enlace listo para compartir");
    }
  };

  const toggleReflection = (qId: number) => {
    setExpandedReflections(prev => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Helper to calculate percentage of an option within its question from real votes
  const calculatePercentage = (question: SurveyQuestion, optionId: string): number => {
    const totalVotesInQ = question.options.reduce((sum, opt) => sum + (votes[opt.id] || 0), 0);
    if (totalVotesInQ === 0) return 0;
    const optionVotes = votes[optionId] || 0;
    return Math.round((optionVotes / totalVotesInQ) * 100);
  };

  const getOptionVotes = (optionId: string): number => {
    return votes[optionId] || 0;
  };

  // Icons corresponding to each question concept
  const getQuestionIcon = (id: number) => {
    switch (id) {
      case 1:
        return <Sun className="w-5 h-5 text-amber-600" />;
      case 2:
        return <HeartHandshake className="w-5 h-5 text-amber-600" />;
      case 3:
        return <Activity className="w-5 h-5 text-amber-600" />;
      case 4:
        return <BotOff className="w-5 h-5 text-amber-600" />;
      case 5:
      default:
        return <Volume2 className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div id="main-survey-container" className="bg-hope-pattern min-h-screen flex flex-col text-gray-800 selection:bg-amber-300 selection:text-gray-900">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div 
            id="toast-notification"
            className="fixed top-5 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-full bg-gray-900 text-amber-300 border border-amber-400/40 shadow-2xl flex items-center gap-3 animate-bounce text-sm font-medium"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Broad Luminous Header with Soft Yellow Background & Dawn Symbolism */}
        <header className="relative w-full bg-gradient-to-b from-amber-100/90 via-amber-50/70 to-slate-50 border-b border-amber-200/60 pt-8 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
          
          {/* Subtle decorative glowing background lights */}
          <div className="absolute top-3 left-10 w-48 h-48 rounded-full bg-amber-200/40 blur-3xl pointer-events-none" />
          <div className="absolute top-8 right-12 w-60 h-60 rounded-full bg-yellow-300/30 blur-3xl pointer-events-none" />
          
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center relative z-10">
            
            {/* Top Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-4">
              <span className="px-3.5 py-1 rounded-full bg-amber-200/70 border border-amber-400/50 text-amber-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Septiembre Amarillo • Todo el año
              </span>
              <span className="px-3 py-1 rounded-full bg-white text-gray-700 text-xs font-medium border border-gray-200 shadow-sm flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                100% Anónimo
              </span>
            </div>

            {/* Minimalist Rising Sun Symbol */}
            <div className="my-1 animate-gentle-float">
              <MinimalistSunrise size="md" />
            </div>

            {/* Main Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 tracking-tight mt-2">
              Espacio de <span className="font-bold text-amber-600 underline decoration-amber-300 decoration-wavy underline-offset-8">Escucha y Esperanza</span>
            </h1>

            {/* Subtitle / Tender Safe Space Statement */}
            <p className="mt-3 text-base sm:text-lg text-gray-600 max-w-2xl font-normal leading-relaxed">
              Un espacio serio, sensible y seguro pensado para reflexionar sobre la prevención del suicidio, las lesiones y la importancia vital de buscar ayuda profesional.
            </p>

            {/* Guiding Words with Glowing Yellow Lights */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 font-medium">
              <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full border border-amber-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 glow-yellow-sm" />
                <strong className="text-gray-900">Escuchar</strong> con empatía
              </span>
              <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full border border-amber-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 glow-yellow-sm" />
                <strong className="text-gray-900">Acompañar</strong> en el dolor
              </span>
              <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full border border-amber-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 glow-yellow-sm" />
                <strong className="text-gray-900">Hablar</strong> sin minimizar
              </span>
              <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full border border-amber-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 glow-yellow-sm" />
                <strong className="text-gray-900">Pedir ayuda</strong> a tiempo
              </span>
              <span className="flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full border border-amber-200 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 glow-yellow-sm" />
                <strong className="text-gray-900">Prevenir</strong> en comunidad
              </span>
            </div>

          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">

          {/* Healing Metaphor & September Educational Strip */}
          <section className="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs flex flex-col gap-3">
            <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2">
              <div className="flex items-center gap-2.5">
                <CareSymbol className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Cuidado, acompañamiento y sanación no gráfica
                  </h2>
                  <p className="text-xs text-gray-500">
                    Cada herida física o psíquica merece contención, comprensión y atención profesional, jamás estigma ni silencio.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  id="btn-header-help"
                  onClick={() => setShowHelpModal(true)}
                  className="px-3.5 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold border border-amber-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
                  Líneas 24h Gratuitas
                </button>
              </div>
            </div>

            {/* Fragmented-to-solid line representation */}
            <div className="pt-2 border-t border-gray-100">
              <HealingPathLine />
            </div>
          </section>

          {/* View Switcher & Live Status Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl p-4 border border-gray-200 shadow-xs">
            <div className="flex items-center gap-2.5 text-xs text-gray-600">
              <span className={`w-2.5 h-2.5 rounded-full ${isDbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span>
                {isDbConnected ? 'Conectado a la base de datos en tiempo real' : 'Conectando...'}
              </span>
              <span className="hidden md:inline text-gray-400">•</span>
              <span className="hidden md:inline font-semibold text-gray-700">
                {totalParticipants} {totalParticipants === 1 ? 'respuesta anónima real' : 'respuestas anónimas reales'}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                id="btn-switch-survey"
                onClick={() => setActiveView('survey')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeView === 'survey'
                    ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Responder Encuesta
              </button>
              <button
                id="btn-switch-results"
                onClick={() => setActiveView('results')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeView === 'results'
                    ? 'bg-amber-500 text-gray-950 shadow-md shadow-amber-500/20'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Ver Resultados (%)
              </button>
            </div>
          </div>

          {/* VIEW 1: SURVEY MODE (Pure White Center Card with Yellow Accents) */}
          {activeView === 'survey' && (
            <div className="card-hope rounded-3xl p-6 sm:p-10 flex flex-col gap-6">
              
              {/* Luminous Step Progress: Path of yellow glowing dots */}
              <div className="flex flex-col gap-2 bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80">
                <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                  <span className="uppercase tracking-wider font-semibold text-amber-900">
                    Camino de preguntas ({currentQuestionIndex + 1} de {SURVEY_QUESTIONS.length})
                  </span>
                  <span className="text-gray-500">
                    {answeredCount} de {SURVEY_QUESTIONS.length} respondidas
                  </span>
                </div>

                {/* Connected Dots Progress Path */}
                <div className="flex items-center justify-between px-2 pt-2">
                  {SURVEY_QUESTIONS.map((q, idx) => {
                    const isAnswered = !!userAnswers[q.id];
                    const isCurrent = idx === currentQuestionIndex;
                    return (
                      <div key={q.id} className="flex items-center flex-1 last:flex-none">
                        <button
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-500 text-gray-950 ring-4 ring-amber-200 glow-yellow shadow-sm'
                              : isAnswered
                              ? 'bg-amber-400 text-gray-950 font-bold'
                              : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                          }`}
                          title={`Pregunta ${idx + 1}`}
                        >
                          {isAnswered ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </button>

                        {idx < SURVEY_QUESTIONS.length - 1 && (
                          <div className={`h-1 flex-1 mx-1.5 rounded-full transition-all ${
                            userAnswers[SURVEY_QUESTIONS[idx].id] && userAnswers[SURVEY_QUESTIONS[idx + 1].id]
                              ? 'bg-amber-400'
                              : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Question Title & Theme */}
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex-shrink-0">
                  {getQuestionIcon(currentQ.id)}
                </div>
                <div className="flex-1">
                  <span className="text-xs uppercase tracking-widest text-amber-800 font-bold mb-1 block">
                    Pregunta {currentQuestionIndex + 1} • {currentQ.topic}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-snug">
                    {currentQ.question}
                  </h2>
                </div>
              </div>

              {/* Options List */}
              <div className="grid grid-cols-1 gap-3.5 pt-1">
                {currentQ.options.map((option) => {
                  const isSelected = userAnswers[currentQ.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      id={`opt-btn-${option.id}`}
                      onClick={() => handleSelectOption(currentQ.id, option.id)}
                      className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-50/90 border-amber-500 shadow-md shadow-amber-500/10 ring-2 ring-amber-400/60'
                          : 'bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50/30'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'border-amber-600 bg-amber-500 text-gray-950'
                          : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-gray-950" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm sm:text-base leading-relaxed ${
                          isSelected ? 'text-gray-950 font-semibold' : 'text-gray-700'
                        }`}>
                          {option.text}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pedagogical Reflection Callout in Question View */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                <MessageCircleHeart className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <span className="font-bold text-gray-900 block mb-0.5">
                    Marco pedagógico ESI y Salud Mental:
                  </span>
                  Esta encuesta busca cuestionar mitos dolorosos, generar empatía comunitaria y desestigmatizar el pedido de ayuda profesional.
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  id="btn-prev-question"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all ${
                    currentQuestionIndex === 0
                      ? 'opacity-40 cursor-not-allowed text-gray-400 bg-gray-100'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </button>

                <div className="text-xs text-gray-500 hidden sm:block">
                  Tu respuesta se guardará de forma 100% anónima
                </div>

                {currentQuestionIndex < SURVEY_QUESTIONS.length - 1 ? (
                  <button
                    id="btn-next-question"
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(SURVEY_QUESTIONS.length - 1, prev + 1))}
                    className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 text-gray-950 flex items-center gap-1.5 shadow-md shadow-amber-500/25 transition-all cursor-pointer"
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="btn-submit-survey"
                    onClick={handleFinishSurvey}
                    disabled={!isFullyAnswered || isSubmitting}
                    className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all ${
                      isFullyAnswered && !isSubmitting
                        ? 'bg-amber-500 hover:bg-amber-600 text-gray-950 shadow-amber-500/30 cursor-pointer animate-pulse'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
                        Guardando en BD Real...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-gray-950" />
                        Finalizar y Ver Resultados (%)
                      </>
                    )}
                  </button>
                )}
              </div>

            </div>
          )}

          {/* VIEW 2: RESULTS (%) MODE (Clear, Respectful, with Real Firestore Numbers) */}
          {activeView === 'results' && (
            <div className="flex flex-col gap-6">

              {/* Hopeful Sunrise Completion Banner */}
              <div className="card-hope rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <MinimalistSunrise size="sm" />
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      Amanecer de Conciencia y Prevención
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-xl">
                      Cada respuesta ayuda a derribar prejuicios sobre el dolor y el sufrimiento. 
                      Calculado en tiempo real con <strong className="text-amber-800 font-bold">{totalParticipants} {totalParticipants === 1 ? 'respuesta anónima real' : 'respuestas anónimas reales'}</strong> en la base de datos.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    id="btn-restart-vote"
                    onClick={handleResetSurvey}
                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 border border-gray-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                    Enviar otra respuesta
                  </button>
                  <button
                    id="btn-share-results"
                    onClick={copyResultsLink}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-gray-950 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartir Encuesta
                  </button>
                </div>
              </div>

              {/* Zero-data notice if no responses yet */}
              {totalParticipants === 0 && (
                <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                  <div className="flex items-center gap-3">
                    <Database className="w-8 h-8 text-amber-600 flex-shrink-0" />
                    <div>
                      <h4 className="text-gray-900 font-bold text-base">
                        Aún no hay respuestas registradas
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Sé la primera persona en responder para registrar las estadísticas iniciales.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveView('survey')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 text-xs font-bold transition-all whitespace-nowrap cursor-pointer shadow-sm"
                  >
                    Responder ahora
                  </button>
                </div>
              )}

              {/* Results Grid for Questions 1-4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SURVEY_QUESTIONS.slice(0, 4).map((q, idx) => {
                  const userChoice = userAnswers[q.id];
                  return (
                    <div key={q.id} className="card-hope-subtle rounded-2xl p-5 flex flex-col justify-between gap-4 bg-white">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] uppercase tracking-wider text-amber-800 font-bold flex items-center gap-1">
                            {getQuestionIcon(q.id)}
                            Pregunta {idx + 1}
                          </span>
                          {userChoice && (
                            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold">
                              Tu voto registrado
                            </span>
                          )}
                        </div>

                        <h4 className="text-gray-900 font-semibold text-base mb-3 leading-snug">
                          {q.question}
                        </h4>

                        {/* Percentage Bars with Warm Yellow Gradients */}
                        <div className="space-y-3">
                          {q.options.map(opt => {
                            const pct = calculatePercentage(q, opt.id);
                            const count = getOptionVotes(opt.id);
                            const isUserPicked = userChoice === opt.id;

                            return (
                              <div key={opt.id} className="space-y-1">
                                <div className="flex justify-between items-center text-xs text-gray-600">
                                  <span className="line-clamp-1 pr-2">
                                    {opt.text}
                                    {isUserPicked && (
                                      <span className="ml-1.5 text-[10px] text-amber-900 font-bold bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                                        Tu respuesta
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-mono font-bold text-gray-900 whitespace-nowrap">
                                    {pct}% <span className="text-[10px] font-normal text-gray-400">({count})</span>
                                  </span>
                                </div>
                                <div className="relative h-8 w-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center px-3">
                                  <div 
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-700"
                                    style={{ width: `${pct}%` }}
                                  />
                                  <span className="relative text-xs text-gray-900 font-medium line-clamp-1 z-10">
                                    {opt.text}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Exact User Requested Quote */}
                      <div className="border-t border-gray-100 pt-3 mt-2">
                        <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200">
                          <p className="text-xs text-amber-950 italic leading-relaxed">
                            "{q.reflectionQuote}"
                          </p>
                        </div>

                        {/* Expandable Pedagogical Reflection */}
                        <button
                          onClick={() => toggleReflection(q.id)}
                          className="mt-2 text-xs text-amber-800 hover:text-amber-950 font-bold flex items-center justify-between w-full transition-all cursor-pointer"
                        >
                          <span>Reflexión ESI sobre ayuda profesional</span>
                          {expandedReflections[q.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {expandedReflections[q.id] && (
                          <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-3 rounded-xl border border-gray-200 leading-relaxed">
                            {q.pedagogicalNote}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Question 5: Wide Highlighted Card (Validación Emocional) */}
              {(() => {
                const q = SURVEY_QUESTIONS[4];
                const userChoice = userAnswers[q.id];
                const pctKey = calculatePercentage(q, 'q5_opt2');
                const keyCount = getOptionVotes('q5_opt2');

                return (
                  <div key={q.id} className="card-hope rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 bg-gradient-to-br from-amber-50 via-white to-amber-100/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs uppercase tracking-wider text-amber-900 font-bold flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-amber-600" />
                          Pregunta 5 • Validación Emocional
                        </span>
                        {userChoice && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-semibold border border-amber-300">
                            Tu voto registrado
                          </span>
                        )}
                      </div>
                      <h3 className="text-gray-900 font-bold text-lg sm:text-xl">
                        "{q.question}"
                      </h3>
                      <p className="text-sm text-amber-950 mt-2 italic font-normal bg-amber-100/80 p-3 rounded-xl border border-amber-300 leading-relaxed">
                        "{q.reflectionQuote}"
                      </p>
                      <p className="text-xs text-gray-600 mt-2.5 leading-relaxed">
                        {q.pedagogicalNote}
                      </p>
                    </div>

                    <div className="flex md:flex-col items-center justify-center px-6 md:px-8 border-t md:border-t-0 md:border-l border-amber-200 pt-4 md:pt-0">
                      <span className="text-4xl sm:text-5xl font-black text-amber-600 tracking-tight">
                        {pctKey}%
                      </span>
                      <span className="text-[11px] text-gray-800 uppercase tracking-wider font-bold text-center mt-1">
                        Prioriza Hablar y Validar Emociones
                      </span>
                      <span className="text-[10px] text-gray-500 font-mono mt-0.5">
                        ({keyCount} {keyCount === 1 ? 'voto real' : 'votos reales'})
                      </span>
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

        </main>

        {/* Footer: Deep Charcoal Gray Background with Warm Yellow Details & Support Network */}
        <footer className="mt-12 bg-gray-950 text-gray-200 border-t border-gray-800 pt-10 pb-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex flex-col gap-8">
            
            {/* Support Network Nodes */}
            <div className="flex flex-col items-center gap-2">
              <SupportNetworkDots />
              <p className="text-xs text-amber-300/90 font-medium text-center tracking-wider uppercase mt-1">
                Red de Cuidado, Acompañamiento y Prevención
              </p>
            </div>

            {/* Central Quote requested in guidelines */}
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-sm sm:text-base text-gray-300 font-light leading-relaxed">
                "Hablar sobre lo que duele no es una debilidad: es el primer paso para sanar. 
                Escuchar sin juzgar salva vidas, y nadie debe recorrer el dolor a solas."
              </p>
            </div>

            {/* Bottom Bar with Emergency Button & Sanvy Corporation info */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-800 pt-6 gap-4 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Septiembre Amarillo y todo el año • Proyecto ESI</span>
                <span className="hidden sm:inline text-gray-600">|</span>
                <span className="text-gray-400">Sanvy Corporation (2.° 4.ª)</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  id="btn-footer-help-modal"
                  onClick={() => setShowHelpModal(true)}
                  className="px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-amber-500/20"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Líneas de Ayuda 24h Gratuitas
                </button>
                <span className="text-[11px] text-gray-500 border border-gray-800 px-3 py-1.5 rounded-full">
                  100% Confidencial
                </span>
              </div>
            </div>

          </div>
        </footer>

        {/* Emergency & Professional Help Modal (Clean, high contrast, warm) */}
        {showHelpModal && (
          <div 
            id="help-modal-overlay"
            className="fixed inset-0 z-50 bg-gray-950/70 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setShowHelpModal(false)}
          >
            <div 
              id="help-modal-content"
              className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 border border-amber-200 shadow-2xl flex flex-col gap-5 text-gray-900 relative animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 border border-amber-300">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Canales de Asistencia y Escucha
                    </h3>
                    <p className="text-xs text-gray-600">
                      Atención gratuita, confidencial y profesional para momentos de crisis o dolor
                    </p>
                  </div>
                </div>
                <button
                  id="btn-close-help-modal"
                  onClick={() => setShowHelpModal(false)}
                  className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {EMERGENCY_CONTACTS.map((contact, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-900">
                        {contact.name}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-950 bg-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400">
                        {contact.phone}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {contact.description}
                    </p>
                    <span className="text-[11px] text-amber-800 font-medium">
                      Disponibilidad: {contact.availability}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-600 leading-relaxed">
                  <strong className="text-gray-900 block mb-0.5">En el ámbito escolar o comunitario:</strong>
                  Podés acudir a tutores, docentes de confianza, personal del gabinete pedagógico/psicológico o a cualquier centro de salud pública (CAPS/hospitales). Pedir ayuda es un acto de valentía y cuidado.
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 text-sm font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                Comprendido / Cerrar
              </button>
            </div>
          </div>
        )}

      </div>
  );
}
