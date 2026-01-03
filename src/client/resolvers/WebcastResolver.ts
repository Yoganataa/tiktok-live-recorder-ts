import type { HttpClient } from '../HttpClient';
import type { RoomResolver, RoomResolveResult } from '../RoomResolver';
import { logger } from '../../utils/logger';

interface WebcastResponse {
  data?: {
    room_id?: string;
  };
}

export class WebcastResolver implements RoomResolver {
  constructor(private readonly http: HttpClient) {}

  async resolve(username: string): Promise<RoomResolveResult> {
    try {
      logger.debug({ username }, 'Attempting Webcast resolver');

      const data = await this.http.get<WebcastResponse>(
        `https://webcast.tiktok.com/webcast/room/info/?aid=1988&unique_id=${username}`
      );

      const roomId = data?.data?.room_id || null;

      if (roomId) {
        logger.info({ username, roomId }, 'Webcast: Successfully resolved room ID');
      } else {
        logger.debug('Webcast: No room ID found');
      }

      return { roomId };
    } catch (err) {
      logger.debug({ err, username }, 'Webcast resolver failed');
      return { roomId: null };
    }
  }
}