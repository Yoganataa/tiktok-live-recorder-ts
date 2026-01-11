import { BaseResolver } from './BaseResolver';

import type { RoomResolveResult } from '../RoomResolver';

interface EulerResponse {
  data?: {
    room_info?: {
      id?: string;
    };
  };
}

export class EulerResolver extends BaseResolver {
  protected readonly name = 'Euler';

  protected async fetchExecution(username: string): Promise<RoomResolveResult> {
    const data = await this.http.get<EulerResponse>(
      `https://tiktok.eulerstream.com/webcast/room_info?uniqueId=${username}&giftInfo=false`,
    );

    return {
      roomId: data?.data?.room_info?.id || null,
    };
  }
}
