import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { ChatTurn } from '../ai/ai-provider.interface';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async listSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSessionMessages(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({ where: { id: sessionId, userId } });
    if (!session) throw new NotFoundException('Session not found');
    return this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async ensureSession(userId: string, sessionId: string | undefined, firstMessage: string) {
    if (sessionId) {
      const existing = await this.prisma.session.findFirst({ where: { id: sessionId, userId } });
      if (existing) return existing;
    }
    // Auto-title from the first message, mirroring most chat apps.
    const title = firstMessage.slice(0, 60);
    return this.prisma.session.create({ data: { userId, title } });
  }

  /**
   * Persists the user's message, streams the AI reply via `onToken`,
   * then persists the full assistant reply. Returns the session id
   * so the client can keep using it for subsequent turns.
   */
  async sendMessageStreaming(
    userId: string,
    sessionId: string | undefined,
    content: string,
    onToken: (token: string) => void,
  ) {
    const session = await this.ensureSession(userId, sessionId, content);

    await this.prisma.message.create({
      data: { sessionId: session.id, role: 'user', content },
    });

    const history = await this.prisma.message.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    const turns: ChatTurn[] = history.map((m) => ({
      role: m.role as ChatTurn['role'],
      content: m.content,
    }));

    const fullReply = await this.ai.streamChat(turns, onToken);

    await this.prisma.message.create({
      data: { sessionId: session.id, role: 'assistant', content: fullReply },
    });

    await this.prisma.session.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    return { sessionId: session.id, reply: fullReply };
  }
}
