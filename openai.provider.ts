import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { AIProvider, ChatTurn } from '../ai-provider.interface';

const SYSTEM_PROMPT =
  "You are a helpful AI assistant inside the app. Be concise, friendly, and answer in the user's language.";

@Injectable()
export class OpenAIProvider implements AIProvider {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async streamChat(messages: ChatTurn[], onToken: (token: string) => void): Promise<string> {
    const chatMessages = [{ role: 'system' as const, content: SYSTEM_PROMPT }, ...messages];

    let full = '';
    const stream = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: chatMessages as any,
      stream: true,
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        full += token;
        onToken(token);
      }
    }
    return full;
  }
}
