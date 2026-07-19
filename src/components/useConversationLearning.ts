import { useState, useCallback } from 'react';
import { PronunciationFeedbackEvent, ConversationEvent } from './LiveAgentTypes';
import { PronunciationCoach } from '../domain/PronunciationCoach';
import { ConversationMode } from './ConversationModes';

export function useConversationLearning() {
  const [scores, setScores] = useState({ grammar: 0, pronunciation: 0, confidence: 0, naturalness: 0 });
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [accentPatterns, setAccentPatterns] = useState<string[]>([]);
  const [pronunciationEvents, setPronunciationEvents] = useState<PronunciationFeedbackEvent[]>([]);

  const handleNewCoachingEvent = useCallback((newEvent: PronunciationFeedbackEvent) => {
    setPronunciationEvents(prev => [...prev, newEvent]);

    const conEvent: ConversationEvent = {
      type: 'PRONUNCIATION_COACHING',
      timestamp: Date.now(),
      sessionId: newEvent.sessionId,
      data: newEvent
    };
    console.log("Dispatched Pronunciation Coaching Event via PronunciationCoach:", conEvent);
  }, []);

  const createPronunciationEvent = useCallback((pattern: string) => {
    const newEvent = PronunciationCoach.createFeedbackEvent(pattern);
    handleNewCoachingEvent(newEvent);
  }, [handleNewCoachingEvent]);

  const updateLearningState = useCallback((parsed: any, activeMode: ConversationMode) => {
    const currentState = {
      scores,
      learnedWords,
      accentPatterns,
      pronunciationEvents
    };

    const result = PronunciationCoach.processIncomingMetrics(
      parsed,
      currentState,
      activeMode,
      handleNewCoachingEvent
    );

    setScores(result.updatedScores);
    setLearnedWords(result.updatedWords);
    setAccentPatterns(result.updatedPatterns);
  }, [scores, learnedWords, accentPatterns, pronunciationEvents, handleNewCoachingEvent]);

  return {
    scores,
    setScores,
    learnedWords,
    setLearnedWords,
    accentPatterns,
    setAccentPatterns,
    pronunciationEvents,
    setPronunciationEvents,
    createPronunciationEvent,
    updateLearningState
  };
}

export default useConversationLearning;
