import { ConversationMode } from '../components/ConversationModes';

export interface ModePromptOptions {
  initialPrompt?: string;
  selectedLang: 'EN' | 'ES';
}

export class ConversationModePolicy {
  /**
   * Translates the active mode and options into the appropriate system instruction payload.
   */
  static getSystemInstructionsForMode(mode: ConversationMode, options: ModePromptOptions): string {
    const { initialPrompt, selectedLang } = options;
    
    let baseGreeting = initialPrompt || (
      selectedLang === 'ES'
        ? 'Por favor preséntate en español como VOYAGER, dime que estás muy emocionado de ser mi tutor de inglés estadounidense y asesor cultural, y pregúntame cuál es mi nombre para saber cómo dirigirte a mí (y adaptar los adjetivos en español a mi género correctamente).'
        : 'Please greet me in English as VOYAGER, say you are excited to help me practice and master American English as my tutor, and ask for my name so you can address me properly.'
    );

    switch (mode) {
      case 'BILINGUAL':
        return baseGreeting + '\n\n[SYSTEM MESSAGE: You are now in BILINGUAL TRANSLATION MODE. For EVERY SINGLE response, you must first speak and write your response in Spanish, and then immediately repeat the exact same response only in English. Separate the Spanish and English sentences with a slash \'/\'. Your entire response must consist of the Spanish version followed directly by the English translation, both in your voice output and in your text transcription.]';
      case 'LIVE_TRANSLATOR':
        return baseGreeting + '\n\n[SYSTEM MESSAGE: You are now in INSTANT TRANSLATION MODE. You must act strictly and purely as a speech translator. Do NOT hold a conversation, do NOT give tips, do NOT make small talk, and do NOT guide the user. Your ONLY job is to immediately translate whatever you hear: if you hear Spanish, translate it to English; if you hear English, translate it to Spanish. Output ONLY the translated words and absolutely nothing else, both in your voice and in your text transcription. Keep translations instantaneous, brief, and exact.]';
      case 'LISTEN_ONLY':
        return baseGreeting + '\n\n[SYSTEM MESSAGE: You are now starting in Monitor/Listen-only mode. The user is practicing by talking to a real person. You must only listen and analyze their English interaction. Do NOT speak. You can only respond via text. In your text responses, offer helpful, subtle language corrections or tips about their conversation, and if you want to speak aloud, explicitly ask the user for permission to talk (e.g. \'¿Puedo hablar?\').]';
      case 'SPANISH':
        return baseGreeting + '\n\n[SYSTEM MESSAGE: You are now in SPANISH ONLY MODE. You must speak and write strictly and purely in Spanish from now on. Discuss daily life and scenarios in America in Spanish. Do NOT teach English, evaluate grammar, or translate any text. Speak only in Spanish.]';
      case 'AMERICAN_ENGLISH':
        return baseGreeting + '\n\n[SYSTEM MESSAGE: You are now in ENGLISH ONLY MODE. You must speak and write strictly and purely in English. Do NOT provide any Spanish translations, hints, corrections, or bilingual tips. Speak naturally as an American English speaker. This is a pure immersion practice mode for advanced students. Speak only in English.]';
      default:
        return baseGreeting;
    }
  }

  /**
   * Checks whether active coaching is enabled in the current mode.
   * - AMERICAN_ENGLISH: active pronunciation coaching
   * - BILINGUAL: active pronunciation coaching for spoken English
   * - SPANISH: coaching disabled unless they specifically practice English
   * - LIVE_TRANSLATOR: normally no interruption, stored silently if appropriate
   */
  static isCoachingAllowed(mode: ConversationMode): boolean {
    return mode === 'AMERICAN_ENGLISH' || mode === 'BILINGUAL';
  }

  /**
   * Gets the system prompt message for dynamic hot-switching over WebSockets.
   */
  static getDynamicModeSwitchPrompt(mode: ConversationMode): string {
    switch (mode) {
      case 'LISTEN_ONLY':
        return "[SYSTEM MESSAGE: Mode changed. You are now in Monitor/Listen-only mode. However, BEFORE you go fully silent, you MUST immediately speak and write a brief explanation in Spanish (only one warm sentence) explaining what this mode does (that you will listen only and offer tips in the text chat, and won't speak unless given permission). End your sentence by saying that you will now be quiet and listen. Do NOT say 'Understood' or 'Entendido'. after saying this explanation, you must remain silent for subsequent turns and only respond via text unless asked '¿Puedo hablar?'.]";
      case 'LIVE_TRANSLATOR':
        return "[SYSTEM MESSAGE: Mode changed. You are now in INSTANT TRANSLATION MODE. From now on, whatever you hear in English, you must translate to Spanish. If the user speaks in Spanish, you must translate to English. Output ONLY the translated words and absolutely nothing else, both in your voice and in your text transcription. Do NOT say 'Understood' or 'Entendido'. In this very first response, translate this message to Spanish: 'Instant Translation Mode is now active. I am ready to translate.']";
      case 'BILINGUAL':
        return "[SYSTEM MESSAGE: Mode changed. You are now in BILINGUAL TRANSLATION MODE. You must immediately speak and write a brief explanation in Spanish (only one warm sentence) explaining what this mode does (that you will say all your responses first in Spanish, and then repeat them in English). Do NOT say 'Understood' or 'Entendido'.]";
      case 'SPANISH':
        return "[SYSTEM MESSAGE: Mode changed. You are now in SPANISH ONLY MODE. You must speak and write strictly and purely in Spanish from now on. Discuss American English culture and language in Spanish. Do NOT teach English, evaluate grammar, or translate any text. Speak only in Spanish. Do NOT say 'Understood' or 'Entendido'.]";
      case 'AMERICAN_ENGLISH':
        return "[SYSTEM MESSAGE: Mode changed. You are now in ENGLISH ONLY MODE. You must speak and write strictly and purely in English. Do NOT provide any Spanish translations, hints, corrections, or bilingual tips. Speak naturally as an American English speaker. This is a pure immersion practice mode for advanced students. Speak only in English. Do NOT say 'Understood' or 'Entendido'.]";
      default:
        return "";
    }
  }
}
