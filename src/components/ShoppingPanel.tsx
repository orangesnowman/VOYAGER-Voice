import React, { useState } from 'react';
import { ShoppingCart, Sparkles, Check, Lock, Award, BookOpen, Clock, Star, Bot, MessageSquare, Pause, User, Play } from 'lucide-react';
import { StripePaymentModal } from './StripePaymentModal';

interface ShoppingPanelProps {
  selectedLang: 'EN' | 'ES';
  userPlan: 'FREE' | 'PRO';
  chatMessages: any[];
  isPaused: boolean;
  isConnected: boolean;
  pause: () => void;
  resume: () => void;
  onUpgradeSuccess: () => void;
  onAskVoyager: (text: string) => void;
}

export const ShoppingPanel: React.FC<ShoppingPanelProps> = ({
  selectedLang,
  userPlan,
  chatMessages,
  isPaused,
  isConnected,
  pause,
  resume,
  onUpgradeSuccess,
  onAskVoyager
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'welcome' | 'pro' | 'sample' | 'monthly_4' | 'monthly_8'>('welcome');
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [activeStripeItemType, setActiveStripeItemType] = useState<'sample' | 'monthly_4' | 'monthly_8' | 'pro_upgrade'>('pro_upgrade');
  
  // Custom states for booking details
  const [bookingDate, setBookingDate] = useState('2026-07-30');
  const [bookingTime, setBookingTime] = useState('10:00 AM');

  const products = {
    pro: {
      id: 'pro_upgrade',
      titleEn: 'USA Voyager PRO Plan',
      titleEs: 'Plan USA Voyager PRO',
      price: '$9.99',
      billingEn: '/month',
      billingEs: '/mes',
      descEn: 'Unlock all 4 intensive roadmap lessons and advanced dialogue scenarios. Perfect for high-frequency daily practice.',
      descEs: 'Desbloquea las 4 lecciones intensivas de la ruta y escenarios avanzados de conversación. Perfecto para práctica diaria de alta frecuencia.',
      featuresEn: [
        'Unlock all Day 2+ interactive lessons',
        'Advanced speech coaching feedback',
        'Priority conversation loading speed',
        'Direct vocabulary tracking analytics'
      ],
      featuresEs: [
        'Desbloquea todas las lecciones del Día 2 en adelante',
        'Feedback avanzado de pronunciación y acento',
        'Mayor velocidad de respuesta de la IA',
        'Seguimiento prioritario de vocabulario'
      ],
      icon: Sparkles,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50/10',
      buttonEn: 'Upgrade to PRO',
      buttonEs: 'Cambiar a PRO',
      isPro: true
    },
    sample: {
      id: 'sample',
      titleEn: '30-Min Diagnostic Session',
      titleEs: 'Sesión Diagnóstica (30 Min)',
      price: '$29.00',
      billingEn: 'one-time',
      billingEs: 'pago único',
      descEn: 'Private 1-on-1 diagnostic live session with Alejandra Francois (La Profe) to evaluate your accent & fluency.',
      descEs: 'Sesión privada 1-a-1 en vivo con Alejandra Francois (La Profe) para evaluar tu nivel, acento y fluidez en inglés.',
      featuresEn: [
        '30-minute private video call',
        'Personalized accent analysis log',
        'Custom vocabulary target plan',
        'Direct chat support for 7 days'
      ],
      featuresEs: [
        'Videollamada privada de 30 minutos',
        'Reporte de análisis de acento personalizado',
        'Plan personalizado de objetivos de vocabulario',
        'Soporte por chat directo por 7 días'
      ],
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50/10',
      buttonEn: 'Book Diagnostic',
      buttonEs: 'Reservar Sesión',
      isPro: false
    },
    monthly_4: {
      id: 'monthly_4',
      titleEn: 'Monthly Immersion Coaching',
      titleEs: 'Coaching de Inmersión',
      price: '$199.00',
      billingEn: '/month',
      billingEs: '/mes',
      descEn: 'Weekly 1-on-1 private video calls with La Profe + comprehensive asynchronous chat coaching support.',
      descEs: 'Clases semanales 1-a-1 en vivo con La Profe + acompañamiento diario de audios por chat privado.',
      featuresEn: [
        '4 private 1-on-1 sessions per month',
        'Daily accent & pronunciation reviews',
        'Personalized feedback transcript history',
        'Free USA Voyager PRO Plan included'
      ],
      featuresEs: [
        '4 sesiones privadas 1-a-1 al mes',
        'Revisiones diarias de audio y pronunciación',
        'Historial de feedback personalizado',
        'Plan USA Voyager PRO incluido gratis'
      ],
      icon: BookOpen,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50/10',
      buttonEn: 'Subscribe (4/mo)',
      buttonEs: 'Suscribirse (4/mes)',
      isPro: false
    },
    monthly_8: {
      id: 'monthly_8',
      titleEn: 'Intensive Immersion Coaching',
      titleEs: 'Coaching Intensivo',
      price: '$349.00',
      billingEn: '/month',
      billingEs: '/mes',
      descEn: 'Twice-weekly 1-on-1 live video sessions with La Profe + priority daily voice messaging coaching support.',
      descEs: 'Dos clases semanales 1-a-1 en vivo con La Profe + coaching prioritario y revisión diaria de mensajes de voz.',
      featuresEn: [
        '8 private 1-on-1 sessions per month',
        'Priority daily diagnostics',
        '24/7 direct access communication line',
        'Free USA Voyager PRO Plan included'
      ],
      featuresEs: [
        '8 sesiones privadas 1-a-1 al mes',
        'Evaluaciones diagnósticas prioritarias',
        'Canal directo de comunicación 24/7',
        'Plan USA Voyager PRO incluido gratis'
      ],
      icon: Star,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50/10',
      buttonEn: 'Subscribe (8/mo)',
      buttonEs: 'Suscribirse (8/mes)',
      isPro: false
    }
  };

  const handlePurchaseClick = (itemId: string) => {
    setActiveStripeItemType(itemId as any);
    setStripeModalOpen(true);
  };

  const handlePaymentCompleted = (receipt: any) => {
    setStripeModalOpen(false);
    if (activeStripeItemType === 'pro_upgrade' || activeStripeItemType === 'monthly_4' || activeStripeItemType === 'monthly_8') {
      onUpgradeSuccess();
    }
  };

  // Render product details inside the tab body
  const renderProductContent = (p: typeof products.pro) => {
    const isCurrentlyPro = p.isPro && userPlan === 'PRO';

    return (
      <div className="flex flex-col justify-between transition-all pt-2">
        <div className="text-left">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-black text-neutral-900 font-mono">{p.price}</span>
              <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono">
                {selectedLang === 'EN' ? p.billingEn : p.billingEs}
              </span>
            </div>
          </div>

          <h5 style={{ fontFamily: "'Lato', sans-serif" }} className="text-sm font-black uppercase tracking-wider text-neutral-800 mb-1.5">
            {selectedLang === 'EN' ? p.titleEn : p.titleEs}
          </h5>
          
          <p style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-[11px] text-neutral-500 leading-relaxed mb-4">
            {selectedLang === 'EN' ? p.descEn : p.descEs}
          </p>

          {/* Features list */}
          <ul className="space-y-1.5 mb-5 select-none">
            {(selectedLang === 'EN' ? p.featuresEn : p.featuresEs).map((f, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[10.5px] text-neutral-600 font-serif leading-tight">
                <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-start">
          <button
            onClick={() => handlePurchaseClick(p.id)}
            disabled={isCurrentlyPro}
            className={`w-[50%] py-2.5 border-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs ${
              isCurrentlyPro 
                ? 'bg-neutral-100 border-neutral-300 text-neutral-400 cursor-default'
                : 'border-red-600 text-red-600 bg-transparent hover:bg-red-50/20 hover:border-red-700 hover:text-red-700 font-mono'
            }`}
          >
            {isCurrentlyPro 
              ? (selectedLang === 'EN' ? 'Active Plan' : 'Plan Activo')
              : (selectedLang === 'EN' ? 'BUY' : 'COMPRA')}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-300 max-h-[480px] md:max-h-[550px] overflow-hidden animate-fade-in font-sans text-[#231d17]">
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 min-h-0">
        
        {/* THE MAIN SHOP CONTAINER CARD WITH PINK BORDER */}
        <div className="bg-white border-[5px] border-red-600/30 rounded-[28px] p-5 shadow-sm space-y-4 text-left flex flex-col flex-shrink-0">
        
        {/* Sub-tab Navigation Header Bar */}
        <div className="flex items-center gap-3 pb-3.5 select-none text-[9.5px] md:text-[10.5px]">
          {/* Red robot icon */}
          <Bot className="w-5 h-5 text-red-600 flex-shrink-0" />
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {[...(['welcome', 'pro', 'sample', 'monthly_4', 'monthly_8'] as const)]
              .sort((a, b) => {
                if (a === activeSubTab) return -1;
                if (b === activeSubTab) return 1;
                return 0;
              })
              .map((tab) => {
                const label = 
                  tab === 'welcome' ? (selectedLang === 'EN' ? 'Welcome' : 'Bienvenidos') :
                  tab === 'pro' ? 'PRO' :
                  tab === 'sample' ? (selectedLang === 'EN' ? 'Diagnostic' : 'Diagnóstico') :
                  tab === 'monthly_4' ? (selectedLang === 'EN' ? 'Immersion' : 'Inmersión') :
                  (selectedLang === 'EN' ? 'Intensive' : 'Intensivo');

                return (
                  <button 
                    key={tab}
                    onClick={() => setActiveSubTab(tab)}
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
            <div className="animate-fade-in flex flex-col space-y-4">
              {/* Voyager welcome text */}
              <p style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-[10.5pt] leading-relaxed text-black">
                {selectedLang === 'EN' 
                  ? 'Welcome to the Voyager Shop! Here you can check our immersion packages, buy sessions, or upgrade your account to PRO. Click on the tabs above to explore each choice!'
                  : '¡Bienvenido a la Tienda de Voyager! Aquí puedes ver nuestros paquetes de inmersión, comprar clases o cambiar tu cuenta a PRO. ¡Haz clic en las pestañas superiores para ver el detalle de cada opción!'}
              </p>
            </div>
          )}

          {activeSubTab === 'pro' && (
            <div className="animate-fade-in">
              {renderProductContent(products.pro)}
            </div>
          )}

          {activeSubTab === 'sample' && (
            <div className="animate-fade-in">
              {renderProductContent(products.sample)}
            </div>
          )}

          {activeSubTab === 'monthly_4' && (
            <div className="animate-fade-in">
              {renderProductContent(products.monthly_4)}
            </div>
          )}

          {activeSubTab === 'monthly_8' && (
            <div className="animate-fade-in">
              {renderProductContent(products.monthly_8)}
            </div>
          )}
        </div>

      </div>

      {/* Separate Chat messages sibling list */}
      {chatMessages.filter(msg => msg.sender === 'user' || msg.sender === 'model').map((msg, index) => {
        let displayTxt = msg.text || '';
        if (displayTxt.includes('SYSTEM INSTRUCTION:')) {
          const match = displayTxt.match(/Question:\s*"(.*)"/i);
          if (match && match[1]) {
            displayTxt = match[1];
          } else {
            displayTxt = displayTxt.replace(/\[SYSTEM INSTRUCTION:.*Question:\s*"/i, '').replace(/"\]$/, '');
          }
        }
        
        const isUser = msg.sender === 'user';
        
        return (
          <div 
            key={msg.id || index} 
            className={`flex items-start ${isUser ? 'justify-end' : 'justify-start'} gap-2.5 animate-fade-in flex-shrink-0 w-full`}
          >
            <div className={`max-w-[88%] flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
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
                        <Play strokeWidth={2.5} className="w-3.5 h-3.5 text-red-600 transition-all animate-pulse" />
                      ) : (
                        <Pause strokeWidth={2.5} className="w-3.5 h-3.5 text-blue-600/70 group-hover:text-red-600 transition-all duration-300" />
                      )}
                    </button>
                    <User strokeWidth={2.5} className="w-5 h-5 text-blue-600/70" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2 select-none">
                    <Bot strokeWidth={2.5} className="w-5 h-5 text-red-600" />
                  </div>
                )}
                <div 
                  style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} 
                  className={`text-black leading-snug tracking-wider whitespace-pre-line ${isUser ? 'text-right' : 'text-left'}`}
                >
                  {displayTxt}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </div>

      {/* Row 2: User's Input Box (Styled exactly like the Chat section input box with PAUSA and User icon) */}
      <div className="flex-shrink-0 px-4 pb-4 select-none flex justify-end w-full">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const inputEl = e.currentTarget.elements.namedItem('shopQuestion') as HTMLInputElement;
            if (inputEl && inputEl.value.trim()) {
              onAskVoyager(inputEl.value.trim());
              inputEl.value = '';
              setActiveSubTab('welcome');
            }
          }}
          className="w-full relative rounded-2xl rounded-tr-none transition-all bg-white border-[5px] border-blue-600/30 shadow-sm px-4 py-2 flex flex-col"
        >
          <div className="flex justify-end items-center gap-1.5 mb-1.5 text-[8.5pt] font-black text-blue-600 leading-none">
            <span>{selectedLang === 'EN' ? 'PAUSE' : 'PAUSA'}</span>
            <Pause className="w-3.5 h-3.5 fill-blue-600 stroke-none" />
            <User strokeWidth={2.5} className="w-4.5 h-4.5 ml-0.5 text-blue-600/70" />
          </div>
          <input
            type="text"
            name="shopQuestion"
            required
            placeholder={selectedLang === 'EN' ? "Ask Voyager about the shop..." : "Pregúntale a Voyager sobre la tienda..."}
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
        initialName=""
        initialEmail=""
        initialDate={bookingDate}
        initialTime={bookingTime}
        onPaymentSuccess={handlePaymentCompleted}
      />

    </div>
  );
};
