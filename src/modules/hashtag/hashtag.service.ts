import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Hashtag } from './entities/hashtag.entity';

@Injectable()
export class HashtagService {
  constructor(
    @InjectRepository(Hashtag)
    private readonly hashtagRepository: Repository<Hashtag>,
  ) {}

  /**
   * Extracts unique, lowercase hashtag names from a string.
   * @param text The text to parse.
   * @returns An array of hashtag names without the '#'.
   */
  private extractHashtagNames(text: string): string[] {
    if (!text) return [];
    const regex = /#([a-zA-Z0-9_]+)/g;
    const matches = text.match(regex);
    if (!matches) {
      return [];
    }
    // Return unique, lowercase hashtag names
    return [...new Set(matches.map(h => h.substring(1).toLowerCase()))];
  }

  /**
   * Finds existing hashtags and creates new ones for a given list of names.
   * @param names An array of hashtag names.
   * @returns A promise that resolves to an array of Hashtag entities.
   */
  async findOrCreateHashtags(names: string[]): Promise<Hashtag[]> {
    if (names.length === 0) {
      return [];
    }

    const existingHashtags = await this.hashtagRepository.find({
      where: { name: In(names) },
    });

    const existingNames = existingHashtags.map(h => h.name);
    const newNames = names.filter(name => !existingNames.includes(name));

    if (newNames.length === 0) {
      return existingHashtags;
    }

    const newHashtags = newNames.map(name =>
      this.hashtagRepository.create({ name }),
    );
    const savedNewHashtags = await this.hashtagRepository.save(newHashtags);

    return [...existingHashtags, ...savedNewHashtags];
  }

  /**
   * Parses hashtags from a text, finds or creates them, and returns the entities.
   * @param text The text content of a post or comment.
   * @returns A promise that resolves to an array of Hashtag entities.
   */
  async processHashtagsFromText(text: string): Promise<Hashtag[]> {
    const names = this.extractHashtagNames(text);
    return this.findOrCreateHashtags(names);
  }
}
