import type { HttpClient } from './HttpClient';
import { RoomResolverChain } from './RoomResolverChain';
import { TikRecResolver } from './resolvers/TikRecResolver';
import { EulerResolver } from './resolvers/EulerResolver';
import { WebcastResolver } from './resolvers/WebcastResolver';
import { LiveNotFoundError, UserNotLiveError } from '../errors/errors';
import { logger } from '../utils/logger';

interface RoomAliveResponse {
  data?: Array<{
    alive?: boolean;
  }>;
}

interface RoomInfoResponse {
  data?: {
    stream_url?: {
      live_core_sdk_data?: {
        pull_data?: {
          stream_data?: string;
          options?: {
            qualities?: Array<{
              sdk_key: string;
              level: number;
            }>;
          };
        };
      };
      flv_pull_url?: {
        FULL_HD1?: string;
        HD1?: string;
        SD2?: string;
        SD1?: string;
      };
      rtmp_pull_url?: string;
    };
  };
  status_code?: number;
}

interface FollowersListResponse {
  userList?: Array<{
    user?: {
      uniqueId?: string;
    };
  }>;
  hasMore?: boolean;
  cursor?: number;
  minCursor?: number;
}

export class TikTokAPI {
  private readonly BASE = 'https://www.tiktok.com';
  private readonly WEBCAST = 'https://webcast.tiktok.com';
  private readonly resolver: RoomResolverChain;

  constructor(private readonly http: HttpClient) {
    this.resolver = new RoomResolverChain([
      new TikRecResolver(http),
      new EulerResolver(http),
      new WebcastResolver(http),
    ]);
  }

  async isRoomAlive(roomId: string): Promise<boolean> {
    try {
      const data = await this.http.get<RoomAliveResponse>(
        `${this.WEBCAST}/webcast/room/check_alive/?aid=1988&region=CH&room_ids=${roomId}&user_is_login=true`
      );

      const isAlive = Boolean(data?.data?.[0]?.alive);
      logger.debug({ roomId, isAlive }, 'Room alive check completed');
      
      return isAlive;
    } catch (err) {
      logger.error({ err, roomId }, 'Failed to check if room is alive');
      return false;
    }
  }

  async getLiveStreamUrl(roomId: string): Promise<string> {
    logger.info({ roomId }, 'Fetching live stream URL');

    const data = await this.http.get<RoomInfoResponse>(
      `${this.WEBCAST}/webcast/room/info/?aid=1988&room_id=${roomId}`
    );

    const streamUrl = data?.data?.stream_url;

    if (!streamUrl) {
      throw new LiveNotFoundError('Stream URL not found in response');
    }

    // Try SDK data first (new format)
    const sdkDataStr = streamUrl.live_core_sdk_data?.pull_data?.stream_data;
    
    if (sdkDataStr) {
      try {
        const sdkData = JSON.parse(sdkDataStr).data as Record<string, { main?: { flv?: string } }>;
        const qualities = streamUrl.live_core_sdk_data?.pull_data?.options?.qualities || [];
        
        const levelMap = new Map(qualities.map((q) => [q.sdk_key, q.level]));

        let bestLevel = -1;
        let bestFlv: string | undefined;

        for (const [sdkKey, entry] of Object.entries(sdkData)) {
          const level = levelMap.get(sdkKey) ?? -1;
          const flv = entry?.main?.flv;

          if (level > bestLevel && flv) {
            bestLevel = level;
            bestFlv = flv;
          }
        }

        if (bestFlv) {
          logger.info({ roomId, url: bestFlv }, 'Found live stream URL (SDK data)');
          return bestFlv;
        }
      } catch (err) {
        logger.warn({ err }, 'Failed to parse SDK stream data, falling back to legacy URLs');
      }
    }

    // Fallback to legacy format
    const flvUrls = streamUrl.flv_pull_url;
    const legacyUrl =
      flvUrls?.FULL_HD1 ||
      flvUrls?.HD1 ||
      flvUrls?.SD2 ||
      flvUrls?.SD1 ||
      streamUrl.rtmp_pull_url;

    if (!legacyUrl) {
      if (data.status_code === 4003110) {
        throw new UserNotLiveError('Live stream is restricted or requires login');
      }
      throw new LiveNotFoundError('Unable to retrieve live stream URL');
    }

    logger.info({ roomId, url: legacyUrl }, 'Found live stream URL (legacy format)');
    return legacyUrl;
  }

  async getRoomIdFromUser(username: string): Promise<string> {
    return this.resolver.resolve(username);
  }

  async getSecUid(): Promise<string | null> {
    try {
      const html = await this.http.get<string>(`${this.BASE}/foryou`);
      
      if (typeof html !== 'string') {
        return null;
      }

      const match = html.match(/"secUid":"([^"]+)"/);
      const secUid = match?.[1] || null;

      if (secUid) {
        logger.debug({ secUid }, 'Successfully retrieved secUid');
      } else {
        logger.warn('Failed to extract secUid from response');
      }

      return secUid;
    } catch (err) {
      logger.error({ err }, 'Failed to get secUid');
      return null;
    }
  }

  async getFollowers(secUid: string): Promise<string[]> {
    logger.info('Fetching followers list');

    const followers: string[] = [];
    let cursor = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const url =
          `${this.BASE}/api/user/list/?` +
          `aid=1988&secUid=${secUid}&count=20&cursor=${cursor}`;

        const data = await this.http.get<FollowersListResponse>(url);

        const userList = data?.userList || [];
        
        for (const entry of userList) {
          const username = entry?.user?.uniqueId;
          if (username) {
            followers.push(username);
          }
        }

        hasMore = Boolean(data?.hasMore);
        const newCursor = Number(data?.cursor || data?.minCursor || 0);

        if (newCursor === cursor) {
          break;
        }

        cursor = newCursor;
      } catch (err) {
        logger.error({ err, cursor }, 'Error fetching followers page');
        break;
      }
    }

    logger.info({ count: followers.length }, 'Followers list retrieved');
    return followers;
  }
}
