import React, { useState } from 'react';
import { ShoppingCart, Sparkles, Check, CreditCard, ShieldCheck, Lock, Award, BookOpen, Clock, Star } from 'lucide-react';
import { StripePaymentModal } from './StripePaymentModal';
import voyagerRobot from '../assets/images/voyager_robot_1783082204380.png';

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
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [activeStripeItemType, setActiveStripeItemType] = useState<'sample' | 'monthly_4' | 'monthly_8' | 'pro_upgrade'>('pro_upgrade');
  
  // Custom states for booking details
  const [bookingDate, setBookingDate] = useState('2026-07-30');
  const [bookingTime, setBookingTime] = useState('10:00 AM');

  const products = [
    {
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
    {
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
    {
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
    {
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
        'Priority diagnostic evaluations',
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
  ];

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

  return (
    <div className="flex-1 flex flex-col p-4 bg-neutral-300 overflow-y-auto max-h-[480px] md:max-h-[550px] animate-fade-in font-sans text-[#231d17]">
      
      {/* VOYAGER SHOP INTRODUCTION CHAT BUBBLE */}
      <div className="flex items-start gap-3 mb-5 flex-shrink-0 animate-fade-in text-left">
        {/* Avatar image container */}
        <div className="w-[50px] h-[50px] rounded-full bg-slate-900 border-2 border-red-600/30 flex-shrink-0 overflow-hidden flex items-center justify-center shadow-md">
          <img 
            src={voyagerRobot} 
            alt="Voyager Mascot" 
            className="w-full h-full object-contain" 
          />
        </div>
        
        {/* Voyager's chat bubble */}
        <div className="flex-grow max-w-[calc(100%-62px)] bg-white border-[5px] border-red-600/30 rounded-2xl rounded-tl-none p-4 shadow-sm relative text-black">
          <span style={{ fontFamily: "'Lato', sans-serif" }} className="text-[9px] font-black uppercase tracking-widest text-red-600/70 block mb-1">
            VOYAGER
          </span>
          <p style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-[10.5pt] leading-relaxed">
            {selectedLang === 'EN' 
              ? "Welcome to the Voyager Shop! Here you can upgrade your plan to unlock all interactive lessons or purchase custom coaching packages with La Profe. Click on any package to proceed securely!"
              : "¡Bienvenido a la Tienda de Voyager! Aquí puedes actualizar tu plan para desbloquear todas las lecciones interactivas o comprar paquetes personalizados de coaching con La Profe. ¡Haz clic en cualquier plan para proceder de forma segura!"}
          </p>
        </div>
      </div>

      {/* SECTION TITLE: COMPRAS / SHOPPING */}
      <div className="flex items-center justify-between mb-3 text-left">
        <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-700 flex items-center gap-1.5 font-serif">
          <ShoppingCart className="w-4 h-4 text-neutral-700" />
          {selectedLang === 'EN' ? 'Purchases & Plans' : 'Compras y Planes'}
        </h4>
      </div>

      {/* PRODUCTS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
        {products.map((p) => {
          const ProductIcon = p.icon;
          const isCurrentlyPro = p.isPro && userPlan === 'PRO';

          return (
            <div 
              key={p.id}
              className={`bg-white rounded-2xl p-4 border border-black/10 shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${p.bgColor}`}
            >
              <div className="text-left">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg border bg-white ${p.color}`}>
                    <ProductIcon className="w-4 h-4" />
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-lg font-black text-neutral-900 font-mono">{p.price}</span>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono">
                      {selectedLang === 'EN' ? p.billingEn : p.billingEs}
                    </span>
                  </div>
                </div>

                <h5 style={{ fontFamily: "'Lato', sans-serif" }} className="text-xs font-black uppercase tracking-wider text-neutral-800 mb-1">
                  {selectedLang === 'EN' ? p.titleEn : p.titleEs}
                </h5>
                
                <p style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-[10px] text-neutral-500 leading-snug mb-3">
                  {selectedLang === 'EN' ? p.descEn : p.descEs}
                </p>

                {/* Features list */}
                <ul className="space-y-1 mb-4 select-none">
                  {(selectedLang === 'EN' ? p.featuresEn : p.featuresEs).map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[9.5px] text-neutral-600 font-serif leading-tight">
                      <Check className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <button
                  onClick={() => handlePurchaseClick(p.id)}
                  disabled={isCurrentlyPro}
                  className={`w-full py-2 border-none rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm ${
                    isCurrentlyPro 
                      ? 'bg-neutral-100 text-neutral-400 cursor-default'
                      : p.isPro
                        ? 'bg-amber-500 hover:bg-amber-600 text-white font-mono'
                        : 'bg-red-600 hover:bg-red-700 text-white font-mono'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {isCurrentlyPro 
                    ? (selectedLang === 'EN' ? 'Active Plan' : 'Plan Activo')
                    : (selectedLang === 'EN' ? p.buttonEn : p.buttonEs)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SECURE CHECKOUT SHIELD */}
      <div className="mt-2 bg-neutral-200/50 rounded-xl p-3 border border-neutral-300/40 flex items-center justify-center gap-2 select-none">
        <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span className="text-[9px] font-bold text-neutral-600 font-mono uppercase tracking-wider">
          {selectedLang === 'EN' ? 'Secure 256-Bit Stripe Checkout' : 'Pago Seguro de Stripe de 256 Bits'}
        </span>
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
