import React, { useState, useEffect, useRef } from 'react';
import { SUGGESTIONS, IMMERSION_CURRICULUM } from '../constants';
import { base64ToBytes, createAudioBufferFromPCM, float32ToPcm16, bytesToBase64, resampleAudioBuffer } from '../services/audioUtils';
import NycMap, { MapMarker, RouteInfo } from './NycMap';
import { NycSubwayMap } from './NycSubwayMap';
import { getAccessToken } from '../services/firebaseAuth';
import { parseAndRenderEmojis } from './VoyagerEmoji';

import { ProgressDashboard } from './ProgressDashboard';
import voyagerRobot from '../assets/images/voyager_robot_1783082204380.png';
import chatAvatarIcon from '../assets/images/chat_avatar_icon_1784421724522.jpg';
import { Compass, MapPin, Languages, Sparkles, ArrowLeft, ArrowRight, Headphones, MessageSquare } from 'lucide-react';



interface TravelDestination {
  name: string;
  nameEn: string;
  lat: number;
  lng: number;
  subwayLines: string[];
  subwayDirections: string;
  subwayDirectionsEn: string;
  taxiTime: string;
  taxiFare: string;
  walkTime: string;
  walkDist: string;
  bikeTime: string;
  vocab: string[];
  phrases: { en: string; es: string }[];
}

const TRAVEL_PRESETS: TravelDestination[] = [
  {
    name: "Diner Americano",
    nameEn: "Classic Diner",
    lat: 39.8283,
    lng: -98.5795,
    subwayLines: ['Diner Counter', 'Booth'],
    subwayDirections: "Busca un diner con letrero de neón clásico y pide mesa o barra.",
    subwayDirectionsEn: "Find a classic neon-lit diner and ask for a table or counter service.",
    taxiTime: "5 mins",
    taxiFare: "$8.50",
    walkTime: "10 mins",
    walkDist: "0.5 mi",
    bikeTime: "3 mins",
    vocab: ["Booth (Cabina)", "Counter (Barra)", "Daily specials (Especiales del día)", "Sunny-side up (Huevos fritos enteros)", "Refill (Rellenar bebida)"],
    phrases: [
      { en: "I'd like a table for two, please.", es: "Me gustaría una mesa para dos, por favor." },
      { en: "Could I get a coffee refill?", es: "¿Me podría rellenar el café?" },
      { en: "Can we have the check, please?", es: "¿Nos da la cuenta, por favor?" }
    ]
  },
  {
    name: "Supermercado",
    nameEn: "Local Supermarket",
    lat: 39.8285,
    lng: -98.5790,
    subwayLines: ['Produce Aisle', 'Checkout Lane'],
    subwayDirections: "Entra, toma un carrito de compras (cart) y dirígete a los pasillos.",
    subwayDirectionsEn: "Walk in, grab a shopping cart, and head to the aisles.",
    taxiTime: "8 mins",
    taxiFare: "$11.00",
    walkTime: "15 mins",
    walkDist: "0.8 mi",
    bikeTime: "5 mins",
    vocab: ["Shopping cart (Carrito)", "Aisle (Pasillo)", "Paper or plastic (Papel o plástico)", "Rewards card (Tarjeta de puntos)", "Receipt (Recibo/Ticket)"],
    phrases: [
      { en: "Excuse me, where can I find the milk?", es: "Disculpe, ¿dónde puedo encontrar la leche?" },
      { en: "I don't need a bag, thank you.", es: "No necesito bolsa, gracias." },
      { en: "Can I do twenty dollars cash back?", es: "¿Puedo retirar veintiún dólares en efectivo en caja?" }
    ]
  },
  {
    name: "Gasolinera",
    nameEn: "Gas Station & Store",
    lat: 39.8280,
    lng: -98.5800,
    subwayLines: ['Fuel Pump', 'Snack Aisle'],
    subwayDirections: "Estaciónate junto a la bomba (pump) número 4 y paga adentro.",
    subwayDirectionsEn: "Park next to fuel pump number 4 and pay inside.",
    taxiTime: "12 mins",
    taxiFare: "$16.00",
    walkTime: "30 mins",
    walkDist: "1.5 mi",
    bikeTime: "10 mins",
    vocab: ["Fuel pump (Bomba de gasolina)", "Regular / Premium (Tipos de gasolina)", "Windshield squeegee (Limpiaparabrisas)", "Restroom key (Llave del baño)", "Highway (Autopista)"],
    phrases: [
      { en: "Fifty dollars on pump number four, please.", es: "Cincuenta dólares en la bomba número cuatro, por favor." },
      { en: "Do you have a public restroom?", es: "¿Tiene baño público?" },
      { en: "Can I get a bottle of water and these chips?", es: "¿Me da una botella de agua y estas papas?" }
    ]
  },
  {
    name: "Recepción de Hotel",
    nameEn: "Hotel Front Desk",
    lat: 39.8290,
    lng: -98.5780,
    subwayLines: ['Lobby', 'Reception'],
    subwayDirections: "Camina hacia la recepción en el vestíbulo principal del hotel.",
    subwayDirectionsEn: "Head to the reception desk in the main hotel lobby.",
    taxiTime: "15 mins",
    taxiFare: "$22.00",
    walkTime: "40 mins",
    walkDist: "2.0 mi",
    bikeTime: "12 mins",
    vocab: ["Reservation (Reservación)", "Key card (Tarjeta llave)", "Check-out time (Hora de salida)", "Amenities (Servicios/Comodidades)", "Valet parking (Estacionamiento de servicio)"],
    phrases: [
      { en: "Hi, I have a reservation under Jane Doe.", es: "Hola, tengo una reservación a nombre de Jane Doe." },
      { en: "What time is checkout tomorrow?", es: "¿A qué hora es la salida mañana?" },
      { en: "Could we get some extra towels for our room?", es: "¿Podríamos tener algunas toallas extra para la habitación?" }
    ]
  }
];

interface LiveAgentProps {
  isWidgetMode: boolean;
  onClose?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'splash' | 'system';
  text: string;
  timestamp: string;
  timeMs: number;
  showForm?: boolean;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  notes: string;
  createdAt: string;
  chatTranscript: { sender: string; text: string; timestamp: string }[];
}

const translations = {
  EN: {
    standby: "EN ESPERA",
    connecting: "Conectando...",
    connect: "CONECTAR",
    active: "ACTIVO",
    disconnected: "Desconectado",
    session: "Sesión",
    disconnectBtn: "FINALIZAR",
    connectionError: "Error de Conexión",
    howToFix: "👉 How to fix this error:",
    step1: "Open the Settings panel (⚙️ gear icon) in AI Studio.",
    step2: "Input a valid GEMINI_API_KEY.",
    step3: "Save and retry connecting.",
    interactiveConsole: "Consola Interactiva",
    liveConversation: "Conversación en Vivo",
    leadsBtn: "Lugares Guardados",
    collectLeadBtn: "Añadir Notas de Práctica",
    databaseCapturedLeads: "Historial y Notas de Práctica en EE.UU.",
    backToChat: "Volver al Chat",
    noLeads: "No practice notes saved yet.",
    fillFormTest: "Fill out the notes to save your favorite US daily scenarios and vocabulary learnings.",
    viewSavedTranscript: "Ver Transcripción Guardada",
    askPlaceholder: "Type your query or scenario here...",
    blueprintRegistered: "Practice Plan Saved!",
    proposalSuccessMsg: "Your American immersion practice plan and chat history have been successfully saved to the server database.",
    backToConsole: "Volver al Panel de Voyager",
    secureAgentBlueprint: "Guardar Plan de Práctica",
    requestProposal: "Guardar Registro de Práctica",
    formInstructions: "Enter your details to save your customized American life practice log, scenarios list, and transcript.",
    fullName: "Your Name *",
    fullNamePlaceholder: "e.g. Jane Doe",
    emailAddress: "Email Address *",
    emailPlaceholder: "e.g. jane@example.com",
    company: "Primary Interest",
    companyPlaceholder: "e.g. Shopping, Diner, Language",
    phone: "Mobile Number",
    phonePlaceholder: "e.g. +1 555-0199",
    customReqs: "Practice Notes & Scenario Favorites",
    textareaPlaceholder: "What everyday American scenarios or vocabulary topics do you want to keep in your log?",
    submitBtn: "Guardar Diario de Práctica",
    submittingBtn: "Guardando Diario...",
    nameEmailRequired: "Name and Email are required fields.",
    systemOnline: "Voyager American English Tutor system online.",
    welcomeMsg: "Hello! I'm VOYAGER, your American English Tutor. Let's practice English or Spanish while exploring daily life in the US! Click Connect to begin.",
    endConversation: "FINALIZAR",
    reviewChat: "Califica tu Sesión con Voyager",
    submitReview: "Enviar Calificación",
    reviewPlaceholder: "Tell us how your conversation went...",
    thankYouReview: "Thank you for practicing with Voyager!"
  },
  ES: {
    standby: "EN ESPERA",
    connecting: "Conectando...",
    connect: "CONECTAR",
    active: "ACTIVO",
    disconnected: "Desconectado",
    session: "Sesión",
    disconnectBtn: "FINALIZAR",
    connectionError: "Error de Conexión",
    howToFix: "👉 Cómo solucionar este error:",
    step1: "Abre el panel de Configuración (icono de engranaje ⚙️) en AI Studio.",
    step2: "Introduce una clave GEMINI_API_KEY válida.",
    step3: "Guarda los cambios y vuelve a intentar la conexión.",
    interactiveConsole: "Consola Interactiva",
    liveConversation: "Conversación en Vivo",
    leadsBtn: "Lugares Guardados",
    collectLeadBtn: "Añadir Notas de Práctica",
    databaseCapturedLeads: "Historial y Notas de Práctica en EE.UU.",
    backToChat: "Volver al Chat",
    noLeads: "Aún no hay notas de práctica guardadas.",
    fillFormTest: "Completa tus notas para guardar tus escenarios favoritos de EE.UU. y las palabras aprendidas.",
    viewSavedTranscript: "Ver Transcripción Guardada",
    askPlaceholder: "Escribe tu consulta o escenario aquí...",
    blueprintRegistered: "¡Plan de Práctica Registrado!",
    proposalSuccessMsg: "Tu plan de práctica personalizado y tu historial de conversación se han guardado con éxito.",
    backToConsole: "Volver al Panel de Voyager",
    secureAgentBlueprint: "Guardar Plan de Práctica",
    requestProposal: "Guardar Registro de Práctica",
    formInstructions: "Completa tus datos para guardar tu diario de práctica por EE.UU., tu lista de escenarios y tu transcripción de práctica.",
    fullName: "Tu Nombre *",
    fullNamePlaceholder: "ej. Jane Doe",
    emailAddress: "Correo Electrónico *",
    emailPlaceholder: "ej. jane@ejemplo.com",
    company: "Interés Principal",
    companyPlaceholder: "ej. Compras, Diner, Idioma",
    phone: "Número de Teléfono",
    phonePlaceholder: "ej. +1 555-0199",
    customReqs: "Notas de Práctica y Escenarios Favoritos",
    textareaPlaceholder: "¿Qué escenarios o temas de vocabulario deseas mantener en tu diario de práctica?",
    submitBtn: "Guardar Diario de Práctica",
    submittingBtn: "Guardando Diario...",
    nameEmailRequired: "El nombre y el correo electrónico son campos obligatorios.",
    systemOnline: "Sistema Voyager en línea. Tu Tutor de Inglés Americano está listo.",
    welcomeMsg: "¡Hola! Soy VOYAGER, tu Tutor de Inglés Americano. ¡Practiquemos inglés mientras exploramos la vida diaria en EE.UU.! Haz clic en Conectar para empezar.",
    endConversation: "FINALIZAR",
    reviewChat: "Califica tu Sesión con Voyager",
    submitReview: "Enviar Calificación",
    reviewPlaceholder: "Cuéntanos sobre tu experiencia de práctica...",
    thankYouReview: "¡Gracias por practicar con Voyager!"
  }
};

