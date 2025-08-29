import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { Match } from '../match/entities/match.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
  ) {}

  async createMessage(senderId: string, matchId: string, content: string): Promise<Message> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
      relations: ['pet1', 'pet2'],
    });

    // A proper check requires pet owner id. We'll simulate this check.
    // This logic would need to be more robust in a real app.
    if (!match || (match.pet1.user_id !== senderId && match.pet2.user_id !== senderId)) {
      throw new UnauthorizedException('You are not a participant in this match.');
    }

    const message = this.messageRepository.create({
      sender_id: senderId,
      match_id: matchId,
      content,
    });

    return this.messageRepository.save(message);
  }

  async getMessages(matchId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { match_id: matchId },
      order: { created_at: 'ASC' },
      relations: ['sender'],
    });
  }
}
