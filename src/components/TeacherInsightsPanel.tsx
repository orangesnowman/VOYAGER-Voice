import React, { useState } from 'react';
import { 
  Star, 
  CheckCircle,
  Calendar,
  Award,
  Sparkles,
  Send,
  UserCheck,
  Globe,
  Clock,
  ShieldCheck,
  Check,
  MessageSquareText,
  Video,
  CreditCard,
  Lock
} from 'lucide-react';
import { StripePaymentModal } from './StripePaymentModal';

interface TeacherInsightsPanelProps {
  selectedLang: 'EN' | 'ES';
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
  selectedLang
}) => {
  // Booking state
  const [bookingModal, setBookingModal] = useState<'sample' | 'monthly' | null>(null);
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00 AM');
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [monthlyPackage, setMonthlyPackage] = useState<'4_sessions' | '8_sessions'>('4_sessions');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const activeStripeItemType = bookingModal === 'sample' 
    ? 'sample' 
    : (monthlyPackage === '8_sessions' ? 'monthly_8' : 'monthly_4');

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

  return (
    <div className="w-full font-sans text-[#0F172A] animate-fade-in space-y-5">
      
      {/* MAIN PROFILE & HIRING BANNER FOR ALEJANDRA FRANCOIS - LA PROFE */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm text-left space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 border-b border-zinc-100 pb-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-600 via-amber-700 to-[#231d17] p-0.5 shadow-md flex items-center justify-center text-white font-serif font-black text-3xl">
                AF
              </div>
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1.5 border-2 border-white shadow-xs" title="Verified Master Instructor">
                <Award className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-sans text-black tracking-tight">Alejandra Francois</h3>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-amber-300">
                  La Profe
                </span>
              </div>
              <p className="text-xs font-semibold text-black font-serif mt-0.5">
                {selectedLang === 'EN' 
                  ? 'Master English Immersion Coach & NYC Accent Specialist' 
                  : 'Coach Maestra de Inmersión en Inglés y Especialista en Acento NYC'}
              </p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-black font-medium">
                <span className="flex items-center gap-1 text-amber-700 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 5.0 (140+ {selectedLang === 'EN' ? 'Graduates' : 'Estudiantes Graduados'})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-black font-semibold">
                  <Globe className="w-3.5 h-3.5 text-blue-600" /> {selectedLang === 'EN' ? 'Bilingual NYC Native' : 'Bilingüe Nativa de NYC'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-black block mb-1 font-sans">
              {selectedLang === 'EN' ? '1-on-1 Private Availability' : 'Disponibilidad Clases 1-a-1'}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {selectedLang === 'EN' ? 'Open for Enrollment' : 'Cupos Abiertos'}
            </span>
          </div>
        </div>

        {/* ABOUT LA PROFE & METHODOLOGY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#FAF7F2] p-4 rounded-xl border border-amber-200/70 text-xs text-black">
          <div className="flex items-start gap-2.5">
            <Video className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-black block font-sans">
                {selectedLang === 'EN' ? 'Live Interactive 1-on-1' : 'Clases 1-a-1 En Vivo'}
              </span>
              <p className="text-[11px] text-black mt-0.5 font-serif">
                {selectedLang === 'EN' 
                  ? 'Real-time video or audio sessions focusing on practical American speech, tone, and confidence.'
                  : 'Sesiones de video o audio en tiempo real enfocadas en el habla estadounidense, tono y confianza.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-black block font-sans">
                {selectedLang === 'EN' ? 'Personalized Accent Correction' : 'Corrección Fonética Personalizada'}
              </span>
              <p className="text-[11px] text-black mt-0.5 font-serif">
                {selectedLang === 'EN' 
                  ? 'Target Spanish-to-English phonetic shifts (/v/ vs /b/, vowel reduction) for immediate naturalness.'
                  : 'Tratamiento de vicios fonéticos común (v vs b, reducciones vocálicas) para sonar nativo rápidamente.'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MessageSquareText className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-black block font-sans">
                {selectedLang === 'EN' ? 'Direct Whatsapp Support' : 'Soporte Directo por Chat'}
              </span>
              <p className="text-[11px] text-black mt-0.5 font-serif">
                {selectedLang === 'EN' 
                  ? 'Receive async audio reviews and homework guidance between sessions.'
                  : 'Recibe retroalimentación en audio de tus tareas e inmersión entre cada sesión.'}
              </p>
            </div>
          </div>
        </div>

        {/* HIRE OPTIONS CARDS */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3 font-sans flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-amber-700" />
            {selectedLang === 'EN' ? 'Choose a Hire Option with Alejandra Francois' : 'Selecciona una Opción de Contratación con Alejandra Francois'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SAMPLE CLASS CARD */}
            <div className="bg-[#FAF7F2] p-5 rounded-2xl border-2 border-zinc-200 hover:border-amber-400 transition-all shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md border border-amber-300 font-sans">
                    {selectedLang === 'EN' ? 'Introductory Trial' : 'Clase de Prueba'}
                  </span>
                  <span className="text-lg font-extrabold text-black font-sans">$29 USD</span>
                </div>
                <h5 className="text-base font-bold text-black font-sans">
                  {selectedLang === 'EN' ? '30-Min Diagnostic Sample Class' : 'Clase de Prueba Diagnóstica (30 Min)'}
                </h5>
                <p className="text-xs text-black mt-2 leading-relaxed font-serif">
                  {selectedLang === 'EN'
                    ? '1-on-1 private diagnostic session with Alejandra Francois. Ideal to test the live immersion method, identify your key pronunciation blocks, and build your custom roadmap.'
                    : 'Sesión privada 1-a-1 con Alejandra Francois. Ideal para probar la metodología de inmersión, identificar tus principales trabas de pronunciación y armar tu plan.'}
                </p>

                <ul className="mt-3.5 space-y-1.5 text-[11px] text-slate-700">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    {selectedLang === 'EN' ? 'Live diagnostic evaluation' : 'Evaluación diagnóstica en vivo'}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    {selectedLang === 'EN' ? 'Custom accent action plan' : 'Plan de acción fonético personalizado'}
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setBookingModal('sample')}
                className="mt-5 w-full py-2.5 px-4 bg-[#231d17] hover:bg-black text-amber-400 font-mono text-xs font-bold rounded-xl border border-amber-500/40 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <CreditCard className="w-4 h-4" />
                {selectedLang === 'EN' ? 'BUY' : 'COMPRA'}
              </button>
            </div>

            {/* MONTHLY MULTIPLE SESSIONS CARD */}
            <div className="bg-gradient-to-br from-amber-50 via-white to-amber-100/50 p-5 rounded-2xl border-2 border-amber-400 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-bl-lg shadow-xs">
                {selectedLang === 'EN' ? 'Best Value' : 'Mejor Opción'}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-black bg-white px-2.5 py-0.5 rounded-md border border-amber-300 font-sans">
                    {selectedLang === 'EN' ? 'Monthly Coaching' : 'Plan Mensual Recurrente'}
                  </span>
                  <span className="text-lg font-extrabold text-black font-sans">$199<span className="text-xs font-normal text-black">/mo</span></span>
                </div>
                <h5 className="text-base font-bold text-black font-sans">
                  {selectedLang === 'EN' ? 'Multiple Sessions Package (4 or 8 / month)' : 'Paquete de Varias Sesiones (4 u 8 / mes)'}
                </h5>
                <p className="text-xs text-black mt-2 leading-relaxed font-serif">
                  {selectedLang === 'EN'
                    ? 'Complete immersion coaching with La Profe. Weekly 1-on-1 live video calls, daily audio homework feedback, and priority scheduling.'
                    : 'Acompañamiento integral con La Profe. Clases semanales en vivo 1-a-1, revisión diaria de audios y prioridad de agenda.'}
                </p>

                <ul className="mt-3.5 space-y-1.5 text-[11px] text-slate-700">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    {selectedLang === 'EN' ? 'Choice of 4 or 8 1-on-1 sessions per month' : 'Opción de 4 u 8 sesiones privadas al mes'}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    {selectedLang === 'EN' ? 'Continuous async chat & audio feedback' : 'Retroalimentación continua por voz y chat'}
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setBookingModal('monthly')}
                className="mt-5 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs font-bold rounded-xl border border-amber-700 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <CreditCard className="w-4 h-4" />
                {selectedLang === 'EN' ? 'BUY' : 'COMPRA'}
              </button>
            </div>
          </div>
        </div>

        {/* GUARANTEE & STUDENT REVIEWS */}
        <div className="pt-4 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              {selectedLang === 'EN' 
                ? '100% Satisfaction Guarantee: Free reschedule if you cancel 24 hours prior.' 
                : 'Garantía 100% Satisfacción: Reagendamiento libre avisando con 24h de anticipación.'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-amber-700 font-bold">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{selectedLang === 'EN' ? 'Flexible EST & PST schedules' : 'Horarios flexibles en EST y PST'}</span>
          </div>
        </div>
      </div>

      {/* BOOKING MODAL */}
      {bookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border-2 border-amber-400 shadow-2xl text-left relative space-y-4">
            <button 
              onClick={() => setBookingModal(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-800 font-bold text-base cursor-pointer"
            >
              ✕
            </button>

            <div className="border-b border-zinc-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 font-mono">
                Alejandra Francois (La Profe)
              </span>
              <h3 className="text-base font-bold font-serif text-slate-900 mt-0.5">
                {bookingModal === 'sample' 
                  ? (selectedLang === 'EN' ? 'Schedule 30-Min Diagnostic Sample Class ($29)' : 'Agendar Clase de Prueba Diagnóstica ($29)')
                  : (selectedLang === 'EN' ? 'Enroll in Monthly Immersion Coaching' : 'Inscribirse en Coaching Mensual de Inmersión')}
              </h3>
            </div>

            {bookingSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-medium space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm font-serif">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  {selectedLang === 'EN' ? 'Payment & Booking Confirmed!' : '¡Pago y Reserva Confirmados!'}
                </div>
                <p>{bookingSuccess}</p>
                <button
                  type="button"
                  onClick={() => {
                    setBookingModal(null);
                    setBookingSuccess(null);
                  }}
                  className="mt-2 w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  {selectedLang === 'EN' ? 'Close' : 'Cerrar'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleProceedToStripe} className="space-y-3.5">
                {bookingModal === 'monthly' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      {selectedLang === 'EN' ? 'Select Monthly Package' : 'Selecciona Plan Mensual'}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMonthlyPackage('4_sessions')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                          monthlyPackage === '4_sessions'
                            ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-xs'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <div>4 {selectedLang === 'EN' ? 'Sessions' : 'Sesiones'}/mo</div>
                        <div className="text-[11px] font-extrabold font-serif text-slate-900 mt-0.5">$199 USD</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMonthlyPackage('8_sessions')}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all ${
                          monthlyPackage === '8_sessions'
                            ? 'bg-amber-100 border-amber-500 text-amber-900 shadow-xs'
                            : 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
                        }`}
                      >
                        <div>8 {selectedLang === 'EN' ? 'Sessions' : 'Sesiones'}/mo</div>
                        <div className="text-[11px] font-extrabold font-serif text-slate-900 mt-0.5">$349 USD</div>
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {selectedLang === 'EN' ? 'Your Name' : 'Tu Nombre'}
                  </label>
                  <input 
                    type="text" 
                    required
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    placeholder="e.g. Maria Silva"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    {selectedLang === 'EN' ? 'Email Address' : 'Correo Electrónico'}
                  </label>
                  <input 
                    type="email" 
                    required
                    value={bookingEmail}
                    onChange={(e) => setBookingEmail(e.target.value)}
                    placeholder="maria@example.com"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      {selectedLang === 'EN' ? 'Preferred Date' : 'Fecha Preferida'}
                    </label>
                    <input 
                      type="date" 
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      {selectedLang === 'EN' ? 'Time (EST)' : 'Hora (EST)'}
                    </label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500 cursor-pointer"
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
                    className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-300 transition-all cursor-pointer"
                  >
                    {selectedLang === 'EN' ? 'Cancel' : 'Cancelar'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl border border-emerald-700 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 font-mono"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    {selectedLang === 'EN' ? 'BUY' : 'COMPRA'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

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


