export interface ChatTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Common interface so the rest of the app doesn't care whether
 * we're calling OpenAI or Anthropic (or something else later).
 */
export interface AIProvider {
  /**
   * Streams response tokens. Calls `onToken` for each chunk of text,
   * and resolves with the full accumulated text when done.
   */
  streamChat(messages: ChatTurn[], onToken: (token: string) => void): Promise<string>;
}
