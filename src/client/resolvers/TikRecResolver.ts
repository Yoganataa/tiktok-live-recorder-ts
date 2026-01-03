import type { HttpClient } from '../HttpClient';
import type { RoomResolver, RoomResolveResult } from '../RoomResolver';
import { logger } from '../../utils/logger';

interface TikRecSignResponse {
  signed_path?: string;
}

interface TikRecRoomResponse {
  data?: {
    user?: {
      roomId?: string;
    };
  };
}

export class TikRecResolver implements RoomResolver {
  constructor(private readonly http: HttpClient) {}

  async resolve(username: string): Promise<RoomResolveResult> {
    try {
      logger.debug({ username }, 'Attempting TikRec resolver');

      const signRes = await this.http.get<TikRecSignResponse>(
        `https://tikrec.com/tiktok/room/api/sign?unique_id=${username}`
      );

      const signedPath = signRes?.signed_path;
      if (!signedPath) {
        logger.debug('TikRec: No signed path received');
        return { roomId: null };
      }

      const url = `https://www.tiktok.com${signedPath}`;
      const roomRes = await this.http.get<TikRecRoomResponse | string>(url);

      if (typeof roomRes === 'string' && roomRes.includes('Please wait')) {
        logger.warn('TikRec: WAF detected');
        return { roomId: null, blocked: true };
      }

      const roomId = typeof roomRes === 'object' ? roomRes?.data?.user?.roomId : null;

      if (roomId) {
        logger.info({ username, roomId }, 'TikRec: Successfully resolved room ID');
      } else {
        logger.debug('TikRec: No room ID found');
      }

      return { roomId: roomId || null };
    } catch (err) {
      logger.debug({ err, username }, 'TikRec resolver failed');
      return { roomId: null };
    }
  }
}