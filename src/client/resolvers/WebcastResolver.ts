import { BaseResolver } from './BaseResolver';

import type { RoomResolveResult } from '../RoomResolver';

interface WebcastResponse {
  data?: {
    room_id?: string;
  };
}

export class WebcastResolver extends BaseResolver {
  protected readonly name = 'Webcast';

  protected async fetchExecution(username: string): Promise<RoomResolveResult> {
    const data = await this.http.get<WebcastResponse>(
      `https://webcast.tiktok.com/webcast/room/info/?aid=1988&unique_id=${username}`,
    );

    return {
      roomId: data?.data?.room_id || null,
    };
  }
}
