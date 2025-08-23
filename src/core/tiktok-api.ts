import { AxiosResponse } from 'axios';
import { HttpClient } from '../http-utils/http-client';
import { StatusCode, TikTokError } from '../utils/enums';
import { logger } from '../utils/logger-manager';
import { 
  UserLiveError, 
  TikTokRecorderError, 
  LiveNotFound 
} from '../utils/custom-exceptions';
import { 
  CookiesConfig, 
  RoomInfo, 
  UserRoomData, 
  FollowersData, 
  StreamData 
} from '../types';

export class TikTokAPI {
  private BASE_URL = 'https://www.tiktok.com';
  private WEBCAST_URL = 'https://webcast.tiktok.com';
  private API_URL = 'https://www.tiktok.com/api-live/user/room/';

  private httpClient: HttpClient;

  constructor(proxy?: string, cookies?: CookiesConfig) {
    this.httpClient = new HttpClient(proxy, cookies);
  }

  private async isAuthenticated(): Promise<boolean> {
    try {
      const response = await this.httpClient.req.get(`${this.BASE_URL}/foryou`);
      return !response.data.includes('login-title');
    } catch {
      return false;
    }
  }

  async isCountryBlacklisted(): Promise<boolean> {
    try {
      const response = await this.httpClient.req.get(`${this.BASE_URL}/live`, {
        maxRedirects: 0,
        validateStatus: () => true
      });
      return response.status === StatusCode.REDIRECT;
    } catch {
      return false;
    }
  }

  async isRoomAlive(roomId: string): Promise<boolean> {
    if (!roomId) {
      throw new UserLiveError(TikTokError.USER_NOT_CURRENTLY_LIVE);
    }

    try {
      const response = await this.httpClient.req.get(
        `${this.WEBCAST_URL}/webcast/room/check_alive/`,
        {
          params: {
            aid: 1988,
            region: 'CH',
            room_ids: roomId,
            user_is_login: true
          }
        }
      );

      const data = response.data;
      if (!data.data || data.data.length === 0) {
        return false;
      }

      return data.data[0]?.alive || false;
    } catch {
      return false;
    }
  }

  async getSecUid(): Promise<string | null> {
    try {
      const response = await this.httpClient.req.get(`${this.BASE_URL}/foryou`);
      const match = response.data.match(/"secUid":"(.*?)",/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }

  async getUserFromRoomId(roomId: string): Promise<string> {
    try {
      const response = await this.httpClient.req.get(
        `${this.WEBCAST_URL}/webcast/room/info/`,
        {
          params: { aid: 1988, room_id: roomId }
        }
      );

      const data: RoomInfo = response.data;
      
      if (JSON.stringify(data).includes('Follow the creator to watch their LIVE')) {
        throw new UserLiveError(TikTokError.ACCOUNT_PRIVATE_FOLLOW);
      }

      if (JSON.stringify(data).includes('This account is private')) {
        throw new UserLiveError(TikTokError.ACCOUNT_PRIVATE);
      }

      const displayId = data.data?.owner?.display_id;
      if (!displayId) {
        throw new TikTokRecorderError(TikTokError.USERNAME_ERROR);
      }

      return displayId;
    } catch (error) {
      if (error instanceof UserLiveError || error instanceof TikTokRecorderError) {
        throw error;
      }
      throw new TikTokRecorderError(TikTokError.USERNAME_ERROR);
    }
  }

  async getRoomAndUserFromUrl(liveUrl: string): Promise<[string, string]> {
    try {
      const response = await this.httpClient.req.get(liveUrl, {
        maxRedirects: 0,
        validateStatus: () => true
      });

      if (response.status === StatusCode.REDIRECT) {
        throw new UserLiveError(TikTokError.COUNTRY_BLACKLISTED);
      }

      let user: string;
      
      if (response.status === StatusCode.MOVED) { // MOBILE URL
        const matches = response.data.match(/com\/@(.*?)\/live/);
        if (!matches || matches.length < 2) {
          throw new LiveNotFound(TikTokError.INVALID_TIKTOK_LIVE_URL);
        }
        user = matches[1];
      } else {
        // https://www.tiktok.com/@<username>/live
        const match = liveUrl.match(/https?:\/\/(?:www\.)?tiktok\.com\/@([^\/]+)\/live/);
        if (!match) {
          throw new LiveNotFound(TikTokError.INVALID_TIKTOK_LIVE_URL);
        }
        user = match[1];
      }

      const roomId = await this.getRoomIdFromUser(user);
      return [user, roomId];
    } catch (error) {
      if (error instanceof UserLiveError || error instanceof LiveNotFound) {
        throw error;
      }
      throw new LiveNotFound(TikTokError.INVALID_TIKTOK_LIVE_URL);
    }
  }

  async getRoomIdFromUser(user: string): Promise<string> {
    try {
      const response = await this.httpClient.req.get(this.API_URL, {
        params: {
          uniqueId: user,
          sourceType: 54,
          aid: 1988
        }
      });

      if (response.status !== 200) {
        throw new UserLiveError(TikTokError.ROOM_ID_ERROR);
      }

      const data: UserRoomData = response.data;
      const roomId = data.data?.user?.roomId;
      
      if (!roomId) {
        throw new UserLiveError(TikTokError.ROOM_ID_ERROR);
      }

      return roomId;
    } catch (error) {
      if (error instanceof UserLiveError) {
        throw error;
      }
      throw new UserLiveError(TikTokError.ROOM_ID_ERROR);
    }
  }

  async getFollowersList(secUid: string): Promise<string[]> {
    const followers: string[] = [];
    let cursor = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = `${this.BASE_URL}/api/user/list/` +
          `?WebIdLastTime=1747672102&aid=1988&app_language=it-IT&app_name=tiktok_web` +
          `&browser_language=it-IT&browser_name=Mozilla&browser_online=true` +
          `&browser_platform=Linux%20x86_64&browser_version=5.0` +
          `&channel=tiktok_web&cookie_enabled=true&count=30&data_collection_enabled=true` +
          `&device_id=7506194516308166166&device_platform=web_pc&focus_state=true` +
          `&from_page=user&history_len=2&is_fullscreen=false&is_page_visible=true` +
          `&maxCursor=${cursor}&minCursor=${cursor}&odinId=7246312836442604570` +
          `&os=linux&priority_region=IT&referer=&region=IT&scene=21` +
          `&screen_height=1080&screen_width=1920&secUid=${secUid}` +
          `&tz_name=Europe%2FRome&user_is_login=true&webcast_language=it-IT` +
          `&msToken=&X-Bogus=&X-Gnarly=`;

        const response = await this.httpClient.req.get(url);

        if (response.status !== StatusCode.OK) {
          throw new TikTokRecorderError("Failed to retrieve followers list.");
        }

        const data: FollowersData = response.data;
        
        for (const user of data.userList || []) {
          const username = user.user?.uniqueId;
          if (username) {
            followers.push(username);
          }
        }

        hasMore = data.hasMore || false;
        const newCursor = data.minCursor || 0;

        if (newCursor === cursor) {
          break;
        }

        cursor = newCursor;
      } catch (error) {
        if (error instanceof TikTokRecorderError) {
          throw error;
        }
        throw new TikTokRecorderError("Failed to retrieve followers list.");
      }
    }

    if (followers.length === 0) {
      throw new TikTokRecorderError("Followers list is empty.");
    }

    return followers;
  }

