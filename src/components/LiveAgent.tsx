import React, { useState, useEffect, useRef } from 'react';
import { SUGGESTIONS, IMMERSION_CURRICULUM } from '../constants';
import NycMap, { MapMarker, RouteInfo } from './NycMap';
import { NycSubwayMap } from './NycSubwayMap';
import { getAccessToken } from '../services/firebaseAuth';
import { parseAndRenderEmojis } from './VoyagerEmoji';

import { ProgressDashboard } from './ProgressDashboard';
import { RoadmapPanel } from './RoadmapPanel';
import { TeacherInsightsPanel } from './TeacherInsightsPanel';
import { SettingsPanel } from './SettingsPanel';
import voyagerRobot from '../assets/images/voyager_robot_1783082204380.png';
import chatAvatarIcon from '../assets/images/voyager_pixel_avatar_1784465509169.jpg';
import { Compass, MapPin, Languages, Sparkles, ArrowLeft, ArrowRight, Headphones, MessageSquare, User, Settings, Apple, Home, Pause, Play } from 'lucide-react';

import { ChatMessage, Lead, TravelDestination, PronunciationFeedbackEvent, ConversationEvent } from './LiveAgentTypes';
import { TRAVEL_PRESETS } from './TravelPresets';
import { translations, getTranslatedMessageText } from './Translations';
import { CONVERSATION_MODES, ConversationMode } from './ConversationModes';
import { useConversationEngine } from './useConversationEngine';

const modeDetails = [
  {
    id: 'SPANISH',
    nameEs: 'Español',
    nameEn: 'Spanish',
    descEs: 'Conversación puramente en español.',
    descEn: 'Conversation purely in Spanish.',
    icon: 'MessageSquare',
    tagEs: 'Español',
    tagEn: 'Spanish',
    bg: 'hover:bg-black/5'
  },
  {
    id: 'BILINGUAL',
    nameEs: 'Bilingüe',
    nameEn: 'Bilingual',
    descEs: 'Responde primero en español y luego repite en inglés.',
    descEn: 'Responds first in Spanish, then repeats in English.',
    icon: 'Sparkles',
    tagEs: 'Recomendado',
    tagEn: 'Recommended',
    bg: 'hover:bg-black/5'
  },
  {
    id: 'AMERICAN_ENGLISH',
    nameEs: 'Inglés',
    nameEn: 'English',
    descEs: 'Responde y conversa estrictamente en inglés.',
    descEn: 'Responds and converses strictly in English.',
    icon: 'Compass',
    tagEs: 'Práctica Avanzada',
    tagEn: 'Advanced Practice',
    bg: 'hover:bg-black/5'
  },
  {
    id: 'LIVE_TRANSLATOR',
    nameEs: 'Traductor',
    nameEn: 'Translator',
    descEs: 'Traduce instantáneamente entre inglés y español.',
    descEn: 'Translates instantly between English and Spanish.',
    icon: 'Languages',
    tagEs: 'Traducción en vivo',
    tagEn: 'Live translation',
    bg: 'hover:bg-black/5'
  },
  {
    id: 'LISTEN_ONLY',
    nameEs: 'Escucha',
    nameEn: 'Listen Only',
    descEs: 'Escucha y ofrece correcciones por texto sin hablar.',
    descEn: 'Listens and provides text-only tips without speaking.',
    icon: 'Headphones',
    tagEs: 'Solo Escuchar',
    tagEn: 'Listen & Observe',
    bg: 'hover:bg-black/5'
  }
];

const getModeExplanationText = (mode: ConversationMode, lang: 'EN' | 'ES'): string => {
  if (lang === 'EN') {
    switch (mode) {
      case 'SPANISH':
        return "Spanish Mode. We will converse strictly in Spanish.";
      case 'BILINGUAL':
        return "Bilingual Mode. I will respond to you in Spanish and repeat my answer in English to help you learn.";
      case 'AMERICAN_ENGLISH':
        return "English Immersion Mode. We will speak strictly in English. This is perfect for advanced practice!";
      case 'LIVE_TRANSLATOR':
        return "Translator Mode. Speak in either English or Spanish, and I will translate it instantly for you.";
      case 'LISTEN_ONLY':
        return "Listen Only Mode. I will listen to you and provide helpful tips and corrections in the text chat without speaking.";
      default:
        return "";
    }
  } else {
    switch (mode) {
      case 'SPANISH':
        return "Modo Español. Conversaremos estrictamente en español.";
      case 'BILINGUAL':
        return "Modo Bilingüe. Te responderé primero en español y luego repetiré la respuesta en inglés para ayudarte a aprender.";
      case 'AMERICAN_ENGLISH':
        return "Modo de Inmersión en Inglés. Hablaremos strictly en inglés. ¡Es perfecto para una práctica avanzada!";
      case 'LIVE_TRANSLATOR':
        return "Modo Traductor. Habla en inglés o español, y yo lo traducirá instantáneamente para ti.";
      case 'LISTEN_ONLY':
        return "Modo Escucha. Te escucharé y te daré consejos y correcciones por chat de texto sin interrumpirte hablando.";
      default:
        return "";
    }
  }
};

const sphereParticles = [
  { top: '15%', left: '32%', size: '1.5px', delay: '0s', duration: '1.2s' },
  { top: '18%', left: '68%', size: '2px', delay: '0.3s', duration: '1.5s' },
  { top: '28%', left: '22%', size: '1px', delay: '0.7s', duration: '1s' },
  { top: '22%', left: '48%', size: '2.5px', delay: '0.1s', duration: '1.8s' },
  { top: '32%', left: '78%', size: '1.5px', delay: '0.5s', duration: '1.3s' },
  { top: '42%', left: '18%', size: '2px', delay: '0.9s', duration: '1.6s' },
  { top: '38%', left: '46%', size: '1px', delay: '0.2s', duration: '1.1s' },
  { top: '48%', left: '62%', size: '2px', delay: '0.4s', duration: '1.4s' },
  { top: '52%', left: '28%', size: '1.5px', delay: '0.6s', duration: '1.2s' },
  { top: '58%', left: '82%', size: '1px', delay: '0.8s', duration: '1.7s' },
  { top: '68%', left: '22%', size: '2.5px', delay: '0.3s', duration: '1.9s' },
  { top: '62%', left: '52%', size: '1.5px', delay: '0s', duration: '1.3s' },
  { top: '72%', left: '72%', size: '2px', delay: '0.5s', duration: '1.5s' },
  { top: '78%', left: '38%', size: '1px', delay: '0.7s', duration: '1s' },
  { top: '72%', left: '18%', size: '1.5px', delay: '0.2s', duration: '1.2s' },
  { top: '82%', left: '58%', size: '2px', delay: '0.4s', duration: '1.4s' },
  
  // Extra dense particles for connected active state
  { top: '50%', left: '50%', size: '3px', delay: '0.1s', duration: '0.8s', connectedOnly: true },
  { top: '46%', left: '36%', size: '2px', delay: '0.5s', duration: '1.1s', connectedOnly: true },
  { top: '54%', left: '64%', size: '2.5px', delay: '0.2s', duration: '0.9s', connectedOnly: true },
  { top: '36%', left: '54%', size: '1.5px', delay: '0.7s', duration: '1.2s', connectedOnly: true },
  { top: '64%', left: '46%', size: '2px', delay: '0.3s', duration: '1s', connectedOnly: true },
  { top: '30%', left: '42%', size: '1px', delay: '0s', duration: '1.4s', connectedOnly: true },
  { top: '70%', left: '58%', size: '1.5px', delay: '0.6s', duration: '1.3s', connectedOnly: true },
  { top: '40%', left: '30%', size: '2px', delay: '0.8s', duration: '1.1s', connectedOnly: true },
  { top: '60%', left: '70%', size: '2.5px', delay: '0.4s', duration: '0.9s', connectedOnly: true },
  { top: '24%', left: '34%', size: '1px', delay: '0.5s', duration: '1.6s', connectedOnly: true },
  { top: '76%', left: '66%', size: '1.5px', delay: '0.1s', duration: '1.2s', connectedOnly: true },
];

