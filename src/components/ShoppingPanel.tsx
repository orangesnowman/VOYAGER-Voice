import React, { useState } from 'react';
import { ShoppingCart, Sparkles, Check, CreditCard, ShieldCheck, Lock, Award, BookOpen, Clock, Star, Bot, MessageSquare, Pause, User } from 'lucide-react';
import { StripePaymentModal } from './StripePaymentModal';

interface ShoppingPanelProps {
  selectedLang: 'EN' | 'ES';
  userPlan: 'FREE' | 'PRO';
  onUpgradeSuccess: () => void;
  onAskVoyager: (text: string) => void;
}

export const ShoppingPanel: React.FC<ShoppingPanelProps> = ({
  selectedLang,
  userPlan,
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
      color: 'border-amber-500/30 text-amber-600',
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
      color: 'border-blue-500/30 text-blue-600',
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
      color: 'border-emerald-500/30 text-emerald-600',
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
      color: 'border-purple-500/30 text-purple-600',
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
    const ProductIcon = p.icon;
    const isCurrentlyPro = p.isPro && userPlan === 'PRO';

    return (
      <div className={`p-4 border border-black/10 rounded-2xl flex flex-col justify-between transition-all ${p.bgColor}`}>
        <div className="text-left">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className={`p-1.5 rounded-lg border bg-white ${p.color}`}>
              <ProductIcon className="w-5 h-5" />
            </div>
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

        <div>
          <button
            onClick={() => handlePurchaseClick(p.id)}
            disabled={isCurrentlyPro}
            className={`w-full py-2.5 border-none rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
              isCurrentlyPro 
                ? 'bg-neutral-100 text-neutral-400 cursor-default'
                : p.isPro
                  ? 'bg-amber-500 hover:bg-amber-600 text-white font-mono'
                  : 'bg-red-600 hover:bg-red-700 text-white font-mono'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            {isCurrentlyPro 
              ? (selectedLang === 'EN' ? 'Active Plan' : 'Plan Activo')
              : (selectedLang === 'EN' ? p.buttonEn : p.buttonEs)}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col p-4 bg-neutral-300 overflow-y-auto max-h-[480px] md:max-h-[550px] animate-fade-in font-sans text-[#231d17]">
      
      {/* THE MAIN SHOP CONTAINER CARD WITH PINK BORDER */}
      <div className="bg-white border-[5px] border-red-600/30 rounded-[28px] p-5 shadow-sm space-y-4 text-left flex flex-col flex-shrink-0 animate-fade-in">
        
        {/* Sub-tab Navigation Header Bar */}
        <div className="flex items-center gap-3 pb-3.5 border-b border-neutral-100 select-none text-[9.5px] md:text-[10.5px]">
          {/* Red robot icon */}
          <Bot className="w-5 h-5 text-red-600 flex-shrink-0" />
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {/* Tab 1: BIENVENIDOS */}
            <button 
              onClick={() => setActiveSubTab('welcome')}
              className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              {activeSubTab === 'welcome' && (
                <MessageSquare className="w-3.5 h-3.5 text-red-600 fill-red-600/10 scale-x-[-1] mt-0.5" />
              )}
              <span className={activeSubTab === 'welcome' ? 'text-black font-extrabold tracking-wider uppercase' : 'text-neutral-400 font-bold tracking-wider hover:text-red-600 transition-colors uppercase'}>
                {selectedLang === 'EN' ? 'Welcome' : 'Bienvenidos'}
              </span>
            </button>

            {/* Tab 2: PRO */}
            <button 
              onClick={() => setActiveSubTab('pro')}
              className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              {activeSubTab === 'pro' && (
                <MessageSquare className="w-3.5 h-3.5 text-red-600 fill-red-600/10 scale-x-[-1] mt-0.5" />
              )}
              <span className={activeSubTab === 'pro' ? 'text-black font-extrabold tracking-wider uppercase' : 'text-neutral-400 font-bold tracking-wider hover:text-red-600 transition-colors uppercase'}>
                PRO
              </span>
            </button>

            {/* Tab 3: DIAGNOSTICO */}
            <button 
              onClick={() => setActiveSubTab('sample')}
              className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              {activeSubTab === 'sample' && (
                <MessageSquare className="w-3.5 h-3.5 text-red-600 fill-red-600/10 scale-x-[-1] mt-0.5" />
              )}
              <span className={activeSubTab === 'sample' ? 'text-black font-extrabold tracking-wider uppercase' : 'text-neutral-400 font-bold tracking-wider hover:text-red-600 transition-colors uppercase'}>
                {selectedLang === 'EN' ? 'Diagnostic' : 'Diagnóstico'}
              </span>
            </button>

            {/* Tab 4: INMERSION */}
            <button 
              onClick={() => setActiveSubTab('monthly_4')}
              className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              {activeSubTab === 'monthly_4' && (
                <MessageSquare className="w-3.5 h-3.5 text-red-600 fill-red-600/10 scale-x-[-1] mt-0.5" />
              )}
              <span className={activeSubTab === 'monthly_4' ? 'text-black font-extrabold tracking-wider uppercase' : 'text-neutral-400 font-bold tracking-wider hover:text-red-600 transition-colors uppercase'}>
                {selectedLang === 'EN' ? 'Immersion' : 'Inmersión'}
              </span>
            </button>

            {/* Tab 5: INTENSIVO */}
            <button 
              onClick={() => setActiveSubTab('monthly_8')}
              className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none"
            >
              {activeSubTab === 'monthly_8' && (
                <MessageSquare className="w-3.5 h-3.5 text-red-600 fill-red-600/10 scale-x-[-1] mt-0.5" />
              )}
              <span className={activeSubTab === 'monthly_8' ? 'text-black font-extrabold tracking-wider uppercase' : 'text-neutral-400 font-bold tracking-wider hover:text-red-600 transition-colors uppercase'}>
                {selectedLang === 'EN' ? 'Intensive' : 'Intensivo'}
              </span>
            </button>
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

              {/* Secure Checkout Alert bar */}
              <div className="bg-neutral-100 border border-neutral-200 p-3 rounded-2xl flex items-center justify-center gap-2 select-none">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-[9px] font-bold text-neutral-600 font-mono uppercase tracking-wider">
                  {selectedLang === 'EN' ? 'Secure 256-Bit Stripe Checkout' : 'Pago Seguro de Stripe de 256 Bits'}
                </span>
              </div>
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

      {/* Row 2: User's Input Box (Styled exactly like the Chat section input box with PAUSA and User icon) */}
      <div className="flex justify-end w-full mt-3 select-none flex-shrink-0">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const inputEl = e.currentTarget.elements.namedItem('shopQuestion') as HTMLInputElement;
            if (inputEl && inputEl.value.trim()) {
              onAskVoyager(inputEl.value.trim());
              inputEl.value = '';
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
