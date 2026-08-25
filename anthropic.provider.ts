import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, ChatTurn } from '../ai-provider.interface';

const SYSTEM_PROMPT =
  "You are a helpful AI assistant inside the app. Be concise, friendly, and answer in the user's language.";

@Injectable()
export class AnthropicProvider implements AIProvider {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async streamChat(messages: ChatTurn[], onToken: (token: string) => void): Promise<string> {
    const history = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));

    let full = '';
    const stream = this.client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: history as any,
    });

    stream.on('text', (text) => {
      full += text;
      onToken(text);
    });

    await stream.finalMessage();
    return full;
  }
}
