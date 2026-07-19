import React from 'react';
import { Award, BookOpen, Star, RefreshCw, BarChart2, AlertCircle } from 'lucide-react';

interface ProgressDashboardProps {
  selectedLang: 'EN' | 'ES';
  scores: {
    grammar: number;
    pronunciation: number;
    confidence: number;
    naturalness: number;
  };
  learnedWords: string[];
  accentPatterns: string[];
  onAskVoyager: (text: string) => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  selectedLang,
  scores,
  learnedWords,
  accentPatterns,
  onAskVoyager
}) => {
  const scoreMetrics = [
    { key: 'grammar', name: selectedLang === 'EN' ? 'Grammar' : 'Gramática', val: scores.grammar },
    { key: 'pronunciation', name: selectedLang === 'EN' ? 'Pronunciation' : 'Pronunciación', val: scores.pronunciation },
    { key: 'confidence', name: selectedLang === 'EN' ? 'Confidence' : 'Confianza', val: scores.confidence },
    { key: 'naturalness', name: selectedLang === 'EN' ? 'Naturalness' : 'Naturalidad', val: scores.naturalness }
  ];

  const getMetricRatingStars = (rating: number) => {
    return (
      <div className="flex gap-0.5 text-yellow-500">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            className={`w-3.5 h-3.5 ${s <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-neutral-600'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-black/45 border border-white/10 rounded-2xl p-4 font-sans text-white overflow-hidden max-h-[380px] md:max-h-[440px]">
      
      {/* Title Header */}
      <div className="flex justify-between items-center border-b border-white/10 pb-2.5 mb-3">
        <span className="text-[10px] font-mono font-bold tracking-widest text-yellow-400 uppercase flex items-center gap-1">
          <BarChart2 className="w-3.5 h-3.5 text-yellow-500" />
          {selectedLang === 'EN' ? 'Fluency Tracker' : 'Rastreador de Fluidez'}
        </span>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4.5 max-h-[290px] md:max-h-[350px]">
        
        {/* Scores Meter Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2.5">
          <span className="block text-[9px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
            🏆 {selectedLang === 'EN' ? 'CONFIDENCE SCORES' : 'PUNTUACIONES DE CONFIANZA'}
          </span>
          <div className="space-y-2">
            {scoreMetrics.map((metric) => (
              <div key={metric.key} className="flex justify-between items-center bg-black/20 p-2 rounded-lg border border-white/5">
                <span className="text-xs font-bold text-neutral-200">{metric.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-yellow-400">{metric.val > 0 ? `${metric.val * 20}%` : '--'}</span>
                  {getMetricRatingStars(metric.val)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vocabulary Memory Section */}
        <div className="space-y-2">
          <span className="block text-[9px] font-mono font-bold tracking-widest text-neutral-400 uppercase flex items-center justify-between">
            <span>{selectedLang === 'EN' ? 'VOCABULARY MEMORY' : 'MEMORIA DE VOCABULARIO'}</span>
            <span className="text-[8px] text-yellow-500 font-bold">{learnedWords.length} {selectedLang === 'EN' ? 'words' : 'palabras'}</span>
          </span>
          
          {learnedWords.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center text-xs text-neutral-400 italic">
              {selectedLang === 'EN' ? 'No words captured yet. Speak with VOYAGER to build memory.' : 'Aún no hay palabras. Habla con VOYAGER para guardarlas.'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 p-1 bg-black/25 rounded-xl border border-white/5">
              {learnedWords.map((word, i) => (
                <span 
                  key={i}
                  onClick={() => onAskVoyager(selectedLang === 'EN' ? `Remind me, what does the vocabulary word "${word}" mean?` : `Recuérdame, ¿qué significa la palabra de vocabulario "${word}"?`)}
                  className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/25 hover:border-yellow-400/50 hover:bg-yellow-500/20 text-yellow-400 text-[10px] font-mono font-bold rounded-lg cursor-pointer transition-all"
                >
                  {word}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Accent Reduction / Coach Section */}
        <div className="space-y-2">
          <span className="block text-[9px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
            🎙️ {selectedLang === 'EN' ? 'ACCENT REDUCTION PATTERNS' : 'PATRONES DE REDUCCIÓN DE ACENTO'}
          </span>

          {accentPatterns.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center text-xs text-neutral-400 italic">
              {selectedLang === 'EN' ? 'No pronunciation warnings flagged yet.' : 'Aún no se han detectado advertencias de pronunciación.'}
            </div>
          ) : (
            <div className="grid gap-2">
              {accentPatterns.map((pattern, i) => (
                <div 
                  key={i}
                  onClick={() => onAskVoyager(selectedLang === 'EN' ? `Let's practice the accent reduction exercise for: "${pattern}".` : `Practiquemos el ejercicio de reducción de acento para: "${pattern}".`)}
                  className="bg-red-500/5 border border-red-500/10 hover:border-red-500/35 p-2.5 rounded-xl transition-all cursor-pointer flex items-start gap-2.5 leading-normal group"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5 group-hover:scale-105 transition-all" />
                  <div className="flex-1 flex flex-col gap-0.5">
                    <span className="text-[11px] font-bold text-neutral-200 group-hover:text-white transition-colors">{pattern}</span>
                    <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider group-hover:text-neutral-400 transition-colors">
                      {selectedLang === 'EN' ? 'Click to trigger coach practice' : 'Toca para iniciar práctica de acento'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
