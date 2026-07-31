import { useState, useCallback } from 'react';
import { ChatMessage } from './LiveAgentTypes';

export function useConversationTranscript(activeTab: string = 'chat') {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const parseImmersionTags = useCallback((text: string) => {
    let cleaned = text;
    let newScores = null;
    let newLearnedWords: string[] = [];
    let newAccentPattern = null;
    let newCompletedMission = null;

    // 1. Scores
    const scoresMatch = cleaned.match(/\[SCORES:\s*grammar=(\d+),\s*pronunciation=(\d+),\s*confidence=(\d+),\s*naturalness=(\d+)\]/i);
    if (scoresMatch) {
      newScores = {
        grammar: parseInt(scoresMatch[1], 10),
        pronunciation: parseInt(scoresMatch[2], 10),
        confidence: parseInt(scoresMatch[3], 10),
        naturalness: parseInt(scoresMatch[4], 10)
      };
      cleaned = cleaned.replace(scoresMatch[0], "");
    }

    // 2. Learned Words
    const learnedMatch = cleaned.match(/\[LEARNED_WORDS:\s*([^\]]+)\]/i);
    if (learnedMatch) {
      newLearnedWords = learnedMatch[1].split(',').map(w => w.trim()).filter(Boolean);
      cleaned = cleaned.replace(learnedMatch[0], "");
    }

    // 3. Accent
    const accentMatch = cleaned.match(/\[ACCENT:\s*([^\]]+)\]/i);
    if (accentMatch) {
      newAccentPattern = accentMatch[1].trim();
      cleaned = cleaned.replace(accentMatch[0], "");
    }

    // 4. Mission
    const missionMatch = cleaned.match(/\[MISSION_COMPLETE:\s*([^\]]+)\]/i);
    if (missionMatch) {
      newCompletedMission = missionMatch[1].trim();
      cleaned = cleaned.replace(missionMatch[0], "");
    }

    return { cleaned, newScores, newLearnedWords, newAccentPattern, newCompletedMission };
  }, []);

  const addSystemMessage = useCallback((text: string, customId?: string) => {
    const id = customId || `msg_sys_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setChatMessages(prev => [
      ...prev,
      {
        id,
        sender: 'system',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeMs: Date.now(),
        tab: activeTab
      }
    ]);
  }, [activeTab]);

  const addUserMessage = useCallback((text: string, customId?: string) => {
    const id = customId || `msg_text_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setChatMessages(prev => [
      ...prev,
      {
        id,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeMs: Date.now(),
        tab: activeTab
      }
    ]);
  }, [activeTab]);

  const addSplashMessage = useCallback((text: string, customId?: string) => {
    const id = customId || `msg_splash_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    setChatMessages(prev => [
      ...prev,
      {
        id,
        sender: 'splash',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timeMs: Date.now(),
        tab: activeTab
      }
    ]);
  }, [activeTab]);

  const updateUserVoiceTranscription = useCallback((transcriptionText: string) => {
    setChatMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.sender === 'user' && last.id.startsWith('msg_voice_trans_') && (Date.now() - last.timeMs < 6000)) {
         const updated = [...prev];
         updated[updated.length - 1] = {
            ...last,
            text: last.text + transcriptionText,
            timeMs: Date.now()
         };
         return updated;
      } else {
         return [...prev, {
            id: `msg_voice_trans_${Date.now()}`,
            sender: 'user',
            text: transcriptionText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timeMs: Date.now(),
            tab: activeTab
         }];
      }
    });
  }, [activeTab]);

  const updateAssistantResponse = useCallback((
    text: string,
    showForm: boolean,
    onParsedTags: (parsed: any) => void
  ) => {
    setChatMessages(prev => {
      const last = prev[prev.length - 1];
      const formPattern = /\[SHOW[-_ ]FORM\]|\(SHOW[-_ ]FORM\)/gi;
      if (last && last.sender === 'splash' && !last.id.startsWith('welcome_') && (Date.now() - last.timeMs < 10000)) {
         const updated = [...prev];
         const combinedText = last.text + text;
         
         const parsed = parseImmersionTags(combinedText);
         onParsedTags(parsed);

         const hasFormTag = formPattern.test(parsed.cleaned) || last.showForm || showForm;
         const cleanedText = parsed.cleaned.replace(formPattern, "");
         updated[updated.length - 1] = {
            ...last,
            text: cleanedText,
            showForm: hasFormTag,
            timeMs: Date.now()
         };
         return updated;
      } else {
         const parsed = parseImmersionTags(text);
         onParsedTags(parsed);

         const hasFormTag = formPattern.test(parsed.cleaned) || showForm;
         const cleanedText = parsed.cleaned.replace(formPattern, "");

         // Ignore duplicate welcome question text to avoid messy communication
         const isWelcomeDup = cleanedText.trim().replace(/[¿?¡!]/g, '').toLowerCase() === "en que te puedo ayudar hoy" || 
                              cleanedText.trim().replace(/[?]/g, '').toLowerCase() === "how can i help you today";
         if (isWelcomeDup && prev.some(m => m.id === 'welcome_store')) {
           return prev;
         }

         return [...prev, {
            id: `msg_${Date.now()}_${Math.random()}`,
            sender: 'splash',
            text: cleanedText,
            showForm: hasFormTag,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timeMs: Date.now(),
            tab: activeTab
         }];
      }
    });
  }, [parseImmersionTags, activeTab]);

  return {
    chatMessages,
    setChatMessages,
    parseImmersionTags,
    addSystemMessage,
    addUserMessage,
    addSplashMessage,
    updateUserVoiceTranscription,
    updateAssistantResponse
  };
}
export default useConversationTranscript;