const getTranslatedMessageText = (msg: ChatMessage, lang: 'EN' | 'ES') => {
  if (msg.id === 'system_1') {
    return translations[lang].systemOnline;
  }
  if (msg.id === 'welcome_1') {
    return translations[lang].welcomeMsg;
  }
  return msg.text;
};

const LiveAgent: React.FC<LiveAgentProps> = ({ isWidgetMode, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListenOnly, setIsListenOnly] = useState(false);
  const isListenOnlyRef = useRef(isListenOnly);
  
  const [isTranslateMode, setIsTranslateMode] = useState(false);
  const isTranslateModeRef = useRef(isTranslateMode);
  
  const [isBilingualMode, setIsBilingualMode] = useState(true);
  const isBilingualModeRef = useRef(true);
  
  const [isSpanishOnlyMode, setIsSpanishOnlyMode] = useState(false);
  const isSpanishOnlyModeRef = useRef(isSpanishOnlyMode);
  
  const [isEnglishOnlyMode, setIsEnglishOnlyMode] = useState(false);
  const isEnglishOnlyModeRef = useRef(isEnglishOnlyMode);
  
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  const lastInteractionTimeRef = useRef(Date.now());
  
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Disconnected");

  // NYC Map State
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 40.758895, lng: -73.985131 }); // Default: Times Square
  const [mapZoom, setMapZoom] = useState<number>(13);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'chat' | 'lessons' | 'trips'>('chat');
  const [viajesSubTab, setViajesSubTab] = useState<'planner' | 'subway' | 'google_map'>('planner');
  const [selectedTripDestination, setSelectedTripDestination] = useState<TravelDestination | null>(null);
  const [customDestinationText, setCustomDestinationText] = useState("");
  const [classroomSubTab, setClassroomSubTab] = useState<'map' | 'subway_map'>('map');
  const [scores, setScores] = useState({ grammar: 0, pronunciation: 0, confidence: 0, naturalness: 0 });
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [accentPatterns, setAccentPatterns] = useState<string[]>([]);



  const handleSelectPresetDestination = (dest: TravelDestination) => {
    setSelectedTripDestination(dest);
    setMapCenter({ lat: dest.lat, lng: dest.lng });
    setMarkers([{
      id: 'dest_marker',
      lat: dest.lat,
      lng: dest.lng,
      title: dest.name
    }]);
  };

  const handleCustomDestinationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDestinationText.trim()) return;
    
    const destName = customDestinationText.trim();
    const mockDest: TravelDestination = {
      name: destName,
      nameEn: destName,
      lat: 40.758895 + (Math.random() - 0.5) * 0.04,
      lng: -73.985131 + (Math.random() - 0.5) * 0.04,
      subwayLines: ['N', 'R', '1', '6'],
      subwayDirections: `Toma las líneas N/R o 1/6 hacia la estación más cercana a ${destName}.`,
      subwayDirectionsEn: `Take the N/R or 1/6 train to the station closest to ${destName}.`,
      taxiTime: `${Math.floor(Math.random() * 15) + 8} mins`,
      taxiFare: `$${(Math.random() * 15 + 10).toFixed(2)}`,
      walkTime: `${Math.floor(Math.random() * 40) + 15} mins`,
      walkDist: `${(Math.random() * 2 + 0.5).toFixed(1)} mi`,
      bikeTime: `${Math.floor(Math.random() * 12) + 5} mins`,
      vocab: ["Navigation (Navegación)", "Corner (Esquina)", "Subway entrance (Entrada del metro)", "Street sign (Letrero de la calle)", "Map routing (Ruta de mapa)"],
      phrases: [
        { en: `Excuse me, how do I get to ${destName}?`, es: `Disculpe, ¿cómo llego a ${destName}?` },
        { en: `Is ${destName} within walking distance from here?`, es: `¿Está ${destName} a una de distancia caminable desde aquí?` },
        { en: `Could you tell me which train goes to ${destName}?`, es: `¿Podrías decirme qué tren va a ${destName}?` }
      ]
    };
    setSelectedTripDestination(mockDest);
    setMapCenter({ lat: mockDest.lat, lng: mockDest.lng });
    setMarkers([{
      id: 'dest_marker',
      lat: mockDest.lat,
      lng: mockDest.lng,
      title: mockDest.name
    }]);
    setCustomDestinationText("");
  };

  const speakTravelPhrase = (phrase: string, lang: 'en-US' | 'es-ES') => {
    const speech = new SpeechSynthesisUtterance(phrase);
    speech.lang = lang;
    window.speechSynthesis.speak(speech);
  };

  const parseImmersionTags = (text: string) => {
    let cleaned = text;
    let newScores = null;
    let newLearnedWords: string[] = [];
    let newAccentPattern = null;
    let newCompletedMission = null;

    // 1. Scores
    const scoresMatch = cleaned.match(/\[SCORES:\s*grammar=(\d+),\s*pronunciation=(\d+),\s*confidence=(\d+),\s*naturalness=(\d+)\]/i);
    if (scoresMatch) {
      newScores = {
        grammar: parseInt(scoresMatch[1], 10),
        pronunciation: parseInt(scoresMatch[2], 10),
        confidence: parseInt(scoresMatch[3], 10),
        naturalness: parseInt(scoresMatch[4], 10)
      };
      cleaned = cleaned.replace(scoresMatch[0], "");
    }

    // 2. Learned Words
    const learnedMatch = cleaned.match(/\[LEARNED_WORDS:\s*([^\]]+)\]/i);
    if (learnedMatch) {
      newLearnedWords = learnedMatch[1].split(',').map(w => w.trim()).filter(Boolean);
      cleaned = cleaned.replace(learnedMatch[0], "");
    }

    // 3. Accent
    const accentMatch = cleaned.match(/\[ACCENT:\s*([^\]]+)\]/i);
    if (accentMatch) {
      newAccentPattern = accentMatch[1].trim();
      cleaned = cleaned.replace(accentMatch[0], "");
    }

    // 4. Mission
    const missionMatch = cleaned.match(/\[MISSION_COMPLETE:\s*([^\]]+)\]/i);
    if (missionMatch) {
      newCompletedMission = missionMatch[1].trim();
      cleaned = cleaned.replace(missionMatch[0], "");
    }

    return { cleaned, newScores, newLearnedWords, newAccentPattern, newCompletedMission };
  };

  const updateLearningState = (parsed: ReturnType<typeof parseImmersionTags>) => {
    if (parsed.newScores) {
      setScores(parsed.newScores);
    }
    if (parsed.newLearnedWords.length > 0) {
      setLearnedWords(prev => {
        const next = [...prev];
        parsed.newLearnedWords.forEach(w => {
          if (!next.includes(w)) next.push(w);
        });
        return next;
      });
    }
    if (parsed.newAccentPattern) {
      const pattern = parsed.newAccentPattern;
      setAccentPatterns(prev => {
        if (!prev.includes(pattern)) return [...prev, pattern];
        return prev;
      });
    }
  };

  // Chat & Leads State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [serverLeads, setServerLeads] = useState<Lead[]>([]);

  // Inline Lead Form State
  const [inlineLeadForm, setInlineLeadForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    meetingTime: "",
    consent: false,
    notes: ""
  });
  const [isSubmittingInlineLead, setIsSubmittingInlineLead] = useState(false);
  const [inlineLeadSuccess, setInlineLeadSuccess] = useState(false);
  const [inlineLeadError, setInlineLeadError] = useState<string | null>(null);
  const [inlineFormStep, setInlineFormStep] = useState<'details' | 'services'>('details');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(null);
  const [selectedCalendarTime, setSelectedCalendarTime] = useState("09:00");

  // Chat Review State
  const [showReviewScreen, setShowReviewScreen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Session Elapsed Time
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [selectedLang, setSelectedLang] = useState<'EN' | 'ES'>('ES');

  useEffect(() => {
    const wasListenOnly = isListenOnlyRef.current;
    isListenOnlyRef.current = isListenOnly;
    
    if (wasListenOnly !== isListenOnly) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const msgText = isListenOnly 
          ? "[SYSTEM MESSAGE: Mode changed. You are now in Monitor/Listen-only mode. However, BEFORE you go fully silent, you MUST immediately speak and write a brief explanation in Spanish (only one warm sentence) explaining what this mode does (that you will listen only and offer tips in the text chat, and won't speak unless given permission). End your sentence by saying that you will now be quiet and listen. Do NOT say 'Understood' or 'Entendido'. after saying this explanation, you must remain silent for subsequent turns and only respond via text unless asked '¿Puedo hablar?'.]"
          : "[SYSTEM MESSAGE: Mode changed. Speak aloud a brief explanation in Spanish (one warm sentence) telling the user you are now back in normal voice mode and will speak and respond normally. Do NOT say 'Understood' or 'Entendido'.]";
        
        wsRef.current.send(JSON.stringify({ text: msgText }));
      }
      
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg_sys_listen_${Date.now()}`,
          sender: 'system',
          text: isListenOnly 
            ? (selectedLang === 'EN' 
              ? 'ℹ️ Monitor mode active: VOYAGER is listening only and will not speak. Feedback will be provided via text.'
              : 'ℹ️ Modo monitor activo: VOYAGER está solo escuchando y no hablará. Las correcciones se mostrarán por texto.')
            : (selectedLang === 'EN'
              ? 'ℹ️ Normal mode active: VOYAGER can speak and respond normally.'
              : 'ℹ️ Modo normal activo: VOYAGER hablará y responderá con voz.'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeMs: Date.now()
        }
      ]);
    }
  }, [isListenOnly, selectedLang]);

  useEffect(() => {
    const wasTranslateMode = isTranslateModeRef.current;
    isTranslateModeRef.current = isTranslateMode;
    
    if (wasTranslateMode !== isTranslateMode) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const msgText = isTranslateMode 
          ? "[SYSTEM MESSAGE: Mode changed. You are now in INSTANT TRANSLATION MODE. From now on, whatever you hear in English, you must translate to Spanish. If the user speaks in Spanish, you must translate to English. Output ONLY the translated words and absolutely nothing else, both in your voice and in your text transcription. Do NOT say 'Understood' or 'Entendido'. In this very first response, translate this message to Spanish: 'Instant Translation Mode is now active. I am ready to translate.']"
          : "[SYSTEM MESSAGE: Mode changed. Speak aloud a brief explanation in Spanish (one warm sentence) telling the user that you are now back in normal English tutor mode, teaching American English and offering cultural advice. Do NOT say 'Understood' or 'Entendido'.]";
        
        wsRef.current.send(JSON.stringify({ text: msgText }));
      }
      
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg_sys_translate_${Date.now()}`,
          sender: 'system',
          text: isTranslateMode 
            ? (selectedLang === 'EN' 
              ? 'ℹ️ Instant Translation Mode active: VOYAGER will translate what you say immediately.'
              : 'ℹ️ Modo Traducción Instantánea activo: VOYAGER traducirá lo que digas de inmediato.')
            : (selectedLang === 'EN'
              ? 'ℹ️ Normal mode active: VOYAGER is back as your American English tutor and cultural advisor.'
              : 'ℹ️ Modo normal activo: VOYAGER vuelve a ser tu Tutor de Inglés Americano y asesor cultural.'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeMs: Date.now()
        }
      ]);
    }
  }, [isTranslateMode, selectedLang]);

  useEffect(() => {
    const wasBilingualMode = isBilingualModeRef.current;
    isBilingualModeRef.current = isBilingualMode;
    
    if (wasBilingualMode !== isBilingualMode) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const msgText = isBilingualMode 
          ? "[SYSTEM MESSAGE: Mode changed. You are now in BILINGUAL TRANSLATION MODE. You must immediately speak and write a brief explanation in Spanish (only one warm sentence) explaining what this mode does (that you will say all your responses first in Spanish, and then repeat them in English). Do NOT say 'Understood' or 'Entendido'.]"
          : "[SYSTEM MESSAGE: Mode changed. Speak aloud a brief explanation in Spanish (one warm sentence) telling the user that you are now back in normal English tutor mode, teaching American English and offering cultural advice. Do NOT say 'Understood' or 'Entendido'.]";
        
        wsRef.current.send(JSON.stringify({ text: msgText }));
      }
      
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg_sys_bilingual_${Date.now()}`,
          sender: 'system',
          text: isBilingualMode 
            ? (selectedLang === 'EN' 
              ? 'ℹ️ Bilingual Mode active: VOYAGER will respond in Spanish and repeat in English.'
              : 'ℹ️ Modo Bilingüe activo: VOYAGER responderá en español y lo repetirá en inglés.')
            : (selectedLang === 'EN'
              ? 'ℹ️ Normal mode active: VOYAGER is back as your American English tutor and cultural advisor.'
              : 'ℹ️ Modo normal activo: VOYAGER vuelve a ser tu Tutor de Inglés Americano y asesor cultural.'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeMs: Date.now()
        }
      ]);
    }
  }, [isBilingualMode, selectedLang]);

  useEffect(() => {
    const wasSpanishOnly = isSpanishOnlyModeRef.current;
    isSpanishOnlyModeRef.current = isSpanishOnlyMode;
    
    if (wasSpanishOnly !== isSpanishOnlyMode) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const msgText = isSpanishOnlyMode 
          ? "[SYSTEM MESSAGE: Mode changed. You are now in SPANISH ONLY MODE. You must speak and write strictly and purely in Spanish from now on. Discuss American English culture and language in Spanish. Do NOT teach English, evaluate grammar, or translate any text. Speak only in Spanish. Do NOT say 'Understood' or 'Entendido'.]"
          : "[SYSTEM MESSAGE: Mode changed. Speak aloud a brief explanation in Spanish (one warm sentence) telling the user that you are now back in normal English tutor mode, teaching American English and offering cultural advice. Do NOT say 'Understood' or 'Entendido'.]";
        
        wsRef.current.send(JSON.stringify({ text: msgText }));
      }
      
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg_sys_spanish_${Date.now()}`,
          sender: 'system',
          text: isSpanishOnlyMode 
            ? (selectedLang === 'EN' 
              ? 'ℹ️ Spanish Only Mode active: VOYAGER will converse with you strictly in Spanish.'
              : 'ℹ️ Modo Solo Español activo: VOYAGER conversará contigo estrictamente en español.')
            : (selectedLang === 'EN'
              ? 'ℹ️ Normal mode active: VOYAGER is back as your American English tutor and cultural advisor.'
              : 'ℹ️ Modo normal activo: VOYAGER vuelve a ser tu Tutor de Inglés Americano y asesor cultural.'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeMs: Date.now()
        }
      ]);
    }
  }, [isSpanishOnlyMode, selectedLang]);

  useEffect(() => {
    const wasEnglishOnly = isEnglishOnlyModeRef.current;
    isEnglishOnlyModeRef.current = isEnglishOnlyMode;
    
    if (wasEnglishOnly !== isEnglishOnlyMode) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        const msgText = isEnglishOnlyMode 
          ? "[SYSTEM MESSAGE: Mode changed. You are now in ENGLISH ONLY MODE. You must speak and write strictly and purely in English. Do NOT provide any Spanish translations, hints, corrections, or bilingual tips. Speak naturally as an American English speaker. This is a pure immersion practice mode for advanced students. Speak only in English. Do NOT say 'Understood' or 'Entendido'.]"
          : "[SYSTEM MESSAGE: Mode changed. Speak aloud a brief explanation in Spanish (one warm sentence) telling the user that you are now back in normal English tutor mode, teaching American English and offering cultural advice. Do NOT say 'Understood' or 'Entendido'.]";
        
        wsRef.current.send(JSON.stringify({ text: msgText }));
      }
      
      setChatMessages(prev => [
        ...prev,
        {
          id: `msg_sys_english_${Date.now()}`,
          sender: 'system',
          text: isEnglishOnlyMode 
            ? (selectedLang === 'EN' 
              ? 'ℹ️ English Only Mode active: VOYAGER will speak strictly in English for advanced practice.'
              : 'ℹ️ Modo Solo Inglés activo: VOYAGER hablará estrictamente en inglés para práctica avanzada.')
            : (selectedLang === 'EN'
              ? 'ℹ️ Normal mode active: VOYAGER is back as your American English tutor and cultural advisor.'
              : 'ℹ️ Modo normal activo: VOYAGER vuelve a ser tu Tutor de Inglés Americano y asesor cultural.'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeMs: Date.now()
        }
      ]);
    }
  }, [isEnglishOnlyMode, selectedLang]);

  useEffect(() => {
    if (isTranslateMode) {
      setIsListenOnly(false);
      setIsBilingualMode(false);
      setIsSpanishOnlyMode(false);
      setIsEnglishOnlyMode(false);
    }
  }, [isTranslateMode]);

  useEffect(() => {
    if (isListenOnly) {
      setIsTranslateMode(false);
      setIsBilingualMode(false);
      setIsSpanishOnlyMode(false);
      setIsEnglishOnlyMode(false);
    }
  }, [isListenOnly]);

  useEffect(() => {
    if (isBilingualMode) {
      setIsListenOnly(false);
      setIsTranslateMode(false);
      setIsSpanishOnlyMode(false);
      setIsEnglishOnlyMode(false);
    }
  }, [isBilingualMode]);

  useEffect(() => {
    if (isSpanishOnlyMode) {
      setIsListenOnly(false);
      setIsTranslateMode(false);
      setIsBilingualMode(false);
      setIsEnglishOnlyMode(false);
    }
  }, [isSpanishOnlyMode]);

  useEffect(() => {
    if (isEnglishOnlyMode) {
      setIsListenOnly(false);
      setIsTranslateMode(false);
      setIsBilingualMode(false);
      setIsSpanishOnlyMode(false);
    }
  }, [isEnglishOnlyMode]);

  const hasInteracted = isConnected || statusText === "Connecting..." || chatMessages.length > 1;

  useEffect(() => {
    if (!isConnected) {
      setSecondsElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Scroll ref for chat feed
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Input Placeholder typing animation
  const [placeholderText, setPlaceholderText] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const phrases = [
      "Empieza aca...",
      "Pregúntame cómo te puedo ayudar...",
      "Soy tu agente de voz y chat de IA..."
    ];
    let timer: any;
    const currentPhrase = phrases[placeholderIndex];
    
    const handleTyping = () => {
      if (!isDeleting) {
        setPlaceholderText(currentPhrase.substring(0, placeholderText.length + 1));
        if (placeholderText.length + 1 === currentPhrase.length) {
          timer = setTimeout(() => setIsDeleting(true), 2500);
          return;
        }
        setTypingSpeed(90);
      } else {
        setPlaceholderText(currentPhrase.substring(0, placeholderText.length - 1));
        if (placeholderText.length - 1 === 0) {
          setIsDeleting(false);
          setPlaceholderIndex((prev) => (prev + 1) % phrases.length);
          setTypingSpeed(400);
          return;
        }
        setTypingSpeed(45);
      }
    };

    timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [placeholderText, isDeleting, placeholderIndex, typingSpeed]);

  // Particle visualizer canvas refs & loop
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const volumeRef = useRef(0);
  volumeRef.current = volume;

  useEffect(() => {
    let animationFrameId: number;
    let time = 0;

    // Initialize 900 ring particles concentrated in a band (yellow cab)
    const numParticles = 900;
    const particles: { angle: number; r: number; speed: number; pulsePhase: number; size: number }[] = [];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        angle: Math.random() * 2 * Math.PI,
        // Bell-curve concentration around radius 56
        r: 45 + Math.random() * 18 + (Math.random() - 0.5) * 8,
        speed: (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
        pulsePhase: Math.random() * 2 * Math.PI,
        size: 0.6 + Math.random() * 1.4
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
        rx: 55 * rxFactor,
        ry: 55 * ryFactor,
        size: 1.8 + (i % 4) * 0.6,
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
      const currentVolume = volumeRef.current;

      ctx.clearRect(0, 0, width, height);

      // Draw solid background circle (color: #231d17) in the center of the orb
      ctx.beginPath();
      ctx.arc(centerX, centerY, 62 + currentVolume * 0.15, 0, 2 * Math.PI);
      ctx.fillStyle = '#231d17';
      ctx.fill();
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Radial background glow (yellow cab)
      let grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, 60 + currentVolume * 0.65);
      grad.addColorStop(0, 'rgba(234, 179, 8, 0.2)');
      grad.addColorStop(0.5, 'rgba(234, 179, 8, 0.06)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 95 + currentVolume * 0.5, 0, 2 * Math.PI);
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 75, 54.6, 0, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.05)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Shimmering dust particles
      time += 1;
      for (let i = 0; i < numParticles; i++) {
        let p = particles[i];
        let speedMultiplier = 1.0 + (currentVolume * 0.08);
        p.angle += p.speed * speedMultiplier;

        let radialJitter = Math.sin(p.pulsePhase + time * 0.05) * (1.2 + currentVolume * 0.08);
        let volumeJitter = (Math.random() - 0.5) * (currentVolume * 0.5);
        let finalRadius = p.r + radialJitter + volumeJitter;

        p.pulsePhase += 0.02;

        let px = centerX + Math.cos(p.angle) * finalRadius * 1.35;
        let py = centerY + Math.sin(p.angle) * finalRadius * 1.0;
        let opacity = 0.35 + Math.sin(p.pulsePhase + i) * 0.25 + (Math.random() * 0.25);
        
        ctx.fillStyle = `rgba(234, 179, 8, ${opacity})`;
        ctx.fillRect(px, py, p.size, p.size);
      }

      // Orbiting circles
      for (let i = 0; i < numOrbiters; i++) {
        let orb = orbiters[i];
        let speedMultiplier = 1.0 + (currentVolume * 0.08);
        orb.angle += orb.speed * speedMultiplier;

        let radialJitter = (Math.random() - 0.5) * (currentVolume * 0.35);
        let finalRx = orb.rx + radialJitter;
        let finalRy = orb.ry + radialJitter;

        let ox = centerX + Math.cos(orb.angle) * finalRx;
        let oy = centerY + Math.sin(orb.angle) * finalRy;

        ctx.beginPath();
        ctx.arc(ox, oy, orb.size, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(234, 179, 8, ${orb.alpha})`;
        ctx.shadowBlur = 6 + (currentVolume / 100) * 8;
        ctx.shadowColor = '#eab308';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Fetch leads and set up welcome message
  useEffect(() => {
    fetchLeads();
    
    setChatMessages([
      {
        id: 'welcome_1',
        sender: 'splash',
        text: 'Hi! I\'m VOYAGER, your American English tutor and cultural advisor. Click Connect to start a voice-and-text conversation.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeMs: Date.now()
      }
    ]);
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads');
      if (response.ok) {
         const data = await response.json();
         setServerLeads(data.leads || []);
      }
    } catch (err) {
      console.error("Error fetching leads:", err);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const adjustedStart = (firstDayIndex === 0) ? 6 : firstDayIndex - 1;
    const days: (number | null)[] = [];
    for (let i = 0; i < adjustedStart; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay; i++) {
      days.push(i);
    }
    return days;
  };

  const handleInlineLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineLeadForm.name.trim() || !inlineLeadForm.email.trim() || !inlineLeadForm.phone.trim()) {
      setInlineLeadError(selectedLang === 'EN' ? "Name, email, and phone number are required." : "Se requiere nombre, correo y número telefónico.");
      return;
    }
    
    setIsSubmittingInlineLead(true);
    setInlineLeadError(null);

    try {
      let combinedNotes = inlineLeadForm.notes;
      if (chatMessages.length > 2) {
        const transcriptText = chatMessages
          .filter(m => m.id !== 'system_1' && m.id !== 'welcome_1')
          .map(m => `[${m.timestamp}] ${m.sender.toUpperCase()}: ${getTranslatedMessageText(m, selectedLang)}`)
          .join('\n');
        
        if (transcriptText) {
          combinedNotes = `${inlineLeadForm.notes}\n\n=== Live Chat Transcript ===\n${transcriptText}`;
        }
      }

      const payload = {
        name: inlineLeadForm.name,
        email: inlineLeadForm.email,
        company: inlineLeadForm.company,
        phone: inlineLeadForm.phone,
        notes: `Preferred Meeting Time: ${inlineLeadForm.meetingTime || "Not selected"}\nMarketing Consent Given: ${inlineLeadForm.consent ? "Yes" : "No"}\nServices of Interest: ${selectedServices.length > 0 ? selectedServices.join(", ") : "None selected"}\n\n${combinedNotes}`,
        chatTranscript: chatMessages
          .filter(m => m.id !== 'system_1' && m.id !== 'welcome_1')
          .map(m => ({
            sender: m.sender,
            text: getTranslatedMessageText(m, selectedLang),
            timestamp: m.timestamp
          }))
      };

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setInlineLeadSuccess(true);
        fetchLeads();
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          console.log("Form saved. Relaying lead details to Gemini Live to book meeting...");
          const triggerMsg = `[SYSTEM MESSAGE: The user has filled out the contact form. Name: ${inlineLeadForm.name}, Email: ${inlineLeadForm.email}, Phone: ${inlineLeadForm.phone || "Not provided"}, Selected Preferred Meeting Time: ${inlineLeadForm.meetingTime || "Not provided"}, Services of Interest: ${selectedServices.length > 0 ? selectedServices.join(", ") : "None selected"}. Please proceed to book the meeting using the calendar_book_meeting tool for this exact selected date/time now.]`;
          wsRef.current.send(JSON.stringify({ text: triggerMsg }));
        }
      } else {
        setInlineLeadError(data.error || "Failed to submit lead.");
      }
    } catch (err) {
      console.error("Error submitting inline lead:", err);
      setInlineLeadError("An error occurred while saving your lead.");
    } finally {
      setIsSubmittingInlineLead(false);
    }
  };

  const handleEndConversation = () => {
    disconnect();
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
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0) return;
    
    setIsSubmittingReview(true);
    try {
      const payload = {
        rating: reviewRating,
        comment: reviewText,
        chatTranscript: chatMessages
          .filter(m => m.id !== 'system_1' && m.id !== 'welcome_1')
          .map(m => ({
            sender: m.sender,
            text: getTranslatedMessageText(m, selectedLang),
            timestamp: m.timestamp
          }))
      };

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setReviewSubmitted(true);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Refs for Audio Logic
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const ensureAudioContexts = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
    }
    if (!inputAudioContextRef.current) {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    if (!inputAnalyserRef.current && inputAudioContextRef.current) {
      inputAnalyserRef.current = inputAudioContextRef.current.createAnalyser();
      inputAnalyserRef.current.fftSize = 64;
    }

    if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
    if (inputAudioContextRef.current.state === 'suspended') inputAudioContextRef.current.resume();
  };

  useEffect(() => {
    let animationFrameId: number;
    const updateVolume = () => {
      let outputVol = 0;
      let inputVol = 0;

      if (isConnected) {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          outputVol = dataArray.reduce((a, b) => a + b) / dataArray.length;
        }
        if (inputAnalyserRef.current) {
          const dataArray = new Uint8Array(inputAnalyserRef.current.frequencyBinCount);
          inputAnalyserRef.current.getByteFrequencyData(dataArray);
          inputVol = dataArray.reduce((a, b) => a + b) / dataArray.length;
        }
      }
      
      const combinedVol = Math.max(outputVol, inputVol);
      setVolume(combinedVol);
      animationFrameId = requestAnimationFrame(updateVolume);
    };
    updateVolume();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isConnected]);

  const pauseSession = () => {
    setIsPaused(true);
    isPausedRef.current = true;
    setVolume(0);
    setChatMessages(prev => [
      ...prev,
      {
        id: `msg_sys_pause_${Date.now()}`,
        sender: 'system',
        text: 'ℹ️ Sesión en pausa. Escribe un mensaje en el campo de texto de abajo para reanudar la sesión.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeMs: Date.now()
      }
    ]);
  };

  const resumeSession = () => {
    setIsPaused(false);
    isPausedRef.current = false;
    lastInteractionTimeRef.current = Date.now();
    setChatMessages(prev => [
      ...prev,
      {
        id: `msg_sys_resume_${Date.now()}`,
        sender: 'system',
        text: 'ℹ️ Sesión reanudada.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeMs: Date.now()
      }
    ]);
  };

  useEffect(() => {
    if (!isConnected || isPaused) return;
    const interval = setInterval(() => {
      const inactiveMs = Date.now() - lastInteractionTimeRef.current;
      if (inactiveMs > 60000) {
        console.log("Auto-pausing session due to 60s inactivity");
        pauseSession();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isConnected, isPaused]);

  const connectToGemini = async (initialPrompt?: string, isVoiceConnection: boolean = false, langOverride?: 'EN' | 'ES') => {
    setError(null);
    setShowReviewScreen(false);
    setRightPanelTab('chat');
    setIsPaused(false);
    isPausedRef.current = false;
    lastInteractionTimeRef.current = Date.now();
    setScores({ grammar: 0, pronunciation: 0, confidence: 0, naturalness: 0 });
    setLearnedWords([]);
    setAccentPatterns([]);
    ensureAudioContexts();
    
    if (initialPrompt && !isVoiceConnection) {
      setChatMessages([
        {
          id: `msg_${Date.now()}`,
          sender: 'user',
          text: initialPrompt,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeMs: Date.now()
        }
      ]);
    } else {
      setChatMessages([
        {
          id: `msg_sys_${Date.now()}`,
          sender: 'system',
          text: (langOverride || selectedLang) === 'EN' ? '🎙️ Connecting to Voyager... Please speak clearly.' : '🎙️ Conectando con Voyager... Por favor habla claro.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          timeMs: Date.now()
        }
      ]);
    }
    
    try {
      setStatusText("Connecting...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const activeLang = langOverride || selectedLang;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/live?lang=${activeLang}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setStatusText("Connected");
        console.log("WebSocket connection to server established");
        
        setChatMessages(prev => [
          ...prev,
          {
            id: `msg_sys_open_${Date.now()}`,
            sender: 'system',
            text: '🟢 Connected! Speaking is active with SPLASH.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timeMs: Date.now()
          }
        ]);

        if (!inputAudioContextRef.current) return;
        const ctx = inputAudioContextRef.current;
        const source = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        
        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          if (isPausedRef.current) return;
          // Update activity timer when audio is streaming from mic
          lastInteractionTimeRef.current = Date.now();
          const resampled = resampleAudioBuffer(e.inputBuffer, 16000);
          const pcm16 = float32ToPcm16(resampled);
          const pcmBytes = new Uint8Array(pcm16.buffer);
          const base64Data = bytesToBase64(pcmBytes);
          ws.send(JSON.stringify({ audio: base64Data }));
        };

        source.connect(processor);
        if (inputAnalyserRef.current) {
          source.connect(inputAnalyserRef.current);
        }
        processor.connect(ctx.destination);
        
        sourceRef.current = source;
        processorRef.current = processor;
      };

      ws.onmessage = async (event) => {
        try {
          // Reset inactivity timer when server sends any message/audio/text
          lastInteractionTimeRef.current = Date.now();
          const msg = JSON.parse(event.data);
          
          if (msg.status === "connected") {
            console.log("Gemini session is active on the backend. Dispatching welcome greeting.");
            let greeting = initialPrompt || (
              selectedLang === 'ES'
                ? "Por favor preséntate en español como VOYAGER, dime que estás muy emocionado de ser mi tutor de inglés estadounidense y asesor cultural, y pregúntame cuál es mi nombre para saber cómo dirigirte a mí (y adaptar los adjetivos en español a mi género correctamente)."
                : "Please greet me in English as VOYAGER, say you are excited to help me practice and master American English as my tutor, and ask for my name so you can address me properly."
            );
            if (isBilingualModeRef.current) {
              greeting += "\n\n[SYSTEM MESSAGE: You are now in BILINGUAL TRANSLATION MODE. For EVERY SINGLE response, you must first speak and write your response in Spanish, and then immediately repeat the exact same response only in English. Separate the Spanish and English sentences with a slash '/'. Your entire response must consist of the Spanish version followed directly by the English translation, both in your voice output and in your text transcription.]";
            } else if (isTranslateModeRef.current) {
              greeting += "\n\n[SYSTEM MESSAGE: You are now in INSTANT TRANSLATION MODE. You must act strictly and purely as a speech translator. Do NOT hold a conversation, do NOT give tips, do NOT make small talk, and do NOT guide the user. Your ONLY job is to immediately translate whatever you hear: if you hear Spanish, translate it to English; if you hear English, translate it to Spanish. Output ONLY the translated words and absolutely nothing else, both in your voice and in your text transcription. Keep translations instantaneous, brief, and exact.]";
            } else if (isListenOnlyRef.current) {
              greeting += "\n\n[SYSTEM MESSAGE: You are now starting in Monitor/Listen-only mode. The user is practicing by talking to a real person. You must only listen and analyze their English interaction. Do NOT speak. You can only respond via text. In your text responses, offer helpful, subtle language corrections or tips about their conversation, and if you want to speak aloud, explicitly ask the user for permission to talk (e.g. '¿Puedo hablar?').]";
            } else if (isSpanishOnlyModeRef.current) {
              greeting += "\n\n[SYSTEM MESSAGE: You are now in SPANISH ONLY MODE. You must speak and write strictly and purely in Spanish from now on. Discuss daily life and scenarios in America in Spanish. Do NOT teach English, evaluate grammar, or translate any text. Speak only in Spanish.]";
            } else if (isEnglishOnlyModeRef.current) {
              greeting += "\n\n[SYSTEM MESSAGE: You are now in ENGLISH ONLY MODE. You must speak and write strictly and purely in English. Do NOT provide any Spanish translations, hints, corrections, or bilingual tips. Speak naturally as an American English speaker. This is a pure immersion practice mode for advanced students. Speak only in English.]";
            }
            
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ text: greeting }));
            }
            return;
          }
          
          if (msg.error) {
             console.error("Server reported error:", msg.error);
             setError(msg.error);
             disconnect();
             return;
          }

          if (msg.meetingBooked) {
             console.log("Meeting booked successfully. Transitioning to end chat review screen.");
             handleEndConversation();
             return;
          }

          if (msg.languageSwitch) {
            setSelectedLang(msg.languageSwitch);
          }

          if (msg.progressUpdate) {
            console.log("Received progress update from tool:", msg.progressUpdate);
            const { scores, learnedWords, accentTips, completedMissionId } = msg.progressUpdate;
            
            if (scores) {
              setScores({
                grammar: scores.grammar || 0,
                pronunciation: scores.pronunciation || 0,
                confidence: scores.confidence || 0,
                naturalness: scores.naturalness || 0
              });
            }
            
            if (learnedWords && learnedWords.length > 0) {
              setLearnedWords(prev => {
                const updated = [...prev];
                learnedWords.forEach((w: string) => {
                  if (!updated.includes(w)) updated.push(w);
                });
                return updated;
              });
            }
            
            if (accentTips) {
              setAccentPatterns(prev => {
                if (!prev.includes(accentTips)) {
                  return [...prev, accentTips];
                }
                return prev;
              });
            }
            return;
          }

          if (msg.mapAction) {
            console.log("Received mapAction:", msg.mapAction, msg.data);
            if (msg.mapAction === "show_location") {
              const { placeName, latitude, longitude, description } = msg.data;
              setMapCenter({ lat: latitude, lng: longitude });
              setMapZoom(15);
              setMarkers(prev => [
                ...prev,
                {
                  id: `marker_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                  lat: latitude,
                  lng: longitude,
                  title: placeName,
                  description: description
                }
              ]);
              setRouteInfo(null);
            } else if (msg.mapAction === "draw_route") {
              const { origin, destination, travelMode, description } = msg.data;
              setRouteInfo({ origin, destination, travelMode, description });
              setMarkers([]);
            }
          }

          if (msg.userTranscription) {
             setChatMessages(prev => {
                const last = prev[prev.length - 1];
                if (last && last.sender === 'user' && last.id.startsWith('msg_voice_trans_') && (Date.now() - last.timeMs < 6000)) {
                   const updated = [...prev];
                   updated[updated.length - 1] = {
                      ...last,
                      text: last.text + msg.userTranscription,
                      timeMs: Date.now()
                   };
                   return updated;
                } else {
                   return [...prev, {
                      id: `msg_voice_trans_${Date.now()}`,
                      sender: 'user',
                      text: msg.userTranscription,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      timeMs: Date.now()
                   }];
                }
             });
          }

          if (msg.text) {
             setChatMessages(prev => {
                const last = prev[prev.length - 1];
                const formPattern = /\[SHOW[-_ ]FORM\]|\(SHOW[-_ ]FORM\)/gi;
                if (last && last.sender === 'splash' && !last.id.startsWith('welcome_') && (Date.now() - last.timeMs < 10000)) {
                   const updated = [...prev];
                   const combinedText = last.text + msg.text;
                   
                   // Parse immersion tags
                   const parsed = parseImmersionTags(combinedText);
                   updateLearningState(parsed);

                   // Handle subway map routing
                   // if (/(subway\s*map|metro\s*map|network\s*grid|subway\s*grid|subway\s*system|mapa\s*de\s*metro|mapa\s*del\s*metro|red\s*de\s*metro|transit\s*map|mapa\s*de\s*tr[aá]nsito)/i.test(parsed.cleaned)) {
                   //    setRightPanelTab('lessons');
                   //    setClassroomSubTab('subway_map');
                   // }

                   const hasFormTag = formPattern.test(parsed.cleaned) || last.showForm || msg.showForm;
                   const cleanedText = parsed.cleaned.replace(formPattern, "");
                   updated[updated.length - 1] = {
                      ...last,
                      text: cleanedText,
                      showForm: hasFormTag,
                      timeMs: Date.now()
                   };
                   return updated;
                } else {
                   const parsed = parseImmersionTags(msg.text);
                   updateLearningState(parsed);

                   // Handle subway map routing
                   // if (/(subway\s*map|metro\s*map|network\s*grid|subway\s*grid|subway\s*system|mapa\s*de\s*metro|mapa\s*del\s*metro|red\s*de\s*metro|transit\s*map|mapa\s*de\s*tr[aá]nsito)/i.test(parsed.cleaned)) {
                   //    setRightPanelTab('lessons');
                   //    setClassroomSubTab('subway_map');
                   // }

                   const hasFormTag = formPattern.test(parsed.cleaned) || msg.showForm;
                   const cleanedText = parsed.cleaned.replace(formPattern, "");
                   return [...prev, {
                      id: `msg_${Date.now()}_${Math.random()}`,
                      sender: 'splash',
                      text: cleanedText,
                      showForm: hasFormTag,
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      timeMs: Date.now()
                   }];
                }
             });
          }

          if (msg.audio && audioContextRef.current && !isListenOnlyRef.current && !isPausedRef.current) {
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
              ctx.resume();
            }
            const pcmData = new Int16Array(base64ToBytes(msg.audio).buffer);
            const audioBuffer = createAudioBufferFromPCM(ctx, pcmData, 24000);
            
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            
            if (analyserRef.current) {
              source.connect(analyserRef.current);
              analyserRef.current.connect(ctx.destination);
            } else {
               source.connect(ctx.destination);
            }

            const now = ctx.currentTime;
            const startTime = Math.max(now, nextStartTimeRef.current);
            source.start(startTime);
            nextStartTimeRef.current = startTime + audioBuffer.duration;
          }
        } catch (e) {
          console.error("Error reading message:", e);
        }
      };

      ws.onclose = () => {
         console.log("WebSocket connection closed");
         disconnect();
      };

      ws.onerror = (err) => {
         console.error("WebSocket error:", err);
         setError("Server connection error");
         disconnect();
      };

    } catch (err: any) {
        console.error("Connection Failed", err);
        setError(err.message || "Error connecting or accessing microphone. Please ensure microphone permissions are granted.");
        setStatusText("Disconnected");
    }
  };

  const disconnect = () => {
    if (statusText === "Disconnected" && !wsRef.current) return;
    setIsConnected(false);
    setStatusText("Disconnected");
    setVolume(0);
    setIsPaused(false);
    isPausedRef.current = false;
    
    setChatMessages(prev => [
      ...prev,
      {
        id: `msg_sys_close_${Date.now()}`,
        sender: 'system',
        text: '🔴 Disconnected from VOYAGER Voice Agent.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeMs: Date.now()
      }
    ]);
    
    if (wsRef.current) {
       const ws = wsRef.current;
       wsRef.current = null;
       ws.onopen = null;
       ws.onmessage = null;
       ws.onerror = null;
       ws.onclose = null;

       if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
         try {
           ws.close();
         } catch (e) {
           console.error("Error closing WebSocket:", e);
         }
       }
    }

    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
    if (processorRef.current && inputAudioContextRef.current) {
        processorRef.current.disconnect();
        if (sourceRef.current) sourceRef.current.disconnect();
    }
    nextStartTimeRef.current = 0;
  };

  useEffect(() => {
    if (showReviewScreen) {
      disconnect();
    }
  }, [showReviewScreen]);

  const handleLanguageChange = (lang: 'EN' | 'ES') => {
    if (selectedLang === lang) return;
    
    setSelectedLang(lang);
    
    if (isConnected || statusText === "Connecting...") {
      disconnect();
      const isEn = lang === 'EN';
      const prompt = isEn 
        ? "Hello! Let's talk in English now. Please introduce yourself in English in one short sentence, and ask how you can help."
        : "¡Hola! Hablemos en español ahora. Por favor, preséntate en español en una frase corta y pregúntame cómo puedes ayudar.";
      
      setTimeout(() => {
        connectToGemini(prompt, true, lang);
      }, 150);
    }
  };
  
  const handleSuggestionClick = (text: string) => {
      setChatMessages(prev => {
        if (prev.some(m => m.text === text && m.sender === 'user')) return prev;
        return [
          ...prev,
          {
            id: `msg_suggest_${Date.now()}`,
            sender: 'user',
            text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timeMs: Date.now()
          }
        ];
      });

      // Automatically transition tab on subway map keywords
      // if (/(subway\s*map|metro\s*map|network\s*grid|subway\s*grid|subway\s*system|mapa\s*de\s*metro|mapa\s*del\s*metro|red\s*de\s*metro|transit\s*map|mapa\s*de\s*tr[aá]nsito)/i.test(text)) {
      //   setRightPanelTab('lessons');
      //   setClassroomSubTab('subway_map');
      // }

      if (!isConnected) {
          connectToGemini(text);
      } else {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
             wsRef.current.send(JSON.stringify({ text }));
          }
      }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    lastInteractionTimeRef.current = Date.now();
    if (isPausedRef.current) {
      resumeSession();
    }

    const textToSend = inputText.trim();
    setInputText("");

    setChatMessages(prev => [
      ...prev,
      {
        id: `msg_text_${Date.now()}`,
        sender: 'user',
        text: textToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeMs: Date.now()
      }
    ]);

    // Automatically transition subtab on subway map keywords
    if (/(subway\s*map|metro\s*map|network\s*grid|subway\s*grid|subway\s*system|mapa\s*de\s*metro|mapa\s*del\s*metro|red\s*de\s*metro|transit\s*map|mapa\s*de\s*tr[aá]nsito)/i.test(textToSend)) {
      setClassroomSubTab('subway_map');
    }

    if (isConnected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
       wsRef.current.send(JSON.stringify({ text: textToSend }));
    } else {
       connectToGemini(textToSend, false);
    }
  };

     return (
       <div className={`
           relative flex flex-col items-center justify-center overflow-y-auto md:overflow-hidden p-4 md:p-8
           ${isWidgetMode ? 'w-full h-full bg-black' : 'w-full min-h-screen bg-black'}
           text-zinc-900 font-sans transition-all duration-300
       `}>
        <style dangerouslySetInnerHTML={{__html: `
            @import url('https://fonts.googleapis.com/css2?family=Allerta&display=swap');
            @keyframes blackNeonPulse {
                0% {
                    text-shadow:
                        0 0 4px #000000,
                        0 0 8px #000000,
                        0 0 15px rgba(0, 0, 0, 0.9),
                        0 0 30px rgba(0, 0, 0, 0.7);
                }
                50% {
                    text-shadow:
                        0 0 6px #000000,
                        0 0 12px #000000,
                        0 0 25px rgba(0, 0, 0, 0.95),
                        0 0 50px rgba(0, 0, 0, 0.95),
                        0 0 80px rgba(0, 0, 0, 0.75);
                }
                100% {
                    text-shadow:
                        0 0 4px #000000,
                        0 0 8px #000000,
                        0 0 15px rgba(0, 0, 0, 0.9),
                        0 0 30px rgba(0, 0, 0, 0.7);
                }
            }
            .animate-black-neon-glow {
                animation: blackNeonPulse 2.5s ease-in-out infinite;
            }
            @keyframes subMenuFlicker {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.55; transform: scale(0.9); }
            }
            .animate-submenu-flicker {
                animation: subMenuFlicker 1.4s infinite ease-in-out;
            }
            .theme-light {
                background-color: #f5efe6 !important;
            }
            .theme-light .bg-black\\/45 {
                background-color: transparent !important;
                color: #18181b !important;
            }
            .theme-light .border-white\\/10 {
                border: none !important;
            }
            .theme-light .text-white {
                color: #18181b !important;
            }
            .theme-light .text-neutral-100 {
                color: #18181b !important;
            }
            .theme-light .text-neutral-200 {
                color: #27272a !important;
            }
            .theme-light .text-neutral-300 {
                color: #3f3f46 !important;
            }
            .theme-light .text-neutral-400 {
                color: #71717a !important;
            }
            .theme-light .bg-zinc-100 {
                background-color: #faf9f6 !important;
            }
            .theme-light .bg-white\\/5 {
                background-color: #faf9f6 !important;
                border: none !important;
            }
            .theme-light .bg-\\[\\#1f1f23\\]\\/60 {
                background-color: #faf9f6 !important;
                border: none !important;
            }
            .theme-light .border-white\\/5 {
                border: none !important;
            }
            .theme-light .text-yellow-400 {
                color: #ca8a04 !important;
            }
            .theme-light .bg-yellow-500\\/10 {
                background-color: rgba(202, 138, 4, 0.1) !important;
            }
            .theme-light .border-yellow-500\\/30 {
                border: none !important;
            }
            .theme-light .text-emerald-400 {
                color: #059669 !important;
            }
            .theme-light .bg-white {
                background-color: #18181b !important;
                color: #ffffff !important;
            }
            .theme-light .text-neutral-500 {
                color: #71717a !important;
            }
            .theme-light button.bg-\\[\\#1e3a8a\\] {
                color: #ffffff !important;
            }
            .theme-light [class*="border"] {
                border: none !important;
            }
            .tab-content-area .text-xs,
            .tab-content-area .text-\\[12px\\],
            .tab-content-area .text-sm,
            .tab-content-area .text-\\[14px\\] {
                font-size: 18.5px !important;
                line-height: 1.6 !important;
            }
            .tab-content-area .text-\\[10px\\],
            .tab-content-area .text-\\[9px\\],
            .tab-content-area .text-neutral-400 {
                font-size: 14.5px !important;
            }
            .tab-content-area .text-lg,
            .tab-content-area .text-xl,
            .tab-content-area h3 {
                font-size: 22px !important;
            }
            .tab-content-area p {
                font-size: 18.5px !important;
                line-height: 1.6 !important;
            }
            .tab-content-area .chat-message-text {
                font-family: "American Typewriter", "Courier New", Courier, Georgia, serif !important;
                font-size: 12pt !important;
            }
            .tab-content-area .chat-message-english {
                font-size: 11pt !important;
                line-height: 1.25 !important;
                font-weight: normal !important;
                letter-spacing: -0.15px !important;
            }
            .tab-content-area input.chat-input-text {
                font-family: "American Typewriter", "Courier New", Courier, Georgia, serif !important;
                font-size: 12pt !important;
                font-weight: 600 !important;
                letter-spacing: 0.05em !important;
            }
            .tab-content-area input,
            .tab-content-area textarea,
            .tab-content-area select,
            .tab-content-area button {
                font-size: 14.5px !important;
            }
            .tab-content-area label {
                font-size: 14px !important;
            }
        `}} />
        {/* Background Image & Overlay */}
        {!isWidgetMode && (
             <div className="absolute inset-0 z-0 pointer-events-none bg-black">
                 <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
             </div>
        )}

        {/* Outer Grid Layout */}
        <div className={`relative z-10 flex flex-col md:flex-row items-stretch justify-center w-full ${isWidgetMode ? 'max-w-full h-full space-y-4 md:space-y-0 md:space-x-4' : 'max-w-6xl space-y-8 md:space-y-0 md:space-x-8 animate-fade-in'}`}>
            
            {/* Left Column */}
            <div className="w-full md:w-5/12 max-w-md mx-auto md:mx-0 flex flex-col items-center justify-between space-y-6 bg-[#0a192f] backdrop-blur-2xl rounded-3xl p-6 shadow-2xl relative border border-blue-900/60">
                
                {isWidgetMode && onClose && (
                    <button onClick={onClose} className="absolute top-2 right-2 text-white/50 hover:text-white cursor-pointer">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}

                <div className="text-center mt-4 flex flex-col items-center w-full">
                    <h2 style={{ letterSpacing: '0.25em' }} className="font-tech uppercase text-xl md:text-2xl font-bold text-white tracking-widest">
                        YO SOY
                    </h2>
                    <h1 style={{ letterSpacing: '0.12em' }} className="font-tech uppercase text-5xl md:text-6xl font-black text-white mt-1.5 animate-black-neon-glow">
                        VOYAGER
                    </h1>
                    <p style={{ letterSpacing: '0.22em' }} className="text-[10px] md:text-xs text-yellow-400 font-mono font-bold uppercase mt-2">
                        TUTOR DE INGLÉS AMERICANO
                    </p>
                </div>

                <div className="w-full flex-1 flex flex-col items-center justify-center space-y-6 py-4 animate-fade-in">
                    <style dangerouslySetInnerHTML={{__html: `
                        @keyframes orbFluid {
                            0%, 100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; }
                            33% { border-radius: 70% 30% 52% 48% / 60% 40% 60% 40%; }
                            66% { border-radius: 50% 50% 30% 70% / 40% 60% 30% 70%; }
                        }
                        .animate-orb-fluid {
                            animation: orbFluid 10s ease-in-out infinite;
                        }
                        @keyframes zeroGFloat {
                            0% { transform: translateY(0px) rotate(0deg) scale(1); }
                            25% { transform: translateY(-6px) rotate(0.8deg) scale(1.008); }
                            50% { transform: translateY(-12px) rotate(-0.5deg) scale(1.015); }
                            75% { transform: translateY(-6px) rotate(-1deg) scale(1.008); }
                            100% { transform: translateY(0px) rotate(0deg) scale(1); }
                        }
                        @keyframes yellowGlowPulse {
                            0%, 100% { box-shadow: 0 0 10px rgba(234, 179, 8, 0.4), 0 0 5px rgba(234, 179, 8, 0.2); }
                            50% { box-shadow: 0 0 24px rgba(234, 179, 8, 0.85), 0 0 12px rgba(234, 179, 8, 0.5); }
                        }
                        .animate-yellow-glow-pulse {
                            animation: yellowGlowPulse 2.5s ease-in-out infinite;
                        }
                    `}} />

                    <div className="relative flex items-center justify-center w-64 h-[380px]">
                        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-yellow-500/10 via-amber-500/15 to-orange-500/10 blur-3xl animate-pulse duration-[3000ms]"></div>
                        
                        <div className="relative w-full h-full flex flex-col items-center justify-center -translate-y-[70px]">
                            <canvas 
                                ref={particleCanvasRef} 
                                width={360} 
                                height={360} 
                                className="z-20 transition-transform duration-75 animate-float-zero-g"
                            />
                        </div>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
                            {isConnected ? (
                                <button
                                    onClick={handleEndConversation}
                                    className="px-7 py-2.5 text-[12.5px] font-mono font-bold tracking-widest uppercase rounded-full transition-all duration-300 cursor-pointer whitespace-nowrap bg-white text-black hover:bg-zinc-100 hover:scale-[1.02] active:scale-95 shadow-md"
                                >
                                    {translations[selectedLang].disconnectBtn}
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (statusText === "Connecting...") return;
                                        const isEn = selectedLang === 'EN';
                                        const prompt = isEn 
                                            ? "Hello! Please introduce yourself in one short sentence, and ask how you can help."
                                            : "¡Hola! Por favor, preséntate en una frase corta y pregúntame cómo te puedo ayudar.";
                                        connectToGemini(prompt, true);
                                    }}
                                    disabled={statusText === "Connecting..."}
                                    className={`px-7 py-2.5 text-[12.5px] font-mono font-bold tracking-widest uppercase rounded-full transition-all duration-300 cursor-pointer whitespace-nowrap ${
                                        statusText === "Connecting..."
                                        ? 'bg-emerald-600 text-white animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                                        : 'bg-white text-black animate-yellow-glow-pulse hover:bg-zinc-100 hover:scale-[1.02] active:scale-95'
                                    }`}
                                >
                                    {statusText === "Connecting..." ? translations[selectedLang].connecting : translations[selectedLang].connect}
                                </button>
                            )}

                            {/* Session Status Display */}
                            {isConnected && (
                                <div className="flex items-center gap-1.5 mt-0.5 animate-fade-in">
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-500" />
                                    <span className="text-[10px] font-sans font-bold text-neutral-300 uppercase tracking-widest">
                                        {`Sesión (${Math.floor(secondsElapsed / 60)}:${(secondsElapsed % 60).toString().padStart(2, '0')})`}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
 
                {error && (
                    <div className="w-full bg-red-950/45 border border-red-500/35 rounded-xl p-3 text-center space-y-2 animate-fade-in max-w-sm shadow-lg backdrop-blur-md mb-2">
                        <div className="flex items-center justify-center space-x-2 text-red-400 font-semibold text-xs">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{translations[selectedLang].connectionError}</span>
                        </div>
                        <p className="text-[10px] text-neutral-200 leading-relaxed font-mono bg-black/30 p-2 rounded border border-white/5">{error}</p>
                        {(error.toLowerCase().includes('api') || error.toLowerCase().includes('key') || error.toLowerCase().includes('expired') || error.toLowerCase().includes('clave') || error.toLowerCase().includes('caducada')) && (
                            <div className="text-[10px] text-neutral-300 bg-black/55 p-2 rounded-lg text-left space-y-1 border border-white/5">
                                <p className="font-semibold text-yellow-500/90">{translations[selectedLang].howToFix}</p>
                                <ol className="list-decimal pl-4 space-y-0.5 text-neutral-400">
                                    <li>{translations[selectedLang].step1}</li>
                                    <li>{translations[selectedLang].step2}</li>
                                    <li>{translations[selectedLang].step3}</li>
                                </ol>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={`w-full md:w-7/12 mx-auto md:mx-0 flex-1 flex flex-col justify-start backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl min-h-[480px] md:min-h-[580px] font-tech relative transition-all duration-500 ${showReviewScreen ? 'bg-zinc-950 text-white shadow-[0_10px_35px_rgba(0,0,0,0.3)]' : 'bg-white text-zinc-900 shadow-[0_10px_35px_rgba(0,0,0,0.08)] theme-light border-[6px] border-[#0a192f]'}`}>
                


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
                                            text: 'Hi! I\'m VOYAGER, your American English tutor and cultural advisor. Click Connect to start a voice-and-text conversation.',
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
                        {hasInteracted && (
                            <div className="w-full bg-[#ebd5a3] border-b border-[#dfc389] py-4 px-4 flex items-center justify-center flex-shrink-0 z-10">
                                {rightPanelTab === 'chat' && (
                                    <div className="flex items-center justify-center gap-2 flex-wrap max-w-full">
                                        {/* Bilingual Option Toggle */}
                                        <button 
                                            onClick={() => {
                                                const nextVal = !isBilingualMode;
                                                setIsBilingualMode(nextVal);
                                                if (nextVal) {
                                                    setIsTranslateMode(false);
                                                    setIsListenOnly(false);
                                                    setIsSpanishOnlyMode(false);
                                                    setIsEnglishOnlyMode(false);
                                                }
                                            }}
                                            style={{ fontFamily: "'Allerta', sans-serif", color: isBilingualMode ? '#ffffff' : '#231d17' }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all duration-200 flex-shrink-0 ${
                                                isBilingualMode 
                                                ? 'bg-[#9c6b21] shadow-sm' 
                                                : 'bg-transparent'
                                            }`}
                                        >
                                            BILINGÜE
                                        </button>

                                        {/* Translate Option Toggle */}
                                        <button 
                                            onClick={() => {
                                                const nextVal = !isTranslateMode;
                                                setIsTranslateMode(nextVal);
                                                if (nextVal) {
                                                    setIsBilingualMode(false);
                                                    setIsListenOnly(false);
                                                    setIsSpanishOnlyMode(false);
                                                    setIsEnglishOnlyMode(false);
                                                }
                                            }}
                                            style={{ fontFamily: "'Allerta', sans-serif", color: isTranslateMode ? '#ffffff' : '#231d17' }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all duration-200 flex-shrink-0 ${
                                                isTranslateMode 
                                                ? 'bg-[#9c6b21] shadow-sm' 
                                                : 'bg-transparent'
                                            }`}
                                        >
                                            TRADUCE
                                        </button>

                                        {/* Listen Only Option Toggle */}
                                        <button 
                                            onClick={() => {
                                                const nextVal = !isListenOnly;
                                                setIsListenOnly(nextVal);
                                                if (nextVal) {
                                                    setIsBilingualMode(false);
                                                    setIsTranslateMode(false);
                                                    setIsSpanishOnlyMode(false);
                                                    setIsEnglishOnlyMode(false);
                                                }
                                            }}
                                            style={{ fontFamily: "'Allerta', sans-serif", color: isListenOnly ? '#ffffff' : '#231d17' }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all duration-200 flex-shrink-0 ${
                                                isListenOnly 
                                                ? 'bg-[#9c6b21] shadow-sm' 
                                                : 'bg-transparent'
                                            }`}
                                        >
                                            ESCUCHA
                                        </button>

                                        {/* Spanish Option Toggle */}
                                        <button 
                                            onClick={() => {
                                                const nextVal = !isSpanishOnlyMode;
                                                setIsSpanishOnlyMode(nextVal);
                                                if (nextVal) {
                                                    setIsBilingualMode(false);
                                                    setIsTranslateMode(false);
                                                    setIsListenOnly(false);
                                                    setIsEnglishOnlyMode(false);
                                                }
                                            }}
                                            style={{ fontFamily: "'Allerta', sans-serif", color: isSpanishOnlyMode ? '#ffffff' : '#231d17' }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all duration-200 flex-shrink-0 ${
                                                isSpanishOnlyMode 
                                                ? 'bg-[#9c6b21] shadow-sm' 
                                                : 'bg-transparent'
                                            }`}
                                        >
                                            ESPAÑOL
                                        </button>

                                        {/* English Option Toggle */}
                                        <button 
                                            onClick={() => {
                                                const nextVal = !isEnglishOnlyMode;
                                                setIsEnglishOnlyMode(nextVal);
                                                if (nextVal) {
                                                    setIsBilingualMode(false);
                                                    setIsTranslateMode(false);
                                                    setIsListenOnly(false);
                                                    setIsSpanishOnlyMode(false);
                                                }
                                            }}
                                            style={{ fontFamily: "'Allerta', sans-serif", color: isEnglishOnlyMode ? '#ffffff' : '#231d17' }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-all duration-200 flex-shrink-0 ${
                                                isEnglishOnlyMode 
                                                ? 'bg-[#9c6b21] shadow-sm' 
                                                : 'bg-transparent'
                                            }`}
                                        >
                                            ENGLISH
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        {rightPanelTab === 'chat' ? (
                            <div className="flex-grow flex flex-col overflow-hidden h-full">

                                <div className={`flex-1 p-4 pt-2 tab-content-area overflow-y-auto ${
                                    hasInteracted
                                    ? 'max-h-[310px] md:max-h-[390px]' 
                                    : 'h-full flex flex-col items-center justify-center'
                                }`}>
                            {!hasInteracted ? (
                                <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center p-4 animate-fade-in">
                                    <div className="w-full flex items-center justify-center mb-6 relative">
                                        <img 
                                            src="https://cdn.gamma.app/e61o72b77sp71e0/edited-images/xOsepr1r0_Xzzbxf.png" 
                                            alt="Voyager USA Mascot" 
                                            referrerPolicy="no-referrer"
                                            className="w-[432px] h-[432px] md:w-[480px] md:h-[480px] object-contain animate-float-zero-g drop-shadow-[0_15px_15px_rgba(0,0,0,0.15)]" 
                                        />
                                    </div>
                                    <div style={{ letterSpacing: '0.12em', color: '#52525b' }} className="text-[11px] md:text-[12px] font-mono font-bold uppercase text-center max-w-[90%] leading-relaxed">
                                        {selectedLang === 'EN' 
                                            ? '✦ PRESS "CONNECT" ON THE LEFT CONSOLE TO START ✦' 
                                            : '✦ PRESIONA "CONECTAR" EN LA CONSOLA IZQUIERDA PARA INICIAR ✦'}
                                    </div>
                                </div>
                            ) : (
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
                                                                    <div className="font-serif text-zinc-900 leading-snug">{parseAndRenderEmojis(parts[0])}</div>
                                                                    <div className="chat-message-english text-blue-900 font-serif leading-snug mt-2">
                                                                        {parseAndRenderEmojis(parts.slice(1).join(" / "))}
                                                                    </div>
                                                                </>
                                                            );
                                                        }
                                                    }
                                                    return <div className="font-serif leading-snug">{parseAndRenderEmojis(rawText)}</div>;
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
                        )}
                            </div>
                            </div>
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
        </div>


    </div>
  );
};

export default LiveAgent;