const renderModeIcon = (iconName: string) => {
  switch (iconName) {
    case 'Sparkles':
      return <Sparkles className="w-5 h-5 text-yellow-600" />;
    case 'Compass':
      return <Compass className="w-5 h-5 text-blue-600" />;
    case 'Languages':
      return <Languages className="w-5 h-5 text-emerald-600" />;
    case 'Headphones':
      return <Headphones className="w-5 h-5 text-purple-600" />;
    default:
      return <MessageSquare className="w-5 h-5 text-zinc-600" />;
  }
};

interface LiveAgentProps {
  isWidgetMode?: boolean;
  onClose?: () => void;
}

const LiveAgent: React.FC<LiveAgentProps> = ({ isWidgetMode = false, onClose }) => {
  const {
    isConnected,
    statusText,
    isPaused,
    secondsElapsed,
    volume,
    error,
    setError,
    selectedLang,
    setSelectedLang,
    isListenOnly,
    setIsListenOnly,
    isTranslateMode,
    setIsTranslateMode,
    isBilingualMode,
    setIsBilingualMode,
    isSpanishOnlyMode,
    setIsSpanishOnlyMode,
    isEnglishOnlyMode,
    setIsEnglishOnlyMode,
    scores,
    setScores,
    learnedWords,
    setLearnedWords,
    accentPatterns,
    setAccentPatterns,
    pronunciationEvents,
    chatMessages,
    setChatMessages,
    addUserMessage,
    connect,
    disconnect,
    sendText,
    pause,
    resume,
  } = useConversationEngine();

  const [rightPanelTab, setRightPanelTab] = useState<'home' | 'chat' | 'roadmap' | 'teachers' | 'progress' | 'settings'>('home');
  const [hasClickedConnect, setHasClickedConnect] = useState<boolean>(false);
  const [chosenStartMode, setChosenStartMode] = useState<ConversationMode | null>('SPANISH');
  const [explanationCountdown, setExplanationCountdown] = useState<number | null>(null);
  const [showReviewScreen, setShowReviewScreen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isFadingMascot, setIsFadingMascot] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Leads inline form states
  const [inlineFormStep, setInlineFormStep] = useState<'details' | 'services'>('details');
  const [inlineLeadForm, setInlineLeadForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    meetingTime: '',
    consent: false
  });
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  const [selectedCalendarTime, setSelectedCalendarTime] = useState<string>('09:00');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isSubmittingInlineLead, setIsSubmittingInlineLead] = useState<boolean>(false);
  const [inlineLeadError, setInlineLeadError] = useState<string | null>(null);
  const [inlineLeadSuccess, setInlineLeadSuccess] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Voice TTS Helper
  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    
    // Attempt to find a male Spanish voice in the browser if available
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => 
      v.lang.toLowerCase().startsWith('es') && 
      (v.name.toLowerCase().includes('jorge') || v.name.toLowerCase().includes('pablo') || v.name.toLowerCase().includes('carlos') || v.name.toLowerCase().includes('diego') || v.name.toLowerCase().includes('miguel') || v.name.toLowerCase().includes('male'))
    ) || voices.find(v => 
      v.lang.toLowerCase().startsWith('es') && 
      (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('premium'))
    ) || voices.find(v => v.lang.toLowerCase().startsWith('es'));
    
    if (esVoice) {
      utterance.voice = esVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  // Connect Click handler
  const handleConnectClick = () => {
    setIsFadingMascot(true);
    setTimeout(() => {
      setHasClickedConnect(true);
      setRightPanelTab('chat');
      setChosenStartMode(null);
      setExplanationCountdown(null);
      setIsFadingMascot(false);
    }, 400);
  };

  // Mode click handler
  const handleModeSelection = (modeId: ConversationMode) => {
    setChosenStartMode(modeId);
  };

  // Helper to apply mode to Hook state
  const applyChosenMode = (mode: ConversationMode) => {
    switch (mode) {
      case 'BILINGUAL':
        setIsBilingualMode(true);
        break;
      case 'AMERICAN_ENGLISH':
        setIsEnglishOnlyMode(true);
        break;
      case 'LIVE_TRANSLATOR':
        setIsTranslateMode(true);
        break;
      case 'LISTEN_ONLY':
        setIsListenOnly(true);
        break;
      case 'SPANISH':
        setIsSpanishOnlyMode(true);
        break;
    }
  };

  // Continua Click handler
  const handleContinuaClick = () => {
    const modeToUse = chosenStartMode || 'SPANISH';
    window.speechSynthesis.cancel();
    setRightPanelTab('chat');
    setHasInteracted(true);
    applyChosenMode(modeToUse);
    setExplanationCountdown(null);
    connect(undefined, true); // Voice Connection
  };

  // Start Conversation trigger
  const handleStartConversation = () => {
    setExplanationCountdown(null);
    setHasInteracted(true);
    window.speechSynthesis.cancel();
    connect(undefined, true); // Voice Connection
  };

  // Countdown timer effect
  useEffect(() => {
    if (explanationCountdown === null) return;
    if (explanationCountdown <= 0) {
      handleStartConversation();
      return;
    }
    const timer = setTimeout(() => {
      setExplanationCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [explanationCountdown]);

  // Disconnect handler
  const handleDisconnectClick = () => {
    disconnect();
    window.speechSynthesis.cancel();
    setHasClickedConnect(false);
    setHasInteracted(false);
    setChosenStartMode(null);
    setRightPanelTab('home');
    setExplanationCountdown(null);
    setShowReviewScreen(false);
  };

  // End Session handler
  const handleEndSessionClick = () => {
    disconnect();
    window.speechSynthesis.cancel();
    setHasClickedConnect(false);
    setHasInteracted(false);
    setChosenStartMode(null);
    setRightPanelTab('home');
    setExplanationCountdown(null);
    setShowReviewScreen(false);
  };

  // Text message send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    addUserMessage(inputText);
    sendText(inputText);
    setInputText('');
  };

  // Suggestion pill click
  const handleSuggestionClick = (text: string) => {
    setHasInteracted(true);
    addUserMessage(text);
    sendText(text);
  };

  // Lead submit
  const handleInlineLeadSubmit = async () => {
    setIsSubmittingInlineLead(true);
    setInlineLeadError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInlineLeadSuccess(true);
    } catch (err: any) {
      setInlineLeadError(err.message || "Error saving practice log.");
    } finally {
      setIsSubmittingInlineLead(false);
    }
  };

  // Connect to Gemini proxy
  const connectToGemini = (prompt?: string, isVoice: boolean = false) => {
    connect(prompt, isVoice);
  };

  // Days in month helper for calendar
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
    
    const days: (number | null)[] = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const placeholderText = selectedLang === 'EN' 
    ? 'Type your message or scenario...' 
    : 'Escribe tu mensaje o escenario...';

  return (
    <div 
      className="relative min-h-screen md:h-screen w-full bg-[#000000] flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-y-auto md:overflow-hidden select-none"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.035) 1px, transparent 0)',
        backgroundSize: '24px 24px'
      }}
    >
      {/* Layout Grid with 125% Passport, Adjusted Cover and Perfect Tight Gutter */}
      <div className="grid grid-cols-1 md:grid-cols-[1.25fr_1.66fr] gap-2.5 md:gap-3 w-full max-w-7xl max-h-full items-stretch justify-center md:aspect-[1.5]">
        
        {/* Left Side (Column 1): The Passport (Deep Navy Voyager Blue Console) */}
        {/* It remains CONSTANT throughout the entire session */}
        <div className="md:col-span-1 bg-gradient-to-b from-[#153166] to-[#0a1833] border border-[#2563eb]/20 rounded-[20px] sm:rounded-[24px] md:rounded-[32px] p-4 sm:p-6 md:p-10 flex flex-col justify-between items-center text-center shadow-[0_20px_50px_rgba(0,0,0,0.65)] relative overflow-hidden w-full h-full min-h-[380px] sm:min-h-[420px] md:min-h-0">
          {/* Ambient Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          {/* Header Text */}
          <div className="space-y-2 pt-6">
            <span style={{ letterSpacing: '0.45em' }} className="text-xs font-bold text-slate-400 uppercase tracking-widest block font-sans">
              {selectedLang === 'EN' ? 'I AM' : 'YO SOY'}
            </span>
            <h1 style={{ fontFamily: '"American Typewriter", "Courier New", Courier, Georgia, serif !important', textShadow: '0 4px 15px rgba(0,0,0,0.8)' }} className="text-4xl md:text-5xl font-black text-white tracking-[0.1em] uppercase block leading-none">
              VOYAGER
            </h1>
            <h1 style={{ fontFamily: '"American Typewriter", "Courier New", Courier, Georgia, serif !important', textShadow: '0 4px 15px rgba(0,0,0,0.8)' }} className="text-4xl md:text-5xl font-black text-white tracking-[0.1em] uppercase block leading-none mt-2">
              USA
            </h1>
            <span style={{ letterSpacing: '0.15em' }} className="text-[10px] md:text-xs font-mono font-bold text-gray-400 tracking-wider uppercase block mt-4">
              {selectedLang === 'EN' ? 'YOUR PASSPORT TO AMERICAN ENGLISH' : 'TU PASAPORTE AL INGLES AMERICANO'}
            </span>
          </div>

          {/* Glowing Golden Energy Sphere */}
          <div className="relative flex items-center justify-center my-auto py-8">
            {/* Ambient gold glow under the sphere */}
            <div className={`absolute w-36 h-36 rounded-full bg-amber-500/10 blur-xl transition-all duration-1000 ${hasClickedConnect ? 'scale-125 bg-amber-500/20' : 'animate-pulse'}`} />
            
            {/* The gold dust ring/sphere */}
            <div 
              className={`w-[180px] h-[180px] rounded-full transition-all duration-1000 relative flex items-center justify-center overflow-hidden ${
                hasClickedConnect 
                  ? 'bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.25)_0%,rgba(245,158,11,0.5)_50%,rgba(251,191,36,0.85)_80%,rgba(0,0,0,0)_100%)] shadow-[0_0_50px_rgba(245,158,11,0.4),_inset_0_0_30px_rgba(251,191,36,0.6)]'
                  : 'bg-[radial-gradient(circle_at_center,rgba(11,21,38,0.95)_35%,rgba(245,158,11,0.5)_65%,rgba(251,191,36,0.9)_85%,rgba(0,0,0,0)_100%)] shadow-[0_0_35px_rgba(245,158,11,0.3),_inset_0_0_20px_rgba(245,158,11,0.5)] animate-pulse'
              }`}
            >
              {/* Rotating particle overlays */}
              <div className={`absolute inset-0 rounded-full border border-dashed border-amber-500/25 ${hasClickedConnect ? 'animate-[spin_15s_linear_infinite]' : 'animate-[spin_30s_linear_infinite]'}`} />
              <div className={`absolute inset-2 rounded-full border border-dotted border-yellow-500/30 ${hasClickedConnect ? 'animate-[spin_8s_linear_infinite_reverse]' : 'animate-[spin_15s_linear_infinite_reverse]'}`} />
              <div className="absolute inset-4 rounded-full border border-dashed border-amber-400/10 animate-[spin_45s_linear_infinite]" />

              {/* Glowing Particle Sparks precisely placed like gold dust */}
              {sphereParticles.map((p, idx) => {
                if (p.connectedOnly && !hasClickedConnect) return null;
                return (
                  <span
                    key={idx}
                    style={{
                      top: p.top,
                      left: p.left,
                      width: p.size,
                      height: p.size,
                      animationDelay: p.delay,
                      animationDuration: p.duration,
                    }}
                    className="absolute rounded-full bg-yellow-300 animate-pulse shadow-[0_0_4px_rgba(251,191,36,0.8)] opacity-90"
                  />
                );
              })}
            </div>
          </div>

          {/* Bottom Button Panel */}
          <div className="pb-8 w-full z-10 flex flex-col items-center">
              {!hasClickedConnect ? (
                  <button
                      onClick={handleConnectClick}
                      className="px-7 py-3 bg-white hover:bg-slate-50 text-black font-extrabold font-mono tracking-[0.15em] uppercase rounded-full transition-all duration-300 cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:scale-[1.02] active:scale-95 text-xs md:text-sm min-w-[150px]"
                  >
                      {selectedLang === 'EN' ? 'ENTER' : 'ENTRADA'}
                  </button>
              ) : isConnected ? (
                  <div className="flex flex-col items-center w-full">
                      <button
                          onClick={handleEndSessionClick}
                          className="px-7 py-3 bg-white hover:bg-slate-50 text-black font-extrabold font-mono tracking-[0.15em] uppercase rounded-full transition-all duration-300 cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:shadow-[0_0_35px_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-95 text-xs md:text-sm min-w-[150px]"
                      >
                          {selectedLang === 'EN' ? 'FINISH' : 'FINALIZAR'}
                      </button>
                      
                      {/* Session duration indicator */}
                      <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold tracking-widest uppercase text-[#10b981] mt-4">
                          <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                          <span className="text-slate-300">
                              {selectedLang === 'EN' 
                                  ? `SESSION (${Math.floor(secondsElapsed / 60)}:${(secondsElapsed % 60).toString().padStart(2, '0')})` 
                                  : `SESIÓN (${Math.floor(secondsElapsed / 60)}:${(secondsElapsed % 60).toString().padStart(2, '0')})`}
                          </span>
                      </div>
                  </div>
              ) : (
                  <button
                      onClick={() => {
                          if (chosenStartMode) {
                              handleContinuaClick();
                          } else {
                              setRightPanelTab('home');
                          }
                      }}
                      className="px-7 py-3 bg-white hover:bg-slate-50 text-black font-extrabold font-mono tracking-[0.15em] uppercase rounded-full transition-all duration-300 cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:scale-[1.02] active:scale-95 text-xs md:text-sm min-w-[150px]"
                  >
                      {selectedLang === 'EN' ? 'SELECT' : 'SELECCIONA'}
                  </button>
              )}
          </div>
        </div>

        {/* Column 2 (Right Panel): The Cover Page (Cream layout) */}
        <div className="md:col-span-1 bg-[#f5efe6] border border-[#dfc389]/10 rounded-[20px] sm:rounded-[24px] md:rounded-[32px] flex flex-col justify-between items-center text-center shadow-[0_15px_35px_rgba(0,0,0,0.15)] relative overflow-hidden w-full h-full min-h-[420px] sm:min-h-[480px] md:min-h-0">
          {!hasClickedConnect ? (
            /* Disconnected Landing Screen inside the Cover */
            <>
              {/* Mascot in Center */}
              <div className="flex-1 flex items-center justify-center py-6 w-full relative z-10">
                <img 
                  src="https://cdn.gamma.app/e61o72b77sp71e0/edited-images/xOsepr1r0_Xzzbxf.png" 
                  alt="Voyager USA Mascot" 
                  referrerPolicy="no-referrer"
                  className="w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[350px] md:h-[350px] object-contain animate-float-zero-g filter drop-shadow-[0_20px_25px_rgba(0,0,0,0.12)]" 
                />
              </div>

              {/* Footer Text */}
              <div className="pb-8 z-10 px-4">
                <p style={{ fontFamily: '"Lato", sans-serif' }} className="text-xs md:text-sm font-medium text-black">
                  © 2026 Yo Soy Voger USA. All rights reserved. Derechos reservados
                </p>
              </div>
            </>
          ) : (
            /* Connected Workspace Area inside the Cover */
            <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Header / Tabs */}
            <div className="w-full bg-[#ebd5a3] py-2 sm:py-3.5 px-3 sm:px-6 flex items-center justify-center relative flex-shrink-0">
                <div className="grid grid-cols-4 gap-2 sm:gap-6 justify-items-center w-full md:w-auto max-w-xs sm:max-w-md">
                    <div className="flex flex-col items-center justify-center text-center group cursor-pointer w-full" onClick={() => setRightPanelTab('home')}>
                        <button 
                            title={selectedLang === 'EN' ? 'Home' : 'Inicio'}
                            aria-label={selectedLang === 'EN' ? 'Home' : 'Inicio'}
                            className={`w-9 h-9 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center ${
                                rightPanelTab === 'home' 
                                    ? 'bg-red-600 text-white shadow-md scale-105 group-hover:bg-red-600' 
                                    : 'bg-[#9c6b21] text-white hover:bg-red-600 group-hover:bg-red-600 shadow-sm'
                            }`}
                        >
                            <Home className="w-4.5 h-4.5 text-white" />
                        </button>
                        <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[8pt] tracking-wider uppercase mt-1 transition-colors duration-300 whitespace-nowrap text-black ${rightPanelTab === 'home' ? 'font-extrabold' : 'font-bold'}`}>
                            {selectedLang === 'EN' ? 'HOME' : 'INICIO'}
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center group cursor-pointer w-full" onClick={() => setRightPanelTab('chat')}>
                        <button 
                            title={selectedLang === 'EN' ? 'Chat' : 'Chat'}
                            aria-label={selectedLang === 'EN' ? 'Chat' : 'Chat'}
                            className={`w-9 h-9 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center ${
                                rightPanelTab === 'chat' 
                                    ? 'bg-red-600 text-white shadow-md scale-105 group-hover:bg-red-600' 
                                    : 'bg-[#9c6b21] text-white hover:bg-red-600 group-hover:bg-red-600 shadow-sm'
                            }`}
                        >
                            <MessageSquare className="w-4.5 h-4.5 text-white" />
                        </button>
                        <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[8pt] tracking-wider uppercase mt-1 transition-colors duration-300 whitespace-nowrap text-black ${rightPanelTab === 'chat' ? 'font-extrabold' : 'font-bold'}`}>
                            CHAT
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center group cursor-pointer w-full" onClick={() => setRightPanelTab('teachers')}>
                        <button 
                            title={selectedLang === 'EN' ? 'Teacher' : 'La Profe'}
                            aria-label={selectedLang === 'EN' ? 'Teacher' : 'La Profe'}
                            className={`w-9 h-9 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center ${
                                rightPanelTab === 'teachers' 
                                    ? 'bg-red-600 text-white shadow-md scale-105 group-hover:bg-red-600' 
                                    : 'bg-[#9c6b21] text-white hover:bg-red-600 group-hover:bg-red-600 shadow-sm'
                            }`}
                        >
                            <Apple className="w-4.5 h-4.5 text-white" />
                        </button>
                        <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[8pt] tracking-wider uppercase mt-1 transition-colors duration-300 whitespace-nowrap text-black ${rightPanelTab === 'teachers' ? 'font-extrabold' : 'font-bold'}`}>
                            {selectedLang === 'EN' ? 'TEACHER' : 'LA PROFE'}
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center group cursor-pointer w-full" onClick={() => setRightPanelTab('roadmap')}>
                        <button 
                            title={selectedLang === 'EN' ? 'Profile' : 'Perfil'}
                            aria-label={selectedLang === 'EN' ? 'Profile' : 'Perfil'}
                            className={`w-9 h-9 rounded-full transition-all duration-300 cursor-pointer flex items-center justify-center ${
                                rightPanelTab === 'roadmap' 
                                    ? 'bg-red-600 text-white shadow-md scale-105 group-hover:bg-red-600' 
                                    : 'bg-[#9c6b21] text-white hover:bg-red-600 group-hover:bg-red-600 shadow-sm'
                            }`}
                        >
                            <User className="w-4.5 h-4.5 text-white" />
                        </button>
                        <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[8pt] tracking-wider uppercase mt-1 transition-colors duration-300 whitespace-nowrap text-black ${rightPanelTab === 'roadmap' ? 'font-extrabold' : 'font-bold'}`}>
                            {selectedLang === 'EN' ? 'PROFILE' : 'PERFIL'}
                        </span>
                    </div>
                </div>

                {/* Fixed Settings Gear on far right */}
                <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 flex items-center">
                    <button 
                        onClick={() => setRightPanelTab('settings')}
                        title={selectedLang === 'EN' ? 'Settings' : 'Configura'}
                        aria-label={selectedLang === 'EN' ? 'Settings' : 'Configura'}
                        className="p-1 cursor-pointer flex items-center justify-center transition-all duration-300 group"
                    >
                        <Settings className={`w-9 h-9 transition-all duration-300 ${
                            rightPanelTab === 'settings' 
                                ? 'text-red-600 rotate-90 scale-110' 
                                : 'text-[#9c6b21] hover:text-red-600 group-hover:text-red-600'
                        }`} />
                    </button>
                </div>
            </div>


                {showReviewScreen ? (
                    <div className="flex-1 flex flex-col justify-between p-6 animate-fade-in bg-zinc-950 tab-content-area">
                        <div className="text-center mb-4">
                            <span className="text-xs tracking-widest uppercase text-yellow-500 font-mono">PROGRESO</span>
                            <h3 className="text-lg text-white font-bold uppercase tracking-wider mt-1">Estadísticas de tu Interacción</h3>
                        </div>
                        
                        <div className="flex-1 flex justify-center items-center overflow-hidden">
                            <div className="w-full max-w-[95%] md:max-w-[75%] transform scale-95 md:scale-75 origin-center my-auto">
                                <ProgressDashboard 
                                    selectedLang={selectedLang}
                                    scores={scores}
                                    learnedWords={learnedWords}
                                    accentPatterns={accentPatterns}
                                    onAskVoyager={(text) => {
                                        setShowReviewScreen(false);
                                        setChatMessages([
                                          {
                                            id: 'welcome_1',
                                            sender: 'splash',
                                            text: translations[selectedLang].welcomeMsg,
                                            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                            timeMs: Date.now()
                                          }
                                        ]);
                                        connectToGemini(text, false);
                                    }}
                                />
                            </div>
                        </div>

                    </div>
                ) : (
                    <>
                        {(hasInteracted || rightPanelTab === 'chat') && (
                            <div className="w-full bg-transparent py-3 sm:py-4 px-2 sm:px-6 flex items-center justify-center flex-shrink-0 z-10">
                                {rightPanelTab === 'chat' && (
                                    <div className="flex items-center justify-between sm:justify-evenly w-full max-w-5xl gap-2 sm:gap-4 flex-wrap sm:flex-nowrap px-1 sm:px-2">
                                        {/* 1. Pause / Resume Button */}
                                        <div className="relative group/tooltip flex items-center justify-center">
                                            <button 
                                                onClick={() => {
                                                    if (isPaused) {
                                                        resume();
                                                        if (window.speechSynthesis && window.speechSynthesis.paused) {
                                                            window.speechSynthesis.resume();
                                                        }
                                                    } else {
                                                        pause();
                                                        if (window.speechSynthesis && window.speechSynthesis.speaking) {
                                                            window.speechSynthesis.pause();
                                                        }
                                                    }
                                                }}
                                                title={isPaused ? (selectedLang === 'EN' ? 'Resume chat' : 'Reanuda el chat') : (selectedLang === 'EN' ? 'Pause chat' : 'Pausa el chat')}
                                                aria-label={isPaused ? (selectedLang === 'EN' ? 'Resume chat' : 'Reanuda el chat') : (selectedLang === 'EN' ? 'Pause chat' : 'Pausa el chat')}
                                                className="flex items-center justify-center cursor-pointer p-1 select-none transition-colors duration-200"
                                            >
                                                {isPaused ? (
                                                    <Play className="w-5 h-5 fill-current text-red-600 hover:text-red-700 transition-colors" />
                                                ) : (
                                                    <Pause className="w-5 h-5 fill-current text-[#9c6b21] hover:text-red-600 transition-colors" />
                                                )}
                                            </button>

                                            {/* Hover Info Pop-up */}
                                            <div className="absolute bottom-full mb-2 hidden group-hover/tooltip:flex flex-col items-center pointer-events-none z-50 transition-opacity duration-200 whitespace-nowrap">
                                                <div className="bg-[#1b4079] text-white text-[11pt] font-sans px-3 py-1.5 rounded-lg shadow-xl border border-yellow-500/40 text-center leading-tight">
                                                    {isPaused 
                                                        ? (selectedLang === 'EN' ? 'Resume chat' : 'Reanuda el chat')
                                                        : (selectedLang === 'EN' ? 'Pause chat' : 'Pausa el chat')
                                                    }
                                                </div>
                                                <div className="w-2 h-2 -mt-1 bg-[#1b4079] rotate-45 border-r border-b border-yellow-500/40"></div>
                                            </div>
                                        </div>

                                        {/* 2. Spanish Option Toggle */}
                                        <button 
                                            onClick={() => setIsSpanishOnlyMode(!isSpanishOnlyMode)}
                                            style={{ fontFamily: "'Lato', sans-serif" }}
                                            className="flex items-center gap-1.5 cursor-pointer group py-1 select-none"
                                        >
                                            <span className={`w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200 ${
                                                isSpanishOnlyMode 
                                                ? 'bg-red-600' 
                                                : 'bg-[#9c6b21] group-hover:bg-red-600'
                                            }`} />
                                            <span className={`text-[8pt] tracking-wider uppercase whitespace-nowrap transition-colors ${
                                                isSpanishOnlyMode ? 'text-red-600 font-extrabold' : 'text-[#9c6b21] font-bold group-hover:text-red-600'
                                            }`}>
                                                {selectedLang === 'EN' ? 'SPANISH' : 'ESPAÑOL'}
                                            </span>
                                        </button>

                                        {/* 3. Bilingual Option Toggle */}
                                        <button 
                                            onClick={() => setIsBilingualMode(!isBilingualMode)}
                                            style={{ fontFamily: "'Lato', sans-serif" }}
                                            className="flex items-center gap-1.5 cursor-pointer group py-1 select-none"
                                        >
                                            <span className={`w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200 ${
                                                isBilingualMode 
                                                ? 'bg-red-600' 
                                                : 'bg-[#9c6b21] group-hover:bg-red-600'
                                            }`} />
                                            <span className={`text-[8pt] tracking-wider uppercase whitespace-nowrap transition-colors ${
                                                isBilingualMode ? 'text-red-600 font-extrabold' : 'text-[#9c6b21] font-bold group-hover:text-red-600'
                                            }`}>
                                                BILINGÜE
                                            </span>
                                        </button>

                                        {/* 4. English Option Toggle */}
                                        <button 
                                            onClick={() => setIsEnglishOnlyMode(!isEnglishOnlyMode)}
                                            style={{ fontFamily: "'Lato', sans-serif" }}
                                            className="flex items-center gap-1.5 cursor-pointer group py-1 select-none"
                                        >
                                            <span className={`w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200 ${
                                                isEnglishOnlyMode 
                                                ? 'bg-red-600' 
                                                : 'bg-[#9c6b21] group-hover:bg-red-600'
                                            }`} />
                                            <span className={`text-[8pt] tracking-wider uppercase whitespace-nowrap transition-colors ${
                                                isEnglishOnlyMode ? 'text-red-600 font-extrabold' : 'text-[#9c6b21] font-bold group-hover:text-red-600'
                                            }`}>
                                                {selectedLang === 'EN' ? 'ENGLISH' : 'INGLÉS'}
                                            </span>
                                        </button>

                                        {/* 5. Translate / Translator Option Toggle */}
                                        <button 
                                            onClick={() => setIsTranslateMode(!isTranslateMode)}
                                            style={{ fontFamily: "'Lato', sans-serif" }}
                                            className="flex items-center gap-1.5 cursor-pointer group py-1 select-none"
                                        >
                                            <span className={`w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200 ${
                                                isTranslateMode 
                                                ? 'bg-red-600' 
                                                : 'bg-[#9c6b21] group-hover:bg-red-600'
                                            }`} />
                                            <span className={`text-[8pt] tracking-wider uppercase whitespace-nowrap transition-colors ${
                                                isTranslateMode ? 'text-red-600 font-extrabold' : 'text-[#9c6b21] font-bold group-hover:text-red-600'
                                            }`}>
                                                {selectedLang === 'EN' ? 'TRANSLATOR' : 'TRADUCTOR'}
                                            </span>
                                        </button>

                                        {/* 6. Listen Only Option Toggle */}
                                        <button 
                                            onClick={() => setIsListenOnly(!isListenOnly)}
                                            style={{ fontFamily: "'Lato', sans-serif" }}
                                            className="flex items-center gap-1.5 cursor-pointer group py-1 select-none"
                                        >
                                            <span className={`w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200 ${
                                                isListenOnly 
                                                ? 'bg-red-600' 
                                                : 'bg-[#9c6b21] group-hover:bg-red-600'
                                            }`} />
                                            <span className={`text-[8pt] tracking-wider uppercase whitespace-nowrap transition-colors ${
                                                isListenOnly ? 'text-red-600 font-extrabold' : 'text-[#9c6b21] font-bold group-hover:text-red-600'
                                            }`}>
                                                {selectedLang === 'EN' ? 'LISTEN' : 'ESCUCHA'}
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {rightPanelTab === 'home' ? (
                            <div className="flex-grow flex flex-col justify-between items-center text-center p-6 h-full animate-fade-in tab-content-area">
                                <div className="flex-1 flex items-center justify-center py-6 w-full relative z-10">
                                    <img 
                                      src="https://cdn.gamma.app/e61o72b77sp71e0/edited-images/xOsepr1r0_Xzzbxf.png" 
                                      alt="Voyager USA Mascot" 
                                      referrerPolicy="no-referrer"
                                      className="w-[280px] h-[280px] md:w-[350px] md:h-[350px] object-contain animate-float-zero-g filter drop-shadow-[0_20px_25px_rgba(0,0,0,0.12)]" 
                                    />
                                </div>
                                <div className="pb-8 z-10 px-4">
                                    <p style={{ fontFamily: '"Lato", sans-serif' }} className="text-xs md:text-sm font-medium text-black">
                                      © 2026 Yo Soy Voger USA. All rights reserved. Derechos reservados
                                    </p>
                                </div>
                            </div>
                        ) : rightPanelTab === 'chat' ? (
                            <div className="flex-grow flex flex-col overflow-hidden h-full">
                                {!hasInteracted ? (
                                    <div className="flex-grow flex flex-col justify-center items-center overflow-y-auto p-4 md:p-6 tab-content-area h-full">
                                        <div className="w-full max-w-2xl mx-auto flex flex-col justify-start p-2 sm:p-4 animate-fade-in">
                                            {/* Header */}
                                            <div className="text-center mb-5 md:mb-6 flex flex-col items-center">
                                                <h2 className="text-2xl md:text-3xl font-bold text-black leading-tight">
                                                    {selectedLang === 'EN' ? 'Welcome to USA Voyager!' : '¡Bienvenido a USA Voyager!'}
                                                </h2>
                                                <p className="text-[10pt] text-black font-serif mt-1.5 max-w-lg mx-auto" style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }}>
                                                    {selectedLang === 'EN' 
                                                        ? 'Choose your preferred conversation mode below to start practicing.' 
                                                        : 'Selecciona el modo de conversación que prefieras para comenzar tu práctica.'}
                                                </p>
                                            </div>

                                            {/* Main grid: Mascot on Left, Modes on Right */}
                                            <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] md:grid-cols-[210px_1fr] gap-4 md:gap-6 items-center w-full">
                                                {/* Left: Mascot */}
                                                <div className="flex items-center justify-center">
                                                    <img 
                                                        src="https://cdn.gamma.app/e61o72b77sp71e0/edited-images/xOsepr1r0_Xzzbxf.png" 
                                                        alt="Voyager USA Mascot" 
                                                        referrerPolicy="no-referrer"
                                                        className="w-[160px] sm:w-[180px] md:w-[210px] object-contain drop-shadow-md" 
                                                    />
                                                </div>

                                                {/* Right: Modes list & CONECTA button */}
                                                <div className="flex flex-col items-center sm:items-start w-full">
                                                    <div className="w-full">
                                                        {modeDetails.map((mode) => {
                                                            const name = selectedLang === 'EN' ? mode.nameEn : mode.nameEs;
                                                            const desc = selectedLang === 'EN' ? mode.descEn : mode.descEs;
                                                            const effectiveMode = chosenStartMode || 'SPANISH';
                                                            const isSelected = effectiveMode === mode.id;

                                                            return (
                                                                <button
                                                                    key={mode.id}
                                                                    onClick={() => handleModeSelection(mode.id as ConversationMode)}
                                                                    className="w-full text-left py-2.5 px-1.5 flex items-start gap-3 transition-colors cursor-pointer rounded-lg group"
                                                                >
                                                                    <div className="mt-1.5 flex-shrink-0">
                                                                        <span className={`w-3.5 h-3.5 rounded-full flex-shrink-0 transition-all duration-200 block ${
                                                                            isSelected 
                                                                            ? 'bg-red-600' 
                                                                            : 'bg-[#9c6b21] group-hover:bg-red-600'
                                                                        }`} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <span className={`font-sans font-bold text-lg md:text-[1.18rem] block leading-tight transition-colors ${
                                                                            isSelected 
                                                                            ? 'text-red-600' 
                                                                            : 'text-[#9c6b21] group-hover:text-red-600'
                                                                        }`}>
                                                                            {name}
                                                                        </span>
                                                                        <p className="text-[10pt] text-black font-serif mt-0.5 leading-snug" style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }}>
                                                                            {desc}
                                                                        </p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {/* CONECTA Button styled as a pill button */}
                                                    <div className="mt-5 w-full flex justify-center sm:justify-start sm:pl-4">
                                                        <button 
                                                            id="home-mode-continua-btn"
                                                            onClick={handleContinuaClick}
                                                            className="group py-2.5 px-8 bg-[#9c6b21] hover:bg-red-600 text-white font-bold text-xs md:text-sm tracking-widest uppercase rounded-full transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center gap-2 min-w-[150px]"
                                                        >
                                                            <Sparkles className="w-4 h-4 text-white animate-pulse" />
                                                            <span style={{ fontFamily: "'Lato', sans-serif" }} className="text-white">
                                                                {selectedLang === 'EN' ? 'CONNECT' : 'CONECTA'}
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (

                                <div className="flex-1 p-4 pt-2 tab-content-area overflow-y-auto max-h-[310px] md:max-h-[390px]">
                                    <div className="min-h-full flex flex-col justify-end space-y-4">
                                        {chatMessages.map((msg, index) => {
                            if (msg.sender === 'system') {
                                return null;
                            }
                            if (msg.sender === 'user' && msg.text.startsWith('[')) {
                                return null;
                            }
                            if (isConnected && msg.id === 'welcome_1') {
                                return null;
                            }

                            const isUser = msg.sender === 'user';
                            
                            let showAvatar = true;
                            if (index > 0) {
                                let prevVisibleMsg = null;
                                for (let i = index - 1; i >= 0; i--) {
                                    const m = chatMessages[i];
                                    if (m.sender !== 'system' && !(isConnected && m.id === 'welcome_1')) {
                                        prevVisibleMsg = m;
                                        break;
                                    }
                                }
                                if (prevVisibleMsg && prevVisibleMsg.sender !== 'user') {
                                    showAvatar = false;
                                }
                            }

                            return (
                                <div key={msg.id} className={`flex items-start ${isUser ? 'justify-end' : 'justify-start'} gap-2.5 animate-fade-in`}>
                                    {!isUser && (
                                        <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-white border border-zinc-200/60 shadow-sm overflow-hidden p-1.5">
                                            {showAvatar ? (
                                                <img 
                                                    src={chatAvatarIcon} 
                                                    alt="Voyager Tutor" 
                                                    referrerPolicy="no-referrer"
                                                    className="w-full h-full object-cover rounded-full" 
                                                />
                                            ) : (
                                                <div className="w-full h-full" />
                                            )}
                                        </div>
                                    )}
                                    <div className={`max-w-[78%] flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                                        <div className={`
                                            px-4 py-2.5 rounded-2xl text-sm leading-snug shadow-md transition-all
                                            ${isUser 
                                                ? 'bg-gradient-to-br from-yellow-300/30 to-yellow-400/35 border border-yellow-200/20 backdrop-blur-md text-black rounded-tr-none font-normal' 
                                                : 'bg-zinc-100 border border-zinc-200/60 text-zinc-800 rounded-tl-none'
                                            }
                                        `}>
                                            <div className="chat-message-text whitespace-pre-line tracking-wider leading-snug">
                                                {(() => {
                                                    const rawText = getTranslatedMessageText(msg, selectedLang);
                                                    if (!isUser && rawText.includes(" / ")) {
                                                        const parts = rawText.split(" / ");
                                                        if (parts.length >= 2) {
                                                            return (
                                                                <>
                                                                    <div className="font-sans text-black leading-snug">{parseAndRenderEmojis(parts[0])}</div>
                                                                    <div className="chat-message-english text-blue-900 font-sans leading-snug mt-2">
                                                                        {parseAndRenderEmojis(parts.slice(1).join(" / "))}
                                                                    </div>
                                                                </>
                                                            );
                                                        }
                                                    }
                                                    return <div className="font-sans text-black leading-snug">{parseAndRenderEmojis(rawText)}</div>;
                                                })()}
                                            </div>
                                            
                                            {!isUser && msg.showForm && (
                                                <div className="border-t border-white/10 pt-3 mt-3 space-y-2.5">
                                                    {inlineLeadSuccess ? (
                                                        <div className="text-center py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl">
                                                                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                                                                {selectedLang === 'EN' ? "✓ Info Captured Successfully!" : "✓ ¡Datos Guardados Exitosamente!"}
                                                             </span>
                                                        </div>
                                                    ) : inlineFormStep === 'details' ? (
                                                        <>
                                                            <div className="grid grid-cols-2 gap-2.5">
                                                                <div>
                                                                    <label className="block text-[9px] font-bold tracking-wider text-neutral-400 mb-1">
                                                                        {selectedLang === 'EN' ? "Full Name *" : "Nombre Completo *"}
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={inlineLeadForm.name}
                                                                        onChange={(e) => setInlineLeadForm({...inlineLeadForm, name: e.target.value})}
                                                                        placeholder="e.g. Jane Doe"
                                                                        className="w-full px-3 py-1.5 bg-black/35 border border-white/10 hover:border-yellow-500 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:bg-black/55 transition-all min-h-[36px]"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="block text-[9px] font-bold tracking-wider text-neutral-400 mb-1">
                                                                        {selectedLang === 'EN' ? "Email Address *" : "Correo Electrónico *"}
                                                                    </label>
                                                                    <input
                                                                        type="email"
                                                                        value={inlineLeadForm.email}
                                                                        onChange={(e) => setInlineLeadForm({...inlineLeadForm, email: e.target.value})}
                                                                        placeholder="e.g. jane@company.com"
                                                                        className="w-full px-3 py-1.5 bg-black/35 border border-white/10 hover:border-yellow-500 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:bg-black/55 transition-all min-h-[36px]"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-2.5">
                                                                <div>
                                                                    <label className="block text-[9px] font-bold tracking-wider text-neutral-400 mb-1">
                                                                        {selectedLang === 'EN' ? "Company" : "Empresa"}
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={inlineLeadForm.company}
                                                                        onChange={(e) => setInlineLeadForm({...inlineLeadForm, company: e.target.value})}
                                                                        placeholder="e.g. Acme Corp"
                                                                        className="w-full px-3 py-1.5 bg-black/35 border border-white/10 hover:border-yellow-500 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:bg-black/55 transition-all min-h-[36px]"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[9px] font-bold tracking-wider text-neutral-400 mb-1">
                                                                        {selectedLang === 'EN' ? "Phone Number *" : "Número Telefónico *"}
                                                                    </label>
                                                                    <input
                                                                        type="tel"
                                                                        value={inlineLeadForm.phone}
                                                                        onChange={(e) => setInlineLeadForm({...inlineLeadForm, phone: e.target.value})}
                                                                        placeholder="e.g. +1 555-0199"
                                                                        className="w-full px-3 py-1.5 bg-black/35 border border-white/10 hover:border-yellow-500 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 focus:bg-black/55 transition-all min-h-[36px]"
                                                                    />
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <label className="block text-[9px] font-bold tracking-wider text-neutral-400 mb-1">
                                                                    Agendar Reunión
                                                                </label>
                                                                <div className="grid grid-cols-2 gap-2.5">
                                                                    <div className="relative">
                                                                        <div
                                                                            onClick={() => setShowCalendar(!showCalendar)}
                                                                            className="w-full px-3 py-1.5 bg-black/35 border border-white/10 hover:border-yellow-500 rounded-xl text-xs text-neutral-200 cursor-pointer focus:outline-none focus:border-yellow-500 focus:bg-black/55 transition-all min-h-[36px] flex items-center gap-2"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-yellow-500 flex-shrink-0">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
                                                                            </svg>
                                                                            <span className="truncate text-yellow-400 font-mono font-semibold">
                                                                                {inlineLeadForm.meetingTime 
                                                                                    ? new Date(inlineLeadForm.meetingTime).toLocaleDateString([], { dateStyle: 'medium' }) 
                                                                                    : "Seleccione Fecha"}
                                                                            </span>
                                                                        </div>

                                                                        {showCalendar && (
                                                                            <div className="absolute left-0 mt-1.5 p-3 w-[240px] bg-neutral-950 border border-white/10 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.95)] backdrop-blur-md z-50 text-white select-none">
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            const prev = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
                                                                                            setCalendarMonth(prev);
                                                                                        }}
                                                                                        className="p-1 hover:bg-white/10 rounded-lg text-yellow-400 cursor-pointer transition-all"
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                                                                        </svg>
                                                                                    </button>
                                                                                    <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-300">
                                                                                        {calendarMonth.toLocaleString([], { month: 'long', year: 'numeric' })}
                                                                                    </span>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => {
                                                                                            const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
                                                                                            setCalendarMonth(next);
                                                                                        }}
                                                                                        className="p-1 hover:bg-white/10 rounded-lg text-yellow-400 cursor-pointer transition-all"
                                                                                    >
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                                                                        </svg>
                                                                                    </button>
                                                                                </div>

                                                                                <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[8px] font-bold text-yellow-400">
                                                                                    <span>{selectedLang === 'EN' ? "MO" : "LU"}</span>
                                                                                    <span>{selectedLang === 'EN' ? "TU" : "MA"}</span>
                                                                                    <span>{selectedLang === 'EN' ? "WE" : "MI"}</span>
                                                                                    <span>{selectedLang === 'EN' ? "TH" : "JU"}</span>
                                                                                    <span>{selectedLang === 'EN' ? "FR" : "VI"}</span>
                                                                                    <span>{selectedLang === 'EN' ? "SA" : "SÁ"}</span>
                                                                                    <span>{selectedLang === 'EN' ? "SU" : "DO"}</span>
                                                                                </div>

                                                                                <div className="grid grid-cols-7 gap-1 text-center">
                                                                                    {getDaysInMonth(calendarMonth).map((day, idx) => {
                                                                                        if (day === null) {
                                                                                            return <div key={`empty-${idx}`} />;
                                                                                        }
                                                                                        const isSelected = selectedCalendarDay === day;
                                                                                        return (
                                                                                            <button
                                                                                                key={`day-${day}`}
                                                                                                type="button"
                                                                                                onClick={() => setSelectedCalendarDay(day)}
                                                                                                className={`w-6 h-6 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center cursor-pointer transition-all ${
                                                                                                    isSelected 
                                                                                                        ? 'bg-yellow-500 text-black shadow-[0_0_8px_rgba(234,179,8,0.6)]' 
                                                                                                        : 'hover:bg-white/10 text-neutral-300'
                                                                                                }`}
                                                                                            >
                                                                                                {day}
                                                                                            </button>
                                                                                        );
                                                                                    })}
                                                                                </div>

                                                                                <button
                                                                                    type="button"
                                                                                    disabled={selectedCalendarDay === null}
                                                                                    onClick={() => {
                                                                                        if (selectedCalendarDay !== null) {
                                                                                            const yr = calendarMonth.getFullYear();
                                                                                            const mo = String(calendarMonth.getMonth() + 1).padStart(2, '0');
                                                                                            const dy = String(selectedCalendarDay).padStart(2, '0');
                                                                                            const formatted = `${yr}-${mo}-${dy}T${selectedCalendarTime}:00Z`;
                                                                                            setInlineLeadForm({ ...inlineLeadForm, meetingTime: formatted });
                                                                                            setShowCalendar(false);
                                                                                        }
                                                                                    }}
                                                                                    className="w-full mt-3 py-1 bg-black border border-yellow-500/40 text-yellow-400 text-[9px] font-mono font-bold tracking-widest rounded-full cursor-pointer hover:bg-yellow-500 hover:text-black transition-all uppercase text-center disabled:opacity-30 disabled:pointer-events-none"
                                                                                >
                                                                                    CONFIRMAR
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="relative">
                                                                        <select
                                                                            value={selectedCalendarTime}
                                                                            onChange={(e) => {
                                                                                setSelectedCalendarTime(e.target.value);
                                                                                if (selectedCalendarDay !== null) {
                                                                                    const yr = calendarMonth.getFullYear();
                                                                                    const mo = String(calendarMonth.getMonth() + 1).padStart(2, '0');
                                                                                    const dy = String(selectedCalendarDay).padStart(2, '0');
                                                                                    const formatted = `${yr}-${mo}-${dy}T${e.target.value}:00Z`;
                                                                                    setInlineLeadForm(prev => ({ ...prev, meetingTime: formatted }));
                                                                                }
                                                                            }}
                                                                            className="w-full pl-9 pr-3 py-1.5 bg-black/35 border border-white/10 hover:border-yellow-500 rounded-xl text-xs text-yellow-400 font-mono focus:outline-none focus:border-yellow-500 focus:bg-black/55 transition-all min-h-[36px] cursor-pointer appearance-none"
                                                                        >
                                                                            <option value="09:00">09:00 AM</option>
                                                                            <option value="10:00">10:00 AM</option>
                                                                            <option value="11:00">11:00 AM</option>
                                                                            <option value="12:00">12:00 PM</option>
                                                                            <option value="13:00">01:00 PM</option>
                                                                            <option value="14:00">02:00 PM</option>
                                                                            <option value="15:00">03:00 PM</option>
                                                                            <option value="16:00">04:00 PM</option>
                                                                            <option value="17:00">05:00 PM</option>
                                                                        </select>
                                                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-yellow-500">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                                            </svg>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {inlineLeadError && (
                                                                <span className="text-[10px] text-red-500 font-bold block mt-2.5 pl-1">{inlineLeadError}</span>
                                                            )}

                                                            <div className="flex items-center gap-4 mt-2.5 pl-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!inlineLeadForm.name.trim() || !inlineLeadForm.email.trim() || !inlineLeadForm.phone.trim()) {
                                                                            setInlineLeadError(selectedLang === 'EN' ? "Name, email, and phone number are required." : "Se requiere nombre, correo y número telefónico.");
                                                                            return;
                                                                        }
                                                                        setInlineLeadError(null);
                                                                        setInlineFormStep('services');
                                                                    }}
                                                                    className="flex-shrink-0 w-auto px-4 py-1.5 bg-yellow-500 hover:bg-yellow-600 border-none text-[10px] font-mono font-bold tracking-widest rounded-full transition-all duration-300 cursor-pointer shadow-md active:scale-95 min-h-[26px] uppercase text-center inline-flex items-center justify-center text-black"
                                                                >
                                                                    SIGUIENTE
                                                                </button>
                                                                <div className="flex items-center gap-2 select-none cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        id="marketingConsent"
                                                                        checked={inlineLeadForm.consent}
                                                                        onChange={(e) => setInlineLeadForm({...inlineLeadForm, consent: e.target.checked})}
                                                                        className="w-4 h-4 rounded border-white/20 text-yellow-500 focus:ring-yellow-500 focus:ring-opacity-25 bg-black/30 cursor-pointer"
                                                                    />
                                                                    <label htmlFor="marketingConsent" className="text-[9px] font-bold tracking-wider text-neutral-300 cursor-pointer leading-tight">
                                                                        Enviarme la info
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="space-y-2">
                                                                <label className="block text-[9px] font-bold tracking-wider text-neutral-400 mb-1">
                                                                    Seleccione los Servicios de Interés
                                                                </label>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {[
                                                                        { id: "AI Voice Agent", labelEn: "AI Voice Agent & Call Automation", labelEs: "Agente de Voz IA" },
                                                                        { id: "CRM Integration", labelEn: "Custom CRM Integration", labelEs: "Integración CRM" },
                                                                        { id: "Marketing Roadmap", labelEn: "Local Marketing Roadmap", labelEs: "Plan de Marketing Local" },
                                                                        { id: "Marketing Automations", labelEn: "SMS & Email Automations", labelEs: "Automatizaciones SMS/Email" }
                                                                    ].map(srv => {
                                                                        const isChecked = selectedServices.includes(srv.id);
                                                                        return (
                                                                            <label key={srv.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-black/25 border border-white/10 hover:border-yellow-500/50 rounded-xl cursor-pointer transition-all select-none min-h-[36px] hover:bg-black/40">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isChecked}
                                                                                    onChange={(e) => {
                                                                                        if (e.target.checked) {
                                                                                            setSelectedServices([...selectedServices, srv.id]);
                                                                                        } else {
                                                                                            setSelectedServices(selectedServices.filter(s => s !== srv.id));
                                                                                        }
                                                                                    }}
                                                                                    className="w-4 h-4 rounded border-white/20 text-yellow-500 focus:ring-yellow-500 focus:ring-opacity-25 bg-black/30 cursor-pointer"
                                                                                />
                                                                                <span className="text-[10px] text-neutral-200 font-medium leading-tight">
                                                                                    {selectedLang === 'EN' ? srv.labelEn : srv.labelEs}
                                                                                </span>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {inlineLeadError && (
                                                                <span className="text-[10px] text-red-500 font-bold block mt-1">{inlineLeadError}</span>
                                                            )}

                                                            <div className="grid grid-cols-2 gap-2.5 mt-3 pt-2 border-t border-white/10">
                                                                <div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setInlineFormStep('details')}
                                                                        className="w-full py-1 bg-transparent border border-white/20 text-neutral-300 text-[10px] font-mono font-bold tracking-widest rounded-full transition-all hover:bg-white/5 min-h-[26px] uppercase text-center inline-flex items-center justify-center cursor-pointer"
                                                                    >
                                                                        ATRÁS
                                                                    </button>
                                                                </div>
                                                                <div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleInlineLeadSubmit}
                                                                        disabled={isSubmittingInlineLead}
                                                                        className="w-full px-3.5 py-1 bg-yellow-500 text-black border-none text-[10px] font-mono font-bold tracking-widest rounded-full transition-all duration-300 cursor-pointer shadow-md hover:bg-yellow-600 active:scale-95 disabled:opacity-50 min-h-[26px] uppercase text-center inline-flex items-center justify-center font-bold"
                                                                    >
                                                                        {isSubmittingInlineLead ? "ENVIANDO..." : "ENVIAR"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {/* Timestamp removed */}
                                    </div>
                                </div>
                            );
                        })}
                                <div ref={chatEndRef} />
                            </div>
                            </div>
                            )}
                            </div>
                        ) : rightPanelTab === 'roadmap' ? (
                            <RoadmapPanel
                                selectedLang={selectedLang}
                                learnedWordsCount={learnedWords.length}
                                grammarScore={scores.grammar}
                                pronunciationScore={scores.pronunciation}
                                scores={scores}
                                learnedWords={learnedWords}
                                accentPatterns={accentPatterns}
                                onAskVoyager={(text) => {
                                    setRightPanelTab('chat');
                                    handleSuggestionClick(text);
                                }}
                                onNavigateTab={(tab) => setRightPanelTab(tab)}
                            />
                        ) : rightPanelTab === 'teachers' ? (
                            <div className="flex-1 p-4 overflow-y-auto tab-content-area bg-[#FAF7F2]">
                                <TeacherInsightsPanel
                                    selectedLang={selectedLang}
                                    scores={scores}
                                    learnedWords={learnedWords}
                                    accentPatterns={accentPatterns}
                                />
                            </div>
                        ) : rightPanelTab === 'progress' ? (
                            <div className="flex-1 p-4 overflow-y-auto tab-content-area bg-[#f5efe6]">
                                <ProgressDashboard 
                                    selectedLang={selectedLang}
                                    scores={scores}
                                    learnedWords={learnedWords}
                                    accentPatterns={accentPatterns}
                                    onAskVoyager={(text) => {
                                        setRightPanelTab('chat');
                                        handleSuggestionClick(text);
                                    }}
                                />
                            </div>
                        ) : rightPanelTab === 'settings' ? (
                            <SettingsPanel
                                selectedLang={selectedLang}
                                setSelectedLang={setSelectedLang}
                                isListenOnly={isListenOnly}
                                setIsListenOnly={setIsListenOnly}
                                isTranslateMode={isTranslateMode}
                                setIsTranslateMode={setIsTranslateMode}
                                isBilingualMode={isBilingualMode}
                                setIsBilingualMode={setIsBilingualMode}
                                isSpanishOnlyMode={isSpanishOnlyMode}
                                setIsSpanishOnlyMode={setIsSpanishOnlyMode}
                                isEnglishOnlyMode={isEnglishOnlyMode}
                                setIsEnglishOnlyMode={setIsEnglishOnlyMode}
                            />
                        ) : null}

                    {!showReviewScreen && rightPanelTab === 'chat' && hasInteracted && (
                        <div className="px-4 pb-4 bg-transparent flex items-start gap-2.5 w-full">
                            <div className="w-10 flex-shrink-0 bg-transparent" />
                            <form onSubmit={handleSendMessage} className="flex-1 max-w-[78%] relative rounded-3xl transition-all bg-[#ebd5a3] border border-[#dfc389]">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder={placeholderText}
                                    className="w-full pl-5 pr-12 py-2.5 focus:outline-none transition-all min-h-[44px] border-none rounded-3xl bg-transparent text-[#231d17] placeholder:text-[#231d17]/60 font-serif text-[15px] chat-input-text"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputText.trim()}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center bg-transparent border-none outline-none text-[#231d17] hover:text-[#231d17]/80 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                                >
                                    <svg className="w-4.5 h-4.5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    )}
                </>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveAgent;
