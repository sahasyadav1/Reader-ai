import { Body, Controller, Get, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('sessions')
  listSessions(@Req() req: any) {
    return this.chatService.listSessions(req.user.userId);
  }

  @Get('sessions/:id/messages')
  getMessages(@Req() req: any, @Param('id') id: string) {
    return this.chatService.getSessionMessages(req.user.userId, id);
  }

  /**
   * SSE streaming endpoint. The mobile client consumes this with a
   * ReadableStream (see mobile/src/services/api.ts). Each event is a
   * small JSON payload: {type: 'token'|'done'|'error', ...}.
   */
  @Post('message/stream')
  async streamMessage(@Req() req: any, @Body() dto: SendMessageDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const send = (payload: unknown) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const result = await this.chatService.sendMessageStreaming(
        req.user.userId,
        dto.sessionId,
        dto.content,
        (token) => send({ type: 'token', token }),
      );
      send({ type: 'done', sessionId: result.sessionId });
    } catch (err) {
      send({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      res.end();
    }
  }
}
