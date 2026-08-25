import { Injectable } from '@nestjs/common';
import { AIProvider, ChatTurn } from './ai-provider.interface';
import { AnthropicProvider } from './providers/anthropic.provider';
import { OpenAIProvider } from './providers/openai.provider';

@Injectable()
export class AiService {
  private provider: AIProvider;

  constructor(
    private anthropic: AnthropicProvider,
    private openai: OpenAIProvider,
  ) {
    // Swap providers via env var without touching call sites.
    this.provider = process.env.AI_PROVIDER === 'openai' ? this.openai : this.anthropic;
  }

  streamChat(messages: ChatTurn[], onToken: (token: string) => void) {
    return this.provider.streamChat(messages, onToken);
  }
}
