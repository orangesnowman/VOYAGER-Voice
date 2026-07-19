import React, { useState, useEffect, useRef } from 'react';
import { SUGGESTIONS, IMMERSION_CURRICULUM } from '../constants';
import NycMap, { MapMarker, RouteInfo } from './NycMap';
import { NycSubwayMap } from './NycSubwayMap';
import { getAccessToken } from '../services/firebaseAuth';
import { parseAndRenderEmojis } from './VoyagerEmoji';

import { ProgressDashboard } from './ProgressDashboard';
import voyagerRobot from '../assets/images/voyager_robot_1783082204380.png';
import chatAvatarIcon from '../assets/images/voyager_pixel_avatar_1784465509169.jpg';
import { Compass, MapPin, Languages, Sparkles, ArrowLeft, ArrowRight, Headphones, MessageSquare } from 'lucide-react';

import { ChatMessage, Lead, TravelDestination, PronunciationFeedbackEvent, ConversationEvent } from './LiveAgentTypes';
import { TRAVEL_PRESETS } from './TravelPresets';
import { translations, getTranslatedMessageText } from './Translations';
import { CONVERSATION_MODES, ConversationMode } from './ConversationModes';
import { useConversationEngine } from './useConversationEngine';

interface LiveAgentProps {
  isWidgetMode: boolean;
  onClose?: () => void;
}

const LiveAgent: React.FC<LiveAgentProps> = ({ isWidgetMode, onClose }) => {
  const engine = useConversationEngine();
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
    setPronunciationEvents,

    chatMessages,
    setChatMessages,
    addSystemMessage,
    addUserMessage,
    addSplashMessage,

    wsRef
  } = engine;

  const session = engine;

  const [rightPanelTab, setRightPanelTab] = useState<'chat' | 'progress' | 'travel'>('chat');
  const [classroomSubTab, setClassroomSubTab] = useState<'lessons' | 'subway_map'>('lessons');

  // Chat & Leads State
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

  const hasInteracted = isConnected || statusText === "Connecting..." || chatMessages.length > 1;

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

  const pauseSession = () => {
    session.pause();
    addSystemMessage(
      selectedLang === 'EN'
        ? 'ℹ️ Session paused. Type a message below to resume.'
        : 'ℹ️ Sesión en pausa. Escribe un mensaje en el campo de texto de abajo para reanudar la sesión.',
      `msg_sys_pause_${Date.now()}`
    );
  };

  const resumeSession = () => {
    session.resume();
    addSystemMessage(
      selectedLang === 'EN'
        ? 'ℹ️ Session resumed.'
        : 'ℹ️ Sesión reanudada.',
      `msg_sys_resume_${Date.now()}`
    );
  };

  const connectToGemini = async (initialPrompt?: string, isVoiceConnection: boolean = false, langOverride?: 'EN' | 'ES') => {
    setShowReviewScreen(false);
    setRightPanelTab('chat');
    setScores({ grammar: 0, pronunciation: 0, confidence: 0, naturalness: 0 });
    setLearnedWords([]);
    setAccentPatterns([]);
    
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

    session.connect(initialPrompt, isVoiceConnection, langOverride);
  };

  const disconnect = () => {
    session.disconnect();
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

    session.recordInteraction();
    if (session.isPaused) {
      resumeSession();
    }

    const textToSend = inputText.trim();
    setInputText("");

    addUserMessage(textToSend);

    // Automatically transition subtab on subway map keywords
    if (/(subway\s*map|metro\s*map|network\s*grid|subway\s*grid|subway\s*system|mapa\s*de\s*metro|mapa\s*del\s*metro|red\s*de\s*metro|transit\s*map|mapa\s*de\s*tr[aá]nsito)/i.test(textToSend)) {
      setClassroomSubTab('subway_map');
    }

    if (isConnected) {
       session.sendText(textToSend);
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
                                        connectToGemini(undefined, true);
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
                                            onClick={() => setIsBilingualMode(!isBilingualMode)}
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
                                            onClick={() => setIsTranslateMode(!isTranslateMode)}
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
                                            onClick={() => setIsListenOnly(!isListenOnly)}
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
                                            onClick={() => setIsSpanishOnlyMode(!isSpanishOnlyMode)}
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
                                            onClick={() => setIsEnglishOnlyMode(!isEnglishOnlyMode)}
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
