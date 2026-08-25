import { IsString, IsOptional, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsOptional() @IsString() sessionId?: string; // omit to start a new session
  @IsString() @MinLength(1) content: string;
}