  async getLiveUrl(roomId: string): Promise<string | null> {
    try {
      const response = await this.httpClient.req.get(
        `${this.WEBCAST_URL}/webcast/room/info/`,
        {
          params: { aid: 1988, room_id: roomId }
        }
      );

      const data: RoomInfo = response.data;

      if (JSON.stringify(data).includes('This account is private')) {
        throw new UserLiveError(TikTokError.ACCOUNT_PRIVATE);
      }

      const streamUrl = data.data?.stream_url;
      if (!streamUrl) {
        return null;
      }

      const sdkDataStr = streamUrl.live_core_sdk_data?.pull_data?.stream_data;
      if (!sdkDataStr) {
        logger.warning("No SDK stream data found. Falling back to legacy URLs. Consider contacting the developer to update the code.");
        return streamUrl.flv_pull_url?.FULL_HD1 ||
               streamUrl.flv_pull_url?.HD1 ||
               streamUrl.flv_pull_url?.SD2 ||
               streamUrl.flv_pull_url?.SD1 ||
               streamUrl.rtmp_pull_url ||
               null;
      }

      // Extract stream options
      const sdkData: StreamData = JSON.parse(sdkDataStr);
      const qualities = streamUrl.live_core_sdk_data?.pull_data?.options?.qualities || [];
      
      if (qualities.length === 0) {
        logger.warning("No qualities found in the stream data. Returning null.");
        return null;
      }

      const levelMap: Record<string, number> = {};
      qualities.forEach(q => {
        levelMap[q.sdk_key] = q.level;
      });

      let bestLevel = -1;
      let bestFlv: string | null = null;
      
      for (const [sdkKey, entry] of Object.entries(sdkData.data)) {
        const level = levelMap[sdkKey] || -1;
        const streamMain = entry.main;
        if (level > bestLevel && streamMain?.flv) {
          bestLevel = level;
          bestFlv = streamMain.flv;
        }
      }

      if (!bestFlv && data.status_code === 4003110) {
        throw new UserLiveError(TikTokError.LIVE_RESTRICTION);
      }

      return bestFlv;
    } catch (error) {
      if (error instanceof UserLiveError) {
        throw error;
      }
      return null;
    }
  }

  async* downloadLiveStream(liveUrl: string): AsyncGenerator<Buffer, void, unknown> {
    try {
      const response = await this.httpClient.reqStream.get(liveUrl, {
        responseType: 'stream'
      });

      for await (const chunk of response.data) {
        if (chunk) {
          yield chunk;
        }
      }
    } catch (error) {
      logger.error(`Error downloading stream: ${error}`);
      throw error;
    }
  }
}