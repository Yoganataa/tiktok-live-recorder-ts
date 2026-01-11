// src/client/resolvers/BaseResolver.ts
import { logger } from '../../utils/logger';

import type { HttpClient } from '../HttpClient';
import type { RoomResolver, RoomResolveResult } from '../RoomResolver';

export abstract class BaseResolver implements RoomResolver {
  protected abstract readonly name: string;

  constructor(protected readonly http: HttpClient) {}

  /**
   * Specific implementation to fetch data from the provider.
   * Returns RoomResolveResult (roomId, blocked status) or null if not found.
   */
  protected abstract fetchExecution(username: string): Promise<RoomResolveResult>;

  async resolve(username: string): Promise<RoomResolveResult> {
    try {
      logger.debug({ username }, `Attempting ${this.name} resolver`);

      const result = await this.fetchExecution(username);

      if (result.blocked) {
        logger.warn(`${this.name}: WAF/Captcha detected`);
        return result;
      }

      if (result.roomId) {
        logger.info(
          { username, roomId: result.roomId },
          `${this.name}: Successfully resolved room ID`,
        );
      } else {
        logger.debug(`${this.name}: No room ID found`);
      }

      return result;
    } catch (err) {
      logger.debug({ err, username }, `${this.name} resolver failed`);
      return { roomId: null };
    }
  }
}
