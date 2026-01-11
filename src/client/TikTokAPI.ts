// src/client/TikTokAPI.ts
import { LiveNotFoundError, UserNotLiveError } from '../errors/errors';
import { logger } from '../utils/logger';

import { EulerResolver } from './resolvers/EulerResolver';
import { TikRecResolver } from './resolvers/TikRecResolver';
import { WebcastResolver } from './resolvers/WebcastResolver';
import { RoomResolverChain } from './RoomResolverChain';
import { RoomAliveSchema, RoomInfoSchema, WebcastFeedSchema } from './schemas';

import type { HttpClient } from './HttpClient';
import type { StreamUrlSchema } from './schemas';
import type { z } from 'zod';

type StreamUrlData = z.infer<typeof StreamUrlSchema>;

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
      const data = await this.http.get(
        `${this.WEBCAST}/webcast/room/check_alive/?aid=1988&room_ids=${roomId}&user_is_login=true`,
        { schema: RoomAliveSchema },
      );
      return Boolean(data.data?.[0]?.alive);
    } catch (err) {
      logger.error({ err, roomId }, 'Failed to check if room is alive');
      return false;
    }
  }

  /**
   * Extracts and sorts stream URLs from the SDK data payload.
   */
  private extractSdkStream(streamUrl: StreamUrlData, qualityPreference: number): string | null {
    try {
      const sdkDataStr = streamUrl.live_core_sdk_data?.pull_data?.stream_data;
      const qualities = streamUrl.live_core_sdk_data?.pull_data?.options?.qualities || [];

      if (sdkDataStr && qualities.length > 0) {
        const sdkData = JSON.parse(sdkDataStr).data as Record<string, { main?: { flv?: string } }>;
        const levelMap = new Map(qualities.map((q) => [q.sdk_key, q.level]));

        const streams = Object.entries(sdkData)
          .map(([key, val]) => ({
            key,
            url: val?.main?.flv,
            level: levelMap.get(key) ?? -1,
          }))
          .filter((s): s is { key: string; url: string; level: number } => !!s.url)
          .sort((a, b) => b.level - a.level);

        if (streams.length > 0) {
          const selected = streams[Math.min(qualityPreference, streams.length - 1)];
          logger.debug({ quality: selected!.key }, 'Selected SDK stream');
          return selected!.url;
        }
      }
    } catch (err) {
      logger.warn({ err }, 'SDK data parsing failed, falling back to legacy');
    }
    return null;
  }

  /**
   * Extracts stream URLs from the legacy FLV/RTMP pull fields.
   */
  private extractLegacyStream(streamUrl: StreamUrlData, qualityPreference: number): string | null {
    const flvUrls = (streamUrl.flv_pull_url ?? {}) as Record<string, string>;
    const candidates = ['FULL_HD1', 'HD1', 'SD2', 'SD1']
      .map((key) => flvUrls[key])
      .filter((url): url is string => !!url);

    if (streamUrl.rtmp_pull_url) {
      candidates.push(streamUrl.rtmp_pull_url);
    }

    if (candidates.length === 0) return null;

    const selected = candidates[Math.min(qualityPreference, candidates.length - 1)];
    logger.debug({ source: 'Legacy' }, 'Selected Legacy stream');
    return selected!;
  }

  async getLiveStreamUrl(roomId: string, qualityPreference: number = 0): Promise<string> {
    logger.info({ roomId, qualityPreference }, 'Fetching live stream URL');

    const data = await this.http.get(
      `${this.WEBCAST}/webcast/room/info/?aid=1988&room_id=${roomId}`,
      { schema: RoomInfoSchema },
    );

    const streamUrl = data.data?.stream_url;
    if (!streamUrl) {
      if (data.status_code === 4003110) {
        throw new UserNotLiveError('Live stream restricted/login required');
      }
      throw new LiveNotFoundError('Stream URL not found');
    }

    // 1. Try SDK (Preferred)
    const sdkUrl = this.extractSdkStream(streamUrl, qualityPreference);
    if (sdkUrl) return sdkUrl;

    // 2. Try Legacy
    const legacyUrl = this.extractLegacyStream(streamUrl, qualityPreference);
    if (legacyUrl) return legacyUrl;

    throw new LiveNotFoundError('No compatible stream URLs found');
  }

  async getRoomIdFromUser(username: string): Promise<string> {
    return this.resolver.resolve(username);
  }

  async getSecUid(): Promise<string | null> {
    try {
      const html = await this.http.get<string>(`${this.BASE}/foryou`);
      return (typeof html === 'string' && html.match(/"secUid":"([^"]+)"/)?.[1]) || null;
    } catch (err) {
      logger.warn({ err }, 'Failed to get secUid');
      return null;
    }
  }

  async getFollowers(_secUid: string): Promise<string[]> {
    logger.info('Scanning Following Feed...');
    try {
      const data = await this.http.get(
        `${this.WEBCAST}/webcast/feed/?aid=1988&feed_type=1&count=20`,
        { schema: WebcastFeedSchema },
      );

      const liveUsers = new Set<string>();
      data.data?.data?.forEach((item) => {
        const uid = item.data?.user?.unique_id;
        if (uid) liveUsers.add(uid);
      });

      const result = Array.from(liveUsers);
      logger.info({ count: result.length }, 'Live users found in feed');
      return result;
    } catch (err) {
      logger.error({ err: (err as Error).message }, 'Failed to fetch Webcast Feed');
      return [];
    }
  }
}
