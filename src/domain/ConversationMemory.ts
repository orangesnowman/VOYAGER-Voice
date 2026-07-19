import { ChatMessage } from '../components/LiveAgentTypes';

export interface ConversationStats {
  userMessagesCount: number;
  aiMessagesCount: number;
  totalTokensApprox: number;
}

export class ConversationMemory {
  private messages: ChatMessage[] = [];

  constructor(initialMessages: ChatMessage[] = []) {
    this.messages = [...initialMessages];
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  setMessages(messages: ChatMessage[]): void {
    this.messages = [...messages];
  }

  addMessage(msg: ChatMessage): void {
    this.messages.push(msg);
  }

  clear(): void {
    this.messages = [];
  }

  /**
   * Generates analytical stats over the conversation memory.
   */
  getStats(): ConversationStats {
    let userCount = 0;
    let aiCount = 0;
    let approxChars = 0;

    this.messages.forEach(m => {
      approxChars += m.text.length;
      if (m.sender === 'user') {
        userCount++;
      } else if (m.sender === 'splash') {
        aiCount++;
      }
    });

    return {
      userMessagesCount: userCount,
      aiMessagesCount: aiCount,
      totalTokensApprox: Math.round(approxChars / 4)
    };
  }

  /**
   * Cleans transcript text by stripping backticks and metadata tags
   */
  static cleanStreamingTags(text: string): string {
    if (!text) return "";
    return text
      .replace(/\[\s*(GRAMMAR_CORRECTION|NEW_WORD|ACCENT_PATTERN|LEARNING_STATE)[^\]]*\]/gi, "")
      .replace(/```json[\s\S]*?```/gi, "")
      .trim();
  }
}
