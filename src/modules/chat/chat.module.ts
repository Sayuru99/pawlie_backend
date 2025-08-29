import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { Message } from './entities/message.entity';
import { Match } from '../match/entities/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Match])],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
