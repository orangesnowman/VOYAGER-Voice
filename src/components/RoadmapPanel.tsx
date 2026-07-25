import React, { useState, useEffect } from 'react';
import { User, LogOut, Compass, Calendar, Award, CheckCircle2, Circle, Target, ChevronRight, Mail, Key, Users, Sparkles, Activity, BookOpen, Volume2, Apple, Lock, Bot, MessageSquare, Pause, TrendingUp } from 'lucide-react';
import { googleSignIn, logout, auth } from '../services/firebaseAuth';
import voyagerRobot from '../assets/images/voyager_robot_1783082204380.png';
import { IMMERSION_CURRICULUM } from '../constants';
import { TeacherInsightsPanel } from './TeacherInsightsPanel';

interface RoadmapPanelProps {
  selectedLang: 'EN' | 'ES';
  learnedWordsCount: number;
  grammarScore: number;
  pronunciationScore: number;
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

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('voyager_user_account');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return defaultUser;
  });

  // Roadmap preferences
  const [selectedGoal, setSelectedGoal] = useState('General Confidence');
  const [selectedLevel, setSelectedLevel] = useState('Intermediate');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'welcome' | 'level' | 'lessons' | 'progress'>('welcome');

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
    <div className="flex-1 flex flex-col p-4 bg-neutral-300 overflow-y-auto max-h-[480px] md:max-h-[550px] animate-fade-in font-sans text-[#231d17]">
      
      {/* THE MAIN PERFIL CONTAINER CARD WITH PINK BORDER */}
      <div className="bg-white border-[5px] border-red-600/30 rounded-[28px] p-5 shadow-sm space-y-4 text-left flex flex-col flex-shrink-0">
        
        {/* Sub-tab Navigation Header Bar */}
        <div className="flex items-center gap-3 pb-3.5 border-b border-neutral-100 select-none text-[9.5px] md:text-[10.5px]">
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
                    onClick={() => setActiveSubTab(tab)}
                    className="flex items-center gap-1 cursor-pointer bg-transparent border-none p-0 focus:outline-none transition-all duration-300 animate-fade-in"
                  >
                    {activeSubTab === tab && (
                      <MessageSquare className="w-3.5 h-3.5 text-red-600 fill-none scale-x-[-1] mt-0.5" />
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
                    <p className="text-[10px] text-neutral-500 font-mono leading-none">{user.email} • {user.provider} Auth</p>
                    <div className="flex items-center gap-1.5 mt-1.5 select-none">
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
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                        <strong>{selectedLang === 'EN' ? 'Goal:' : 'Meta:'}</strong> {user.goal || selectedGoal}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
                      <span className="text-xs text-neutral-600 font-medium">
                        <strong>{selectedLang === 'EN' ? 'Level:' : 'Nivel:'}</strong> {user.levelEstimate || selectedLevel}
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

      {/* Row 2: User's Input Box (Styled exactly like the Chat section input box with PAUSA and User icon) */}
      <div className="flex justify-end w-full mt-3 select-none flex-shrink-0">
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
          <div className="flex justify-end items-center gap-1.5 mb-1.5 text-[8.5pt] font-black text-blue-600 leading-none">
            <span>{selectedLang === 'EN' ? 'PAUSE' : 'PAUSA'}</span>
            <Pause className="w-3.5 h-3.5 fill-blue-600 stroke-none" />
            <User strokeWidth={2.5} className="w-4.5 h-4.5 ml-0.5 text-blue-600/70" />
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
