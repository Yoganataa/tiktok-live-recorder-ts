import type { RoomResolver } from './RoomResolver';
import { WAFBlockedError } from '../errors/errors';
import { logger } from '../utils/logger';

export class RoomResolverChain {
  constructor(private readonly resolvers: RoomResolver[]) {}

  async resolve(username: string): Promise<string> {
    logger.info({ username }, 'Starting room ID resolution');

    for (const resolver of this.resolvers) {
      const result = await resolver.resolve(username);

      if (result.blocked) {
        throw new WAFBlockedError('Your IP is blocked by TikTok WAF. Please change your IP or use a proxy.');
      }

      if (result.roomId) {
        logger.info({ username, roomId: result.roomId }, 'Room ID resolved successfully');
        return result.roomId;
      }
    }

    throw new Error(`Unable to resolve room ID for user: ${username}`);
  }
}