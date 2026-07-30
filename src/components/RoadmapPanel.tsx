import React, { useState, useEffect } from 'react';
import { User, LogOut, Compass, Calendar, Award, CheckCircle2, Circle, Target, ChevronRight, Mail, Key, Users, Sparkles, Activity, BookOpen, Volume2, Apple, Lock, Bot, MessageSquare, Pause, TrendingUp, Play } from 'lucide-react';
import { googleSignIn, logout, auth } from '../services/firebaseAuth';
import voyagerRobot from '../assets/images/voyager_robot_1783082204380.png';
import { IMMERSION_CURRICULUM } from '../constants';
import { TeacherInsightsPanel } from './TeacherInsightsPanel';
import { parseAndRenderEmojis } from './VoyagerEmoji';

interface RoadmapPanelProps {
  selectedLang: 'EN' | 'ES';
  learnedWordsCount: number;
  grammarScore: number;
  pronunciationScore: number;
  chatMessages: any[];
  isPaused: boolean;
  isConnected: boolean;
  pause: () => void;
  resume: () => void;
  scores?: {
    grammar: number;
    pronunciation: number;
    confidence: number;
    naturalness: number;
  };
  learnedWords?: string[];
  accentPatterns?: string[];
  onAskVoyager: (text: string) => void;
  onNavigateTab?: (tab: 'home' | 'chat' | 'progress' | 'teachers' | 'settings') => void;
}

interface UserProfile {
  name: string;
  email: string;
  provider: 'Google' | 'Apple' | 'Email' | 'Guest';
  goal: string;
  levelEstimate: string;
  completedDays: number[];
  plan?: 'FREE' | 'PRO';
  country?: string;
  age?: number;
  bookedLesson?: {
    teacherName: string;
    dateTime: string;
  };
}

