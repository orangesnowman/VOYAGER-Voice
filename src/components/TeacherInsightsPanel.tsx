import React, { useState } from 'react';
import { 
  Star, 
  Award,
  Sparkles,
  UserCheck,
  Globe,
  Clock,
  Check,
  MessageSquareText,
  Video,
  CreditCard,
  Lock,
  Bot,
  MessageSquare,
  Pause,
  Play,
  Apple,
  ChevronRight,
  User,
  BookOpen
} from 'lucide-react';
import { StripePaymentModal } from './StripePaymentModal';
import { parseAndRenderEmojis } from './VoyagerEmoji';

interface TeacherInsightsPanelProps {
  selectedLang: 'EN' | 'ES';
  chatMessages: any[];
  isPaused: boolean;
  isConnected: boolean;
  pause: () => void;
  resume: () => void;
  onAskVoyager: (text: string) => void;
  scores?: {
    grammar: number;
    pronunciation: number;
    confidence: number;
    naturalness: number;
  };
  learnedWords?: string[];
  accentPatterns?: string[];
}

export const TeacherInsightsPanel: React.FC<TeacherInsightsPanelProps> = ({
  selectedLang,
  chatMessages,
  isPaused,
  isConnected,
  pause,
  resume,
  onAskVoyager,
  scores,
  learnedWords,
  accentPatterns
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'welcome' | 'classes' | 'phonetics' | 'support' | 'hire'>('welcome');
  
  // Booking state
  const [bookingModal, setBookingModal] = useState<'sample' | 'monthly' | null>(null);
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('2026-07-30');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [monthlyPackage, setMonthlyPackage] = useState<'4_sessions' | '8_sessions'>('4_sessions');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const activeStripeItemType = bookingModal === 'sample' 
    ? 'sample' 
    : (monthlyPackage === '8_sessions' ? 'monthly_8' : 'monthly_4');

  const triggerAutoExplanation = (tab: 'welcome' | 'classes' | 'phonetics' | 'support' | 'hire') => {
    let prompt = '';
    const noTutoringRule = 'REGLA INQUEBRANTABLE: NO intentes enseñar inglés, NO invites al usuario a practicar inglés, NO inicies juegos de conversación en inglés y NO ofrezcas lecciones. Tu único trabajo aquí es explicar en español la información de esta subsección de La Profe, y preguntarle amigablemente si tiene alguna duda sobre la información mostrada.';
    if (tab === 'welcome') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección 'BIENVENIDO' de La Profe. Explícale brevemente en español quién es Alejandra Francois (La Profe), su especialidad en acento de Nueva York (NYC) y su metodología 1-a-1 en vivo. ${noTutoringRule}]`;
    } else if (tab === 'classes') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección 'CLASES' de La Profe. Explícale en español las opciones de clases particulares semanales (4 clases) y clases intensivas (8 clases), las videollamadas privadas de 30 minutos o 1 hora, y cómo se calendarizan. ${noTutoringRule}]`;
    } else if (tab === 'phonetics') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección 'FONETICA' de La Profe. Explícale en español los análisis de acento personalizado, la corrección de vicios de pronunciación comunes en hispanohablantes (como la diferencia de B vs V o reducción de vocales) y cómo Alejandra diseña las metas fonéticas del estudiante. ${noTutoringRule}]`;
    } else if (tab === 'support') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección 'SOPORTE' de La Profe. Explícale en español que Alejandra ofrece soporte asincrónico directo por chat para revisar audios diariamente, aclarar dudas de tareas y acompañamiento diario para acelerar la fluidez. ${noTutoringRule}]`;
    } else if (tab === 'hire') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección 'CONTRATA' de La Profe. Explícale en español los paquetes oficiales disponibles: Clase Diagnóstica única de $29, el Coaching Mensual de $199 (4 sesiones) o el Coaching Intensivo de $349 (8 sesiones), todos incluyendo plan PRO gratis. ${noTutoringRule}]`;
    }
    if (prompt) {
      onAskVoyager(prompt);
    }
  };

  const handleProceedToStripe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingName || !bookingEmail) return;
    setStripeModalOpen(true);
  };

  const handlePaymentCompleted = (receipt: any) => {
    const typeLabel = bookingModal === 'sample' 
      ? (selectedLang === 'EN' ? '30-Min Sample Diagnostic Class' : 'Clase de Prueba Diagnóstica de 30 Min')
      : (selectedLang === 'EN' ? `Monthly Package (${monthlyPackage === '4_sessions' ? '4 Sessions/mo' : '8 Sessions/mo'})` : `Plan Mensual (${monthlyPackage === '4_sessions' ? '4 Sesiones/mes' : '8 Sesiones/mes'})`);
    
    setBookingSuccess(
      selectedLang === 'EN'
        ? `Payment Approved! You are scheduled for ${typeLabel} with Alejandra Francois (La Profe). Receipt #${receipt.receiptId} sent to ${bookingEmail}.`
        : `¡Pago Aprobado con Éxito! Has agendado ${typeLabel} con Alejandra Francois (La Profe). Recibo #${receipt.receiptId} enviado a ${bookingEmail}.`
    );
  };

  const chatEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  return (
    <div className="flex-1 flex flex-col bg-[#FAF5EC] h-full overflow-hidden animate-fade-in font-sans text-[#231d17]">
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 min-h-0">
        
        {/* THE MAIN LA PROFE CONTAINER CARD WITH PINK BORDER */}
        <div className="bg-white border-[5px] border-red-600/30 rounded-[28px] p-5 shadow-sm space-y-4 text-left flex flex-col flex-shrink-0">
          
          {/* Sub-tab Navigation Header Bar */}
          <div className="flex items-center gap-3 pb-3.5 select-none text-[9.5px] md:text-[10.5px]">
            {/* Red robot icon */}
            <Bot className="w-5 h-5 text-red-600 flex-shrink-0" />
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {[...(['welcome', 'classes', 'phonetics', 'support', 'hire'] as const)].map((tab) => {
                const label = 
                  tab === 'welcome' ? (selectedLang === 'EN' ? 'Welcome' : 'Bienvenido') :
                  tab === 'classes' ? (selectedLang === 'EN' ? 'Classes' : 'Clases') :
                  tab === 'phonetics' ? (selectedLang === 'EN' ? 'Phonetics' : 'Fonética') :
                  tab === 'support' ? (selectedLang === 'EN' ? 'Support' : 'Soporte') :
                  (selectedLang === 'EN' ? 'Hire' : 'Contrata');

                return (
                  <button 
                    key={tab}
                    onClick={() => {
                      if (activeSubTab !== tab) {
                        setActiveSubTab(tab);
                        triggerAutoExplanation(tab);
                      }
                    }}
                    className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none transition-all duration-300 animate-fade-in"
                  >
                    {activeSubTab === tab && (
                      <MessageSquare strokeWidth={3} className="w-3.5 h-3.5 text-red-600 fill-none scale-x-[-1] mt-0.5" />
                    )}
                    <span className={activeSubTab === tab ? 'text-black font-extrabold tracking-wider uppercase' : 'text-neutral-400 font-bold tracking-wider hover:text-red-600 transition-colors uppercase'}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Body Content */}
          <div className="pt-1">
            {activeSubTab === 'welcome' && (
              <div className="animate-fade-in space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-[#231d17] p-0.5 shadow-md flex items-center justify-center text-white font-serif font-black text-2xl">
                      AF
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 border-2 border-white shadow-xs">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-black tracking-tight font-sans">Alejandra Francois</h3>
                      <span className="bg-amber-100 text-amber-900 text-[8px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-300">
                        La Profe
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold text-neutral-600 font-serif mt-0.5">
                      {selectedLang === 'EN' 
                        ? 'Master English Immersion Coach & NYC Accent Specialist' 
                        : 'Coach Maestra de Inmersión en Inglés y Especialista en Acento NYC'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[9.5px] text-neutral-500 font-medium">
                      <span className="flex items-center gap-1 text-amber-700 font-bold">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 5.0 (140+ {selectedLang === 'EN' ? 'Graduates' : 'Graduados'})
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 font-semibold text-neutral-600">
                        <Globe className="w-3.5 h-3.5 text-blue-600" /> {selectedLang === 'EN' ? 'NYC Native' : 'Nativa de NYC'}
                      </span>
                    </div>
                  </div>
                </div>

                <p style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-[10.5pt] leading-relaxed text-black font-serif">
                  {selectedLang === 'EN' 
                    ? 'Alejandra Francois (La Profe) is our Master English Immersion Coach. While VOYAGER handles daily AI conversations, Alejandra offers personalized 1-on-1 private lessons to unlock phonetic blocks, refine your accent, and accelerate your path to business and social fluency.'
                    : 'Alejandra Francois (La Profe) es nuestra Coach Maestra de Inmersión. Mientras VOYAGER guía tu práctica diaria con Inteligencia Artificial, Alejandra te ofrece clases particulares 1-a-1 en vivo para superar trabas fonéticas, pulir tu acento y acelerar tu fluidez comercial y social.'}
                </p>
              </div>
            )}

            {activeSubTab === 'classes' && (
              <div className="animate-fade-in space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-700 flex items-center gap-1.5 font-serif">
                  <Video className="w-4 h-4 text-neutral-700" />
                  {selectedLang === 'EN' ? '1-on-1 Live Classes' : 'Clases 1-a-1 en Vivo'}
                </h4>
                <p style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-[10.5pt] leading-relaxed text-black font-serif">
                  {selectedLang === 'EN' 
                    ? 'Alejandra offers live video-call coaching sessions to evaluate speech pace, conversation flow, and confidence.'
                    : 'Alejandra ofrece sesiones de coaching en videollamada para evaluar el ritmo de habla, la fluidez conversacional y la confianza.'}
                </p>
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-amber-200/50 space-y-2">
                  <div className="flex items-start gap-2 text-[10px]">
                    <Check className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700 font-medium">
                      {selectedLang === 'EN' ? '30-minute diagnostic session or 1-hour monthly classes.' : 'Sesión de diagnóstico de 30 minutos o clases mensuales de 1 hora.'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px]">
                    <Check className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700 font-medium">
                      {selectedLang === 'EN' ? 'Live practice on realistic business meetings and presentations.' : 'Práctica en vivo basada en reuniones de negocios y presentaciones reales.'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px]">
                    <Check className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700 font-medium">
                      {selectedLang === 'EN' ? 'Personalized scheduling calendar integrated in the platform.' : 'Calendario de reservas personalizado integrado en la plataforma.'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'phonetics' && (
              <div className="animate-fade-in space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-700 flex items-center gap-1.5 font-serif">
                  <Sparkles className="w-4 h-4 text-neutral-700" />
                  {selectedLang === 'EN' ? 'Accent & Phonetic Correction' : 'Corrección Fonética y Acento'}
                </h4>
                <p style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-[10.5pt] leading-relaxed text-black font-serif">
                  {selectedLang === 'EN' 
                    ? 'Targeted accent reduction to identify and correct Spanish-to-English phonetic shifts.'
                    : 'Reducción de acento focalizada para identificar y corregir vicios de pronunciación comunes de hispanohablantes.'}
                </p>
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-amber-200/50 space-y-2">
                  <div className="flex items-start gap-2 text-[10px]">
                    <Check className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700 font-medium">
                      {selectedLang === 'EN' ? 'Phonetic log targeting vowel reductions and letter linking.' : 'Registro de objetivos fonéticos como reducción de vocales y enlace de letras.'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px]">
                    <Check className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700 font-medium">
                      {selectedLang === 'EN' ? 'Specific exercises to correct B vs V and final consonant sounds.' : 'Ejercicios específicos para corregir sonidos de B vs V y consonantes finales.'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'support' && (
              <div className="animate-fade-in space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-700 flex items-center gap-1.5 font-serif">
                  <MessageSquareText className="w-4 h-4 text-neutral-700" />
                  {selectedLang === 'EN' ? 'Asynchronous Direct Chat Support' : 'Acompañamiento y Chat Asincrónico'}
                </h4>
                <p style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-[10.5pt] leading-relaxed text-black font-serif">
                  {selectedLang === 'EN' 
                    ? 'Alejandra acts as your private coach in between live lessons, tracking your progress via chat logs.'
                    : 'Alejandra actúa como tu mentora privada entre clases en vivo, siguiendo tu progreso a través del historial de chat.'}
                </p>
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-amber-200/50 space-y-2">
                  <div className="flex items-start gap-2 text-[10px]">
                    <Check className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700 font-medium">
                      {selectedLang === 'EN' ? 'Direct voice message reviews of your daily spoken practice.' : 'Revisiones de voz directas sobre tu práctica hablada diaria.'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-[10px]">
                    <Check className="w-3.5 h-3.5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700 font-medium">
                      {selectedLang === 'EN' ? 'Priority 24/7 communications line included in immersive coaching.' : 'Línea de comunicación prioritaria 24/7 en los planes de inmersión.'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'hire' && (
              <div className="animate-fade-in space-y-4">
                {bookingSuccess ? (
                  <div className="bg-emerald-50 border-2 border-emerald-500/30 rounded-xl p-4 text-center space-y-2.5">
                    <Check className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-[10.5pt] leading-normal text-emerald-950 font-serif">
                      {bookingSuccess}
                    </p>
                    <button
                      onClick={() => setBookingSuccess(null)}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors uppercase tracking-wider bg-transparent border-none cursor-pointer"
                    >
                      {selectedLang === 'EN' ? 'Book Another Session' : 'Reservar Otra Sesión'}
                    </button>
                  </div>
                ) : bookingModal ? (
                  <form onSubmit={handleProceedToStripe} className="bg-zinc-50/50 border border-zinc-200 rounded-xl p-4 space-y-3.5 text-xs text-black">
                    <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                      <span className="font-bold text-neutral-800 font-sans uppercase">
                        {bookingModal === 'sample' 
                          ? (selectedLang === 'EN' ? '1-on-1 Diagnostic Class' : 'Clase de Diagnóstico 1-a-1')
                          : (selectedLang === 'EN' ? 'Monthly Coaching Package' : 'Paquete de Coaching Mensual')}
                      </span>
                      <span className="font-bold font-mono text-neutral-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md text-[10px]">
                        {bookingModal === 'sample' ? '$29.00' : (monthlyPackage === '8_sessions' ? '$349.00' : '$199.00')}
                      </span>
                    </div>

                    {bookingModal === 'monthly' && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                          {selectedLang === 'EN' ? 'Coaching Intensity' : 'Intensidad del Coaching'}
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setMonthlyPackage('4_sessions')}
                            className={`p-2 rounded-lg border text-[10.5px] font-bold text-center cursor-pointer transition-all ${
                              monthlyPackage === '4_sessions'
                                ? 'bg-amber-100 border-amber-500 text-amber-900'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                            }`}
                          >
                            <div>4 {selectedLang === 'EN' ? 'Sessions' : 'Sesiones'}/mes</div>
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">$199 USD</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMonthlyPackage('8_sessions')}
                            className={`p-2 rounded-lg border text-[10.5px] font-bold text-center cursor-pointer transition-all ${
                              monthlyPackage === '8_sessions'
                                ? 'bg-amber-100 border-amber-500 text-amber-900'
                                : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                            }`}
                          >
                            <div>8 {selectedLang === 'EN' ? 'Sessions' : 'Sesiones'}/mes</div>
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">$349 USD</div>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                          {selectedLang === 'EN' ? 'Your Name' : 'Tu Nombre'}
                        </label>
                        <input 
                          type="text" 
                          required
                          value={bookingName}
                          onChange={(e) => setBookingName(e.target.value)}
                          placeholder="e.g. Maria Silva"
                          className="w-full p-2 bg-white border border-zinc-300 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                          {selectedLang === 'EN' ? 'Email' : 'Correo'}
                        </label>
                        <input 
                          type="email" 
                          required
                          value={bookingEmail}
                          onChange={(e) => setBookingEmail(e.target.value)}
                          placeholder="maria@example.com"
                          className="w-full p-2 bg-white border border-zinc-300 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                          {selectedLang === 'EN' ? 'Preferred Date' : 'Fecha Preferida'}
                        </label>
                        <input 
                          type="date" 
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full p-2 bg-white border border-zinc-300 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                          {selectedLang === 'EN' ? 'Time (EST)' : 'Hora (EST)'}
                        </label>
                        <select
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full p-2 bg-white border border-zinc-300 rounded-lg text-xs text-neutral-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                        >
                          <option value="9:00 AM">9:00 AM EST</option>
                          <option value="11:00 AM">11:00 AM EST</option>
                          <option value="2:00 PM">2:00 PM EST</option>
                          <option value="5:00 PM">5:00 PM EST</option>
                          <option value="7:00 PM">7:00 PM EST</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingModal(null)}
                        className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg border border-zinc-300 transition-all cursor-pointer"
                      >
                        {selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg border border-emerald-700 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1 font-mono"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {selectedLang === 'EN' ? 'BUY' : 'COMPRA'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Diagnostic option */}
                    <div className="bg-[#FAF7F2] p-4 rounded-2xl border-2 border-zinc-200 hover:border-amber-400 transition-all shadow-xs flex flex-col justify-between text-left">
                      <div className="space-y-1.5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 font-sans inline-block">
                          {selectedLang === 'EN' ? 'Trial Session' : 'Clase de Prueba'}
                        </span>
                        <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                          {selectedLang === 'EN' ? '30-Min Diagnostic' : 'Sesión Diagnóstica (30 Min)'}
                        </h4>
                        <div className="text-lg font-black font-mono text-neutral-900 leading-none">
                          $29.00 <span className="text-[10px] font-sans text-neutral-500 font-medium">/ {selectedLang === 'EN' ? 'one-time' : 'pago único'}</span>
                        </div>
                        <p className="text-[10.5px] leading-tight text-neutral-500 font-serif">
                          {selectedLang === 'EN' 
                            ? 'Evaluate accent & fluency with Alejandra + accent targets log.'
                            : 'Evalúa tu nivel, acento y fluidez en vivo con Alejandra + reporte personalizado.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setBookingModal('sample')}
                        className="w-full mt-3 py-2 bg-transparent text-amber-700 border-2 border-amber-700 hover:bg-amber-700/5 text-xs font-extrabold rounded-lg tracking-wider transition-all uppercase cursor-pointer"
                      >
                        {selectedLang === 'EN' ? 'Book Diagnostic' : 'Reservar Sesión'}
                      </button>
                    </div>

                    {/* Immersive packages option */}
                    <div className="bg-[#FAF7F2] p-4 rounded-2xl border-2 border-zinc-200 hover:border-amber-400 transition-all shadow-xs flex flex-col justify-between text-left">
                      <div className="space-y-1.5">
                        <span className="text-[8px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 font-sans inline-block">
                          {selectedLang === 'EN' ? 'Coaching Plans' : 'Planes de Coaching'}
                        </span>
                        <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                          {selectedLang === 'EN' ? 'Immersive Packages' : 'Coaching de Inmersión'}
                        </h4>
                        <div className="text-lg font-black font-mono text-neutral-900 leading-none">
                          $199 / $349 <span className="text-[10px] font-sans text-neutral-500 font-medium">/ {selectedLang === 'EN' ? 'month' : 'mes'}</span>
                        </div>
                        <p className="text-[10.5px] leading-tight text-neutral-500 font-serif">
                          {selectedLang === 'EN' 
                            ? '4 or 8 private live sessions + direct private chat support + Plan PRO included.'
                            : '4 u 8 clases mensuales 1-a-1 + coaching directo por chat diario + Plan PRO gratis.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setBookingModal('monthly')}
                        className="w-full mt-3 py-2 bg-transparent text-amber-700 border-2 border-amber-700 hover:bg-amber-700/5 text-xs font-extrabold rounded-lg tracking-wider transition-all uppercase cursor-pointer"
                      >
                        {selectedLang === 'EN' ? 'Subscribe' : 'Suscribirse'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Separate Chat messages sibling list */}
        {chatMessages.filter(msg => {
          if (msg.sender === 'system') return false;
          if (msg.sender === 'user' && msg.text.startsWith('[')) return false;
          return true;
        }).map((msg, index) => {
          const isUser = msg.sender === 'user';
          let displayTxt = msg.text || '';
          
          // Clean system tags from user profile / teachers questions
          if (displayTxt.includes('INSTRUCCIÓN DE SISTEMA:')) {
            const match = displayTxt.match(/Pregunta del usuario:\s*"(.*)"/i) || displayTxt.match(/Pregunta:\s*"(.*)"/i) || displayTxt.match(/Question:\s*"(.*)"/i);
            if (match && match[1]) {
              displayTxt = match[1];
            } else {
              displayTxt = displayTxt
                .replace(/\[INSTRUCCIÓN DE SISTEMA:[^]*?Pregunta del usuario:\s*"/i, '')
                .replace(/\[INSTRUCCIÓN DE SISTEMA:[^]*?Pregunta:\s*"/i, '')
                .replace(/"\]$/, '');
            }
          }

          return (
            <div 
              key={msg.id || index}
              className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div className={`max-w-[88%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`
                  px-4 py-2.5 rounded-2xl text-sm leading-snug transition-all bg-white border-[5px]
                  ${isUser 
                    ? 'border-blue-600/30 text-black rounded-tr-none' 
                    : 'border-red-600/30 text-black rounded-tl-none font-serif'
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
                            {selectedLang === 'EN' ? 'PAUSE' : 'PAUSA'}
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
                    <div className="flex items-center gap-2 mb-2 select-none">
                      <Bot strokeWidth={2.5} className="w-5 h-5 text-red-600" />
                    </div>
                  )}
                  <div className={`chat-message-text whitespace-pre-line tracking-wider leading-snug ${isUser ? 'text-right font-normal' : 'text-left'}`}>
                    {(() => {
                      if (!isUser && displayTxt.includes(" / ")) {
                        const parts = displayTxt.split(" / ");
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
                      return <div style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-black leading-snug">{parseAndRenderEmojis(displayTxt)}</div>;
                    })()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Row 2: User's Input Box (Styled exactly like the Chat section input box with User icon) */}
      <div className="flex-shrink-0 px-4 pb-4 select-none flex justify-end w-full">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const inputEl = e.currentTarget.elements.namedItem('teacherQuestion') as HTMLInputElement;
            if (inputEl && inputEl.value.trim()) {
              onAskVoyager(inputEl.value.trim());
              inputEl.value = '';
            }
          }}
          className="w-full relative rounded-2xl rounded-tr-none transition-all bg-white border-[5px] border-blue-600/30 shadow-sm px-4 py-2 flex flex-col"
        >
          <div className="flex justify-end items-center gap-1.5 mb-1 text-blue-600/70 select-none">
            <User strokeWidth={2.5} className="w-5 h-5 text-blue-600/70" />
          </div>
          <input
            type="text"
            name="teacherQuestion"
            required
            placeholder={selectedLang === 'EN' ? "Ask Voyager about Alejandra (La Profe)..." : "Pregúntale a Voyager sobre Alejandra (La Profe)..."}
            style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }}
            className="w-full focus:outline-none transition-all border-none bg-transparent text-black text-right placeholder:text-right placeholder:text-black/45 font-serif text-[12.5px] p-0"
          />
        </form>
      </div>

      {/* STRIPE PAYMENT GATEWAY MODAL */}
      <StripePaymentModal 
        isOpen={stripeModalOpen}
        onClose={() => setStripeModalOpen(false)}
        selectedLang={selectedLang}
        itemType={activeStripeItemType}
        initialName={bookingName}
        initialEmail={bookingEmail}
        initialDate={bookingDate}
        initialTime={bookingTime}
        onPaymentSuccess={handlePaymentCompleted}
      />
    </div>
  );
};
