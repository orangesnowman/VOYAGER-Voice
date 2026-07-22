import React, { useState, useEffect } from 'react';
import { User, LogOut, Compass, Calendar, Award, CheckCircle2, Circle, Target, ChevronRight, Mail, Key, Users, Sparkles, Activity, BookOpen, Volume2, Apple } from 'lucide-react';
import { googleSignIn, logout, auth } from '../services/firebaseAuth';
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
    completedDays: [1]
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
    <div className="flex-1 flex flex-col p-4 bg-[#f5efe6] overflow-y-auto max-h-[480px] md:max-h-[550px] animate-fade-in font-sans text-[#231d17]">
      {/* Profile Header Block */}
      <div className="bg-white rounded-2xl p-4 border border-[#dfc389]/60 shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ebd5a3] flex items-center justify-center border border-[#dfc389]">
              <User className="w-5 h-5 text-[#9c6b21]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 font-serif leading-tight">{user.name}</h4>
              <p className="text-[10px] text-neutral-500 font-mono leading-none">{user.email} • {user.provider} Auth</p>
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
          <div className="mt-4 pt-3 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
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
          <div className="mt-3.5 pt-3 border-t border-neutral-100 space-y-3 text-left">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-[#9c6b21] flex-shrink-0" />
                <span className="text-xs text-neutral-600 font-medium">
                  <strong>{selectedLang === 'EN' ? 'Goal:' : 'Meta:'}</strong> {user.goal || selectedGoal}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#ca8a04] flex-shrink-0" />
                <span className="text-xs text-neutral-600 font-medium">
                  <strong>{selectedLang === 'EN' ? 'Level:' : 'Nivel:'}</strong> {user.levelEstimate || selectedLevel}
                </span>
              </div>
            </div>

            {/* Score competency cards including Fluidez */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#dfc389]/40 flex flex-col justify-between">
                <div className="flex items-center gap-1 text-[#865918]">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{selectedLang === 'EN' ? 'Fluency' : 'Fluidez'}</span>
                </div>
                <div className="text-base font-extrabold text-[#231d17] my-0.5">{scores?.naturalness || 75}%</div>
                <div className="w-full bg-amber-200/50 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#865918] h-full rounded-full" style={{ width: `${scores?.naturalness || 75}%` }}></div>
                </div>
              </div>

              <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#dfc389]/40 flex flex-col justify-between">
                <div className="flex items-center gap-1 text-[#865918]">
                  <BookOpen className="w-3 h-3 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{selectedLang === 'EN' ? 'Grammar' : 'Gramática'}</span>
                </div>
                <div className="text-base font-extrabold text-[#231d17] my-0.5">{scores?.grammar || grammarScore || 70}%</div>
                <div className="w-full bg-amber-200/50 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#865918] h-full rounded-full" style={{ width: `${scores?.grammar || grammarScore || 70}%` }}></div>
                </div>
              </div>

              <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#dfc389]/40 flex flex-col justify-between">
                <div className="flex items-center gap-1 text-[#865918]">
                  <Volume2 className="w-3 h-3 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{selectedLang === 'EN' ? 'Phonetics' : 'Fonética'}</span>
                </div>
                <div className="text-base font-extrabold text-[#231d17] my-0.5">{scores?.pronunciation || pronunciationScore || 75}%</div>
                <div className="w-full bg-amber-200/50 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#865918] h-full rounded-full" style={{ width: `${scores?.pronunciation || pronunciationScore || 75}%` }}></div>
                </div>
              </div>

              <div className="bg-[#FAF7F2] p-2 rounded-xl border border-[#dfc389]/40 flex flex-col justify-between">
                <div className="flex items-center gap-1 text-[#865918]">
                  <Activity className="w-3 h-3 text-amber-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{selectedLang === 'EN' ? 'Confidence' : 'Confianza'}</span>
                </div>
                <div className="text-base font-extrabold text-[#231d17] my-0.5">{scores?.confidence || 80}%</div>
                <div className="w-full bg-amber-200/50 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#865918] h-full rounded-full" style={{ width: `${scores?.confidence || 80}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {/* ROADMAP SECTION */}
        <div className="space-y-3 text-left">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#9c6b21] flex items-center gap-1.5 font-serif">
              <Compass className="w-4 h-4 text-[#9c6b21]" />
              {selectedLang === 'EN' ? 'Your Living Roadmap' : 'Tu Mapa de Ruta Activo'}
            </h4>
            <span className="text-[10px] font-mono font-bold bg-[#ebd5a3] text-[#9c6b21] px-2 py-0.5 rounded-full uppercase">
              {user.completedDays.length} / {IMMERSION_CURRICULUM.length} {selectedLang === 'EN' ? 'Completed' : 'Completados'}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-3 border border-[#dfc389]/60 shadow-sm max-h-[290px] overflow-y-auto space-y-2.5">
            {IMMERSION_CURRICULUM.map((day) => {
              const isCompleted = user.completedDays.includes(day.dayNum);
              return (
                <div 
                  key={day.dayNum}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isCompleted 
                      ? 'bg-emerald-50/20 border-emerald-500/20' 
                      : 'bg-neutral-50/50 border-neutral-200/50 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => toggleDayCompleted(day.dayNum)}
                        className="mt-0.5 bg-transparent border-none p-0 cursor-pointer text-neutral-400 hover:text-[#9c6b21]"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-100" />
                        ) : (
                          <Circle className="w-4.5 h-4.5 text-neutral-300" />
                        )}
                      </button>
                      <div>
                        <h5 className="text-[11px] font-bold text-neutral-800 leading-tight">
                          Day {day.dayNum}: {selectedLang === 'EN' ? day.title : day.titleEs}
                        </h5>
                        <p className="text-[10px] text-neutral-500 line-clamp-2 mt-0.5 leading-snug">
                          {selectedLang === 'EN' ? day.objectives[0] : day.objectivesEs[0]}
                        </p>
                      </div>
                    </div>
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* QUICK NAVIGATION & PROGRESS HIGHLIGHTS (FLUIDEZ & PROFESORES LINKS) */}
        <div className="space-y-3 text-left">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#9c6b21] flex items-center gap-1.5 font-serif">
            <Sparkles className="w-4 h-4 text-[#9c6b21]" />
            {selectedLang === 'EN' ? 'Recent Progress & Next Steps' : 'Progreso Reciente y Próximos Pasos'}
          </h4>

          <div className="space-y-2.5">
            {/* Link to FLUIDEZ */}
            <div 
              onClick={() => onNavigateTab?.('progress')}
              className="bg-white hover:bg-amber-50/50 p-3.5 rounded-2xl border border-[#dfc389]/60 shadow-sm transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#865918] group-hover:scale-105 transition-transform">
                  <Activity className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[#231d17] group-hover:text-[#865918] transition-colors">
                    {selectedLang === 'EN' ? 'Recent Lesson Summary & Fluency' : 'Resumen de Sesión Reciente y Fluidez'}
                  </h5>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {selectedLang === 'EN' 
                      ? 'Detailed breakdown of speech pace, naturalness & spoken vocabulary' 
                      : 'Análisis detallado de ritmo de habla, naturalidad y vocabulario practicado'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#865918] group-hover:translate-x-1 transition-transform">
                <span>{scores?.naturalness || 75}%</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Recommended Practice Lesson */}
            <div 
              onClick={() => onAskVoyager(selectedLang === 'EN' 
                ? 'Let us do a practice session focusing on ordering food and daily conversation in English.' 
                : 'Hagamos una sesión de práctica enfocada en pedir comida y conversación cotidiana en inglés.'
              )}
              className="bg-white hover:bg-amber-50/50 p-3.5 rounded-2xl border border-[#dfc389]/60 shadow-sm transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
                  <Target className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[#231d17] group-hover:text-[#865918] transition-colors">
                    {selectedLang === 'EN' ? 'Recommended Practice Lesson' : 'Lección de Práctica Recomendada'}
                  </h5>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {selectedLang === 'EN' ? 'Ordering food at an American restaurant' : 'Pedir comida en un restaurante estadounidense'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#865918] group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Link to PROFESORES evaluation */}
            <div 
              onClick={() => onNavigateTab?.('teachers')}
              className="bg-white hover:bg-amber-50/50 p-3.5 rounded-2xl border border-[#dfc389]/60 shadow-sm transition-all cursor-pointer group flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-800 group-hover:scale-105 transition-transform">
                  <Apple className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-[#231d17] group-hover:text-[#865918] transition-colors">
                    {selectedLang === 'EN' ? 'Teacher Notes & Pedagogical Insights' : 'Notas y Evaluación del Profesor'}
                  </h5>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {selectedLang === 'EN' 
                      ? 'VOYAGER teacher evaluation, grammar notes & phonetics guidance' 
                      : 'Evaluación pedagógica del profesor VOYAGER, gramática y fonética'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-[#865918] group-hover:translate-x-1 transition-transform">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TEACHER INSIGHTS & PEDAGOGICAL FEEDBACK SECTION */}
      <div id="teacher-insights" className="mt-6 pt-5 border-t border-[#dfc389]/60 space-y-3 text-left">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#9c6b21] flex items-center gap-1.5 font-serif">
            <Users className="w-4 h-4 text-[#9c6b21]" />
            {selectedLang === 'EN' ? 'Teacher Insights & Notes' : 'Notas y Feedback del Profesor'}
          </h4>
          <span className="text-[10px] font-mono text-[#865918] font-semibold bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-300/60">
            {selectedLang === 'EN' ? 'Pedagogical Evaluation' : 'Evaluación Pedagógica'}
          </span>
        </div>

        <TeacherInsightsPanel
          selectedLang={selectedLang}
          scores={scores || {
            grammar: grammarScore || 70,
            pronunciation: pronunciationScore || 75,
            confidence: 80,
            naturalness: 75
          }}
          learnedWords={learnedWords || []}
          accentPatterns={accentPatterns || []}
        />
      </div>
    </div>
  );
};