export const RoadmapPanel: React.FC<RoadmapPanelProps> = ({
  selectedLang,
  learnedWordsCount,
  grammarScore,
  pronunciationScore,
  chatMessages,
  isPaused,
  isConnected,
  pause,
  resume,
  scores,
  learnedWords,
  accentPatterns,
  onAskVoyager,
  onNavigateTab
}) => {
  const defaultUser: UserProfile = {
    name: selectedLang === 'EN' ? 'Learner' : 'Estudiante',
    email: 'learner@usavoyager.com',
    provider: 'Guest',
    goal: 'Business English & Networking',
    levelEstimate: 'Intermediate',
    completedDays: [1],
    plan: 'FREE'
  };
  const getTranslatedLevel = (lvl: string) => {
    if (selectedLang === 'EN') return lvl;
    if (lvl === 'Beginner') return 'Principiante';
    if (lvl === 'Intermediate') return 'Intermedio';
    if (lvl === 'Advanced') return 'Avanzado';
    if (lvl === 'Not Sure') return 'No estoy seguro';
    return lvl;
  };

  const getCountryWithFlag = (country: string) => {
    if (!country) return '';
    const clean = country.trim().toLowerCase();
    if (clean.includes('costa rica')) return `${country} 🇨🇷`;
    if (clean.includes('mexico') || clean.includes('méxico')) return `${country} 🇲🇽`;
    if (clean.includes('colombia')) return `${country} 🇨🇴`;
    if (clean.includes('spain') || clean.includes('españa')) return `${country} 🇪🇸`;
    if (clean.includes('argentina')) return `${country} 🇦🇷`;
    if (clean.includes('chile')) return `${country} 🇨🇱`;
    if (clean.includes('peru') || clean.includes('perú')) return `${country} 🇵🇪`;
    if (clean.includes('venezuela')) return `${country} 🇻🇪`;
    if (clean.includes('ecuador')) return `${country} 🇪🇨`;
    if (clean.includes('guatemala')) return `${country} 🇬🇹`;
    if (clean.includes('cuba')) return `${country} 🇨🇺`;
    if (clean.includes('bolivia')) return `${country} 🇧🇴`;
    if (clean.includes('dominicana')) return `${country} 🇩🇴`;
    if (clean.includes('honduras')) return `${country} 🇭🇳`;
    if (clean.includes('paraguay')) return `${country} 🇵🇾`;
    if (clean.includes('uruguay')) return `${country} 🇺🇾`;
    if (clean.includes('nicaragua')) return `${country} 🇳🇮`;
    if (clean.includes('panama') || clean.includes('panamá')) return `${country} 🇵🇦`;
    if (clean.includes('salvador')) return `${country} 🇸🇻`;
    if (clean.includes('puerto rico')) return `${country} 🇵🇷`;
    if (clean.includes('united states') || clean.includes('estados unidos') || clean.includes('usa')) return `${country} 🇺🇸`;
    return country;
  };

  const getProfileBadges = (u: UserProfile) => {
    const isEn = selectedLang === 'EN';
    const goalText = u.goal || '';
    
    let trackLabel = isEn ? 'STUDENT' : 'ESTUDIANTE';
    let subGoalLabel = goalText;
    
    if (goalText.startsWith('Professional:')) {
      trackLabel = isEn ? 'PROFESSIONAL' : 'PROFESIONAL';
      subGoalLabel = goalText.replace('Professional:', '').trim();
    } else if (goalText.startsWith('Academic:')) {
      trackLabel = isEn ? 'STUDENT' : 'ESTUDIANTE';
      subGoalLabel = goalText.replace('Academic:', '').trim();
    } else if (goalText.startsWith('Travel:')) {
      trackLabel = isEn ? 'TRAVELER' : 'VIAJANTE';
      subGoalLabel = goalText.replace('Travel:', '').trim();
    } else if (goalText.startsWith('Teachers:') || goalText.startsWith('Docentes')) {
      trackLabel = isEn ? 'TEACHER' : 'DOCENTE';
      subGoalLabel = goalText.replace('Teachers:', '').trim();
    }
    
    trackLabel = trackLabel.toUpperCase();
    subGoalLabel = subGoalLabel.toUpperCase();
    
    let levelLabel = u.levelEstimate || 'Intermediate';
    if (levelLabel === 'Beginner') {
      levelLabel = isEn ? 'BEGINNER (A1-A2)' : 'PRINCIPIANTE (A1-A2)';
    } else if (levelLabel === 'Intermediate') {
      levelLabel = isEn ? 'INTERMEDIATE (B1-B2)' : 'INTERMEDIO (B1-B2)';
    } else if (levelLabel === 'Advanced') {
      levelLabel = isEn ? 'ADVANCED (C1-C2)' : 'AVANZADO (C1-C2)';
    } else if (levelLabel === 'Not Sure') {
      levelLabel = isEn ? "I'M NOT SURE" : 'NO ESTOY SEGURO';
    } else {
      levelLabel = levelLabel.toUpperCase();
    }
    
    return {
      trackLabel,
      subGoalLabel: `${isEn ? 'GOAL' : 'META'}: ${subGoalLabel}`,
      levelLabel: `${isEn ? 'LEVEL' : 'NIVEL'}: ${levelLabel}`
    };
  };
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('voyager_user_account');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return defaultUser;
  });

  const chatEndRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Roadmap preferences
  const [selectedGoal, setSelectedGoal] = useState('General Confidence');
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'welcome' | 'level' | 'lessons' | 'progress'>('welcome');

  const triggerAutoExplanation = (tab: 'welcome' | 'level' | 'lessons' | 'progress') => {
    let prompt = '';
    const noTutoringRule = 'REGLA INQUEBRANTABLE: NO intentes enseñar inglés, NO invites al usuario a practicar inglés, NO inicies juegos de conversación en inglés y NO ofrezcas lecciones. Tu único trabajo aquí es explicar en español la información de esta subsección del Perfil del usuario, y preguntarle amigablemente si tiene alguna duda sobre la información mostrada.';
    if (tab === 'welcome') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección de 'BIENVENIDO' de su Perfil. Explícale brevemente en español qué información puede gestionar aquí (progreso general, metas, ruta diaria y historial de clases). ${noTutoringRule}]`;
    } else if (tab === 'level') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección de 'TU NIVEL' de su Perfil. Explícale brevemente en español lo que significan sus puntuaciones de Gramática (${grammarScore}%) y Pronunciación (${pronunciationScore}%) y su nivel estimado (${user?.levelEstimate || 'Intermedio'}). ${noTutoringRule}]`;
    } else if (tab === 'lessons') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección de 'LECCIONES' de su Perfil. Explícale en español que aquí puede ver su mapa de aprendizaje interactivo del día 1 en adelante y su estado completado. ${noTutoringRule}]`;
    } else if (tab === 'progress') {
      prompt = `[AUTO_SYSTEM: El usuario ha ingresado a la subsección de 'PROGRESO' de su Perfil. Explícale brevemente en español lo que significan sus palabras aprendidas (${learnedWordsCount}) y sus patrones de acento. ${noTutoringRule}]`;
    }
    if (prompt) {
      onAskVoyager(prompt);
    }
  };

  // Load user from storage on mount
  useEffect(() => {
    // Check Firebase auth state
    const unsubscribe = auth.onAuthStateChanged((fbUser) => {
      if (fbUser) {
        const newUser: UserProfile = {
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Learner',
          email: fbUser.email || '',
          provider: 'Google',
          goal: 'Business English & Networking',
          levelEstimate: 'Intermediate',
          completedDays: [1]
        };
        setUser(newUser);
        localStorage.setItem('voyager_user_account', JSON.stringify(newUser));
      }
    });

    return () => unsubscribe();
  }, []);

  const saveUser = (updated: UserProfile) => {
    setUser(updated);
    localStorage.setItem('voyager_user_account', JSON.stringify(updated));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {}
    saveUser(defaultUser);
  };

  const handleUpdateProfile = () => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      goal: selectedGoal,
      levelEstimate: selectedLevel
    };
    saveUser(updated);
    setIsEditingProfile(false);
  };

  const toggleDayCompleted = (dayNum: number) => {
    if (!user) return;
    let newCompleted = [...user.completedDays];
    if (newCompleted.includes(dayNum)) {
      newCompleted = newCompleted.filter(d => d !== dayNum);
    } else {
      newCompleted.push(dayNum);
    }
    saveUser({
      ...user,
      completedDays: newCompleted
    });
  };

  // Logged-in screen (Profile Dashboard + Learning Roadmap + Live Lessons)
  return (
    <div className="flex-1 flex flex-col bg-neutral-300 max-h-[480px] md:max-h-[550px] overflow-hidden animate-fade-in font-sans text-[#231d17]">
      
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 min-h-0">
        
        {/* THE MAIN PERFIL CONTAINER CARD WITH PINK BORDER */}
        <div className="bg-white border-[5px] border-red-600/30 rounded-[28px] p-5 shadow-sm space-y-4 text-left flex flex-col flex-shrink-0">
        
        {/* Sub-tab Navigation Header Bar */}
        <div className="flex items-center gap-3 pb-3.5 select-none text-[9.5px] md:text-[10.5px]">
          {/* Red robot icon */}
          <Bot className="w-5 h-5 text-red-600 flex-shrink-0" />
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {[...(['welcome', 'level', 'lessons', 'progress'] as const)]
              .sort((a, b) => {
                if (a === activeSubTab) return -1;
                if (b === activeSubTab) return 1;
                return 0;
              })
              .map((tab) => {
                const label = 
                  tab === 'welcome' ? (selectedLang === 'EN' ? 'Welcome' : 'Bienvenido') :
                  tab === 'level' ? (selectedLang === 'EN' ? 'Your Level' : 'Tu Nivel') :
                  tab === 'lessons' ? (selectedLang === 'EN' ? 'Lessons' : 'Lecciones') :
                  (selectedLang === 'EN' ? 'Progress' : 'Progreso');

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
            <div className="animate-fade-in">
              <p style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }} className="text-[10.5pt] leading-relaxed text-black">
                {selectedLang === 'EN' 
                  ? 'Welcome to your Profile! Here you can check your English learning progress, view your Google account auth details, set your fluency goals, track your daily roadmap, and inspect class logs. If you have any questions, use the chat box below to ask me!'
                  : '¡Bienvenido a tu Perfil! Aquí puedes ver tu progreso de inglés, verificar tu cuenta de Google, configurar tus metas de fluidez, seguir tu mapa diario e inspeccionar tus clases. Si tienes dudas, ¡usa la caja de chat de abajo para preguntarme!'}
              </p>
            </div>
          )}

          {activeSubTab === 'level' && (
            <div className="animate-fade-in space-y-3.5">
              {/* User details container */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center border border-black/10">
                    <User className="w-5 h-5 text-neutral-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900 font-serif leading-tight">{user.name}</h4>
                    <p className="text-[10px] text-neutral-500 font-mono leading-none">
                      {user.email} • {user.country ? getCountryWithFlag(user.country) : `${user.provider} Auth`}
                    </p>
                    {/* Capsules Row */}
                    {(() => {
                      const badges = getProfileBadges(user);
                      return (
                        <div className="flex flex-wrap items-center gap-2 mt-2 select-none">
                          <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-[#f5ece2] text-[#6e4c1e] border border-[#e8ded0] leading-none">
                            {badges.trackLabel}
                          </span>
                          <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-[#e3f6ea] text-[#187e41] border border-[#cbeed7] leading-none">
                            {badges.subGoalLabel}
                          </span>
                          <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-[#f0e9f7] text-[#6e3b9b] border border-[#e2d5ef] leading-none">
                            {badges.levelLabel}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[8px] md:text-[9px] font-black uppercase px-2 py-0.5 rounded-full border leading-none ${
                    (user.plan || 'FREE') === 'PRO' 
                      ? 'bg-amber-50 text-amber-600 border-amber-300/60' 
                      : 'bg-neutral-50 text-neutral-500 border-neutral-300/60'
                  }`}>
                    {selectedLang === 'EN' ? `PLAN: ${user.plan || 'FREE'}` : `CUENTA: ${user.plan === 'PRO' ? 'PRO' : 'GRATIS'}`}
                  </span>
                  {(user.plan || 'FREE') === 'FREE' ? (
                    <button 
                      onClick={() => {
                        const updated = { ...user, plan: 'PRO' as const };
                        saveUser(updated);
                      }}
                      className="text-[8px] font-extrabold uppercase text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 rounded-full px-2 py-0.5 cursor-pointer transition-colors"
                    >
                      {selectedLang === 'EN' ? 'Upgrade to PRO' : 'Cambiar a PRO'}
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        const updated = { ...user, plan: 'FREE' as const };
                        saveUser(updated);
                      }}
                      className="text-[8px] font-extrabold uppercase text-neutral-500 hover:text-neutral-700 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200/50 rounded-full px-2 py-0.5 cursor-pointer transition-colors"
                    >
                      {selectedLang === 'EN' ? 'Downgrade' : 'Volver a Gratis'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 border-none text-[10px] font-bold rounded-lg uppercase cursor-pointer"
                  >
                    {isEditingProfile ? (selectedLang === 'EN' ? 'Cancel' : 'Cancelar') : (selectedLang === 'EN' ? 'Edit Profile' : 'Editar Perfil')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border-none text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    <LogOut className="w-3 h-3" />
                    {selectedLang === 'EN' ? 'Exit' : 'Salir'}
                  </button>
                </div>
              </div>

              {isEditingProfile ? (
                <div className="pt-3 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      {selectedLang === 'EN' ? 'Your Fluency Goal' : 'Meta de Fluidez'}
                    </label>
                    <select
                      value={selectedGoal}
                      onChange={(e) => setSelectedGoal(e.target.value)}
                      className="w-full p-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs"
                    >
                      <option value="General Conversation">General Conversation</option>
                      <option value="Business English & Networking">Business English & Networking</option>
                      <option value="Everyday Travel & Shopping">Everyday Travel & Shopping</option>
                      <option value="US Relocation & Immigration">US Relocation & Immigration</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      {selectedLang === 'EN' ? 'Estimated English Level' : 'Nivel Estimado'}
                    </label>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="w-full p-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs"
                    >
                      <option value="Beginner">Beginner (Principiante)</option>
                      <option value="Intermediate">Intermediate (Intermedio)</option>
                      <option value="Advanced">Advanced (Avanzado)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 text-right">
                    <button
                      onClick={handleUpdateProfile}
                      className="px-4 py-1.5 bg-[#9c6b21] hover:bg-[#865918] text-white border-none rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                    >
                      {selectedLang === 'EN' ? 'Save Settings' : 'Guardar Cambios'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-neutral-100 space-y-3.5 text-left">
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
                      <span className="text-xs text-neutral-600 font-medium">
                        <strong>{selectedLang === 'EN' ? 'General Goal:' : 'Meta general:'}</strong> {user.goal || selectedGoal}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
                      <span className="text-xs text-neutral-600 font-medium">
                        <strong>{selectedLang === 'EN' ? 'Your Level:' : 'Tu nivel:'}</strong> {getTranslatedLevel(user.levelEstimate || selectedLevel)}
                      </span>
                    </div>
                  </div>

                  {/* Score capsules */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-neutral-50 p-2.5 rounded-xl border border-black/10 flex flex-col justify-between">
                      <div className="flex items-center gap-1 text-neutral-700">
                        <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">{selectedLang === 'EN' ? 'Fluency' : 'Fluidez'}</span>
                      </div>
                      <div className="text-base font-extrabold text-black my-1 font-mono">{scores?.naturalness || 75}%</div>
                      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-neutral-600 h-full rounded-full" style={{ width: `${scores?.naturalness || 75}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-xl border border-black/10 flex flex-col justify-between">
                      <div className="flex items-center gap-1 text-neutral-700">
                        <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">{selectedLang === 'EN' ? 'Grammar' : 'Gramática'}</span>
                      </div>
                      <div className="text-base font-extrabold text-black my-1 font-mono">{scores?.grammar || grammarScore || 70}%</div>
                      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-neutral-600 h-full rounded-full" style={{ width: `${scores?.grammar || grammarScore || 70}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-xl border border-black/10 flex flex-col justify-between">
                      <div className="flex items-center gap-1 text-neutral-700">
                        <Volume2 className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">{selectedLang === 'EN' ? 'Phonetics' : 'Fonética'}</span>
                      </div>
                      <div className="text-base font-extrabold text-black my-1 font-mono">{scores?.pronunciation || pronunciationScore || 75}%</div>
                      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-neutral-600 h-full rounded-full" style={{ width: `${scores?.pronunciation || pronunciationScore || 75}%` }}></div>
                      </div>
                    </div>

                    <div className="bg-neutral-50 p-2.5 rounded-xl border border-black/10 flex flex-col justify-between">
                      <div className="flex items-center gap-1 text-neutral-700">
                        <Activity className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-[9px] font-bold uppercase tracking-wider">{selectedLang === 'EN' ? 'Confidence' : 'Confianza'}</span>
                      </div>
                      <div className="text-base font-extrabold text-black my-1 font-mono">{scores?.confidence || 80}%</div>
                      <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-neutral-600 h-full rounded-full" style={{ width: `${scores?.confidence || 80}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'lessons' && (
            <div className="animate-fade-in space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-700 flex items-center gap-1.5 font-serif">
                  <Compass className="w-4 h-4 text-neutral-700" />
                  {selectedLang === 'EN' ? 'Lessons' : 'Lecciones'}
                </h4>
                <span className="text-[10px] font-mono font-bold bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full uppercase">
                  {user.completedDays.length} / {IMMERSION_CURRICULUM.length} {selectedLang === 'EN' ? 'Completed' : 'Completados'}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {IMMERSION_CURRICULUM.map((day) => {
                  const isCompleted = user.completedDays.includes(day.dayNum);
                  const isLocked = (user.plan || 'FREE') === 'FREE' && day.dayNum > 1;

                  return (
                    <div 
                      key={day.dayNum}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isLocked
                          ? 'bg-neutral-100/50 border-neutral-200 opacity-65'
                          : isCompleted 
                            ? 'bg-emerald-50/20 border-emerald-500/20' 
                            : 'bg-neutral-50/50 border-neutral-200/50 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          {isLocked ? (
                            <div className="mt-0.5 text-neutral-400 select-none">
                              <Lock className="w-4.5 h-4.5" />
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleDayCompleted(day.dayNum)}
                              className="mt-0.5 bg-transparent border-none p-0 cursor-pointer text-neutral-400 hover:text-neutral-600 flex items-center"
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-100" />
                              ) : (
                                <Circle className="w-4.5 h-4.5 text-neutral-300" />
                              )}
                            </button>
                          )}
                          <div>
                            <h5 className={`text-[11px] font-bold leading-tight ${isLocked ? 'text-neutral-500' : 'text-neutral-800'}`}>
                              Day {day.dayNum}: {selectedLang === 'EN' ? day.title : day.titleEs}
                              {isLocked && (
                                <span className="ml-1.5 text-[8px] bg-red-100 text-red-600 font-extrabold uppercase px-1 rounded select-none">
                                  PRO
                                </span>
                              )}
                            </h5>
                            <p className="text-[10px] text-neutral-500 line-clamp-2 mt-0.5 leading-snug">
                              {selectedLang === 'EN' ? day.objectives[0] : day.objectivesEs[0]}
                            </p>
                          </div>
                        </div>
                        {isLocked ? (
                          <button
                            onClick={() => alert(selectedLang === 'EN' 
                              ? 'This lesson requires a PRO account. Change your account to PRO above to unlock all lessons!'
                              : 'Esta lección requiere una cuenta PRO. ¡Cambia tu cuenta a PRO arriba para desbloquear todas las lecciones!'
                            )}
                            className="px-2 py-0.5 bg-neutral-200 text-neutral-400 rounded-md text-[8px] font-bold uppercase transition-all flex items-center cursor-pointer border-none"
                          >
                            <Lock className="w-2.5 h-2.5 mr-0.5" />
                            {selectedLang === 'EN' ? 'Locked' : 'Bloqueado'}
                          </button>
                        ) : (
                          <button
                            onClick={() => onAskVoyager(selectedLang === 'EN' 
                              ? `Let's practice the Day ${day.dayNum} topic: ${day.title}. What is the first mission?`
                              : `¡Practiquemos el tema del Día ${day.dayNum}: ${day.titleEs}! ¿Cuál es la primera misión?`
                            )}
                            className="px-2 py-0.5 bg-neutral-100 hover:bg-[#ebd5a3] hover:text-[#9c6b21] rounded-md text-[8px] font-bold uppercase transition-all flex items-center cursor-pointer border-none"
                          >
                            {selectedLang === 'EN' ? 'Start' : 'Iniciar'}
                            <ChevronRight className="w-2 h-2 ml-0.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSubTab === 'progress' && (
            <div className="animate-fade-in space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-700 flex items-center gap-1.5 font-serif">
                  <TrendingUp className="w-4 h-4 text-neutral-700" />
                  {selectedLang === 'EN' ? 'Progress' : 'Progreso'}
                </h4>
                <span className="text-[10px] font-mono font-bold bg-neutral-200 text-neutral-700 px-2.5 py-0.5 rounded-full uppercase">
                  {scores?.naturalness || 75}% {selectedLang === 'EN' ? 'Fluency' : 'Fluidez'}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                {/* Recent Session Summary */}
                <div 
                  onClick={() => onNavigateTab?.('progress')}
                  className="bg-neutral-50 hover:bg-neutral-100/70 p-3 rounded-xl border border-black/10 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-xl bg-white border border-black/10 flex items-center justify-center text-neutral-600 group-hover:scale-105 transition-transform">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-neutral-800 group-hover:text-neutral-700 transition-colors">
                        {selectedLang === 'EN' ? 'Recent Lesson Summary & Fluency' : 'Resumen de Sesión Reciente y Fluidez'}
                      </h5>
                      <p className="text-[10px] text-neutral-500 mt-0.5 leading-tight">
                        {selectedLang === 'EN' 
                          ? 'Detailed breakdown of speech pace, naturalness & spoken vocabulary' 
                          : 'Análisis detallado de ritmo de habla, naturalidad y vocabulario practicado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-700 group-hover:translate-x-0.5 transition-transform font-mono">
                    <span>{scores?.naturalness || 75}%</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Recommended Practice Lesson */}
                <div 
                  onClick={() => onAskVoyager(selectedLang === 'EN' 
                    ? 'Let us do a practice session focusing on ordering food and daily conversation in English.' 
                    : 'Hagamos una sesión de práctica enfocada en pedir comida y conversación cotidiana en inglés.'
                  )}
                  className="bg-neutral-50 hover:bg-neutral-100/70 p-3 rounded-xl border border-black/10 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-xl bg-white border border-black/10 flex items-center justify-center text-neutral-600 group-hover:scale-105 transition-transform">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-neutral-800 group-hover:text-neutral-700 transition-colors">
                        {selectedLang === 'EN' ? 'Recommended Practice Lesson' : 'Lección de Práctica Recomendada'}
                      </h5>
                      <p className="text-[10px] text-neutral-500 mt-0.5 leading-tight">
                        {selectedLang === 'EN' ? 'Ordering food at an American restaurant' : 'Pedir comida en un restaurante estadounidense'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-neutral-700 group-hover:translate-x-0.5 transition-transform">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Teacher evaluation link */}
                <div 
                  onClick={() => onNavigateTab?.('teachers')}
                  className="bg-neutral-50 hover:bg-neutral-100/70 p-3 rounded-xl border border-black/10 transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-xl bg-white border border-black/10 flex items-center justify-center text-neutral-600 group-hover:scale-105 transition-transform">
                      <Apple className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-neutral-800 group-hover:text-neutral-700 transition-colors">
                        {selectedLang === 'EN' ? 'Teacher Notes & Pedagogical Insights' : 'Notas y Evaluación del Profesor'}
                      </h5>
                      <p className="text-[10px] text-neutral-500 mt-0.5 leading-tight">
                        {selectedLang === 'EN' 
                          ? 'VOYAGER teacher evaluation, grammar notes & phonetics guidance' 
                          : 'Evaluación pedagógica del profesor VOYAGER, gramática y fonética'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-neutral-700 group-hover:translate-x-0.5 transition-transform">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
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
          
          // Clean system tags from user profile / roadmap questions
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

      {/* Row 2: User's Input Box (Styled exactly like the Chat section input box with PAUSA and User icon) */}
      <div className="flex-shrink-0 px-4 pb-4 select-none flex justify-end w-full">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const inputEl = e.currentTarget.elements.namedItem('profileQuestion') as HTMLInputElement;
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
            name="profileQuestion"
            required
            placeholder={selectedLang === 'EN' ? "Ask Voyager about your profile..." : "Pregúntale a Voyager sobre tu perfil..."}
            style={{ fontFamily: '"American Typewriter", "Courier New", Courier, serif' }}
            className="w-full focus:outline-none transition-all border-none bg-transparent text-black text-right placeholder:text-right placeholder:text-black/45 font-serif text-[12.5px] p-0"
          />
        </form>
      </div>

    </div>
  );
};
