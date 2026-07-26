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
import { ShoppingPanel } from './ShoppingPanel';
import voyagerRobot from '../assets/images/voyager_robot_1783082204380.png';
import chatAvatarIcon from '../assets/images/voyager_pixel_avatar_1784465509169.jpg';
import { Compass, MapPin, Languages, Sparkles, ArrowLeft, ArrowRight, Headphones, MessageSquare, User, Settings, Apple, Home, Pause, Play, Info, Shield, FileText, Bot, Eye, EyeOff, ShoppingCart, Briefcase, BookOpen, Luggage, Rocket, Check, UserCheck, Presentation, MessageSquareText, Plane, Sprout, Flower, TreeDeciduous, GraduationCap, Award } from 'lucide-react';

import { ChatMessage, Lead, TravelDestination, PronunciationFeedbackEvent, ConversationEvent } from './LiveAgentTypes';
import { TRAVEL_PRESETS } from './TravelPresets';
import { translations, getTranslatedMessageText } from './Translations';
import { CONVERSATION_MODES, ConversationMode } from './ConversationModes';
import { useConversationEngine } from './useConversationEngine';
import { ConversationModePolicy } from '../domain/ConversationModePolicy';

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
    hasInteracted,
    setHasInteracted,
  } = useConversationEngine();

  const [rightPanelTab, setRightPanelTab] = useState<'home' | 'chat' | 'roadmap' | 'teachers' | 'progress' | 'settings' | 'shopping'>('home');
  const [hasClickedConnect, setHasClickedConnect] = useState<boolean>(false);
  const [chosenStartMode, setChosenStartMode] = useState<ConversationMode | null>('SPANISH');
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [selectedGoal, setSelectedGoal] = useState<'PROFESSIONAL' | 'ESTUDIO' | 'VIAJANTE'>('PROFESSIONAL');
  const [selectedLevel, setSelectedLevel] = useState<'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO'>('INTERMEDIO');
  const [selectedProfSubGoal, setSelectedProfSubGoal] = useState<'CONSEGUIR_EMPLEO' | 'COMUNICARME_TRABAJO' | 'CRECER_PROFESIONAL'>('COMUNICARME_TRABAJO');
  const [selectedEstudioSubGoal, setSelectedEstudioSubGoal] = useState<'AYUDA_ACADEMICA' | 'PASAR_EXAMEN' | 'CONOCIMIENTO_GENERAL'>('AYUDA_ACADEMICA');
  const [selectedViajanteSubGoal, setSelectedViajanteSubGoal] = useState<'TURISMO' | 'NEGOCIOS' | 'CULTURA'>('TURISMO');
  const [userName, setUserName] = useState<string>('');
  const [userAge, setUserAge] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [explanationCountdown, setExplanationCountdown] = useState<number | null>(null);
  const [showReviewScreen, setShowReviewScreen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isFadingMascot, setIsFadingMascot] = useState<boolean>(false);
  const [activePolicyModal, setActivePolicyModal] = useState<'privacy' | 'terms' | 'copyright' | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const updateVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

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

  // Particle visualizer canvas refs & loop
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const volumeRef = useRef(0);
  volumeRef.current = volume;
  const reminderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastVisitedTabRef = useRef<string>('');

  useEffect(() => {
    let animationFrameId: number;
    let time = 0;

    // Initialize 1400 ring particles concentrated in a band (yellow cab)
    const numParticles = 1400;
    const particles: { angle: number; r: number; speed: number; pulsePhase: number; size: number }[] = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        angle: Math.random() * 2 * Math.PI,
        // Bell-curve concentration around radius 64 (56 * 1.15)
        r: 52 + Math.random() * 21 + (Math.random() - 0.5) * 9,
        speed: (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
        pulsePhase: Math.random() * 2 * Math.PI,
        size: (0.6 + Math.random() * 1.4) * 1.25
      });
    }

    // Initialize orbiting circles (moons) rotating around the oval
    const numOrbiters = 8;
    const orbiters: { angle: number; speed: number; rx: number; ry: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < numOrbiters; i++) {
      let rxFactor = 1.35 + (i % 3) * 0.12;
      let ryFactor = 1.0 + (i % 3) * 0.08;
      orbiters.push({
        angle: (i * 2 * Math.PI) / numOrbiters + Math.random() * 0.5,
        speed: (0.007 + (i % 3) * 0.005) * (i % 2 === 0 ? 1 : -1),
        rx: 63 * rxFactor,
        ry: 63 * ryFactor,
        size: (1.8 + (i % 4) * 0.6) * 1.25,
        alpha: 0.55 + (i % 3) * 0.12
      });
    }

    const renderLoop = () => {
      const canvas = particleCanvasRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const scale = width / 360;
      const currentVolume = volumeRef.current;

      ctx.clearRect(0, 0, width, height);

      // Reset shadow blur to avoid applying it to background elements
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      // Draw solid background circle (color: #50411a) in the center of the orb
      ctx.beginPath();
      ctx.arc(centerX, centerY, (71 + currentVolume * 0.15) * scale, 0, 2 * Math.PI);
      ctx.fillStyle = '#50411a';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();

      // Radial background glow (gold)
      let grad = ctx.createRadialGradient(centerX, centerY, 11.5 * scale, centerX, centerY, (69 + currentVolume * 0.65) * scale);
      grad.addColorStop(0, 'rgba(255, 223, 0, 0.45)');
      grad.addColorStop(0.5, 'rgba(255, 215, 0, 0.18)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, (109 + currentVolume * 0.5) * scale, 0, 2 * Math.PI);
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 86 * scale, 63 * scale, 0, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.15)';
      ctx.lineWidth = 4 * scale;
      ctx.stroke();

      // Shimmering dust particles
      time += 1;
      for (let i = 0; i < numParticles; i++) {
        let p = particles[i];
        let speedMultiplier = 1.0 + (currentVolume * 0.08);
        p.angle += p.speed * speedMultiplier;

        let radialJitter = Math.sin(p.pulsePhase + time * 0.05) * (1.2 + currentVolume * 0.08);
        let volumeJitter = (Math.random() - 0.5) * (currentVolume * 0.5);
        let finalRadius = (p.r + radialJitter + volumeJitter) * scale;

        p.pulsePhase += 0.02;

        let px = centerX + Math.cos(p.angle) * finalRadius * 1.35;
        let py = centerY + Math.sin(p.angle) * finalRadius * 1.0;
        let opacity = 0.35 + Math.sin(p.pulsePhase + i) * 0.25 + (Math.random() * 0.25);
        
        ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
        ctx.fillRect(px, py, p.size * scale, p.size * scale);
      }

      // Orbiting circles
      for (let i = 0; i < numOrbiters; i++) {
        let orb = orbiters[i];
        let speedMultiplier = 1.0 + (currentVolume * 0.08);
        orb.angle += orb.speed * speedMultiplier;

        let radialJitter = (Math.random() - 0.5) * (currentVolume * 0.35);
        let finalRx = (orb.rx + radialJitter) * scale;
        let finalRy = (orb.ry + radialJitter) * scale;

        let ox = centerX + Math.cos(orb.angle) * finalRx;
        let oy = centerY + Math.sin(orb.angle) * finalRy;

        ctx.beginPath();
        ctx.arc(ox, oy, orb.size * scale, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(255, 215, 0, ${orb.alpha})`;
        ctx.shadowBlur = (6 + (currentVolume / 100) * 8) * scale;
        ctx.shadowColor = '#ffd700';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

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
    
    // Explicitly filter out any female voices to keep Voyager male
    const isFemaleVoice = (name: string) => {
      const lower = name.toLowerCase();
      return lower.includes('female') || 
             lower.includes('samantha') || 
             lower.includes('victoria') || 
             lower.includes('karen') || 
             lower.includes('tessa') || 
             lower.includes('veena') || 
             lower.includes('moira') || 
             lower.includes('fiona') || 
             lower.includes('susan') || 
             lower.includes('serena') || 
             lower.includes('hazel') || 
             lower.includes('zira') ||
             lower.includes('siri') ||
             lower.includes('kyoko');
    };

    // Attempt to find a male English/US voice for VOYAGER's American-accented Spanish
    const voicesList = voices.length > 0 ? voices : (window.speechSynthesis ? window.speechSynthesis.getVoices() : []);
    const voyagerVoice = voicesList.find(v => 
      v.name.toLowerCase() === 'alex' && !isFemaleVoice(v.name)
    ) || voicesList.find(v => 
      v.lang.toLowerCase().startsWith('en') && 
      !isFemaleVoice(v.name) &&
      (v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('google us english') || v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('premium'))
    ) || voicesList.find(v => 
      v.lang.toLowerCase().startsWith('en') && 
      !isFemaleVoice(v.name) &&
      (v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('fred') || v.name.toLowerCase().includes('rishi') || v.name.toLowerCase().includes('google'))
    ) || voicesList.find(v => 
      v.lang.toLowerCase().startsWith('en-us') && !isFemaleVoice(v.name)
    ) || voicesList.find(v => 
      v.lang.toLowerCase().startsWith('en') && !isFemaleVoice(v.name)
    );
    
    if (voyagerVoice) {
      utterance.voice = voyagerVoice;
      utterance.lang = voyagerVoice.lang;
    } else {
      utterance.lang = 'es-ES';
    }
    
    utterance.rate = 1.05;
    utterance.pitch = 1.05;
    
    window.speechSynthesis.speak(utterance);
  };

  // Reminder timer to nudge the user after 4 seconds on welcome screen without clicking CONECTA
  const resetReminderTimer = () => {
    if (reminderTimerRef.current) {
      clearTimeout(reminderTimerRef.current);
    }
    
    reminderTimerRef.current = setTimeout(() => {
      if (!hasClickedConnect) {
        const reminderText = selectedLang === 'EN'
          ? "Remember to click the CONNECT button to start."
          : "Recuerda hacer clic en el botón CONECTA para comenzar.";
        
        if (isConnected) {
          sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following reminder message in your natural voice. Do not write any scores, tags, or explanations, just say this exact message clearly: "${reminderText}"]`);
        } else {
          speakText(reminderText);
        }
      }
    }, 4000);
  };

  useEffect(() => {
    if (!hasClickedConnect) {
      resetReminderTimer();
    } else {
      if (reminderTimerRef.current) {
        clearTimeout(reminderTimerRef.current);
        reminderTimerRef.current = null;
      }
    }
    return () => {
      if (reminderTimerRef.current) {
        clearTimeout(reminderTimerRef.current);
      }
    };
  }, [hasClickedConnect, isConnected, selectedLang]);

  // Speak explanation when arriving at the Teacher, Profile, or Settings section
  useEffect(() => {
    if (rightPanelTab === 'teachers' && lastVisitedTabRef.current !== 'teachers') {
      const speech = selectedLang === 'EN'
        ? "Welcome to the Teacher section! You have the option to hire Alejandra Francois, La Profe. She is our native bilingual Master English Immersion Coach and NYC Accent Specialist who can help you learn Spanish and English through personalized live 1-on-1 private lessons, accent correction, and direct chat support."
        : "¡Bienvenido a la sección de La Profe! Tienes la opción de contratar a Alejandra Francois, La Profe. Ella es nuestra Coach Maestra de Inmersión y Especialista en Acento de Nueva York, bilingüe nativa. Te ayudará a aprender español e inglés a través de clases particulares en vivo 1-a-1, corrección de pronunciación y soporte por chat.";

      if (isConnected && !isPaused) {
        sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following welcome message in your natural voice. Do not write any text in the transcript or chat, just speak this message: "${speech}"]`);
      } else {
        speakText(speech);
      }
    } else if (rightPanelTab === 'roadmap' && lastVisitedTabRef.current !== 'roadmap') {
      const speech = selectedLang === 'EN'
        ? "Welcome to your Profile space! Here you can edit your fluency goals, view your Google account authentication details, monitor your grammar and pronunciation scores, track your daily learning curriculum roadmap, and check your master instructor session logs."
        : "¡Bienvenido a tu sección de Perfil! Aquí puedes configurar tus metas de fluidez, revisar tu cuenta de Google, monitorear tus puntajes de gramática y pronunciación, seguir tu currículo diario de aprendizaje y ver el registro de tus clases particulares.";

      if (isConnected && !isPaused) {
        sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following welcome message in your natural voice. Do not write any text in the transcript or chat, just speak this message: "${speech}"]`);
      } else {
        speakText(speech);
      }
    } else if (rightPanelTab === 'settings' && lastVisitedTabRef.current !== 'settings') {
      const speech = selectedLang === 'EN'
        ? "Welcome to the Settings panel! Here you can configure the interface language, select translation and subtitle modes, toggle text-only listen-only mode, adjust voice speech rates, set your daily practice goals, and customize pedagogical feedback levels."
        : "¡Bienvenido al panel de Configuración! Aquí puedes configurar el idioma de la interfaz, elegir los modos de traducción y subtítulos, activar el modo de solo escucha sin audio, ajustar la velocidad de reproducción de voz de Voyager, establecer tus metas de práctica diarias y personalizar el nivel de feedback pedagógico.";

      if (isConnected && !isPaused) {
        sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following welcome message in your natural voice. Do not write any text in the transcript or chat, just speak this message: "${speech}"]`);
      } else {
        speakText(speech);
      }
    } else if (rightPanelTab === 'shopping' && lastVisitedTabRef.current !== 'shopping') {
      const speech = selectedLang === 'EN'
        ? "Welcome to the Shopping section! Here you can upgrade to a PRO account to unlock all lessons, book private 1-on-1 diagnostic sessions, or select monthly intensive coaching packages."
        : "¡Bienvenido a la sección de Compras! Aquí puedes actualizar tu cuenta a PRO para desbloquear todas las lecciones, reservar sesiones de diagnóstico individuales, o elegir paquetes de coaching intensivo mensual.";

      if (isConnected && !isPaused) {
        sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following welcome message in your natural voice. Do not write any text in the transcript or chat, just speak this message: "${speech}"]`);
      } else {
        speakText(speech);
      }
    }
    lastVisitedTabRef.current = rightPanelTab;
  }, [rightPanelTab, selectedLang, isConnected, isPaused]);

  // Connect Click handler
   const handleConnectClick = () => {
     setIsFadingMascot(true);
     setTimeout(() => {
       setHasClickedConnect(true);
       setOnboardingStep(1);
       setRightPanelTab('chat');
       setChosenStartMode(null);
       setExplanationCountdown(null);
       setIsFadingMascot(false);
       connect(undefined, true); // Voice Connection started immediately to speak mode explanations
       resetReminderTimer();
     }, 400);
   };

  // Mode click handler
  const handleModeSelection = (modeId: ConversationMode) => {
    setChosenStartMode(modeId);
    resetReminderTimer(); // Reset reminder timer so they get a fresh 15 seconds after selecting a mode
    
    // Speak explanation of the selected mode
    let explanation = '';
    if (selectedLang === 'EN') {
      switch (modeId) {
        case 'SPANISH':
          explanation = "In Spanish mode, we will chat mostly in Spanish to answer your questions and explain idioms.";
          break;
        case 'BILINGUAL':
          explanation = "In Bilingual mode, I will respond first in Spanish and then repeat in English to help you build connections.";
          break;
        case 'AMERICAN_ENGLISH':
          explanation = "In English mode, we will converse and practice strictly and only in American English.";
          break;
        case 'LIVE_TRANSLATOR':
          explanation = "In Translator mode, I will instantly translate whatever you say between English and Spanish.";
          break;
        case 'LISTEN_ONLY':
          explanation = "In Listen mode, I will listen to your pronunciation and provide silent text corrections without speaking.";
          break;
      }
    } else {
      switch (modeId) {
        case 'SPANISH':
          explanation = "En el modo español, conversaremos principalmente en español para responder tus preguntas y explicarte modismos.";
          break;
        case 'BILINGUAL':
          explanation = "En el modo bilingüe, te responderé primero en español y luego repetiré la idea en inglés para ayudarte a asociar ambos idiomas.";
          break;
        case 'AMERICAN_ENGLISH':
          explanation = "En el modo de inglés, conversaremos y practicaremos de forma estricta y únicamente en inglés americano.";
          break;
        case 'LIVE_TRANSLATOR':
          explanation = "En el modo traductor, traduciré de forma instantánea todo lo que digas entre inglés y español.";
          break;
        case 'LISTEN_ONLY':
          explanation = "En el modo de escucha, escucharé tu pronunciación y te ofreceré correcciones por texto de manera silenciosa.";
          break;
      }
    }
    
    if (explanation) {
      if (isConnected) {
        sendText(`[SYSTEM INSTRUCTION: Please speak aloud the following text in your natural voice. Do not write any scores, tags, or explanations, just say this phrase clearly: "${explanation}"]`);
      } else {
        speakText(explanation);
      }
    }
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

  const handleCompleteOnboarding = () => {
    const saved = localStorage.getItem('voyager_user_account');
     const getGoalText = () => {
       if (selectedGoal === 'PROFESSIONAL') {
         if (selectedProfSubGoal === 'CONSEGUIR_EMPLEO') return 'Professional: Conseguir Empleo';
         if (selectedProfSubGoal === 'COMUNICARME_TRABAJO') return 'Professional: Comunicarme en el Trabajo';
         return 'Professional: Crecer Profesionalmente';
       }
       if (selectedGoal === 'ESTUDIO') {
         if (selectedEstudioSubGoal === 'AYUDA_ACADEMICA') return 'Academic: Ayuda Académica';
         if (selectedEstudioSubGoal === 'PASAR_EXAMEN') return 'Academic: Pasar un Examen';
         return 'Academic: Conocimiento General';
       }
       if (selectedGoal === 'VIAJANTE') {
         if (selectedViajanteSubGoal === 'TURISMO') return 'Travel: Turismo';
         if (selectedViajanteSubGoal === 'NEGOCIOS') return 'Travel: Negocios';
         return 'Travel: Cultura';
       }
       return 'Travel & Daily Conversation';
     };
    let u = {
      name: userName.trim() || (selectedLang === 'EN' ? 'Learner' : 'Estudiante'),
      email: userEmail.trim() || 'learner@usavoyager.com',
      age: userAge.trim() ? parseInt(userAge.trim()) : undefined,
      provider: 'Guest' as const,
      goal: getGoalText(),
      levelEstimate: selectedLevel === 'PRINCIPIANTE' ? 'Beginner' : (selectedLevel === 'INTERMEDIO' ? 'Intermediate' : 'Advanced'),
      completedDays: [1],
      plan: 'FREE' as const
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        u = {
          ...parsed,
          goal: getGoalText(),
          levelEstimate: selectedLevel === 'PRINCIPIANTE' ? 'Beginner' : (selectedLevel === 'INTERMEDIO' ? 'Intermediate' : 'Advanced'),
        };
      } catch (e) {}
    }
    localStorage.setItem('voyager_user_account', JSON.stringify(u));
    handleContinuaClick();
  };

  // Continua Click handler
  const handleContinuaClick = () => {
    const modeToUse = chosenStartMode || 'SPANISH';
    window.speechSynthesis.cancel();
    setRightPanelTab('chat');
    setHasInteracted(true);
    applyChosenMode(modeToUse);
    setExplanationCountdown(null);
    setChatMessages([]); // Clear system option explanations from chat history
    
    if (isConnected) {
      // Trigger greeting prompt now that we have entered the chat section
      const greetingPrompt = ConversationModePolicy.getSystemInstructionsForMode(modeToUse, {
        selectedLang,
        userName,
        userAge
      });
      sendText(greetingPrompt);
    } else {
      connect(undefined, true);
    }
  };

  // Start Conversation trigger
  const handleStartConversation = () => {
    const modeToUse = chosenStartMode || 'SPANISH';
    setExplanationCountdown(null);
    setHasInteracted(true);
    window.speechSynthesis.cancel();
    setChatMessages([]); // Clear system option explanations from chat history
    
    if (isConnected) {
      applyChosenMode(modeToUse);
      // Trigger greeting prompt now that we have entered the chat section
      const greetingPrompt = ConversationModePolicy.getSystemInstructionsForMode(modeToUse, {
        selectedLang,
        userName,
        userAge
      });
      sendText(greetingPrompt);
    } else {
      connect(undefined, true);
    }
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

  const totalOnboardingSteps = 4;
  let currentStepIdx = 1;
  if (onboardingStep === 1) currentStepIdx = 1;
  else if (onboardingStep === 11 || onboardingStep === 12 || onboardingStep === 13) currentStepIdx = 2;
  else if (onboardingStep === 2) currentStepIdx = 3;
  else if (onboardingStep === 4) currentStepIdx = 4;
  const stepsLeft = totalOnboardingSteps - currentStepIdx;

  const handleOnboardingBack = () => {
    if (onboardingStep === 1) {
      setHasClickedConnect(false);
      setOnboardingStep(0);
    } else if (onboardingStep === 11 || onboardingStep === 12 || onboardingStep === 13) {
      setOnboardingStep(1);
    } else if (onboardingStep === 2) {
      if (selectedGoal === 'PROFESSIONAL') {
        setOnboardingStep(11);
      } else if (selectedGoal === 'ESTUDIO') {
        setOnboardingStep(12);
      } else if (selectedGoal === 'VIAJANTE') {
        setOnboardingStep(13);
      }
    } else if (onboardingStep === 4) {
      setOnboardingStep(2);
    } else if (onboardingStep === 3) {
      setOnboardingStep(2);
    }
  };

  const handleOnboardingNext = () => {
    if (onboardingStep === 1) {
      if (selectedGoal === 'PROFESSIONAL') {
        setOnboardingStep(11);
      } else if (selectedGoal === 'ESTUDIO') {
        setOnboardingStep(12);
      } else if (selectedGoal === 'VIAJANTE') {
        setOnboardingStep(13);
      }
    } else if (onboardingStep === 11 || onboardingStep === 12 || onboardingStep === 13) {
      setOnboardingStep(2);
    } else if (onboardingStep === 2) {
      setOnboardingStep(4);
    } else if (onboardingStep === 4) {
      handleCompleteOnboarding();
    } else if (onboardingStep === 3) {
      handleCompleteOnboarding();
    }
  };

  const handleJumpToStep = (stepNum: number) => {
    if (stepNum === 1) {
      setOnboardingStep(1);
    } else if (stepNum === 2) {
      if (selectedGoal === 'PROFESSIONAL') setOnboardingStep(11);
      else if (selectedGoal === 'ESTUDIO') setOnboardingStep(12);
      else if (selectedGoal === 'VIAJANTE') setOnboardingStep(13);
    } else if (stepNum === 3) {
      setOnboardingStep(2);
    } else if (stepNum === 4) {
      setOnboardingStep(4);
    }
  };

  const isFinalStep = onboardingStep === 4 || onboardingStep === 3;
  const nextTitle = isFinalStep 
      ? (selectedLang === 'EN' ? 'Connect' : 'Conecta') 
      : (selectedLang === 'EN' ? 'Next' : 'Siguiente');
  const nextBtnClasses = isFinalStep
      ? "w-9 h-9 rounded-full border-[3px] border-red-600 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 bg-transparent"
      : "w-9 h-9 rounded-full border-[3px] border-black/40 text-black/40 hover:bg-red-600 hover:text-white hover:border-red-600 flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 bg-transparent";

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
      <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-2.5 md:gap-3 w-full max-w-7xl max-h-full items-stretch justify-center md:aspect-[1.7]">
        
        {/* Left Side (Column 1): The Passport (Deep Navy Voyager Blue Console) */}
        {/* It remains CONSTANT throughout the entire session */}
        <div className="md:col-span-1 bg-gradient-to-b from-[#153166] to-[#0a1833] border border-[#2563eb]/20 rounded-[20px] sm:rounded-[24px] md:rounded-[32px] p-4 sm:p-6 md:p-10 flex flex-col justify-between items-center text-center shadow-[0_20px_50px_rgba(0,0,0,0.65)] relative overflow-hidden w-full h-full min-h-[380px] sm:min-h-[420px] md:min-h-0">
          {/* Ambient Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          {/* Header Text */}
          <div className="space-y-2 pt-6">
            <span style={{ fontFamily: '"Allerta Stencil", sans-serif', letterSpacing: '0.25em' }} className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest block">
              {selectedLang === 'EN' ? 'I AM USA' : 'YO SOY USA'}
            </span>
            <h1 style={{ fontFamily: '"Allerta Stencil", sans-serif', textShadow: '0 4px 15px rgba(0,0,0,0.8)', letterSpacing: '0.12em' }} className="text-5xl md:text-6xl font-black text-white mt-1.5 uppercase block leading-none">
              VOYAGER
            </h1>
            <span style={{ letterSpacing: '0.22em' }} className="text-[10px] md:text-xs text-yellow-400 font-mono uppercase block mt-2">
              {selectedLang === 'EN' ? 'AMERICAN ENGLISH TUTOR' : 'TUTOR DE INGLÉS AMERICANO'}
            </span>
          </div>

          {/* Glowing Golden Energy Sphere */}
          <div className="relative flex-grow flex-shrink min-h-0 w-full flex items-center justify-center pt-2 pb-8 md:pt-4 md:pb-12">
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-yellow-500/10 via-amber-500/15 to-orange-500/10 blur-3xl animate-pulse duration-[3000ms] pointer-events-none" />
            
            <div className="relative aspect-square max-h-full max-w-full flex items-center justify-center">
                <canvas 
                    ref={particleCanvasRef} 
                    width={720} 
                    height={720} 
                    className="z-20 transition-transform duration-75 animate-float-zero-g max-h-full max-w-full object-contain"
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
          </div>

          {/* Bottom Button Panel */}
          <div className="pb-8 md:pb-14 w-full z-10 flex flex-col items-center justify-center">
              {/* Main Action Button */}
              {!hasClickedConnect ? (
                  <button
                      onClick={handleConnectClick}
                      className="px-6 py-2.5 bg-white hover:bg-slate-50 text-black font-extrabold font-mono tracking-[0.15em] uppercase rounded-full transition-all duration-300 cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:scale-[1.02] active:scale-95 text-[10px] md:text-xs min-w-[128px]"
                  >
                      {translations[selectedLang].connect}
                  </button>
              ) : isConnected ? (
                  <button
                      onClick={handleEndSessionClick}
                      className="px-6 py-2.5 bg-white hover:bg-slate-50 text-black font-extrabold font-mono tracking-[0.15em] uppercase rounded-full transition-all duration-300 cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:shadow-[0_0_35px_rgba(255,255,255,0.25)] hover:scale-[1.02] active:scale-95 text-[10px] md:text-xs min-w-[155px] flex items-center justify-center gap-1.5"
                  >
                      <span>{selectedLang === 'EN' ? 'FINISH' : 'FINALIZAR'}</span>
                      <span className="opacity-75 font-sans font-normal text-[9px] md:text-[10px]">
                          ({Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')})
                      </span>
                  </button>
              ) : (
                  <button
                      onClick={handleContinuaClick}
                      className="px-6 py-2.5 bg-white hover:bg-slate-50 text-black font-extrabold font-mono tracking-[0.15em] uppercase rounded-full transition-all duration-300 cursor-pointer shadow-[0_0_25px_rgba(245,158,11,0.45)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:scale-[1.02] active:scale-95 text-[10px] md:text-xs min-w-[128px]"
                  >
                      {selectedLang === 'EN' ? 'SELECT' : 'SELECCIONA'}
                  </button>
              )}


          </div>
        </div>

        {/* Column 2 (Right Panel): The Cover Page (Cream layout) */}
        <div className="md:col-span-1 bg-neutral-300 border border-black/10 rounded-[20px] sm:rounded-[24px] md:rounded-[32px] flex flex-col justify-between items-center text-center shadow-[0_15px_35px_rgba(0,0,0,0.15)] relative overflow-hidden w-full h-full min-h-[420px] sm:min-h-[480px] md:min-h-0">
          {!hasClickedConnect ? (
            /* Disconnected Landing Screen inside the Cover */
            <>
              {/* Welcome text and start button */}
              <div className="w-full text-left px-6 sm:px-8 pt-8 z-10 flex flex-col items-start select-none">
                  <h2 style={{ fontFamily: "'Lato', sans-serif" }} className="text-xl md:text-2xl font-bold text-[#1A365D] leading-tight">
                      {selectedLang === 'EN' ? 'Welcome to USA Voyager!' : '¡Bienvenido a USA Voyager!'}
                  </h2>
                  <p className="text-[10.5pt] text-black/60 mt-1.5 max-w-lg" style={{ fontFamily: "'Lato', sans-serif" }}>
                      {selectedLang === 'EN' 
                          ? 'Let us customize your English immersion experience with a few quick questions.' 
                          : 'Personalizaremos tu experiencia de inmersión en inglés con unas breves preguntas.'}
                  </p>
                  <div className="pt-4 flex justify-start">
                      <button
                          onClick={handleConnectClick}
                          title={selectedLang === 'EN' ? 'Start' : 'Comenzar'}
                          className="w-9 h-9 rounded-full border-[3px] border-black/40 hover:bg-red-600 hover:text-white hover:border-red-600 text-black/40 flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 bg-transparent"
                      >
                          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                      </button>
                  </div>
              </div>

              <div className="flex-1 flex items-center justify-center py-4 w-full relative z-10">
                <img 
                  src={voyagerRobot} 
                  alt="Voyager USA Mascot" 
                  referrerPolicy="no-referrer"
                  onClick={handleConnectClick}
                  title={selectedLang === 'EN' ? 'Click to Connect' : 'Haz clic para conectar'}
                  className="w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] md:w-[380px] md:h-[380px] max-w-[95%] max-h-[45vh] object-contain animate-float-zero-g filter drop-shadow-[0_20px_25px_rgba(0,0,0,0.12)] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300" 
                />
              </div>

              {/* Footer Text */}
              <div className="pb-8 z-10 px-4 flex flex-col items-center flex-shrink-0 w-full">
                {/* Footer Buttons Row */}
                <div className="flex items-center justify-center gap-4 text-xs font-mono select-none">
                  {/* Copyright Button */}
                  <button 
                    onClick={() => setActivePolicyModal('copyright')}
                    className="flex items-center gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer"
                  >
                    <span style={{ fontSize: '1.65em', lineHeight: '1' }} className="font-normal">©</span>
                    <span>Copyright</span>
                  </button>

                  {/* Privacy Button */}
                  <button 
                    onClick={() => setActivePolicyModal('privacy')}
                    className="flex items-center gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Privacy</span>
                  </button>

                  {/* Terms Button */}
                  <button 
                    onClick={() => setActivePolicyModal('terms')}
                    className="flex items-center gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Terms</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Connected Workspace Area inside the Cover */
            <div className="w-full h-full flex flex-col overflow-hidden">
            {/* Header / Tabs */}
            {hasInteracted && (
              <div className="w-full bg-transparent py-2 sm:py-2.5 px-3 sm:px-6 flex flex-col items-center justify-center gap-1.5 relative flex-shrink-0 border-none">
                {/* Row 1: Main Menu & Controls */}
                <div className="w-full flex items-center justify-center relative">
                    {/* Settings Button */}
                    <div className="absolute -right-4 sm:-right-3 top-0.5">
                        <button 
                            onClick={() => setRightPanelTab('settings')}
                            title={selectedLang === 'EN' ? 'Settings' : 'Configura'}
                            aria-label={selectedLang === 'EN' ? 'Settings' : 'Configura'}
                            className="p-1 cursor-pointer flex items-center justify-center transition-all duration-300 group hover:scale-110 active:scale-95"
                        >
                            <Settings className={`w-[27px] h-[27px] transition-all duration-500 ease-in-out ${
                                rightPanelTab === 'settings' 
                                    ? 'text-red-600 rotate-90 scale-110 hover:rotate-[270deg]' 
                                    : 'text-black/65 hover:text-red-600 group-hover:text-red-600 hover:rotate-180'
                            }`} />
                        </button>
                    </div>
                    <div className="grid grid-cols-5 gap-2 sm:gap-6 justify-items-center w-full md:w-auto max-w-md sm:max-w-xl">
                    <div className="flex flex-col items-center justify-center text-center group cursor-pointer w-full" onClick={() => setRightPanelTab('home')}>
                        <button 
                            title={selectedLang === 'EN' ? 'Home' : 'Inicio'}
                            aria-label={selectedLang === 'EN' ? 'Home' : 'Inicio'}
                            className="p-1 cursor-pointer flex items-center justify-center transition-all duration-300"
                        >
                            <Home className={`w-6 h-6 transition-all duration-300 ${
                                rightPanelTab === 'home' 
                                    ? 'text-red-600 scale-110' 
                                    : 'text-black/65 group-hover:text-red-600 group-hover:scale-110'
                            }`} />
                        </button>
                        <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[8pt] tracking-wider uppercase mt-1 transition-colors duration-300 whitespace-nowrap ${
                            rightPanelTab === 'home' 
                                ? 'text-red-600 font-extrabold' 
                                : 'text-black/65 group-hover:text-red-600 font-bold'
                        }`}>
                            {selectedLang === 'EN' ? 'HOME' : 'INICIO'}
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center group cursor-pointer w-full" onClick={() => setRightPanelTab('chat')}>
                        <button 
                            title={selectedLang === 'EN' ? 'Chat' : 'Chat'}
                            aria-label={selectedLang === 'EN' ? 'Chat' : 'Chat'}
                            className="p-1 cursor-pointer flex items-center justify-center transition-all duration-300"
                        >
                            <MessageSquare className={`w-6 h-6 transition-all duration-300 ${
                                rightPanelTab === 'chat' 
                                    ? 'text-red-600 scale-110' 
                                    : 'text-black/65 group-hover:text-red-600 group-hover:scale-110'
                            }`} />
                        </button>
                        <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[8pt] tracking-wider uppercase mt-1 transition-colors duration-300 whitespace-nowrap ${
                            rightPanelTab === 'chat' 
                                ? 'text-red-600 font-extrabold' 
                                : 'text-black/65 group-hover:text-red-600 font-bold'
                        }`}>
                            {selectedLang === 'EN' ? 'CHAT' : 'CHAT'}
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center group cursor-pointer w-full" onClick={() => setRightPanelTab('teachers')}>
                        <button 
                            title={selectedLang === 'EN' ? 'Teacher' : 'La Profe'}
                            aria-label={selectedLang === 'EN' ? 'Teacher' : 'La Profe'}
                            className="p-1 cursor-pointer flex items-center justify-center transition-all duration-300"
                        >
                            <Apple className={`w-6 h-6 transition-all duration-300 ${
                                rightPanelTab === 'teachers' 
                                    ? 'text-red-600 scale-110' 
                                    : 'text-black/65 group-hover:text-red-600 group-hover:scale-110'
                            }`} />
                        </button>
                        <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[8pt] tracking-wider uppercase mt-1 transition-colors duration-300 whitespace-nowrap ${
                            rightPanelTab === 'teachers' 
                                ? 'text-red-600 font-extrabold' 
                                : 'text-black/65 group-hover:text-red-600 font-bold'
                        }`}>
                            {selectedLang === 'EN' ? 'TEACHER' : 'LA PROFE'}
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center group cursor-pointer w-full" onClick={() => setRightPanelTab('roadmap')}>
                        <button 
                            title={selectedLang === 'EN' ? 'Profile' : 'Perfil'}
                            aria-label={selectedLang === 'EN' ? 'Profile' : 'Perfil'}
                            className="p-1 cursor-pointer flex items-center justify-center transition-all duration-300"
                        >
                            <User className={`w-6 h-6 transition-all duration-300 ${
                                rightPanelTab === 'roadmap' 
                                    ? 'text-red-600 scale-110' 
                                    : 'text-black/65 group-hover:text-red-600 group-hover:scale-110'
                            }`} />
                        </button>
                        <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[8pt] tracking-wider uppercase mt-1 transition-colors duration-300 whitespace-nowrap ${
                            rightPanelTab === 'roadmap' 
                                ? 'text-red-600 font-extrabold' 
                                : 'text-black/65 group-hover:text-red-600 font-bold'
                        }`}>
                            {selectedLang === 'EN' ? 'PROFILE' : 'PERFIL'}
                        </span>
                    </div>

                    <div className="flex flex-col items-center justify-center text-center group cursor-pointer w-full" onClick={() => setRightPanelTab('shopping')}>
                        <button 
                            title={selectedLang === 'EN' ? 'Shopping' : 'Compras'}
                            aria-label={selectedLang === 'EN' ? 'Shopping' : 'Compras'}
                            className="p-1 cursor-pointer flex items-center justify-center transition-all duration-300"
                        >
                            <ShoppingCart className={`w-6 h-6 transition-all duration-300 ${
                                rightPanelTab === 'shopping' 
                                    ? 'text-red-600 scale-110' 
                                    : 'text-black/65 group-hover:text-red-600 group-hover:scale-110'
                            }`} />
                        </button>
                        <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[8pt] tracking-wider uppercase mt-1 transition-colors duration-300 whitespace-nowrap ${
                            rightPanelTab === 'shopping' 
                                ? 'text-red-600 font-extrabold' 
                                : 'text-black/65 group-hover:text-red-600 font-bold'
                        }`}>
                            {selectedLang === 'EN' ? 'SHOPPING' : 'COMPRAS'}
                        </span>
                    </div>
                </div>
                </div>

              </div>
            )}


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
                        {/* Old sub-header bar has been removed */}
                        {rightPanelTab === 'home' ? (
                            <div className="flex-grow flex flex-col justify-between items-center text-center p-6 h-full animate-fade-in tab-content-area">
                                <div className="flex-1 flex items-center justify-center py-6 w-full relative z-10">
                                    <img 
                                      src={voyagerRobot} 
                                      alt="Voyager USA Mascot" 
                                      referrerPolicy="no-referrer"
                                      className="w-[306px] h-[306px] md:w-[374px] md:h-[374px] max-w-[95%] max-h-[60vh] object-contain animate-float-zero-g filter drop-shadow-[0_20px_25px_rgba(0,0,0,0.12)]" 
                                    />
                                </div>
                                <div className="pb-8 z-10 px-4 flex flex-col items-center flex-shrink-0 w-full">
                                    {/* Footer Buttons Row */}
                                    <div className="flex items-center justify-center gap-4 text-xs font-mono select-none">
                                        {/* Copyright Button */}
                                        <button 
                                            onClick={() => setActivePolicyModal('copyright')}
                                            className="flex items-center gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer"
                                        >
                                            <span style={{ fontSize: '1.65em', lineHeight: '1' }} className="font-normal">©</span>
                                            <span>Copyright</span>
                                        </button>

                                        {/* Privacy Button */}
                                        <button 
                                            onClick={() => setActivePolicyModal('privacy')}
                                            className="flex items-center gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer"
                                        >
                                            <Shield className="w-4 h-4" />
                                            <span>Privacy</span>
                                        </button>

                                        {/* Terms Button */}
                                        <button 
                                            onClick={() => setActivePolicyModal('terms')}
                                            className="flex items-center gap-1.5 text-neutral-600 hover:text-black transition-colors duration-300 tracking-wider cursor-pointer"
                                        >
                                            <FileText className="w-4 h-4" />
                                            <span>Terms</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : rightPanelTab === 'chat' ? (
                            <div className="flex-grow flex flex-col overflow-hidden h-full">
                                {!hasInteracted ? (
                                    <div className="flex-grow flex flex-col justify-center items-center overflow-y-auto p-4 md:p-6 tab-content-area h-full select-none">
                                        <div className="w-full max-w-2xl mx-auto flex flex-col justify-start p-2 sm:p-4 animate-fade-in">
                                            {/* Main grid: Mascot on Left, Steps on Right */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-10 items-center w-full">
                                                {/* Left: Mascot */}
                                                <div className="flex items-center justify-center w-full">
                                                    <img 
                                                        src={voyagerRobot} 
                                                        alt="Voyager USA Mascot" 
                                                        referrerPolicy="no-referrer"
                                                        className="w-full max-w-[220px] md:max-w-[260px] object-contain drop-shadow-md animate-float-zero-g" 
                                                    />
                                                </div>

                                                {/* Right: Steps */}
                                                <div className="flex flex-col w-full text-left">
                                                    {/* Header */}
                                                    <div className="w-full text-left mb-6 flex flex-col items-start">
                                                         <h2 style={{ fontFamily: "'Lato', sans-serif" }} className="text-xl md:text-2xl font-bold text-[#1A365D] leading-tight">
                                                             {onboardingStep === 1 && (selectedLang === 'EN' ? 'What is your primary learning goal?' : '¿Cuál es tu objetivo de aprendizaje principal?')}
                                                             {onboardingStep === 11 && (selectedLang === 'EN' ? 'What is your professional goal?' : '¿Cuál es tu meta profesional?')}
                                                             {onboardingStep === 12 && (selectedLang === 'EN' ? 'What is your educational goal?' : '¿Cuál es tu meta educativa?')}
                                                             {onboardingStep === 13 && (selectedLang === 'EN' ? 'Reason you want to learn?' : '¿Razón por la que quieres aprender?')}
                                                             {onboardingStep === 2 && (selectedLang === 'EN' ? 'What is your estimated English level?' : '¿Cuál es tu nivel estimado de inglés?')}
                                                             {onboardingStep === 4 && (selectedLang === 'EN' ? 'Who do I have the pleasure of speaking with?' : '¿Con quién tengo el gusto?')}
                                                             {onboardingStep === 3 && (selectedLang === 'EN' ? 'Select your starting conversation mode:' : 'Selecciona tu modo de conversación para iniciar:')}
                                                         </h2>
                                                    </div>

                                                    {onboardingStep === 1 && (
                                                        <div className="space-y-3.5 w-full">
                                                            {[
                                                                { id: 'PROFESSIONAL', label: selectedLang === 'EN' ? 'PROFESSIONAL' : 'PROFESSIONAL', icon: Briefcase },
                                                                { id: 'ESTUDIO', label: selectedLang === 'EN' ? 'STUDY' : 'ESTUDIO', icon: BookOpen },
                                                                { id: 'VIAJANTE', label: selectedLang === 'EN' ? 'TRAVELER' : 'VIAJANTE', icon: Plane }
                                                            ].map((opt) => {
                                                                const IconComp = opt.icon;
                                                                const isSel = selectedGoal === opt.id;
                                                                return (
                                                                    <div 
                                                                        key={opt.id}
                                                                        onClick={() => setSelectedGoal(opt.id as any)}
                                                                        className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border-[3px] transition-all cursor-pointer select-none w-full shadow-xs ${
                                                                            isSel 
                                                                                ? 'border-red-600 bg-neutral-200/50' 
                                                                                : 'border-black/40 hover:border-neutral-800 bg-[#EAEAEA]/80'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-3.5">
                                                                            <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isSel ? 'bg-red-600 text-white' : 'bg-transparent text-black'}`}>
                                                                                <IconComp className="w-[18px] h-[18px] flex-shrink-0" />
                                                                            </div>
                                                                            <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[11px] font-extrabold tracking-wider ${isSel ? 'text-red-600' : 'text-black'}`}>
                                                                                {opt.label}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {onboardingStep === 11 && (
                                                        <div className="space-y-3.5 w-full">
                                                            {[
                                                                { id: 'CONSEGUIR_EMPLEO', label: selectedLang === 'EN' ? 'CONSEGUIR EMPLEO' : 'CONSEGUIR EMPLEO', icon: UserCheck },
                                                                { id: 'COMUNICARME_TRABAJO', label: selectedLang === 'EN' ? 'COMUNICARME EN EL TRABAJO' : 'COMUNICARME EN EL TRABAJO', icon: MessageSquareText },
                                                                { id: 'CRECER_PROFESIONAL', label: selectedLang === 'EN' ? 'CRECER PROFESIONALMENTE' : 'CRECER PROFESIONALMENTE', icon: Presentation }
                                                            ].map((opt) => {
                                                                const IconComp = opt.icon;
                                                                const isSel = selectedProfSubGoal === opt.id;
                                                                return (
                                                                    <div 
                                                                        key={opt.id}
                                                                        onClick={() => setSelectedProfSubGoal(opt.id as any)}
                                                                        className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border-[3px] transition-all cursor-pointer select-none w-full shadow-xs ${
                                                                            isSel 
                                                                                ? 'border-red-600 bg-neutral-200/50' 
                                                                                : 'border-black/40 hover:border-neutral-800 bg-[#EAEAEA]/80'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-3.5">
                                                                            <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isSel ? 'bg-red-600 text-white' : 'bg-transparent text-black'}`}>
                                                                                <IconComp className="w-[18px] h-[18px] flex-shrink-0" />
                                                                            </div>
                                                                            <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[11px] font-extrabold tracking-wider ${isSel ? 'text-red-600' : 'text-black'}`}>
                                                                                {opt.label}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {onboardingStep === 13 && (
                                                        <div className="space-y-3.5 w-full">
                                                            {[
                                                                { id: 'TURISMO', label: selectedLang === 'EN' ? 'TOURISM' : 'TURISMO', icon: Plane },
                                                                { id: 'NEGOCIOS', label: selectedLang === 'EN' ? 'BUSINESS' : 'NEGOCIOS', icon: Briefcase },
                                                                { id: 'CULTURA', label: selectedLang === 'EN' ? 'CULTURE' : 'CULTURA', icon: Languages }
                                                            ].map((opt) => {
                                                                const IconComp = opt.icon;
                                                                const isSel = selectedViajanteSubGoal === opt.id;
                                                                return (
                                                                    <div 
                                                                        key={opt.id}
                                                                        onClick={() => setSelectedViajanteSubGoal(opt.id as any)}
                                                                        className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border-[3px] transition-all cursor-pointer select-none w-full shadow-xs ${
                                                                            isSel 
                                                                                ? 'border-red-600 bg-neutral-200/50' 
                                                                                : 'border-black/40 hover:border-neutral-800 bg-[#EAEAEA]/80'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-3.5">
                                                                            <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isSel ? 'bg-red-600 text-white' : 'bg-transparent text-black'}`}>
                                                                                <IconComp className="w-[18px] h-[18px] flex-shrink-0" />
                                                                            </div>
                                                                            <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[11px] font-extrabold tracking-wider ${isSel ? 'text-red-600' : 'text-black'}`}>
                                                                                {opt.label}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {onboardingStep === 12 && (
                                                        <div className="space-y-3.5 w-full">
                                                            {[
                                                                { id: 'AYUDA_ACADEMICA', label: selectedLang === 'EN' ? 'ACADEMIC HELP' : 'AYUDA ACADÉMICA', icon: GraduationCap },
                                                                { id: 'PASAR_EXAMEN', label: selectedLang === 'EN' ? 'PASS AN EXAM' : 'PASAR UN EXAMEN', icon: Award },
                                                                { id: 'CONOCIMIENTO_GENERAL', label: selectedLang === 'EN' ? 'GENERAL KNOWLEDGE' : 'CONOCIMIENTO GENERAL', icon: Compass }
                                                            ].map((opt) => {
                                                                const IconComp = opt.icon;
                                                                const isSel = selectedEstudioSubGoal === opt.id;
                                                                return (
                                                                    <div 
                                                                        key={opt.id}
                                                                        onClick={() => setSelectedEstudioSubGoal(opt.id as any)}
                                                                        className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border-[3px] transition-all cursor-pointer select-none w-full shadow-xs ${
                                                                            isSel 
                                                                                ? 'border-red-600 bg-neutral-200/50' 
                                                                                : 'border-black/40 hover:border-neutral-800 bg-[#EAEAEA]/80'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-3.5">
                                                                            <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isSel ? 'bg-red-600 text-white' : 'bg-transparent text-black'}`}>
                                                                                <IconComp className="w-[18px] h-[18px] flex-shrink-0" />
                                                                            </div>
                                                                            <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[11px] font-extrabold tracking-wider ${isSel ? 'text-red-600' : 'text-black'}`}>
                                                                                {opt.label}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {onboardingStep === 2 && (
                                                        <div className="space-y-3.5 w-full">
                                                            {[
                                                                { id: 'PRINCIPIANTE', label: selectedLang === 'EN' ? 'BEGINNER' : 'PRINCIPIANTE', icon: Sprout },
                                                                { id: 'INTERMEDIO', label: selectedLang === 'EN' ? 'INTERMEDIATE' : 'INTERMEDIO', icon: Flower },
                                                                { id: 'AVANZADO', label: selectedLang === 'EN' ? 'ADVANCED' : 'AVANZADO', icon: TreeDeciduous }
                                                            ].map((opt) => {
                                                                const IconComp = opt.icon;
                                                                const isSel = selectedLevel === opt.id;
                                                                return (
                                                                    <div 
                                                                        key={opt.id}
                                                                        onClick={() => setSelectedLevel(opt.id as any)}
                                                                        className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border-[3px] transition-all cursor-pointer select-none w-full shadow-xs ${
                                                                            isSel 
                                                                                ? 'border-red-600 bg-neutral-200/50' 
                                                                                : 'border-black/40 hover:border-neutral-800 bg-[#EAEAEA]/80'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-3.5">
                                                                            <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isSel ? 'bg-red-600 text-white' : 'bg-transparent text-black'}`}>
                                                                                <IconComp className="w-[18px] h-[18px] flex-shrink-0" />
                                                                            </div>
                                                                            <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[11px] font-extrabold tracking-wider ${isSel ? 'text-red-600' : 'text-black'}`}>
                                                                                {opt.label}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {onboardingStep === 4 && (
                                                        <div className="space-y-4 w-full" style={{ fontFamily: "'Lato', sans-serif" }}>
                                                            <div className="flex flex-col gap-1.5">
                                                                <label className="text-[11px] font-extrabold tracking-wider text-black/60 uppercase">
                                                                    {selectedLang === 'EN' ? 'NAME' : 'NOMBRE'}
                                                                </label>
                                                                <input 
                                                                    type="text"
                                                                    value={userName}
                                                                    onChange={(e) => setUserName(e.target.value)}
                                                                    placeholder={selectedLang === 'EN' ? 'Your name' : 'Tu nombre'}
                                                                    className="w-full px-4 py-2.5 rounded-2xl border-[3px] border-black/40 bg-[#EAEAEA]/80 text-black font-semibold text-sm focus:border-red-600 focus:outline-none focus:bg-neutral-200/50 transition-all placeholder-black/30"
                                                                />
                                                            </div>

                                                            <div className="flex flex-col gap-1.5">
                                                                <label className="text-[11px] font-extrabold tracking-wider text-black/60 uppercase">
                                                                    {selectedLang === 'EN' ? 'AGE' : 'EDAD'}
                                                                </label>
                                                                <input 
                                                                    type="number"
                                                                    value={userAge}
                                                                    onChange={(e) => setUserAge(e.target.value)}
                                                                    placeholder={selectedLang === 'EN' ? 'Your age' : 'Tu edad'}
                                                                    min="1"
                                                                    max="120"
                                                                    className="w-full px-4 py-2.5 rounded-2xl border-[3px] border-black/40 bg-[#EAEAEA]/80 text-black font-semibold text-sm focus:border-red-600 focus:outline-none focus:bg-neutral-200/50 transition-all placeholder-black/30"
                                                                />
                                                            </div>

                                                            <div className="flex flex-col gap-1.5">
                                                                <label className="text-[11px] font-extrabold tracking-wider text-black/60 uppercase">
                                                                    {selectedLang === 'EN' ? 'EMAIL' : 'CORREO ELECTRÓNICO'}
                                                                </label>
                                                                <input 
                                                                    type="email"
                                                                    value={userEmail}
                                                                    onChange={(e) => setUserEmail(e.target.value)}
                                                                    placeholder={selectedLang === 'EN' ? 'your.email@example.com' : 'tu.correo@ejemplo.com'}
                                                                    className="w-full px-4 py-2.5 rounded-2xl border-[3px] border-black/40 bg-[#EAEAEA]/80 text-black font-semibold text-sm focus:border-red-600 focus:outline-none focus:bg-neutral-200/50 transition-all placeholder-black/30"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {onboardingStep === 3 && (
                                                        <div className="space-y-2.5 w-full">
                                                            {modeDetails.map((mode) => {
                                                                const name = selectedLang === 'EN' ? mode.nameEn : mode.nameEs;
                                                                const desc = selectedLang === 'EN' ? mode.descEn : mode.descEs;
                                                                const effectiveMode = chosenStartMode || 'SPANISH';
                                                                const isSel = effectiveMode === mode.id;

                                                                return (
                                                                    <div 
                                                                        key={mode.id}
                                                                        onClick={() => handleModeSelection(mode.id as ConversationMode)}
                                                                        className={`flex items-center justify-between px-3.5 py-2 rounded-xl border-[3px] transition-all cursor-pointer select-none w-full shadow-xs ${
                                                                            isSel 
                                                                                ? 'border-red-600 bg-neutral-200/50' 
                                                                                : 'border-black/40 hover:border-neutral-500 bg-[#EAEAEA]/80'
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-2">
                                                                            <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${isSel ? 'bg-red-600 text-white' : 'bg-transparent text-neutral-500'}`}>
                                                                                <MessageSquare className="w-[18px] h-[18px] flex-shrink-0" />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[11px] font-extrabold tracking-wide block leading-tight ${isSel ? 'text-red-600' : 'text-neutral-800'}`}>
                                                                                    {name.toUpperCase()}
                                                                                </span>
                                                                                <p className="text-[10px] text-neutral-500 font-serif mt-0.5 leading-snug">
                                                                                    {desc}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {onboardingStep > 0 && (
                                                        <div className="w-full mt-6 select-none animate-fade-in flex items-center gap-4">
                                                            {/* Left Arrow (Back) */}
                                                            <button
                                                                onClick={handleOnboardingBack}
                                                                title={selectedLang === 'EN' ? 'Back' : 'Volver'}
                                                                className="text-black/40 hover:text-black hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer bg-transparent flex-shrink-0 flex items-center justify-center p-1.5"
                                                            >
                                                                <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
                                                            </button>

                                                            {/* Progress bar and clickable circles */}
                                                            <div className="relative flex-1 py-4">
                                                                <div className="absolute top-1/2 left-[11px] right-[11px] h-[3px] -translate-y-1/2">
                                                                    <div className="w-full h-full bg-[#1A365D]/15 rounded-full" />
                                                                    <div 
                                                                        className="absolute top-0 left-0 h-full bg-[#1A365D] rounded-full transition-all duration-300" 
                                                                        style={{ 
                                                                            width: `${((currentStepIdx - 1) / (totalOnboardingSteps - 1)) * 100}%` 
                                                                        }} 
                                                                    />
                                                                </div>
                                                                <div className="relative flex justify-between items-center w-full z-10">
                                                                    {Array.from({ length: totalOnboardingSteps }).map((_, i) => {
                                                                        const stepNum = i + 1;
                                                                        const isSelected = stepNum === currentStepIdx;
                                                                        return (
                                                                            <div 
                                                                                key={i} 
                                                                                onClick={() => handleJumpToStep(stepNum)}
                                                                                className={`w-5.5 h-5.5 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer hover:scale-110 active:scale-95 ${
                                                                                    isSelected ? 'bg-[#1A365D] scale-105 shadow-md' : 'bg-[#EAEAEA] border-[2px] border-black/30 text-black/50'
                                                                                }`}
                                                                            >
                                                                                <span style={{ fontFamily: "'Lato', sans-serif" }} className={`text-[10px] font-extrabold ${isSelected ? 'text-white' : 'text-black/60'}`}>
                                                                                    {stepNum}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* Right Arrow (Next) */}
                                                            <button
                                                                onClick={handleOnboardingNext}
                                                                title={nextTitle}
                                                                className={`${isFinalStep ? 'text-red-600 hover:text-red-700' : 'text-black/40 hover:text-black'} hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer bg-transparent flex-shrink-0 flex items-center justify-center p-1.5`}
                                                            >
                                                                <ArrowRight className="w-6 h-6 stroke-[2.5]" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (

                                <div className="flex-1 px-3 pt-2 pb-4 tab-content-area overflow-y-auto min-h-0">
                                    <div className="min-h-full flex flex-col justify-start space-y-4">
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
                            
                            return (
                                <div key={msg.id} className={`flex items-start ${isUser ? 'justify-end' : 'justify-start'} gap-2.5 animate-fade-in`}>
                                    <div className={`max-w-[88%] flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                                        <div className={`
                                            px-4 py-2.5 rounded-2xl text-sm leading-snug transition-all
                                            ${isUser 
                                                ? 'bg-white border-[5px] border-blue-600/30 backdrop-blur-md text-black rounded-tr-none font-normal' 
                                                : 'bg-white border-[5px] border-red-600/30 text-black rounded-tl-none'
                                            }
                                        `}>
                                            {isUser ? (
                                                <div className="flex items-center justify-end gap-2.5 mb-1.5 select-none">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (!isConnected) return;
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
                                                        disabled={!isConnected}
                                                        className={`flex items-center gap-1 group cursor-pointer transition-all duration-300 ${
                                                            !isConnected ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95'
                                                        }`}
                                                    >
                                                        {!isPaused && (
                                                            <span 
                                                                style={{ fontFamily: "'Lato', sans-serif" }} 
                                                                className="text-[9px] font-black tracking-wider transition-all duration-300 text-blue-600/70 group-hover:text-red-600"
                                                            >
                                                                PAUSA
                                                            </span>
                                                        )}
                                                        {isPaused ? (
                                                            <Play fill="currentColor" stroke="none" className="w-3.5 h-3.5 text-red-600 transition-all animate-pulse" />
                                                        ) : (
                                                            <Pause fill="currentColor" stroke="none" className="w-3.5 h-3.5 text-blue-600/70 group-hover:text-red-600 transition-all duration-300" />
                                                        )}
                                                    </button>
                                                    <User strokeWidth={2.5} className="w-5 h-5 text-blue-600/70" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 sm:gap-4 flex-wrap mb-2.5 select-none">
                                                    {/* Mascot Bot Icon */}
                                                    <div 
                                                        onClick={() => setHasInteracted(false)} 
                                                        title={selectedLang === 'EN' ? 'Go to Welcome Page' : 'Ir a la página de bienvenida'} 
                                                        className="cursor-pointer hover:scale-110 active:scale-95 transition-all flex-shrink-0"
                                                    >
                                                        <Bot strokeWidth={2.5} className="w-5 h-5 text-red-600" />
                                                    </div>

                                                    {/* Embedded Mode Selectors */}
                                                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                                                        {(() => {
                                                            const modes = [
                                                                {
                                                                    id: 'spanish',
                                                                    label: selectedLang === 'EN' ? 'SPANISH' : 'ESPAÑOL',
                                                                    active: isSpanishOnlyMode,
                                                                    activate: () => {
                                                                        setIsSpanishOnlyMode(true);
                                                                        if (isPaused) {
                                                                            resume();
                                                                            if (window.speechSynthesis && window.speechSynthesis.paused) {
                                                                                window.speechSynthesis.resume();
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                {
                                                                    id: 'bilingual',
                                                                    label: 'BILINGÜE',
                                                                    active: isBilingualMode,
                                                                    activate: () => {
                                                                        setIsBilingualMode(true);
                                                                        if (isPaused) {
                                                                            resume();
                                                                            if (window.speechSynthesis && window.speechSynthesis.paused) {
                                                                                window.speechSynthesis.resume();
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                {
                                                                    id: 'english',
                                                                    label: selectedLang === 'EN' ? 'ENGLISH' : 'INGLÉS',
                                                                    active: isEnglishOnlyMode,
                                                                    activate: () => {
                                                                        setIsEnglishOnlyMode(true);
                                                                        if (isPaused) {
                                                                            resume();
                                                                            if (window.speechSynthesis && window.speechSynthesis.paused) {
                                                                                window.speechSynthesis.resume();
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                {
                                                                    id: 'translate',
                                                                    label: selectedLang === 'EN' ? 'TRANSLATOR' : 'TRADUCTOR',
                                                                    active: isTranslateMode,
                                                                    activate: () => {
                                                                        setIsTranslateMode(true);
                                                                        if (isPaused) {
                                                                            resume();
                                                                            if (window.speechSynthesis && window.speechSynthesis.paused) {
                                                                                window.speechSynthesis.resume();
                                                                            }
                                                                        }
                                                                    }
                                                                },
                                                                {
                                                                    id: 'listen',
                                                                    label: selectedLang === 'EN' ? 'LISTEN' : 'ESCUCHA',
                                                                    active: isListenOnly,
                                                                    activate: () => {
                                                                        setIsListenOnly(true);
                                                                        if (isPaused) {
                                                                            resume();
                                                                            if (window.speechSynthesis && window.speechSynthesis.paused) {
                                                                                window.speechSynthesis.resume();
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            ];

                                                            // Sort so active mode is first
                                                            const sortedModes = [...modes].sort((a, b) => (a.active ? -1 : b.active ? 1 : 0));

                                                            return sortedModes.map((m) => (
                                                                <button 
                                                                    key={m.id}
                                                                    onClick={m.activate}
                                                                    style={{ fontFamily: "'Lato', sans-serif" }}
                                                                    className="flex items-center gap-1 cursor-pointer group select-none"
                                                                >
                                                                    {m.active && (
                                                                        <MessageSquare 
                                                                            strokeWidth={3}
                                                                            className="w-3.5 h-3.5 flex-shrink-0 transition-all duration-200 text-red-600 scale-110" 
                                                                        />
                                                                    )}
                                                                    <span className={`text-[7.5pt] tracking-wider uppercase whitespace-nowrap transition-colors ${
                                                                        m.active ? 'text-black font-extrabold' : 'text-black/45 font-bold group-hover:text-red-600'
                                                                    }`}>
                                                                        {m.label}
                                                                    </span>
                                                                </button>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                            <div className={`chat-message-text whitespace-pre-line tracking-wider leading-snug ${isUser ? 'text-right' : 'text-left'}`}>
                                                {(() => {
                                                    const rawText = getTranslatedMessageText(msg, selectedLang);
                                                    if (!isUser && rawText.includes(" / ")) {
                                                        const parts = rawText.split(" / ");
                                                        if (parts.length >= 2) {
                                                            return (
                                                                <>
                                                                    <div style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-black font-semibold leading-snug">{parseAndRenderEmojis(parts[0])}</div>
                                                                    <div style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="chat-message-english text-black leading-snug mt-2">
                                                                        {parseAndRenderEmojis(parts.slice(1).join(" / "))}
                                                                    </div>
                                                                </>
                                                            );
                                                        }
                                                    }
                                                    return <div style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-black leading-snug">{parseAndRenderEmojis(rawText)}</div>;
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
                                 chatMessages={chatMessages}
                                 isPaused={isPaused}
                                 isConnected={isConnected}
                                 pause={pause}
                                 resume={resume}
                                 onAskVoyager={(text) => {
                                     setHasInteracted(true);
                                     addUserMessage(text);
                                     const profilePrompt = `[INSTRUCCIÓN DE SISTEMA CRÍTICA: El usuario está preguntando sobre su Perfil de usuario (Día actual, progreso, nivel de inglés estimado, palabras aprendidas o tipo de cuenta). 
Mantén estrictamente tu tono de voz original, velocidad y personalidad de VOYAGER. 
Responde ÚNICAMENTE en español de forma clara, directa e informativa para que un usuario de habla hispana entienda perfectamente su avance y datos. 
REGLA INQUEBRANTABLE: NO intentes enseñar inglés, NO invites al usuario a practicar inglés, NO inicies juegos de conversación en inglés y NO ofrezcas lecciones. Tu único trabajo en este panel es explicar de manera informativa en español los datos y la información del Perfil del usuario, y preguntarle si tiene alguna duda sobre esta sección.
Pregunta del usuario: "${text}"]`;
                                     sendText(profilePrompt);
                                 }}
                                 onNavigateTab={(tab) => setRightPanelTab(tab)}
                             />
                        ) : rightPanelTab === 'shopping' ? (
                            <ShoppingPanel
                                selectedLang={selectedLang}
                                userPlan={(() => {
                                    const saved = localStorage.getItem('voyager_user_account');
                                    if (saved) {
                                        try {
                                            const u = JSON.parse(saved);
                                            return u.plan || 'FREE';
                                        } catch (e) {}
                                    }
                                    return 'FREE';
                                })()}
                                onUpgradeSuccess={() => {
                                    const saved = localStorage.getItem('voyager_user_account');
                                    let u = {
                                        name: selectedLang === 'EN' ? 'Learner' : 'Estudiante',
                                        email: 'learner@usavoyager.com',
                                        provider: 'Guest' as const,
                                        goal: 'Business English & Networking',
                                        levelEstimate: 'Intermediate',
                                        completedDays: [1],
                                        plan: 'PRO' as const
                                    };
                                    if (saved) {
                                        try {
                                            u = { ...JSON.parse(saved), plan: 'PRO' };
                                        } catch (e) {}
                                    }
                                    localStorage.setItem('voyager_user_account', JSON.stringify(u));
                                    setRightPanelTab('roadmap');
                                }}
                                chatMessages={chatMessages}
                                isPaused={isPaused}
                                isConnected={isConnected}
                                pause={pause}
                                resume={resume}
                                onAskVoyager={(text) => {
                                    setHasInteracted(true);
                                    addUserMessage(text);
                                    const storePrompt = `[INSTRUCCIÓN DE SISTEMA: El usuario está en la pestaña de COMPRAS de USA Voyager.
Mantén estrictamente tu tono de voz original, velocidad y personalidad de VOYAGER (no cambies tu voz, tono, acento ni actúes como un personaje de ventas exagerado). Habla como el tutor VOYAGER de siempre, pero respondiendo en español.
Tu objetivo es explicarle de forma clara y convincente los beneficios de nuestros planes de pago oficiales (PRO, Sesión Diagnóstica, Coaching de Inmersión o Coaching Intensivo) para animarlo a adquirirlos:
1. Responde ÚNICAMENTE en español (no des explicaciones ni respuestas en inglés, ni intentes enseñar inglés aquí). Su propósito en este panel no es aprender, sino informarse sobre la compra.
2. Habla ÚNICAMENTE de los productos y servicios oficiales descritos a continuación. No inventes precios, número de sesiones ni características fuera de estas:
   - Plan USA Voyager PRO: $9.99/mes. Desbloquea todas las lecciones del Día 2 en adelante de la ruta de aprendizaje, escenarios avanzados de conversación y feedback avanzado de acento/pronunciación.
   - Sesión Diagnóstica: $29.00 pago único. Videollamada de 30 minutos 1-a-1 en vivo con Alejandra Francois (La Profe) para evaluar nivel, acento y fluidez + reporte personalizado + soporte de chat directo por 7 días.
   - Coaching de Inmersión: $199.00/mes. 4 clases al mes 1-a-1 en vivo con La Profe + acompañamiento de audios por chat privado diario + plan PRO gratis incluido.
   - Coaching Intensivo: $349.00/mes. 8 clases al mes 1-a-1 en vivo con La Profe (2 clases semanales) + revisiones diarias prioritarias de audios + soporte directo 24/7 + plan PRO gratis incluido.
3. Sé convincente y ayuda al usuario a tomar la decisión de compra, manteniendo la misma voz y acento habitual de VOYAGER.
Pregunta del usuario: "${text}"]`;
                                    sendText(storePrompt);
                                }}
                            />
                        ) : rightPanelTab === 'teachers' ? (
                            <TeacherInsightsPanel
                                selectedLang={selectedLang}
                                chatMessages={chatMessages}
                                isPaused={isPaused}
                                isConnected={isConnected}
                                pause={pause}
                                resume={resume}
                                scores={scores}
                                learnedWords={learnedWords}
                                accentPatterns={accentPatterns}
                                onAskVoyager={(text) => {
                                    setHasInteracted(true);
                                    if (!text.startsWith('[AUTO_SYSTEM:')) {
                                        addUserMessage(text);
                                    }
                                    const teachersPrompt = text.startsWith('[AUTO_SYSTEM:')
                                        ? text
                                        : `[INSTRUCCIÓN DE SISTEMA: El usuario está preguntando sobre la sección de La Profe (Alejandra Francois, acompañamiento de clases en vivo, grabaciones de acento o logs de pronunciación). Mantén estrictamente tu tono de voz original, velocidad y personalidad de VOYAGER. Responde ÚNICAMENTE en español de forma clara, directa y comprensible para que un usuario de habla hispana entienda perfectamente cómo funciona el acompañamiento docente. No uses inglés ni enseñes inglés aquí. Pregunta del usuario: "${text}"]`;
                                    sendText(teachersPrompt);
                                }}
                            />
                        ) : rightPanelTab === 'progress' ? (
                            <div className="flex-1 p-4 overflow-y-auto tab-content-area bg-neutral-300">
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
                        <div className="px-3 pt-3 pb-6 md:pb-8 bg-[#d4d4d4] flex justify-end w-full">
                            <form 
                                onSubmit={handleSendMessage} 
                                className="w-full max-w-[88%] relative rounded-2xl rounded-tr-none transition-all bg-white border-[5px] border-blue-600/30 shadow-sm animate-border-pulsate px-4 py-2.5 flex flex-col"
                            >
                                <div className="flex justify-end mb-1 select-none">
                                    <User strokeWidth={2.5} className="w-5 h-5 text-blue-600/70" />
                                </div>
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    placeholder={placeholderText}
                                    className="w-full focus:outline-none transition-all border-none bg-transparent text-black text-right placeholder:text-right placeholder:text-black/45 font-serif text-[14px] chat-input-text p-0"
                                  />
                            </form>
                        </div>
                    )}
                </>
            )}
            </div>
          )}
        </div>
      </div>
      {/* Policy Modal Overlay */}
      {activePolicyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-neutral-300 border border-black/15 rounded-2xl max-w-xl w-full shadow-[0_25px_50px_rgba(0,0,0,0.4)] p-6 md:p-8 flex flex-col max-h-[85vh] animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-300 pb-4 mb-4">
              <h3 style={{ fontFamily: '"Lato", sans-serif' }} className="text-lg md:text-xl font-black text-black uppercase tracking-wider">
                {activePolicyModal === 'copyright' ? (selectedLang === 'EN' ? 'Copyright Information' : 'Derechos de Autor') : activePolicyModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <button 
                onClick={() => setActivePolicyModal(null)}
                className="text-neutral-500 hover:text-black transition-colors p-1 rounded-full hover:bg-neutral-200 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="overflow-y-auto pr-2 space-y-4 text-xs md:text-sm text-neutral-800 leading-relaxed font-sans select-text">
              {activePolicyModal === 'copyright' ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span style={{ fontSize: '3em' }} className="font-bold text-amber-600 mb-4 block leading-none">©</span>
                  <p className="font-semibold text-[#231d17] text-sm md:text-base max-w-sm leading-relaxed">
                    © 2026 Yo Soy Voger USA. All rights reserved. Derechos reservados
                  </p>
                </div>
              ) : activePolicyModal === 'privacy' ? (
                <>
                  <p className="font-semibold text-neutral-900">
                    This policy applies exclusively to data collected through the M&K Customer Feedback Portal and does not govern any other data practices of M&K or its affiliated businesses.
                  </p>
                  <p>
                    We collect your name, Google account email, star rating, review text, and submission timestamp via Google OAuth (no password stored) solely to process feedback, generate AI-enriched review suggestions for your approval, notify managers of low ratings, and log interactions in a secure Google Sheet for internal improvement. Your data is never sold or shared with third parties, is accessible only to authorized M&K team members, and is retained only as long as needed to support service improvement and accountability. You have the right to access, correct, or request deletion of your personal data at any time by contacting your designated M&K representative.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-neutral-900">
                    This policy applies exclusively to data collected through the M&K Customer Feedback Portal and does not govern any other data practices of M&K or its affiliated businesses.
                  </p>
                  <p>
                    By accessing the M&K Customer Feedback Portal, you agree to use the service solely for its intended purpose of submitting genuine customer feedback — including optional AI-assisted enrichment and automated routing to M&K team members — and to provide accurate, truthful information at all times. M&K makes no guarantees, express or implied, regarding SEO outcomes, business results, or third-party platform visibility, and is not responsible for how submitted reviews are indexed or displayed. M&K reserves the right to modify, suspend, or discontinue the portal at any time without notice and, to the fullest extent permitted by law, shall not be liable for any indirect, incidental, or consequential damages arising from your use of or inability to use the service.
                  </p>
                </>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="mt-6 flex justify-end border-t border-neutral-300 pt-4 flex-shrink-0">
              <button 
                onClick={() => setActivePolicyModal(null)}
                style={{ fontFamily: "'Lato', sans-serif" }}
                className="px-5 py-2 bg-neutral-800 hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-full transition-all cursor-pointer select-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveAgent;
