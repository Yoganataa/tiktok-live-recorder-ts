import { logger } from '../../utils/logger';

import { BaseResolver } from './BaseResolver';

import type { RoomResolveResult } from '../RoomResolver';

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

export class TikRecResolver extends BaseResolver {
  protected readonly name = 'TikRec';

  protected async fetchExecution(username: string): Promise<RoomResolveResult> {
    // 1. Get Signed Path
    const signRes = await this.http.get<TikRecSignResponse>(
      `https://tikrec.com/tiktok/room/api/sign?unique_id=${username}`,
    );
    const signedPath = signRes?.signed_path;

    if (!signedPath) {
      logger.debug('TikRec: No signed path received');
      return { roomId: null };
    }

    // 2. Fetch Room Data
    const url = `https://www.tiktok.com${signedPath}`;
    const roomRes = await this.http.get<TikRecRoomResponse | string>(url);

    // 3. Check for WAF/Blocking
    if (typeof roomRes === 'string' && roomRes.includes('Please wait')) {
      return { roomId: null, blocked: true };
    }

    const roomId = typeof roomRes === 'object' ? roomRes?.data?.user?.roomId : null;
    return { roomId: roomId || null };
  }
}
