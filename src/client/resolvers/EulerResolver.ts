import type { HttpClient } from '../HttpClient';
import type { RoomResolver, RoomResolveResult } from '../RoomResolver';
import { logger } from '../../utils/logger';

interface EulerResponse {
  data?: {
    room_info?: {
      id?: string;
    };
  };
}

export class EulerResolver implements RoomResolver {
  constructor(private readonly http: HttpClient) {}

  async resolve(username: string): Promise<RoomResolveResult> {
    try {
      logger.debug({ username }, 'Attempting Euler resolver');

      const data = await this.http.get<EulerResponse>(
        `https://tiktok.eulerstream.com/webcast/room_info?uniqueId=${username}&giftInfo=false`
      );

      const roomId = data?.data?.room_info?.id || null;

      if (roomId) {
        logger.info({ username, roomId }, 'Euler: Successfully resolved room ID');
      } else {
        logger.debug('Euler: No room ID found');
      }

      return { roomId };
    } catch (err) {
      logger.debug({ err, username }, 'Euler resolver failed');
      return { roomId: null };
    }
  }
}