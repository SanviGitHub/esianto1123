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
  Brain, 
  MessageSquareHeart, 
  Users,
  Database,
  Loader2,
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

const STORAGE_KEY_USER_ANSWERS = 'esi_mental_health_user_answers_v3';

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
  // Real-time vote counts from Firestore (starting strictly at 0, no invented data)
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

  // Connect to Firestore real-time listener for honest, un-invented survey data
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

  // Save user's current session answers
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

      // Save genuine un-invented response to Firestore
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
      showToast("¡Tu respuesta anónima fue registrada en la base de datos en tiempo real!");
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
      showToast("Enlace de la encuesta copiado al portapapeles");
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

  // Get color styles for progress bar and cards
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'rose':
        return {
          bgBox: 'bg-rose-950/40 border border-rose-500/20',
          barFill: 'bg-rose-500/50',
          textAccent: 'text-rose-300',
          pillBg: 'bg-rose-500/20 border-rose-400/30 text-rose-200',
        };
      case 'teal':
        return {
          bgBox: 'bg-teal-950/40 border border-teal-500/20',
          barFill: 'bg-teal-500/50',
          textAccent: 'text-teal-300',
          pillBg: 'bg-teal-500/20 border-teal-400/30 text-teal-200',
        };
      case 'purple':
        return {
          bgBox: 'bg-purple-950/40 border border-purple-500/20',
          barFill: 'bg-purple-500/50',
          textAccent: 'text-purple-300',
          pillBg: 'bg-purple-500/20 border-purple-400/30 text-purple-200',
        };
      case 'amber':
        return {
          bgBox: 'bg-amber-950/40 border border-amber-500/20',
          barFill: 'bg-amber-500/50',
          textAccent: 'text-amber-300',
          pillBg: 'bg-amber-500/20 border-amber-400/30 text-amber-200',
        };
      case 'indigo':
      default:
        return {
          bgBox: 'bg-indigo-950/40 border border-indigo-500/20',
          barFill: 'bg-indigo-500/50',
          textAccent: 'text-indigo-300',
          pillBg: 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200',
        };
    }
  };

  return (
    <div id="main-survey-container" className="frosted-bg min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-start text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          id="toast-notification"
          className="fixed top-5 z-50 px-5 py-3 rounded-full frosted-glass-card border border-indigo-300/40 text-white shadow-2xl flex items-center gap-3 animate-bounce text-sm font-medium"
        >
          <Sparkles className="w-4 h-4 text-indigo-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Outer Frosted Glass Card */}
      <div className="w-full max-w-5xl frosted-glass-card rounded-3xl p-6 sm:p-10 shadow-2xl transition-all duration-300 flex flex-col gap-6">
        
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-6 gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                Proyecto ESI
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-slate-200 text-xs border border-white/15 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                100% Anónimo
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs border border-emerald-400/30 flex items-center gap-1.5">
                <Database className="w-3 h-3" />
                Base de Datos Real (Firestore)
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-light text-white tracking-tight">
              Proyecto ESI: <span className="font-bold text-indigo-300">Salud Mental</span>
            </h1>
            <p className="text-indigo-200/80 mt-1.5 text-sm sm:text-base max-w-2xl">
              Encuesta estudiantil sin datos inventados: cada porcentaje refleja votos anónimos reales almacenados en la base de datos.
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
            <div className="text-left sm:text-right">
              {isLoadingDb ? (
                <div className="flex items-center gap-2 text-indigo-300 text-sm py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sincronizando BD...</span>
                </div>
              ) : (
                <>
                  <span className="text-3xl sm:text-4xl font-mono text-white font-bold tracking-tight">
                    {totalParticipants.toLocaleString()}
                  </span>
                  <p className="text-xs uppercase tracking-widest text-indigo-300 font-semibold flex items-center gap-1 sm:justify-end">
                    <Users className="w-3.5 h-3.5" />
                    {totalParticipants === 1 ? 'Participante Real' : 'Participantes Reales'}
                  </p>
                </>
              )}
            </div>

            {/* View Switcher buttons */}
            <div className="flex items-center gap-2 mt-2">
              <button
                id="btn-view-survey"
                onClick={() => setActiveView('survey')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeView === 'survey'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Responder
              </button>
              <button
                id="btn-view-results"
                onClick={() => setActiveView('results')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeView === 'results'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white/10 hover:bg-white/15 text-slate-300 border border-white/10'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Resultados (%)
              </button>
            </div>
          </div>
        </header>

        {/* Real-time DB Status banner */}
        <div className="flex items-center justify-between text-xs px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300">
              {isDbConnected ? 'Base de datos en la nube conectada en vivo' : 'Conectando a base de datos Firestore...'}
            </span>
          </div>
          <span className="text-indigo-300 hidden sm:inline">
            Cero datos simulados • Conteo en tiempo real
          </span>
        </div>

        {/* VIEW 1: SURVEY QUESTIONS MODE */}
        {activeView === 'survey' && (
          <div className="flex flex-col gap-6">
            {/* Step Progress & Navigation Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-300 uppercase tracking-wider font-semibold">
                  Pregunta {currentQuestionIndex + 1} de {SURVEY_QUESTIONS.length}:
                </span>
                <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                  {currentQ.topic}
                </span>
              </div>

              {/* Question selector dots/pills */}
              <div className="flex items-center gap-2">
                {SURVEY_QUESTIONS.map((q, idx) => {
                  const isAnswered = !!userAnswers[q.id];
                  const isCurrent = idx === currentQuestionIndex;
                  return (
                    <button
                      key={q.id}
                      id={`nav-pill-q${q.id}`}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        isCurrent
                          ? 'bg-indigo-500 text-white ring-2 ring-indigo-300/40 shadow-md'
                          : isAnswered
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-white/10 text-slate-300 hover:bg-white/15 border border-white/10'
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isAnswered && <CheckCircle2 className="w-3 h-3 text-emerald-300" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Question Card */}
            <div className="frosted-glass-subcard rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-indigo-300 font-semibold mb-1 block">
                    Tema: {currentQ.topic}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-medium text-white leading-relaxed">
                    {currentQ.question}
                  </h2>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs border border-white/15 whitespace-nowrap">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                  Voto privado
                </div>
              </div>

              {/* Options list */}
              <div className="grid grid-cols-1 gap-3.5">
                {currentQ.options.map((option) => {
                  const isSelected = userAnswers[currentQ.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      id={`opt-btn-${option.id}`}
                      onClick={() => handleSelectOption(currentQ.id, option.id)}
                      className={`text-left p-4 sm:p-5 rounded-xl border transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-500/20 border-indigo-400 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-500 text-white'
                          : 'border-white/30 bg-transparent'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm sm:text-base font-normal leading-relaxed ${
                          isSelected ? 'text-white font-medium' : 'text-slate-200'
                        }`}>
                          {option.text}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Context banner regarding the user's prompt key quote */}
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-start gap-3">
                <MessageSquareHeart className="w-5 h-5 text-indigo-300 flex-shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
                  <span className="font-semibold text-white block mb-0.5">
                    ¿Por qué preguntamos esto en ESI?
                  </span>
                  Esta encuesta busca reflexionar sobre ideas preconcebidas y abrir el diálogo sincero sin juzgar a nadie.
                </div>
              </div>

              {/* Question Navigation Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-2">
                <button
                  id="btn-prev-question"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all ${
                    currentQuestionIndex === 0
                      ? 'opacity-40 cursor-not-allowed text-slate-500'
                      : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </button>

                <div className="text-xs text-indigo-200/80">
                  {answeredCount} de {SURVEY_QUESTIONS.length} respondidas
                </div>

                {currentQuestionIndex < SURVEY_QUESTIONS.length - 1 ? (
                  <button
                    id="btn-next-question"
                    onClick={() => setCurrentQuestionIndex(prev => Math.min(SURVEY_QUESTIONS.length - 1, prev + 1))}
                    className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 text-white flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="btn-submit-survey"
                    onClick={handleFinishSurvey}
                    disabled={!isFullyAnswered || isSubmitting}
                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg transition-all ${
                      isFullyAnswered && !isSubmitting
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/30 cursor-pointer animate-pulse'
                        : 'bg-white/10 border border-white/15 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando en BD...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Finalizar y Guardar en BD Real
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: RESULTS (%) MODE (Strictly calculated from real database entries) */}
        {activeView === 'results' && (
          <div className="flex flex-col gap-6">
            {/* Quick summary stats highlight banner */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    Resultados de la Encuesta Anónima Estudiantil
                  </h3>
                  <p className="text-xs text-indigo-200">
                    {totalParticipants === 0 ? (
                      "Base de datos limpia: aún no hay respuestas registradas."
                    ) : (
                      `Calculados en tiempo real sobre ${totalParticipants.toLocaleString()} ${totalParticipants === 1 ? 'respuesta anónima real' : 'respuestas anónimas reales'}.`
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  id="btn-restart-vote"
                  onClick={handleResetSurvey}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-300" />
                  Enviar otra respuesta
                </button>
                <button
                  id="btn-share-results"
                  onClick={copyResultsLink}
                  className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-bold text-white shadow-md shadow-indigo-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Compartir Resultados
                </button>
              </div>
            </div>

            {/* Zero-data banner when no one has voted yet */}
            {totalParticipants === 0 && (
              <div className="p-6 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <Database className="w-8 h-8 text-indigo-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-bold text-base">
                      Base de datos en blanco (Sin datos inventados)
                    </h4>
                    <p className="text-xs text-indigo-200 mt-0.5">
                      No hay datos ficticios preprogramados. Toda estadística provendrá únicamente de respuestas reales.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveView('survey')}
                  className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
                >
                  Ser el primer participante
                </button>
              </div>
            )}

            {/* Questions 1-4 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Question 1 Card */}
              {(() => {
                const q = SURVEY_QUESTIONS[0];
                const styles = getColorClasses(q.accentColor);
                const userChoice = userAnswers[q.id];
                return (
                  <div key={q.id} className="frosted-glass-subcard rounded-2xl p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold">
                          Pregunta 1
                        </span>
                        {userChoice && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                            Tu voto registrado
                          </span>
                        )}
                      </div>
                      <p className="text-white font-medium text-base mb-3 leading-snug">
                        {q.question}
                      </p>

                      {/* Options with percentage bars */}
                      <div className="space-y-3">
                        {q.options.map(opt => {
                          const pct = calculatePercentage(q, opt.id);
                          const count = getOptionVotes(opt.id);
                          const isUserPicked = userChoice === opt.id;
                          return (
                            <div key={opt.id} className="space-y-1">
                              <div className="flex justify-between items-center text-xs text-slate-200">
                                <span className="line-clamp-1 pr-2">
                                  {opt.text}
                                  {isUserPicked && (
                                    <span className="ml-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                      Tu respuesta
                                    </span>
                                  )}
                                </span>
                                <span className="font-mono font-bold text-white whitespace-nowrap">
                                  {pct}% <span className="text-[10px] font-normal text-slate-400">({count})</span>
                                </span>
                              </div>
                              <div className={`relative h-9 w-full rounded-lg overflow-hidden flex items-center px-3 ${styles.bgBox}`}>
                                <div 
                                  className={`absolute top-0 left-0 h-full ${styles.barFill} transition-all duration-700`}
                                  style={{ width: `${pct}%` }}
                                />
                                <span className="relative text-xs text-white font-semibold line-clamp-1 z-10 drop-shadow-sm">
                                  {opt.text}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Key Quote requested by user */}
                    <div className="border-t border-white/10 pt-3 mt-2">
                      <div className="flex items-start gap-2 bg-indigo-950/30 p-2.5 rounded-xl border border-indigo-500/20">
                        <p className="text-xs text-indigo-200 italic leading-snug">
                          "{q.reflectionQuote}"
                        </p>
                      </div>

                      {/* Expandable Pedagogical Note */}
                      <button
                        onClick={() => toggleReflection(q.id)}
                        className="mt-2 text-xs text-indigo-300 hover:text-white flex items-center justify-between w-full transition-all cursor-pointer"
                      >
                        <span className="font-semibold">Reflexión ESI sobre ayuda profesional</span>
                        {expandedReflections[q.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {expandedReflections[q.id] && (
                        <p className="text-xs text-slate-300 mt-2 bg-white/5 p-2.5 rounded-lg border border-white/10 leading-relaxed">
                          {q.pedagogicalNote}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Question 2 Card */}
              {(() => {
                const q = SURVEY_QUESTIONS[1];
                const styles = getColorClasses(q.accentColor);
                const userChoice = userAnswers[q.id];
                return (
                  <div key={q.id} className="frosted-glass-subcard rounded-2xl p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wider text-rose-300 font-semibold">
                          Pregunta 2
                        </span>
                        {userChoice && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/30">
                            Tu voto registrado
                          </span>
                        )}
                      </div>
                      <p className="text-white font-medium text-base mb-3 leading-snug">
                        {q.question}
                      </p>

                      {/* Options with percentage bars */}
                      <div className="space-y-3">
                        {q.options.map(opt => {
                          const pct = calculatePercentage(q, opt.id);
                          const count = getOptionVotes(opt.id);
                          const isUserPicked = userChoice === opt.id;
                          return (
                            <div key={opt.id} className="space-y-1">
                              <div className="flex justify-between items-center text-xs text-slate-200">
                                <span className="line-clamp-1 pr-2">
                                  {opt.text}
                                  {isUserPicked && (
                                    <span className="ml-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                      Tu respuesta
                                    </span>
                                  )}
                                </span>
                                <span className="font-mono font-bold text-white whitespace-nowrap">
                                  {pct}% <span className="text-[10px] font-normal text-slate-400">({count})</span>
                                </span>
                              </div>
                              <div className={`relative h-9 w-full rounded-lg overflow-hidden flex items-center px-3 ${styles.bgBox}`}>
                                <div 
                                  className={`absolute top-0 left-0 h-full ${styles.barFill} transition-all duration-700`}
                                  style={{ width: `${pct}%` }}
                                />
                                <span className="relative text-xs text-white font-semibold line-clamp-1 z-10 drop-shadow-sm">
                                  {opt.text}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Key Quote requested by user */}
                    <div className="border-t border-white/10 pt-3 mt-2">
                      <div className="flex items-start gap-2 bg-rose-950/30 p-2.5 rounded-xl border border-rose-500/20">
                        <p className="text-xs text-rose-200 leading-snug">
                          "{q.reflectionQuote}"
                        </p>
                      </div>

                      {/* Expandable Pedagogical Note */}
                      <button
                        onClick={() => toggleReflection(q.id)}
                        className="mt-2 text-xs text-rose-300 hover:text-white flex items-center justify-between w-full transition-all cursor-pointer"
                      >
                        <span className="font-semibold">Reflexión ESI sobre ayuda profesional</span>
                        {expandedReflections[q.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {expandedReflections[q.id] && (
                        <p className="text-xs text-slate-300 mt-2 bg-white/5 p-2.5 rounded-lg border border-white/10 leading-relaxed">
                          {q.pedagogicalNote}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Question 3 Card */}
              {(() => {
                const q = SURVEY_QUESTIONS[2];
                const styles = getColorClasses(q.accentColor);
                const userChoice = userAnswers[q.id];
                return (
                  <div key={q.id} className="frosted-glass-subcard rounded-2xl p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wider text-teal-300 font-semibold">
                          Pregunta 3
                        </span>
                        {userChoice && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/30">
                            Tu voto registrado
                          </span>
                        )}
                      </div>
                      <p className="text-white font-medium text-base mb-3 leading-snug">
                        {q.question}
                      </p>

                      {/* Options with percentage bars */}
                      <div className="space-y-3">
                        {q.options.map(opt => {
                          const pct = calculatePercentage(q, opt.id);
                          const count = getOptionVotes(opt.id);
                          const isUserPicked = userChoice === opt.id;
                          return (
                            <div key={opt.id} className="space-y-1">
                              <div className="flex justify-between items-center text-xs text-slate-200">
                                <span className="line-clamp-1 pr-2">
                                  {opt.text}
                                  {isUserPicked && (
                                    <span className="ml-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                      Tu respuesta
                                    </span>
                                  )}
                                </span>
                                <span className="font-mono font-bold text-white whitespace-nowrap">
                                  {pct}% <span className="text-[10px] font-normal text-slate-400">({count})</span>
                                </span>
                              </div>
                              <div className={`relative h-9 w-full rounded-lg overflow-hidden flex items-center px-3 ${styles.bgBox}`}>
                                <div 
                                  className={`absolute top-0 left-0 h-full ${styles.barFill} transition-all duration-700`}
                                  style={{ width: `${pct}%` }}
                                />
                                <span className="relative text-xs text-white font-semibold line-clamp-1 z-10 drop-shadow-sm">
                                  {opt.text}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Key Quote requested by user */}
                    <div className="border-t border-white/10 pt-3 mt-2">
                      <div className="flex items-start gap-2 bg-teal-950/30 p-2.5 rounded-xl border border-teal-500/20">
                        <p className="text-xs text-teal-200 leading-snug">
                          "{q.reflectionQuote}"
                        </p>
                      </div>

                      {/* Expandable Pedagogical Note */}
                      <button
                        onClick={() => toggleReflection(q.id)}
                        className="mt-2 text-xs text-teal-300 hover:text-white flex items-center justify-between w-full transition-all cursor-pointer"
                      >
                        <span className="font-semibold">Reflexión ESI sobre ayuda profesional</span>
                        {expandedReflections[q.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {expandedReflections[q.id] && (
                        <p className="text-xs text-slate-300 mt-2 bg-white/5 p-2.5 rounded-lg border border-white/10 leading-relaxed">
                          {q.pedagogicalNote}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Question 4 Card */}
              {(() => {
                const q = SURVEY_QUESTIONS[3];
                const styles = getColorClasses(q.accentColor);
                const userChoice = userAnswers[q.id];
                return (
                  <div key={q.id} className="frosted-glass-subcard rounded-2xl p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] uppercase tracking-wider text-purple-300 font-semibold">
                          Pregunta 4
                        </span>
                        {userChoice && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
                            Tu voto registrado
                          </span>
                        )}
                      </div>
                      <p className="text-white font-medium text-base mb-3 leading-snug">
                        {q.question}
                      </p>

                      {/* Options with percentage bars */}
                      <div className="space-y-3">
                        {q.options.map(opt => {
                          const pct = calculatePercentage(q, opt.id);
                          const count = getOptionVotes(opt.id);
                          const isUserPicked = userChoice === opt.id;
                          return (
                            <div key={opt.id} className="space-y-1">
                              <div className="flex justify-between items-center text-xs text-slate-200">
                                <span className="line-clamp-1 pr-2">
                                  {opt.text}
                                  {isUserPicked && (
                                    <span className="ml-1.5 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                      Tu respuesta
                                    </span>
                                  )}
                                </span>
                                <span className="font-mono font-bold text-white whitespace-nowrap">
                                  {pct}% <span className="text-[10px] font-normal text-slate-400">({count})</span>
                                </span>
                              </div>
                              <div className={`relative h-9 w-full rounded-lg overflow-hidden flex items-center px-3 ${styles.bgBox}`}>
                                <div 
                                  className={`absolute top-0 left-0 h-full ${styles.barFill} transition-all duration-700`}
                                  style={{ width: `${pct}%` }}
                                />
                                <span className="relative text-xs text-white font-semibold line-clamp-1 z-10 drop-shadow-sm">
                                  {opt.text}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Key Quote requested by user */}
                    <div className="border-t border-white/10 pt-3 mt-2">
                      <div className="flex items-start gap-2 bg-purple-950/30 p-2.5 rounded-xl border border-purple-500/20">
                        <p className="text-xs text-purple-200 leading-snug">
                          "{q.reflectionQuote}"
                        </p>
                      </div>

                      {/* Expandable Pedagogical Note */}
                      <button
                        onClick={() => toggleReflection(q.id)}
                        className="mt-2 text-xs text-purple-300 hover:text-white flex items-center justify-between w-full transition-all cursor-pointer"
                      >
                        <span className="font-semibold">Reflexión ESI sobre ayuda profesional</span>
                        {expandedReflections[q.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {expandedReflections[q.id] && (
                        <p className="text-xs text-slate-300 mt-2 bg-white/5 p-2.5 rounded-lg border border-white/10 leading-relaxed">
                          {q.pedagogicalNote}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>

            {/* Question 5: Wide Full-Span Card */}
            {(() => {
              const q = SURVEY_QUESTIONS[4];
              const userChoice = userAnswers[q.id];
              const pctKey = calculatePercentage(q, 'q5_opt2');
              const keyCount = getOptionVotes('q5_opt2');
              return (
                <div key={q.id} className="bg-indigo-500/10 border border-indigo-400/30 rounded-2xl p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 shadow-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs uppercase tracking-wider text-indigo-300 font-bold">
                        Pregunta 5 • Validación Emocional
                      </span>
                      {userChoice && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                          Tu voto registrado
                        </span>
                      )}
                    </div>
                    <p className="text-white font-bold text-lg sm:text-xl">
                      "{q.question}"
                    </p>
                    <p className="text-sm text-indigo-200 mt-2 italic font-normal bg-white/5 p-3 rounded-xl border border-white/10">
                      "{q.reflectionQuote}"
                    </p>
                    <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                      {q.pedagogicalNote}
                    </p>
                  </div>

                  <div className="flex md:flex-col items-center justify-center px-6 md:px-8 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0">
                    <span className="text-4xl sm:text-5xl font-black text-indigo-300 tracking-tight">
                      {pctKey}%
                    </span>
                    <span className="text-[11px] text-white uppercase tracking-widest font-semibold text-center mt-1">
                      Prioriza Hablar y Pedir Ayuda
                    </span>
                    <span className="text-[10px] text-indigo-200/80 font-mono mt-0.5">
                      ({keyCount} {keyCount === 1 ? 'voto real' : 'votos reales'})
                    </span>
                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* Footer Banner */}
        <footer className="mt-auto pt-6 flex flex-col sm:flex-row items-center justify-between border-t border-white/10 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-400 animate-pulse flex-shrink-0" />
            <p className="text-xs sm:text-sm text-white font-medium uppercase tracking-wider text-center sm:text-left">
              Si necesitas ayuda o estás atravesando un momento difícil, no estás solo. Hablá con un profesional.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-help-modal"
              onClick={() => setShowHelpModal(true)}
              className="px-4 py-2 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold border border-rose-400/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-300" />
              Líneas de Ayuda 24h
            </button>
            <div className="px-4 py-2 rounded-full bg-white/5 text-white/70 text-xs border border-white/10 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Firestore En Vivo
            </div>
          </div>
        </footer>

      </div>

      {/* Emergency & Professional Help Modal */}
      {showHelpModal && (
        <div 
          id="help-modal-overlay"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            id="help-modal-content"
            className="w-full max-w-xl frosted-glass-card rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl flex flex-col gap-5 text-white relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Canales de Asistencia y Escucha
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Atención gratuita, confidencial y profesional ante crisis de salud mental
                  </p>
                </div>
              </div>
              <button
                id="btn-close-help-modal"
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {EMERGENCY_CONTACTS.map((contact, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-indigo-200">
                      {contact.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-500/30">
                      {contact.phone}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {contact.description}
                  </p>
                  <span className="text-[11px] text-slate-400 italic">
                    Disponibilidad: {contact.availability}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-300 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-200 leading-relaxed">
                <strong className="text-white block mb-0.5">En la escuela o comunidad:</strong>
                Podés acudir a tutores, docentes de confianza, personal del gabinete pedagógico/psicológico o a cualquier centro de salud pública (CAPS/hospitales). Pedir ayuda es un acto de cuidado.
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
